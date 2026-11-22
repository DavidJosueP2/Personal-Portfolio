import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react"
import { ArrowUpRight, Globe, Palette } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/shadcn/popover"
import { useAccentTheme, type Accent } from "@/context/accent-theme"
import { useAmbientAudio } from "@/context/ambient-audio"
import { socialLogos } from "@/assets/img/tech"
import { afterHeroIntro } from "@/lib/hero-intro"
import { toggleAppLanguage } from "@/i18n"
import { PortfolioLink } from "./PortfolioLink"
import "./site-chrome.css"

function AccentSwatch({
  value,
  current,
  onSelect,
  style,
  label,
}: Readonly<{
  value: Accent
  current: Accent
  onSelect: (v: Accent) => void
  style: CSSProperties
  label: string
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
      aria-label={label}
      aria-pressed={selected}
    />
  )
}

const SECTION_IDS = ["experience", "services", "projects", "about"] as const

function useNavigationSurface(navRef: RefObject<HTMLElement | null>, followScroll: boolean) {
  const [surface, setSurface] = useState({ id: "", light: false, brandLight: false, actionsLight: false, experiencePaper: false })

  useEffect(() => afterHeroIntro(() => {
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
      const experiencePaper = experience && section !== null && section.getBoundingClientRect().top <= y
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
  }), [followScroll, navRef])

  return surface
}

function AccentPickerPopover({ accent, setAccent }: Readonly<{ accent: Accent; setAccent: (a: Accent) => void }>) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  const dotColor: Record<Accent, string> = {
    lime: "#bef264",
    emerald: "#34d399",
    cyan: "#22d3ee",
    violet: "#a78bfa",
    amber: "#fbbf24",
    red: "#fb7185",
  }

  const swatches: Accent[] = ["lime", "emerald", "cyan", "violet", "amber", "red"]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="accent-trigger"
          className="site-header-icon"
          aria-label={t("nav.accent.ariaLabel")}
          title={t("nav.accent.title")}
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
        <p className="text-xs font-semibold tracking-[0.25em] text-ink/70">{t("nav.accent.heading")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {swatches.map((value) => (
            <AccentSwatch
              key={value}
              value={value}
              current={accent}
              label={t("nav.accent.setTo", { color: t(`nav.accent.colors.${value}`) })}
              onSelect={(v) => { setAccent(v); setOpen(false) }}
              style={{ backgroundColor: dotColor[value] }}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-ink/65">
          {t("nav.accent.current")} <span className="font-semibold text-ink">{t(`nav.accent.colors.${accent}`)}</span>
        </p>
      </PopoverContent>
    </Popover>
  )
}

export function HeaderNav({ onSection }: Readonly<{ onSection?: (id: string) => void }>) {
  const { t } = useTranslation()
  const { isOpen, isPlaying, toggleDrawer } = useAmbientAudio()
  const { accent, setAccent } = useAccentTheme()
  const navRef = useRef<HTMLElement>(null)
  const surface = useNavigationSurface(navRef, Boolean(onSection))
  const showMusicHint = Boolean(onSection) && (surface.id === "" || surface.id === "top")

  return (
    <header className="site-header" data-surface={surface.light ? "light" : "dark"} data-experience-paper={surface.experiencePaper || undefined}>
      <div data-home-navigation className="site-header-frame">
        <PortfolioLink section="top" onSection={onSection} aria-label={t("nav.brandAria")} className="site-header-brand" data-surface={surface.brandLight ? "light" : "dark"}>
          DJB
        </PortfolioLink>

        <nav ref={navRef} aria-label={t("nav.mainAria")} className="site-header-nav">
          <ul>
            {SECTION_IDS.map((id, index) => (
              <li key={id}>
                <PortfolioLink section={id} onSection={onSection} aria-current={surface.id === id ? "location" : undefined}>
                  {t(`nav.sections.${id}`)}
                </PortfolioLink>
                {index < SECTION_IDS.length - 1 && <span aria-hidden="true">,</span>}
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header-actions" data-surface={surface.actionsLight ? "light" : "dark"}>
          <button
            type="button"
            data-slot="language-toggle"
            onClick={toggleAppLanguage}
            className="site-header-icon site-header-lang"
            aria-label={t("nav.language.switchAria")}
            title={t("nav.language.switchTitle")}
          >
            <Globe aria-hidden="true" className="size-3.5" />
            <span className="site-header-lang-code">{t("nav.language.label")}</span>
          </button>

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
            onClick={toggleDrawer}
            className="site-header-icon"
            aria-expanded={isOpen}
            aria-label={isOpen ? t("nav.audio.close") : t("nav.audio.open")}
            title={isOpen ? t("nav.audio.close") : t("nav.audio.open")}
          >
            <span className="music-eq" data-playing={isPlaying} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          <div className="site-header-cta-wrap">
            <a href={onSection ? "/contact/" : "#contact-form"} className="site-header-contact">
              {t("nav.contactCta")} <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </a>
            {showMusicHint && (
              <button
                type="button"
                data-slot="music-hint"
                onClick={toggleDrawer}
                className="site-header-music-hint"
                aria-label={t("nav.audio.open")}
              >
                {t("nav.audio.hint")}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
