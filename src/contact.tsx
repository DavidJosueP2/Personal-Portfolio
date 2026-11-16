import { StrictMode } from "react"
import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"
import { ContactPage } from "@/components/contact/ContactPage"
import { AccentThemeProvider } from "@/context/accent-theme"
import "./index.css"
import "./styles/fonts.css"

const root = createRoot(document.getElementById("root")!)

// The new document's first frame already contains the form when it slides in.
flushSync(() => {
  root.render(
    <StrictMode>
      <AccentThemeProvider>
        <ContactPage />
      </AccentThemeProvider>
    </StrictMode>,
  )
})
