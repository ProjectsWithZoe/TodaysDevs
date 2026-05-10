import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { PageSkeleton } from '../components/PageSkeleton.jsx'

// ── Data ────────────────────────────────────────────────────────────────────

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

const STATS = [
  {
    value: '25%',
    label: 'Projected job growth for software developers by 2032',
    source: 'U.S. Bureau of Labor Statistics',
  },
  {
    value: '$127k',
    label: 'Median annual salary for software engineers in the US',
    source: 'BLS Occupational Outlook 2024',
  },
  {
    value: '4M+',
    label: 'Global developer shortage forecast by 2025',
    source: 'Gartner Research',
  },
  {
    value: '97M',
    label: 'New tech roles expected globally by 2025',
    source: 'World Economic Forum',
  },
  {
    value: '67%',
    label: 'Of developers work remotely at least part-time',
    source: 'Stack Overflow Developer Survey 2024',
  },
  {
    value: '56%',
    label: 'Median salary increase reported after learning to code',
    source: 'Course Report Outcomes Study',
  },
]

const REASONS = [
  {
    heading: 'AI is creating jobs, not eliminating them',
    body: 'The rise of AI is driving demand for engineers who can build, maintain, and oversee automated systems. Companies are hiring more developers than ever to integrate AI into their products.',
  },
  {
    heading: 'Remote work is the new default',
    body: '67% of developers work remotely. Software engineering is one of the only fields where you can work from anywhere in the world from day one of your career.',
  },
  {
    heading: 'The skills gap is widening',
    body: 'There are over 1 million unfilled tech jobs in the US alone. Employers cannot find enough qualified candidates, which means the market actively rewards people who invest in coding skills today.',
  },
  {
    heading: 'Entry-level salaries are exceptional',
    body: 'Junior developers in the US earn a median of $78,000 per year — more than the national median for all occupations combined. The return on investment is measurable and fast.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Choose a project',
    body: 'Browse real-world projects calibrated to your level. Every project maps to skills employers actively hire for.',
  },
  {
    step: '02',
    title: 'Pick your role and mode',
    body: 'Work solo, see what other friendly developers at your level are doing, or collaborate in teams to build fun projects as frontend, backend, or fullstack developers.',
  },
  {
    step: '03',
    title: 'Build and ship',
    body: 'Follow a step-by-step guide written for your experience level. Submit when done. Your project lives in your portfolio permanently.',
  },
]

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: 'Real projects, real skills',
    body: 'Build everyday useful tools. Every project teaches you something — learn, grow, ask questions, most importantly - have fun coding !',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: 'Collaborative by design',
    body: 'See what other developers are working on. Ask questions, collaborate on projects. We have a Discord!',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'Calibrated to your level',
    body: 'Easy to difficult projects. All projects have different step-by-step guides depending on your level. You are never thrown in the deep end without instruction.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
    title: 'Leaderboard and portfolio',
    body: 'Every completed project is a portfolio entry. A public portfolio, all yours. You can track your progress and be visible to people interested in your success.',
  },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function Landing() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <PageSkeleton />
  if (user)      return <Navigate to="/dashboard" replace />

  return (
    <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }} className="bg-white text-slate-900 antialiased">

      {/* ── Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-indigo-600 leading-none tracking-tight">⟨/⟩</span>
            <span className="text-sm font-bold text-slate-900 tracking-tight uppercase">TodaysDevs</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/blog"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Blog
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-slate-950 pt-14 min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto px-6 py-28 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 mb-8">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-indigo-300 tracking-widest uppercase">
                Built for developers, by developers
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
              Learn by building
              <br />
              <span className="text-indigo-400">real products.</span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-xl mb-10">
              Structured projects calibrated to your level. Work solo, pair, or team up.
              Build a portfolio that proves what you can do — not just what you know.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-3 transition-colors"
              >
                Start for free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-sm font-medium px-6 py-3 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Terminal mockup */}
          <div className="mt-20 border border-slate-700 bg-slate-900 max-w-2xl">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-700">
              <span className="w-3 h-3 bg-red-500/70" />
              <span className="w-3 h-3 bg-amber-500/70" />
              <span className="w-3 h-3 bg-emerald-500/70" />
              <span className="ml-3 text-xs text-slate-500 font-mono">project — task-tracker</span>
            </div>
            <div className="px-5 py-5 font-mono text-sm space-y-2">
              <p><span className="text-slate-500">$</span> <span className="text-emerald-400">npm</span> <span className="text-slate-300">create vite@latest task-tracker -- --template react</span></p>
              <p className="text-slate-500">✔ Scaffolding project...</p>
              <p><span className="text-slate-500">$</span> <span className="text-emerald-400">cd</span> <span className="text-slate-300">task-tracker && npm install</span></p>
              <p className="text-slate-500">added 142 packages in 3.2s</p>
              <p><span className="text-slate-500">$</span> <span className="text-emerald-400">npm</span> <span className="text-slate-300">run dev</span></p>
              <p><span className="text-indigo-400">VITE</span> <span className="text-slate-300">ready in 312ms — </span><span className="text-indigo-400 underline">http://localhost:5173</span></p>
              <p className="flex items-center gap-2">
                <span className="text-slate-500">$</span>
                <span className="w-2 h-4 bg-slate-400 animate-pulse" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-slate-200">
            {STATS.map((s) => (
              <div key={s.value} className="px-6 py-8 first:pl-0 last:pr-0">
                <p className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{s.value}</p>
                <p className="text-xs text-slate-500 leading-relaxed mb-1">{s.label}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{s.source}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why now ── */}
      <section className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-semibold text-indigo-600 tracking-widest uppercase mb-4">The opportunity</p>
            <h2 className="text-4xl font-bold text-slate-900 leading-tight tracking-tight mb-4">
              The best time to learn to code is right now.
            </h2>
            <p className="text-slate-500 text-base leading-relaxed">
              The data is unambiguous. Developer demand is outpacing supply by a wide margin,
              salaries remain at historic highs, and remote work means geography is no longer a
              barrier. The window is open — for now.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-slate-200 border border-slate-200">
            {REASONS.map((r) => (
              <div key={r.heading} className="bg-white p-8">
                <div className="w-6 h-px bg-indigo-600 mb-5" />
                <h3 className="text-base font-bold text-slate-900 mb-3">{r.heading}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-28 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-semibold text-indigo-400 tracking-widest uppercase mb-4">How it works</p>
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
              From zero to shipped in three steps.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-slate-800 border border-slate-800">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="bg-slate-950 p-8">
                <p className="text-5xl font-bold text-slate-800 tracking-tighter mb-6">{item.step}</p>
                <h3 className="text-base font-bold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-semibold text-indigo-600 tracking-widest uppercase mb-4">Platform</p>
            <h2 className="text-4xl font-bold text-slate-900 leading-tight tracking-tight">
              Built differently.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-slate-200 border border-slate-200">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white p-8 group">
                <div className="w-9 h-9 flex items-center justify-center border border-slate-200 text-indigo-600 mb-5 group-hover:border-indigo-300 group-hover:bg-indigo-50 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-32 bg-indigo-600">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Start building today.
          </h2>
          <p className="text-indigo-200 text-base mb-10 max-w-lg mx-auto leading-relaxed">
            Free to join. Pick a project, pick a role, and ship something real.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-bold px-8 py-3.5 transition-colors"
            >
              Create free account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 border border-indigo-400 text-white hover:bg-indigo-700 text-sm font-medium px-8 py-3.5 transition-colors"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-indigo-500 leading-none">⟨/⟩</span>
            <span className="text-xs font-bold text-slate-500 tracking-tight uppercase">TodaysDevs</span>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} TodaysDevs. All rights reserved.</p>
        </div>
      </footer>

      <ErrorButton/>

    </div>
  )
}
