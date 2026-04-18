import JSZip                              from 'jszip'
import { getProjectFileTree, getBlobBytes } from '../../services/github.js'

/**
 * GET /projects/:slug/download
 * Streams the project folder as a ZIP archive.
 * Authenticated — proxies private GitHub repo content.
 */
export async function downloadProject(request, reply) {
  const { slug } = request.params
  const { repo = 'html-css-js' } = request.query

  // 1. Get the file list for this project folder
  let files
  try {
    files = await getProjectFileTree(slug, repo)
  } catch (err) {
    request.log.error(err, 'Failed to fetch project file tree')
    return reply.code(502).send({ error: 'Bad Gateway', message: 'Could not reach GitHub' })
  }

  if (files.length === 0) {
    return reply.code(404).send({ error: 'Not Found', message: 'Project not found or empty' })
  }

  // 2. Fetch all blobs in parallel and build ZIP
  const zip = new JSZip()

  try {
    await Promise.all(
      files.map(async ({ path, sha }) => {
        const bytes = await getBlobBytes(sha, repo)
        zip.file(path, bytes)
      })
    )
  } catch (err) {
    request.log.error(err, 'Failed to fetch project blobs')
    return reply.code(502).send({ error: 'Bad Gateway', message: 'Could not fetch project files' })
  }

  // 3. Stream the ZIP
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

  return reply
    .header('Content-Type', 'application/zip')
    .header('Content-Disposition', `attachment; filename="${slug}.zip"`)
    .send(buffer)
}
