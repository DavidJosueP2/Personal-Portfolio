import * as React from "react"
import { gsap } from "gsap"
import { Button } from "@/components/ui/shadcn/button"
import { prefersReducedMotion } from "@/lib/motion"
import { topHeroTools, socialLogos } from "@/assets/img/tech"
import cvPdf from "@/assets/docs/Curriculum.pdf"

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

function HeroBackdrop({ leftGlowClass, rightGlowClass }: Readonly<{ leftGlowClass: string; rightGlowClass: string }>) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden dark:block">
      {/* subtle grid/backplate */}
      <div className="absolute inset-0 opacity-45 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-size-[64px_64px]" />
      <div className="absolute inset-0 opacity-90 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_55%)]" />
      <div className={leftGlowClass} />
      <div className={rightGlowClass} />
    </div>
  )
}

export function HeroSection() {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const accentWordRef = React.useRef<HTMLSpanElement | null>(null)
  const tailWordRef = React.useRef<HTMLSpanElement | null>(null)

  // Only rotate the highlighted word + the ending phrase (keeps it readable)
  const headlineVariants = React.useMemo(
    () => [
      { accent: "products", tail: "people love." },
      { accent: "microservices", tail: "done right." },
      { accent: "systems", tail: "from backend to UI." },
    ],
    []
  )

  const [headlineIndex, setHeadlineIndex] = React.useState(0)

  React.useEffect(() => {
    const id = globalThis.setInterval(() => {
      setHeadlineIndex((i) => (i + 1) % headlineVariants.length)
    }, 8200)

    return () => globalThis.clearInterval(id)
  }, [headlineVariants.length])

  // Smooth transition on the changing words (more "premium" motion)
  React.useLayoutEffect(() => {
    if (prefersReducedMotion()) return

    const a = accentWordRef.current
    const t = tailWordRef.current
    if (!a || !t) return

    // ensure deterministic start state
    gsap.set([a, t], { willChange: "transform,opacity,filter", transformOrigin: "50% 50%" })

    const ctx = gsap.context(() => {
      gsap.killTweensOf([a, t])

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

      // OUT
      tl.to(
        [a, t],
        {
          duration: 0.38,
          autoAlpha: 0,
          y: 10,
          skewY: 2,
          filter: "blur(6px)",
          ease: "power2.in",
          stagger: 0.03,
        },
        0
      )
        // snap back position while invisible
        .set([a, t], { y: -10, skewY: 0 }, ">")
        // IN
        .to(
          [a, t],
          {
            duration: 0.65,
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            ease: "power3.out",
            stagger: 0.03,
          },
          "<+0.02"
        )
        // subtle settle
        .to(
          [a, t],
          {
            duration: 0.35,
            y: 0,
            ease: "sine.out",
            clearProps: "filter,skewY,willChange",
          },
          "<+0.25"
        )

      return tl
    })

    return () => ctx.revert()
  }, [headlineIndex])

  React.useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      gsap.set("[data-hero]", { autoAlpha: 0, y: 12 })

      gsap
        .timeline({ defaults: { ease: "power2.out" } })
        .to("[data-hero]", { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 })
    }, root)

    return () => ctx.revert()
  }, [])

  const h = headlineVariants[headlineIndex]

  const leftGlowClass =
    "absolute -left-32 top-24 h-96 w-96 rounded-full blur-3xl " +
    "bg-[rgb(var(--accent-rgb,52_211_153)_/_0.10)]"

  const rightGlowClass =
    "absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full blur-3xl " +
    "bg-[rgb(var(--accent-rgb,52_211_153)_/_0.08)]"

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="portfolio-container relative flex min-h-svh items-center justify-center py-24">
        <div ref={rootRef} className="w-full">
          <HeroBackdrop leftGlowClass={leftGlowClass} rightGlowClass={rightGlowClass} />
          <div className="mx-auto max-w-4xl text-center">
            <p
              data-hero
              className="flex items-center justify-center gap-3 text-xs font-semibold tracking-[0.35em] text-accent-ink"
            >
              <span aria-hidden="true" className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-paper/25 font-mono text-[11px] tracking-[0.02em] text-ink/75">
                &lt;/&gt;
              </span>
              <span>SOFTWARE ENGINEER</span>
            </p>

            <h1 data-hero className="mt-6 text-[clamp(2rem,10vw,3.2rem)]! font-bold leading-[1.03] text-ink">
              {/* Línea 1: fija */}
              <span className="block">David Barragán</span>

              {/* Línea 2: dinámica */}
              <span className="mt-1 block text-center">
                {/* Mobile-first: fluido, permite wrap */}
                <span className="md:hidden">
                  <span className="text-ink">who builds </span>
                  <span ref={accentWordRef} className="text-accent-ink">
                    {h.accent}
                  </span>
                  <span ref={tailWordRef} className="text-ink">
                    {` ${h.tail}`}
                  </span>
                </span>

                {/* Desktop+: 2 líneas estables, centradas, sin salto por cambio de longitud */}
                <span className="relative hidden whitespace-nowrap md:block md:text-[min(4vw,2.8125rem)]">
                  {/* Ghost: reserva ancho para la variante más larga, pero no se ve */}
                  <span className="invisible select-none">who builds microservices done right.</span>

                  {/* Texto real (encima), siempre centrado */}
                  <span className="absolute inset-0 inline-flex items-baseline justify-center gap-x-4">
                    <span className="text-ink">who builds</span>
                    <span>
                      <span ref={accentWordRef} className="text-accent-ink">
                        {h.accent}
                      </span>
                      <span ref={tailWordRef} className="text-ink">
                        {` ${h.tail}`}
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </h1>

            <p data-hero className="mx-auto mt-6 max-w-2xl text-pretty text-sm text-ink/75 md:text-base">
              Full Stack Developer. Loving Cloud, Microservices, Spring Boot &amp; React Native.
            </p>

            <div data-hero className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                className="rounded-full bg-ink/10 text-ink hover:bg-ink/15"
                onClick={() => scrollToId("projects")}
              >
                View Projects
              </Button>

              <a href={cvPdf} target="_blank" rel="noreferrer" className="inline-flex">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-ink/20 bg-transparent text-ink/85 hover:bg-ink/5 hover:text-ink"
                >
                  CV
                </Button>
              </a>

              <a
                href="https://www.linkedin.com/in/david-barragan-dev"
                target="_blank"
                rel="noreferrer"
                className="inline-flex"
              >
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-ink/20 bg-transparent text-ink/85 hover:bg-ink/5 hover:text-ink"
                >
                  <img src={socialLogos.LinkedIn} alt="" aria-hidden className="h-4 w-4 object-contain" />
                  <span className="ml-2">LinkedIn</span>
                </Button>
              </a>

              {/* GitHub button removed */}
            </div>

            <div data-hero className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {topHeroTools.map((t) => (
                <img
                  key={t.name}
                  src={t.src}
                  alt={t.name}
                  title={t.name}
                  className="size-6 object-contain"
                  loading="lazy"
                />
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
