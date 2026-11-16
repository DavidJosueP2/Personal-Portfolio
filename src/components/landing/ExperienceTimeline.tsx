import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import eeasaLogo from "@/assets/img/experience/eeasa.png"
import kronhosLogo from "@/assets/img/experience/kronhos.png"
import "./experience-timeline.css"

const experience = [
  {
    id: "kronhos",
    name: "Kronhos ERP",
    company: "Kronhos Business Solutions Cía. Ltda.",
    logo: kronhosLogo,
    role: "Full Stack Developer",
    start: "2025",
    end: "2026",
    duration: "6 months",
    passages: [
      <>I built <em className="font-serif-italic">frontend modules</em> for the ERP and connected them to REST APIs I wrote in Java and Spring Boot. I used SQL to support those workflows.</>,
      <>I <em className="font-serif-italic">improved ERP performance</em>, helped migrate a database, and built reports and Power BI dashboards.</>,
    ],
    tech: "Java · Spring Boot · SQL · Power BI",
  },
  {
    id: "eeasa",
    name: "EEASA",
    company: "Empresa Eléctrica Ambato Regional Centro Norte S.A.",
    logo: eeasaLogo,
    role: "Backend Developer",
    start: "2025",
    passages: [
      <>I refactored the Spring Boot backend for <em className="font-serif-italic">electricity meter incidents</em>, updating the incident data model and its validation rules.</>,
    ],
    tech: "Spring Boot",
  },
] as const

export function ExperienceTimeline() {
  const rootRef = useRef<HTMLElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const sheet = sheetRef.current
    const heading = headingRef.current
    if (!root || !sheet || !heading) return

    const motion = gsap.matchMedia(root)
    motion.add("(prefers-reduced-motion: no-preference)", (context) => {
      let disposed = false
      let reset: (() => void) | undefined

      void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        if (disposed) return
        gsap.registerPlugin(ScrollTrigger)
        context.add(() => {
          const panel = root.closest<HTMLElement>("[data-stack-panel]") ?? root
          const easeHeading = gsap.parseEase("power1.out")
          const clamp = gsap.utils.clamp(0, 1)
          let width = 0
          let originX = 0
          let originY = 0
          let radius = 0
          let overhang = 0

          const measure = () => {
            width = root.clientWidth
            const height = document.documentElement.clientHeight
            const compact = width <= 760
            originX = width * (compact ? 0.52 : 0.5)
            originY = height * (compact ? 0.94 : 1.01)
            radius = Math.hypot(Math.max(originX, width - originX), originY) + 4
            overhang = -sheet.offsetTop
          }

          const render = ({ progress, start, end }: { progress: number; start: number; end: number }) => {
            const panelTop = (end - start) * (1 - progress)
            if (panelTop < 1) {
              sheet.style.clipPath = ""
              heading.style.transform = ""
              return
            }

            // The origin stays near the viewport floor while the sheet moves in normal flow.
            const centerY = overhang + originY - panelTop
            const opening = radius * progress ** 1.04
            sheet.style.clipPath = `circle(${opening}px at ${originX}px ${centerY}px)`

            const headingProgress = easeHeading(clamp((progress - 0.39) / 0.61))
            heading.style.transform = `translate3d(${width * 0.88 * (1 - headingProgress)}px, ${24 * (1 - headingProgress)}px, 0)`
          }

          root.dataset.experienceReady = ""
          reset = () => {
            delete root.dataset.experienceReady
            sheet.style.removeProperty("clip-path")
            heading.style.removeProperty("transform")
          }

          ScrollTrigger.create({
            trigger: panel,
            start: "top bottom",
            end: "top top",
            onUpdate: render,
            onRefresh: (trigger) => {
              measure()
              render(trigger)
            },
          })

          for (const chapter of root.querySelectorAll<HTMLElement>("[data-experience-chapter]")) {
            gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: { trigger: chapter, start: "top 97%", end: "top 36%", scrub: 0.23 },
            })
              .from(chapter.querySelector("[data-experience-name]"), { yPercent: 105, duration: 0.72 }, 0)
              .from(chapter.querySelector("[data-experience-role]"), { y: 16, opacity: 0.4, duration: 0.56 }, 0.18)
              .from(chapter.querySelectorAll("[data-experience-copy]"), { y: 20, stagger: 0.13, duration: 0.74 }, 0.27)
          }
        })
      }).catch((error: unknown) => console.error("Could not start the experience animation.", error))

      return () => {
        disposed = true
        reset?.()
      }
    })

    return () => motion.revert()
  }, [])

  return (
    <section ref={rootRef} id="experience" className="experience" aria-labelledby="experience-heading" data-nav-light data-circular-reveal>
      <header className="experience-opening" data-section-motion="heading">
        <div ref={sheetRef} className="experience-sheet">
          <div className="experience-masthead experience-width">
            <h2 ref={headingRef} id="experience-heading" className="experience-heading">Experience</h2>
          </div>
        </div>
      </header>

      <div className="experience-work">
        <ol role="list" className="experience-roles experience-width">
          {experience.map((job) => (
            <li key={job.id}>
              <article className="experience-chapter" data-experience-chapter data-company={job.id} aria-labelledby={`experience-${job.id}`}>
                <header className="experience-chapter-header">
                  <div>
                    <div className="experience-name-mask">
                      <div className="experience-name" data-experience-name>
                        <h3 id={`experience-${job.id}`}>{job.name}</h3>
                        <img src={job.logo} alt="" width={128} height={128} loading="lazy" decoding="async" />
                      </div>
                    </div>
                    <p className="experience-company-name">{job.company}</p>
                  </div>
                  <div className="experience-role" data-experience-role>
                    <p>{job.role}</p>
                    <p className="experience-date">
                      <time dateTime={job.start}>{job.start}</time>
                      {"end" in job && <>–<time dateTime={job.end}>{job.end}</time> · {job.duration}</>}
                    </p>
                    <p className="experience-technologies">{job.tech}</p>
                  </div>
                </header>

                <div className="experience-feature">
                  {job.passages.map((passage, index) => (
                    <p key={index} className="experience-passage" data-experience-copy data-section-motion="body">{passage}</p>
                  ))}
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
