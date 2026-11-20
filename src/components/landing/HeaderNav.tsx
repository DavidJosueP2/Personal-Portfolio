import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react"
import { ArrowUpRight, Palette, Volume2, VolumeX } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover"
import { useAccentTheme, type Accent } from "@/context/accent-theme"
import { useAmbientAudio } from "@/context/ambient-audio"
import { socialLogos } from "@/assets/img/tech"
import { PortfolioLink } from "./PortfolioLink"
import "./site-chrome.css"

function AccentSwatch({
  value,
  current,
  onSelect,
  style,
}: Readonly<{
  value: Accent
  current: Accent
  onSelect: (v: Accent) => void
  style: CSSProperties
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
  { id: "experience", label: "Experience" },
  { id: "services", label: "Services" },
  { id: "projects", label: "Projects" },
  { id: "about", label: "About" },
] as const

function useNavigationSurface(navRef: RefObject<HTMLElement | null>, followScroll: boolean) {
  const [surface, setSurface] = useState({ id: "", light: false, brandLight: false, actionsLight: false, experiencePaper: false })

  useEffect(() => {
    const nav = navRef.current
    if (!nav || !followScroll) return

    const selector = "[data-stack-surface] > section[id]"
    const panels = Array.from(document.querySelectorAll<HTMLElement>(selector)).reverse()
    const header = nav.closest(".site-header")
    const brand = header?.querySelector(".site-header-brand")
    const actions = header?.querySelector(".site-header-actions")
    let frame = 0
    let lastSurface = ""

    // Hit-test the painted panels, including their scroll transforms and clipping.
    const sectionAt = (x: number, y: number) => {
      for (const element of document.elementsFromPoint(x, y)) {
        const section = element.closest<HTMLElement>(selector)
        if (section) return section
      }
      return null
    }
    const hasLightSurface = (element: Element | null | undefined) => {
      if (!element) return false
      const { left, top, width, height } = element.getBoundingClientRect()
      return sectionAt(left + width / 2, top + height / 2)?.hasAttribute("data-nav-light") ?? false
    }

    const update = () => {
      frame = 0
      const { left, top, width, height } = nav.getBoundingClientRect()
      const x = left + width / 2
      const y = top + height / 2
      if (y < 0 || y >= innerHeight) return

      // During a page transition the browser can hide the live panels from hit-testing.
      const section = sectionAt(x, y) ?? panels.find((panel) => {
        const bounds = panel.getBoundingClientRect()
        return x >= bounds.left && x < bounds.right && y >= bounds.top && y < bounds.bottom
      }) ?? null
      const id = section?.id ?? ""
      const light = section?.hasAttribute("data-nav-light") ?? false
      const experience = section?.hasAttribute("data-scene-handoff") ?? false
      const brandLight = experience ? hasLightSurface(brand) : light
      const actionsLight = experience ? hasLightSurface(actions) : light
      const experiencePaper = experience
      const key = [id, light, brandLight, actionsLight, experiencePaper].join(":")
      if (key === lastSurface) return
      lastSurface = key
      setSurface({ id, light, brandLight, actionsLight, experiencePaper })
    }
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    requestUpdate()
    window.addEventListener("scroll", requestUpdate, { passive: true })
    window.addEventListener("resize", requestUpdate)
    const size = new ResizeObserver(requestUpdate)
    size.observe(nav)
    size.observe(document.body)

    return () => {
      window.removeEventListener("scroll", requestUpdate)
      window.removeEventListener("resize", requestUpdate)
      cancelAnimationFrame(frame)
      size.disconnect()
    }
  }, [followScroll, navRef])

  return surface
}

function AccentPickerPopover({ accent, setAccent }: Readonly<{ accent: Accent; setAccent: (a: Accent) => void }>) {
  const [open, setOpen] = useState(false)

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
          className="site-header-icon"
          aria-label="Pick accent color"
          title="Accent"
        >
          <Palette aria-hidden="true" className="size-4" />
          <span
            aria-hidden
            className="hidden size-1.5 rounded-full sm:block"
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

export function HeaderNav({ onSection }: Readonly<{ onSection?: (id: string) => void }>) {
  const { enabled, toggle } = useAmbientAudio()
  const { accent, setAccent } = useAccentTheme()
  const navRef = useRef<HTMLElement>(null)
  const surface = useNavigationSurface(navRef, Boolean(onSection))

  return (
    <header className="site-header" data-surface={surface.light ? "light" : "dark"} data-experience-paper={surface.experiencePaper || undefined}>
      <div data-home-navigation className="site-header-frame">
        <PortfolioLink section="top" onSection={onSection} aria-label="DJB, David Barragán, home" className="site-header-brand" data-surface={surface.brandLight ? "light" : "dark"}>
          DJB
        </PortfolioLink>

        <nav ref={navRef} aria-label="Main navigation" className="site-header-nav">
          <ul>
            {SECTIONS.map(({ label, id }, index) => (
              <li key={id}>
                <PortfolioLink section={id} onSection={onSection} aria-current={surface.id === id ? "location" : undefined}>
                  {label}
                </PortfolioLink>
                {index < SECTIONS.length - 1 && <span aria-hidden="true">,</span>}
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header-actions" data-surface={surface.actionsLight ? "light" : "dark"}>
          <AccentPickerPopover accent={accent} setAccent={setAccent} />

          <a
            href="https://github.com/DavidJosueP2"
            target="_blank"
            rel="noreferrer"
            className="site-header-icon"
            aria-label="GitHub"
            title="GitHub"
          >
            <img src={socialLogos.GitHub} alt="" className="size-4 object-contain site-header-github" />
          </a>

          <a
            href="https://www.linkedin.com/in/david-barragan-dev"
            target="_blank"
            rel="noreferrer"
            className="site-header-icon"
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <img src={socialLogos.LinkedIn} alt="" aria-hidden className="h-4 w-4 object-contain" />
          </a>

          <button
            type="button"
            data-slot="audio-toggle"
            onClick={toggle}
            className="site-header-icon"
            aria-label={enabled ? "Mute" : "Unmute"}
            title={enabled ? "Mute" : "Unmute"}
          >
            {enabled ? (
              <Volume2 aria-hidden="true" className="size-[18px]" />
            ) : (
              <VolumeX aria-hidden="true" className="size-[18px]" />
            )}
          </button>

          <a href={onSection ? "/contact/" : "#contact-form"} className="site-header-contact">
            Get in touch <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        </div>
      </div>
    </header>
  )
}
