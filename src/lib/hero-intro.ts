import { gsap } from "gsap"

const inkOnDark = "#f5f5f3"
const inkOnAccent = "#08111b"

function measureWord(source: HTMLElement, copy: HTMLElement) {
    const bounds = source.getBoundingClientRect()
    const mask = source.parentElement?.getBoundingClientRect() ?? bounds
    const style = getComputedStyle(source)

    copy.textContent = source.textContent
    Object.assign(copy.style, {
        width: `${mask.width}px`,
        height: `${bounds.height}px`,
        paddingLeft: `${bounds.left - mask.left}px`,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        letterSpacing: style.letterSpacing,
        lineHeight: style.lineHeight,
    })

    return { copy, bounds: new DOMRect(mask.left, bounds.top, mask.width, bounds.height) }
}

export function setupHeroIntro(root: HTMLElement) {
    const motion = matchMedia("(prefers-reduced-motion: reduce)")
    if (motion.matches || document.hidden || window.scrollY > 1) return

    const overlay = root.querySelector<HTMLElement>("[data-hero-intro]")
    const content = root.querySelector<HTMLElement>("[data-landing-content]")
    const heading = root.querySelector<HTMLElement>("#home-title")
    const navigation = root.querySelector<HTMLElement>("[data-home-navigation]")
    const base = overlay?.querySelector<HTMLElement>("[data-intro-base]")
    const accent = overlay?.querySelector<HTMLElement>("[data-intro-accent]")
    const night = overlay?.querySelector<HTMLElement>("[data-intro-night]")
    if (!overlay || !content || !heading || !navigation || !base || !accent || !night) return

    const sources = Array.from(heading.querySelectorAll<HTMLElement>("[data-home-name]"))
    const copies = Array.from(overlay.querySelectorAll<HTMLElement>("[data-intro-word]"))
    if (!sources.length || sources.length !== copies.length) return

    const lines = root.querySelectorAll<HTMLElement>("[data-home-line]")
    const context = gsap.context(() => {
        gsap.set(lines, { yPercent: 108, autoAlpha: 0 })
        gsap.set(navigation, { yPercent: -105, autoAlpha: 0 })
    }, root)
    const events = new AbortController()
    let finished = false
    let fontDeadline = 0

    const showHero = (focusHeading = false) => {
        heading.style.removeProperty("visibility")
        overlay.hidden = true
        content.inert = false
        if (focusHeading) heading.focus({ preventScroll: true })
    }

    const finish = (focusHeading = false) => {
        if (finished) return
        finished = true
        window.clearTimeout(fontDeadline)
        events.abort()
        context.revert()
        showHero(focusHeading)
    }

    const signal = events.signal
    const interrupt = () => finish()
    window.addEventListener("keydown", (event) => {
        if (overlay.hidden) return
        if (event.key === "Escape") finish(true)
        if (event.key === "Tab") finish()
    }, { signal })
    window.addEventListener("wheel", interrupt, { passive: true, signal })
    window.addEventListener("touchmove", interrupt, { passive: true, signal })
    window.addEventListener("scroll", () => {
        if (window.scrollY > 1) finish()
    }, { passive: true, signal })
    window.addEventListener("resize", interrupt, { signal })
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) finish()
    }, { signal })
    motion.addEventListener("change", interrupt, { signal })

    overlay.hidden = false
    heading.style.visibility = "hidden"
    content.inert = true

    // Let the title use the actual font metrics, with a short fallback for a slow connection.
    const loadFonts = Promise.all(sources.map((source) => {
        const style = getComputedStyle(source)
        return document.fonts.load(
            `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
            source.textContent ?? "",
        )
    }))
    fontDeadline = window.setTimeout(interrupt, 450)
    void loadFonts.then(() => {
        if (finished) return
        window.clearTimeout(fontDeadline)

        const width = overlay.clientWidth
        const height = overlay.clientHeight
        const words = sources.map((source, index) => measureWord(source, copies[index]))
        const firstBounds = words[0].bounds
        const lastBounds = words[words.length - 1].bounds
        const stacked = lastBounds.top >= firstBounds.bottom - 1
        const gap = parseFloat(getComputedStyle(sources[0]).fontSize) * 0.15
        const titleWidth = words.reduce((sum, word) => sum + word.bounds.width, gap * (words.length - 1))
        const titleHeight = stacked ? firstBounds.height : lastBounds.bottom - firstBounds.top
        const startScale = Math.min(0.72, width * (stacked ? 0.64 : 0.41) / titleWidth)
        const startY = (height - titleHeight * startScale) / 2
        let rowOffset = 0
        const positions = words.map((word) => {
            const position = { ...word, rowOffset }
            rowOffset += word.bounds.width + gap
            return position
        })

        const accentColor = getComputedStyle(accent).backgroundColor
        const finalInk = getComputedStyle(heading).color
        const tintedInk = gsap.utils.interpolate(inkOnDark, accentColor, 0.28)
        const revealInk = gsap.utils.interpolate(tintedInk, finalInk)
        const mix = gsap.utils.interpolate
        const clampStop = gsap.utils.clamp(0, 100)
        const cross = gsap.utils.pipe(gsap.utils.normalize(0.30, 1), gsap.utils.clamp(0, 1), gsap.parseEase("sine.inOut"))
        const progress = { growth: 0, accent: 0, night: 0, reveal: 0 }

        const paint = () => {
            if (overlay.hidden) return

            const accentEdge = height * (1 - progress.accent)
            const nightEdge = height * (1 - progress.night)
            const scale = mix(startScale, 1, progress.growth)
            // On narrow screens, separate the lines vertically before their paths cross.
            const vertical = stacked ? 1 - (1 - progress.growth) ** 4.8 : progress.growth
            const horizontal = stacked ? cross(progress.growth) : progress.growth
            const rowScale = stacked ? scale : startScale
            const rowX = (width - titleWidth * rowScale) / 2
            const nightInk = revealInk(progress.reveal)

            accent.style.transform = `translate3d(0, ${accentEdge}px, 0)`
            night.style.transform = `translate3d(0, ${nightEdge}px, 0)`
            base.style.visibility = progress.reveal > 0 ? "hidden" : "visible"
            accent.style.visibility = base.style.visibility
            night.style.opacity = String(1 - progress.reveal)

            // Color follows each wipe edge through the same set of glyphs.
            for (const { copy, bounds, rowOffset } of positions) {
                const x = mix(rowX + rowOffset * rowScale, bounds.left, horizontal)
                const baselineOffset = stacked ? 0 : (bounds.top - firstBounds.top) * startScale
                const y = mix(startY + baselineOffset, bounds.top, vertical)
                const accentStop = clampStop((accentEdge - y) / (bounds.height * scale) * 100)
                const nightStop = clampStop((nightEdge - y) / (bounds.height * scale) * 100)
                copy.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
                copy.style.backgroundImage = `linear-gradient(to bottom, ${inkOnDark} 0% ${accentStop}%, ${inkOnAccent} ${accentStop}% ${nightStop}%, ${nightInk} ${nightStop}% 100%)`
            }
        }

        paint()
        context.add(() => {
            gsap.timeline({ onUpdate: paint, onComplete: interrupt })
                .to(progress, { accent: 1, duration: 0.57, ease: "power2.inOut" }, 0.4)
                .to(progress, { growth: 1, duration: 0.76, ease: "power3.inOut" }, 0.34)
                .to(progress, { night: 1, duration: 0.51, ease: "power2.inOut" }, 1.06)
                .to(progress, { reveal: 1, duration: 0.33, ease: "sine.inOut" }, 1.57)
                .call(() => showHero(), [], 1.9)
                .addLabel("details", 1.92)
                .to(lines, { yPercent: 0, autoAlpha: 1, duration: 0.54, stagger: 0.064, ease: "power3.out" }, "details")
                .to(navigation, { yPercent: 0, autoAlpha: 1, duration: 0.62, ease: "power3.out" }, "details+=0.15")
        })
    }, interrupt)

    return interrupt
}
