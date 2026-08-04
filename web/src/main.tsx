import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)

// Registering in dev would serve stale cached assets and make QA lie.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/math-invaders/sw.js', { scope: '/math-invaders/' })
            .catch(() => { /* SW registration failed silently */ })
    })
}
