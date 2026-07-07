import fs from "node:fs/promises"
import path from "node:path"

/** @type {Record<string, string>} */
const FILE_MAP = {
  photos: "src/data/photos.json",
  portfolio: "src/data/portfolio.json",
  cv_es: "cv_es.json",
  cv_en: "cv_en.json",
}

/** @type {Record<string, string>} */
const UPLOAD_DIRS = {
  photos: "public/photos",
  portfolio: "public/portfolio",
}

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"])
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/**
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string>}
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk
    })
    req.on("end", () => resolve(body))
    req.on("error", reject)
  })
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<Buffer>}
 */
function readBodyBuffer(req) {
  return new Promise((resolve, reject) => {
    /** @type {Buffer[]} */
    const chunks = []
    let total = 0

    req.on("data", (chunk) => {
      total += chunk.length
      if (total > MAX_UPLOAD_BYTES) {
        reject(new Error("El archivo supera el límite de 10 MB"))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => resolve(Buffer.concat(chunks)))
    req.on("error", reject)
  })
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @returns {boolean}
 */
function isAuthorized(req) {
  const password = process.env.ADMIN_PASSWORD
  const provided = req.headers["x-admin-password"]
  return !password || provided === password
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} payload
 */
function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

/**
 * @param {string} filename
 * @returns {string}
 */
function sanitizeFilename(filename) {
  const base = path.basename(filename)
  const ext = path.extname(base).toLowerCase()

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("Tipo de archivo no permitido. Usa JPG, PNG, WebP, GIF o SVG.")
  }

  const stem =
    path
      .basename(base, ext)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "foto"

  return `${stem}${ext}`
}

/**
 * @param {string} dir
 * @param {string} filename
 * @returns {Promise<string>}
 */
async function uniqueFilename(dir, filename) {
  const ext = path.extname(filename)
  const stem = path.basename(filename, ext)
  let candidate = filename
  let index = 1

  while (true) {
    try {
      await fs.access(path.join(dir, candidate))
      candidate = `${stem}-${index}${ext}`
      index += 1
    } catch {
      return candidate
    }
  }
}

/**
 * @param {import('vite').ResolvedConfig} root
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
async function handleSave(root, req, res) {
  const raw = await readBody(req)
  const { file, data } = JSON.parse(raw)

  const relativePath = FILE_MAP[file]
  if (!relativePath) {
    sendJson(res, 400, { error: "Archivo no permitido" })
    return
  }

  const absolutePath = path.resolve(root, relativePath)
  const content = `${JSON.stringify(data, null, 2)}\n`
  await fs.writeFile(absolutePath, content, "utf-8")

  sendJson(res, 200, { ok: true, path: relativePath })
}

/**
 * @param {import('vite').ResolvedConfig} root
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
async function handleUpload(root, req, res) {
  const destination = req.headers["x-upload-destination"]
  if (typeof destination !== "string" || !UPLOAD_DIRS[destination]) {
    sendJson(res, 400, { error: "Destino de subida no permitido" })
    return
  }

  const filenameHeader = req.headers["x-filename"]
  if (typeof filenameHeader !== "string" || !filenameHeader.trim()) {
    sendJson(res, 400, { error: "Nombre de archivo requerido" })
    return
  }

  const safeName = sanitizeFilename(filenameHeader)
  const uploadDir = path.resolve(root, UPLOAD_DIRS[destination])
  await fs.mkdir(uploadDir, { recursive: true })

  const finalName = await uniqueFilename(uploadDir, safeName)
  const absolutePath = path.join(uploadDir, finalName)
  const buffer = await readBodyBuffer(req)

  if (buffer.length === 0) {
    sendJson(res, 400, { error: "El archivo está vacío" })
    return
  }

  await fs.writeFile(absolutePath, buffer)

  const publicPath = `/${UPLOAD_DIRS[destination].replace(/^public\//, "")}/${finalName}`
  sendJson(res, 200, { ok: true, path: publicPath, filename: finalName })
}

/** @returns {import('vite').Plugin} */
export function adminApiPlugin() {
  return {
    name: "admin-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const isSave = req.url?.startsWith("/api/admin/save") && req.method === "POST"
        const isUpload = req.url?.startsWith("/api/admin/upload") && req.method === "POST"

        if (!isSave && !isUpload) {
          next()
          return
        }

        try {
          if (!isAuthorized(req)) {
            sendJson(res, 401, { error: "Contraseña incorrecta" })
            return
          }

          if (isSave) {
            await handleSave(server.config.root, req, res)
            return
          }

          await handleUpload(server.config.root, req, res)
        } catch (error) {
          const message = error instanceof Error ? error.message : "Error desconocido"
          sendJson(res, 500, { error: message })
        }
      })
    },
  }
}
