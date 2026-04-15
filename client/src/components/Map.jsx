import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken =
  import.meta.env.VITE_MAPBOX_TOKEN

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCoordinates(user) {
  if (user.lat != null && user.lng != null) return [user.lng, user.lat]
  const n = typeof user.id === 'number'
    ? user.id
    : parseInt(String(user.id).replace(/-/g, '').slice(0, 8), 16)
  const a = ((n * 2654435761) >>> 0)
  const b = ((n * 2246822519) >>> 0)
  return [(a % 300) - 150, (b % 115) - 50]
}

const AVATAR_HEX = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e']
function avatarColor(name = '') {
  const code = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return AVATAR_HEX[code % AVATAR_HEX.length]
}
function initials(name = '') {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// A user is "online" if they made a request in the last 5 minutes
const ONLINE_MS = 5 * 60 * 1000
function isOnline(dateStr) {
  if (!dateStr) return false
  return Date.now() - new Date(dateStr).getTime() < ONLINE_MS
}

/**
 * Human-readable relative time.
 * < 60s  → "Active now"
 * < 60m  → "3 minutes ago"
 * < 24h  → "4 hours 31 minutes ago"
 */
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function CodingMap({ users = [], onSelect }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markersRef   = useRef([])
  const [tooltip, setTooltip] = useState(null)   // { user, x, y }

  // ── Mount map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container:  containerRef.current,
      style:      'mapbox://styles/mapbox/standard',
      projection: 'globe',
      center:     [30, 15],
      zoom:       1.5,
    })

    map.scrollZoom.disable()
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('style.load', () => map.setFog({}))

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // ── Sync markers whenever the user list changes ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    users.forEach(u => {
      const displayName = u.display_name || '?'
      const [lng, lat]  = getCoordinates(u)
      const color       = avatarColor(displayName)
      const online      = isOnline(u.last_seen_at)
      const isActive    = u.active_projects?.length > 0

      // ── Wrapper (28 × 28) ─────────────────────────────────────────────────
      const el = document.createElement('div')
      el.style.cssText = 'position:relative;width:28px;height:28px;cursor:pointer;'

      // Green pulsing ring — currently online
      if (online) {
        const ring = document.createElement('div')
        ring.className = 'cf-ping'
        ring.style.cssText =
          'position:absolute;inset:0;border-radius:50%;background:#22c55e;opacity:0.55;'
        el.appendChild(ring)
      }

      // Avatar circle
      const av = document.createElement('div')
      av.style.cssText = `
        position:absolute;inset:0;border-radius:50%;
        background:${color};border:1.5px solid #0f172a;
        display:flex;align-items:center;justify-content:center;
        font-size:9px;font-weight:700;color:#fff;
        font-family:system-ui,sans-serif;
        box-shadow:0 1px 4px rgba(0,0,0,.5);
        ${!online ? 'opacity:0.7;' : ''}
      `
      av.textContent = initials(displayName)
      el.appendChild(av)

      // Small emerald badge — has active projects
      if (isActive) {
        const dot = document.createElement('div')
        dot.style.cssText = `
          position:absolute;top:-1px;right:-1px;
          width:7px;height:7px;border-radius:50%;
          background:#10b981;border:1.5px solid #0f172a;
          box-shadow:0 0 4px #10b98188;
        `
        el.appendChild(dot)
      }

      // Events
      el.addEventListener('mouseenter', e =>
        setTooltip({ user: u, x: e.clientX, y: e.clientY })
      )
      el.addEventListener('mousemove', e =>
        setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)
      )
      el.addEventListener('mouseleave', () => setTooltip(null))
      el.addEventListener('click', () => { setTooltip(null); onSelect(u) })

      markersRef.current.push(
        new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map)
      )
    })

    return () => { markersRef.current.forEach(m => m.remove()); markersRef.current = [] }
  }, [users, onSelect])

  function handleReset() {
    mapRef.current?.flyTo({ center: [30, 15], zoom: 1.5, duration: 800 })
  }

  const tooltipUser    = tooltip?.user
  const tooltipOnline  = tooltipUser ? isOnline(tooltipUser.last_seen_at) : false
  const tooltipSeen    = tooltipUser ? timeAgo(tooltipUser.last_seen_at) : null

  return (
    <div
      className="relative w-full border border-slate-800 overflow-hidden select-none"
      style={{ height: 560 }}
    >
      {/* Pulse-ring keyframe */}
      <style>{`
        @keyframes cf-ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .cf-ping { animation: cf-ping 1.4s cubic-bezier(0, 0, .2, 1) infinite; }
      `}</style>

      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Reset */}
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={handleReset}
          title="Reset view"
          className="w-7 h-7 flex items-center justify-center bg-slate-800/90 border border-slate-700 text-slate-400 hover:bg-slate-700 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 15v4.5M9 15H4.5M15 9h4.5M15 9V4.5M15 15h4.5M15 15v4.5" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-12 z-10 flex items-center gap-3 bg-slate-900/80 px-3 py-1.5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#22c55e]" />
          <span className="text-[10px] font-medium text-slate-400">Online</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-medium text-slate-400">Building</span>
        </span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y - 12 }}
        >
          <div
            className="px-3 py-2 shadow-2xl"
            style={{
              background: 'rgba(15,23,42,0.96)',
              border:     '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              backdropFilter: 'blur(8px)',
            }}
          >
            <p className="text-xs font-semibold text-white whitespace-nowrap">
              {tooltipUser.display_name || '?'}
            </p>
            {tooltipUser.role && (
              <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                {tooltipUser.role}
              </p>
            )}
            {tooltipSeen && (
              <p className={`text-[10px] mt-1 font-medium whitespace-nowrap ${tooltipOnline ? 'text-green-400' : 'text-slate-500'}`}>
                {tooltipOnline ? '● Active now' : `Last seen: ${tooltipSeen}`}
              </p>
            )}
            {tooltipUser.active_projects?.length > 0 && (
              <p className="text-[10px] text-emerald-400 mt-0.5">
                ● {tooltipUser.active_projects.length} active project{tooltipUser.active_projects.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {users.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <p className="text-sm text-slate-400 bg-slate-900/70 px-4 py-2">
            No developers online today
          </p>
        </div>
      )}
    </div>
  )
}
