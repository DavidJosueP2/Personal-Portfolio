import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import eeasaLogo from "@/assets/img/experience/eeasa.webp"
import kronhosLogo from "@/assets/img/experience/kronhos.webp"
import angularLogo from "@/assets/img/tech/Angular.webp"
import reactLogo from "@/assets/img/tech/React.webp"
import javaLogo from "@/assets/img/tech/Java.webp"
import springLogo from "@/assets/img/tech/Spring.webp"
import oracleLogo from "@/assets/img/tech/Oracle.webp"
import sqlServerLogo from "@/assets/img/tech/Microsoft SQL Server.webp"
import azureLogo from "@/assets/img/tech/azure.webp"
import powerBiLogo from "@/assets/img/tech/Power BI.svg"
import swaggerLogo from "@/assets/img/tech/Swagger.webp"
import openApiLogo from "@/assets/img/tech/OpenAPI.webp"
import junitLogo from "@/assets/img/tech/JUnit.webp"
import playwrightLogo from "@/assets/img/tech/Playwrite.webp"
import dockerLogo from "@/assets/img/tech/Docker.webp"
import { afterHeroIntro } from "@/lib/hero-intro"
import { createExperienceVine } from "./experience-vine"
import { setupExperienceArrival } from "./hero/experience-arrival"
import "./experience-timeline.css"

const backend = [
  { name: "Java", icon: javaLogo },
  { name: "Spring Boot", icon: springLogo },
]

const experience = [
  {
    id: "kronhos",
    name: "Kronhos ERP",
    company: "Kronhos Business Solutions Cía. Ltda.",
    focus: "ERP development and business intelligence",
    logo: kronhosLogo,
    start: "2025-12",
    startLabel: "Dec 2025",
    end: "2026-06",
    endLabel: "Jun 2026",
    detail: "6 months",
    contributions: [
      {
        title: "Custom ERP modules.",
        description: "Built frontend features and the backend logic that supports their business workflows.",
      },
      {
        title: "REST APIs and integrations.",
        description: "Developed Java and Spring Boot endpoints that connected ERP screens to business logic and data.",
      },
      {
        title: "SQL Server and ERP performance.",
        description: "Worked with the data behind ERP workflows, improved application performance, and supported a database migration.",
      },
      {
        title: "Azure environments.",
        description: "Worked with the servers and application environments that host the ERP on Azure.",
      },
      {
        title: "Power BI reporting.",
        description: "Built reports and dashboards that made ERP data easier to explore and use for business analysis.",
      },
    ],
    tools: [
      ...backend,
      { name: "SQL Server", icon: sqlServerLogo },
      { name: "Azure", icon: azureLogo },
      { name: "Power BI", icon: powerBiLogo },
      { name: "Swagger", icon: swaggerLogo },
      { name: "JUnit", icon: junitLogo },
      { name: "Docker", icon: dockerLogo },
    ],
  },
  {
    id: "eeasa",
    name: "EEASA",
    company: "Empresa Eléctrica Ambato Regional Centro Norte S.A.",
    focus: "Electricity meter incidents",
    logo: eeasaLogo,
    start: "2025",
    end: "2026",
    detail: "Freelance project · Several months",
    contributions: [
      {
        title: "Angular and React interfaces.",
        description: "Built screens for the web application used to manage electricity meter incidents.",
      },
      {
        title: "Java and Spring Boot services.",
        description: "Refactored the backend logic that handles meter incidents and supports the frontend workflow.",
      },
      {
        title: "Incident data modeling.",
        description: "Reworked the entities the application uses to represent and store incident records.",
      },
      {
        title: "Validation rules.",
        description: "Updated the checks the system applies before accepting incident data.",
      },
      {
        title: "Oracle database.",
        description: "Handled incident records in Oracle while updating the application’s data model.",
      },
    ],
    tools: [
      { name: "Angular", icon: angularLogo },
      { name: "React", icon: reactLogo },
      ...backend,
      { name: "Oracle", icon: oracleLogo },
      { name: "OpenAPI", icon: openApiLogo },
      { name: "Playwright", icon: playwrightLogo },
      { name: "Docker", icon: dockerLogo },
    ],
  },
]

export function ExperienceTimeline() {
  const rootRef = useRef<HTMLElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const vineRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => afterHeroIntro(() => {
    const root = rootRef.current
    const sheet = sheetRef.current
    const content = contentRef.current
    const canvas = vineRef.current
    if (!root || !sheet || !content || !canvas) return

    const motion = gsap.matchMedia(root)
    const vine = createExperienceVine(canvas)
    let vineReady = false
    const fitVine = () => { if (vineReady) vine.fit() }
    const vineSize = new ResizeObserver(fitVine)
    vineSize.observe(canvas)
    const vineVisibility = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      vineReady = true
      fitVine()
      vineVisibility.disconnect()
    }, { rootMargin: "100% 0px" })
    vineVisibility.observe(canvas)
    motion.add("(prefers-reduced-motion: reduce)", () => vine.paint(1))

    motion.add("(prefers-reduced-motion: no-preference)", (context) => {
      let disposed = false
      let workVisibility: IntersectionObserver | undefined
      let reset: (() => void) | undefined
      vine.paint(0)

      void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        if (disposed) return
        gsap.registerPlugin(ScrollTrigger)
        context.add(() => {
          const question = content.querySelector(".experience-question")
          const track = content.querySelector(".experience-roles")
          root.dataset.experienceReady = ""
          const resetArrival = setupExperienceArrival(root, ScrollTrigger)
          reset = () => {
            delete root.dataset.experienceReady
            resetArrival()
          }

          workVisibility = new IntersectionObserver(([entry]) => {
            if (disposed || !entry.isIntersecting) return
            workVisibility?.disconnect()
            context.add(() => {
              gsap.fromTo(question, { x: 42, opacity: 0.15 }, {
                x: 0, opacity: 1, ease: "power2.out",
                scrollTrigger: { trigger: question, start: "top 94%", end: "top 66%", scrub: 0.2 },
              })

              const paintVine = ({ progress }: { progress: number }) => vine.paint(progress)
              ScrollTrigger.create({
                trigger: track,
                start: "top 85%",
                end: "bottom 65%",
                onRefreshInit: fitVine,
                onRefresh: paintVine,
                onUpdate: paintVine,
              })

              for (const job of content.querySelectorAll<HTMLElement>(".experience-role")) {
                gsap.timeline({
                  defaults: { ease: "power2.out" },
                  scrollTrigger: { trigger: job, start: "top 97%", end: "top 66%", scrub: 0.2 },
                })
                  .fromTo(job.querySelector(".experience-name-text"), { yPercent: 91 }, { yPercent: 0, duration: 0.8 }, 0.04)
              }

              for (const text of content.querySelectorAll<HTMLElement>("[data-experience-text]")) {
                gsap.fromTo(text, {
                  y: 14, opacity: 0.12, clipPath: "inset(0 0 100% 0)",
                }, {
                  y: 0, opacity: 1, clipPath: "inset(-0.2em -0.25em -0.2em -0.25em)",
                  ease: "power2.out",
                  scrollTrigger: { trigger: text, start: "top 98%", end: "top 79%", scrub: 0.18 },
                })
              }
            })
          }, { rootMargin: "100% 0px" })
          workVisibility.observe(content)
        })
      }).catch((error: unknown) => {
        vine.paint(1)
        console.error("Could not start the experience animation.", error)
      })

      return () => {
        disposed = true
        workVisibility?.disconnect()
        reset?.()
      }
    })

    return () => {
      vineSize.disconnect()
      vineVisibility.disconnect()
      motion.revert()
    }
  }), [])

  return (
    <section ref={rootRef} id="experience" className="experience" aria-labelledby="experience-heading" data-scene-handoff data-inverse-cursor-surface>
      <div ref={sheetRef} className="experience-sheet" aria-hidden="true" />
      <div ref={contentRef} className="experience-content">
        <header className="experience-masthead">
          <h2 id="experience-heading">Hi there<span aria-hidden="true">.</span></h2>
          <p>I’m a full stack developer who <em className="font-serif-italic">listens first</em> and builds software that makes people’s work easier.</p>
        </header>

        <div className="experience-work">
        <div className="experience-question">
          <span className="experience-question-mark" aria-hidden="true" />
          <p id="experience-work-heading"><strong>Where have I </strong><em className="font-serif-italic">worked?</em></p>
        </div>

        <div className="experience-timeline">
          <canvas ref={vineRef} className="experience-vine" aria-hidden="true" />
          <ol className="experience-roles" role="list" aria-labelledby="experience-work-heading">
            {experience.map((job) => (
              <li key={job.id}>
                <article className="experience-role" aria-labelledby={`experience-${job.id}`}>
                  <header className="experience-job-heading">
                    <div>
                      <div className="experience-company">
                        <img src={job.logo} alt="" width={44} height={44} loading="lazy" decoding="async" />
                        <h3 id={`experience-${job.id}`}><span className="experience-name-text">{job.name}</span></h3>
                      </div>
                      <p className="experience-company-name" data-experience-text>{job.company}</p>
                      <p className="experience-job-title" data-experience-text>Full Stack Developer</p>
                    </div>
                    <div className="experience-date">
                      <p data-experience-text>
                        <time className="whitespace-nowrap" dateTime={job.start}>{job.startLabel ?? job.start}</time>
                        {"–"}<wbr />
                        <time className="whitespace-nowrap" dateTime={job.end}>{job.endLabel ?? job.end}</time>
                      </p>
                      <p data-experience-text>{job.detail}</p>
                    </div>
                  </header>
                  <div className="experience-job-body">
                    <div className="experience-result">
                      <p className="experience-focus font-serif-italic" data-experience-text>{job.focus}</p>
                      <ul role="list" className="experience-contributions">
                        {job.contributions.map(({ title, description }) => (
                          <li key={title} data-experience-text><strong>{title}</strong> {description}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="experience-stack">
                      <h4 data-experience-text>Stack used</h4>
                      <ul role="list" className="experience-tools" aria-label={`Technologies at ${job.name}`}>
                        {job.tools.map(({ name, icon }) => (
                          <li key={name} data-experience-text>
                            <img src={icon} alt="" width={19} height={19} loading="lazy" decoding="async" />
                            {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
        </div>
      </div>
    </section>
  )
}
