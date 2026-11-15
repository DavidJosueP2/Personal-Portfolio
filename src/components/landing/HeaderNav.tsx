import { Button } from "@/components/ui/shadcn/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover"
import { useAccentTheme, type Accent } from "@/context/accent-theme"
import { useAmbientAudio } from "@/context/ambient-audio"
import { prefersReducedMotion } from "@/lib/motion"
import { Moon, Sun, Volume2, VolumeX, Palette } from "lucide-react"

import { socialLogos } from "@/assets/img/tech"
import * as React from "react"

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "instant" : "smooth" })
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
      data-slot="accent-swatch"
      onClick={() => onSelect(value)}
      style={style}
      className={
        "h-7 w-7 rounded-md border transition " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 " +
        (selected ? "border-ink/80 ring-2 ring-ink/20" : "border-ink/15 hover:border-ink/45")
      }
      aria-label={`Set accent to ${value}`}
      aria-pressed={selected}
    />
  )
}

const SECTIONS = [
  { id: "top", label: "Top" },
  { id: "experience", label: "Experience" },
  { id: "services", label: "Services" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "about", label: "About & Certificates" },
  { id: "contact", label: "Contact" },
] as const

function useActiveSection() {
  const [active, setActive] = React.useState<string>("top")

  React.useEffect(() => {
    const els = SECTIONS
      .map(({ id }) => document.getElementById(id))
      .filter(isHTMLElement)

    if (els.length === 0) return

    const getNavHeight = () => {
      // header padding + nav height; keep it stable even if fonts load
      const header = document.querySelector<HTMLElement>("header")
      return (header?.getBoundingClientRect().height ?? 0) + 8
    }

    const pickActive = () => {
      const offset = getNavHeight()
      const y = offset + 8 // a line just below the header

      let bestId: string | undefined
      let bestDist = Number.POSITIVE_INFINITY

      for (const el of els) {
        const rect = el.getBoundingClientRect()
        // distance from this section's top to our reference line
        const d = Math.abs(rect.top - y)

        // Only consider sections that are in view-ish
        // (either their top is above the line but bottom below it, or top below line but not too far)
        const intersectsLine = rect.top <= y && rect.bottom >= y
        const closeEnough = rect.top >= y && rect.top <= y + 240

        if (intersectsLine || closeEnough) {
          if (d < bestDist) {
            bestDist = d
            bestId = el.id
          }
        }
      }

      if (bestId) setActive(bestId)
    }

    // Initial pick + on scroll/resize
    pickActive()

    const onScroll = () => pickActive()
    const onResize = () => pickActive()

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)

    // Also observe size changes (images/fonts) that can move sections.
    const ro = new ResizeObserver(() => pickActive())
    ro.observe(document.body)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      ro.disconnect()
    }
  }, [])

  return active
}

function AccentPickerPopover({ accent, setAccent }: Readonly<{ accent: Accent; setAccent: (a: Accent) => void }>) {
  const [open, setOpen] = React.useState(false)

  const dotColor: Record<Accent, string> = {
    lime: "#bef264",
    emerald: "#34d399",
    cyan: "#22d3ee",
    violet: "#a78bfa",
    amber: "#fbbf24",
    red: "#fb7185",
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="accent-trigger"
          className="inline-flex h-9 w-9 items-center justify-center gap-2 rounded-full border border-ink/10 bg-paper/20 hover:bg-ink/5 sm:w-auto sm:px-3"
          aria-label="Pick accent color"
          title="Accent"
        >
          <Palette className="h-4 w-4 text-ink/70" />
          <span
            aria-hidden
            className="hidden h-2.5 w-2.5 rounded-full ring-1 ring-ink/15 sm:block"
            style={{ backgroundColor: dotColor[accent] }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 max-w-[calc(100vw-24px)]">
        <p className="text-xs font-semibold tracking-[0.25em] text-ink/70">ACCENT</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <AccentSwatch value="lime" current={accent} onSelect={(v) => { setAccent(v); setOpen(false) }} style={{ backgroundColor: "#bef264" }} />
          <AccentSwatch value="emerald" current={accent} onSelect={(v) => { setAccent(v); setOpen(false) }} style={{ backgroundColor: "#34d399" }} />
          <AccentSwatch value="cyan" current={accent} onSelect={(v) => { setAccent(v); setOpen(false) }} style={{ backgroundColor: "#22d3ee" }} />
          <AccentSwatch value="violet" current={accent} onSelect={(v) => { setAccent(v); setOpen(false) }} style={{ backgroundColor: "#a78bfa" }} />
          <AccentSwatch value="amber" current={accent} onSelect={(v) => { setAccent(v); setOpen(false) }} style={{ backgroundColor: "#fbbf24" }} />
          <AccentSwatch value="red" current={accent} onSelect={(v) => { setAccent(v); setOpen(false) }} style={{ backgroundColor: "#fb7185" }} />
        </div>
        <p className="mt-3 text-xs text-ink/65">
          Current: <span className="font-semibold text-ink">{accent}</span>
        </p>
      </PopoverContent>
    </Popover>
  )
}

export function HeaderNav() {
  const { enabled, toggle } = useAmbientAudio()
  const { accent, setAccent } = useAccentTheme()
  const [light, setLight] = React.useState(() => document.documentElement.dataset.theme === "light")
  const active = useActiveSection()

  function toggleTheme() {
    const nextLight = !light
    const theme = nextLight ? "light" : "dark"
    document.documentElement.dataset.theme = theme
    setLight(nextLight)
    try {
      localStorage.setItem("portfolio:theme", theme)
    } catch {
      // The theme still applies for this visit if storage is unavailable.
    }
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 overflow-clip">
      <div data-home-navigation className="portfolio-container flex items-center justify-between gap-2 py-4 sm:gap-4">
        <button
          type="button"
          data-slot="home-link"
          onClick={() => scrollToId("top")}
          className="rounded-full border border-ink/10 bg-paper/65 px-3 py-2 text-xs font-semibold tracking-[0.35em] text-ink/85 backdrop-blur hover:bg-paper/85 sm:px-4"
        >
          DJB
        </button>

        <nav aria-label="Main navigation" className="hidden items-center min-[880px]:flex">
          <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-paper/65 px-2 py-2 backdrop-blur lg:gap-2">
            {SECTIONS.filter((s) => s.id !== "top").map(({ label, id }) => (
              <Button
                key={id}
                type="button"
                variant="ghost"
                aria-current={active === id ? "location" : undefined}
                className={
                  "h-9 rounded-full px-2 text-xs transition lg:px-3 lg:text-sm " +
                  (active === id
                    ? "bg-ink/10 text-ink"
                    : "text-ink/70 hover:bg-ink/5 hover:text-ink")
                }
                onClick={() => scrollToId(id)}
              >
                {label}
              </Button>
            ))}
          </div>
        </nav>

        <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-paper/65 px-2 py-2 backdrop-blur sm:gap-2 sm:px-3">
          <button
            type="button"
            data-slot="theme-toggle"
            onClick={toggleTheme}
            aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
            title={light ? "Dark mode" : "Light mode"}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/10 bg-paper/20 text-ink/85 hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
          >
            {light ? <Moon aria-hidden="true" className="size-4" /> : <Sun aria-hidden="true" className="size-4" />}
          </button>

          <AccentPickerPopover accent={accent} setAccent={setAccent} />

          <a
            href="https://github.com/DavidJosueP2"
            target="_blank"
            rel="noreferrer"
            className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-paper/20 hover:bg-ink/5"
            aria-label="GitHub"
            title="GitHub"
          >
            <img src={socialLogos.GitHub} alt="" aria-hidden className="h-4 w-4 object-contain" data-monochrome-logo />
          </a>

          <a
            href="https://www.linkedin.com/in/david-barragan-dev"
            target="_blank"
            rel="noreferrer"
            className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-paper/20 hover:bg-ink/5"
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <img src={socialLogos.LinkedIn} alt="" aria-hidden className="h-4 w-4 object-contain" />
          </a>

          <button
            type="button"
            data-slot="audio-toggle"
            onClick={toggle}
            className="inline-flex size-9 items-center justify-center rounded-full border border-ink/10 bg-paper/20 p-0 align-middle leading-none text-ink/70 hover:bg-ink/5"
            aria-label={enabled ? "Mute" : "Unmute"}
            title={enabled ? "Mute" : "Unmute"}
          >
            {enabled ? (
              <Volume2 aria-hidden="true" className="size-[18px]" />
            ) : (
              <VolumeX aria-hidden="true" className="size-[18px]" />
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
