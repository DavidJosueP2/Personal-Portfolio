import * as React from "react"
import { gsap } from "gsap"
import { MicroservicesDemo } from "@/components/landing/skills/MicroservicesDemo"
import { prefersReducedMotion } from "@/lib/motion"

type SkillIcon = { name: string; src: string }

type GroupKey = "Frontend" | "Backend" | "DevOps & Cloud" | "Databases" | "Tools"

function toName(filePath: string) {
  const base = filePath.split("/").pop() ?? filePath
  return base.replace(/\.(png|jpg|jpeg|webp|svg)$/i, "")
}

const iconModules = import.meta.glob<string>("@/assets/img/tech/*.{png,svg,jpg,jpeg,webp}", { eager: true, import: "default" })

const icons: SkillIcon[] = Object.entries(iconModules)
  .map(([path, src]) => ({ name: toName(path), src }))
  .sort((a, b) => a.name.localeCompare(b.name))

function displayName(raw: string) {
  if (/^PostgresSQL$/i.test(raw) || /^PostgreSQL$/i.test(raw)) return "PostgreSQL"
  if (/^Microsoft SQL Server$/i.test(raw)) return "Microsoft SQL Server"
  if (/^Tailwind CSS$/i.test(raw)) return "Tailwind CSS"
  if (/^TypeScript$/i.test(raw)) return "TypeScript"
  if (/^Spring$/i.test(raw)) return "Spring Boot"
  if (/^Kubernetes(?: \(\d+\))?$/i.test(raw)) return "Kubernetes"
  if (/^Azure$/i.test(raw)) return "Azure"
  return raw
}

function groupFor(name: string): GroupKey | null {
  const n = name.toLowerCase()

  if (["react", "angular", "typescript", "tailwind"].some((k) => n.includes(k))) return "Frontend"
  if (["spring", "java", "laravel", "php", "node", "nest"].some((k) => n.includes(k))) return "Backend"
  if (["docker", "kubernetes", "jenkins", "github actions", "azure", "aws"].some((k) => n.includes(k))) return "DevOps & Cloud"
  if (["mysql", "postgres", "oracle", "microsoft sql"].some((k) => n.includes(k))) return "Databases"

  // Everything else you want to showcase that isn't a language/framework goes here.
  // Keep Grafana/Prometheus here, plus other tools (GitHub, SonarQube, etc.) if desired.
  if (
    [
      "grafana",
      "prometheus",
      "github",
      // "github actions" moved to DevOps & Cloud
      "sonarqube",
      "junit",
      "openapi",
      "swagger",
      "playwright",
      "linux",
    ].some((k) => n.includes(k))
  )
    return "Tools"

  return null
}

const GROUP_ORDER: GroupKey[] = ["Frontend", "Backend", "DevOps & Cloud", "Databases", "Tools"]

function sortWithinGroup(group: GroupKey, items: SkillIcon[]) {
  // Backend: Enforced order: Spring Boot -> Java -> Laravel -> PHP
  if (group === "Backend") {
    const order = ["Spring", "Java", "Laravel", "PHP"]
    const rank = (name: string) => {
      const idx = order.findIndex((k) => k.toLowerCase() === name.toLowerCase())
      return idx === -1 ? 999 : idx
    }

    return [...items].sort((a, b) => {
      const ra = rank(a.name)
      const rb = rank(b.name)
      if (ra !== rb) return ra - rb
      return a.name.localeCompare(b.name)
    })
  }

  // DevOps: keep Jenkins next to GitHub Actions, Docker next to Kubernetes, etc.
  if (group === "DevOps & Cloud") {
    const order = ["Azure", "AWS", "Jenkins", "GitHub Actions", "Docker", "Kubernetes"]
    const rank = (name: string) => {
      const idx = order.findIndex((k) => k.toLowerCase() === name.toLowerCase())
      return idx === -1 ? 999 : idx
    }

    return [...items].sort((a, b) => {
      const ra = rank(displayName(a.name))
      const rb = rank(displayName(b.name))
      if (ra !== rb) return ra - rb
      return a.name.localeCompare(b.name)
    })
  }

  // Tools: keep Grafana+Prometheus, JUnit+SonarQube, Swagger+OpenAPI together.
  if (group === "Tools") {
    const order = [
      "Grafana",
      "Prometheus",
      "JUnit",
      "SonarQube",
      "Swagger",
      "OpenAPI",
      "GitHub",
      "Playwrite",
      "Linux",
    ]

    const rank = (name: string) => {
      const idx = order.findIndex((k) => k.toLowerCase() === name.toLowerCase())
      return idx === -1 ? 999 : idx
    }

    return [...items].sort((a, b) => {
      const ra = rank(displayName(a.name))
      const rb = rank(displayName(b.name))
      if (ra !== rb) return ra - rb
      return a.name.localeCompare(b.name)
    })
  }

  return items
}

function SkillChip({ icon }: Readonly<{ icon: SkillIcon }>) {
  return (
    <div
      data-skill-chip
      className="flex min-h-16 min-w-0 items-center gap-3 rounded-2xl border border-white/12 bg-[#101518]/60 px-3 py-3 transition-colors hover:bg-white/7 sm:px-4"
      title={displayName(icon.name)}
    >
      <img src={icon.src} alt="" className="size-7 shrink-0 object-contain sm:size-8" loading="lazy" />
      <span className="min-w-0 text-sm font-semibold leading-snug text-white/85">{displayName(icon.name)}</span>
    </div>
  )
}

function GroupSection({ title, items }: Readonly<{ title: GroupKey; items: SkillIcon[] }>) {
  if (items.length === 0) return null

  return (
    <div className="mt-7">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold tracking-[0.12em] text-white/80">{title}</h3>
        <span className="text-xs text-white/50">{items.length}</span>
      </div>
      <div className="mt-3 grid gap-2.5 min-[390px]:grid-cols-2 xl:grid-cols-3">
        {items.map((i) => (
          <SkillChip key={`${title}:${i.name}`} icon={i} />
        ))}
      </div>
    </div>
  )
}

export function SkillsSection() {
  const rootRef = React.useRef<HTMLElement | null>(null)
  const [query, setQuery] = React.useState("")

  React.useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const root = rootRef.current
    if (!root) return

    const header = Array.from(root.querySelectorAll<HTMLElement>("[data-skills-head]"))
    const chips = Array.from(root.querySelectorAll<HTMLElement>("[data-skill-chip]"))

    const cleanupMap = new WeakMap<Element, () => void>()

    // initial states
    gsap.set(header, { autoAlpha: 0, y: 10 })
    gsap.set(chips, { autoAlpha: 0, y: 8, scale: 0.99, filter: "blur(3px)" })

    const play = () => {
      gsap.killTweensOf([...header, ...chips])

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      tl.to(header, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.025 }, 0)

      // Wave reveal for chips: stagger by a pseudo-grid.
      const cols = Math.min(6, Math.max(2, Math.round(Math.sqrt(chips.length))))
      const order = chips
        .map((el, i) => ({ el, i, row: Math.floor(i / cols), col: i % cols }))
        .sort((a, b) => (a.row - b.row) || (a.col - b.col))
        .map((x) => x.el)

      tl.to(
        order,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.22,
          stagger: { each: 0.006, from: 0 },
          clearProps: "filter",
        },
        0.06
      )

      return tl
    }

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (!e?.isIntersecting) return
        play()
        io.disconnect()

        // After reveal, enable hover micro-interactions.
        for (const chip of chips) {
          const onEnter = () => {
            gsap.to(chip, { y: -3, duration: 0.25, ease: "power2.out" })
            gsap.to(chip, { boxShadow: "0 18px 60px rgba(0,0,0,0.35)", duration: 0.25, ease: "power2.out" })
          }
          const onLeave = () => {
            gsap.to(chip, { y: 0, duration: 0.3, ease: "power2.out" })
            gsap.to(chip, { boxShadow: "0 0 0 rgba(0,0,0,0)", duration: 0.35, ease: "power2.out" })
          }

          chip.addEventListener("mouseenter", onEnter)
          chip.addEventListener("mouseleave", onLeave)

          cleanupMap.set(chip, () => {
            chip.removeEventListener("mouseenter", onEnter)
            chip.removeEventListener("mouseleave", onLeave)
          })
        }
      },
      { root: null, rootMargin: "0px 0px -18% 0px", threshold: 0.12 }
    )

    io.observe(root)

    return () => {
      io.disconnect()
      gsap.killTweensOf([...header, ...chips])
      for (const chip of chips) cleanupMap.get(chip)?.()
    }
  }, [])

  const grouped = React.useMemo(() => {
    const q = query.trim().toLowerCase()

    const list = q.length === 0
      ? icons
      : icons.filter((i) => {
          const n = i.name.toLowerCase()
          const dn = displayName(i.name).toLowerCase()
          return n.includes(q) || dn.includes(q)
        })

    const map = new Map<GroupKey, SkillIcon[]>()
    for (const g of GROUP_ORDER) map.set(g, [])

    for (const icon of list) {
      const g = groupFor(icon.name)
      if (!g) continue
      map.set(g, [...(map.get(g) ?? []), icon])
    }

    return GROUP_ORDER.map((g) => ({ group: g, items: sortWithinGroup(g, map.get(g) ?? []) }))
  }, [query])

  const shown = grouped.reduce((acc, g) => acc + g.items.length, 0)

  return (
    <section ref={rootRef} id="skills" className="mx-auto grid w-full max-w-6xl gap-y-6 px-6 py-20 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-4">
      <div>
        <h2
          data-skills-head
          className="text-3xl font-extrabold text-white md:text-4xl"
        >
          <span className="text-[rgb(var(--accent-rgb,52_211_153))]">Skills</span>
        </h2>
        <p data-skills-head className="mt-2 max-w-prose text-sm text-white/70">
          What I don’t know, I{" "}
          <span className="text-[rgb(var(--accent-rgb,52_211_153))]">learn</span>. What I learn, I perfect.
        </p>
      </div>

      <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start lg:pt-3">
        <MicroservicesDemo />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <label className="text-sm text-white/70" htmlFor="skills-search">
            Filter
          </label>
          <input
            id="skills-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Spring, Java, Laravel, ..."
            className="h-10 w-full max-w-72 rounded-full border border-white/10 bg-black/30 px-4 text-sm text-white/85 outline-none placeholder:text-white/30 focus-visible:ring-[3px] focus-visible:ring-[rgb(var(--accent-rgb,52_211_153)_/_0.18)]"
            type="text"
          />
        </div>

        {grouped.map((g) => (
          <GroupSection key={g.group} title={g.group} items={g.items} />
        ))}

        <p className="mt-5 text-xs text-white/55">
          Showing <span className="font-semibold text-white/75">{shown}</span> technologies
          {query.trim().length ? (
            <>
              {" "}
              matching <span className="font-semibold text-white/75">“{query.trim()}”</span>
            </>
          ) : null}
          .
        </p>
      </div>
    </section>
  )
}
