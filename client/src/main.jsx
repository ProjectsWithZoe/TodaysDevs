import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from "@sentry/react";
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider }    from './context/AuthContext.jsx'
import { ErrorBoundary }   from './components/ErrorBoundary.jsx'
import App from './App.jsx'
import './index.css'

Sentry.init({
  dsn: "https://1a7426000cd43e3e61f082269129d527@o4511071798951936.ingest.de.sentry.io/4511263769886800",
  sendDefaultPii: true,
  environment: "production"
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        {/* RouterProvider lives inside App — AuthProvider must wrap it */}
        <App />
        <Analytics />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: { fontSize: '.875rem', maxWidth: '380px' }
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)