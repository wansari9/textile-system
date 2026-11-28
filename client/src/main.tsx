import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyStoredPreferences } from './lib/preferences'

// Apply the signed-in user's saved appearance before the first paint.
applyStoredPreferences()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
