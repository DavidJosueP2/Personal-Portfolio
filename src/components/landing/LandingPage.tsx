import { useLayoutEffect, useRef } from "react"
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
import { setupHeroIntro } from "@/lib/hero-intro"
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
        if (root) return setupHeroIntro(root)
    }, [])

    return (
        <div ref={rootRef} className="min-h-screen bg-paper text-ink">
            <ConstellationBackground />
            <div data-landing-content className="relative z-10">
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
            <div data-hero-intro hidden aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] isolate overflow-hidden">
                <div data-intro-base className="absolute inset-0 bg-[var(--intro-paper)]" />
                <div data-intro-accent className="absolute inset-0 bg-[rgb(var(--accent-rgb,52_211_153))] [transform:translateY(100%)]" />
                <div data-intro-night className="absolute inset-0 bg-[var(--intro-paper)] [transform:translateY(100%)]" />
                <span data-intro-word className="absolute top-0 left-0 origin-top-left bg-clip-text whitespace-nowrap text-transparent" />
                <span data-intro-word className="absolute top-0 left-0 origin-top-left bg-clip-text whitespace-nowrap text-transparent" />
            </div>
        </div>
    )
}
