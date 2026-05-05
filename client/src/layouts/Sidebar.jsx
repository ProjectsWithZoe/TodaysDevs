import { NavLink, Link } from 'react-router-dom'
import { useAuth }       from '../hooks/useAuth.js'
import { useAppStore }   from '../store/useAppStore.js'
import { Avatar }        from '../components/Avatar.jsx'
import { RoleBadge }     from '../components/RoleBadge.jsx'

const NAV = [
  { to: '/dashboard',   label: 'Dashboard',   icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { to: '/projects',    label: 'Projects',    icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )},
  { to: '/leaderboard', label: 'Leaderboard', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )},
  { to: '/friends',     label: 'Friends',     icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
  { to: '/profile',     label: 'Profile',     icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )},
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { activeRoom }   = useAppStore()
  const displayName      = user?.display_name || user?.email || ''

  return (
    <aside
      className="sidebar flex flex-col h-full bg-slate-900 text-slate-300"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <span className="text-lg font-bold text-brand-400 group-hover:text-brand-300 transition-colors">⟨/⟩</span>
          <span className="text-sm font-bold text-white tracking-tight">TodaysDevs</span>
        </Link>
      </div>

      {/* Active room shortcut */}
      {activeRoom && (
        <Link
          to={`/rooms/${activeRoom.id}/workspace`}
          className="mx-3 mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-brand-600/20 border border-brand-500/30 hover:bg-brand-600/30 transition-colors"
          title={`Continue: ${activeRoom.projectTitle}`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-brand-300 truncate">
            Continue: <strong className="text-white font-medium">{activeRoom.projectTitle}</strong>
          </span>
        </Link>
      )}

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Pages">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => [
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            ].join(' ')}
          >
            {icon}
            {label}
          </NavLink>
        ))}

        {/*<a
          href="https://discord.gg/zJ6tEqVg"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors mt-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5h.01M16 10.5h.01M7 17c1.5 1 3.166 1.5 5 1.5S15.5 18 17 17m2-9.5A14.938 14.938 0 0012 6c-2.452 0-4.77.586-6.82 1.625A14.96 14.96 0 004 12c0 2.208.478 4.304 1.335 6.188A14.932 14.932 0 0012 19.5c2.375 0 4.622-.55 6.615-1.53A14.91 14.91 0 0020 12c0-1.573-.242-3.09-.69-4.5z" />
          </svg>
          Discord
        </a>*/}
      </nav>

      {/* User strip */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors">
          <Avatar name={displayName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {displayName.split('@')[0]}
            </p>
            <RoleBadge role={user?.role ?? null} />
          </div>
          <button
            className="shrink-0 p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
