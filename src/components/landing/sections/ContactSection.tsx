import { useRef, useState, type FormEvent } from "react"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/shadcn/button"

const endpoint = import.meta.env.VITE_CONTACT_FORM_ENDPOINT?.trim()
const fieldClass = "w-full rounded-xl border border-ink/20 bg-panel/75 px-4 py-3 text-base text-ink outline-none transition-colors hover:border-ink/35 focus-visible:border-accent-ink read-only:cursor-wait"

type Submission =
  | { state: "idle" | "sending" | "sent" }
  | { state: "error"; message: string }

export function ContactSection() {
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
    <section id="contact" className="portfolio-container portfolio-section" aria-labelledby="contact-heading">
      <div className="grid gap-8 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-10">
        <div>
          <h2 id="contact-heading" className="portfolio-section-title text-heading">
            Contact
          </h2>
          <p className="mt-4 text-base text-ink/75">Tell me about your project.</p>
        </div>

        <form onSubmit={sendMessage} className="grid min-w-0 gap-5 xl:max-w-[56rem]" method="post" action={endpoint}>
          <div className="grid gap-2">
            <label htmlFor="contact-name" className="text-sm font-semibold text-ink/90">Name</label>
            <input id="contact-name" name="name" autoComplete="name" maxLength={100} required readOnly={sending} onInput={editField} className={fieldClass} />
          </div>
          <div className="grid gap-2">
            <label htmlFor="contact-message" className="text-sm font-semibold text-ink/90">Message</label>
            <textarea id="contact-message" name="message" rows={5} maxLength={2500} required readOnly={sending} onInput={editField} className={`${fieldClass} min-h-36 resize-y`} />
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
      </div>
    </section>
  )
}
