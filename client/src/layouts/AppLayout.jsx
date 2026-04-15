import { Outlet, Navigate, NavLink } from 'react-router-dom'
import { useAuth }          from '../hooks/useAuth.js'
import { useAppStore }      from '../store/useAppStore.js'
import Sidebar              from './Sidebar.jsx'
import Topbar               from './Topbar.jsx'
import { PageSkeleton }     from '../components/PageSkeleton.jsx'
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx'

const MOBILE_NAV = [
  { to: '/dashboard',   label: 'Home',     icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { to: '/projects',    label: 'Projects', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )},
  { to: '/leaderboard', label: 'Board',    icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )},
  { to: '/friends',     label: 'Friends',  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
  { to: '/profile',     label: 'Profile',  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )},
]

export default function AppLayout() {
  const { user, isLoading } = useAuth()
  const { sidebarOpen }     = useAppStore()

  if (isLoading) return <PageSkeleton />
  if (!user)     return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar — hidden on mobile, shown on md+ */}
      <div className={[
        'hidden md:flex flex-col shrink-0 transition-all duration-200 overflow-hidden',
        sidebarOpen ? 'w-56' : 'w-0'
      ].join(' ')}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <EmailVerificationBanner user={user} />
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden flex bg-white border-t border-slate-200 z-40"
        aria-label="Mobile navigation"
      >
        {MOBILE_NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) => [
              'flex flex-col items-center gap-0.5 flex-1 py-2 text-xs font-medium transition-colors',
              isActive ? 'text-brand-600' : 'text-slate-500'
            ].join(' ')}
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
