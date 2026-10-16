// Canonical labels, descriptions, and routes for the three GHRA application programs.
// Import this in both LandingPage and NewApplicationModal so wording can't drift.

export const PROGRAMS = [
  {
    id: 'membership',
    label: 'GHRA Membership',
    tagline: 'includes Fuels and Warehouse',
    landingDescription:
      'Full cooperative membership for independent Houston-area retailers. Covers wholesale purchasing, the GHRA Fuels program for unbranded fuel operations, and warehouse ordering — all under one application.',
    dashboardDescription:
      'The full cooperative membership application. Includes wholesale purchasing, the Fuels program, and warehouse access.',
    note: null,
    applyLabel: 'Apply for Membership',
    signupPath: '/signup?via=membership',
    newPath: '/application/new/step/1',
  },
  {
    id: 'fuels',
    label: 'GHRA Fuels',
    tagline: 'fuels program only',
    landingDescription:
      'Credit and supply agreement program for retailers with unbranded fuel operations. Apply separately from full GHRA Membership — no membership is required to participate.',
    dashboardDescription:
      'The standalone Fuels credit and supply agreement application for unbranded fuel operations.',
    note: 'GHRA Membership is not required.',
    applyLabel: 'Apply for Fuels',
    signupPath: '/signup?via=fuels',
    newPath: '/fuels-application/new',
  },
  {
    id: 'warehouse',
    label: 'GHRA Warehouse',
    tagline: 'warehouse program only',
    landingDescription:
      'Wholesale ordering account with authorized card holders and scheduled deliveries. Apply separately from full GHRA Membership — no membership is required to participate.',
    dashboardDescription:
      'The standalone Warehouse ordering account application with authorized card holders and scheduled deliveries.',
    note: 'GHRA Membership is not required.',
    applyLabel: 'Apply for Warehouse',
    signupPath: '/signup?via=warehouse',
    newPath: '/warehouse-application/new',
  },
]
