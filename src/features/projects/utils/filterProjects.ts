import type { Project } from "../types"

export type ProjectsFilter = {
  query?: string
  tags?: string[]
  category?: Project["category"] | "all"
  featuredOnly?: boolean
}

export function filterProjects(all: Project[], f: ProjectsFilter) {
  const query = f.query?.trim().toLowerCase() ?? ""
  const tags = (f.tags ?? []).map((t) => t.toLowerCase())
  const category = f.category ?? "all"

  return all.filter((p) => {
    if (f.featuredOnly && !p.featured) return false
    if (category !== "all" && p.category !== category) return false

    if (tags.length > 0) {
      const pt = new Set(p.tags.map((t) => t.toLowerCase()))
      for (const t of tags) if (!pt.has(t)) return false
    }

    if (!query) return true

    const hay = [p.title, p.subtitle, p.description, ...(p.highlights ?? []), ...p.tags, ...p.stack]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return hay.includes(query)
  })
}

