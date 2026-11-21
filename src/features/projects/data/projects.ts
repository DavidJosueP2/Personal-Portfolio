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

export const projects: Project[] = [
  {
    id: "clinic-platform",
    title: "Clinic Management Platform",
    subtitle: "A clinic platform for patients and administrators, available on web and mobile.",
    description:
      "Integral clinic management system with secure access, patient/admin workflows, and multi-client experiences.",
    highlights: [
      "Spring Boot + Spring Security with JWT-based auth",
      "React web frontend + React Native mobile client",
      "PostgreSQL persistence + clean layered architecture",
      "Deployed on Azure (currently offline)",
    ],
    stack: ["Spring Boot", "Spring Security", "PostgreSQL", "React", "React Native", "Azure"],
    tags: ["fullstack", "security", "postgres", "azure", "mobile"],
    category: "fullstack",
    featured: true,
    featuredRank: 1,
    status: "offline",
    tech: [
      { name: "Spring Boot", iconSrc: Spring },
      { name: "React and React Native", iconSrc: ReactLogo },
      { name: "PostgreSQL", iconSrc: PostgreSQL },
    ],
    images: {
      ...projectPreview("clinic"),
      cover: {
        src: new URL("../../../assets/img/projects/clinic/1.webp", import.meta.url).toString(),
        alt: "ClinicCare home page with options to browse doctors and book an appointment",
        kind: "cover",
      },
      gallery: ["1", "2", "3", "5", "6", "7", "8", "9", "10"].map((file) => ({
        src: new URL(`../../../assets/img/projects/clinic/${file}.webp`, import.meta.url).toString(),
        alt: `Clinic platform screenshot ${file}`,
        kind: "gallery",
      })),
    },
    links: [
      { kind: "repo", label: "GitHub", href: "https://github.com/DRTX2/clinic" },
    ],
  },
  {
    id: "fuel-control",
    title: "Fuel, Trips & Routes Control System",
    subtitle: "Fuel control, trip planning, and route tracking on Azure Kubernetes Service.",
    description:
      "A distributed system for fuel control, trip planning, and route tracking designed for scalability and resiliency.",
    highlights: [
      "NestJS microservices with service discovery",
      "React + TypeScript frontend",
      "Databases per service on managed PostgreSQL",
      "Dockerized services deployed to Azure AKS with GitHub Actions",
      "Local reproduction with kind",
    ],
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
      ...projectPreview("fuel-system"),
      cover: {
        src: new URL("../../../assets/img/projects/fuel-system/Picture7.webp", import.meta.url).toString(),
        alt: "FuelIQ trip board with trips grouped by status",
        kind: "cover",
      },
      gallery: Array.from({ length: 10 }, (_, i) => ({
        src: new URL(`../../../assets/img/projects/fuel-system/Picture${i + 1}.webp`, import.meta.url).toString(),
        alt: `Fuel system screenshot ${i + 1}`,
        kind: "gallery",
      })),
    },
    links: [
      { kind: "repo", label: "Backend", href: "https://github.com/DavidJosueP2/Distributed-Gasoline-System" },
      { kind: "repo", label: "Frontend", href: "https://github.com/JoelBonillaG/Distributed-Gasoline-System-Frontend" },
    ],
  },
  {
    id: "hospital-suite",
    title: "Hospital Management Suite",
    subtitle: "Hospital operations powered by Spring microservices and distributed PostgreSQL.",
    description:
      "Hospital integration suite built as a microservices ecosystem with strong architectural patterns, distributed data, and a modern web client.",
    highlights: [
      "Spring Boot microservices with Eureka discovery",
      "React + TypeScript frontend",
      "Distributed Databases PostgreSQL using Citus",
      "Clean architecture + layered patterns",
      "CI/CD with GitHub Actions + deployment on Azure",
    ],
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
      ...projectPreview("hospital"),
      cover: {
        src: new URL("../../../assets/img/projects/hospital/Picture3.webp", import.meta.url).toString(),
        alt: "Hospital administration dashboard listing medical centers",
        kind: "cover",
      },
      gallery: [
        "Picture1.webp",
        "Picture2.webp",
        "Picture3.webp",
        "Picture4.webp",
        "Picture5.webp",
        "Picture6.webp",
        "Picture7.webp",
        "Picture8.webp",
        "Picture42.webp",
      ].map((file) => ({
        src: new URL(`../../../assets/img/projects/hospital/${file}`, import.meta.url).toString(),
        alt: `Hospital system screenshot ${file}`,
        kind: "gallery",
      })),
    },
    links: [
      { kind: "repo", label: "Backend", href: "https://github.com/JosueGarciaAbata/hospital-management-system" },
      { kind: "repo", label: "Frontend", href: "https://github.com/DavidJosueP2/Hospital-Front" },
    ],
  },
  {
    id: "moderation-platform",
    title: "Moderation Platform",
    subtitle: "A moderation console with a Spring Boot API and a Jenkins delivery pipeline.",
    description:
      "Moderation tooling platform with polished UI and secure workflows, backed by a Spring Boot API and a CI/CD pipeline.",
    highlights: [
      "React + TypeScript moderation console",
      "Spring Boot backend (API + workflows)",
      "Testing-focused development",
      "Jenkins CI/CD pipeline + deployment on Azure",
    ],
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
      ...projectPreview("moderation", 893),
      cover: {
        src: new URL("../../../assets/img/projects/moderation/Picture12.webp", import.meta.url).toString(),
        alt: "Marketplace Link moderator dashboard with status counts and a list of moderators",
        kind: "cover",
      },
      gallery: [
        "Picture10.webp",
        "Picture11.webp",
        "Picture12.webp",
        "Picture13.webp",
        "Picture4.webp",
        "Picture6.webp",
        "Picture7.webp",
        "Picture8.webp",
      ].map((file) => ({
        src: new URL(`../../../assets/img/projects/moderation/${file}`, import.meta.url).toString(),
        alt: `Moderation platform screenshot ${file}`,
        kind: "gallery",
      })),
    },
    links: [
      { kind: "repo", label: "Backend", href: "https://github.com/DavidJosueP2/Marketplace_Link" },
      { kind: "repo", label: "Frontend", href: "https://github.com/DavidJosueP2/Marketplace-Link-Front" },
    ],
  },
  {
    id: "white-lace-promises",
    title: "White Lace & Promises",
    subtitle: "A wedding and event styling website built with SvelteKit.",
    description: "A website for an event styling business, featuring a service overview, galleries of real weddings, and an enquiry form.",
    highlights: [
      "SvelteKit and TypeScript",
      "Event services and real wedding galleries",
      "Enquiry form for prospective clients",
    ],
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
      ...projectPreview("wedding-page"),
      cover: {
        src: new URL("../../../assets/img/projects/wedding-page/home.webp", import.meta.url).toString(),
        alt: "White Lace & Promises wedding and event styling homepage",
        kind: "cover",
      },
      gallery: [
        { src: new URL("../../../assets/img/projects/wedding-page/real weddings.webp", import.meta.url).toString(), alt: "Real weddings portfolio" },
        { src: new URL("../../../assets/img/projects/wedding-page/gallery.webp", import.meta.url).toString(), alt: "Event styling gallery" },
        { src: new URL("../../../assets/img/projects/wedding-page/enquery.webp", import.meta.url).toString(), alt: "Event enquiry form" },
        { src: new URL("../../../assets/img/projects/wedding-page/about.webp", import.meta.url).toString(), alt: "About the event styling business" },
      ],
    },
    links: [
      { kind: "demo", label: "Live site", href: "https://while-lace-promises.vercel.app/" },
      { kind: "repo", label: "GitHub", href: "https://github.com/DavidJosueP2/While-Lace-Promises" },
    ],
  },
  {
    id: "foris-forum-chat",
    title: "FORIS Forum & Chat",
    subtitle: "A community forum with topic-based posts and real-time chat.",
    description: "A Spanish-language platform for sharing posts, participating in communities, and chatting. The React frontend and NestJS backend share a monorepo.",
    highlights: [
      "Forum posts organized by topics and tags",
      "Communities and real-time chat",
      "PostgreSQL persistence and SonarQube code analysis",
    ],
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
      ...projectPreview("foris-forum chat"),
      cover: {
        src: new URL("../../../assets/img/projects/foris-forum chat/Home.webp", import.meta.url).toString(),
        alt: "FORIS forum homepage",
        kind: "cover",
      },
      gallery: [
        { src: new URL("../../../assets/img/projects/foris-forum chat/Comunidades.webp", import.meta.url).toString(), alt: "FORIS communities view" },
        { src: new URL("../../../assets/img/projects/foris-forum chat/Chats.webp", import.meta.url).toString(), alt: "FORIS chat interface" },
        { src: new URL("../../../assets/img/projects/foris-forum chat/Crear publicación.webp", import.meta.url).toString(), alt: "FORIS post editor" },
        { src: new URL("../../../assets/img/projects/foris-forum chat/login.webp", import.meta.url).toString(), alt: "FORIS sign-in screen" },
      ],
    },
    links: [
      { kind: "demo", label: "Live site", href: "https://foris-forum-chat-2kyu.vercel.app/" },
      { kind: "repo", label: "GitHub", href: "https://github.com/DavidJosueP2/FORIS-Forum-Chat" },
    ],
  },
]

function projectPriority(project: Project) {
  if (project.links.some(({ kind }) => kind === "demo")) return 0
  return project.category === "microservices" ? 1 : 2
}

export function getPortfolioProjects() {
  return [...projects]
    .sort((a, b) =>
      projectPriority(a) - projectPriority(b) ||
      (a.featuredRank ?? Number.MAX_SAFE_INTEGER) - (b.featuredRank ?? Number.MAX_SAFE_INTEGER)
    )
}
