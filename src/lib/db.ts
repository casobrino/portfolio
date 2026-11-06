import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import type { PhotoInput, PhotoRow, Post, PostInput, PostLang } from './types'

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'content.sqlite')

let dbInstance: DatabaseSync | null = null

function getDbPath () {
  return import.meta.env.SQLITE_PATH ??
    process.env.SQLITE_PATH ??
    DEFAULT_DB_PATH
}

function migrate (db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      lang TEXT NOT NULL CHECK (lang IN ('es', 'en')),
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      published INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE (slug, lang)
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      public_id TEXT NOT NULL,
      src TEXT NOT NULL,
      alt TEXT NOT NULL DEFAULT '',
      caption TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS posts_lang_published_idx
      ON posts (lang, published, published_at DESC);

    CREATE INDEX IF NOT EXISTS photos_sort_idx
      ON photos (sort_order ASC, created_at DESC);
  `)
}

function getDb () {
  if (dbInstance) return dbInstance

  const dbPath = getDbPath()
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  dbInstance = new DatabaseSync(dbPath)
  migrate(dbInstance)
  return dbInstance
}

function mapPost (row: Record<string, unknown>): Post {
  return {
    id: String(row.id),
    slug: String(row.slug),
    lang: row.lang as PostLang,
    title: String(row.title),
    excerpt: String(row.excerpt ?? ''),
    body: String(row.body ?? ''),
    published: Boolean(row.published),
    published_at: row.published_at ? String(row.published_at) : null,
    updated_at: String(row.updated_at),
  }
}

function mapPhoto (row: Record<string, unknown>): PhotoRow {
  return {
    id: String(row.id),
    public_id: String(row.public_id),
    src: String(row.src),
    alt: String(row.alt ?? ''),
    caption: String(row.caption ?? ''),
    location: String(row.location ?? ''),
    date: String(row.date ?? ''),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at),
  }
}

export async function listPosts (options: { lang?: PostLang, publishedOnly?: boolean } = {}): Promise<Post[]> {
  const db = getDb()
  const { lang, publishedOnly = false } = options

  if (lang && publishedOnly) {
    return db.prepare(`
      SELECT * FROM posts
      WHERE lang = ? AND published = 1
      ORDER BY published_at DESC NULLS LAST, updated_at DESC
    `).all(lang).map((row) => mapPost(row as Record<string, unknown>))
  }

  if (lang) {
    return db.prepare(`
      SELECT * FROM posts
      WHERE lang = ?
      ORDER BY updated_at DESC
    `).all(lang).map((row) => mapPost(row as Record<string, unknown>))
  }

  if (publishedOnly) {
    return db.prepare(`
      SELECT * FROM posts
      WHERE published = 1
      ORDER BY published_at DESC NULLS LAST, updated_at DESC
    `).all().map((row) => mapPost(row as Record<string, unknown>))
  }

  return db.prepare('SELECT * FROM posts ORDER BY updated_at DESC')
    .all()
    .map((row) => mapPost(row as Record<string, unknown>))
}

export async function getPostBySlug (slug: string, lang: PostLang, publishedOnly = true): Promise<Post | null> {
  const db = getDb()
  const row = publishedOnly
    ? db.prepare(`
        SELECT * FROM posts
        WHERE slug = ? AND lang = ? AND published = 1
        LIMIT 1
      `).get(slug, lang)
    : db.prepare(`
        SELECT * FROM posts
        WHERE slug = ? AND lang = ?
        LIMIT 1
      `).get(slug, lang)

  return row ? mapPost(row as Record<string, unknown>) : null
}

export async function getPostById (id: string): Promise<Post | null> {
  const row = getDb().prepare('SELECT * FROM posts WHERE id = ? LIMIT 1').get(id)
  return row ? mapPost(row as Record<string, unknown>) : null
}

export async function createPost (input: PostInput): Promise<Post> {
  const db = getDb()
  const id = randomUUID()
  const published = Boolean(input.published)
  const publishedAt = published
    ? (input.published_at ?? new Date().toISOString())
    : null
  const updatedAt = new Date().toISOString()

  db.prepare(`
    INSERT INTO posts (id, slug, lang, title, excerpt, body, published, published_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.slug,
    input.lang,
    input.title,
    input.excerpt ?? '',
    input.body ?? '',
    published ? 1 : 0,
    publishedAt,
    updatedAt
  )

  const post = await getPostById(id)
  if (!post) throw new Error('No se pudo crear el post')
  return post
}

export async function updatePost (id: string, input: Partial<PostInput>): Promise<Post> {
  const current = await getPostById(id)
  if (!current) throw new Error('Post no encontrado')

  const slug = input.slug ?? current.slug
  const lang = input.lang ?? current.lang
  const title = input.title ?? current.title
  const excerpt = input.excerpt ?? current.excerpt
  const body = input.body ?? current.body
  const published = input.published ?? current.published
  let publishedAt = current.published_at
  if (input.published_at !== undefined) publishedAt = input.published_at
  else if (published && !publishedAt) publishedAt = new Date().toISOString()
  else if (!published) publishedAt = null
  const updatedAt = new Date().toISOString()

  getDb().prepare(`
    UPDATE posts SET
      slug = ?,
      lang = ?,
      title = ?,
      excerpt = ?,
      body = ?,
      published = ?,
      published_at = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    slug,
    lang,
    title,
    excerpt,
    body,
    published ? 1 : 0,
    publishedAt,
    updatedAt,
    id
  )

  const post = await getPostById(id)
  if (!post) throw new Error('Post no encontrado')
  return post
}

export async function deletePost (id: string): Promise<void> {
  getDb().prepare('DELETE FROM posts WHERE id = ?').run(id)
}

export async function listPhotos (): Promise<PhotoRow[]> {
  return getDb().prepare(`
    SELECT * FROM photos
    ORDER BY sort_order ASC, created_at DESC
  `).all().map((row) => mapPhoto(row as Record<string, unknown>))
}

export async function getPhotoById (id: string): Promise<PhotoRow | null> {
  const row = getDb().prepare('SELECT * FROM photos WHERE id = ? LIMIT 1').get(id)
  return row ? mapPhoto(row as Record<string, unknown>) : null
}

export async function createPhoto (input: PhotoInput): Promise<PhotoRow> {
  const id = randomUUID()
  const createdAt = new Date().toISOString()

  getDb().prepare(`
    INSERT INTO photos (id, public_id, src, alt, caption, location, date, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.public_id,
    input.src,
    input.alt ?? '',
    input.caption ?? '',
    input.location ?? '',
    input.date ?? '',
    input.sort_order ?? 0,
    createdAt
  )

  const photo = await getPhotoById(id)
  if (!photo) throw new Error('No se pudo crear la foto')
  return photo
}

export async function updatePhoto (id: string, input: Partial<PhotoInput>): Promise<PhotoRow> {
  const current = await getPhotoById(id)
  if (!current) throw new Error('Foto no encontrada')

  getDb().prepare(`
    UPDATE photos SET
      public_id = ?,
      src = ?,
      alt = ?,
      caption = ?,
      location = ?,
      date = ?,
      sort_order = ?
    WHERE id = ?
  `).run(
    input.public_id ?? current.public_id,
    input.src ?? current.src,
    input.alt ?? current.alt,
    input.caption ?? current.caption,
    input.location ?? current.location,
    input.date ?? current.date,
    input.sort_order ?? current.sort_order,
    id
  )

  const photo = await getPhotoById(id)
  if (!photo) throw new Error('Foto no encontrada')
  return photo
}

export async function deletePhoto (id: string): Promise<PhotoRow | null> {
  const current = await getPhotoById(id)
  if (!current) return null
  getDb().prepare('DELETE FROM photos WHERE id = ?').run(id)
  return current
}
