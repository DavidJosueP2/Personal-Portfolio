import { Button } from "@/components/ui/shadcn/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover"
import { useAccentTheme, type Accent } from "@/context/accent-theme"
import { useAmbientAudio } from "@/context/ambient-audio"
import { Volume2, VolumeX, Palette } from "lucide-react"

import { socialLogos } from "@/assets/img/tech"
import * as React from "react"
import { gsap } from "gsap"

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

function AccentSwatch({
  value,
  current,
  onSelect,
  style,
}: Readonly<{
  value: Accent
  current: Accent
  onSelect: (v: Accent) => void
  style: React.CSSProperties
}>) {
  const selected = value === current

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      style={style}
      className={
        "h-7 w-7 rounded-full border transition " +
        (selected ? "border-white/80 ring-2 ring-white/20" : "border-white/15 hover:border-white/45")
      }
      aria-label={`Set accent to ${value}`}
      aria-pressed={selected}
    />
  )
}

const SECTIONS = [
  { id: "top", label: "Top" },
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "certs", label: "Certificates" },
  { id: "contact", label: "Contact" },
] as const

function useActiveSection(sectionIds: readonly string[]) {
  const [active, setActive] = React.useState<string>(sectionIds[0] ?? "")

  React.useEffect(() => {
    const els = sectionIds
      .map((id) => document.getElementById(id))
      .filter(isHTMLElement)

    if (els.length === 0) return

    // Force a sensible initial value on mount.
    setActive((prev) => {
      const first = els[0]
      return prev || first?.id || ""
    })

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))
        const top = visible[0]
        if (top?.target && (top.target as HTMLElement).id) setActive((top.target as HTMLElement).id)
      },
      {
        root: null,
        // pick the section that lives around the top third of the viewport
        rootMargin: "-20% 0px -70% 0px",
        threshold: [0.08, 0.12, 0.2, 0.35, 0.5, 0.7],
      }
    )

    for (const el of els) obs.observe(el)
    return () => obs.disconnect()
  }, [sectionIds])

  return active
}

function AccentPickerPopover({ accent, setAccent }: Readonly<{ accent: Accent; setAccent: (a: Accent) => void }>) {
  const dotColor: Record<Accent, string> = {
    lime: "#bef264",
    emerald: "#34d399",
    cyan: "#22d3ee",
    violet: "#a78bfa",
    amber: "#fbbf24",
    red: "#fb7185",
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 hover:bg-white/5"
          aria-label="Pick accent color"
          title="Accent"
        >
          <Palette className="h-4 w-4 text-white/70" />
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full ring-1 ring-white/15"
            style={{ backgroundColor: dotColor[accent] }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 max-w-[calc(100vw-24px)]">
        <p className="text-xs font-semibold tracking-[0.25em] text-white/70">ACCENT</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <AccentSwatch value="lime" current={accent} onSelect={setAccent} style={{ backgroundColor: "#bef264" }} />
          <AccentSwatch value="emerald" current={accent} onSelect={setAccent} style={{ backgroundColor: "#34d399" }} />
          <AccentSwatch value="cyan" current={accent} onSelect={setAccent} style={{ backgroundColor: "#22d3ee" }} />
          <AccentSwatch value="violet" current={accent} onSelect={setAccent} style={{ backgroundColor: "#a78bfa" }} />
          <AccentSwatch value="amber" current={accent} onSelect={setAccent} style={{ backgroundColor: "#fbbf24" }} />
          <AccentSwatch value="red" current={accent} onSelect={setAccent} style={{ backgroundColor: "#fb7185" }} />
        </div>
        <p className="mt-3 text-xs text-white/55">
          Current: <span className="font-semibold text-white">{accent}</span>
        </p>
      </PopoverContent>
    </Popover>
  )
}

export function HeaderNav() {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const { enabled, toggle } = useAmbientAudio()
  const { accent, setAccent } = useAccentTheme()
  const active = useActiveSection(SECTIONS.map((s) => s.id))

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        root,
        { y: -16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out" }
      )
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <div ref={rootRef} className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <button
          type="button"
          onClick={() => scrollToId("top")}
          className="rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-semibold tracking-[0.35em] text-white/85 backdrop-blur hover:bg-black/45"
        >
          DJB
        </button>

        <nav className="hidden items-center md:flex">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-2 py-2 backdrop-blur">
            {SECTIONS.filter((s) => s.id !== "top").map(({ label, id }) => (
              <Button
                key={id}
                type="button"
                variant="ghost"
                className={
                  "h-9 rounded-full px-3 transition " +
                  (active === id
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white")
                }
                onClick={() => scrollToId(id)}
              >
                {label}
              </Button>
            ))}
          </div>
        </nav>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 backdrop-blur">
          <AccentPickerPopover accent={accent} setAccent={setAccent} />

          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/20 hover:bg-white/5"
            aria-label="GitHub"
            title="GitHub"
          >
            <img src={socialLogos.GitHub} alt="" aria-hidden className="h-4 w-4 object-contain" />
          </a>

          <a
            href="https://linkedin.com/"
            target="_blank"
            rel="noreferrer"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/20 hover:bg-white/5"
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <img src={socialLogos.LinkedIn} alt="" aria-hidden className="h-4 w-4 object-contain" />
          </a>

          <button
            type="button"
            onClick={toggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/20 p-0 align-middle leading-none hover:bg-white/5"
            style={{ padding: 0, background: "rgba(0,0,0,0.2)" }}
            aria-label={enabled ? "Mute" : "Unmute"}
            title={enabled ? "Mute" : "Unmute"}
          >
            {enabled ? (
              <Volume2
                className="block"
                style={{
                  width: "18px",
                  height: "18px",
                  color: "rgba(255,255,255,0.7)",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: 2,
                }}
              />
            ) : (
              <VolumeX
                className="block"
                style={{
                  width: "18px",
                  height: "18px",
                  color: "rgba(255,255,255,0.55)",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: 2,
                }}
              />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

function isHTMLElement(el: HTMLElement | null): el is HTMLElement {
  return el instanceof HTMLElement
}
