import { useTranslation } from "react-i18next"
import { PortfolioLink } from "./PortfolioLink"
import "./site-chrome.css"

export function Footer({ onSection }: Readonly<{ onSection?: (id: string) => void }>) {
  const { t } = useTranslation()

  return (
    <footer className="site-footer">
      <p data-reveal-item className="font-semibold text-ink/80">{t("footer.greeting")}</p>
      <nav data-reveal-item aria-label={t("footer.navAria")}>
        <PortfolioLink section="skills" onSection={onSection}>{t("footer.stack")}</PortfolioLink>
        {onSection ? (
          <>
            <PortfolioLink section="contact" onSection={onSection}>{t("footer.contact")}</PortfolioLink>
            <PortfolioLink section="top" onSection={onSection}>{t("footer.backToTop")}</PortfolioLink>
          </>
        ) : <a href="#site-top">{t("footer.backToTop")}</a>}
      </nav>
      <p data-reveal-item>© {new Date().getFullYear()} David Barragán</p>
    </footer>
  )
}
