import '../styles/ProgressIndicator.css'

const SHORT_LABELS = {
  1:  'Business',
  2:  'Info',
  3:  'Store',
  4:  'Owners',
  5:  'References',
  6:  'ACH',
  7:  'Warehouse',
  8:  'Donations',
  9:  'Documents',
  10: 'Agreements',
}

function ProgressIndicator({ currentStep, totalSteps, steps, onStepClick }) {
  const handleStepClick = (stepId) => {
    if (onStepClick) onStepClick(stepId)
  }
  const currentStepObj = steps.find(s => s.id === currentStep)

  return (
    <div className="progress-container">
      <div className="step-summary">
        Step {currentStep} of {totalSteps} — {currentStepObj?.title}
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      <div className="steps-indicator">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`step-indicator ${step.id === currentStep ? 'active' : ''} ${step.id < currentStep ? 'completed' : ''}`}
            onClick={() => handleStepClick(step.id)}
          >
            <div className="step-circle" aria-label={step.title}>
              {step.id < currentStep ? '✓' : step.id}
            </div>
            <p className="step-title">
              <span className="step-title-full">{step.title}</span>
              <span className="step-title-short">{SHORT_LABELS[step.id] || step.title}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProgressIndicator
