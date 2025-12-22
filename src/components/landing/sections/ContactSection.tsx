import * as React from "react"
import { Button } from "@/components/ui/shadcn/button"
import { socialLogos } from "@/assets/img/tech"
import { prefersReducedMotion } from "@/lib/motion"
import { setupReveal } from "@/lib/gsap-reveal"

const EMAIL = "deividjosue52@hotmail.com"

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
          <div className="absolute -inset-40 bg-[radial-gradient(circle,rgba(0,255,170,0.10),transparent_60%)] [html[data-accent='red']_&]:bg-[radial-gradient(circle,rgba(255,60,90,0.12),transparent_60%)] [html[data-accent='cyan']_&]:bg-[radial-gradient(circle,rgba(34,211,238,0.12),transparent_60%)] [html[data-accent='violet']_&]:bg-[radial-gradient(circle,rgba(167,139,250,0.12),transparent_60%)] [html[data-accent='amber']_&]:bg-[radial-gradient(circle,rgba(251,191,36,0.12),transparent_60%)]" />
        </div>

        <div className="relative">
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

          <div data-reveal className="mt-6 flex flex-wrap items-center gap-3">
            <Button className="rounded-full bg-white/10 text-white hover:bg-white/15" type="button" onClick={copyEmail}>
              {copied ? "Copied" : "Copy email"}
            </Button>

            <a href={`mailto:${EMAIL}`} className="inline-flex">
              <Button variant="outline" className="rounded-full border-white/15 bg-transparent text-white/80 hover:bg-white/5" type="button">
                Email me
              </Button>
            </a>

            <a
              href="https://linkedin.com/"
              target="_blank"
              rel="noreferrer"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/20 hover:bg-white/5"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <img src={socialLogos.LinkedIn} alt="" aria-hidden className="h-5 w-5 object-contain" />
            </a>

            <a
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/20 hover:bg-white/5"
              aria-label="GitHub"
              title="GitHub"
            >
              <img src={socialLogos.GitHub} alt="" aria-hidden className="h-5 w-5 object-contain" />
            </a>
          </div>

          <p data-reveal className="mt-6 text-xs text-white/55">Email: {EMAIL}</p>
        </div>
      </div>
    </section>
  )
}
