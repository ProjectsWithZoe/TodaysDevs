import { useState, useEffect }  from 'react'
import { useParams, Link }       from 'react-router-dom'
import { PortableText }          from '@portabletext/react'
import { Helmet }                from 'react-helmet-async'
import { sanity }                from '../lib/sanity.js'
import { postBySlugQuery }       from '../lib/sanityQueries.js'

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

const portableComponents = {
  block: {
    h2: ({ children }) => <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4 tracking-tight">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-bold text-slate-900 mt-8 mb-3">{children}</h3>,
    normal: ({ children }) => <p className="text-slate-600 leading-relaxed mb-5">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-indigo-300 pl-5 italic text-slate-500 my-6">{children}</blockquote>
    ),
  },
  list: {
    bullet:   ({ children }) => <ul className="list-disc pl-6 mb-5 space-y-1.5 text-slate-600">{children}</ul>,
    numbered: ({ children }) => <ol className="list-decimal pl-6 mb-5 space-y-1.5 text-slate-600">{children}</ol>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
    em:     ({ children }) => <em className="italic">{children}</em>,
    code:   ({ children }) => <code className="bg-slate-100 text-slate-700 text-sm px-1.5 py-0.5 font-mono">{children}</code>,
    link:   ({ value, children }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
        {children}
      </a>
    ),
  },
  types: {
    code: ({ value }) => (
      <pre className="bg-slate-900 text-slate-100 rounded-none p-5 overflow-x-auto mb-5 text-sm font-mono">
        <code>{value.code}</code>
      </pre>
    ),
  },
}

export default function BlogPost() {
  const { slug }              = useParams()
  const [post,    setPost]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    sanity.fetch(postBySlugQuery, { slug })
      .then(data => {
        if (!data) setError('Post not found')
        else setPost(data)
      })
      .catch(() => setError('Failed to load post'))
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }} className="bg-white text-slate-900 antialiased min-h-screen">
      {post ? (
        <Helmet>
          <title>{post.title} — TodaysDevs</title>
          <meta name="description" content={post.excerpt ?? `Read ${post.title} on TodaysDevs`} />
          <link rel="canonical" href={`${SITE_URL}/blog/${post.slug}`} />
          <meta property="og:title" content={`${post.title} — TodaysDevs`} />
          <meta property="og:description" content={post.excerpt ?? ''} />
          <meta property="og:url" content={`${SITE_URL}/blog/${post.slug}`} />
          <meta property="og:type" content="article" />
          <meta property="article:published_time" content={post.publishedAt} />
          <script type="application/ld+json">{JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt ?? '',
            author: { '@type': 'Person', name: post.author ?? 'TodaysDevs' },
            datePublished: post.publishedAt,
            publisher: { '@type': 'Organization', name: 'TodaysDevs', url: SITE_URL },
            url: `${SITE_URL}/blog/${post.slug}`,
          })}</script>
        </Helmet>
      ) : (
        <Helmet>
          <title>Blog — TodaysDevs</title>
        </Helmet>
      )}
      <PublicNav />

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-24">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline mb-10">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blog
        </Link>

        {loading && (
          <div className="max-w-2xl space-y-5 animate-pulse">
            <div className="h-4 w-20 bg-slate-200" />
            <div className="h-10 w-3/4 bg-slate-200" />
            <div className="h-4 w-40 bg-slate-100" />
            <div className="space-y-2 pt-6">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="h-4 bg-slate-100" style={{ width: `${70 + (i % 4) * 8}%` }} />
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {post && (
          <div className="max-w-2xl">
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {post.tags.map(tag => (
                  <span key={tag} className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
              {post.title}
            </h1>

            <p className="text-sm text-slate-400 mb-10">
              {post.author ?? 'TodaysDevs'}
              {post.publishedAt && (
                <> · {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</>
              )}
            </p>

            <div className="w-12 h-px bg-indigo-600 mb-10" />

            <PortableText value={post.body} components={portableComponents} />
          </div>
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
