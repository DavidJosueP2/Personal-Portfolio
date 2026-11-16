import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import eeasaLogo from "@/assets/img/experience/eeasa.png"
import kronhosLogo from "@/assets/img/experience/kronhos.png"
import portrait from "@/assets/img/experience/neon-me.webp"
import "./experience-timeline.css"

const experience = [
  {
    id: "kronhos",
    company: "Kronhos Business Solutions Cía. Ltda.",
    logo: kronhosLogo,
    role: "Full Stack Developer",
    start: "2025",
    end: "2026",
    duration: "6 months",
    contribution: <>
      <p>I built <strong>ERP modules</strong> on the frontend and connected them to REST APIs I wrote in Java and Spring&nbsp;Boot.</p>
      <p>I also <strong>improved ERP performance</strong>, helped migrate a database, and built reports and Power&nbsp;BI dashboards.</p>
    </>,
  },
  {
    id: "eeasa",
    company: "Empresa Eléctrica Ambato Regional Centro Norte S.A.",
    logo: eeasaLogo,
    role: "Backend Developer",
    start: "2025",
    contribution: <p>I refactored the Spring&nbsp;Boot backend for <strong>electricity meter incidents</strong>, updating the data model and its validation rules.</p>,
  },
] as const

export function ExperienceTimeline() {
  const rootRef = useRef<HTMLElement>(null)
  const photoRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const photo = photoRef.current
    if (!root || !photo) return

    const motion = gsap.matchMedia(root)
    motion.add("(prefers-reduced-motion: no-preference)", (context) => {
      let disposed = false
      void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        if (disposed) return
        gsap.registerPlugin(ScrollTrigger)
        context.add(() => {
          const panel = root.closest<HTMLElement>("[data-stack-panel]") ?? root
          gsap.from(photo, {
            y: 14,
            ease: "none",
            scrollTrigger: { trigger: panel, start: "top 75%", end: "top 12%", scrub: 0.45 },
          })
        })
      }).catch((error: unknown) => console.error("Could not start the experience animation.", error))

      return () => { disposed = true }
    })

    return () => motion.revert()
  }, [])

  return (
    <section ref={rootRef} id="experience" className="experience" aria-labelledby="experience-heading">
      <div className="experience-layout" data-section-motion="body">
        <div className="experience-opening">
          <h2 id="experience-heading" className="experience-heading">
            I’m David. I build <em className="font-serif-italic">web applications</em> for the work people do every day.
          </h2>
          <img ref={photoRef} className="experience-portrait" src={portrait} alt="" width={1536} height={1024} loading="lazy" decoding="async" />
        </div>

        <ol role="list" className="experience-roles">
          {experience.map((job) => (
            <li key={job.id}>
              <article className="experience-entry" aria-labelledby={`experience-${job.id}`}>
                <header className="experience-company">
                  <img src={job.logo} alt="" width={32} height={32} loading="lazy" decoding="async" data-company={job.id} />
                  <div>
                    <h3 id={`experience-${job.id}`}>{job.company}</h3>
                    <p className="experience-role">{job.role}</p>
                    <p className="experience-date">
                      <time dateTime={job.start}>{job.start}</time>
                      {"end" in job && <>–<time dateTime={job.end}>{job.end}</time> · {job.duration}</>}
                    </p>
                  </div>
                </header>
                <div className="experience-contribution">{job.contribution}</div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
