import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AppCrashBoundary from './components/AppCrashBoundary'
import { I18nProvider } from './i18n.js'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppCrashBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </AppCrashBoundary>
  </StrictMode>,
)
