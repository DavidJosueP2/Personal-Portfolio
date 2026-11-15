import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import eeasaLogo from "@/assets/img/experience/eeasa.png"
import kronhosLogo from "@/assets/img/experience/kronhos.png"
import workspace from "@/assets/img/experience/neon-me.webp"

export function ExperienceTimeline() {
  const photoTrackRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const track = photoTrackRef.current
    const photo = photoRef.current
    if (!track || !photo || typeof IntersectionObserver === "undefined") return

    const motion = gsap.matchMedia()
    motion.add("(min-width: 64rem) and (prefers-reduced-motion: no-preference)", () => {
      const follow = gsap.quickTo(photo, "y", { duration: 0.55, ease: "power2.out" })
      let frame = 0
      let previousY = 0

      const update = () => {
        frame = 0
        const { top, height } = track.getBoundingClientRect()
        const travel = Math.max(0, height - photo.offsetTop - photo.offsetHeight)
        const y = gsap.utils.clamp(0, travel, (window.innerHeight * 0.23 - top) * 0.9)
        if (Math.abs(y - previousY) < 0.5) return
        previousY = y
        follow(y)
      }

      function schedule() {
        if (!frame) frame = window.requestAnimationFrame(update)
      }

      function stop() {
        window.removeEventListener("scroll", schedule)
        window.removeEventListener("resize", schedule)
        window.cancelAnimationFrame(frame)
        frame = 0
      }

      const visibility = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          window.addEventListener("scroll", schedule, { passive: true })
          window.addEventListener("resize", schedule)
          schedule()
        } else {
          stop()
        }
      })
      visibility.observe(track)

      return () => {
        visibility.disconnect()
        stop()
      }
    })

    return () => motion.revert()
  }, [])

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="portfolio-container portfolio-section bg-[#f4f4f2] dark:bg-[#151514]"
    >
      <header data-section-motion="heading" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[clamp(1.1rem,2.25vw,2.625rem)] leading-none font-bold tracking-[-0.035em] text-heading">
        <h2 id="experience-heading" className="font-sans! sm:order-last">Experience</h2>
        <p className="flex items-center gap-2.5 sm:gap-4">
          <span aria-hidden="true" className="size-[0.74em] shrink-0 rounded-[0.11em] bg-accent-ink" />
          Full-stack development
        </p>
      </header>

      <div className="mt-7 grid gap-y-10 lg:mt-0 lg:grid-cols-2 lg:gap-x-8">
        <div ref={photoTrackRef} data-section-motion="media" className="relative lg:overflow-clip lg:pt-[clamp(4rem,4.75vw,6rem)]">
          <img
            ref={photoRef}
            src={workspace}
            alt=""
            width={960}
            height={640}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full max-w-[34rem] rounded-[0.25rem] lg:w-[clamp(17rem,26vw,31rem)]"
          />
        </div>

        <ol role="list" data-section-motion="body" className="grid max-w-[40rem] gap-14 lg:gap-[clamp(5rem,7vw,8rem)] lg:pb-[clamp(4rem,7vw,7.5rem)] xl:-mt-[0.25em]">
          <li>
            <h3 className="flex items-center gap-2.5 text-[clamp(1.4rem,2vw,2.2rem)] leading-tight font-bold tracking-[-0.035em] text-heading">
              <img src={kronhosLogo} alt="" width={32} height={32} loading="lazy" decoding="async" className="size-7 shrink-0 rounded-sm bg-white object-contain p-0.5 sm:size-8" />
              Kronhos ERP
            </h3>
            <p className="mt-2 text-sm font-medium text-copy sm:text-base">
              Full Stack Developer <span aria-hidden="true">·</span> <time dateTime="2025">2025</time>–<time dateTime="2026">2026</time> <span aria-hidden="true">·</span> 6 months
            </p>
            <p className="mt-5 text-[clamp(1rem,1.27vw,1.375rem)] leading-[1.45] text-pretty text-copy">
              I built <strong className="font-semibold text-heading">frontend features for the ERP</strong> and connected them to <strong className="font-semibold text-heading">REST APIs I developed in Java and Spring Boot</strong>. I used SQL to support those workflows and built <strong className="font-semibold text-heading">Power BI dashboards</strong> for reporting and data analysis.
            </p>
          </li>

          <li>
            <h3 className="flex items-center gap-2.5 text-[clamp(1.4rem,2vw,2.2rem)] leading-tight font-bold tracking-[-0.035em] text-heading">
              <img src={eeasaLogo} alt="" width={32} height={32} loading="lazy" decoding="async" className="size-7 shrink-0 rounded-sm bg-white object-contain p-0.5 sm:size-8" />
              EEASA
            </h3>
            <p className="mt-2 text-sm font-medium text-copy sm:text-base">
              Backend Developer <span aria-hidden="true">·</span> <time dateTime="2025">2025</time>
            </p>
            <p className="mt-5 text-[clamp(1rem,1.27vw,1.375rem)] leading-[1.45] text-pretty text-copy">
              I refactored the <strong className="font-semibold text-heading">Spring Boot backend</strong> used to manage electricity meter incidents. I updated the <strong className="font-semibold text-heading">incident data model and validation rules</strong>.
            </p>
          </li>
        </ol>
      </div>
    </section>
  )
}
