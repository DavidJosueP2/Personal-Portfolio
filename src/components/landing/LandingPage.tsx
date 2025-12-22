import { ConstellationBackground } from "@/components/landing/ConstellationBackground"
import { HeaderNav } from "@/components/landing/HeaderNav"
import { HeroSection } from "@/components/landing/sections/HeroSection"
import { AboutSection } from "@/components/landing/sections/AboutSection"
import { ProjectsSection } from "@/components/landing/sections/ProjectsSection"
import { SkillsSection } from "@/components/landing/sections/SkillsSection"
import { CertsSection } from "@/components/landing/sections/CertsSection"
import { ContactSection } from "@/components/landing/sections/ContactSection"
import { Footer } from "@/components/landing/Footer"
import { ExperienceTimeline } from "@/components/landing/ExperienceTimeline"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <ConstellationBackground />
      <div className="relative z-10">
        <HeaderNav />
        <HeroSection />
        <AboutSection />
        <ExperienceTimeline
          items={[
            {
              range: "2025 – Present",
              title: "Backend Developer",
              org: "EEASA (Freelance Project)",
              location: "Ambato, Ecuador",
              description:
                "Refactoring and improvement of a Spring Boot system for electricity meter incident management, optimizing entities and validations.",
            },
            {
              range: "2025",
              title: "Full Stack Developer",
              org: "Universidad Técnica de Ambato (Academic Project)",
              description:
                "Implementation of a modular hospital system with microservices and distributed databases, including appointment management and scalable system design.",
            },
          ]}
        />
        <ProjectsSection />
        <SkillsSection />
        <CertsSection />
        <ContactSection />
        <Footer />
      </div>
    </div>
  )
}
