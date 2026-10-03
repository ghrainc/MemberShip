'use strict'

// Formats the authorized representative's home address as "Street, City, State Zip".
// Skips any parts that are blank so the result has no leading/trailing commas.
function formatAuthRepAddress(fd) {
  const street   = (fd.authorizedRepAddress || '').trim()
  const city     = (fd.authorizedRepCity    || '').trim()
  const state    = (fd.authorizedRepState   || '').trim()
  const zip      = (fd.authorizedRepZip     || '').trim()
  const stateZip = [state, zip].filter(Boolean).join(' ')
  return [street, city, stateZip].filter(Boolean).join(', ')
}

module.exports = { formatAuthRepAddress }
