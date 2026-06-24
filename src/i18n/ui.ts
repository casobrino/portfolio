export const languages = {
  en: 'English',
  es: 'Español',
}
import CV_ES from '@cv_es'
import CV_EN from '@cv_en'

export const defaultLang = 'es'

export const ui = {
  es: CV_ES,
  en: CV_EN
} as const

export const pages = {
  es: {
    nav: {
      home: 'Inicio',
      cv: 'CV',
      portfolio: 'Portafolio',
      photos: 'Fotos',
    },
    home: {
      viewCv: 'Ver mi CV completo',
    },
    portfolio: {
      title: 'Portafolio',
      subtitle: 'Proyectos en los que he trabajado',
      viewLive: 'Ver demo',
      viewCode: 'Ver código',
      featured: 'Destacado',
      viewAll: 'Ver todos los proyectos',
    },
    photos: {
      title: 'Fotografía',
      subtitle: 'Capturas que me han gustado',
      close: 'Cerrar',
      viewAll: 'Ver toda la galería',
    },
    theme: {
      toggle: 'Cambiar tema',
      light: 'Modo claro',
      dark: 'Modo oscuro',
    },
    commands: {
      goToHome: 'Ir al inicio',
      goToCv: 'Ir al CV',
      goToPortfolio: 'Ir al portafolio',
      goToPhotos: 'Ir a fotos',
      toggleTheme: 'Cambiar tema',
      navigation: 'Navegación',
    },
  },
  en: {
    nav: {
      home: 'Home',
      cv: 'CV',
      portfolio: 'Portfolio',
      photos: 'Photos',
    },
    home: {
      viewCv: 'View my full CV',
    },
    portfolio: {
      title: 'Portfolio',
      subtitle: 'Projects I have worked on',
      viewLive: 'View demo',
      viewCode: 'View code',
      featured: 'Featured',
      viewAll: 'View all projects',
    },
    photos: {
      title: 'Photography',
      subtitle: 'Shots I have enjoyed',
      close: 'Close',
      viewAll: 'View full gallery',
    },
    theme: {
      toggle: 'Toggle theme',
      light: 'Light mode',
      dark: 'Dark mode',
    },
    commands: {
      goToHome: 'Go to home',
      goToCv: 'Go to CV',
      goToPortfolio: 'Go to portfolio',
      goToPhotos: 'Go to photos',
      toggleTheme: 'Toggle theme',
      navigation: 'Navigation',
    },
  },
} as const
