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

export function LandingPage() {
    return (
        <div className="min-h-screen bg-paper text-ink">
            <ConstellationBackground />
            <div className="relative z-10">
                <HeaderNav />
                <main>
                    <HeroSection />
                    <ExperienceTimeline />
                    <ServicesSection />
                    <ProjectsSection />
                    <SkillsSection />
                    <AboutSection />
                    <ContactSection />
                </main>
                <Footer />
            </div>
        </div>
    )
}
