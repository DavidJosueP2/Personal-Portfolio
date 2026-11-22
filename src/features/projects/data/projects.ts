import type { TFunction } from "i18next"
import AKS from "@/assets/img/tech/AKS.webp"
import AmazonS3 from "@/assets/img/tech/Amazon S3.svg"
import Azure from "@/assets/img/tech/azure.webp"
import Cloudflare from "@/assets/img/tech/Cloudflare.svg"
import Jenkins from "@/assets/img/tech/Jenkins.webp"
import Nest from "@/assets/img/tech/Nest.js.webp"
import PostgreSQL from "@/assets/img/tech/PostgresSQL.webp"
import ReactLogo from "@/assets/img/tech/React.webp"
import SonarQube from "@/assets/img/tech/SonarQube.webp"
import Spring from "@/assets/img/tech/Spring.webp"
import Svelte from "@/assets/img/tech/Svelte.svg"
import Tailwind from "@/assets/img/tech/Tailwind CSS.webp"
import TypeScript from "@/assets/img/tech/TypeScript.webp"
import type { Project } from "../types"

function projectPreview(folder: string, width = 960) {
  const large = new URL(`../../../assets/img/projects/${folder}/preview.webp`, import.meta.url).toString()
  const small = new URL(`../../../assets/img/projects/${folder}/preview-576.webp`, import.meta.url).toString()
  return { previewSrc: large, previewSrcSet: `${small} 576w, ${large} ${width}w` }
}

const clinicPreview = projectPreview("clinic")
const clinicCoverSrc = new URL("../../../assets/img/projects/clinic/1.webp", import.meta.url).toString()
const clinicGalleryFiles = ["1", "2", "3", "5", "6", "7", "8", "9", "10"] as const
const clinicGallerySrcs = clinicGalleryFiles.map((file) => ({
  item: file,
  src: new URL(`../../../assets/img/projects/clinic/${file}.webp`, import.meta.url).toString(),
}))

const fuelPreview = projectPreview("fuel-system")
const fuelCoverSrc = new URL("../../../assets/img/projects/fuel-system/Picture7.webp", import.meta.url).toString()
const fuelGallerySrcs = Array.from({ length: 10 }, (_, i) => ({
  item: String(i + 1),
  src: new URL(`../../../assets/img/projects/fuel-system/Picture${i + 1}.webp`, import.meta.url).toString(),
}))

const hospitalPreview = projectPreview("hospital")
const hospitalCoverSrc = new URL("../../../assets/img/projects/hospital/Picture3.webp", import.meta.url).toString()
const hospitalGalleryFiles = [
  "Picture1.webp",
  "Picture2.webp",
  "Picture3.webp",
  "Picture4.webp",
  "Picture5.webp",
  "Picture6.webp",
  "Picture7.webp",
  "Picture8.webp",
  "Picture42.webp",
] as const
const hospitalGallerySrcs = hospitalGalleryFiles.map((file, index) => ({
  item: String(index + 1),
  src: new URL(`../../../assets/img/projects/hospital/${file}`, import.meta.url).toString(),
}))

const moderationPreview = projectPreview("moderation", 893)
const moderationCoverSrc = new URL("../../../assets/img/projects/moderation/Picture12.webp", import.meta.url).toString()
const moderationGalleryFiles = [
  "Picture10.webp",
  "Picture11.webp",
  "Picture12.webp",
  "Picture13.webp",
  "Picture4.webp",
  "Picture6.webp",
  "Picture7.webp",
  "Picture8.webp",
] as const
const moderationGallerySrcs = moderationGalleryFiles.map((file, index) => ({
  item: String(index + 1),
  src: new URL(`../../../assets/img/projects/moderation/${file}`, import.meta.url).toString(),
}))

const weddingPreview = projectPreview("wedding-page")
const weddingCoverSrc = new URL("../../../assets/img/projects/wedding-page/home.webp", import.meta.url).toString()
const weddingGallerySrcs = [
  new URL("../../../assets/img/projects/wedding-page/real weddings.webp", import.meta.url).toString(),
  new URL("../../../assets/img/projects/wedding-page/gallery.webp", import.meta.url).toString(),
  new URL("../../../assets/img/projects/wedding-page/enquery.webp", import.meta.url).toString(),
  new URL("../../../assets/img/projects/wedding-page/about.webp", import.meta.url).toString(),
] as const

const forisPreview = projectPreview("foris-forum chat")
const forisCoverSrc = new URL("../../../assets/img/projects/foris-forum chat/Home.webp", import.meta.url).toString()
const forisGallerySrcs = [
  new URL("../../../assets/img/projects/foris-forum chat/Comunidades.webp", import.meta.url).toString(),
  new URL("../../../assets/img/projects/foris-forum chat/Chats.webp", import.meta.url).toString(),
  new URL("../../../assets/img/projects/foris-forum chat/Crear publicación.webp", import.meta.url).toString(),
  new URL("../../../assets/img/projects/foris-forum chat/login.webp", import.meta.url).toString(),
] as const

function buildProjects(t: TFunction, lng?: string): Project[] {
  const opts = lng ? { lng } : {}
  const arrayOpts = lng ? { lng, returnObjects: true as const } : { returnObjects: true as const }
  const weddingGalleryAlts = t("projects.items.white-lace-promises.galleryAlts", arrayOpts)
  const forisGalleryAlts = t("projects.items.foris-forum-chat.galleryAlts", arrayOpts)

  return [
    {
      id: "clinic-platform",
      title: t("projects.items.clinic-platform.title", opts),
      subtitle: t("projects.items.clinic-platform.subtitle", opts),
      description: t("projects.items.clinic-platform.description", opts),
      highlights: [...t("projects.items.clinic-platform.highlights", arrayOpts)],
      stack: ["Spring Boot", "Spring Security", "PostgreSQL", "React", "React Native", "Azure"],
      tags: ["fullstack", "security", "postgres", "azure", "mobile"],
      category: "fullstack",
      featured: true,
      featuredRank: 1,
      status: "offline",
      tech: [
        { name: "Spring Boot", iconSrc: Spring },
        { name: t("projects.items.clinic-platform.techNames.reactNative", opts), iconSrc: ReactLogo },
        { name: "PostgreSQL", iconSrc: PostgreSQL },
      ],
      images: {
        ...clinicPreview,
        cover: {
          src: clinicCoverSrc,
          alt: t("projects.items.clinic-platform.coverAlt", opts),
          kind: "cover",
        },
        gallery: clinicGallerySrcs.map(({ item, src }) => ({
          src,
          alt: t("projects.items.clinic-platform.galleryAlt", { ...opts, item }),
          kind: "gallery",
        })),
      },
      links: [
        { kind: "repo", label: t("projects.linkLabels.github", opts), href: "https://github.com/DRTX2/clinic" },
      ],
    },
    {
      id: "fuel-control",
      title: t("projects.items.fuel-control.title", opts),
      subtitle: t("projects.items.fuel-control.subtitle", opts),
      description: t("projects.items.fuel-control.description", opts),
      highlights: [...t("projects.items.fuel-control.highlights", arrayOpts)],
      stack: [
        "NestJS",
        "Kubernetes (AKS)",
        "PostgreSQL",
        "Node.js",
        "React",
        "TypeScript",
        "Docker",
        "GitHub Actions",
        "Azure",
      ],
      tags: ["microservices", "kubernetes", "aks", "azure", "github-actions", "postgres", "devops", "frontend"],
      category: "microservices",
      featured: true,
      featuredRank: 2,
      status: "offline",
      tech: [
        { name: "NestJS", iconSrc: Nest },
        { name: "Azure Kubernetes Service", iconSrc: AKS },
        { name: "PostgreSQL", iconSrc: PostgreSQL },
        { name: "React", iconSrc: ReactLogo },
      ],
      images: {
        ...fuelPreview,
        cover: {
          src: fuelCoverSrc,
          alt: t("projects.items.fuel-control.coverAlt", opts),
          kind: "cover",
        },
        gallery: fuelGallerySrcs.map(({ item, src }) => ({
          src,
          alt: t("projects.items.fuel-control.galleryAlt", { ...opts, item }),
          kind: "gallery",
        })),
      },
      links: [
        { kind: "repo", label: t("projects.linkLabels.backend", opts), href: "https://github.com/DavidJosueP2/Distributed-Gasoline-System" },
        { kind: "repo", label: t("projects.linkLabels.frontend", opts), href: "https://github.com/JoelBonillaG/Distributed-Gasoline-System-Frontend" },
      ],
    },
    {
      id: "hospital-suite",
      title: t("projects.items.hospital-suite.title", opts),
      subtitle: t("projects.items.hospital-suite.subtitle", opts),
      description: t("projects.items.hospital-suite.description", opts),
      highlights: [...t("projects.items.hospital-suite.highlights", arrayOpts)],
      stack: [
        "Spring Boot",
        "PostgreSQL (Citus)",
        "Azure",
        "Eureka",
        "React",
        "TypeScript",
        "Docker",
        "GitHub Actions",
      ],
      tags: ["microservices", "spring", "react", "typescript", "postgres", "citus", "azure", "github-actions"],
      category: "microservices",
      featured: true,
      featuredRank: 3,
      tech: [
        { name: "Spring Boot", iconSrc: Spring },
        { name: "PostgreSQL (Citus)", iconSrc: PostgreSQL },
        { name: "Azure", iconSrc: Azure },
        { name: "React", iconSrc: ReactLogo },
      ],
      images: {
        ...hospitalPreview,
        cover: {
          src: hospitalCoverSrc,
          alt: t("projects.items.hospital-suite.coverAlt", opts),
          kind: "cover",
        },
        gallery: hospitalGallerySrcs.map(({ item, src }) => ({
          src,
          alt: t("projects.items.hospital-suite.galleryAlt", { ...opts, item }),
          kind: "gallery",
        })),
      },
      links: [
        { kind: "repo", label: t("projects.linkLabels.backend", opts), href: "https://github.com/JosueGarciaAbata/hospital-management-system" },
        { kind: "repo", label: t("projects.linkLabels.frontend", opts), href: "https://github.com/DavidJosueP2/Hospital-Front" },
      ],
    },
    {
      id: "moderation-platform",
      title: t("projects.items.moderation-platform.title", opts),
      subtitle: t("projects.items.moderation-platform.subtitle", opts),
      description: t("projects.items.moderation-platform.description", opts),
      highlights: [...t("projects.items.moderation-platform.highlights", arrayOpts)],
      stack: ["React", "Spring Boot", "Jenkins", "TypeScript", "Testing", "Azure", "Cloudflare", "Amazon S3"],
      tags: ["frontend", "react", "typescript", "spring", "devops", "jenkins", "cloudflare", "aws", "s3"],
      category: "fullstack",
      featured: true,
      featuredRank: 4,
      tech: [
        { name: "React", iconSrc: ReactLogo },
        { name: "TypeScript", iconSrc: TypeScript },
        { name: "Spring Boot", iconSrc: Spring },
        { name: "Jenkins", iconSrc: Jenkins },
        { name: "Cloudflare", iconSrc: Cloudflare },
        { name: "Amazon S3", iconSrc: AmazonS3 },
      ],
      images: {
        ...moderationPreview,
        cover: {
          src: moderationCoverSrc,
          alt: t("projects.items.moderation-platform.coverAlt", opts),
          kind: "cover",
        },
        gallery: moderationGallerySrcs.map(({ item, src }) => ({
          src,
          alt: t("projects.items.moderation-platform.galleryAlt", { ...opts, item }),
          kind: "gallery",
        })),
      },
      links: [
        { kind: "repo", label: t("projects.linkLabels.backend", opts), href: "https://github.com/DavidJosueP2/Marketplace_Link" },
        { kind: "repo", label: t("projects.linkLabels.frontend", opts), href: "https://github.com/DavidJosueP2/Marketplace-Link-Front" },
      ],
    },
    {
      id: "white-lace-promises",
      title: t("projects.items.white-lace-promises.title", opts),
      subtitle: t("projects.items.white-lace-promises.subtitle", opts),
      description: t("projects.items.white-lace-promises.description", opts),
      highlights: [...t("projects.items.white-lace-promises.highlights", arrayOpts)],
      stack: ["SvelteKit", "TypeScript", "Tailwind CSS", "GSAP"],
      tags: ["svelte", "sveltekit", "typescript", "tailwind", "events"],
      category: "web",
      featured: true,
      featuredRank: 5,
      status: "live",
      tech: [
        { name: "SvelteKit", iconSrc: Svelte },
        { name: "TypeScript", iconSrc: TypeScript },
        { name: "Tailwind CSS", iconSrc: Tailwind },
      ],
      images: {
        ...weddingPreview,
        cover: {
          src: weddingCoverSrc,
          alt: t("projects.items.white-lace-promises.coverAlt", opts),
          kind: "cover",
        },
        gallery: weddingGallerySrcs.map((src, index) => ({
          src,
          alt: weddingGalleryAlts[index] ?? "",
        })),
      },
      links: [
        { kind: "demo", label: t("projects.linkLabels.liveSite", opts), href: "https://while-lace-promises.vercel.app/" },
        { kind: "repo", label: t("projects.linkLabels.github", opts), href: "https://github.com/DavidJosueP2/While-Lace-Promises" },
      ],
    },
    {
      id: "foris-forum-chat",
      title: t("projects.items.foris-forum-chat.title", opts),
      subtitle: t("projects.items.foris-forum-chat.subtitle", opts),
      description: t("projects.items.foris-forum-chat.description", opts),
      highlights: [...t("projects.items.foris-forum-chat.highlights", arrayOpts)],
      stack: ["React", "NestJS", "PostgreSQL", "SonarQube", "Cloudflare", "Amazon S3"],
      tags: ["react", "nestjs", "postgresql", "sonarqube", "forum", "chat", "monorepo", "cloudflare", "aws", "s3"],
      category: "fullstack",
      featured: true,
      featuredRank: 6,
      status: "live",
      tech: [
        { name: "React", iconSrc: ReactLogo },
        { name: "NestJS", iconSrc: Nest },
        { name: "PostgreSQL", iconSrc: PostgreSQL },
        { name: "SonarQube", iconSrc: SonarQube },
        { name: "Cloudflare", iconSrc: Cloudflare },
        { name: "Amazon S3", iconSrc: AmazonS3 },
      ],
      images: {
        ...forisPreview,
        cover: {
          src: forisCoverSrc,
          alt: t("projects.items.foris-forum-chat.coverAlt", opts),
          kind: "cover",
        },
        gallery: forisGallerySrcs.map((src, index) => ({
          src,
          alt: forisGalleryAlts[index] ?? "",
        })),
      },
      links: [
        { kind: "demo", label: t("projects.linkLabels.liveSite", opts), href: "https://foris-forum-chat-2kyu.vercel.app/" },
        { kind: "repo", label: t("projects.linkLabels.github", opts), href: "https://github.com/DavidJosueP2/FORIS-Forum-Chat" },
      ],
    },
  ]
}

function projectPriority(project: Project) {
  if (project.links.some(({ kind }) => kind === "demo")) return 0
  return project.category === "microservices" ? 1 : 2
}

export function getPortfolioProjects(t: TFunction, lng?: string) {
  return buildProjects(t, lng).sort(
    (a, b) =>
      projectPriority(a) - projectPriority(b) ||
      (a.featuredRank ?? Number.MAX_SAFE_INTEGER) - (b.featuredRank ?? Number.MAX_SAFE_INTEGER),
  )
}
