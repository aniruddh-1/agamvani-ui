import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import App from './App.jsx'
import './index.css'
import { APP_CONFIG } from './config/constants.js'
import { AuthProvider } from './contexts/AuthContext.jsx'

// Log app startup in development
// console.log(`🎵 ${APP_CONFIG.NAME} v${APP_CONFIG.VERSION} starting...`)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="agamvani-theme"
          themes={['light', 'dark']}
        >
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
