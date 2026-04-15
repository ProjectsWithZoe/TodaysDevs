import { createContext, useContext, useState, useEffect } from 'react'
import { authClient } from '../lib/auth-client.js'
import api            from '../api/client.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { data: session, isPending: sessionLoading } = authClient.useSession()

  // App-level user (role, display_name, etc.) from our own users table.
  // BetterAuth's session only proves identity — it doesn't carry app fields.
  const [appUser,        setAppUser]        = useState(null)
  const [appUserLoading, setAppUserLoading] = useState(false)

  // Fetch /users/me whenever the BA session changes.
  // Keyed on session user id so it only re-fires on actual login/logout.
  useEffect(() => {
    if (!session?.user) {
      setAppUser(null)
      return
    }
    let cancelled = false
    setAppUserLoading(true)
    api.get('/users/me')
      .then(({ data }) => { if (!cancelled) setAppUser(data) })
      .catch(() =>         { if (!cancelled) setAppUser(null) })
      .finally(() =>       { if (!cancelled) setAppUserLoading(false) })
    return () => { cancelled = true }
  }, [session?.user?.id])

  // Merged user: BA session identity + app fields (role, display_name, …)
  const user = session?.user
    ? { ...session.user, ...appUser }
    : null

  const value = {
    user,
    isLoading: sessionLoading || appUserLoading,

    login:  (email, password) => authClient.signIn.email({ email, password }),

    logout: async () => {
      await authClient.signOut()
      setAppUser(null)
    },

    /**
     * Locally patch the app user after a successful mutation.
     * Callers are responsible for making the API call themselves;
     * this just keeps the UI in sync without an extra refetch.
     *
     *   await api.patch('/users/me/role', { role })
     *   updateUser({ role })
     */
    updateUser: (patch) =>
      setAppUser(prev => prev ? { ...prev, ...patch } : patch),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
