import Azure from "./azure.png"
import Docker from "./Docker.png"
import GitHub from "./GitHub.png"
import LinkedIn from "./LinkedIn.png"
import ReactLogo from "./React.png"
import Spring from "./Spring.png"
import TypeScript from "./TypeScript.png"
import Nest from "./Nest.js.png"

export const topHeroTools = [
  { name: "TypeScript", src: TypeScript },
  { name: "React", src: ReactLogo },
  { name: "Spring", src: Spring },
  { name: "Docker", src: Docker },
  { name: "Azure", src: Azure },
  { name: "Nest.js", src: Nest },
] as const

export const socialLogos = {
  LinkedIn,
  GitHub,
} as const
