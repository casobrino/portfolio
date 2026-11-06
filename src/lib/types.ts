export type PostLang = 'es' | 'en'

export interface Post {
  id: string
  slug: string
  lang: PostLang
  title: string
  excerpt: string
  body: string
  published: boolean
  published_at: string | null
  updated_at: string
}

export interface PhotoRow {
  id: string
  public_id: string
  src: string
  alt: string
  caption: string
  location: string
  date: string
  sort_order: number
  created_at: string
}

export type PostInput = {
  slug: string
  lang: PostLang
  title: string
  excerpt?: string
  body?: string
  published?: boolean
  published_at?: string | null
}

export type PhotoInput = {
  public_id: string
  src: string
  alt?: string
  caption?: string
  location?: string
  date?: string
  sort_order?: number
}
