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
      blog: 'Blog',
      overlayTitle: 'Navegación',
      overlayClose: 'Cerrar menú',
      overlayHint: 'Desliza hacia abajo para abrir el menú',
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
    blog: {
      title: 'Blog',
      subtitle: 'Notas y artículos',
      empty: 'Todavía no hay publicaciones.',
      back: 'Volver al blog',
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
      goToBlog: 'Ir al blog',
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
      blog: 'Blog',
      overlayTitle: 'Navigation',
      overlayClose: 'Close menu',
      overlayHint: 'Scroll down to open the menu',
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
    blog: {
      title: 'Blog',
      subtitle: 'Notes and articles',
      empty: 'No posts yet.',
      back: 'Back to blog',
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
      goToBlog: 'Go to blog',
      toggleTheme: 'Toggle theme',
      navigation: 'Navigation',
    },
  },
} as const
