// Validates a GHRA membership number.
// Returns an error string, or null if valid.
function validateGhraNumber(num) {
  if (!num || typeof num !== 'string') return 'GHRA number is required'
  const trimmed = num.trim()
  if (!trimmed) return 'GHRA number is required'
  if (trimmed.length > 50) return 'GHRA number must be 50 characters or fewer'
  if (!/^[a-zA-Z0-9\s\-]+$/.test(trimmed)) return 'GHRA number may only contain letters, numbers, spaces, and dashes'
  return null
}

module.exports = { validateGhraNumber }
