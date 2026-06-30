# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (React + Vite)
```bash
npm run dev       # Start Vite dev server (http://localhost:5173)
npm run build     # Production build to /dist
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Backend (Express + SQL Server)
```bash
cd server
npm start         # Start API server on http://localhost:3001
npm run dev       # Start with nodemon (auto-restart)
```

No test framework is configured.

## Environment Setup

Create `server/.env` with:
```
DB_SERVER=your_server
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
DB_PORT=1433
JWT_SECRET=your_secret

# Optional — email notifications on status change
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
```

CORS is configured to allow any `localhost` port (e.g. 5173, 5174), so Vite port collisions won't break the app.

## Architecture

This is a **GHRA (Greater Houston Retailers Cooperative Association) Membership Registration** React + Vite app. It's a 10-step multi-step form wizard with two user roles (member and employee) and PDF export.

### Backend

`server/index.js` is an Express API (CommonJS, port 3001) with JWT auth and SQL Server via `mssql`. It exposes:

**Auth**
- `POST /api/auth/signup` — member self-registration
- `POST /api/auth/login` — login for both members and employees (role returned in JWT)
- `POST /api/auth/change-password` — authenticated member changes their own password
- `POST /api/auth/create-member` — employee creates a new member account (sets `MustChangePassword=1`)

**Applications**
- `POST /api/applications/draft` — upsert draft (called on every "Next" press)
- `POST /api/applications/submit` — finalize submission
- `GET  /api/applications/my` — member's own applications
- `GET  /api/applications/all` — all applications (employee only); strips FormData, exposes AuthRep name fields
- `GET  /api/applications/:id` — single application (full FormData + CommentsHistory parsed)
- `PATCH /api/applications/:id/status` — approve/reject (employee only); appends to CommentsHistory; triggers email notification
- `PUT  /api/applications/:id` — employee edits application form data directly

**Documents**
- `POST /api/documents/upload` — upload a file (PDF, Word, image); stored in `server/UploadedDocuments/<applicationId>/`
- `DELETE /api/documents/:applicationId/:docId` — remove an uploaded file

**Webhooks**
- `POST /api/webhooks/dropbox-sign` — Dropbox Sign account-level callback (no JWT); parses multipart `json` field; handles `signature_request_signed` / `signature_request_all_signed` to flip status to `signed`; always responds `200 Hello API Event Received`

Database config comes from environment variables. Schema is in `server/setup.sql` — two tables: `Users` and `Applications`.

Two runtime migrations run on startup (`ensureSchema`):
- Adds `MustChangePassword BIT` to `Users` if missing
- Adds `CommentsHistory NVARCHAR(MAX)` to `Applications` if missing

Employee accounts must be inserted directly in the database or created by an employee via `POST /api/auth/create-member`. There is no public employee signup.

### Database schema

**Users** — `Id`, `Email`, `PasswordHash`, `Role` (member|employee), `MustChangePassword` (BIT), `CreatedAt`

**Applications** — `Id`, `UserEmail`, `StoreName`, `StoreAddress`, `Status` (draft|submitted|approved|rejected|pending_signature|signed), `CurrentStep`, `FormData` (JSON blob, NVARCHAR MAX), `Notes`, `CommentsHistory` (JSON array), `ReviewedBy`, `ReviewedAt`, `SignatureRequestId` (NVARCHAR 255), `SignedAt` (DATETIME), `CreatedAt`, `UpdatedAt`

### Password reset (admin)

Generate a bcrypt hash for any password and UPDATE directly in the DB:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('NewPass123', 10).then(h => console.log(h))"
```
```sql
UPDATE Users SET PasswordHash = '<hash>' WHERE Email = 'user@email.com'
```

### Screen routing

`App.jsx` uses simple state-based routing (no React Router). The `screen` state determines which top-level component renders:

| Screen | Component | Notes |
|---|---|---|
| `login` | `LoginPage` | |
| `change-password` | `ChangePasswordPage` | Forced when `MustChangePassword=1` after login |
| `dashboard` | `Dashboard` | Member view |
| `employee-dashboard` | `EmployeeDashboard` | |
| `form` | `MembershipForm` | Member new/continue application |
| `view` | `ViewApplication` | Member read-only view |
| `employee-view` | `ViewApplication` | Employee view with Edit button |
| `employee-edit` | `MembershipForm` | Employee direct edit (`isEmployeeEdit=true`) |

`App.jsx` also holds `draftData` (`{ applicationId, formData, currentStep, notes, reviewedBy, reviewedAt, commentsHistory }`) which is populated when resuming or editing an application and passed to `MembershipForm` as initial props.

### State management

`src/context/AuthContext.jsx` is the central store. It holds the authenticated user, JWT token, and all API call functions. All API calls go through context methods which attach the Bearer token automatically.

Context methods: `login`, `employeeLogin`, `signup`, `logout`, `changePassword`, `createMember`, `saveDraft`, `saveApplication`, `getUserApplications`, `getApplicationById`, `getAllApplications`, `updateApplicationStatus`, `employeeUpdateApplication`, `uploadDocument`, `removeDocument`

### Multi-step form

`MembershipForm.jsx` orchestrates all 10 steps. It owns the entire `formData` state object (flat, ~60+ fields plus nested `owners[]`, `bankAccounts[]`, `authorizedCardHolders[]`) and passes `formData` + handlers down to each step component in `src/components/steps/`. Step validation runs on "Next" — the form blocks navigation until the current step passes. Each "Next" also triggers `saveDraft` to persist progress to the backend.

When `isEmployeeEdit=true`, the form shows a "Save Changes" button instead of the normal submit flow, calling `onEmployeeSave` (which calls `PUT /api/applications/:id`).

Steps in order:
1. **QualifyingBusiness** — eligibility + product categories (min 7 required)
2. **BusinessInformation** — company name, EIN, authorized rep
3. **StoreInformation** — address, fuel, POS, food service, coolers
4. **OwnersManagement** — multiple owners (ownership % must sum to 100) + store manager
5. **References** — business references
6. **AchAuthorization** — up to 3 bank accounts, mapped to corporate/warehouse/fuels ACH types
7. **WarehouseApplication** — delivery options, card holders
8. **Donations** — AKDN and HFB contributions (optional, no validation)
9. **DocumentUpload** — file uploads via `POST /api/documents/upload`; stored in `server/UploadedDocuments/`
10. **Agreements** — final acknowledgement checkbox

> `FinancialInformationStep.jsx` exists in `src/components/steps/` but is not currently included in the form step list.

### PDF export

`src/utils/pdfExport.js` generates a full HTML string from the application data and uses the browser print API to produce a PDF. Called from `ViewApplication.jsx`.

### Email notifications

`sendStatusEmail()` in `server/index.js` fires on `PATCH /api/applications/:id/status`. It is silently skipped if `nodemailer` is not installed or `EMAIL_HOST` is not set.

### Styling

Each major component has a dedicated CSS file in `src/styles/`. Step-specific styles live in `src/styles/steps/`.

Key components and their CSS:
- `LoginPage` / `AuthForm` / `PasswordInput` — auth flow
- `Dashboard` / `EmployeeDashboard` — role-specific home screens
- `MembershipForm` / `ProgressIndicator` — form shell and step nav
- `ViewApplication` — read-only application view with PDF export
- `ApprovalDialog` — employee approve/reject modal with notes
- `ChangePasswordPage` — forced password change after first login
