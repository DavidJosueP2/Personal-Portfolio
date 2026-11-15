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
    <section id="experience" aria-labelledby="experience-heading" className="portfolio-container portfolio-section border-t border-ink/12">
      <h2 id="experience-heading" className="portfolio-section-title text-heading">
        Experience
      </h2>

      <ol ref={listRef} className="mt-7 divide-y divide-ink/12 border-y border-ink/12 md:mt-10">
        {experience.map((role) => (
          <li
            key={role.org}
            data-reveal-item
            className="grid gap-5 py-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-10 md:py-8"
          >
            <div className="min-w-0">
              <h3 className="font-display text-[clamp(1.65rem,3vw,3.25rem)] leading-tight tracking-tight text-heading">{role.org}</h3>
              <p className="mt-1.5 text-base font-medium text-ink/85">{role.title}</p>
              <div className="mt-3 space-y-1 text-sm leading-relaxed text-copy">
                <p className="tabular-nums">{role.period}</p>
                <p>{role.engagement} · {role.location}</p>
              </div>
            </div>

            <div className="min-w-0 max-w-[68ch]">
              <ul className="list-disc space-y-2.5 pl-4 text-sm leading-relaxed text-copy marker:text-accent-ink sm:text-base">
                {role.contributions.map(({ action, detail }) => (
                  <li key={action} className="pl-1">
                    <strong className="font-semibold text-heading">{action}</strong>{" "}{detail}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-ink/8 pt-3 text-sm leading-relaxed text-copy">
                {role.stack.join(" · ")}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
