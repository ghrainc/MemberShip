import { EMPLOYEE_PASSWORD_RULES } from '../utils/passwordValidation'
import '../styles/PasswordStrengthChecklist.css'

function PasswordStrengthChecklist({ password }) {
  return (
    <ul className="pw-checklist">
      {EMPLOYEE_PASSWORD_RULES.map(rule => {
        const met = rule.test(password || '')
        return (
          <li key={rule.key} className={met ? 'pw-rule pw-rule--met' : 'pw-rule'}>
            <span className="pw-rule-icon" aria-hidden="true">{met ? '✓' : '○'}</span>
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}

export default PasswordStrengthChecklist
