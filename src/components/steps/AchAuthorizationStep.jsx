function AchAuthorizationStep({
  formData,
  handleAchInfoChange,
  handleAchToBankMapping,
  handleBankInfoChange,
  addBankAccount
}) {
  const achOptions = [
    { id: 'corporate', label: 'GHRA Corporate' },
    { id: 'warehouse', label: 'GHRA Warehouse' },
    { id: 'fuels', label: 'GHRA Fuels' }
  ]

  const selectedAchTypes = Object.keys(formData.achInfoFor).filter(key => formData.achInfoFor[key])
  const maxBankAccountsReached = formData.bankAccounts.length >= 3

  // Get unique bank account IDs that are actually assigned
  const usedBankAccountIds = new Set(
    selectedAchTypes.map(type => formData.achToBankMapping[type]).filter(id => id && id !== 'new')
  )
  const usedBankAccounts = formData.bankAccounts.filter(account => usedBankAccountIds.has(account.id))

  // Generate friendly name for bank account based on assigned ACH types
  const generateBankAccountName = (bankId) => {
    const assignedAchTypes = selectedAchTypes.filter(type => formData.achToBankMapping[type] === bankId)
    if (assignedAchTypes.length === 0) return 'Unassigned'
    if (assignedAchTypes.length === 1) {
      return achOptions.find(o => o.id === assignedAchTypes[0])?.label || 'Bank Account'
    }
    const labels = assignedAchTypes.map(type => achOptions.find(o => o.id === type)?.label)
    return labels.join(' & ')
  }

  return (
    <fieldset className="form-section">
      <legend>Authorization Form for Automatic Deposits (ACH Credits/Debits)</legend>

      <div className="form-group">
        <p className="section-text">
          I hereby authorize Greater Houston Retailers Cooperative Association, Inc. (GHRA) to initiate credit entries 
          and to initiate, if necessary, debit entries and adjustments for any credit entries in error to my account 
          listed and the depository named below.
        </p>
      </div>

      <fieldset className="form-section-inner">
        <legend className="inner-legend">ACH Information</legend>
        <p className="section-text info-text">Select which GHRA accounts you want to set up automatic deposits for:</p>

        <div className="checkbox-group">
          {achOptions.map(option => (
            <div key={option.id} className="ach-checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.achInfoFor[option.id] || false}
                  onChange={() => handleAchInfoChange(option.id)}
                />
                {option.label}
              </label>

              {formData.achInfoFor[option.id] && (
                <div className="bank-account-selector">
                  <label htmlFor={`bank-select-${option.id}`} className="bank-select-label">
                    Select Bank Account:
                  </label>
                  <select
                    id={`bank-select-${option.id}`}
                    value={formData.achToBankMapping[option.id] || ''}
                    onChange={(e) => {
                      handleAchToBankMapping(option.id, e.target.value)
                    }}
                    className="form-select"
                  >
                    <option value="">-- Select Bank Account --</option>
                    {formData.bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {generateBankAccountName(account.id)}
                      </option>
                    ))}
                    {!maxBankAccountsReached && (
                      <option value="new">+ Create New Bank Account</option>
                    )}
                  </select>

                  {formData.achToBankMapping[option.id] === 'new' && !maxBankAccountsReached && (
                    <button
                      type="button"
                      onClick={() => addBankAccount(option.id)}
                      className="add-bank-button"
                    >
                      Create Bank Account for {option.label}
                    </button>
                  )}

                  {maxBankAccountsReached && formData.achToBankMapping[option.id] === '' && (
                    <div className="warning-message">
                      Maximum 3 bank accounts reached. Please select an existing account.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {maxBankAccountsReached && (
          <div className="info-message">
            <strong>✓ Maximum bank accounts (3) reached</strong><br/>
            You can still assign multiple GHRA accounts to the same bank account.
          </div>
        )}
      </fieldset>

      {usedBankAccounts.length > 0 && (
        <div className="bank-info-section">
          <div className="bank-info-intro">
            <h4>Bank Account Details</h4>
            <p className="section-text">
              Enter bank information for {usedBankAccounts.length === 1 ? 'your selected' : 'each of your selected'} bank {usedBankAccounts.length === 1 ? 'account' : 'accounts'}:
            </p>
          </div>

          {usedBankAccounts.map((account) => {
            const accountName = generateBankAccountName(account.id)
            return (
              <fieldset key={account.id} className="form-section-inner ach-bank-block">
                <legend className="inner-legend">{accountName}</legend>

                <div className="form-group">
                  <label htmlFor={`bankName-${account.id}`}>Bank Name *</label>
                  <input
                    type="text"
                    id={`bankName-${account.id}`}
                    value={account.bankName}
                    onChange={(e) => handleBankInfoChange(account.id, 'bankName', e.target.value)}
                    className="form-input"
                    placeholder="e.g., Chase Bank, Wells Fargo, Bank of America"
                    maxLength={50}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`bankAddress-${account.id}`}>Branch Address</label>
                    <input
                      type="text"
                      id={`bankAddress-${account.id}`}
                      value={account.bankAddress}
                      onChange={(e) => handleBankInfoChange(account.id, 'bankAddress', e.target.value)}
                      className="form-input"
                      placeholder="Street Address"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`bankCity-${account.id}`}>City</label>
                    <input
                      type="text"
                      id={`bankCity-${account.id}`}
                      value={account.bankCity}
                      onChange={(e) => handleBankInfoChange(account.id, 'bankCity', e.target.value)}
                      className="form-input"
                      placeholder="City"
                      maxLength={50}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`bankState-${account.id}`}>State</label>
                    <input
                      type="text"
                      id={`bankState-${account.id}`}
                      value={account.bankState}
                      onChange={(e) => handleBankInfoChange(account.id, 'bankState', e.target.value)}
                      className="form-input"
                      placeholder="State"
                      maxLength={50}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`bankZip-${account.id}`}>Zip Code</label>
                    <input
                      type="text"
                      id={`bankZip-${account.id}`}
                      value={account.bankZip}
                      onChange={(e) => handleBankInfoChange(account.id, 'bankZip', e.target.value.replace(/\D/g, ''))}
                      className="form-input"
                      placeholder="Numbers only"
                      maxLength={20}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor={`transitAbaNumber-${account.id}`}>Transit/ABA Number (Routing Number) *</label>
                    <input
                      type="text"
                      id={`transitAbaNumber-${account.id}`}
                      value={account.transitAbaNumber}
                      onChange={(e) => handleBankInfoChange(account.id, 'transitAbaNumber', e.target.value.replace(/\D/g, ''))}
                      className="form-input"
                      placeholder="Numbers only"
                      maxLength={20}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`accountNumber-${account.id}`}>Account Number *</label>
                    <input
                      type="text"
                      id={`accountNumber-${account.id}`}
                      value={account.accountNumber}
                      onChange={(e) => handleBankInfoChange(account.id, 'accountNumber', e.target.value.replace(/\D/g, ''))}
                      className="form-input"
                      placeholder="Numbers only"
                      maxLength={20}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </fieldset>
            )
          })}
        </div>
      )}

      <div className="form-group">
        <p className="section-text notice-text">
          This authority is to remain in full force and effect until GHRA has received written notification from the member 
          of its termination in such time and in such manner as to afford GHRA and DEPOSITORY a reasonable opportunity to act on it.
        </p>
        <p className="section-text notice-text">
          Please do not attach a personal check or a check copy. Only original check will be accepted.
        </p>
      </div>
    </fieldset>
  )
}

export default AchAuthorizationStep
