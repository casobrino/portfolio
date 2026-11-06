import { ui, defaultLang, pages } from './ui'

export function getLangFromUrl (url: URL) {
  const firstSegment = url.pathname.split('/')[1]
  if (firstSegment === 'en') return 'en'
  return defaultLang
}

export function getRoutes (lang: keyof typeof ui) {
  if (lang === 'en') {
    return {
      home: '/en/',
      cv: '/en/cv',
      portfolio: '/en/portfolio',
      photos: '/en/photos',
      blog: '/en/blog',
    }
  }

  return {
    home: '/',
    cv: '/cv',
    portfolio: '/portfolio',
    photos: '/fotos',
    blog: '/blog',
  }
}

export function getPageTranslations (lang: keyof typeof pages) {
  return pages[lang]
}

export function useTranslations (lang: keyof typeof ui) {
  return function t (key: string) {
    const value = key.split('.').reduce((obj, k) => (obj as any)?.[k], ui[lang])
    if (value !== undefined) return value
    // fallback al idioma por defecto
    return key.split('.').reduce((obj, k) => (obj as any)?.[k], ui[defaultLang])
  }
}
