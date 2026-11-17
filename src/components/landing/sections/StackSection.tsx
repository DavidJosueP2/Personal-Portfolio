import { Fragment, useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { scrollToSection } from "@/lib/section-stack"
import { createRosePainter, roseRoot, roseWidth, roseHeight, type RoseKind } from "./stack-rose-paint"
import "./stack-section.css"

const icons = import.meta.glob<string>("/src/assets/img/tech/*.{png,svg}", { eager: true, import: "default" })
const traceWidth = 1200
const traceHeight = 1100
const traceViewBox = `0 0 ${traceWidth} ${traceHeight}`
const traceEntry = 0.78
const traceLowerEdge = 0.89
const traceSamples = 192

const roseAnchorX = 100 * roseRoot[0] / roseWidth
const roseAnchorY = 100 * roseRoot[1] / roseHeight
const roses = [
  { kind: "open", wide: 0.258, compact: 0.23, size: 218, angle: -6, phoneAngle: -14, span: 0.106, flip: true },
  { kind: "cup", wide: 0.447, compact: 0.473, size: 198, angle: 5, phoneAngle: 3, span: 0.107, flip: false },
  { kind: "bud", wide: 0.525, compact: 0.607, size: 162, angle: 13, phoneAngle: 24, span: 0.086, flip: true },
  { kind: "open", wide: 0.766, compact: 0.961, size: 235, angle: -14, phoneAngle: 2, span: 0.106, flip: true },
] satisfies {
  kind: RoseKind
  wide: number
  compact: number
  size: number
  angle: number
  phoneAngle: number
  span: number
  flip: boolean
}[]

function traceTiming(path: SVGPathElement, startY: number, sectionHeight: number, viewportHeight: number) {
  const length = path.getTotalLength()
  let furthestY = startY
  const heights = Array.from({ length: traceSamples + 1 }, (_, index) => {
    furthestY = Math.max(furthestY, path.getPointAtLength(length * index / traceSamples).y)
    return furthestY
  })
  const verticalRange = Math.max(1, furthestY - startY)
  const scrollRange = Math.max(1, sectionHeight - startY - viewportHeight * (1 - traceEntry))

  return heights.map((y, index) => {
    const arc = index / traceSamples
    const vertical = (y - startY) / verticalRange
    const visibleAt = (y - startY - viewportHeight * (traceLowerEdge - traceEntry)) / scrollRange
    // Keep time for sideways curves and delay each point until it can enter the viewport.
    return Math.max(vertical * 0.76 + arc * 0.24, Math.min(visibleAt, 0.98) + arc * 0.02)
  })
}

function traceProgress(progress: number, timing: number[]) {
  if (progress <= 0 || progress >= 1 || timing.length < 2) return progress

  let low = 0
  let high = timing.length - 1
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (timing[middle] <= progress) low = middle
    else high = middle
  }
  const fraction = (progress - timing[low]) / (timing[high] - timing[low])
  return (low + fraction) / (timing.length - 1)
}

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
    const trace = root?.querySelector<SVGSVGElement>(".tech-stack-trace")
    const firstLine = root?.querySelector<HTMLElement>(".tech-stack-heading > span")
    if (!root || !trace || !firstLine) return
    const media = gsap.matchMedia(root)
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const chapters = Array.from(root.querySelectorAll<HTMLElement>("[data-tech-chapter]"))
    const paths = Array.from(trace.querySelectorAll("path"))
    const curves = paths.map((path) => path.getAttribute("d") ?? "")
    const flowers = Array.from(root.querySelectorAll<HTMLCanvasElement>("[data-tech-rose]"), (canvas, index) => ({
      canvas,
      ...roses[index],
      painter: createRosePainter(canvas, roses[index].kind, index + 23),
      anchor: 0,
    }))
    let observer: IntersectionObserver | undefined
    let stopped = false
    let fittedGeometry = ""
    let entryY = 0
    let timing: number[] = []
    let scrollProgress = 1

    const paintFlowers = (arc: number) => {
      for (const { painter, anchor, span } of flowers) {
        const progress = Math.max(0, Math.min(1, (arc - anchor) / Math.min(span, 1 - anchor)))
        painter.paint(progress)
      }
    }

    const fitTrace = () => {
      if (stopped || !trace.clientWidth || !trace.clientHeight) return

      const { clientWidth, clientHeight } = trace
      const offset = trace.getBoundingClientRect()
      const styles = getComputedStyle(root)
      const paddingTop = parseFloat(styles.paddingBlockStart)
      const startY = paddingTop + firstLine.offsetHeight * 0.56
      const lastTools = root.querySelector("[data-tech-chapter]:last-child .tech-stack-tools")
      const contentBottom = lastTools ? lastTools.getBoundingClientRect().bottom - offset.top : clientHeight - 64
      const curveBottom = contentBottom + 25
      const exitDepth = parseFloat(styles.paddingBlockEnd) * 0.45
      const tailStart = 0.83
      const viewportHeight = window.innerHeight
      const geometry = [clientWidth, clientHeight, viewportHeight, startY, curveBottom, exitDepth].join(":")
      if (geometry === fittedGeometry) return
      fittedGeometry = geometry
      entryY = startY
      trace.setAttribute("viewBox", `0 0 ${clientWidth} ${clientHeight}`)
      // Fit the endpoints to the content and bake in both axes for accurate dashes.
      paths.forEach((path, index) => {
        let coordinate = 0
        path.setAttribute("d", curves[index].replace(/-?\d+(?:\.\d+)?/g, (value) => {
          const number = Number(value)
          if (coordinate++ % 2 === 0) return (number * clientWidth / traceWidth).toFixed(3)

          const position = number / traceHeight
          const tail = Math.max(0, (position - tailStart) / (1 - tailStart))
          return (startY + position * (curveBottom - startY) + exitDepth * tail ** 2).toFixed(3)
        }))
      })
      const compact = getComputedStyle(paths[0]).display === "none"
      const visiblePath = paths[compact ? 1 : 0]
      timing = traceTiming(visiblePath, startY, clientHeight, viewportHeight)
      const length = visiblePath.getTotalLength()
      for (const flower of flowers) {
        const { canvas, painter } = flower
        flower.anchor = compact ? flower.compact : flower.wide
        const point = visiblePath.getPointAtLength(length * flower.anchor)
        const size = compact
          ? Math.round(Math.min(flower.size * 0.52, clientWidth * 0.28))
          : Math.round(flower.size * Math.max(0.56, Math.min(1.13, clientWidth / 1440)))

        canvas.style.width = `${size}px`
        canvas.style.left = `${point.x}px`
        canvas.style.top = `${point.y}px`
        canvas.style.rotate = `${compact ? flower.phoneAngle : flower.angle}deg`
        canvas.style.scale = !compact && flower.flip ? "-1 1" : ""
        painter.fit(size)
      }
      if (reducedMotion.matches) paintFlowers(1)
      else if (root.hasAttribute("data-tech-motion")) {
        paintFlowers(traceProgress(scrollProgress, timing))
      }
    }
    fitTrace()
    const traceSize = new ResizeObserver(fitTrace)
    traceSize.observe(trace)
    traceSize.observe(firstLine)
    void document.fonts.ready.then(fitTrace)

    const observeCurrentChapter = () => {
      observer?.disconnect()
      const visible = new Set<Element>()
      const height = document.documentElement.clientHeight
      const center = Math.floor(height * 0.48)
      // Observe a one-pixel band so the index and the title change together.
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target)
          else visible.delete(entry.target)
        }
        const [active] = visible
        setCurrent(active?.id ?? null)
      }, { rootMargin: `-${center}px 0px -${height - center - 1}px 0px` })
      for (const chapter of chapters) observer.observe(chapter)
    }
    observeCurrentChapter()
    window.addEventListener("resize", observeCurrentChapter)

    media.add("(prefers-reduced-motion: reduce)", () => paintFlowers(1))
    media.add("(prefers-reduced-motion: no-preference)", (context) => {
      let disposed = false
      void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        if (disposed) return
        gsap.registerPlugin(ScrollTrigger)
        context.add(() => {
          root.dataset.techMotion = ""
          const panel = root.closest<HTMLElement>("[data-stack-panel]") ?? root
          const paintTrace = ({ progress }: { progress: number }) => {
            scrollProgress = progress
            const arc = traceProgress(progress, timing)
            const offset = `${1 - arc}px`
            for (const path of paths) path.style.strokeDashoffset = offset
            paintFlowers(arc)
          }
          ScrollTrigger.create({
            trigger: panel,
            start: () => `top ${window.innerHeight * traceEntry - entryY}px`,
            end: "bottom bottom",
            onRefreshInit: fitTrace,
            onRefresh: paintTrace,
            onUpdate: paintTrace,
          })

          for (const chapter of chapters) {
            const letters = chapter.querySelectorAll<HTMLElement>("[data-tech-letter]")
            let painted = -1
            const paintLetters = ({ progress, start, end }: { progress: number; start: number; end: number }) => {
              const span = end - start
              const entered = span * progress / (window.innerHeight * 0.36)
              const leaving = span * (1 - progress) / (window.innerHeight * 0.31)
              const count = Math.floor(gsap.utils.clamp(0, 1, Math.min(entered, leaving)) * letters.length + 0.001)
              if (count === painted) return
              letters.forEach((letter, index) => letter.toggleAttribute("data-turned", index < count))
              painted = count
            }
            ScrollTrigger.create({
              trigger: chapter,
              start: "top 84%",
              end: "bottom 17%",
              onUpdate: paintLetters,
              onRefresh: paintLetters,
            })

            const tools = chapter.querySelectorAll("[data-tech-item]")
            gsap.fromTo(tools, { y: 12, opacity: 0 }, {
              y: 0,
              opacity: 1,
              stagger: 0.03,
              ease: "none",
              scrollTrigger: { trigger: chapter, start: "top 91%", end: "top 37%", scrub: 0.36 },
            })
          }
        })
      }).catch((error: unknown) => console.error("Could not start the stack animations.", error))
      return () => {
        disposed = true
        delete root.dataset.techMotion
        paths.forEach((path) => path.style.removeProperty("stroke-dashoffset"))
        root.querySelectorAll("[data-turned]").forEach((letter) => letter.removeAttribute("data-turned"))
      }
    })

    return () => {
      stopped = true
      observer?.disconnect()
      traceSize.disconnect()
      window.removeEventListener("resize", observeCurrentChapter)
      media.revert()
      trace.setAttribute("viewBox", traceViewBox)
      paths.forEach((path, index) => path.setAttribute("d", curves[index]))
    }
  }, [])

  return (
    <section ref={rootRef} id="skills" className="tech-stack" aria-labelledby="stack-heading">
      <svg className="tech-stack-trace" viewBox={traceViewBox} preserveAspectRatio="none" aria-hidden="true" focusable="false" fill="none">
        <path
          className="tech-stack-trace-wide" pathLength="1" vectorEffect="non-scaling-stroke"
          d="M -72 0 C 112 0 329 4 480 20 C 562 29 620 62 583 133 C 550 197 426 200 372 265 C 288 374 350 449 465 482 C 527 500 569 534 569 588 C 569 645 514 669 451 704 C 386 740 280 812 218 893 C 175 952 158 1006 210 1046 C 267 1090 403 1100 527 1092 C 623 1086 692 1023 789 1032 C 886 1041 978 1075 1097 1076 C 1172 1077 1222 1063 1265 1052"
        />
        <path
          className="tech-stack-trace-compact" pathLength="1" vectorEffect="non-scaling-stroke"
          d="M -78 0 C 165 0 530 -1 838 17 C 1057 30 1227 80 1148 162 C 1074 240 822 214 790 292 C 761 363 1130 346 1149 454 C 1166 554 1056 631 989 685 C 890 772 932 844 1087 891 C 1194 923 1010 1007 1041 1047 C 1074 1090 1182 1061 1260 1076"
        />
      </svg>
      <div className="tech-stack-garden" aria-hidden="true">
        {roses.map(({ wide }) => (
          <canvas
            key={wide}
            data-tech-rose
            className="tech-stack-rose"
            style={{
              transformOrigin: `${roseAnchorX}% ${roseAnchorY}%`,
              translate: `-${roseAnchorX}% -${roseAnchorY}%`,
            }}
          />
        ))}
      </div>
      <div className="tech-stack-inner">
        <header className="tech-stack-intro">
          <h2 id="stack-heading" className="tech-stack-heading">
            <span>Under the</span>{" "}
            <em className="font-serif-italic">hood.</em>
          </h2>
          <nav aria-label="Technologies by layer" className="tech-stack-index">
            <ul>
              {layers.map(({ id, name }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={current === id ? "location" : undefined}
                    onClick={(event) => {
                      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                      event.preventDefault()
                      const hash = event.currentTarget.hash
                      if (location.hash !== hash) history.pushState(null, "", hash)
                      scrollToSection(id)
                    }}
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <div className="tech-stack-chapters">
          {layers.map(({ id, name, tools }) => (
              <div key={id} id={id} className="tech-stack-chapter" data-tech-chapter data-active={current === id} data-section-motion="body">
                <h3 className="tech-stack-chapter-heading" aria-label={name}>
                  <span aria-hidden="true">
                    {name.split(" ").map((word, wordIndex) => (
                      <Fragment key={word}>
                        {wordIndex > 0 && " "}
                        <span className="tech-stack-word">
                          {Array.from(word, (letter, index) => (
                            <span key={index} data-tech-letter>
                              <span>{letter}</span>
                              <span className={letter === "&" ? "tech-stack-letter-serif" : "tech-stack-letter-serif font-serif-italic"}>{letter}</span>
                            </span>
                          ))}
                        </span>
                      </Fragment>
                    ))}
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
