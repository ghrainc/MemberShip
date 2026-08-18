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

# Required for owner SSN encryption (AES-256-GCM). Generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SSN_ENCRYPTION_KEY=

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
- `POST /api/applications/sync-statuses` — sync Dropbox Sign statuses for all pending-signature apps
- `GET  /api/applications/:id/signature-status` — get Dropbox Sign status for a single application
- `POST /api/applications/:id/resend/:target` — resend signature request to `member` or `employee` target

**Documents**
- `POST /api/documents/upload` — upload a file (PDF, Word, image); stored in `server/UploadedDocuments/<applicationId>/`
- `DELETE /api/documents/:applicationId/:docId` — remove an uploaded file

**Employee management** (all employee-role only; literal routes registered before parametric)
- `GET  /api/employees/members` — list all member accounts with ApplicationCount and StoreName
- `POST /api/employees/members` — create member account (sets `MustChangePassword=1`)
- `POST /api/employees/members/:id/reset-password` — reset member password (sets `MustChangePassword=1`)
- `DELETE /api/employees/members/:id` — delete member; blocked if ApplicationCount > 0 (FK constraint)
- `GET  /api/employees` — list all employee accounts
- `POST /api/employees` — create employee account (sets `MustChangePassword=1`)
- `POST /api/employees/:id/reset-password` — reset employee password; blocked for `admin@ghraonline.com`
- `DELETE /api/employees/:id` — delete employee; blocked for `admin@ghraonline.com` and self

**Webhooks**
- `POST /api/webhooks/dropbox-sign` — Dropbox Sign account-level callback (no JWT); parses multipart `json` field; handles `signature_request_signed` / `signature_request_all_signed` to flip status to `signed`; always responds `200 Hello API Event Received`

**Admin protection**
`ADMIN_EMAIL = 'admin@ghraonline.com'` constant in `server/index.js`. This account is blocked from password reset and deletion at both server (403) and UI level (controls hidden, "protected" badge shown).

Database config comes from environment variables. Schema is in `server/setup.sql` — two tables: `Users` and `Applications`.

Two runtime migrations run on startup (`ensureSchema`):
- Adds `MustChangePassword BIT` to `Users` if missing
- Adds `CommentsHistory NVARCHAR(MAX)` to `Applications` if missing

Employee accounts are created via `POST /api/employees` (employee-only endpoint) or inserted directly in the database. There is no public employee signup.

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

`App.jsx` uses **React Router v7** (`createBrowserRouter` / `RouterProvider`) — NOT state-based routing.

| Route | Component | Notes |
|---|---|---|
| `/login` | `LoginPage` | |
| `/change-password` | `ChangePasswordPage` | Forced when `MustChangePassword=1` after login |
| `/dashboard` | `Dashboard` | Member view |
| `/employee-dashboard` | `EmployeeDashboard` | |
| `/form` | `MembershipForm` | Member new/continue application |
| `/view` | `ViewApplication` | Member read-only view |
| `/employee-view` | `ViewApplication` | Employee view with Edit button |
| `/employee-edit` | `MembershipForm` | Employee direct edit (`isEmployeeEdit=true`) |

`draftData` (`{ applicationId, formData, currentStep, notes, reviewedBy, reviewedAt, commentsHistory }`) is populated when resuming or editing an application and passed to `MembershipForm` as initial props.

### State management

`src/context/AuthContext.jsx` is the central store. It holds the authenticated user, JWT token, and all API call functions. All API calls go through context methods which attach the Bearer token automatically.

Context methods: `login`, `employeeLogin`, `signup`, `logout`, `changePassword`, `createMember`, `saveDraft`, `saveApplication`, `getUserApplications`, `getApplicationById`, `getAllApplications`, `updateApplicationStatus`, `employeeUpdateApplication`, `uploadDocument`, `removeDocument`, `syncSignatureStatuses`, `getSignatureStatus`, `resendSignature`, `testDropboxSign`, `createMemberAccount`, `resetMemberPassword`, `getMembers`, `deleteMember`, `getEmployees`, `createEmployeeAccount`, `resetEmployeePassword`, `deleteEmployee`

### Multi-step form

`MembershipForm.jsx` orchestrates all 10 steps. It owns the entire `formData` state object (flat, ~60+ fields plus nested `owners[]`, `bankAccounts[]`, `authorizedCardHolders[]`) and passes `formData` + handlers down to each step component in `src/components/steps/`. Step validation runs on "Next" — the form blocks navigation until the current step passes. Each "Next" also triggers `saveDraft` to persist progress to the backend.

When `isEmployeeEdit=true`, the form shows a "Save Changes" button instead of the normal submit flow, calling `onEmployeeSave` (which calls `PUT /api/applications/:id`).

Steps in order:
1. **QualifyingBusiness** — eligibility + product categories (min 7 required)
2. **BusinessInformation** — company name, EIN, authorized rep
3. **StoreInformation** — address, fuel, POS, food service, coolers
4. **OwnersManagement** — multiple owners (ownership % must sum to 100) + store manager
5. **References** — two GHRA member references; all 8 fields required (email, company, GHRA #, rep name × 2)
6. **AchAuthorization** — up to 3 bank accounts, mapped to corporate/warehouse/fuels ACH types
7. **WarehouseApplication** — delivery options, card holders
8. **Donations** — AKDN and HFB contributions (optional, no validation)
9. **DocumentUpload** — file uploads via `POST /api/documents/upload`; stored in `server/UploadedDocuments/`
10. **Agreements** — 3 document checkboxes + 3 final acknowledgement checkboxes; all 6 required to submit

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

### EmployeeDashboard tabs

`EmployeeDashboard` has two tabs (internal `activeTab` state, not React Router routes):
- **All Applications** — full application list with status, approve/reject, signature management
- **Members** — all member account management: list, create, reset password, delete; members with existing applications cannot be deleted (FK constraint)

The **Employee Accounts** modal (opened via header button) manages employee logins inline: list, create, reset password, delete. Admin account (`admin@ghraonline.com`) and the current user's own account are protected from reset/delete.
