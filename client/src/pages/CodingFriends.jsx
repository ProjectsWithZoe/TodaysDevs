import { useState, useMemo, useCallback, useEffect } from 'react'
import { useApiCall }     from '../hooks/useApiCall.js'
import { useTitleEffect } from '../hooks/useTitleEffect.js'
import { Avatar }         from '../components/Avatar.jsx'
import { RoleBadge }      from '../components/RoleBadge.jsx'
import CodingMap          from '../components/Map.jsx'
import api                from '../api/client.js'

const MODE_LABELS = { solo: 'Solo', duo: 'Duo', team: 'Team' }

const ROLE_PILL = {
  frontend:  'bg-sky-500/15 text-sky-300 border border-sky-500/25',
  backend:   'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  fullstack: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25',
}

const ROLE_GLOW = {
  frontend:  '#0ea5e9',
  backend:   '#10b981',
  fullstack: '#6366f1',
}

// Avatar colour — mirrors map.jsx so the modal and pin match
const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e']
function avatarColor(name = '') {
  const code = [...name].reduce((s, c) => s + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}
function initials(name = '') {
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? (p[0][0] ?? '?').toUpperCase() : (p[0][0] + p[1][0]).toUpperCase()
}

// ── Online / time helpers ─────────────────────────────────────────────────────

const ONLINE_MS = 5 * 60 * 1000   // 5 minutes

function isOnline(dateStr) {
  if (!dateStr) return false
  return Date.now() - new Date(dateStr).getTime() < ONLINE_MS
}

function timeAgo(dateStr) {
  if (!dateStr) return null
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Active now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours   = Math.floor(minutes / 60)
  const remMins = minutes % 60
  if (remMins === 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remMins} minute${remMins !== 1 ? 's' : ''} ago`
}

// Convert ISO-3166-1 alpha-2 code → flag emoji (e.g. "US" → 🇺🇸)
function countryFlag(code = '') {
  if (!code || code.length !== 2) return null
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  )
}

// ── Stat cell ─────────────────────────────────────────────────────────────────

function StatCell({ label, value, icon }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3">
      <span className="text-slate-500">{icon}</span>
      <p className="text-sm font-semibold text-slate-100 leading-none">{value || '—'}</p>
      <p className="text-[10px] uppercase tracking-widest font-medium text-slate-600">{label}</p>
    </div>
  )
}

// ── Browser / device icons (inline SVG) ───────────────────────────────────────

function BrowserIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8" strokeLinecap="round" />
      <path d="M12 3c-2 2.5-3 5.5-3 9s1 6.5 3 9M12 3c2 2.5 3 5.5 3 9s-1 6.5-3 9" />
    </svg>
  )
}

function DeviceIcon({ name = '' }) {
  const isMobile = /iphone|android|ipad|tablet/i.test(name)
  if (isMobile) return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="4" width="20" height="13" rx="1.5" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </svg>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function UserModal({ user, onClose }) {
  if (!user) return null

  const displayName = user.display_name || '?'
  const isActive    = user.active_projects?.length > 0
  const online      = isOnline(user.last_seen_at)
  const seen        = timeAgo(user.last_seen_at)
  const color       = avatarColor(displayName)
  const glowColor   = ROLE_GLOW[user.role] ?? color
  const flag        = countryFlag(user.country_code)
  const location    = [user.city, user.country].filter(Boolean).join(', ')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #1a2535 0%, #0d1520 100%)',
          border:     '1px solid rgba(255,255,255,0.07)',
          boxShadow:  `0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`,
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Ambient glow behind avatar */}
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-56 h-40 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: glowColor }}
        />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          aria-label="Close"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ── Hero ── */}
        <div className="relative pt-9 pb-6 px-6 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold select-none"
              style={{
                background: color,
                border:     '3px solid rgba(255,255,255,0.12)',
                boxShadow:  `0 0 0 6px ${color}22, 0 8px 24px ${color}44`,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {initials(displayName)}
            </div>
            {/* Online dot */}
            {isActive && (
              <span
                className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 bg-emerald-400"
                style={{ borderColor: '#0d1520', boxShadow: '0 0 8px #34d39988' }}
              />
            )}
          </div>

          {/* Name */}
          <h2 className="text-lg font-bold text-white tracking-tight">{displayName}</h2>

          {/* Role badge */}
          {user.role ? (
            <span className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_PILL[user.role] ?? 'bg-slate-700 text-slate-300'}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          ) : (
            <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-500 border border-slate-700">
              No role
            </span>
          )}

          {/* Online / last seen */}
          {seen && (
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${online ? 'bg-green-400' : 'bg-slate-600'}`}
                style={online ? { boxShadow: '0 0 6px #22c55e' } : {}}
              />
              <span className={`text-xs font-medium ${online ? 'text-green-400' : 'text-slate-500'}`}>
                {online ? 'Active now' : `Last seen ${seen}`}
              </span>
            </div>
          )}

          {/* Location */}
          {location && (
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
              {flag && <span className="text-sm leading-none">{flag}</span>}
              <span>{location}</span>
            </p>
          )}
        </div>

        {/* ── Stats strip ── */}
        <div
          className="grid grid-cols-2 divide-x"
          style={{
            borderTop:    '1px solid rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background:   'rgba(0,0,0,0.25)',
            divideColor:  'rgba(255,255,255,0.05)',
          }}
        >
          <StatCell
            label="Browser"
            value={user.ua_browser}
            icon={<BrowserIcon />}
          />
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
            <StatCell
              label="Device"
              value={user.ua_device}
              icon={<DeviceIcon name={user.ua_device} />}
            />
          </div>
        </div>

        {/* ── Projects ── */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3">
            Currently building
          </p>
          {isActive ? (
            <ul className="space-y-2">
              {user.active_projects.map((p, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-sm text-slate-200 font-medium truncate">{p.title}</span>
                  </div>
                  <span
                    className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {MODE_LABELS[p.mode] ?? p.mode}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="py-5 rounded-xl text-center"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <p className="text-xs text-slate-600">No active projects right now</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── List view ─────────────────────────────────────────────────────────────────

function ListCard({ user, onClick }) {
  const displayName = user.display_name || '?'
  const active      = user.active_projects?.length ?? 0
  const online      = isOnline(user.last_seen_at)
  const seen        = timeAgo(user.last_seen_at)

  return (
    <button
      onClick={() => onClick(user)}
      className="group w-full text-left bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all p-4 flex items-center gap-3"
    >
      {/* Avatar + status dot */}
      <div className="relative shrink-0">
        <Avatar name={displayName} size="lg" />
        {/* Green = online, emerald = building (only if not online) */}
        {online ? (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white shadow-[0_0_6px_#22c55e88]" />
        ) : active > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
        ) : null}
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {user.role
            ? <RoleBadge role={user.role} />
            : <span className="text-xs text-slate-400">No role</span>
          }
        </div>
      </div>

      {/* Right: online status or last seen */}
      <div className="shrink-0 text-right">
        {online ? (
          <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            Active now
          </span>
        ) : seen ? (
          <span className="text-[10px] text-slate-400">{seen}</span>
        ) : active > 0 ? (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
            {active} active
          </span>
        ) : null}
      </div>
    </button>
  )
}

function ListView({ users, onSelect }) {
  if (users.length === 0) {
    return <div className="py-20 text-center text-sm text-slate-400">No developers found</div>
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200">
      {users.map(u => (
        <ListCard key={u.id} user={u} onClick={onSelect} />
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CodingFriends() {
  useTitleEffect('Coding Friends')
  const [view,     setView]     = useState('map')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  const { data: rawUsers, loading, refetch } = useApiCall(
    () => api.get('/users/community'),
    []
  )
  const users = rawUsers ?? []

  // Geolocate via the browser (uses the user's real public IP — works in dev + prod).
  // Fires once per page visit; updates the server then refreshes the user list so
  // the caller's pin lands in the right place immediately.
  useEffect(() => {
    let cancelled = false
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data.latitude || !data.longitude) return
        api.patch('/users/me/location', {
            lat:          data.latitude,
            lng:          data.longitude,
            city:         data.city          ?? null,
            country:      data.country_name  ?? null,
            country_code: data.country_code  ?? null,
          })
          .then(() => { if (!cancelled) refetch() })
          .catch(() => {})
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return users
    return users.filter(u =>
      (u.display_name ?? '').toLowerCase().includes(q) ||
      (u.role ?? '').toLowerCase().includes(q)
    )
  }, [users, search])

  const activeCount = useMemo(
    () => users.filter(u => u.active_projects?.length > 0).length,
    [users]
  )

  const handleSelect = useCallback(user => setSelected(user), [])
  const handleClose  = useCallback(() => setSelected(null), [])

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Friends</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            
            {!loading && activeCount > 0 && (
              <span className="ml-2 text-emerald-600 border rounded-md px-2 py-1 text-xs font-medium">
                · {activeCount} building right now
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search name or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="field-input w-48 text-xs py-1.5"
          />

          <div className="flex border border-slate-200 overflow-hidden shrink-0">
            <button
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                view === 'map' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Map
            </button>
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 border-l border-slate-200 ${
                view === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="border border-slate-200 bg-slate-50 flex items-center justify-center" style={{ height: 400 }}>
          <p className="text-sm text-slate-400">Loading developers…</p>
        </div>
      ) : view === 'map' ? (
        <CodingMap users={filtered} onSelect={handleSelect} />
      ) : (
        <ListView users={filtered} onSelect={handleSelect} />
      )}

      <UserModal user={selected} onClose={handleClose} />
    </div>
  )
}
