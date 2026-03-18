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

## Architecture

This is a **GHRA (Greater Houston Retailers Cooperative Association) Membership Registration** React + Vite app. It's a 10-step multi-step form wizard with two user roles (member and employee) and PDF export.

### Backend

`server/index.js` is an Express API (CommonJS, port 3001) with JWT auth and SQL Server via `mssql`. It exposes:

- `POST /api/auth/signup` — member self-registration
- `POST /api/auth/login` — login for both members and employees (role returned in JWT)
- `POST /api/applications/draft` — upsert draft (called on every "Next" press)
- `POST /api/applications/submit` — finalize submission
- `GET  /api/applications/my` — member's own applications
- `GET  /api/applications/all` — all applications (employee only)
- `GET  /api/applications/:id` — single application
- `PATCH /api/applications/:id/status` — approve/reject (employee only)

Database config comes from environment variables (`DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `JWT_SECRET`). Schema is in `server/setup.sql` — two tables: `Users` and `Applications` (full `FormData` stored as a JSON blob in `NVARCHAR(MAX)`).

Employee accounts must be inserted directly in the database (no employee signup endpoint).

### Screen routing

`App.jsx` uses simple state-based routing (no React Router). The `screen` state determines which top-level component renders:

- `login` → `LoginPage`
- `dashboard` → `Dashboard` (member view)
- `employee-dashboard` → `EmployeeDashboard`
- `form` → `MembershipForm`
- `view` → `ViewApplication` (member)
- `employee-view` → `ViewApplication` (employee)

`App.jsx` also holds `draftData` (`{ applicationId, formData, currentStep }`) which is populated when resuming an in-progress application and passed to `MembershipForm` as initial props.

### State management

`src/context/AuthContext.jsx` is the central store. It holds the authenticated user, JWT token, and all API call functions. All API calls go through context methods (`saveDraft`, `saveApplication`, `getUserApplications`, etc.) which attach the Bearer token automatically.

### Multi-step form

`MembershipForm.jsx` orchestrates all 10 steps. It owns the entire `formData` state object (flat, ~60 fields plus nested `owners[]`, `bankAccounts[]`, `authorizedCardHolders[]`) and passes `formData` + handlers down to each step component in `src/components/steps/`. Step validation runs on "Next" — the form blocks navigation until the current step passes. Each "Next" also triggers `saveDraft` to persist progress to the backend.

Steps in order:
1. QualifyingBusiness — eligibility + product categories (min 7 required)
2. BusinessInformation — company name, EIN, authorized rep
3. StoreInformation — address, fuel, POS, food service, coolers
4. OwnersManagement — multiple owners (ownership % must sum to 100) + store manager
5. References — business references
6. AchAuthorization — up to 3 bank accounts, mapped to corporate/warehouse/fuels ACH types
7. WarehouseApplication — delivery options, card holders
8. Donations — AKDN and HFB contributions (optional, no validation)
9. DocumentUpload — file uploads (stored as base64 in formData, not yet persisted separately)
10. Agreements — final acknowledgement checkbox

### PDF export

`src/utils/pdfExport.js` generates a full HTML string from the application data and uses the browser print API to produce a PDF. Called from `ViewApplication.jsx`.

### Styling

Each major component has a dedicated CSS file in `src/styles/`. Step-specific styles live in `src/styles/steps/`.
