import { techLogos } from "@/assets/img/tech"
import type { Project } from "../types"

type TechLogo = (typeof techLogos)[number]

function toProjectTech(t: TechLogo) {
  return { name: t.name === "Spring" ? "Spring Boot" : t.name, iconSrc: t.src }
}

// NOTE: Replace hrefs with your real repos when you have them handy.
export const projects: Project[] = [
  {
    id: "clinic-platform",
    title: "Clinic Management Platform",
    subtitle: "Fullstack + mobile, auth & security",
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
      techLogos.find((t) => t.name === "Spring"),
      techLogos.find((t) => t.name === "React"),
      techLogos.find((t) => t.name === "Docker"),
      techLogos.find((t) => t.name === "Azure"),
    ]
      .filter(Boolean)
      .map((t) => toProjectTech(t as TechLogo)),
    images: {
      cover: {
        src: new URL("../../../assets/img/projects/clinic/1.png", import.meta.url).toString(),
        alt: "Clinic platform screenshot",
        kind: "cover",
      },
      gallery: ["1", "2", "3", "5", "6", "7", "8", "9", "10"].map((file) => ({
        src: new URL(`../../../assets/img/projects/clinic/${file}.png`, import.meta.url).toString(),
        alt: `Clinic platform screenshot ${file}`,
        kind: "gallery",
      })),
    },
    links: [
      { kind: "repo", label: "Repo", href: "https://github.com/DRTX2/clinic" },
    ],
  },
  {
    id: "fuel-control",
    title: "Fuel, Trips & Routes Control System",
    subtitle: "Microservices on Kubernetes (AKS)",
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
      "Node.js",
      "React",
      "TypeScript",
      "PostgreSQL",
      "Docker",
      "Kubernetes (AKS)",
      "GitHub Actions",
      "Azure",
    ],
    tags: ["microservices", "kubernetes", "aks", "azure", "github-actions", "postgres", "devops", "frontend"],
    category: "microservices",
    featured: true,
    featuredRank: 2,
    status: "offline",
    tech: [
      techLogos.find((t) => t.name === "Nest.js"),
      techLogos.find((t) => t.name === "React"),
      techLogos.find((t) => t.name === "Docker"),
      techLogos.find((t) => t.name === "Azure"),
    ]
      .filter(Boolean)
      .map((t) => toProjectTech(t as TechLogo)),
    images: {
      cover: {
        src: new URL("../../../assets/img/projects/fuel-system/Picture1.png", import.meta.url).toString(),
        alt: "Fuel system screenshot",
        kind: "cover",
      },
      gallery: Array.from({ length: 10 }, (_, i) => ({
        src: new URL(`../../../assets/img/projects/fuel-system/Picture${i + 1}.png`, import.meta.url).toString(),
        alt: `Fuel system screenshot ${i + 1}`,
        kind: "gallery",
      })),
    },
    links: [
      { kind: "repo", label: "Repo (backend)", href: "https://github.com/DavidJosueP2/Distributed-Gasoline-System" },
      { kind: "repo", label: "Repo (frontend)", href: "https://github.com/JoelBonillaG/Distributed-Gasoline-System-Frontend" },
    ],
  },
  {
    id: "hospital-suite",
    title: "Hospital Management Suite",
    subtitle: "Spring microservices + React frontend",
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
      "Eureka",
      "React",
      "TypeScript",
      "PostgreSQL (Citus)",
      "Docker",
      "GitHub Actions",
      "Azure",
    ],
    tags: ["microservices", "spring", "react", "typescript", "postgres", "citus", "azure", "github-actions"],
    category: "microservices",
    featured: true,
    featuredRank: 3,
    tech: [
      techLogos.find((t) => t.name === "Spring"),
      techLogos.find((t) => t.name === "React"),
      techLogos.find((t) => t.name === "Docker"),
      techLogos.find((t) => t.name === "Azure"),
    ]
      .filter(Boolean)
      .map((t) => toProjectTech(t as TechLogo)),
    images: {
      cover: {
        src: new URL("../../../assets/img/projects/hospital/Picture1.png", import.meta.url).toString(),
        alt: "Hospital system screenshot",
        kind: "cover",
      },
      gallery: [
        "Picture1.png",
        "Picture2.png",
        "Picture3.png",
        "Picture4.png",
        "Picture5.png",
        "Picture6.png",
        "Picture7.png",
        "Picture8.png",
        "Picture42.png",
      ].map((file) => ({
        src: new URL(`../../../assets/img/projects/hospital/${file}`, import.meta.url).toString(),
        alt: `Hospital system screenshot ${file}`,
        kind: "gallery",
      })),
    },
    links: [
      { kind: "repo", label: "Repo (backend)", href: "https://github.com/JosueGarciaAbata/hospital-management-system" },
      { kind: "repo", label: "Repo (frontend)", href: "https://github.com/DavidJosueP2/Hospital-Front" },
    ],
  },
  {
    id: "moderation-platform",
    title: "Moderation Platform",
    subtitle: "React UI + Spring Boot backend, DevOps pipeline",
    description:
      "Moderation tooling platform with polished UI and secure workflows, backed by a Spring Boot API and a CI/CD pipeline.",
    highlights: [
      "React + TypeScript moderation console",
      "Spring Boot backend (API + workflows)",
      "Testing-focused development",
      "Jenkins CI/CD pipeline + deployment on Azure",
    ],
    stack: ["React", "TypeScript", "Spring Boot", "Testing", "Jenkins", "Azure"],
    tags: ["frontend", "react", "typescript", "spring", "devops", "jenkins"],
    category: "fullstack",
    featured: true,
    featuredRank: 4,
    tech: [
      techLogos.find((t) => t.name === "Spring"),
      techLogos.find((t) => t.name === "Azure"),
      techLogos.find((t) => t.name === "Docker"),
      techLogos.find((t) => t.name === "React"),
    ]
      .filter(Boolean)
      .map((t) => toProjectTech(t as TechLogo)),
    images: {
      cover: {
        src: new URL("../../../assets/img/projects/moderation/Picture10.png", import.meta.url).toString(),
        alt: "Moderation platform screenshot",
        kind: "cover",
      },
      gallery: [
        "Picture10.png",
        "Picture11.png",
        "Picture12.png",
        "Picture13.png",
        "Picture4.png",
        "Picture6.png",
        "Picture7.png",
        "Picture8.png",
      ].map((file) => ({
        src: new URL(`../../../assets/img/projects/moderation/${file}`, import.meta.url).toString(),
        alt: `Moderation platform screenshot ${file}`,
        kind: "gallery",
      })),
    },
    links: [
      { kind: "repo", label: "Repo (backend)", href: "https://github.com/DavidJosueP2/Marketplace_Link" },
      { kind: "repo", label: "Repo (frontend)", href: "https://github.com/DavidJosueP2/Marketplace-Link-Front" },
    ],
  },
]

export function getFeaturedProjects() {
  return [...projects]
    .filter((p) => p.featured)
    .sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999))
}
