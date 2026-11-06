-- Reference schema for local SQLite (data/content.sqlite).
-- Applied automatically on first open via src/lib/db.ts — no manual step required.

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
