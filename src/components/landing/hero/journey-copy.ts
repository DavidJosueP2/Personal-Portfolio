// Positions are in the garden's local space, beside the route rather than on the screen.
export const gardenWords = [
  { text: "Full stack", detail: "From the interface to the architecture.", x: -2.7, y: 3.9, z: 4, serif: true, from: 0.665, to: 0.735 },
  { text: "Microservices", detail: "Java · Spring Boot · REST APIs", x: 3.0, y: 3.5, z: -10, serif: false, from: 0.735, to: 0.8 },
  { text: "Cloud & DevOps", detail: "Azure · Docker · Continuous delivery", x: -2.9, y: 3.3, z: -25, serif: true, from: 0.8, to: 0.865 },
  { text: "Data & BI", detail: "SQL · Reporting · Power BI", x: 2.8, y: 3.4, z: -41, serif: false, from: 0.865, to: 0.925 },
  { text: "Human first", detail: "Listen closely. Build thoughtfully.", x: -2.7, y: 3.4, z: -55, serif: true, from: 0.925, to: 0.984 },
] as const
