import fs from "node:fs/promises"
import path from "node:path"

/** @type {Record<string, string>} */
const FILE_MAP = {
  photos: "src/data/photos.json",
  portfolio: "src/data/portfolio.json",
  cv_es: "cv_es.json",
  cv_en: "cv_en.json",
}

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
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} payload
 */
function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

/** @returns {import('vite').Plugin} */
export function adminApiPlugin() {
  return {
    name: "admin-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/admin/save") || req.method !== "POST") {
          next()
          return
        }

        try {
          const password = process.env.ADMIN_PASSWORD
          const provided = req.headers["x-admin-password"]

          if (password && provided !== password) {
            sendJson(res, 401, { error: "Contraseña incorrecta" })
            return
          }

          const raw = await readBody(req)
          const { file, data } = JSON.parse(raw)

          const relativePath = FILE_MAP[file]
          if (!relativePath) {
            sendJson(res, 400, { error: "Archivo no permitido" })
            return
          }

          const absolutePath = path.resolve(server.config.root, relativePath)
          const content = `${JSON.stringify(data, null, 2)}\n`
          await fs.writeFile(absolutePath, content, "utf-8")

          sendJson(res, 200, { ok: true, path: relativePath })
        } catch (error) {
          const message = error instanceof Error ? error.message : "Error desconocido"
          sendJson(res, 500, { error: message })
        }
      })
    },
  }
}
