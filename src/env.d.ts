/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/env" />

interface ImportMetaEnv {
  readonly SQLITE_PATH?: string
  readonly ADMIN_PASSWORD?: string
  readonly CLOUDINARY_CLOUD_NAME?: string
  readonly CLOUDINARY_API_KEY?: string
  readonly CLOUDINARY_API_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
