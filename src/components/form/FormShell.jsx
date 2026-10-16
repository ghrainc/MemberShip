import ProgressIndicator from '../ProgressIndicator'
import '../../styles/form/form-shell.css'

const LOGO_URL =
  'https://cdn.builder.io/api/v1/image/assets%2Fcf932114bdd74274b1b6c6fb8fbf812c%2F6fb047d4702548c2854d59fad5d72761?format=webp&width=800'

function FormShell({ title, steps, currentStep, email, children, nav, onStepClick }) {
  return (
    <div className="gf-container">
      <div className="gf-header">
        <img src={LOGO_URL} alt="GHRA" className="gf-logo" />
        <h1 className="gf-title">{title}</h1>
        <p className="gf-subtitle">Greater Houston Retailers Cooperative Association, Inc.</p>
        {email && <p className="gf-email">{email}</p>}
      </div>

      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={steps.length}
        steps={steps}
        onStepClick={onStepClick}
      />

      <div className="gf-card">
        <div className="gf-content">
          {children}
        </div>
        {nav && <div className="gf-nav">{nav}</div>}
      </div>
    </div>
  )
}

export default FormShell
