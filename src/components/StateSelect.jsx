import { US_STATES } from '../utils/usStates'

/**
 * Reusable US state dropdown. Stores 2-letter code, displays full name.
 * Accepts the same props as a <select> element so it's a drop-in replacement.
 */
function StateSelect({ id, name, value, onChange, className, disabled }) {
  return (
    <select
      id={id}
      name={name}
      value={value || ''}
      onChange={onChange}
      className={className}
      disabled={disabled}
    >
      <option value="">Select state</option>
      {US_STATES.map(s => (
        <option key={s.code} value={s.code}>{s.name}</option>
      ))}
    </select>
  )
}

export default StateSelect
