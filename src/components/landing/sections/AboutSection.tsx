import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { ArrowUpRight, CodeXml, Cpu, MapPin } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import awsPractitioner from "@/assets/img/about/aws-cloud-practitioner.webp"
import awsSimuLearn from "@/assets/img/about/aws-simulearn.webp"
import spotifyCover from "@/assets/img/about/spotify-cover.webp"
import surrealism from "@/assets/img/about/surrealism.webp"
import cseiLogo from "@/assets/img/about/university/csei.webp"
import fiseiLogo from "@/assets/img/about/university/fisei.webp"
import grokLogo from "@/assets/img/about/university/grok.webp"
import hatunsoftLogo from "@/assets/img/about/university/hatunsoft.webp"
import tcsLogo from "@/assets/img/about/university/tcs.webp"
import utaLogo from "@/assets/img/about/university/uta.webp"
import { setupRevealList } from "@/lib/gsap-reveal-list"
import { resolveLanguage } from "@/i18n"
import "./about-section.css"

const university = "Universidad Técnica de Ambato"
const aws = "AWS Training and Certification"
const spotify = "https://open.spotify.com/user/j9g88t92xw14rfuaz5olbi77e?si=4c2cd67004fb4708"

const credentials = [
  {
    id: "awsPractitioner",
    issuer: aws,
    image: awsPractitioner,
    href: "https://www.credly.com/badges/bcfbf0db-890f-4bb1-b2e2-e2c7641b0af2",
    lang: "en",
  },
  {
    id: "awsSimuLearn",
    issuer: aws,
    image: awsSimuLearn,
    href: "https://www.credly.com/badges/8353d88c-0542-4302-b19e-c750c1848f2a",
    lang: "en",
  },
  { id: "esp32", issuer: `${university} · 2025`, icon: Cpu },
  { id: "pythonDjango", issuer: university, icon: CodeXml, lang: "es" },
] as const

type UniversityEvent = {
  id: "grok" | "hackathon" | "congress" | "codificadas" | "csei" | "hatunsoft"
  type: "community" | "competition" | "conference"
  organizer: string
  logo: string
  coOrganizerLogo?: string
  href?: string
}

const eventYears: { year: number; events: UniversityEvent[] }[] = [
  {
    year: 2026,
    events: [
      { id: "grok", type: "community", organizer: university, logo: grokLogo },
      { id: "hackathon", type: "competition", organizer: university, logo: utaLogo },
      { id: "congress", type: "conference", organizer: university, logo: utaLogo },
    ],
  },
  {
    year: 2025,
    events: [
      { id: "codificadas", type: "competition", organizer: "Tata Consultancy Services", logo: tcsLogo, href: "https://tcscodificadas.com/" },
    ],
  },
  {
    year: 2024,
    events: [
      { id: "csei", type: "conference", organizer: `FISEI, ${university}`, logo: cseiLogo, coOrganizerLogo: fiseiLogo },
    ],
  },
  {
    year: 2023,
    events: [
      { id: "hatunsoft", type: "competition", organizer: `FISEI, ${university}`, logo: hatunsoftLogo },
    ],
  },
]

const interests = ["friends", "valorant"] as const

function Profile() {
  const { t, i18n } = useTranslation()
  const activeLanguage = resolveLanguage(i18n.resolvedLanguage ?? i18n.language)

  return (
    <div className="about-layout about-profile">
      <div>
        <h3 className="about-lead">
          <Trans
            i18nKey="about.profile.lead"
            components={{ 1: <em className="font-serif-italic" /> }}
          />
        </h3>
        <p className="about-copy">
          <Trans
            i18nKey="about.profile.copy"
            components={{ 1: <strong /> }}
          />
        </p>

        <div className="about-profile-details">
          <div id="education">
            <h4 className="about-subheading">{t("about.profile.educationHeading")}</h4>
            <p className="about-list-title">{t("about.profile.degree")}</p>
            <p className="about-detail">{university}</p>
          </div>
          <div>
            <h4 className="about-subheading">{t("about.profile.languagesHeading")}</h4>
            <dl className="about-languages">
              <div><dt>{t("about.profile.spanish")}</dt><dd>{t("about.profile.spanishLevel")}</dd></div>
              <div><dt>{t("about.profile.english")}</dt><dd>{t("about.profile.englishLevel")}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <div id="certs" className="about-certificates">
        <h3 className="about-subheading">{t("about.profile.certificatesHeading")}</h3>
        <ul className="about-credentials">
          {credentials.map((credential) => {
            const title = t(`about.profile.credentials.${credential.id}`)
            const Icon = "icon" in credential ? credential.icon : undefined
            const image = "image" in credential ? credential.image : undefined
            const href = "href" in credential ? credential.href : undefined
            const titleLang = "lang" in credential && credential.lang !== activeLanguage ? credential.lang : undefined
            const content = (
              <>
                {image ? (
                  <img src={image} alt="" loading="lazy" decoding="async" width={52} height={52} />
                ) : (
                  <span className="about-credential-icon">{Icon && <Icon aria-hidden="true" size={23} strokeWidth={1.5} />}</span>
                )}
                <span>
                  <span className="about-list-title" lang={titleLang}>{title}</span>
                  <span className="about-detail">{credential.issuer}</span>
                </span>
                {href && <ArrowUpRight aria-hidden="true" size={17} />}
              </>
            )
            return (
              <li key={credential.id}>
                {href ? (
                  <a className="about-credential" href={href} target="_blank" rel="noopener noreferrer">{content}</a>
                ) : (
                  <div className="about-credential">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function University() {
  const { t } = useTranslation()

  return (
    <div className="about-layout about-university">
      <div>
        <h3 className="about-lead">
          <Trans
            i18nKey="about.university.lead"
            components={{ 1: <em className="font-serif-italic" /> }}
          />
        </h3>
        <p className="about-copy">{t("about.university.copy", { university })}</p>
      </div>
      <ol className="about-events">
        {eventYears.map(({ year, events }) => (
          <li className="about-event-year" key={year}>
            <h4><time dateTime={String(year)}>{year}</time></h4>
            <ul>
              {events.map(({ id, type, organizer, logo, coOrganizerLogo, href }) => (
                <li className="about-event" key={id}>
                  <div className="about-event-logos">
                    <img src={logo} alt="" width={176} height={176} loading="lazy" decoding="async" />
                    {coOrganizerLogo && <img src={coOrganizerLogo} alt="" width={176} height={176} loading="lazy" decoding="async" />}
                  </div>
                  <div>
                    <div className="about-event-head">
                      <h5 className="about-list-title">{t(`about.university.events.${id}.title`)}</h5>
                      <span>{t(`about.university.types.${type}`)}</span>
                    </div>
                    <p className="about-detail">{organizer}</p>
                    <p className="about-event-copy">{t(`about.university.events.${id}.detail`)}</p>
                    {href && (
                      <a className="about-event-link" href={href} target="_blank" rel="noopener noreferrer">
                        {t("about.university.eventWebsite")} <ArrowUpRight aria-hidden="true" size={14} />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  )
}

function BasketballToy() {
  const { t } = useTranslation()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const button = buttonRef.current
    const canvas = canvasRef.current
    if (!button || !canvas) return

    let controller: ReturnType<typeof import("./about-basketball").connectBasketball> | undefined
    let loadStarted = false
    let visible = false
    let disposed = false
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      controller?.setVisible(visible)
      if (!visible || loadStarted) return
      loadStarted = true
      void import("./about-basketball").then(({ connectBasketball }) => {
        if (disposed) return
        controller = connectBasketball(button, canvas)
        controller.setVisible(visible)
      }).catch(() => { /* Keep the painted ball visible when the 3D scene is unavailable. */ })
    })
    observer.observe(button)

    return () => {
      disposed = true
      observer.disconnect()
      controller?.dispose()
    }
  }, [])

  return (
    <button ref={buttonRef} className="about-basketball" data-slot="about-basketball" type="button" aria-label={t("about.personal.basketball.toyAria")}>
      <span className="about-basketball-shadow" aria-hidden="true" />
      <span className="about-basketball-body" aria-hidden="true">
        <span className="about-basketball-fallback" />
        <canvas ref={canvasRef} />
      </span>
    </button>
  )
}

function Personal() {
  const { t } = useTranslation()

  return (
    <div className="about-layout about-personal">
      <div>
        <h3 className="about-lead">
          <Trans
            i18nKey="about.personal.lead"
            components={{ 1: <em className="font-serif-italic" /> }}
          />
        </h3>
        <ul className="about-interests">
          <li className="about-interest about-interest-basketball">
            <h4>{t("about.personal.basketball.title")}</h4>
            <div className="about-basketball-detail">
              <p>{t("about.personal.basketball.detail")}</p>
              <BasketballToy />
            </div>
          </li>
          {interests.map((id) => (
            <li className="about-interest" key={id}>
              <h4>{t(`about.personal.${id}.title`)}</h4>
              <p>{t(`about.personal.${id}.detail`)}</p>
            </li>
          ))}
          <li className="about-interest">
            <h4>{t("about.personal.music.title")}</h4>
            <div>
              <p>{t("about.personal.music.detail")}</p>
              <a className="about-spotify" href={spotify} target="_blank" rel="noopener noreferrer">
                <img src={spotifyCover} alt="" width={300} height={300} loading="lazy" decoding="async" />
                <span>{t("about.personal.music.spotifyCta")}</span>
                <ArrowUpRight aria-hidden="true" size={19} />
              </a>
            </div>
          </li>
        </ul>
      </div>
      <figure className="about-art">
        <img
          src={surrealism}
          alt={t("about.personal.surrealism.alt")}
          width={1200}
          height={1499}
          loading="lazy"
          decoding="async"
        />
        <figcaption>
          <h4>{t("about.personal.surrealism.title")}</h4>
          <p>{t("about.personal.surrealism.detail")}</p>
        </figcaption>
      </figure>
    </div>
  )
}

const tabs = [
  { id: "profile", Panel: Profile },
  { id: "university", Panel: University },
  { id: "personal", Panel: Personal },
] as const

export function AboutSection() {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    if (root) return setupRevealList(root)
  }, [])

  function navigateTabs(event: KeyboardEvent<HTMLDivElement>) {
    let next = active
    switch (event.key) {
      case "ArrowRight": next = (active + 1) % tabs.length; break
      case "ArrowLeft": next = (active + tabs.length - 1) % tabs.length; break
      case "Home": next = 0; break
      case "End": next = tabs.length - 1; break
      default: return
    }
    event.preventDefault()
    setActive(next)
    event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus()
  }

  return (
    <section ref={rootRef} id="about" data-nav-light aria-labelledby="about-heading" className="about-section portfolio-section portfolio-contrast-section">
      <div className="about-inner">
        <header className="about-heading" data-reveal-item data-section-motion="heading">
          <div>
            <h2 id="about-heading">
              <Trans
                i18nKey="about.heading"
                components={{ 1: <em className="font-serif-italic" /> }}
              />
            </h2>
            <p className="about-location"><MapPin aria-hidden="true" size={15} /> {t("about.location")}</p>
          </div>

          <div className="about-tabs" role="tablist" aria-label={t("about.tabsAria")} onKeyDown={navigateTabs}>
            {tabs.map(({ id }, index) => (
              <button
                key={id}
                type="button"
                role="tab"
                data-slot="about-tab"
                id={`about-tab-${id}`}
                aria-selected={active === index}
                aria-controls={`about-panel-${id}`}
                tabIndex={active === index ? 0 : -1}
                onClick={() => setActive(index)}
              >
                {t(`about.tabs.${id}`)}
              </button>
            ))}
          </div>
        </header>

        <div className="about-panels" data-section-motion="body">
          {tabs.map(({ id, Panel }, index) => (
            <div
              key={id}
              className="about-panel"
              role="tabpanel"
              id={`about-panel-${id}`}
              aria-labelledby={`about-tab-${id}`}
              hidden={active !== index}
              tabIndex={0}
            >
              <Panel />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
