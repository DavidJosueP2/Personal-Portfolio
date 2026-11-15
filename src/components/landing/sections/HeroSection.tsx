import { useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/shadcn/button"
import { scrollToSection } from "@/lib/section-stack"
import { topHeroTools, socialLogos } from "@/assets/img/tech"
import cvPdf from "@/assets/docs/Curriculum.pdf"

const headlineVariants = [
  { accent: "products", tail: "people love." },
  { accent: "microservices", tail: "done right." },
  { accent: "systems", tail: "from backend to UI." },
].map(({ accent, tail }) => ({ accent, text: `${accent} ${tail}` }))

const readingTime = 4_800
const openingPhrase = { index: 0, length: headlineVariants[0].text.length }

function MaskedLine({ children, className = "" }: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <span className={`block overflow-hidden py-[0.12em] focus-within:overflow-visible ${className}`}>
      <span data-home-line className="block">{children}</span>
    </span>
  )
}

function HeroTagline() {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [typed, setTyped] = useState(openingPhrase)

  useEffect(() => {
    const text = textRef.current
    if (!text) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    let phrase = openingPhrase
    let erasing = true
    let delay = readingTime
    let visible = false
    let timer = 0

    const schedule = () => {
      window.clearTimeout(timer)
      if (!visible || document.hidden || reduced.matches) return

      timer = window.setTimeout(() => {
        if (erasing) {
          const length = phrase.length - 1
          if (length === 0) {
            phrase = { index: (phrase.index + 1) % headlineVariants.length, length: 0 }
            erasing = false
            delay = 160
          } else {
            phrase = { ...phrase, length }
            delay = 32
          }
        } else {
          phrase = { ...phrase, length: phrase.length + 1 }
          erasing = phrase.length === headlineVariants[phrase.index].text.length
          delay = erasing ? readingTime : 58
        }

        setTyped(phrase)
        schedule()
      }, delay)
    }

    const onMotionSetting = () => {
      if (reduced.matches) {
        phrase = { ...phrase, length: headlineVariants[phrase.index].text.length }
        erasing = true
        delay = readingTime
        setTyped(phrase)
      }
      schedule()
    }

    const observer = new IntersectionObserver((entries) => {
      visible = entries.at(-1)?.isIntersecting ?? false
      schedule()
    }, { threshold: 0.5 })

    observer.observe(text)
    document.addEventListener("visibilitychange", schedule)
    reduced.addEventListener("change", onMotionSetting)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", schedule)
      reduced.removeEventListener("change", onMotionSetting)
      window.clearTimeout(timer)
    }
  }, [])

  const { accent, text } = headlineVariants[typed.index]
  const inProgress = typed.length < text.length

  return (
    <p ref={textRef} className="mt-1 text-base font-medium leading-tight text-ink md:text-xl">
      <MaskedLine>
        <span className="sr-only">who builds {text}</span>
        <span aria-hidden="true" className="inline-grid max-w-full text-left">
          {headlineVariants.map(({ text }) => (
            <span key={text} className="invisible col-start-1 row-start-1 select-none">
              who builds {text}
            </span>
          ))}
          <span data-hero-typed className="col-start-1 row-start-1">
            who builds{" "}
            <span className="text-accent-ink">{accent.slice(0, typed.length)}</span>
            {text.slice(accent.length, typed.length)}
            {inProgress && <span className="ml-0.5 inline-block h-[0.9em] w-px bg-accent-ink align-[-0.1em]" />}
          </span>
        </span>
      </MaskedLine>
    </p>
  )
}

export function HeroSection() {
  return (
    <section id="top" aria-labelledby="home-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-size-[64px_64px] [--hero-grid-line:rgb(18_18_20/0.016)] dark:[--hero-grid-line:rgb(255_255_255/0.023)]"
          style={{
            backgroundImage: "linear-gradient(to right, var(--hero-grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--hero-grid-line) 1px, transparent 1px)",
          }}
        />
      </div>

      <div className="portfolio-container relative flex min-h-svh flex-col gap-3 pt-[5.5rem] pb-5 max-[360px]:pt-20 max-[360px]:pb-4 md:gap-5 md:pt-24 md:pb-8">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 id="home-title" data-section-motion="heading" className="flex flex-col items-center justify-center gap-x-[0.16em] font-sans! text-[clamp(3.35rem,15.4vw,5.4rem)]! leading-[0.84]! font-bold tracking-[-0.04em] text-ink md:flex-row md:items-baseline md:text-[clamp(5rem,11vw,15rem)]!">
            <span className="block overflow-hidden"><span data-home-name="above" className="block pt-[0.12em] pb-[0.18em]">David</span></span>{" "}
            <span className="block overflow-hidden px-[0.07em]">
              <span data-home-name="below" className="font-serif-italic block pt-[0.12em] pb-[0.18em] tracking-[-0.025em]">Barragán</span>
            </span>
          </h1>

          <p className="mt-1 text-xs font-bold tracking-[0.22em] uppercase text-ink/85 md:mt-3 md:text-sm">
            <MaskedLine>Software Engineer</MaskedLine>
          </p>
          <HeroTagline />
          <p className="mt-3 max-w-full text-sm leading-snug text-ink/75 md:mt-4 md:text-base">
            <MaskedLine>Full Stack Developer. Loving Cloud,</MaskedLine>{" "}
            <MaskedLine>Microservices, Spring Boot &amp; React Native.</MaskedLine>
          </p>

          <MaskedLine className="mt-3 p-1 md:mt-5">
            <span className="flex flex-wrap items-center justify-center gap-2.5">
              <Button type="button" className="min-h-10 rounded-full bg-ink px-3 text-xs text-paper hover:bg-ink/85 min-[361px]:px-5 min-[361px]:text-sm" onClick={() => scrollToSection("projects")}>
                View Projects
              </Button>
              <Button asChild variant="outline" className="min-h-10 rounded-full border-ink/20 bg-transparent px-3 text-xs text-ink/85! hover:bg-ink/5 hover:text-ink! min-[361px]:px-4 min-[361px]:text-sm">
                <a href={cvPdf} target="_blank" rel="noreferrer">CV</a>
              </Button>
              <Button asChild variant="outline" className="min-h-10 rounded-full border-ink/20 bg-transparent px-3 text-xs text-ink/85! hover:bg-ink/5 hover:text-ink! min-[361px]:px-4 min-[361px]:text-sm">
                <a href="https://www.linkedin.com/in/david-barragan-dev" target="_blank" rel="noreferrer">
                  <img src={socialLogos.LinkedIn} alt="" className="size-4 object-contain" />
                  LinkedIn
                </a>
              </Button>
            </span>
          </MaskedLine>

          <MaskedLine className="mt-3 md:mt-4">
            <span className="flex items-center justify-center gap-3.5">
              {topHeroTools.map(({ name, src }) => (
                <img key={name} src={src} alt={name} title={name} className="size-5 object-contain md:size-6" />
              ))}
            </span>
          </MaskedLine>
        </div>

        <div data-section-motion="body" className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <p className="text-[0.8125rem] leading-tight text-ink/80 sm:text-sm md:text-base">
            <MaskedLine><em className="font-serif-italic text-[1.12em] text-ink">Human first.</em></MaskedLine>{" "}
            <MaskedLine>I listen closely, communicate clearly,</MaskedLine>{" "}
            <MaskedLine>and build better with others.</MaskedLine>
          </p>

          <div className="ml-auto flex shrink-0 items-center gap-3 whitespace-nowrap text-xs font-semibold text-ink/85 sm:gap-5 sm:text-sm">
            <MaskedLine>Ecuador</MaskedLine>
            <span aria-hidden="true" className="h-3.5 w-px bg-ink/25" />
            <MaskedLine className="-m-1 p-1">
              <button
                type="button"
                data-slot="explore-home"
                onClick={() => scrollToSection("experience")}
                className="group inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-ink hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
              >
                Scroll to explore
                <ArrowDown aria-hidden="true" className="size-3.5 motion-safe:transition-transform motion-safe:group-hover:translate-y-0.5" />
              </button>
            </MaskedLine>
          </div>
        </div>
      </div>
    </section>
  )
}
