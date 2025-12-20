import type { Project, ProjectLink } from "../types"

function linkLabel(link: ProjectLink) {
  if (link.label) return link.label
  switch (link.kind) {
    case "repo":
      return "Repository"
    case "demo":
      return "Live demo"
    case "docs":
      return "Docs"
    case "case-study":
      return "Case study"
  }
}

function linkIcon(kind: ProjectLink["kind"]) {
  // simple text-only fallback; you can replace with icons later
  switch (kind) {
    case "repo":
      return "Code"
    case "demo":
      return "Demo"
    case "docs":
      return "Docs"
    case "case-study":
      return "Read"
  }
}

export function ProjectCard({ project }: Readonly<{ project: Project }>) {
  return (
    <article
      data-reveal-item
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur"
    >
      <div className="relative">
        <img
          src={project.images.cover.src}
          alt={project.images.cover.alt}
          className="h-44 w-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
          loading="lazy"
        />

        {/* Accent hover glow */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute -inset-24 bg-[radial-gradient(circle,rgba(0,255,170,0.20),transparent_60%)] [html[data-accent='red']_&]:bg-[radial-gradient(circle,rgba(255,60,90,0.24),transparent_60%)] [html[data-accent='cyan']_&]:bg-[radial-gradient(circle,rgba(34,211,238,0.24),transparent_60%)] [html[data-accent='violet']_&]:bg-[radial-gradient(circle,rgba(167,139,250,0.24),transparent_60%)] [html[data-accent='amber']_&]:bg-[radial-gradient(circle,rgba(251,191,36,0.24),transparent_60%)]" />
        </div>
      </div>

      <div className="p-6">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-white/55">
          {project.category.toUpperCase()}
          {project.status ? <span className="ml-2 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] text-white/60">{project.status}</span> : null}
        </p>

        <h3 className="mt-3 text-lg font-bold text-white">{project.title}</h3>
        {project.subtitle ? <p className="mt-1 text-sm text-white/70">{project.subtitle}</p> : null}

        <p className="mt-3 text-sm text-white/70">{project.description}</p>

        {project.highlights?.length ? (
          <ul className="mt-4 space-y-1 text-sm text-white/65">
            {project.highlights.slice(0, 3).map((h) => (
              <li key={h} className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {project.stack.slice(0, 6).map((t) => (
            <span key={t} className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-white/70">
              {t}
            </span>
          ))}
        </div>

        {project.links.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {project.links.map((l) => (
              <a
                key={`${project.id}-${l.kind}-${l.href}`}
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"
              >
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/55">{linkIcon(l.kind)}</span>
                <span>{linkLabel(l)}</span>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
