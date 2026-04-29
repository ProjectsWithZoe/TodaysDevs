import { useState, useEffect } from 'react'
import { Link }                from 'react-router-dom'
import { Helmet }              from 'react-helmet-async'
import { sanity }              from '../lib/sanity.js'
import { postsQuery }          from '../lib/sanityQueries.js'

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://todaysdevs.com'

function PublicNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-indigo-600 leading-none tracking-tight">⟨/⟩</span>
          <span className="text-sm font-bold text-slate-900 tracking-tight uppercase">TodaysDevs</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/blog"     className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Blog</Link>
          <Link to="/login"    className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Sign in</Link>
          <Link to="/register" className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 transition-colors">Get started</Link>
        </div>
      </div>
    </header>
  )
}

function PostCard({ post }) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="block bg-white border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map(tag => (
            <span key={tag} className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      )}
      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 leading-snug">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
      )}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{post.author ?? 'TodaysDevs'}</span>
        {date && <span>{date}</span>}
      </div>
    </Link>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 p-6 space-y-3 animate-pulse">
      <div className="h-4 w-16 bg-slate-200" />
      <div className="h-5 w-3/4 bg-slate-200" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-full bg-slate-100" />
        <div className="h-3.5 w-5/6 bg-slate-100" />
      </div>
    </div>
  )
}

export default function Blog() {
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    sanity.fetch(postsQuery)
      .then(setPosts)
      .catch(() => setError('Failed to load posts'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }} className="bg-white text-slate-900 antialiased min-h-screen">
      <Helmet>
        <title>Blog — TodaysDevs</title>
        <meta name="description" content="Tips, tutorials, and insights for developers at every level. Read the TodaysDevs blog." />
        <link rel="canonical" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Blog — TodaysDevs" />
        <meta property="og:description" content="Tips, tutorials, and insights for developers at every level." />
        <meta property="og:url" content={`${SITE_URL}/blog`} />
        <meta property="og:type" content="website" />
      </Helmet>
      <PublicNav />

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-24">
        <div className="max-w-xl mb-14">
          <p className="text-xs font-semibold text-indigo-600 tracking-widest uppercase mb-4">From the team</p>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight">Blog</h1>
          <p className="text-slate-500 mt-3 text-base leading-relaxed">
            Tips, tutorials, and insights for developers at every level.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-8">{error}</p>
        )}

        <div className="grid gap-px bg-slate-200 border border-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)
            : posts.map(post => <PostCard key={post._id} post={post} />)
          }
        </div>

        {!loading && posts.length === 0 && !error && (
          <p className="text-sm text-slate-400 text-center py-20">No posts yet — check back soon.</p>
        )}
      </main>

      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-indigo-500">⟨/⟩</span>
            <span className="text-xs font-bold text-slate-500 tracking-tight uppercase">TodaysDevs</span>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} TodaysDevs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
