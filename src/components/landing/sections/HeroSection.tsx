import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { ArrowDown } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import { Button } from "@/components/ui/shadcn/button"
import { scrollToSection } from "@/lib/section-stack"
import { afterHeroIntro } from "@/lib/hero-intro"
import { topHeroTools, socialLogos } from "@/assets/img/tech"
import cvPdf from "@/assets/docs/Curriculum.pdf"
import { setupHeroJourney } from "../hero/hero-journey"
import { gardenWords } from "../hero/journey-copy"
import "../hero/hero-journey.css"

const readingTime = 4_800

function MaskedLine({ children, className = "", secondary = false }: Readonly<{ children: ReactNode; className?: string; secondary?: boolean }>) {
  return (
    <span data-hero-secondary={secondary ? "" : undefined} className={`block overflow-hidden py-[0.12em] focus-within:overflow-visible ${className}`}>
      <span data-home-line className="block">{children}</span>
    </span>
  )
}

function HeroTagline() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const headlineVariants = useMemo(() => {
    const raw = t("hero.taglineVariants", { lng: language, returnObjects: true })
    return raw.map(({ prefix, accent, tail }) => ({
      prefix,
      accent,
      text: `${prefix}${accent}${tail}`,
    }))
  }, [t, language])

  const textRef = useRef<HTMLParagraphElement>(null)
  const [typed, setTyped] = useState(() => ({
    language,
    index: 0,
    length: headlineVariants[0].text.length,
  }))

  useEffect(() => afterHeroIntro(() => {
    const text = textRef.current
    if (!text) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    let phrase = { language, index: 0, length: headlineVariants[0].text.length }
    let erasing = true
    let delay = readingTime
    let visible = false
    let timer = 0

    const schedule = () => {
      window.clearTimeout(timer)
      if (!visible || document.hidden || text.inert || reduced.matches) return

      timer = window.setTimeout(() => {
        if (erasing) {
          const length = phrase.length - 1
          if (length === 0) {
            phrase = { language, index: (phrase.index + 1) % headlineVariants.length, length: 0 }
            erasing = false
            delay = 160
          } else {
            phrase = { ...phrase, length }
            delay = 28
          }
        } else {
          phrase = { ...phrase, length: phrase.length + 1 }
          erasing = phrase.length === headlineVariants[phrase.index].text.length
          delay = erasing ? readingTime : 50
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
    const visibility = new MutationObserver(schedule)
    visibility.observe(text, { attributes: true, attributeFilter: ["inert"] })
    document.addEventListener("visibilitychange", schedule)
    reduced.addEventListener("change", onMotionSetting)
    return () => {
      observer.disconnect()
      visibility.disconnect()
      document.removeEventListener("visibilitychange", schedule)
      reduced.removeEventListener("change", onMotionSetting)
      window.clearTimeout(timer)
    }
  }), [language, headlineVariants])

  const current = typed.language === language
    ? typed
    : { language, index: 0, length: headlineVariants[0].text.length }
  const { prefix, accent, text } = headlineVariants[current.index]
  const accentStart = prefix.length
  const accentEnd = accentStart + accent.length
  const inProgress = current.length < text.length

  return (
    <p ref={textRef} data-hero-secondary className="mt-1 max-w-full text-base font-medium leading-tight text-ink md:text-xl">
      <MaskedLine>
        <span className="sr-only">{text}</span>
        <span aria-hidden="true" className="inline-grid max-w-full place-items-center text-center text-balance">
          {headlineVariants.map(({ text: variantText }) => (
            <span key={variantText} className="invisible col-start-1 row-start-1 select-none">
              {variantText}
            </span>
          ))}
          <span data-hero-typed className="col-start-1 row-start-1">
            {text.slice(0, Math.min(current.length, accentStart))}
            {current.length > accentStart && (
              <span className="text-accent-ink">
                {text.slice(accentStart, Math.min(current.length, accentEnd))}
              </span>
            )}
            {current.length > accentEnd && text.slice(accentEnd, current.length)}
            {inProgress && <span className="relative inline-block h-[0.9em] w-0 align-[-0.1em] after:absolute after:inset-y-0 after:left-0.5 after:w-px after:bg-accent-ink" />}
          </span>
        </span>
      </MaskedLine>
    </p>
  )
}

export function HeroSection() {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (root) return setupHeroJourney(root)
  }, [])

  return (
    <section ref={rootRef} id="top" aria-labelledby="home-title" className="hero-journey" data-inverse-cursor-exclude>
      <div data-hero-stage className="hero-stage">
        <div data-hero-earth-host className="hero-earth-host" aria-hidden="true" />
        <div className="hero-garden-words" aria-hidden="true">
          {gardenWords.map(({ id, serif }, index) => {
            const text = t(`hero.gardenWords.${id}.text`)
            const detail = t(`hero.gardenWords.${id}.detail`)
            return (
              <span key={id} data-garden-word={index} className="hero-garden-word">
                <span className={`hero-garden-word-title${serif ? " font-serif-italic" : ""}`}>
                  {text.includes("&") ? <>{text.slice(0, text.indexOf("&"))}<span className="hero-garden-word-amp">&amp;</span>{text.slice(text.indexOf("&") + 1)}</> : text}
                </span>
                <span className="hero-garden-word-detail">{detail}</span>
              </span>
            )
          })}
        </div>
        <div className="hero-initial portfolio-container relative flex min-h-svh flex-col gap-3 pt-[5.5rem] pb-5 max-[360px]:pt-20 max-[360px]:pb-4 md:gap-5 md:pt-24 md:pb-8">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div data-hero-name className="hero-name">
              <h1 id="home-title" tabIndex={-1} data-section-motion="heading" className="flex flex-col items-center justify-center gap-x-[0.16em] font-sans! text-[clamp(3.35rem,15.4vw,5.4rem)]! leading-[0.84]! font-bold tracking-[-0.04em] text-ink md:flex-row md:items-baseline md:text-[clamp(5rem,11vw,15rem)]!">
                <span className="block overflow-hidden"><span data-home-name className="block pt-[0.12em] pb-[0.18em]">David</span></span>{" "}
                <span className="block overflow-hidden px-[0.07em]">
                  <span data-home-name className="font-serif-italic block pt-[0.12em] pb-[0.18em] tracking-[-0.025em]">Barragán</span>
                </span>
              </h1>
            </div>

            <p data-hero-secondary className="mt-1 text-xs font-bold tracking-[0.22em] uppercase text-ink/85 md:mt-3 md:text-sm">
              <MaskedLine>{t("hero.role")}</MaskedLine>
            </p>
            <HeroTagline />
            <p data-hero-secondary className="mt-3 max-w-full text-sm leading-snug text-ink/75 md:mt-4 md:text-base">
              <MaskedLine>{t("hero.summaryLine1")}</MaskedLine>{" "}
              <MaskedLine className="py-[0.22em]">
                <Trans
                  i18nKey="hero.summaryLine2"
                  components={{
                    1: (
                      <strong className="inline-block rounded-md bg-[rgb(var(--accent-rgb,52_211_153)/0.14)] px-2 py-[0.04em] font-semibold text-accent-ink ring-1 ring-inset ring-[rgb(var(--accent-rgb,52_211_153)/0.4)]" />
                    ),
                  }}
                />
              </MaskedLine>
            </p>

            <MaskedLine secondary className="mt-3 p-1 md:mt-5">
              <span className="flex flex-wrap items-center justify-center gap-2.5">
                <Button type="button" className="min-h-10 rounded-full bg-ink px-3 text-xs text-paper hover:bg-ink/85 min-[361px]:px-5 min-[361px]:text-sm" onClick={() => scrollToSection("projects")}>
                  {t("hero.viewProjects")}
                </Button>
                <Button asChild variant="outline" className="min-h-10 rounded-full border-ink/20 bg-transparent px-3 text-xs text-ink/85! hover:bg-ink/5 hover:text-ink! min-[361px]:px-4 min-[361px]:text-sm">
                  <a href={cvPdf} target="_blank" rel="noreferrer">{t("hero.cv")}</a>
                </Button>
                <Button asChild variant="outline" className="min-h-10 rounded-full border-ink/20 bg-transparent px-3 text-xs text-ink/85! hover:bg-ink/5 hover:text-ink! min-[361px]:px-4 min-[361px]:text-sm">
                  <a href="https://www.linkedin.com/in/david-barragan-dev" target="_blank" rel="noreferrer">
                    <img src={socialLogos.LinkedIn} alt="" className="size-4 object-contain" />
                    LinkedIn
                  </a>
                </Button>
              </span>
            </MaskedLine>

            <MaskedLine secondary className="mt-3 md:mt-4">
              <span className="flex items-center justify-center gap-3.5">
                {topHeroTools.map(({ name, src }) => (
                  <img key={name} src={src} alt={name} title={name} className="size-5 object-contain md:size-6" />
                ))}
              </span>
            </MaskedLine>
          </div>

          <div data-hero-secondary data-section-motion="body" className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <p className="text-[0.8125rem] leading-tight text-ink/80 sm:text-sm md:text-base">
              <MaskedLine><em className="font-serif-italic text-[1.12em] text-ink">{t("hero.humanFirst.lead")}</em></MaskedLine>{" "}
              <MaskedLine>{t("hero.humanFirst.line1")}</MaskedLine>{" "}
              <MaskedLine>{t("hero.humanFirst.line2")}</MaskedLine>
            </p>

            <div className="ml-auto flex shrink-0 items-center gap-3 whitespace-nowrap text-xs font-semibold text-ink/85 sm:gap-5 sm:text-sm">
              <MaskedLine>{t("hero.location")}</MaskedLine>
              <span aria-hidden="true" className="h-3.5 w-px bg-ink/25" />
              <MaskedLine className="-m-1 p-1">
                <button
                  type="button"
                  data-slot="explore-home"
                  onClick={() => scrollToSection("experience")}
                  className="group inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-ink hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
                >
                  {t("hero.scrollToExplore")}
                  <ArrowDown aria-hidden="true" className="size-3.5 motion-safe:transition-transform motion-safe:group-hover:translate-y-0.5" />
                </button>
              </MaskedLine>
            </div>
          </div>
        </div>
        <p data-hero-credit className="hero-earth-credit">
          <Trans
            i18nKey="hero.earthCredit"
            components={{
              1: <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer" />,
            }}
          />
        </p>
      </div>
    </section>
  )
}
