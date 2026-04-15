import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { AuthProvider }    from './context/AuthContext.jsx'
import { ErrorBoundary }   from './components/ErrorBoundary.jsx'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        {/* RouterProvider lives inside App — AuthProvider must wrap it */}
        <App />
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
