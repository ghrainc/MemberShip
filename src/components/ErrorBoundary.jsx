import { Component } from 'react'
import { logClientError } from '../utils/logClientError'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    try {
      logClientError({
        errorType: 'render_error',
        message: error?.message || 'React render error',
        action: this.props.action || null,
        applicationId: this.props.applicationId || null,
        step: this.props.step || null,
        technicalDetail: {
          name: error?.name,
          message: error?.message,
          componentStack: (info?.componentStack || '').slice(0, 2000),
        },
      })
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px 24px',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: 6,
          margin: '16px 0',
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#856404' }}>
            Something went wrong displaying this section.
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: '#6b5100' }}>
            Your progress has been saved. Click Try again, or use the Previous button to go back.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '6px 16px',
              background: '#1B2A5B',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
