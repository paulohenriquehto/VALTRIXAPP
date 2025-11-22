import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Trigger PWA update prompt
    window.dispatchEvent(new CustomEvent('pwa-update-available', { detail: { updateSW } }))
  },
  onOfflineReady() {
    console.log('App ready to work offline')
    window.dispatchEvent(new CustomEvent('pwa-offline-ready'))
  },
  onRegistered(registration) {
    console.log('Service Worker registered:', registration)
  },
  onRegisterError(error) {
    console.error('Service Worker registration failed:', error)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
