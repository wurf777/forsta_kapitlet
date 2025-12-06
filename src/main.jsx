import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { BibbiProvider } from './context/BibbiContext'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <BibbiProvider>
          <App />
        </BibbiProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
