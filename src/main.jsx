import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { BibbiProvider } from './context/BibbiContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BibbiProvider>
      <App />
    </BibbiProvider>
  </StrictMode>,
)
