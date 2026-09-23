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

---

## Environment Variables

### `server/.env` (backend — loaded with explicit `__dirname` path, never from CWD)

| Variable | Purpose |
|---|---|
| `DB_SERVER` | SQL Server hostname or IP |
| `DB_NAME` | Database name (currently `APIDB`) |
| `DB_USER` | SQL login username |
| `DB_PASSWORD` | SQL login password |
| `DB_PORT` | SQL Server port (default `1433`) |
| `PORT` | Express listen port (default `3001`) |
| `JWT_SECRET` | Signing secret for all JWTs (8 h expiry) |
| `SSN_ENCRYPTION_KEY` | 64 hex chars (32 bytes) for AES-256-GCM owner SSN encryption — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DROPBOX_SIGN_API_KEY` | Dropbox Sign API key; also used as HMAC key for webhook verification |
| `DS_TEMPLATE_ID` | Dropbox Sign template ID for the main membership signing flow |
| `DROPBOX_SIGN_REFERENCES_TEMPLATE_ID` | Dropbox Sign template ID for the references signing flow |
| `DS_TEST_MODE` | Set to `"true"` in dev/staging to use the DS sandbox; leave unset or `"false"` in production |
| `EMAIL_HOST` | SMTP host (optional — email silently skipped if unset) |
| `EMAIL_PORT` | SMTP port (default `587`) |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password |
| `EMAIL_FROM` | From address (falls back to `EMAIL_USER`) |

All variables in `REQUIRED_ENV` cause the server to hard-exit on startup if missing: `JWT_SECRET`, `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DROPBOX_SIGN_API_KEY`, `SSN_ENCRYPTION_KEY`, `DS_TEMPLATE_ID`, `DROPBOX_SIGN_REFERENCES_TEMPLATE_ID`.

> **Important:** `nodemon` does **not** reload `.env` on change. A full process restart is required for any `.env` edit to take effect.

### Root `.env` (frontend build-time — consumed by Vite)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | API origin baked into the JS bundle at build time. **Leave empty (`VITE_API_BASE_URL=`) for production** so all calls resolve to relative paths (`/api/...`) via the IIS reverse proxy. Set to `http://localhost:3001` for local dev only. Uses `??` (nullish coalescing) so an empty string is accepted as-is and does not fall back to the localhost default. |

---

## Architecture

This is a **GHRA (Greater Houston Retailers Cooperative Association) Membership Registration** React + Vite app. It is a 10-step form wizard with two roles (member and employee), Dropbox Sign integration, and PDF export.

### Backend

`server/index.js` is a single-file Express API (CommonJS, ~2,050 lines) with JWT auth, SQL Server via `mssql`, and Dropbox Sign via `@dropbox/sign`. All routes are registered in this file; there is no router or controller split.

#### Auth routes

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/auth/signup` | none | Member self-registration; minimum 6-char password |
| `POST` | `/api/auth/login` | none | Both roles; rate-limited (10 req / 15 min); returns JWT with `{ email, role, mustChangePassword, firstName, lastName }` |
| `POST` | `/api/auth/change-password` | JWT | Employee passwords require full complexity (see below); member passwords require ≥ 6 chars; clears `MustChangePassword` flag |
| `POST` | `/api/auth/create-member` | JWT, employee | Creates member account with `MustChangePassword=1`; accepts optional `firstName`/`lastName` |

#### Application routes

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/applications/draft` | JWT | Upsert draft; called on every Next press; runs `processOwnerSsnsForSave` before writing |
| `POST` | `/api/applications/submit` | JWT | Finalise submission; same SSN processing |
| `GET` | `/api/applications/my` | JWT | Member's own applications (no FormData) |
| `POST` | `/api/applications/sync-statuses` | JWT, employee | Pull live DS signer statuses into DB for all apps with a `SignatureRequestId` or `ReferencesSignatureRequestId` |
| `GET` | `/api/applications/last-board-signers` | JWT, employee | Returns board signer fields from the most recently approved/pending_signature/signed app that has them set; used to pre-fill the approval dialog |
| `GET` | `/api/applications/all` | JWT, employee | All applications; strips `FormData` from response but exposes `AuthRepFirstName`/`AuthRepLastName` from FormData; includes all board signer + signature status columns |
| `GET` | `/api/applications/:id` | JWT | Full application; employee or owning member; SSNs returned masked (`***-**-XXXX`) |
| `PATCH` | `/api/applications/:id/status` | JWT, employee | Approve or reject; approval triggers DS membership send + DS references send (non-fatal), stores board signer fields, sets status to `pending_signature`; rejection sets status directly; appends to `CommentsHistory`; fires email notification |
| `GET` | `/api/applications/:id/signature-status` | JWT, employee | Live DS signer statuses for member, board signers, and references |
| `POST` | `/api/applications/:id/resend/:target` | JWT, employee | Remind or redirect a signer; `target` one of `member`, `reference1`, `reference2`, `verification_board_signer`, `approved_board_signer`; body `{ email? }` — if email differs, calls DS `signatureRequestUpdate` to redirect |
| `PATCH` | `/api/applications/:id/board-signers` | JWT, employee | Update board signer names/emails after approval; calls DS `signatureRequestUpdate` if email changes and the signer hasn't yet signed |
| `PUT` | `/api/applications/:id` | JWT, employee | Employee direct edit of FormData |

#### Document routes

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/documents/upload` | JWT | Multer single-file upload; 10 MB limit; allowed extensions: `.pdf .doc .docx .jpg .jpeg .png .gif .bmp .webp`; caller must own the application; `applicationId` must be an integer (path-traversal guard); `docId` is `path.basename`-sanitised; stored at `server/UploadedDocuments/<appId>/<docId><ext>` |
| `DELETE` | `/api/documents/:applicationId/:docId` | JWT | Remove a file; ownership check; same sanitisation |
| `GET` | `/api/documents/:applicationId/:filename` | JWT | Authenticated download replacing the old static `/uploads` route; ownership check; returns 404 (not 403) to avoid enumeration |

#### Member account management (employee-only)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/employees/members` | List member accounts with `ApplicationCount` and latest `StoreName` |
| `POST` | `/api/employees/members` | Create member; accepts `firstName`/`lastName`; sets `MustChangePassword=1`; min 6-char password |
| `POST` | `/api/employees/members/:id/reset-password` | Reset member password; sets `MustChangePassword=1`; min 6-char password |
| `DELETE` | `/api/employees/members/:id` | Delete member; blocked if `ApplicationCount > 0` |

#### Employee account management (employee-only)

All routes below require `role === 'employee'`. Literal paths are registered before parametric ones to avoid ambiguity.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/employees` | List employee accounts including `FirstName`/`LastName` |
| `PATCH` | `/api/employees/:id/name` | Update employee `FirstName`/`LastName`; admin account allowed; `firstName` and `lastName` both required |
| `POST` | `/api/employees` | Create employee; `firstName`/`lastName` required; full password complexity enforced |
| `POST` | `/api/employees/:id/reset-password` | Reset employee password; blocked for `admin@ghraonline.com`; full complexity enforced; sets `MustChangePassword=1` |
| `DELETE` | `/api/employees/:id` | Delete employee; blocked for `admin@ghraonline.com` and self |

#### Webhooks

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/webhooks/dropbox-sign` | none (HMAC verified) | DS account-level callback; parses multipart `json` field; verifies HMAC-SHA256 using `DROPBOX_SIGN_API_KEY` before processing; handles `signature_request_signed` / `signature_request_all_signed` for both the membership request and the references request; always responds `200 Hello API Event Received` |

#### Other

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/test/dropbox-sign` | JWT, employee | Sends a test signature request with dummy form data; useful for verifying DS config |
| `POST` | `/api/ach/generate` | JWT, employee | Validate bank data, generate CSV, save to `AchBatches`, stamp `AchAuthorizationDate`. Returns 422 JSON on validation failure, CSV file on success. See **ACH File** section. |
| `GET` | `/api/ach/batches` | JWT, employee | List all batches — `Id, GeneratedAt, GeneratedBy, AppCount`. **`FileContent` excluded.** |
| `GET` | `/api/ach/batches/:id/file` | JWT, employee | Download stored CSV for a batch. Employee-only. |

---

## Database Schema

Database: `APIDB` (SQL Server). Schema baseline is in `server/setup.sql` — run once in SSMS. Additional columns are added at server startup via `ensureSchema()`, which wraps each `ALTER TABLE` in an `IF NOT EXISTS (SELECT 1 FROM sys.columns …)` guard so it is safe to run on every boot.

### Users

| Column | Type | Notes |
|---|---|---|
| `Id` | `INT IDENTITY PK` | |
| `Email` | `NVARCHAR(255) NOT NULL UNIQUE` | Stored lowercase |
| `PasswordHash` | `NVARCHAR(255)` | bcrypt, 10 rounds |
| `Role` | `NVARCHAR(20)` | `'member'` or `'employee'` |
| `MustChangePassword` | `BIT NOT NULL DEFAULT 0` | `1` forces change on next login (added by migration if missing) |
| `FirstName` | `NVARCHAR(100) NULL` | Added by migration; required for employees to appear correctly in DS documents |
| `LastName` | `NVARCHAR(100) NULL` | Added by migration |
| `CreatedAt` | `DATETIME DEFAULT GETDATE()` | |

### Applications

| Column | Type | Notes |
|---|---|---|
| `Id` | `INT IDENTITY PK` | |
| `UserEmail` | `NVARCHAR(255) FK → Users.Email` | |
| `StoreName` | `NVARCHAR(255)` | Extracted from FormData for display |
| `StoreAddress` | `NVARCHAR(500)` | Extracted from FormData for display |
| `Status` | `NVARCHAR(20)` | `draft` → `submitted` → `pending_signature` → `signed`; or `rejected` at any point after submit |
| `CurrentStep` | `INT` | Last step saved (1–10) |
| `FormData` | `NVARCHAR(MAX)` | Full JSON blob of the form; owner SSNs stored as AES-256-GCM ciphertext (`ssnEncrypted`), never plaintext |
| `Notes` | `NVARCHAR(MAX)` | Reviewer comments (latest only) |
| `CommentsHistory` | `NVARCHAR(MAX)` | JSON array: `{ status, comment, reviewedBy, reviewedAt }[]` (added by migration) |
| `ReviewedBy` | `NVARCHAR(255)` | Reviewing employee email |
| `ReviewedAt` | `DATETIME` | |
| `SignatureRequestId` | `NVARCHAR(255)` | DS membership request ID (added by migration) |
| `SignedAt` | `DATETIME` | When the Authorized Rep signed (added by migration) |
| `ReferencesSignatureRequestId` | `NVARCHAR(255)` | DS references request ID (added by migration) |
| `ReferencesSignatureStatus` | `NVARCHAR(50)` | Aggregate: `sent` / `signed` (added by migration) |
| `ReferencesSignedAt` | `DATETIME` | (added by migration) |
| `Ref1SignatureId` | `NVARCHAR(255)` | DS signatureId for Reference 1 (added by migration) |
| `Ref2SignatureId` | `NVARCHAR(255)` | DS signatureId for Reference 2 (added by migration) |
| `Ref1SignatureStatus` | `NVARCHAR(50)` | Per-signer DS statusCode (added by migration) |
| `Ref2SignatureStatus` | `NVARCHAR(50)` | (added by migration) |
| `BoardSignerVerificationFirstName` | `NVARCHAR(100)` | Captured at approval (added by migration) |
| `BoardSignerVerificationLastName` | `NVARCHAR(100)` | (added by migration) |
| `BoardSignerVerificationEmail` | `NVARCHAR(255)` | (added by migration) |
| `VerificationSignatureId` | `NVARCHAR(255)` | DS signatureId (added by migration) |
| `VerificationSignatureStatus` | `NVARCHAR(50)` | DS statusCode (added by migration) |
| `VerificationSignedAt` | `DATETIME` | (added by migration) |
| `BoardSignerApprovedFirstName` | `NVARCHAR(100)` | (added by migration) |
| `BoardSignerApprovedLastName` | `NVARCHAR(100)` | (added by migration) |
| `BoardSignerApprovedEmail` | `NVARCHAR(255)` | (added by migration) |
| `ApprovedSignatureId` | `NVARCHAR(255)` | (added by migration) |
| `ApprovedSignatureStatus` | `NVARCHAR(50)` | (added by migration) |
| `ApprovedSignedAt` | `DATETIME` | (added by migration) |
| `CreatedAt` | `DATETIME DEFAULT GETDATE()` | |
| `UpdatedAt` | `DATETIME` | |

### AchBatches

Created by `ensureSchema()` on first boot (uses `IF NOT EXISTS` on `sys.tables`).

| Column | Type | Notes |
|---|---|---|
| `Id` | `INT IDENTITY PK` | |
| `GeneratedAt` | `DATETIME NOT NULL DEFAULT GETDATE()` | |
| `GeneratedBy` | `NVARCHAR(255) NOT NULL` | Employee email |
| `AppCount` | `INT NOT NULL` | Number of applications in this batch |
| `FileContent` | `NVARCHAR(MAX) NOT NULL` | **⚠ SENSITIVE — employee-only.** Contains unencrypted bank routing and account numbers for all applications in the batch. Never returned by `GET /api/ach/batches`; only returned by `GET /api/ach/batches/:id/file` (employee role required). Consider encrypting with the existing AES-256-GCM helpers if the DB is shared or externally accessible. |

### Password reset (manual)
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('NewPass123', 10).then(h => console.log(h))"
```
```sql
UPDATE Users SET PasswordHash = '<hash>' WHERE Email = 'user@email.com'
```

---

## React Router Routes

`App.jsx` uses React Router v7 (`createBrowserRouter` / `RouterProvider`). There is no state-based routing.

| Path | Component | Guard | Notes |
|---|---|---|---|
| `/` | `RootRedirect` | none | Redirects to `/dashboard` or `/employee` based on role |
| `/login` | `LoginPage` | none | |
| `/change-password` | `ChangePasswordPage` | `ChangePasswordRoute` | Only accessible when `mustChangePassword=true` |
| `/dashboard` | `Dashboard` | `member` | Member home; lists applications |
| `/employee` | `EmployeeDashboard` | `employee` | Employee home; 3 tabs (below) |
| `/application/new/step/1` | `MembershipForm` | `member` | New application |
| `/application/:id/step/:step` | `MembershipForm` | `member` | Continue/resume draft |
| `/application/:id` | `ViewApplication` | `member` | Member read-only view |
| `/employee/application/:id` | `ViewApplication` | `employee` | Employee view with Edit button |
| `/employee/application/:id/edit/step/:step` | `MembershipForm` | `employee` | Employee direct edit (`isEmployeeEdit=true`) |
| `*` | redirect | none | Falls through to `/login` |

---

## Multi-Step Form

`MembershipForm.jsx` orchestrates all 10 steps. It owns the entire `formData` state object (flat ~60+ scalar fields plus nested arrays: `owners[]`, `bankAccounts[]`, `authorizedCardHolders[]`) and passes `formData` + handlers down to each step component in `src/components/steps/`.

Step validation runs on "Next" — navigation is blocked until the current step passes. Each "Next" also calls `saveDraft` to persist progress. When `isEmployeeEdit=true`, a "Save Changes" button is shown instead of the normal submit flow, calling `PUT /api/applications/:id`.

### GHRA Fuels condition

```js
// src/utils/fuelUtils.js
export function ghraFuelsApplies(formData) {
  return formData.businessType !== 'without-fuel'
    && formData.fuelAvailable === 'unbranded'
    && formData.ghraFuelOptIn !== false
}
```

This condition gates: owner SSN collection and validation (step 4), the Fuels ACH checkbox option (step 6), and the Fuels DS custom field population at approval time.

### US State Dropdown

All state fields use the shared `StateSelect` component (`src/components/StateSelect.jsx`), backed by `src/utils/usStates.js` (50 states + DC, sorted alphabetically). The field stores the 2-letter code and displays the full name. `ViewApplication.jsx` and `pdfExport.js` both translate codes to full names via the same `US_STATES` array. Existing saved free-text values (from before this conversion) display as-is.

### Steps

| # | Title | Component | Key validation |
|---|---|---|---|
| 1 | Qualifying Business | `QualifyingBusinessStep` | `hardLiquor`, `ageRequirement`, `closedSundayAfter9pm` answered; minimum **7** product categories selected |
| 2 | Business Information | `BusinessInformationStep` | `memberName`, `ein`, `salesTaxId` required; Auth Rep first name, last name, **city, state, zip** (format `DDDDD` or `DDDDD-DDDD`), and **county** all required; ownership type radio; business type radio |
| 3 | Store Information | `StoreInformationStep` | Store address (street, city, state, zip, county) and mailing address (same fields) required; email required; fuel fields required when `businessType !== 'without-fuel'`; POS fields required; food service fields required; cooler/freezer/beer-cave required |
| 4 | Owners & Management | `OwnersManagementStep` | Ownership % must sum to exactly 100%; store manager first/last name required; owner SSNs required when `ghraFuelsApplies`; first owner pre-filled from Auth Rep name |
| 5 | References | `ReferencesStep` | Both references: email, company, GHRA #, rep name — all 4 fields required for each |
| 6 | ACH Authorization | `AchAuthorizationStep` | If any ACH type is checked and mapped to a bank account: bank name, routing number, account number required; up to 3 bank accounts; state field uses `StateSelect` |
| 7 | Warehouse Application | `WarehouseApplicationStep` | No required fields; delivery checkbox; authorized card holders list |
| 8 | Donations | `DonationsStep` | No validation; AKDN and Houston Food Bank optional contribution fields |
| 9 | Documents | `DocumentUploadStep` | Driver license copies (per-owner if multiple owners, single otherwise), sales tax permit, articles of incorporation, IRS document, and **void check** all required |
| 10 | Agreements | `AgreementsStep` | All **7** checkboxes required: membership agreement, requirements to be a member, financial/rebate consent, **annual $400 membership fee agreement**, acknowledgement, authorization consent, indemnification consent |

> `FinancialInformationStep.jsx` exists in `src/components/steps/` but is not wired into the form step list.

---

## Dropbox Sign Integration

### Membership signing flow (template `DS_TEMPLATE_ID`)

Three signers, in document-defined order:
1. **Authorized Rep** (role: `"Authorized Rep"`) — the member applicant; email is the member's account email
2. **Verification: Elected Board Signer** — entered by the employee at approval time
3. **Approved: Elected Board Signer** — entered by the employee at approval time

The Approved board signer cannot receive a reminder until the Verification signer has signed (`VerificationSignedAt` must be non-null).

Custom fields populated at approval time:
- `StaffFirstName` / `StaffLastName` — the approving employee's name (from JWT claims; a `console.warn` fires if these are blank — fix by editing the employee name in Employee Accounts)
- `DateApproved` — ISO `YYYY-MM-DD` format
- `VerificationFirstName` / `VerificationLastName` / `ApprovedFirstName` / `ApprovedLastName` — board signer names
- All member form fields (address, bank accounts, owners, ACH, etc.) — see the mapping in `server/index.js`

> **Sender identity:** Signing requests appear from the account that owns the `DROPBOX_SIGN_API_KEY`, not the approving employee. The employee's email appears in the request message only.

### References signing flow (template `DROPBOX_SIGN_REFERENCES_TEMPLATE_ID`)

Sent simultaneously with the membership request at approval time. Two signers: `"Reference 1 - Membership Application"` and `"Reference 2 - Membership Application"`. Fields populated via `server/dropboxSignMapping.js`. Non-fatal — a failure here does not roll back the approval.

### Board signer pre-fill

`GET /api/applications/last-board-signers` returns the board signer fields from the most recently approved application that has them populated. The approval dialog uses this to pre-fill the form so employees don't re-enter the same signers each time.

### Board signer update after approval

`PATCH /api/applications/:id/board-signers` can update signer names/emails after approval. If an email changes and the signer hasn't yet signed, it calls DS `signatureRequestUpdate` to redirect the signing email to the new address.

### Resend / redirect targets

`POST /api/applications/:id/resend/:target` with `target` one of:
- `member`
- `reference1`
- `reference2`
- `verification_board_signer`
- `approved_board_signer`

Providing a `{ email }` body redirects the request to a new email address via DS `signatureRequestUpdate`.

### Webhook

`POST /api/webhooks/dropbox-sign` verifies the HMAC-SHA256 signature using `DROPBOX_SIGN_API_KEY` as the key and `event_time + event_type` as the message before processing any event. On `signature_request_signed` or `signature_request_all_signed`, it fetches the live signer state from DS (not from the webhook payload) and updates the relevant per-signer status columns. Always responds `200 Hello API Event Received`.

---

## Auth & Security

- **JWT** — 8-hour expiry; payload: `{ email, role, mustChangePassword, firstName, lastName }`. Tokens stored in `localStorage`. The `authMiddleware` enforces `mustChangePassword` server-side: any route other than `/api/auth/change-password` returns 403 until the flag is cleared.
- **Role enforcement** — employee-only routes check `req.user.role !== 'employee'` inline and return 403.
- **Resource ownership** — `canAccessApplication(db, appId, user)` enforces that members can only access their own applications; employees can access any.
- **Admin protection** — `ADMIN_EMAIL = 'admin@ghraonline.com'` is hardcoded. Password reset and deletion are blocked at 403 for this account at both server and UI level.
- **Employee password complexity** — 8+ chars, uppercase, lowercase, number, and special character. Enforced on `POST /api/employees` (create), `POST /api/employees/:id/reset-password`, and `POST /api/auth/change-password` (employee role branch). Members use a 6-char minimum only.
- **Login rate limiting** — `express-rate-limit`: 10 requests per 15-minute window on `POST /api/auth/login`.
- **Helmet** — enabled on all responses with `crossOriginResourcePolicy: 'cross-origin'` (required for the JSON API / frontend split).
- **Parameterised queries** — all DB queries use `mssql` `.input()` bindings; no string interpolation of user input.
- **SSN encryption** — AES-256-GCM (`ssnEncrypt` / `ssnDecrypt`); ciphertext stored as `ssnEncrypted` in the FormData JSON. The raw `ssn` field is never written to the DB. `maskOwnerSsns` replaces `ssnEncrypted` with `***-**-XXXX` on every read response.
- **Path traversal sanitisation** — document upload/download/delete: `applicationId` is parsed as integer; `docId`/`filename` is passed through `path.basename()` before use.
- **Authenticated document serving** — `/uploads` is not served as a static directory; all file access goes through `GET /api/documents/:applicationId/:filename`, which enforces ownership and returns 404 (not 403) on non-owned files to avoid enumeration.
- **Webhook HMAC** — Dropbox Sign webhook validates the event hash before processing; silently ACKs invalid events.
- **PDF XSS escaping** — `pdfExport.js` HTML-escapes all user-supplied values via an `esc()` helper before interpolating into the HTML template.
- **CORS** — `origin: /^http:\/\/(localhost|ghra-memb)(:\d+)?$/`; allows any port on `localhost` (for Vite port collisions) and the production internal hostname.

---

## State Management

`src/context/AuthContext.jsx` is the central store. It holds the authenticated user, JWT token, and all API call functions. All API calls attach `Authorization: Bearer <token>` automatically.

Context value keys: `isAuthenticated`, `currentUser`, `error`, `login`, `signup`, `employeeLogin`, `logout`, `saveDraft`, `saveApplication`, `getUserApplications`, `getApplicationById`, `getAllApplications`, `updateApplicationStatus`, `updateBoardSigners`, `employeeUpdateApplication`, `getLastBoardSigners`, `syncSignatureStatuses`, `getSignatureStatus`, `resendSignature`, `changePassword`, `createMember`, `uploadDocument`, `removeDocument`, `openDocument`, `testDropboxSign`, `createMemberAccount`, `resetMemberPassword`, `getMembers`, `deleteMember`, `deleteEmployee`, `getEmployees`, `createEmployeeAccount`, `resetEmployeePassword`, `updateEmployeeName`

`resolveDocumentUrl(storedUrl)` is exported as a standalone helper; it converts a stored `/uploads/<appId>/<file>` path to the authenticated `/api/documents/<appId>/<file>` endpoint on the correct host.

---

## EmployeeDashboard Tabs

`EmployeeDashboard` has three tabs (internal `activeTab` state — not React Router routes):
- **All Applications** — full application list; approve/reject with board-signer entry; signature status panel; sync button; row selection for ACH file generation
- **Members** — member account management: list, create, reset password, delete; members with existing applications cannot be deleted
- **Employee Accounts** — employee account management: list with inline name editing, create, reset password, delete; admin account and self are protected
- **ACH History** — list of generated ACH batches; each row has a Download CSV button to re-download via `GET /api/ach/batches/:id/file`

---

## Styling / Design System

`src/index.css` defines GHRA brand tokens as CSS custom properties — the single source of truth for colour:

| Token | Value | Usage |
|---|---|---|
| `--ghra-red` | `#C8102E` | Primary accent, buttons, active states |
| `--ghra-navy` | `#1B2A5B` | Headers, progress indicator |
| `--ghra-slate` | `#2C3E50` | Body text |
| `--ghra-mist` | `#F2F4F8` | Page/section backgrounds |
| `--ghra-line` | `#DDE2EC` | Borders and dividers |
| `--ghra-white` | `#FFFFFF` | Card backgrounds |
| `--ghra-muted` | `#6B7A99` | Secondary/placeholder text |

Each major component has a dedicated CSS file in `src/styles/`. Step-specific styles live in `src/styles/steps/`. Components reference the tokens via `var(--ghra-*)` rather than hardcoding hex values.

---

## PDF Export

`src/utils/pdfExport.js` generates a full HTML string from the application's `fullData` blob, HTML-escaping all values via `esc()`, then opens it in a new window and calls `window.print()`. All state codes are translated to full names using the shared `US_STATES` array. Falls back to a file download if the popup is blocked.

---

## ACH File

### File layout

Comma-delimited (`.csv`), UTF-8, CRLF line endings, header row, no footer. Values containing commas or double-quotes are RFC 4180-quoted; CR/LF inside values are replaced with a space.

| Column | Source |
|---|---|
| `GHRA#` | `Applications.GhraNumber` |
| `Member Name` | `FormData.memberName` |
| `Authorized Representative Name` | `FormData.authorizedRepFirstName` + `authorizedRepLastName` |
| `Bank Name` | Corporate ACH bank account `bankName` |
| `Routing Number` | Corporate ACH bank account `transitAbaNumber` (9 clean digits) |
| `Account Number` | Corporate ACH bank account `accountNumber` (digits only, spaces/hyphens stripped) |
| `Amount` | `400.00` (hardcoded) |

### Bank account selection rule

The corporate ACH account is used: `formData.achInfoFor.corporate === true` and `formData.achToBankMapping.corporate` resolves to a bank account in `formData.bankAccounts[]`. If corporate ACH is not set up the application is rejected with a 422 error.

### Validation (server-side, 422 returned if any app fails)

- `achInfoFor.corporate` must be `true`; bank account must exist in `bankAccounts[]`
- Bank name, routing number, and account number must all be present
- Routing number: exactly 9 digits after stripping non-digits; ABA checksum `(3(d1+d4+d7) + 7(d2+d5+d8) + (d3+d6+d9)) mod 10 === 0`
- Account number: digits only after stripping spaces/hyphens; 4–17 digits

### Security

- Routing and account numbers are **never logged**, even on error. If debugging, mask to last 4 digits.
- Error messages to the browser say "Routing number is invalid" — they never echo the value.
- `AchBatches.FileContent` holds unencrypted bank details. `GET /api/ach/batches` excludes it. Only `GET /api/ach/batches/:id/file` returns it, and only to employees.
- **Encryption recommendation:** encrypt `FileContent` at rest with the existing AES-256-GCM helpers (`ssnEncrypt`/`ssnDecrypt` + `SSN_ENCRYPTION_KEY`) the same way owner SSNs are handled. Not yet implemented.

### Manual test checklist

- [ ] Application with a valid single corporate bank account → CSV downloads, ACH date stamped, batch appears in ACH History
- [ ] Application where `achInfoFor.corporate` is false → 422 "No corporate ACH account" error shown, nothing generated
- [ ] Application with a missing routing number → 422 "Routing number is missing"
- [ ] Application with a routing number that fails the ABA checksum → 422 "ABA checksum failed"
- [ ] Application with a routing number that is not 9 digits → 422 "must be exactly 9 digits"
- [ ] Application with a non-digit account number → 422 "must contain digits only"
- [ ] Application with multiple bank accounts, corporate ACH mapped correctly → uses that account, no ambiguity error
- [ ] Mix of valid and invalid apps selected → 422 lists each failing store by name; no file generated, no dates stamped
- [ ] ACH History tab: batches appear in reverse-chronological order; Download CSV re-downloads the original file

---

## Deployment

### Production (IIS on `ghra-memb`)

- **Frontend**: `dist/` (output of `npm run build`) is served as static files by IIS over HTTPS. The Vite build bakes `VITE_API_BASE_URL` into the JS bundle at build time — **this value must be empty** (`VITE_API_BASE_URL=`) so all `/api/...` and `/api/documents/...` calls resolve as relative URLs through the IIS reverse proxy.
- **API**: Node runs on `localhost:3001`. IIS rewrites `/api/*` and any upload-serving requests to `http://localhost:3001` via ARR + URL Rewrite (`web.config` on the server — not in the repo).
- **`web.config`** is managed on the server only; it is not committed to this repository.

After rebuilding the frontend:
1. Copy the new `dist/` contents to the IIS web root, replacing all files but keeping `web.config`.
2. Hard-refresh in the browser (`Ctrl+F5`) — the old bundle is cached.

### Local development

Two processes run in parallel:
```bash
# Terminal 1 — backend
cd server && npm run dev   # http://localhost:3001

# Terminal 2 — frontend
npm run dev                # http://localhost:5173
```

CORS allows any `localhost:*` port. `VITE_API_BASE_URL` in the root `.env` should be set to `http://localhost:3001` for local dev (or use `npm run dev`'s Vite proxy if configured).

> **Stale process gotcha**: if port 3001 appears already in use, a previous `node` process may still be running. Kill it explicitly before starting `npm run dev`.
