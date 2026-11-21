const revealAt = 1_230
const skyPreparationLead = 360
const fadeTime = 260
const wipeEase = "cubic-bezier(.44,0,.56,1)"
const growthEase = "cubic-bezier(.38,.16,.24,1)"
const detailEase = "cubic-bezier(.22,1,.36,1)"

const mix = (start: number, end: number, progress: number) => start + (end - start) * progress
const clamp = (value: number) => Math.min(1, Math.max(0, value))

function measureWord(source: HTMLElement) {
    const bounds = source.getBoundingClientRect()
    const mask = source.parentElement?.getBoundingClientRect() ?? bounds
    const style = getComputedStyle(source)
    return {
        bounds: new DOMRect(mask.left, bounds.top, mask.width, bounds.height),
        text: source.textContent,
        style: {
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
        },
    }
}

export function setupHeroIntro(root: HTMLElement) {
    const motion = matchMedia("(prefers-reduced-motion: reduce)")
    if (motion.matches || document.hidden || (location.hash && location.hash !== "#top")) return

    const overlay = root.querySelector<HTMLElement>("[data-hero-intro]")
    const content = root.querySelector<HTMLElement>("[data-landing-content]")
    const heading = root.querySelector<HTMLElement>("#home-title")
    const navigation = root.querySelector<HTMLElement>("[data-home-navigation]")
    const layers = Array.from(overlay?.querySelectorAll<HTMLElement>("[data-intro-layer]") ?? [])
    if (!overlay || !content || !heading || !navigation || !overlay.animate || layers.length !== 3) return

    const sources = Array.from(heading.querySelectorAll<HTMLElement>("[data-home-name]"))
    const copies = layers.map((layer) => Array.from(layer.querySelectorAll<HTMLElement>("[data-intro-word]")))
    if (!sources.length || copies.some((words) => words.length !== sources.length)) return

    const events = new AbortController()
    const animations: Animation[] = []
    let finished = false
    let fontDeadline = 0
    let revealTimer = 0
    let frameRequest = 0

    const showHero = () => {
        overlay.hidden = true
        delete overlay.dataset.introRevealing
        content.inert = false
    }

    const finish = (focusHeading = false) => {
        if (finished) return
        finished = true
        window.clearTimeout(fontDeadline)
        window.clearTimeout(revealTimer)
        window.cancelAnimationFrame(frameRequest)
        events.abort()
        showHero()
        for (const animation of animations) animation.cancel()
        delete overlay.dataset.introActive
        if (focusHeading) heading.focus({ preventScroll: true })
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
    window.addEventListener("resize", () => {
        if (animations.length) finish()
    }, { signal })
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) finish()
    }, { signal })
    motion.addEventListener("change", interrupt, { signal })

    overlay.dataset.introActive = ""
    overlay.hidden = false
    content.inert = true

    const start = () => {
        if (finished) return
        window.clearTimeout(fontDeadline)

        const words = sources.map(measureWord)
        const first = words[0].bounds
        const last = words[words.length - 1].bounds
        const stacked = last.top >= first.bottom - 1
        const gap = parseFloat(words[0].style.fontSize) * 0.15
        const rowWidth = words.reduce((width, word) => width + word.bounds.width, gap * (words.length - 1))
        const rowHeight = stacked ? Math.max(...words.map(({ bounds }) => bounds.height)) : last.bottom - first.top
        const width = overlay.clientWidth
        const startScale = Math.min(0.72, width * (stacked ? 0.64 : 0.41) / rowWidth)
        const startX = (width - rowWidth * startScale) / 2
        const startY = (overlay.clientHeight - rowHeight * startScale) / 2
        const startTime = document.timeline.currentTime
        const animate = (element: HTMLElement, frames: Keyframe[], timing: KeyframeAnimationOptions) => {
            const animation = element.animate(frames, { fill: "both", ...timing })
            if (startTime !== null) animation.startTime = startTime
            animations.push(animation)
            return animation
        }

        let rowOffset = 0
        words.forEach(({ text, bounds, style }, index) => {
            const originX = startX + rowOffset * startScale
            const baselineOffset = stacked ? 0 : (bounds.top - first.top) * startScale
            const originY = startY + baselineOffset
            rowOffset += bounds.width + gap
            const frame = (growth: number) => {
                const scale = mix(startScale, 1, growth)
                // On phones the words separate vertically before moving across each other.
                const vertical = stacked ? 1 - (1 - growth) ** 4.8 : growth
                const horizontal = stacked ? (1 - Math.cos(Math.PI * clamp((growth - 0.3) / 0.7))) / 2 : growth
                const x = mix(originX, bounds.left, horizontal)
                const y = mix(originY, bounds.top, vertical)
                return { transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})` }
            }
            const frames = stacked ? Array.from({ length: 25 }, (_, step) => {
                const t = step / 24
                return { ...frame(t), offset: t }
            }) : [frame(0), frame(1)]
            for (const layerWords of copies) {
                const copy = layerWords[index]
                copy.textContent = text
                Object.assign(copy.style, style)
                animate(copy, frames, { duration: 840, easing: growthEase })
            }
        })

        const wipe = (layer: HTMLElement, delay: number, duration: number) => {
            const ink = layer.firstElementChild as HTMLElement
            const timing = { delay, duration, easing: wipeEase }
            // The ink moves against its clipping panel, so the title aligns across both colors.
            animate(layer, [{ transform: "translate3d(0,100%,0)" }, { transform: "translate3d(0,0,0)" }], timing)
            animate(ink, [{ transform: "translate3d(0,-100%,0)" }, { transform: "translate3d(0,0,0)" }], timing)
        }
        wipe(layers[1], 245, 490)
        wipe(layers[2], 790, 420)

        // Give the background shader time to draw behind the opaque overlay.
        revealTimer = window.setTimeout(() => { overlay.dataset.introRevealing = "" }, revealAt - skyPreparationLead)
        const fade = animate(overlay, [{ opacity: 1 }, { opacity: 0 }], { delay: revealAt, duration: fadeTime, easing: wipeEase })
        void fade.finished.then(showHero, () => {})

        root.querySelectorAll<HTMLElement>("[data-home-line]").forEach((line, index) => {
            animate(line, [{ transform: "translateY(75%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
                { delay: revealAt + 135 + index * 30, duration: 360, easing: detailEase })
        })
        animate(navigation, [{ transform: "translateY(-90%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
            { delay: revealAt + 180, duration: 390, easing: detailEase })
        void Promise.all(animations.map((animation) => animation.finished)).then(interrupt, () => {})
    }

    // Measure only once the displayed typefaces are ready, so the title never shifts mid-intro.
    frameRequest = window.requestAnimationFrame(() => {
        if (finished) return
        const fonts = sources.map((source) => {
            const font = getComputedStyle(source)
            return document.fonts.load(`${font.fontStyle} ${font.fontWeight} 1rem ${font.fontFamily}`, source.textContent ?? "")
        })
        fontDeadline = window.setTimeout(interrupt, 450)
        void Promise.all(fonts).then(start, interrupt)
    })

    return interrupt
}

export function afterHeroIntro(setup: () => (() => void) | undefined) {
    const opening = document.querySelector("[data-hero-intro]")
    if (!opening?.hasAttribute("data-intro-active")) return setup()

    let cleanup: (() => void) | undefined
    const observer = new MutationObserver(() => {
        if (opening.hasAttribute("data-intro-active")) return
        observer.disconnect()
        cleanup = setup()
    })
    observer.observe(opening, { attributes: true, attributeFilter: ["data-intro-active"] })
    return () => {
        observer.disconnect()
        cleanup?.()
    }
}
