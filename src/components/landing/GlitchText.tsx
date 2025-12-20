import * as React from "react"
import { cn } from "@/lib/utils"

export function GlitchText({
  as: Comp = "span",
  className,
  children,
}: {
  as?: React.ElementType
  className?: string
  children: React.ReactNode
}) {
  const text = typeof children === "string" ? children : undefined

  return (
    <Comp
      className={cn("relative inline-block", className)}
      data-glitch
      data-text={text}
    >
      {children}
      {/* Duplicados para glitch via CSS */}
      <span aria-hidden className="pointer-events-none absolute left-0 top-0 -z-10 opacity-70 [data-text]:content-[attr(data-text)]" />
    </Comp>
  )
}
