import { createClient } from '@sanity/client'

const SITE_URL = 'https://todaysdevs.com'

const sanity = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID,
  dataset: process.env.VITE_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

const postsQuery = `
  *[_type == "post" && defined(slug.current) && publishedAt <= now()]
  | order(publishedAt desc) {
    "slug": slug.current,
    _updatedAt
  }
`

export default async function handler(req, res) {
  const posts = await sanity.fetch(postsQuery)

  const staticUrls = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'monthly' },
    { loc: `${SITE_URL}/blog`, priority: '0.8', changefreq: 'weekly' },
  ]

  const postUrls = posts.map(post => ({
    loc: `${SITE_URL}/blog/${post.slug}`,
    lastmod: post._updatedAt ? post._updatedAt.split('T')[0] : undefined,
    priority: '0.7',
    changefreq: 'never',
  }))

  const allUrls = [...staticUrls, ...postUrls]

  const urlEntries = allUrls.map(u => {
    const lastmod = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''
    return `  <url>
    <loc>${u.loc}</loc>${lastmod}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`

  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  res.status(200).send(xml)
}
