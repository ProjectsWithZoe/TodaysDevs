import { Link }           from 'react-router-dom'
import { useTitleEffect } from '../hooks/useTitleEffect.js'

export default function NotFound() {
  useTitleEffect('Page Not Found')

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 gap-4">
      <span className="text-7xl font-black text-slate-200 select-none">404</span>
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-800">Page not found</h1>
        <p className="text-sm text-slate-500 max-w-xs">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link to="/dashboard" className="btn-primary mt-2">
        Go to Dashboard
      </Link>
    </div>
  )
}
