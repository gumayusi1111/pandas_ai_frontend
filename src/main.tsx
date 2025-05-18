import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AIProviderSettingsPage from './app/settings/ai-provider/page'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
// Import Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/settings/ai-provider" element={<AIProviderSettingsPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
