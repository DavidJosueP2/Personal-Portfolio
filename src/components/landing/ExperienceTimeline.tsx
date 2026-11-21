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
import { setupRevealList } from "@/lib/gsap-reveal-list"
import { connectExperienceVines } from "./experience-vine"
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

  useEffect(() => afterHeroIntro(() => {
    const root = rootRef.current
    if (!root) return

    const stopVines = connectExperienceVines(root)
    const stopReveals = setupRevealList(root)
    const motion = gsap.matchMedia(root)

    motion.add("(prefers-reduced-motion: no-preference)", (context) => {
      let disposed = false
      let reset: (() => void) | undefined

      void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        if (disposed) return
        gsap.registerPlugin(ScrollTrigger)
        context.add(() => {
          root.dataset.experienceReady = ""
          const resetArrival = setupExperienceArrival(root, ScrollTrigger)
          reset = () => {
            delete root.dataset.experienceReady
            resetArrival()
          }
        })
      }).catch((error: unknown) => {
        console.error("Could not start the experience animation.", error)
      })

      return () => {
        disposed = true
        reset?.()
      }
    })

    return () => {
      motion.revert()
      stopReveals?.()
      stopVines()
    }
  }), [])

  return (
    <section ref={rootRef} id="experience" className="experience" aria-labelledby="experience-heading" data-scene-handoff data-inverse-cursor-surface data-nav-light>
      <div className="experience-sheet" aria-hidden="true" />
      <div className="experience-garden" aria-hidden="true">
        <canvas className="experience-vine experience-vine-crown" data-experience-vine="left" />
        <canvas className="experience-vine experience-vine-arch" data-experience-vine="right" />
        <canvas className="experience-vine experience-vine-trail" data-experience-vine="left" />
        <canvas className="experience-vine experience-vine-ledge" data-experience-vine="right" />
      </div>
      <div className="experience-content">
        <header className="experience-masthead">
          <h2 id="experience-heading">Hi <em className="font-serif-italic">there<span aria-hidden="true">.</span></em></h2>
          <p>I’m a full-stack developer who <em className="font-serif-italic">listens first</em> and enjoys talking with people, sharing ideas, and figuring things out together.</p>
        </header>

        <div className="experience-work">
          <div className="experience-question" data-reveal-item>
            <span className="experience-question-mark" aria-hidden="true" />
            <p id="experience-work-heading"><strong>Where have I </strong><em className="font-serif-italic">worked?</em></p>
          </div>
          <ol className="experience-roles" role="list" aria-labelledby="experience-work-heading">
            {experience.map((job) => (
              <li key={job.id}>
                <article className="experience-role" aria-labelledby={`experience-${job.id}`}>
                  <header className="experience-job-heading" data-reveal-item>
                    <div>
                      <div className="experience-company">
                        <img src={job.logo} alt="" width={44} height={44} loading="lazy" decoding="async" />
                        <h3 id={`experience-${job.id}`}>{job.name}</h3>
                      </div>
                      <p className="experience-company-name">{job.company}</p>
                      <p className="experience-job-title">Full Stack Developer</p>
                    </div>
                    <div className="experience-date">
                      <p>
                        <time className="whitespace-nowrap" dateTime={job.start}>{job.startLabel ?? job.start}</time>
                        {"–"}<wbr />
                        <time className="whitespace-nowrap" dateTime={job.end}>{job.endLabel ?? job.end}</time>
                      </p>
                      <p>{job.detail}</p>
                    </div>
                  </header>
                  <div className="experience-job-body">
                    <div className="experience-result" data-reveal-item>
                      <p className="experience-focus font-serif-italic">{job.focus}</p>
                      <ul role="list" className="experience-contributions">
                        {job.contributions.map(({ title, description }) => (
                          <li key={title}><strong>{title}</strong> {description}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="experience-stack" data-reveal-item>
                      <h4>Stack used</h4>
                      <ul role="list" className="experience-tools" aria-label={`Technologies at ${job.name}`}>
                        {job.tools.map(({ name, icon }) => (
                          <li key={name}>
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
    </section>
  )
}
