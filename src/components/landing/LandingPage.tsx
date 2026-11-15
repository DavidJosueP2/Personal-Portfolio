import { useLayoutEffect, useRef } from "react"
import { gsap } from "gsap"
import { ConstellationBackground } from "@/components/landing/ConstellationBackground"
import { HeaderNav } from "@/components/landing/HeaderNav"
import { HeroSection } from "@/components/landing/sections/HeroSection"
import { AboutSection } from "@/components/landing/sections/AboutSection"
import { ProjectsSection } from "@/components/landing/sections/ProjectsSection"
import { ServicesSection } from "@/components/landing/sections/ServicesSection"
import { SkillsSection } from "@/components/landing/sections/SkillsSection"
import { ContactSection } from "@/components/landing/sections/ContactSection"
import { Footer } from "@/components/landing/Footer"
import { ExperienceTimeline } from "@/components/landing/ExperienceTimeline"
import { prefersReducedMotion } from "@/lib/motion"
import { setupSectionStack } from "@/lib/section-stack"

const sections = [HeroSection, ExperienceTimeline, ServicesSection, ProjectsSection, SkillsSection, AboutSection, ContactSection]

export function LandingPage() {
    const rootRef = useRef<HTMLDivElement>(null)
    const sectionsRef = useRef<HTMLElement>(null)

    useLayoutEffect(() => {
        const main = sectionsRef.current
        if (main) return setupSectionStack(main)
    }, [])

    useLayoutEffect(() => {
        const root = rootRef.current
        if (!root || prefersReducedMotion()) return

        const names = root.querySelectorAll<HTMLElement>("[data-home-name]")
        const lines = root.querySelectorAll<HTMLElement>("[data-home-line]")
        const navigation = root.querySelector<HTMLElement>("[data-home-navigation]")
        const context = gsap.context(() => {
            gsap.set(names, {
                yPercent: (_index, element: HTMLElement) => element.dataset.homeName === "above" ? -112 : 112,
                autoAlpha: 0,
            })
            gsap.set(lines, { yPercent: 108, autoAlpha: 0 })
            gsap.set(navigation, { yPercent: -105, autoAlpha: 0 })

            gsap.timeline({ defaults: { ease: "power3.out" } })
                .to(names, { yPercent: 0, autoAlpha: 1, duration: 0.82, stagger: 0.12, clearProps: "transform,opacity,visibility" })
                .addLabel("details")
                .to(lines, { yPercent: 0, autoAlpha: 1, duration: 0.54, stagger: 0.064, clearProps: "transform,opacity,visibility" }, "details")
                .to(navigation, { yPercent: 0, autoAlpha: 1, duration: 0.62, clearProps: "transform,opacity,visibility" }, "details+=0.15")
        }, root)

        return () => context.revert()
    }, [])

    return (
        <div ref={rootRef} className="min-h-screen bg-paper text-ink">
            <ConstellationBackground />
            <div className="relative z-10">
                <HeaderNav />
                <main ref={sectionsRef} className="isolate">
                    {sections.map((Section, index) => (
                        <div key={index} data-stack-panel className="relative" style={{ zIndex: index }}>
                            <div data-stack-entry>
                                <div data-stack-surface>
                                    <Section />
                                </div>
                            </div>
                        </div>
                    ))}
                </main>
                <Footer />
            </div>
        </div>
    )
}
