import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import "./stack-section.css"

const icons = import.meta.glob<string>("/src/assets/img/tech/*.{png,svg}", { eager: true, import: "default" })

function tech(file: string, name = file.replace(/\.[^.]+$/, "")) {
  return { name, icon: icons[`/src/assets/img/tech/${file}`] }
}

const layers = [
  {
    id: "stack-frontend",
    name: "Frontend",
    tools: [tech("Angular.png"), tech("React.png"), tech("Svelte.svg", "SvelteKit"), tech("Tailwind CSS.png"), tech("TypeScript.png")],
  },
  {
    id: "stack-backend",
    name: "Backend",
    tools: [tech("Spring.png", "Spring Boot"), tech("Java.png"), tech("Nest.js.png"), tech("Node.js.png"), tech("Laravel.png"), tech("PHP.png")],
  },
  {
    id: "stack-cloud",
    name: "Cloud & DevOps",
    tools: [tech("azure.png", "Azure"), tech("AWS.svg"), tech("Docker.png"), tech("Kubernetes (1).png", "Kubernetes"), tech("GitHub Actions.png"), tech("Jenkins.png"), tech("Cloudflare.svg"), tech("Amazon S3.svg")],
  },
  {
    id: "stack-data",
    name: "Databases",
    tools: [tech("PostgresSQL.png", "PostgreSQL"), tech("Microsoft SQL Server.png"), tech("MySQL.png"), tech("Oracle.png")],
  },
  {
    id: "stack-tooling",
    name: "Tooling",
    tools: [tech("Grafana.png"), tech("Prometheus.png"), tech("SonarQube.png"), tech("JUnit.png"), tech("Playwrite.png", "Playwright"), tech("Swagger.png"), tech("OpenAPI.png"), tech("GitHub.png"), tech("Linux.png")],
  },
]

export function StackSection() {
  const rootRef = useRef<HTMLElement>(null)
  const [current, setCurrent] = useState<string | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const media = gsap.matchMedia(root)
    const chapters = Array.from(root.querySelectorAll<HTMLElement>("[data-tech-chapter]"))

    media.add("(prefers-reduced-motion: no-preference)", (context) => {
      let disposed = false
      void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        if (disposed) return
        gsap.registerPlugin(ScrollTrigger)
        context.add(() => {
          gsap.fromTo("[data-tech-intro-line]", { yPercent: 108 }, {
            yPercent: 0,
            stagger: 0.12,
            ease: "none",
            scrollTrigger: { trigger: root, start: "top 92%", end: "top 32%", scrub: 0.3 },
          })

          for (const chapter of chapters) {
            const rule = chapter.querySelector("[data-tech-rule]")
            const title = chapter.querySelector("[data-tech-type]")
            const tint = chapter.querySelector("[data-tech-tint]")
            const tools = chapter.querySelectorAll("[data-tech-item]")

            gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: { trigger: chapter, start: "top 91%", end: "top 37%", scrub: 0.36 },
            })
              .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
              .fromTo(title, { yPercent: 62 }, { yPercent: 0, duration: 0.53 }, 0)
              .fromTo(tint, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0%)", duration: 0.43 }, 0.1)
              .to(tint, { clipPath: "inset(0 0% 0 100%)", duration: 0.47 }, 0.53)
              .fromTo(tools, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, stagger: 0.03 }, 0.22)

            ScrollTrigger.create({
              trigger: chapter,
              start: "top 48%",
              end: "bottom 48%",
              onToggle: (trigger) => {
                if (trigger.isActive) setCurrent(chapter.id)
              },
            })
          }
        })
      }).catch((error: unknown) => console.error("Could not start the stack animations.", error))
      return () => {
        disposed = true
        setCurrent(null)
      }
    })

    return () => media.revert()
  }, [])

  return (
    <section ref={rootRef} id="skills" className="tech-stack" aria-labelledby="stack-heading">
      <div className="tech-stack-inner">
        <header className="tech-stack-intro">
          <h2 id="stack-heading" className="tech-stack-heading">
            <span className="tech-stack-title-mask"><span data-tech-intro-line>Under the</span></span>{" "}
            <span className="tech-stack-title-mask"><em data-tech-intro-line className="font-serif-italic">hood.</em></span>
          </h2>
          <nav aria-label="Technologies by layer" className="tech-stack-index">
            <ul>
              {layers.map(({ id, name }) => (
                <li key={id}>
                  <a href={`#${id}`} aria-current={current === id ? "location" : undefined}>{name}</a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <div className="tech-stack-chapters">
          {layers.map(({ id, name, tools }) => (
            <div key={id} id={id} className="tech-stack-chapter" data-tech-chapter data-section-motion="body">
              <div className="tech-stack-rule" aria-hidden="true"><span data-tech-rule /></div>
              <h3 className="tech-stack-chapter-heading">
                <span data-tech-type>
                  {name}
                  <span data-tech-tint aria-hidden="true">{name}</span>
                </span>
              </h3>
              <ul className="tech-stack-tools">
                {tools.map(({ name: tool, icon }) => (
                  <li key={tool}>
                    <span data-tech-item>
                      {icon && <img src={icon} alt="" width={28} height={28} loading="lazy" decoding="async" />}
                      <span>{tool}</span>
                    </span>
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
