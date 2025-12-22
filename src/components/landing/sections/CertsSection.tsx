import * as React from "react"
import { prefersReducedMotion } from "@/lib/motion"
import { setupReveal } from "@/lib/gsap-reveal"

export function CertsSection() {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (prefersReducedMotion()) return
    const root = rootRef.current
    if (!root) return
    return setupReveal(root, { y: 16, stagger: 0.07 })
  }, [])

  return (
    <section ref={rootRef} id="certs" className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/2 p-8 backdrop-blur md:p-12">
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
            Certificates
          </h2>
          <p data-reveal className="mt-2 max-w-prose text-sm text-white/70">
            Verified credentials (Azure, etc.) with links and IDs.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div data-reveal className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
              <p className="text-sm font-semibold text-white">(Certificate 1)</p>
              <p className="mt-2 text-xs text-white/60">Provider • Date • ID</p>
            </div>
            <div data-reveal className="rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur">
              <p className="text-sm font-semibold text-white">(Certificate 2)</p>
              <p className="mt-2 text-xs text-white/60">Provider • Date • ID</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
