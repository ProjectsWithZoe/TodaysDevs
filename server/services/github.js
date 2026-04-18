/**
 * GitHub API client for the TodaysDevs repos.
 * Reads project metadata from project.json files in each folder.
 * Simple TTL cache (5 min) to avoid hammering the API.
 */

const OWNER = 'TodaysDevs'
const REPO  = 'html-css-js'
const BASE  = `https://api.github.com/repos/${OWNER}/${REPO}`
const TTL   = 5 * 60 * 1000  // 5 minutes

const cache = new Map()

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.time > TTL) { cache.delete(key); return null }
  return entry.value
}

function setCached(key, value) {
  cache.set(key, { value, time: Date.now() })
}

function githubFetch(path) {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN env var is not set')
  return fetch(path.startsWith('https://') ? path : `${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:        'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
  })
}

/**
 * List all project folders (directories at the root of the repo).
 * Each folder must contain a project.json with { title, description }.
 * Returns an array of { slug, title, description }.
 */
export async function listGithubProjects() {
  const cacheKey = 'projects:list'
  const cached = getCached(cacheKey)
  if (cached) return cached

  const res = await githubFetch('/contents')
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)

  const items = await res.json()
  const dirs  = items.filter(i => i.type === 'dir')

  // Fetch each project.json in parallel
  const projects = (await Promise.allSettled(
    dirs.map(async dir => {
      const pjRes = await githubFetch(`/contents/${dir.name}/project.json`)
      if (!pjRes.ok) return null
      const pjData = await pjRes.json()
      const meta = JSON.parse(Buffer.from(pjData.content, 'base64').toString('utf8'))
      return {
        slug:        dir.name,
        title:       meta.title       ?? dir.name,
        description: meta.description ?? null,
      }
    })
  ))
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value)

  setCached(cacheKey, projects)
  return projects
}

/**
 * Fetch metadata for a single project folder from a specific repo.
 * Returns { slug, title, description, html_url } or null if not found.
 */
async function getGithubProjectFromRepo(slug, repo) {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN env var is not set')

  const repoBase = `https://api.github.com/repos/${OWNER}/${repo}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept:        'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  // Check the folder exists first
  const dirRes = await fetch(`${repoBase}/contents/${encodeURIComponent(slug)}`, { headers })
  if (dirRes.status === 404) return null
  if (!dirRes.ok) throw new Error(`GitHub API error: ${dirRes.status}`)

  const dirData = await dirRes.json()
  const html_url = Array.isArray(dirData)
    ? `https://github.com/${OWNER}/${repo}/tree/main/${slug}`
    : dirData.html_url

  // Try project.json for richer metadata
  const pjRes = await fetch(`${repoBase}/contents/${encodeURIComponent(slug)}/project.json`, { headers })
  if (pjRes.ok) {
    const pjData = await pjRes.json()
    const meta = JSON.parse(Buffer.from(pjData.content, 'base64').toString('utf8'))
    return { slug, title: meta.title ?? slug, description: meta.description ?? null, html_url }
  }

  return { slug, title: slug, description: null, html_url }
}

/**
 * Fetch metadata for a single project folder.
 * If repo is provided, looks only there. Otherwise tries html-css-js then python-projects.
 * Returns { slug, title, description, html_url } or null if not found.
 */
export async function getGithubProject(slug, repo) {
  const cacheKey = `projects:${repo ?? 'any'}:${slug}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  let project
  if (repo) {
    project = await getGithubProjectFromRepo(slug, repo)
  } else {
    const resolvedRepos = ['html-css-js', 'python-projects']
    for (const r of resolvedRepos) {
      project = await getGithubProjectFromRepo(slug, r)
      if (project) {
        // Also cache under the specific repo key so direct lookups hit cache
        setCached(`projects:${r}:${slug}`, project)
        break
      }
    }
  }

  if (project) setCached(cacheKey, project)
  return project
}

/**
 * Fetch all file blobs for a project folder so a ZIP can be built.
 * Returns an array of { path (relative), sha }.
 * Not cached — only called on download requests.
 */
export async function getProjectFileTree(slug, repo = 'html-css-js') {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN env var is not set')
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept:        'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  const treeRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${repo}/git/trees/main?recursive=1`,
    { headers }
  )
  if (!treeRes.ok) throw new Error(`GitHub tree API error: ${treeRes.status}`)

  const { tree, truncated } = await treeRes.json()
  if (truncated) {
    throw new Error('Repository tree was truncated by GitHub — too many files')
  }

  return tree
    .filter(f => f.type === 'blob' && f.path.startsWith(`${slug}/`))
    .map(f => ({ path: f.path.replace(`${slug}/`, ''), sha: f.sha }))
}

/**
 * List all project folders from any TodaysDevs repo.
 * Falls back to the folder name if no project.json is present.
 */
export async function listGithubProjectsFromRepo(repo) {
  const cacheKey = `projects:${repo}:list`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN env var is not set')

  const repoBase = `https://api.github.com/repos/${OWNER}/${repo}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept:        'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  const res = await fetch(`${repoBase}/contents`, { headers })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)

  const items = await res.json()
  const dirs  = items.filter(i => i.type === 'dir')

  const results = await Promise.allSettled(
    dirs.map(async dir => {
      const pjRes = await fetch(`${repoBase}/contents/${dir.name}/project.json`, { headers })
      if (pjRes.ok) {
        const pjData = await pjRes.json()
        const meta = JSON.parse(Buffer.from(pjData.content, 'base64').toString('utf8'))
        return {
          slug:        dir.name,
          title:       meta.title       ?? dir.name,
          description: meta.description ?? null,
          html_url:    dir.html_url,
        }
      }
      // No project.json — use folder name as title
      return { slug: dir.name, title: dir.name, description: null, html_url: dir.html_url }
    })
  )

  for (const r of results) {
    if (r.status === 'rejected') {
      console.error('[github] Failed to load project from %s/%s:', OWNER, repo, r.reason)
    }
  }

  const projects = results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value)

  setCached(cacheKey, projects)
  return projects
}

/**
 * Fetch the raw bytes for a single git blob by SHA.
 */
export async function getBlobBytes(sha, repo = 'html-css-js') {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN env var is not set')
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${repo}/git/blobs/${sha}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept:        'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
    }
  )
  if (!res.ok) throw new Error(`GitHub blob API error: ${res.status}`)
  const { content, encoding } = await res.json()
  if (encoding !== 'base64') throw new Error(`Unexpected blob encoding: ${encoding}`)
  return Buffer.from(content.replace(/\n/g, ''), 'base64')
}
