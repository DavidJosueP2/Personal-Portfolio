import { useRef, useState, type FormEvent } from "react"
import { ArrowUpRight } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import { Button } from "@/components/ui/shadcn/button"
import { HeaderNav } from "@/components/landing/HeaderNav"
import { Footer } from "@/components/landing/Footer"

const endpoint = import.meta.env.VITE_CONTACT_FORM_ENDPOINT?.trim()
const fieldClass = "w-full min-w-0 border-b border-ink/25 bg-transparent px-0 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink/50 hover:border-ink/45 focus:border-accent-ink read-only:cursor-wait"

type SubmissionErrorKey = "unavailable" | "rateLimited" | "error"

type Submission =
  | { state: "idle" | "sending" | "sent" }
  | { state: "error"; errorKey: SubmissionErrorKey }

export function ContactPage() {
  const { t } = useTranslation()
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
        field.setCustomValidity(
          field.name === "name"
            ? t("contact.page.validation.nameRequired")
            : t("contact.page.validation.messageRequired"),
        )
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
      setSubmission({ state: "error", errorKey: "unavailable" })
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
        setSubmission({ state: "error", errorKey: "rateLimited" })
        return
      }

      const isJson = response.headers.get("content-type")?.includes("application/json")
      if (!response.ok || (response.status !== 204 && !isJson)) {
        throw new Error("Contact submission failed")
      }

      form.reset()
      setSubmission({ state: "sent" })
    } catch {
      setSubmission({ state: "error", errorKey: "error" })
    } finally {
      inFlight.current = false
    }
  }

  const feedback =
    submission.state === "error"
      ? t(`contact.page.feedback.${submission.errorKey}`)
      : submission.state === "sent"
        ? t("contact.page.feedback.sent")
        : ""

  return (
    <div id="site-top" className="min-h-svh text-[#f4f2ec]">
      <div data-music-fixed className="music-fixed-header">
        <HeaderNav />
      </div>
      <div data-music-flow className="flex min-h-svh flex-col bg-[#0b0b0a] text-[#f4f2ec]">
        <main className="mx-auto grid w-full max-w-[96rem] flex-1 content-start gap-10 px-[clamp(1.25rem,5vw,5rem)] pt-[clamp(6.75rem,11vw,11rem)] pb-[clamp(3rem,7vw,7rem)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-[clamp(2.5rem,8vw,9rem)]" aria-labelledby="contact-page-title">
          <div>
            <h1 id="contact-page-title" className="font-sans! text-[clamp(3.5rem,8.6vw,9rem)]! leading-[0.96]! font-semibold tracking-[-0.055em]">
              <Trans
                i18nKey="contact.page.title"
                components={{ 1: <em className="font-serif-italic" /> }}
              />
            </h1>
            <p className="mt-5 max-w-[30ch] text-pretty text-base leading-relaxed text-ink/70 sm:text-lg">{t("contact.page.subtitle")}</p>
          </div>

          <form id="contact-form" onSubmit={sendMessage} className="grid min-w-0 scroll-mt-24 gap-6 border-t border-ink/20 pt-7 sm:gap-8 md:mt-2" method="post" action={endpoint}>
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
              <div className="grid min-w-0 gap-1">
                <label htmlFor="contact-name" className="text-sm font-semibold">{t("contact.page.fields.name.label")}</label>
                <input id="contact-name" name="name" autoComplete="name" placeholder={t("contact.page.fields.name.placeholder")} maxLength={100} required readOnly={sending} onInput={editField} className={fieldClass} />
              </div>
              <div className="grid min-w-0 gap-1">
                <label htmlFor="contact-email" className="text-sm font-semibold">
                  {t("contact.page.fields.email.label")} <span className="font-normal text-ink/65">{t("contact.page.optional")}</span>
                </label>
                <input id="contact-email" name="email" type="email" autoComplete="email" placeholder={t("contact.page.fields.email.placeholder")} maxLength={254} readOnly={sending} onInput={editField} className={fieldClass} />
              </div>
            </div>
            <div className="grid gap-1">
              <label htmlFor="contact-subject" className="text-sm font-semibold">
                {t("contact.page.fields.subject.label")} <span className="font-normal text-ink/65">{t("contact.page.optional")}</span>
              </label>
              <input id="contact-subject" name="subject" placeholder={t("contact.page.fields.subject.placeholder")} maxLength={120} readOnly={sending} onInput={editField} className={fieldClass} />
            </div>
            <div className="grid gap-1">
              <label htmlFor="contact-message" className="text-sm font-semibold">{t("contact.page.fields.message.label")}</label>
              <textarea id="contact-message" name="message" rows={4} placeholder={t("contact.page.fields.message.placeholder")} maxLength={2500} required readOnly={sending} onInput={editField} className={`${fieldClass} min-h-32 resize-y`} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button type="submit" disabled={sending} className="min-h-11 rounded-full bg-[rgb(var(--accent-rgb,52_211_153))] px-5 font-semibold text-black hover:bg-[rgb(var(--accent-rgb,52_211_153)/0.86)]">
                {sending ? t("contact.page.sending") : t("contact.page.submit")}
                <ArrowUpRight aria-hidden="true" />
              </Button>
              <p role="status" className={`text-sm ${submission.state === "error" ? "text-error-ink" : "text-ink/80"}`}>
                {feedback}
              </p>
            </div>
          </form>
        </main>
        <Footer />
      </div>
    </div>
  )
}
