'use strict'

// RFC-4180 CSV field escaping.
// Replaces CR/LF with space, then quotes the field if it contains commas or double-quotes.
function csvField(v) {
  const s = String(v ?? '').replace(/[\r\n]/g, ' ')
  return /[,"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

module.exports = { csvField }
