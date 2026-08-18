export const EMPLOYEE_PASSWORD_RULES = [
  { key: 'length',    label: 'At least 8 characters',        test: (p) => p.length >= 8 },
  { key: 'upper',     label: 'At least one uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower',     label: 'At least one lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'number',    label: 'At least one number',           test: (p) => /[0-9]/.test(p) },
  { key: 'special',   label: 'At least one special character',test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export function validateEmployeePassword(password) {
  return EMPLOYEE_PASSWORD_RULES.filter(r => !r.test(password || ''))
}

export function isEmployeePasswordValid(password) {
  return validateEmployeePassword(password).length === 0
}
