import type { Photo, PortfolioProject } from '@/types'

export type AdminFileKey = 'photos' | 'portfolio' | 'cv_es' | 'cv_en'

export interface AdminData {
  photos: Photo[]
  portfolio: PortfolioProject[]
  cv_es: Record<string, unknown>
  cv_en: Record<string, unknown>
}

const PASSWORD_KEY = 'admin-password'

export function getStoredPassword (): string {
  return sessionStorage.getItem(PASSWORD_KEY) ?? ''
}

export function setStoredPassword (password: string) {
  sessionStorage.setItem(PASSWORD_KEY, password)
}

export async function saveToServer (file: AdminFileKey, data: unknown, password: string) {
  const response = await fetch('/api/admin/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
    },
    body: JSON.stringify({ file, data }),
  })

  const result = await response.json()
  if (!response.ok) {
    throw new Error(result.error ?? 'No se pudo guardar')
  }

  return result
}

export function downloadJson (filename: string, data: unknown) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function emptyPhoto (): Photo {
  return {
    src: '/photos/nueva-foto.jpg',
    alt: '',
    caption: '',
    location: '',
    date: new Date().toISOString().slice(0, 7),
  }
}

export function emptyProject (): PortfolioProject {
  return {
    title: '',
    description: '',
    image: '/portfolio/nuevo-proyecto.svg',
    tags: [],
    links: {},
    year: new Date().getFullYear(),
    featured: false,
  }
}
