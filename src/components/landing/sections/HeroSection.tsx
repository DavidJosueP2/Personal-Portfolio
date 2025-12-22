import * as React from "react"
import { gsap } from "gsap"
import { Button } from "@/components/ui/shadcn/button"
import { useAccentTheme } from "@/context/accent-theme"
import { prefersReducedMotion } from "@/lib/motion"
import { topHeroTools, socialLogos } from "@/assets/img/tech"
import cvPdf from "@/assets/docs/Curriculum.pdf"

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

function HeroBackdrop({ leftGlowClass, rightGlowClass }: Readonly<{ leftGlowClass: string; rightGlowClass: string }>) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* subtle grid/backplate */}
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[64px_64px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className={leftGlowClass} />
      <div className={rightGlowClass} />
    </div>
  )
}

export function HeroSection() {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const accentWordRef = React.useRef<HTMLSpanElement | null>(null)
  const tailWordRef = React.useRef<HTMLSpanElement | null>(null)
  const { accent } = useAccentTheme()

  // Only rotate the highlighted word + the ending phrase (keeps it readable)
  const headlineVariants = React.useMemo(
    () => [
      { accent: "APIs", tail: "built to last." },
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
      <div className="relative mx-auto flex min-h-svh max-w-6xl items-center px-6 pb-16 pt-28">
        <div ref={rootRef} className="w-full">
          <HeroBackdrop leftGlowClass={leftGlowClass} rightGlowClass={rightGlowClass} />
          <div className="mx-auto max-w-4xl text-center">
            <p
              data-hero
              className="text-xs font-semibold tracking-[0.35em] text-[rgb(var(--accent-rgb,52_211_153)_/_0.8)]"
            >
              <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/25 font-mono text-[11px] tracking-[0.02em] text-white/75">
                &lt;/&gt;
              </span>
              WAKE UP, DAVID BARRAGÁN
            </p>

            <h1 data-hero className="mt-6 text-balance text-4xl font-black leading-[1.03] text-white md:text-7xl">
              Software Engineer
              <span className="block">
                <span className="text-white">who builds </span>
                <span
                  ref={accentWordRef}
                  className="text-[rgb(var(--accent-rgb,52_211_153))]"
                >
                  {h.accent}
                </span>
                <span ref={tailWordRef} className="text-white">
                  {` ${h.tail}`}
                </span>
              </span>
            </h1>

            <p data-hero className="mx-auto mt-6 max-w-2xl text-pretty text-sm text-white/75 md:text-base">
              Backend-first full‑stack. Java + Spring Boot, SQL, CI/CD.
            </p>

            <div data-hero className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                className="rounded-full bg-white/10 text-white hover:bg-white/15"
                onClick={() => scrollToId("projects")}
              >
                View Projects
              </Button>

              <a href={cvPdf} target="_blank" rel="noreferrer" className="inline-flex">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-white/20 bg-transparent text-white/85 hover:bg-white/5 hover:text-white"
                >
                  CV
                </Button>
              </a>

              <a href="https://www.linkedin.com/in/david-barragan-dev" target="_blank" rel="noreferrer" className="inline-flex">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-white/20 bg-transparent text-white/85 hover:bg-white/5 hover:text-white"
                >
                  <img src={socialLogos.LinkedIn} alt="" aria-hidden className="h-4 w-4 object-contain" />
                  <span className="ml-2">LinkedIn</span>
                </Button>
              </a>

              <a href="https://github.com/DavidJosueP2" target="_blank" rel="noreferrer" className="inline-flex">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-white/20 bg-transparent text-white/85 hover:bg-white/5 hover:text-white"
                >
                  <img src={socialLogos.GitHub} alt="" aria-hidden className="h-4 w-4 object-contain" />
                  <span className="ml-2">GitHub</span>
                </Button>
              </a>
            </div>

            <div data-hero className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {topHeroTools.map((t) => (
                <div
                  key={t.name}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/10"
                  title={t.name}
                >
                  <img src={t.src} alt={t.name} className="h-5 w-5 object-contain" loading="lazy" />
                </div>
              ))}
            </div>

            <p data-hero className="mt-7 text-xs text-white/55">
              Current accent: <span className="font-semibold text-white">{accent}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
