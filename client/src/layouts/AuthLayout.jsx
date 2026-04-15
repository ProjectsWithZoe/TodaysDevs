import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <span className="text-2xl font-bold text-brand-600 leading-none">⟨/⟩</span>
        <span className="text-xl font-bold text-slate-800 tracking-tight">DevPlatform</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-8">
        <Outlet />
      </div>

      <p className="mt-6 text-xs text-slate-400">© {new Date().getFullYear()} DevPlatform</p>
    </div>
  )
}
