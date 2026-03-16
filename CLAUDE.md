# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173)
npm run build     # Production build to /dist
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

No test framework is configured.

## Architecture

This is a **GHRA (Greater Houston Retailers Cooperative Association) Membership Registration** React + Vite app. It's a 10-step multi-step form wizard with two user roles (member and employee) and PDF export.

### Screen routing

`App.jsx` uses simple state-based routing (no React Router). The `currentScreen` state determines which top-level component renders:

- `login` → `LoginPage`
- `dashboard` → `Dashboard` (member view)
- `employee-dashboard` → `EmployeeDashboard` (admin/reviewer)
- `membership-form` → `MembershipForm`
- `view-application` → `ViewApplication`

### State management

`src/context/AuthContext.jsx` is the central store. It holds:
- Authenticated user + role (`member` or `employee`)
- All application data (in-memory, lost on refresh — no backend yet)
- Dummy credentials for dev: members (`john@example.com`, `jane@example.com`, `demo@ghra.com`) and employees (`admin@ghra.com`, `reviewer@ghra.com`)

### Multi-step form

`MembershipForm.jsx` orchestrates all 10 steps. It owns the entire `formData` state object and passes `formData` + `updateFormData` down to each step component in `src/components/steps/`. Step validation runs on "Next" — the form blocks navigation until the current step passes.

Steps in order:
1. QualifyingBusiness — eligibility + product categories (min 7 required)
2. BusinessInformation — company name, EIN, authorized rep
3. StoreInformation — address, fuel, POS, food service, coolers
4. OwnersManagement — multiple owners + store manager
5. References — business references
6. AchAuthorization — up to 3 bank accounts
7. WarehouseApplication — delivery options, card holders
8. Donations — AKDN and HFB contributions (optional)
9. DocumentUpload — file uploads (not yet persisted)
10. Agreements — final acknowledgement

### PDF export

`src/utils/pdfExport.js` generates a full HTML string from the application data and uses the browser print API to produce a PDF. Called from `ViewApplication.jsx`.

### Styling

Each major component has a dedicated CSS file in `src/styles/`. Step-specific styles live in `src/styles/steps/`.
