import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // ── Sidebar ───────────────────────────────────────────────────────────────
  sidebarOpen: window.innerWidth >= 768,
  toggleSidebar: ()    => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: open => set({ sidebarOpen: open }),

  // ── Active room shortcut ──────────────────────────────────────────────────
  // { id: string, mode: string, projectTitle: string } | null
  activeRoom: null,
  setActiveRoom:  room => set({ activeRoom: room }),
  clearActiveRoom: ()  => set({ activeRoom: null }),

  // ── Notification bell ─────────────────────────────────────────────────────
  notifications: [],
  addNotification: notif =>
    set(s => ({
      notifications: [notif, ...s.notifications].slice(0, 5)
    })),
  removeNotification: id =>
    set(s => ({
      notifications: s.notifications.filter(n => n.id !== id)
    }))
}))
