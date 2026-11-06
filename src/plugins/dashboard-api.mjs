import { createHash } from 'node:crypto'

/**
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string>}
 */
function readBody (req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} payload
 */
function sendJson (res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

/**
 * @param {import('node:http').IncomingMessage} req
 */
function checkAuth (req) {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return true
  return req.headers['x-admin-password'] === password
}

/**
 * @param {string} pathname
 * @param {string} prefix
 */
function matchPath (pathname, prefix) {
  if (!pathname.startsWith(prefix)) return null
  const rest = pathname.slice(prefix.length)
  if (rest === '' || rest === '/') return { id: null }
  const id = rest.replace(/^\//, '').split('/')[0]
  return id ? { id } : { id: null }
}

function cloudinaryConfig () {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary no configurado (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)')
  }
  return { cloudName, apiKey, apiSecret }
}

/**
 * @param {Record<string, string | number>} params
 * @param {string} apiSecret
 */
function signCloudinaryParams (params, apiSecret) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex')
}

/** @returns {import('vite').Plugin} */
export function dashboardApiPlugin () {
  return {
    name: 'dashboard-api',
    configureServer (server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? new URL(req.url, 'http://localhost') : null
        if (!url?.pathname.startsWith('/api/dashboard')) {
          next()
          return
        }

        try {
          if (!checkAuth(req)) {
            sendJson(res, 401, { error: 'Contraseña incorrecta' })
            return
          }

          const db = await server.ssrLoadModule('/src/lib/db.ts')
          const method = req.method ?? 'GET'
          const pathname = url.pathname

          if (pathname === '/api/dashboard/cloudinary-sign' && method === 'POST') {
            const { cloudName, apiKey, apiSecret } = cloudinaryConfig()
            const timestamp = Math.round(Date.now() / 1000)
            const folder = 'cv-photos'
            const params = { folder, timestamp }
            const signature = signCloudinaryParams(params, apiSecret)
            sendJson(res, 200, {
              cloudName,
              apiKey,
              timestamp,
              folder,
              signature,
            })
            return
          }

          const postsMatch = matchPath(pathname, '/api/dashboard/posts')
          if (postsMatch) {
            if (method === 'GET' && !postsMatch.id) {
              const posts = await db.listPosts({})
              sendJson(res, 200, { posts })
              return
            }

            if (method === 'POST' && !postsMatch.id) {
              const raw = await readBody(req)
              const body = JSON.parse(raw || '{}')
              const post = await db.createPost(body)
              sendJson(res, 201, { post })
              return
            }

            if (postsMatch.id && method === 'PATCH') {
              const raw = await readBody(req)
              const body = JSON.parse(raw || '{}')
              const post = await db.updatePost(postsMatch.id, body)
              sendJson(res, 200, { post })
              return
            }

            if (postsMatch.id && method === 'DELETE') {
              await db.deletePost(postsMatch.id)
              sendJson(res, 200, { ok: true })
              return
            }
          }

          const photosMatch = matchPath(pathname, '/api/dashboard/photos')
          if (photosMatch) {
            if (method === 'GET' && !photosMatch.id) {
              const photos = await db.listPhotos()
              sendJson(res, 200, { photos })
              return
            }

            if (method === 'POST' && !photosMatch.id) {
              const raw = await readBody(req)
              const body = JSON.parse(raw || '{}')
              const photo = await db.createPhoto(body)
              sendJson(res, 201, { photo })
              return
            }

            if (photosMatch.id && method === 'PATCH') {
              const raw = await readBody(req)
              const body = JSON.parse(raw || '{}')
              const photo = await db.updatePhoto(photosMatch.id, body)
              sendJson(res, 200, { photo })
              return
            }

            if (photosMatch.id && method === 'DELETE') {
              const deleted = await db.deletePhoto(photosMatch.id)
              if (deleted?.public_id) {
                try {
                  const { cloudName, apiKey, apiSecret } = cloudinaryConfig()
                  const timestamp = Math.round(Date.now() / 1000)
                  const params = { public_id: deleted.public_id, timestamp }
                  const signature = signCloudinaryParams(params, apiSecret)
                  const form = new URLSearchParams({
                    public_id: deleted.public_id,
                    timestamp: String(timestamp),
                    api_key: apiKey,
                    signature,
                  })
                  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: form,
                  })
                } catch {
                  // Neon row already removed; Cloudinary cleanup is best-effort.
                }
              }
              sendJson(res, 200, { ok: true })
              return
            }
          }

          sendJson(res, 404, { error: 'Ruta no encontrada' })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido'
          sendJson(res, 500, { error: message })
        }
      })
    },
  }
}
