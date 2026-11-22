import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import './styles/fonts.css'
import App from './App.tsx'

window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
