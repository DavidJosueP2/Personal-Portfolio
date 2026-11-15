import Azure from "./azure.png"
import AWS from "./AWS.svg"
import Docker from "./Docker.png"
import GitHub from "./GitHub.png"
import LinkedIn from "./LinkedIn.png"
import Kubernetes from "./Kubernetes (1).png"
import ReactLogo from "./React.png"
import Spring from "./Spring.png"
import TypeScript from "./TypeScript.png"
import Nest from "./Nest.js.png"

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
