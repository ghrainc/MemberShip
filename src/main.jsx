import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { logClientError } from './utils/logClientError'

window.onerror = (message, source, lineno, colno, error) => {
  try {
    logClientError({
      errorType: 'js_error',
      message: String(message).slice(0, 1000),
      technicalDetail: { source, lineno, colno, name: error?.name, stack: (error?.stack || '').slice(0, 2000) },
    })
  } catch {}
  return false
}

window.addEventListener('unhandledrejection', (event) => {
  try {
    const reason = event.reason
    logClientError({
      errorType: 'js_error',
      message: (reason?.message || String(reason || 'Unhandled promise rejection')).slice(0, 1000),
      technicalDetail: { name: reason?.name, message: reason?.message, stack: (reason?.stack || '').slice(0, 2000) },
    })
  } catch {}
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
