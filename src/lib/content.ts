import { marked } from 'marked'
import type { Photo } from '@/types'
import { getPostBySlug, listPhotos, listPosts } from './db'
import type { Post, PostLang } from './types'

export async function getPublishedPosts (lang: PostLang): Promise<Post[]> {
  return listPosts({ lang, publishedOnly: true })
}

export async function getPublishedPost (slug: string, lang: PostLang): Promise<Post | null> {
  return getPostBySlug(slug, lang, true)
}

export async function getGalleryPhotos (): Promise<Photo[]> {
  const rows = await listPhotos()
  return rows.map((photo) => ({
    src: photo.src,
    alt: photo.alt,
    caption: photo.caption,
    location: photo.location,
    date: photo.date,
  }))
}

export async function renderPostHtml (body: string): Promise<string> {
  return marked.parse(body, { async: true })
}
