import { ui, defaultLang } from './ui'

export function getLangFromUrl (url: URL) {
  const [, lang] = url.pathname.split('/')
  if (lang in ui) return lang as keyof typeof ui
  return defaultLang
}

export function useTranslations (lang: keyof typeof ui) {
  return function t (key: string) {
    const value = key.split('.').reduce((obj, k) => (obj as any)?.[k], ui[lang])
    if (value !== undefined) return value
    // fallback al idioma por defecto
    return key.split('.').reduce((obj, k) => (obj as any)?.[k], ui[defaultLang])
  }
}
