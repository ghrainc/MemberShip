export function ghraFuelsApplies(formData) {
  return formData.businessType !== 'without-fuel'
    && formData.fuelAvailable === 'unbranded'
    && formData.ghraFuelOptIn !== false
}
