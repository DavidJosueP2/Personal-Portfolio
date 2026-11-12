import { useEffect, useRef } from "react"
import { setupRevealList } from "@/lib/gsap-reveal-list"

const experience = [
  {
    org: "Kronhos ERP",
    title: "Full Stack Developer",
    period: "2025–2026 · 6 months",
    engagement: "Professional experience",
    location: "Ambato, Ecuador",
    contributions: [
      { action: "Built and integrated REST APIs", detail: "with Java and Spring Boot for the ERP frontend." },
      { action: "Worked with SQL databases", detail: "as part of backend and frontend feature development." },
      { action: "Created Power BI dashboards", detail: "and analyzed data for reporting." },
    ],
    stack: ["Java", "Spring Boot", "SQL", "Power BI"],
  },
  {
    org: "EEASA",
    title: "Backend Developer",
    period: "2025",
    engagement: "Freelance project",
    location: "Ambato, Ecuador",
    contributions: [
      { action: "Refactored a Spring Boot system", detail: "used to manage electricity meter incidents." },
      { action: "Updated the incident entities", detail: "and refined the rules used to validate incident data." },
    ],
    stack: ["Spring Boot"],
  },
] as const

export function ExperienceTimeline() {
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (list) return setupRevealList(list)
  }, [])

  return (
    <section id="experience" aria-labelledby="experience-heading" className="mx-auto w-full max-w-6xl scroll-mt-22 px-6 pb-12 pt-4 sm:pb-16 sm:pt-8">
      <h2 id="experience-heading" className="font-display text-4xl leading-none text-[#ece9e2] sm:text-5xl">
        Experience
      </h2>

      <ol ref={listRef} className="portfolio-glass mt-7 divide-y divide-white/10 rounded-2xl border border-white/12 sm:mt-8 md:backdrop-blur-xs">
        {experience.map((role) => (
          <li
            key={role.org}
            data-reveal-item
            className="grid gap-5 px-5 py-6 sm:px-7 sm:py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] md:gap-10 lg:px-9"
          >
            <div className="min-w-0">
              <h3 className="font-display text-[1.7rem] leading-tight text-[#ece9e2] sm:text-3xl">{role.org}</h3>
              <p className="mt-1.5 text-base font-medium text-white/85">{role.title}</p>
              <div className="mt-3 space-y-1 text-sm leading-relaxed text-[#afb7bd]">
                <p className="tabular-nums">{role.period}</p>
                <p>{role.engagement} · {role.location}</p>
              </div>
            </div>

            <div className="min-w-0">
              <ul className="list-disc space-y-2.5 pl-4 text-sm leading-relaxed text-[#afb7bd] marker:text-[rgb(var(--accent-rgb)_/_0.8)] sm:text-base">
                {role.contributions.map(({ action, detail }) => (
                  <li key={action} className="pl-1">
                    <strong className="font-semibold text-[#ece9e2]">{action}</strong>{" "}{detail}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-white/8 pt-3 text-sm leading-relaxed text-[#afb7bd]">
                {role.stack.join(" · ")}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
