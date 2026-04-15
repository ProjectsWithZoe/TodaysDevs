import { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
  useParams
} from 'react-router-dom'
import { useApiCall }       from './hooks/useApiCall.js'
import api                  from './api/client.js'

import AppLayout         from './layouts/AppLayout.jsx'
import AuthLayout        from './layouts/AuthLayout.jsx'
import { PageSkeleton }  from './components/PageSkeleton.jsx'

// ── Eager pages ───────────────────────────────────────────────────────────
import Landing        from './pages/Landing.jsx'
import Login          from './pages/Login.jsx'
import Register       from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword  from './pages/ResetPassword.jsx'
import RoleSelect     from './pages/RoleSelect.jsx'
import Dashboard      from './pages/Dashboard.jsx'
import ProjectDetail  from './pages/ProjectDetail.jsx'
import ModeSelect     from './pages/ModeSelect.jsx'
import RoomLobby      from './pages/RoomLobby.jsx'
import SoloWorkspace  from './pages/SoloWorkspace.jsx'
import MatchmakingWait from './pages/MatchmakingWait.jsx'
import SubmitProject  from './pages/SubmitProject.jsx'
import Profile        from './pages/Profile.jsx'
import NotFound       from './pages/NotFound.jsx'

// ── Lazy pages ────────────────────────────────────────────────────────────
const ProjectBrowser = lazy(() => import('./pages/ProjectBrowser.jsx'))
const TeamWorkspace  = lazy(() => import('./pages/TeamWorkspace.jsx'))
const Leaderboard    = lazy(() => import('./pages/Leaderboard.jsx'))
const CodingFriends  = lazy(() => import('./pages/CodingFriends.jsx'))

function Lazy({ children }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
}

/**
 * Fetches GET /rooms/:id and dispatches to the correct workspace component.
 */
function WorkspaceRouter() {
  const { id } = useParams()
  const { data: room, loading, error } = useApiCall(
    () => api.get(`/rooms/${id}`, { _silent: true }),
    [id]
  )

  if (loading) return <PageSkeleton />
  if (error)   return (
    <div className="detail-error">
      <p>{error}</p>
      <a href="/projects">Back to projects</a>
    </div>
  )
  if (!room) return null

  if (room.mode === 'solo') return <SoloWorkspace />
  return <Lazy><TeamWorkspace /></Lazy>
}

export const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────────────
  { path: '/', element: <Landing /> },

  {
    element: <AuthLayout />,
    children: [
      { path: '/login',                 element: <Login /> },
      { path: '/register',              element: <Register /> },
      { path: '/auth/forgot-password',  element: <ForgotPassword /> },
      { path: '/auth/reset-password',   element: <ResetPassword /> },
    ]
  },

  // ── Authenticated app ──────────────────────────────────────────
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard',   element: <Dashboard /> },
      { path: '/role-select', element: <RoleSelect /> },

      { path: '/projects',    element: <Lazy><ProjectBrowser /></Lazy> },
      { path: '/projects/:id',      element: <ProjectDetail /> },
      { path: '/projects/:id/mode', element: <ModeSelect /> },

      { path: '/rooms/:id',           element: <RoomLobby /> },
      { path: '/rooms/:id/workspace', element: <WorkspaceRouter /> },
      { path: '/rooms/:id/submit',    element: <SubmitProject /> },

      { path: '/matchmaking/wait', element: <MatchmakingWait /> },

      { path: '/leaderboard', element: <Lazy><Leaderboard /></Lazy> },
      { path: '/friends',     element: <Lazy><CodingFriends /></Lazy> },
      { path: '/profile',     element: <Profile /> },
    ]
  },
  { path: '*', element: <NotFound /> }
])

export default function App() {
  return <RouterProvider router={router} />
}
