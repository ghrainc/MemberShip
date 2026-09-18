// Extracts the AssignedGHRANo value typed by MembershipAdmin during signing.
// DS exposes signer-filled field values in signatureRequest.responseData[].
// apiId is stable across test and production for a given template field.
const ASSIGNED_GHRA_NO_API_ID = '0edb4349-0e0a-4b5b-9aee-4c9f8f2e63fa'

function readAssignedGhraNumber(signatureRequest) {
  const items = signatureRequest?.responseData || []
  const item = items.find(d => d.apiId === ASSIGNED_GHRA_NO_API_ID)
  const val = (item?.value || '').trim()
  return val || null
}

module.exports = { readAssignedGhraNumber }
