import { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

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
import SoloWorkspace  from './pages/SoloWorkspace.jsx'
import SubmitProject  from './pages/SubmitProject.jsx'
import Profile        from './pages/Profile.jsx'
import NotFound       from './pages/NotFound.jsx'

// ── Lazy pages ────────────────────────────────────────────────────────────
const ProjectBrowser = lazy(() => import('./pages/ProjectBrowser.jsx'))
const Leaderboard    = lazy(() => import('./pages/Leaderboard.jsx'))
const CodingFriends  = lazy(() => import('./pages/CodingFriends.jsx'))
const Blog           = lazy(() => import('./pages/Blog.jsx'))
const BlogPost       = lazy(() => import('./pages/BlogPost.jsx'))

import * as Sentry from '@sentry/react';
// Add this button component to your app to test Sentry's error tracking
function ErrorButton() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
    >
      Break the world
    </button>
  );
}


function Lazy({ children }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────────────
  { path: '/',           element: <Landing /> },
  { path: '/blog',       element: <Lazy><Blog /></Lazy> },
  { path: '/blog/:slug', element: <Lazy><BlogPost /></Lazy> },

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

      { path: '/projects',         element: <Lazy><ProjectBrowser /></Lazy> },
      { path: '/projects/:id',     element: <ProjectDetail /> },

      { path: '/rooms/:id/workspace', element: <SoloWorkspace /> },
      { path: '/rooms/:id/submit',    element: <SubmitProject /> },

      { path: '/leaderboard', element: <Lazy><Leaderboard /></Lazy> },
      { path: '/friends',     element: <Lazy><CodingFriends /></Lazy> },
      { path: '/profile',     element: <Profile /> },
    ]
  },
  { path: '*', element: <NotFound /> }
])

export default function App() {
  return (
    <HelmetProvider>
      <RouterProvider router={router} />
      <ErrorButton/>
    </HelmetProvider>
  )
}
