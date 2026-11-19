import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/shadcn/button"
import "../hero/planet-departure.css"

export function ContactSection() {
  return (
    <section id="contact" className="contact-journey" aria-labelledby="contact-heading" data-inverse-cursor-exclude>
      <div data-departure-stage className="contact-stage portfolio-container">
        <div data-departure-scene className="planet-departure-scene" aria-hidden="true" />
        <div className="contact-invitation py-7">
          <h2 id="contact-heading" data-section-motion="heading" className="mx-auto max-w-[15ch] text-balance font-sans! text-[clamp(3rem,8vw,9rem)] leading-[0.95] font-semibold tracking-[-0.055em] text-heading">
            Let’s build something <em className="font-serif-italic">together.</em>
          </h2>
        </div>
        <div data-section-motion="body" className="contact-action">
          <Button asChild className="min-h-12 rounded-full bg-ink px-5 font-semibold text-paper! hover:bg-ink/85">
            <a href="/contact/">
              Get in touch
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
