import * as React from "react"
import { Button } from "@/components/ui/shadcn/button"
import { socialLogos } from "@/assets/img/tech"
import { prefersReducedMotion } from "@/lib/motion"
import { setupReveal } from "@/lib/gsap-reveal"
import cvPdf from "@/assets/docs/Curriculum.pdf"

const EMAIL = "deividjosue52@hotmail.com"
const PHONE_DISPLAY = "+593 998657051"
const PHONE_TEL = "+593998657051"

export function ContactSection() {
  const rootRef = React.useRef<HTMLElement | null>(null)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (prefersReducedMotion()) return
    const root = rootRef.current
    if (!root) return
    return setupReveal(root, { y: 14, stagger: 0.06 })
  }, [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      globalThis.setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  return (
    <section ref={rootRef} id="contact" className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur md:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[22px_22px]" />
          <div className="absolute -inset-40 bg-[radial-gradient(circle,rgb(var(--accent-rgb,52_211_153)_/_0.12),transparent_60%)]" />
        </div>

        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          {/* Left */}
          <div>
            <h2
              data-reveal
              className="text-3xl font-extrabold text-white md:text-4xl"
              style={{ fontFamily: "Gloock, Onest, system-ui" }}
            >
              Contact
            </h2>
            <p data-reveal className="mt-2 max-w-prose text-sm text-white/70">
              Want a product that feels premium—fast, animated, and scalable? Let's talk.
            </p>

            <div data-reveal className="mt-7 flex flex-wrap items-center gap-3">
              <Button className="rounded-full bg-white/10 text-white hover:bg-white/15" type="button" onClick={copyEmail}>
                {copied ? "Copied" : "Copy email"}
              </Button>

              <a href={`mailto:${EMAIL}`} className="inline-flex">
                <Button
                  variant="outline"
                  className="rounded-full border-white/15 bg-transparent text-white/80 hover:bg-white/5"
                  type="button"
                >
                  Email me
                </Button>
              </a>

              <a href={cvPdf} target="_blank" rel="noreferrer" className="inline-flex">
                <Button
                  variant="outline"
                  className="rounded-full border-white/15 bg-transparent text-white/80 hover:bg-white/5"
                  type="button"
                >
                  Curriculum
                </Button>
              </a>

              <a href={`tel:${PHONE_TEL}`} className="inline-flex">
                <Button
                  variant="outline"
                  className="rounded-full border-white/15 bg-transparent text-white/80 hover:bg-white/5"
                  type="button"
                >
                  Call
                </Button>
              </a>
            </div>

            <div data-reveal className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold tracking-[0.25em] text-white/70">EMAIL</p>
                <p className="mt-2 text-sm font-semibold text-white/85">{EMAIL}</p>
                <p className="mt-1 text-xs text-white/55">Fastest way to reach me.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold tracking-[0.25em] text-white/70">PHONE</p>
                <p className="mt-2 text-sm font-semibold text-white/85">{PHONE_DISPLAY}</p>
                <p className="mt-1 text-xs text-white/55">Available for quick calls.</p>
              </div>
            </div>
          </div>

          {/* Right */}
          <aside className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
            <div data-reveal>
              <p className="text-xs font-semibold tracking-[0.25em] text-white/70">ONLINE</p>
              <p className="mt-2 text-sm text-white/70">Links and profiles.</p>
            </div>

            <div data-reveal className="mt-5 flex items-center gap-3">
              <a
                href="https://www.linkedin.com/in/david-barragan-dev"
                target="_blank"
                rel="noreferrer"
                className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-black/20 hover:bg-white/5"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <img src={socialLogos.LinkedIn} alt="" aria-hidden className="h-5 w-5 object-contain" />
              </a>

              <a
                href="https://github.com/DavidJosueP2"
                target="_blank"
                rel="noreferrer"
                className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-black/20 hover:bg-white/5"
                aria-label="GitHub"
                title="GitHub"
              >
                <img src={socialLogos.GitHub} alt="" aria-hidden className="h-5 w-5 object-contain" />
              </a>
            </div>

            <div data-reveal className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-xs font-semibold tracking-[0.25em] text-white/70">RESPONSE</p>
              <p className="mt-2 text-sm text-white/70">
                Typically fast replies by email.
              </p>
              <p className="mt-2 text-xs text-white/55">
                Timezone: Ecuador (UTC-5).
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
