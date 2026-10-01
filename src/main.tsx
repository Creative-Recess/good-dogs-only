import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Order matters only for the layer statement, which must come first.
import './styles/layers.css'
import './vendor/98css/98.css'
import './styles/base.css'
import './styles/themes/win98.css'
import './styles/themes/aqua.css'
import './styles/themes/glass.css'
import App from './app/App.tsx'
import { applyTheme, getTheme } from './theme/store.ts'

applyTheme(getTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
