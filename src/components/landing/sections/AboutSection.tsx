import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { ArrowUpRight, CodeXml, Cpu, MapPin } from "lucide-react"
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
import "./about-section.css"

const university = "Universidad Técnica de Ambato"
const aws = "AWS Training and Certification"
const spotify = "https://open.spotify.com/user/j9g88t92xw14rfuaz5olbi77e?si=4c2cd67004fb4708"

const credentials = [
  {
    title: "AWS Certified Cloud Practitioner",
    issuer: aws,
    image: awsPractitioner,
    href: "https://www.credly.com/badges/bcfbf0db-890f-4bb1-b2e2-e2c7641b0af2",
  },
  {
    title: "AWS SimuLearn – Solutions Architect – Training Badge",
    issuer: aws,
    image: awsSimuLearn,
    href: "https://www.credly.com/badges/8353d88c-0542-4302-b19e-c750c1848f2a",
  },
  { title: "ESP32 Microcontroller Programming Course", issuer: `${university} · 2025`, icon: Cpu },
  { title: "Desarrollo Web con Python y Django", issuer: university, icon: CodeXml, lang: "es" },
]

type UniversityEvent = {
  title: string
  type: string
  organizer: string
  detail: string
  logo: string
  coOrganizerLogo?: string
  href?: string
}

const eventYears: { year: number; events: UniversityEvent[] }[] = [
  {
    year: 2026,
    events: [
      { title: "Grok Bot Ambato Meetup", type: "Community", organizer: university, detail: "A local meetup on AI agents and what people are building with them.", logo: grokLogo },
      { title: "UTA 2026 Hackathon", type: "Competition", organizer: university, detail: "An on-campus hackathon focused on building working prototypes.", logo: utaLogo },
      { title: "3rd Universal Congress of Sciences and Research", type: "Conference", organizer: university, detail: "Attended the 32-hour program.", logo: utaLogo },
    ],
  },
  {
    year: 2025,
    events: [
      { title: "Codificadas, first edition", type: "Competition", organizer: "Tata Consultancy Services", detail: "A regional programming competition for women in tech.", logo: tcsLogo, href: "https://tcscodificadas.com/" },
    ],
  },
  {
    year: 2024,
    events: [
      { title: "CSEI 2024", type: "Conference", organizer: `FISEI, ${university}`, detail: "Attended the sixth Conference on Computer Science, Electronics and Industrial Engineering online.", logo: cseiLogo, coOrganizerLogo: fiseiLogo },
    ],
  },
  {
    year: 2023,
    events: [
      { title: "HatunSoft, first programming contest", type: "Competition", organizer: `FISEI, ${university}`, detail: "Five hours of programming problems at the FISEI agora.", logo: hatunsoftLogo },
    ],
  },
]

const interests = [
  { title: "Friends", detail: "I always look forward to getting out and catching up with friends in person." },
  { title: "Valorant", detail: "Valorant is my go-to game. I love how a round can turn on one smart play or a good call from the team." },
]

function Profile() {
  return (
    <div className="about-layout about-profile">
      <div>
        <h3 className="about-lead">Full-stack developer, <em className="font-serif-italic">microservices at heart.</em></h3>
        <p className="about-copy">
          I’m David Barragán, with <strong>one year of professional experience</strong> building web and mobile software.
          I use Clean Architecture and domain-driven design (DDD) to build reliable backend services,
          with clean, scalable code that’s easy to improve as the product grows. I care about code quality.
        </p>

        <div className="about-profile-details">
          <div id="education">
            <h4 className="about-subheading">Education</h4>
            <p className="about-list-title">Software Engineering</p>
            <p className="about-detail">{university}</p>
          </div>
          <div>
            <h4 className="about-subheading">Languages</h4>
            <dl className="about-languages">
              <div><dt>Spanish</dt><dd>Native</dd></div>
              <div><dt>English</dt><dd>B2</dd></div>
            </dl>
          </div>
        </div>
      </div>

      <div id="certs" className="about-certificates">
        <h3 className="about-subheading">Certificates</h3>
        <ul className="about-credentials">
          {credentials.map(({ title, issuer, image, href, icon: Icon, lang }) => {
            const content = (
              <>
                {image ? (
                  <img src={image} alt="" loading="lazy" decoding="async" width={52} height={52} />
                ) : (
                  <span className="about-credential-icon">{Icon && <Icon aria-hidden="true" size={23} strokeWidth={1.5} />}</span>
                )}
                <span>
                  <span className="about-list-title" lang={lang}>{title}</span>
                  <span className="about-detail">{issuer}</span>
                </span>
                {href && <ArrowUpRight aria-hidden="true" size={17} />}
              </>
            )
            return (
              <li key={title}>
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
  return (
    <div className="about-layout about-university">
      <div>
        <h3 className="about-lead">Competitions <em className="font-serif-italic">and conferences.</em></h3>
        <p className="about-copy">Meetups, programming contests, and conferences from my time at {university}.</p>
      </div>
      <ol className="about-events">
        {eventYears.map(({ year, events }) => (
          <li className="about-event-year" key={year}>
            <h4><time dateTime={String(year)}>{year}</time></h4>
            <ul>
              {events.map(({ title, type, organizer, detail, logo, coOrganizerLogo, href }) => (
                <li className="about-event" key={title}>
                  <div className="about-event-logos">
                    <img src={logo} alt="" width={176} height={176} loading="lazy" decoding="async" />
                    {coOrganizerLogo && <img src={coOrganizerLogo} alt="" width={176} height={176} loading="lazy" decoding="async" />}
                  </div>
                  <div>
                    <div className="about-event-head">
                      <h5 className="about-list-title">{title}</h5>
                      <span>{type}</span>
                    </div>
                    <p className="about-detail">{organizer}</p>
                    <p className="about-event-copy">{detail}</p>
                    {href && (
                      <a className="about-event-link" href={href} target="_blank" rel="noopener noreferrer">
                        Event website <ArrowUpRight aria-hidden="true" size={14} />
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
    <button ref={buttonRef} className="about-basketball" data-slot="about-basketball" type="button" aria-label="Bounce the basketball">
      <span className="about-basketball-shadow" aria-hidden="true" />
      <span className="about-basketball-body" aria-hidden="true">
        <span className="about-basketball-fallback" />
        <canvas ref={canvasRef} />
      </span>
    </button>
  )
}

function Personal() {
  return (
    <div className="about-layout about-personal">
      <div>
        <h3 className="about-lead">Off the <em className="font-serif-italic">clock.</em></h3>
        <ul className="about-interests">
          <li className="about-interest about-interest-basketball">
            <h4>Basketball</h4>
            <div className="about-basketball-detail">
              <p>Give me a court and a ball and I’m happy. Playing basketball is one of my favorite ways to unwind.</p>
              <BasketballToy />
            </div>
          </li>
          {interests.map(({ title, detail }) => (
            <li className="about-interest" key={title}>
              <h4>{title}</h4>
              <p>{detail}</p>
            </li>
          ))}
          <li className="about-interest">
            <h4>Music</h4>
            <div>
              <p>I love music. I’m the kind of person who wants a soundtrack for the whole day.</p>
              <a className="about-spotify" href={spotify} target="_blank" rel="noopener noreferrer">
                <img src={spotifyCover} alt="" width={300} height={300} loading="lazy" decoding="async" />
                <span>Find me on Spotify</span>
                <ArrowUpRight aria-hidden="true" size={19} />
              </a>
            </div>
          </li>
        </ul>
      </div>
      <figure className="about-art">
        <img
          src={surrealism}
          alt="Surrealist painting of a reclining figure whose silhouette opens onto a blue sky with clouds"
          width={1200}
          height={1499}
          loading="lazy"
          decoding="async"
        />
        <figcaption>
          <h4>Surrealism</h4>
          <p>Surrealism is the art I keep coming back to. I like how a familiar scene can start to feel like a dream.</p>
        </figcaption>
      </figure>
    </div>
  )
}

const tabs = [
  { id: "profile", label: "Profile", Panel: Profile },
  { id: "university", label: "University", Panel: University },
  { id: "personal", label: "Personal", Panel: Personal },
] as const

export function AboutSection() {
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
            <h2 id="about-heading">About <em className="font-serif-italic">me.</em></h2>
            <p className="about-location"><MapPin aria-hidden="true" size={15} /> Ambato, Ecuador</p>
          </div>

          <div className="about-tabs" role="tablist" aria-label="About me" onKeyDown={navigateTabs}>
            {tabs.map(({ id, label }, index) => (
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
                {label}
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
