import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import { en } from "./locales/en"
import { es } from "./locales/es"

export type AppLanguage = "en" | "es"

export const LANGUAGE_STORAGE_KEY = "portfolio:language"
const LANGUAGE_SESSION_KEY = "portfolio:language-session"

export function resolveLanguage(language?: string): AppLanguage {
  const normalized = language?.toLowerCase() ?? ""
  return normalized.startsWith("es") ? "es" : "en"
}

function syncDocumentMetadata(language: AppLanguage) {
  if (typeof document === "undefined") return
  document.documentElement.lang = language
  const page = document.documentElement.dataset.page === "contact" ? "contact" : "home"
  document.title = i18n.t(`meta.${page}.title`, { lng: language })
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (description) {
    description.content = i18n.t(`meta.${page}.description`, { lng: language })
  }
}

function persistQueryLanguage() {
  if (typeof window === "undefined") return
  try {
    const param = new URLSearchParams(window.location.search).get("lng")?.toLowerCase()
    if (param === "en" || param === "es") {
      window.sessionStorage.setItem(LANGUAGE_SESSION_KEY, param)
    }
  } catch {
    // Ignore storage errors in restricted browsing modes.
  }
}

persistQueryLanguage()

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    supportedLngs: ["en", "es"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    fallbackLng: "en",
    initAsync: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["querystring", "localStorage", "sessionStorage", "navigator"],
      lookupQuerystring: "lng",
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      lookupSessionStorage: LANGUAGE_SESSION_KEY,
      caches: [],
    },
  })

syncDocumentMetadata(resolveLanguage(i18n.resolvedLanguage ?? i18n.language))

i18n.on("languageChanged", (next) => {
  syncDocumentMetadata(resolveLanguage(next))
})

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== LANGUAGE_STORAGE_KEY || !event.newValue) return
    const next = resolveLanguage(event.newValue)
    if (resolveLanguage(i18n.resolvedLanguage ?? i18n.language) !== next) {
      void i18n.changeLanguage(next)
    }
  })
}

export function setAppLanguage(language: AppLanguage) {
  try {
    globalThis.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    globalThis.sessionStorage.removeItem(LANGUAGE_SESSION_KEY)
  } catch {
    // Ignore storage errors in restricted browsing modes.
  }
  void i18n.changeLanguage(language)
}

export function toggleAppLanguage() {
  const current = resolveLanguage(i18n.resolvedLanguage ?? i18n.language)
  setAppLanguage(current === "en" ? "es" : "en")
}

export default i18n
