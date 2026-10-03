'use strict'

// ABA routing number checksum (standard Mod-10 weighted sum).
// nineDigits must already be exactly 9 digit characters.
function validateAba(nineDigits) {
  const d = nineDigits.split('').map(Number)
  return (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10 === 0
}

module.exports = { validateAba }
