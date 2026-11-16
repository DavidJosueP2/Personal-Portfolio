import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/shadcn/button"

export function ContactSection() {
  return (
    <section id="contact" className="portfolio-container portfolio-section grid min-h-[80svh] place-items-center text-center" aria-labelledby="contact-heading">
      <div className="contact-invitation py-7">
        <h2 id="contact-heading" data-section-motion="heading" className="mx-auto max-w-[15ch] text-balance font-sans! text-[clamp(3rem,8vw,9rem)] leading-[0.95] font-semibold tracking-[-0.055em] text-heading">
          Let’s build something <em className="font-serif-italic">together.</em>
        </h2>
        <div data-section-motion="body" className="mt-8 sm:mt-10">
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
