import Azure from "./azure.webp"
import AWS from "./AWS.svg"
import Docker from "./Docker.webp"
import GitHub from "./GitHub.webp"
import LinkedIn from "./LinkedIn.webp"
import Kubernetes from "./Kubernetes (1).webp"
import ReactLogo from "./React.webp"
import Spring from "./Spring.webp"
import TypeScript from "./TypeScript.webp"
import Nest from "./Nest.js.webp"

// Lista general reutilizable (Projects, etc.)
export const techLogos = [
  { name: "TypeScript", src: TypeScript },
  { name: "React", src: ReactLogo },
  { name: "Spring", src: Spring },
  { name: "Docker", src: Docker },
  { name: "Azure", src: Azure },
  { name: "Nest.js", src: Nest },
] as const

export const topHeroTools = [
  { name: "React", src: ReactLogo },
  { name: "Spring", src: Spring },
  { name: "Kubernetes", src: Kubernetes },
  { name: "Azure", src: Azure },
  { name: "AWS", src: AWS },
] as const

export const socialLogos = {
  LinkedIn,
  GitHub,
} as const
