import type { ComponentProps } from "react"

type Props = Omit<ComponentProps<"a">, "href" | "onClick"> & {
  section: string
  onSection?: (id: string) => void
}

export function PortfolioLink({ section, onSection, ...props }: Props) {
  const href = section === "top" ? "/" : `/#${section}`

  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        if (!onSection || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        onSection(section)
      }}
    />
  )
}
