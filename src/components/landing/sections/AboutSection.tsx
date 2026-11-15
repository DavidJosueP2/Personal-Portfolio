import { useEffect, useRef } from "react"
import { BookOpen, Code2, Cpu, GraduationCap, MapPin } from "lucide-react"
import { setupRevealList } from "@/lib/gsap-reveal-list"

const background = [
  {
    id: "education",
    heading: "Education",
    entries: [
      { title: "Software Engineering", detail: "Technical University of Ambato, 7th semester.", icon: GraduationCap },
      { title: "Continuous Learning", detail: "Certifications, self-driven projects, and hands-on building.", icon: BookOpen },
    ],
  },
  {
    id: "certs",
    heading: "Certificates",
    entries: [
      { title: "Spring Boot Programming Course", detail: "Udemy · 2025", icon: Code2 },
      { title: "ESP32 Microcontroller Programming Course", detail: "Technical University of Ambato · 2025", icon: Cpu },
    ],
  },
]

export function AboutSection() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (root) return setupRevealList(root)
  }, [])

  return (
    <section ref={rootRef} id="about" aria-labelledby="about-heading" className="portfolio-section portfolio-contrast-section">
      <div className="portfolio-container">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-end md:gap-10">
          <div data-reveal-item data-section-motion="heading">
            <h2 id="about-heading" className="font-display text-3xl leading-none tracking-tight text-heading sm:text-4xl">About</h2>
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-copy">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              Ambato, Ecuador
            </p>
            <p className="mt-6 max-w-[26ch] text-balance font-display text-[clamp(1.875rem,4.2vw,4rem)] leading-[1.04] tracking-[-0.035em] text-heading md:mt-9">
              I'm David Barragán, a full-stack engineer with a backend focus.
            </p>
          </div>

          <div data-reveal-item data-section-motion="body" className="min-w-0 max-w-[62ch] space-y-4 text-base leading-relaxed text-copy lg:text-lg">
            <p>
              I work mainly with Java, Spring Boot, REST APIs, microservices, and SQL, including distributed databases.
            </p>
            <p>
              I care about clean architecture, validation, automated testing, and CI/CD.
              On the frontend, I build fast interfaces where motion is used with intention.
            </p>
          </div>
        </div>

        <div className="mt-9 grid gap-x-10 gap-y-7 border-t border-ink/15 pt-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:pt-8 lg:mt-12">
          {background.map(({ id, heading, entries }) => (
            <div
              key={id}
              id={id}
              data-reveal-item
              data-section-motion="body"
              className="min-w-0 scroll-mt-24 last:border-t last:border-ink/15 last:pt-5 md:last:border-t-0 md:last:pt-0"
            >
              <h3 className="font-display text-[1.35rem] leading-tight text-heading md:text-2xl">{heading}</h3>
              <ul className="mt-2 max-w-[62ch] divide-y divide-ink/12">
                {entries.map(({ title, detail, icon: Icon }) => (
                  <li key={title} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2.5 py-3.5 last:pb-0 sm:gap-3">
                    <Icon aria-hidden="true" className="mt-0.5 size-[1.125rem] text-copy" />
                    <div className="min-w-0 text-sm leading-snug">
                      <p className="font-semibold text-ink/90">{title}</p>
                      <p className="mt-1 text-ink/70">{detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
