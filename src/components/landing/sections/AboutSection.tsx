import { useEffect, useRef } from "react"
import { BookOpen, Code2, Cpu, GraduationCap, MapPin } from "lucide-react"
import { prefersReducedMotion } from "@/lib/motion"
import { setupReveal } from "@/lib/gsap-reveal"

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
    if (!root || prefersReducedMotion()) return
    return setupReveal(root, { y: 14, stagger: 0.07 })
  }, [])

  return (
    <section ref={rootRef} id="about" aria-labelledby="about-heading" className="portfolio-container scroll-mt-7 py-20">
      <div className="portfolio-glass rounded-3xl border border-white/10 p-5 sm:p-8 md:p-10 md:backdrop-blur-xs">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-start md:gap-8 lg:gap-10">
          <div data-reveal>
            <h2 id="about-heading" className="font-display text-4xl leading-none text-[#ece9e2] lg:text-5xl">About</h2>
            <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--accent-rgb,52_211_153))] sm:text-sm">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              Ambato, Ecuador
            </p>
          </div>

          <div data-reveal className="min-w-0 space-y-2.5 text-sm leading-relaxed text-white/75">
            <p className="text-lg font-medium leading-snug text-[#ece9e2] sm:text-xl">
              I'm David Barragán, a full-stack engineer with a backend focus.
            </p>
            <p className="max-w-[67ch]">
              I work mainly with Java, Spring Boot, REST APIs, microservices, and SQL, including distributed databases.
            </p>
            <p className="max-w-[67ch]">
              I care about clean architecture, validation, automated testing, and CI/CD.
              On the frontend, I build fast interfaces where motion is used with intention.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-x-8 gap-y-6 border-t border-white/12 pt-6 md:grid-cols-2 lg:mt-9 lg:gap-x-10 lg:pt-8">
          {background.map(({ id, heading, entries }) => (
            <div
              key={id}
              id={id}
              data-reveal
              className="min-w-0 scroll-mt-24 last:border-t last:border-white/12 last:pt-5 md:last:border-l md:last:border-t-0 md:last:pl-8 md:last:pt-0 lg:last:pl-10"
            >
              <h3 className="font-display text-[1.35rem] leading-tight text-[#ece9e2] sm:text-2xl">{heading}</h3>
              <ul className="mt-2 divide-y divide-white/10">
                {entries.map(({ title, detail, icon: Icon }) => (
                  <li key={title} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2.5 py-3.5 last:pb-0 sm:gap-3">
                    <Icon aria-hidden="true" className="mt-0.5 size-[1.125rem] text-[rgb(var(--accent-rgb,52_211_153)_/_0.82)]" />
                    <div className="min-w-0 text-sm leading-snug">
                      <p className="font-semibold text-white/90">{title}</p>
                      <p className="mt-1 text-white/70">{detail}</p>
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
