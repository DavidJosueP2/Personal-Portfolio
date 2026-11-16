import { PortfolioLink } from "./PortfolioLink"
import "./site-chrome.css"

export function Footer({ onSection }: Readonly<{ onSection?: (id: string) => void }>) {
  return (
    <footer className="site-footer">
      <p data-reveal-item className="font-semibold text-ink/80">Hi there.</p>
      <nav data-reveal-item aria-label="Footer navigation">
        <PortfolioLink section="skills" onSection={onSection}>Stack</PortfolioLink>
        {onSection ? (
          <>
            <PortfolioLink section="contact" onSection={onSection}>Contact</PortfolioLink>
            <PortfolioLink section="top" onSection={onSection}>Back to top</PortfolioLink>
          </>
        ) : <a href="#site-top">Back to top</a>}
      </nav>
      <p data-reveal-item>© {new Date().getFullYear()} David Barragán</p>
    </footer>
  )
}
