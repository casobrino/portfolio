export type SocialIcon = Record<string, string | any>

export interface PortfolioProject {
  title: string
  description: string
  image: string
  tags: string[]
  links: {
    live?: string
    github?: string
  }
  year: number
  featured: boolean
}

export interface Photo {
  src: string
  alt: string
  caption: string
  location: string
  date: string
}
