import '../styles/ProgressIndicator.css'

function ProgressIndicator({ currentStep, totalSteps, steps, onStepClick }) {
  const handleStepClick = (stepId) => {
    if (onStepClick) {
      onStepClick(stepId)
    }
  }

  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>

      <div className="steps-indicator">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`step-indicator ${step.id === currentStep ? 'active' : ''} ${step.id < currentStep ? 'completed' : ''}`}
            onClick={() => handleStepClick(step.id)}
          >
            <div className="step-circle">
              {step.id < currentStep ? '✓' : step.id}
            </div>
            <p className="step-title">{step.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProgressIndicator
