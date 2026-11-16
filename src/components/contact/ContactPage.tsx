import { useRef, useState, type FormEvent } from "react"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/shadcn/button"

const endpoint = import.meta.env.VITE_CONTACT_FORM_ENDPOINT?.trim()
const fieldClass = "w-full min-w-0 border-b border-ink/25 bg-transparent px-0 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink/50 hover:border-ink/45 focus:border-accent-ink read-only:cursor-wait"

type Submission =
  | { state: "idle" | "sending" | "sent" }
  | { state: "error"; message: string }

export function ContactPage() {
  const [submission, setSubmission] = useState<Submission>({ state: "idle" })
  const inFlight = useRef(false)
  const sending = submission.state === "sending"

  function editField(event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) {
    event.currentTarget.setCustomValidity("")
    if (submission.state === "error" || submission.state === "sent") {
      setSubmission({ state: "idle" })
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return

    const form = event.currentTarget
    const data = new FormData(form)
    const fields = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[required]")]
    for (const field of fields) {
      const value = field.value.trim()
      if (!value) {
        field.setCustomValidity(field.name === "name" ? "Enter your name." : "Enter a message.")
        field.reportValidity()
        return
      }
      data.set(field.name, value)
    }
    for (const name of ["email", "subject"]) {
      const value = String(data.get(name) ?? "").trim()
      if (value) data.set(name, value)
      else data.delete(name)
    }

    if (!endpoint) {
      setSubmission({ state: "error", message: "Contact is temporarily unavailable. Please try again later." })
      return
    }

    inFlight.current = true
    setSubmission({ state: "sending" })
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      })

      if (response.status === 429) {
        setSubmission({ state: "error", message: "Too many messages were sent. Wait a moment and try again." })
        return
      }

      const isJson = response.headers.get("content-type")?.includes("application/json")
      if (!response.ok || (response.status !== 204 && !isJson)) {
        throw new Error("Contact submission failed")
      }

      form.reset()
      setSubmission({ state: "sent" })
    } catch {
      setSubmission({ state: "error", message: "Your message could not be sent. Please try again." })
    } finally {
      inFlight.current = false
    }
  }

  const feedback = submission.state === "error" ? submission.message : submission.state === "sent" ? "Message sent." : ""

  return (
    <div className="min-h-svh bg-[#0b0b0a] text-[#f4f2ec]">
      <header className="mx-auto flex max-w-[96rem] items-center justify-between gap-4 border-b border-ink/12 px-[clamp(1.25rem,5vw,5rem)] py-4 sm:py-6">
        <a href="/" aria-label="David Barragán, home" className="flex min-h-11 items-center text-sm font-semibold! tracking-[0.25em] text-ink! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink">DJB</a>
        <a href="/" className="group inline-flex min-h-11 items-center gap-2 text-sm text-ink/75! hover:text-ink! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink">
          <ArrowLeft aria-hidden="true" className="size-4 motion-safe:transition-transform motion-safe:group-hover:-translate-x-1" />
          Back to portfolio
        </a>
      </header>
      <main className="mx-auto grid max-w-[96rem] gap-10 px-[clamp(1.25rem,5vw,5rem)] pt-[clamp(3rem,9vw,9rem)] pb-[clamp(3rem,7vw,7rem)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-[clamp(2.5rem,8vw,9rem)]" aria-labelledby="contact-page-title">
        <div>
          <h1 id="contact-page-title" className="font-sans! text-[clamp(3.5rem,8.6vw,9rem)]! leading-[0.96]! font-semibold tracking-[-0.055em]">
            Let’s <em className="font-serif-italic">talk.</em>
          </h1>
          <p className="mt-5 max-w-[30ch] text-pretty text-base leading-relaxed text-ink/70 sm:text-lg">Tell me what you have in mind. A few details are enough to get started.</p>
        </div>

        <form onSubmit={sendMessage} className="grid min-w-0 gap-6 border-t border-ink/20 pt-7 sm:gap-8 md:mt-2" method="post" action={endpoint}>
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
            <div className="grid min-w-0 gap-1">
              <label htmlFor="contact-name" className="text-sm font-semibold">Name</label>
              <input id="contact-name" name="name" autoComplete="name" placeholder="Your name" maxLength={100} required readOnly={sending} onInput={editField} className={fieldClass} />
            </div>
            <div className="grid min-w-0 gap-1">
              <label htmlFor="contact-email" className="text-sm font-semibold">Email <span className="font-normal text-ink/65">(optional)</span></label>
              <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} readOnly={sending} onInput={editField} className={fieldClass} />
            </div>
          </div>
          <div className="grid gap-1">
            <label htmlFor="contact-subject" className="text-sm font-semibold">Subject <span className="font-normal text-ink/65">(optional)</span></label>
            <input id="contact-subject" name="subject" placeholder="What’s on your mind?" maxLength={120} readOnly={sending} onInput={editField} className={fieldClass} />
          </div>
          <div className="grid gap-1">
            <label htmlFor="contact-message" className="text-sm font-semibold">Message</label>
            <textarea id="contact-message" name="message" rows={4} placeholder="A little about what you’d like to build" maxLength={2500} required readOnly={sending} onInput={editField} className={`${fieldClass} min-h-32 resize-y`} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button type="submit" disabled={sending} className="min-h-11 rounded-full bg-[rgb(var(--accent-rgb,52_211_153))] px-5 font-semibold text-black hover:bg-[rgb(var(--accent-rgb,52_211_153)/0.86)]">
              {sending ? "Sending…" : "Send message"}
              <ArrowUpRight aria-hidden="true" />
            </Button>
            <p role="status" className={`text-sm ${submission.state === "error" ? "text-error-ink" : "text-ink/80"}`}>
              {feedback}
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}
