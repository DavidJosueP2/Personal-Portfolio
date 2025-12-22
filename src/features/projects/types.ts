export type ProjectLinkKind = "repo" | "demo" | "docs" | "case-study"

export type ProjectLink = {
  kind: ProjectLinkKind
  label: string
  href: string
}

export type ProjectCategory =
  | "web"
  | "backend"
  | "mobile"
  | "devops"
  | "microservices"
  | "fullstack"
  | "other"

export type ProjectImage = {
  src: string
  alt: string
  kind?: "cover" | "gallery"
}

export type ProjectTech = {
  name: string
  iconSrc?: string
}

export type Project = {
  id: string
  title: string
  subtitle?: string
  description: string

  /** Short bullet highlights (architecture, infra, etc.) */
  highlights?: string[]

  /** Tech stack keywords (text) */
  stack: string[]

  /** Tech icons (optional). Helps make the card richer. */
  tech?: ProjectTech[]

  /** Search/filter tags. Keep them stable for future filters */
  tags: string[]

  category: ProjectCategory

  /** Featured projects (your current 4). */
  featured?: boolean
  featuredRank?: number

  images: {
    cover: ProjectImage
    gallery?: ProjectImage[]
  }

  links: ProjectLink[]

  /** Optional: status in time */
  status?: "live" | "offline" | "wip"
}
