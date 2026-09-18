export const STATIC_SLOTS = [
  {
    id: 'salesTaxPermit',
    title: 'Sales Tax Permit',
    description: 'Sales Tax Permit (Receipt will not be accepted)',
    required: true,
  },
  {
    id: 'articlesOfIncorporation',
    title: 'Articles of Incorporation/Certificate of Formation',
    description: 'Articles of Incorporation/Certificate of Formation and Amendments-(Seal of "State of Texas")/Distribution of Shares',
    required: true,
  },
  {
    id: 'irsDocument',
    title: 'IRS Document',
    description: 'IRS Document with the business EIN (Employer Identification Number)',
    required: true,
  },
  {
    id: 'tobaccoPermit',
    title: 'Tobacco Permit',
    description: 'Tobacco Permit (if applicable)',
    required: true,
  },
  {
    id: 'beerLicense',
    title: 'Beer License',
    description: 'Beer License (if not provided, must be submitted within 90 days)',
    required: false,
  },
  {
    id: 'voidCheck',
    title: 'Void Check',
    description: 'Void check for each bank account listed in ACH Authorization',
    required: true,
  },
]

export function getDriverLicenseSlots(owners) {
  if (!owners || owners.length <= 1) {
    return [{
      id: 'driverLicenseCopies',
      title: 'Driver License Copies',
      description: 'Driver License Copies of Authorized Representative and all Company Officers (Picture and text must be visible)',
      required: true,
    }]
  }
  return owners.map((owner, index) => {
    const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ') || `Owner ${index + 1}`
    return {
      id: `driverLicense_owner_${index}`,
      title: `Driver License — ${name}`,
      description: 'Driver License copy (Picture and text must be visible)',
      required: true,
    }
  })
}

export function getAllSlots(owners) {
  return [...getDriverLicenseSlots(owners), ...STATIC_SLOTS]
}

// Returns a normalised { [slotId]: [fileObj, ...] } map.
// Handles the old flat-key shape (formData.salesTaxPermit = { filename, ... }).
export function normaliseDocuments(formData) {
  if (
    formData?.documents &&
    typeof formData.documents === 'object' &&
    !Array.isArray(formData.documents)
  ) {
    return formData.documents
  }
  const owners = formData?.owners || []
  const docs = {}
  for (const slot of getAllSlots(owners)) {
    const legacy = formData?.[slot.id]
    if (legacy && typeof legacy === 'object' && legacy.filename) {
      docs[slot.id] = [legacy]
    } else if (typeof legacy === 'string' && legacy.length > 0) {
      docs[slot.id] = [{ originalName: legacy, filename: legacy, url: null }]
    } else {
      docs[slot.id] = []
    }
  }
  return docs
}
