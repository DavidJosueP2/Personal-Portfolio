export const en = {
  meta: {
    home: {
      title: "David Barragán | Software Engineer",
      description:
        "David Barragán is a full-stack developer in Ambato, Ecuador, focused on microservices, clean architecture, and reliable backend software. Explore his work and portfolio.",
    },
    contact: {
      title: "Contact | David Barragán",
      description:
        "Contact David Barragán about full-stack development, backend services, and software projects.",
    },
  },
  nav: {
    brandAria: "DJB, David Barragán, home",
    mainAria: "Main navigation",
    sections: {
      experience: "Experience",
      services: "Services",
      projects: "Projects",
      about: "About",
    },
    accent: {
      ariaLabel: "Pick accent color",
      title: "Accent",
      heading: "ACCENT",
      current: "Current:",
      setTo: "Set accent to {{color}}",
      colors: {
        lime: "lime",
        emerald: "emerald",
        cyan: "cyan",
        violet: "violet",
        amber: "amber",
        red: "red",
      },
    },
    language: {
      label: "EN",
      switchAria: "Switch language to Spanish",
      switchTitle: "Cambiar a Español",
    },
    audio: {
      mute: "Mute",
      unmute: "Unmute",
    },
    contactCta: "Get in touch",
  },
  footer: {
    greeting: "Hi there.",
    navAria: "Footer navigation",
    stack: "Stack",
    contact: "Contact",
    backToTop: "Back to top",
  },
  hero: {
    role: "Software Engineer",
    taglineVariants: [
      { prefix: "Clean architecture for ", accent: "distributed systems", tail: "." },
      { prefix: "Systems designed to ", accent: "grow with the product", tail: "." },
      { prefix: "Reliable software ", accent: "from backend to interface", tail: "." },
    ],
    summaryLine1: "Full Stack Developer. Loving Cloud,",
    summaryLine2: "<1>Microservices</1>, Spring Boot & React Native.",
    viewProjects: "View Projects",
    cv: "CV",
    humanFirst: {
      lead: "Human first.",
      line1: "I listen closely, communicate clearly,",
      line2: "and build better with others.",
    },
    location: "Ecuador",
    scrollToExplore: "Scroll to explore",
    earthCredit: "Earth textures: <1>Solar System Scope</1> · CC BY 4.0",
    gardenWords: {
      fullstack: {
        text: "Full stack",
        detail: "From the interface to the architecture.",
      },
      microservices: {
        text: "Microservices",
        detail: "Java · Spring Boot · REST APIs",
      },
      cloud: {
        text: "Cloud & DevOps",
        detail: "Azure · Docker · Continuous delivery",
      },
      data: {
        text: "Data & BI",
        detail: "SQL · Reporting · Power BI",
      },
      human: {
        text: "Human first",
        detail: "Listen closely. Build thoughtfully.",
      },
    },
  },
  experience: {
    mastheadLead: "Hi",
    mastheadAccent: "there",
    mastheadBody:
      "I’m a full-stack developer who <1>listens first</1> and enjoys talking with people, sharing ideas, and figuring things out together.",
    workQuestion: "<0>Where have I </0><1>worked?</1>",
    jobTitle: "Full Stack Developer",
    stackUsed: "Stack used",
    toolsAria: "Technologies at {{company}}",
    jobs: {
      kronhos: {
        focus: "ERP development and business intelligence",
        startLabel: "Dec 2025",
        endLabel: "Jun 2026",
        detail: "6 months",
        contributions: [
          {
            title: "Custom ERP modules.",
            description:
              "Built frontend features and the backend logic that supports their business workflows.",
          },
          {
            title: "REST APIs and integrations.",
            description:
              "Developed Java and Spring Boot endpoints that connected ERP screens to business logic and data.",
          },
          {
            title: "SQL Server and ERP performance.",
            description:
              "Worked with the data behind ERP workflows, improved application performance, and supported a database migration.",
          },
          {
            title: "Azure environments.",
            description:
              "Worked with the servers and application environments that host the ERP on Azure.",
          },
          {
            title: "Power BI reporting.",
            description:
              "Built reports and dashboards that made ERP data easier to explore and use for business analysis.",
          },
        ],
      },
      eeasa: {
        focus: "Electricity meter incidents",
        detail: "Freelance project · Several months",
        contributions: [
          {
            title: "Angular and React interfaces.",
            description:
              "Built screens for the web application used to manage electricity meter incidents.",
          },
          {
            title: "Java and Spring Boot services.",
            description:
              "Refactored the backend logic that handles meter incidents and supports the frontend workflow.",
          },
          {
            title: "Incident data modeling.",
            description:
              "Reworked the entities the application uses to represent and store incident records.",
          },
          {
            title: "Validation rules.",
            description:
              "Updated the checks the system applies before accepting incident data.",
          },
          {
            title: "Oracle database.",
            description:
              "Handled incident records in Oracle while updating the application’s data model.",
          },
        ],
      },
    },
  },
  services: {
    heading: "Services",
    question: "How can I <1>help?</1>",
    items: {
      web: "web",
      backend: "backend",
      microservices: "microservices",
      mobile: "mobile",
      cloud: "cloud",
      devops: "devops",
    },
  },
  projects: {
    phrase: {
      line1: "Each project is a chance",
      line2: "to <1>learn, experiment</1> and",
      line3: "push my limits.",
    },
    heading: {
      lead: "Selected",
      accent: "work.",
    },
    categories: {
      web: "Web development",
      backend: "Backend",
      mobile: "Mobile",
      devops: "DevOps",
      microservices: "Microservices",
      fullstack: "Full-stack development",
      other: "Software development",
    },
    details: {
      category: "Category",
      technologies: "Technologies",
      source: "Source",
    },
    actions: {
      viewProject: "View project",
      showProjectAria: "Show {{title}}",
      repoAria: "{{title}}: {{label}} repository",
      liveSiteAria: "Visit {{title}} live site",
      viewProjectAria: "View project: {{title}}",
      navAria: "Project navigation",
      previousAria: "Previous project",
      nextAria: "Next project",
      statusSr: "{{title}}, project {{current}} of {{total}}",
      carouselRole: "carousel",
    },
    dialog: {
      closeAria: "Close project",
      highlightsHeading: "Technical highlights",
      stackHeading: "Technology stack",
      status: {
        live: "Deployment live",
        offline: "Deployment offline",
        wip: "In development",
      },
    },
    carousel: {
      screenshotsAria: "Project screenshots",
      previousAria: "Previous screenshot",
      nextAria: "Next screenshot",
      chooseAria: "Choose screenshot",
      statusSr: "{{current}} of {{total}}. {{alt}}",
    },
    linkLabels: {
      github: "GitHub",
      backend: "Backend",
      frontend: "Frontend",
      liveSite: "Live site",
    },
    items: {
      "clinic-platform": {
        title: "Clinic Management Platform",
        subtitle:
          "A clinic platform for patients and administrators, available on web and mobile.",
        description:
          "Integral clinic management system with secure access, patient/admin workflows, and multi-client experiences.",
        highlights: [
          "Spring Boot + Spring Security with JWT-based auth",
          "React web frontend + React Native mobile client",
          "PostgreSQL persistence + clean layered architecture",
          "Deployed on Azure (currently offline)",
        ],
        techNames: {
          reactNative: "React and React Native",
        },
        coverAlt:
          "ClinicCare home page with options to browse doctors and book an appointment",
        galleryAlt: "Clinic platform screenshot {{item}}",
      },
      "fuel-control": {
        title: "Fuel, Trips & Routes Control System",
        subtitle:
          "Fuel control, trip planning, and route tracking on Azure Kubernetes Service.",
        description:
          "A distributed system for fuel control, trip planning, and route tracking designed for scalability and resiliency.",
        highlights: [
          "NestJS microservices with service discovery",
          "React + TypeScript frontend",
          "Databases per service on managed PostgreSQL",
          "Dockerized services deployed to Azure AKS with GitHub Actions",
          "Local reproduction with kind",
        ],
        coverAlt: "FuelIQ trip board with trips grouped by status",
        galleryAlt: "Fuel system screenshot {{item}}",
      },
      "hospital-suite": {
        title: "Hospital Management Suite",
        subtitle:
          "Hospital operations powered by Spring microservices and distributed PostgreSQL.",
        description:
          "Hospital integration suite built as a microservices ecosystem with strong architectural patterns, distributed data, and a modern web client.",
        highlights: [
          "Spring Boot microservices with Eureka discovery",
          "React + TypeScript frontend",
          "Distributed Databases PostgreSQL using Citus",
          "Clean architecture + layered patterns",
          "CI/CD with GitHub Actions + deployment on Azure",
        ],
        coverAlt: "Hospital administration dashboard listing medical centers",
        galleryAlt: "Hospital system screenshot {{item}}",
      },
      "moderation-platform": {
        title: "Moderation Platform",
        subtitle:
          "A moderation console with a Spring Boot API and a Jenkins delivery pipeline.",
        description:
          "Moderation tooling platform with polished UI and secure workflows, backed by a Spring Boot API and a CI/CD pipeline.",
        highlights: [
          "React + TypeScript moderation console",
          "Spring Boot backend (API + workflows)",
          "Testing-focused development",
          "Jenkins CI/CD pipeline + deployment on Azure",
        ],
        coverAlt:
          "Marketplace Link moderator dashboard with status counts and a list of moderators",
        galleryAlt: "Moderation platform screenshot {{item}}",
      },
      "white-lace-promises": {
        title: "White Lace & Promises",
        subtitle: "A wedding and event styling website built with SvelteKit.",
        description:
          "A website for an event styling business, featuring a service overview, galleries of real weddings, and an enquiry form.",
        highlights: [
          "SvelteKit and TypeScript",
          "Event services and real wedding galleries",
          "Enquiry form for prospective clients",
        ],
        coverAlt: "White Lace & Promises wedding and event styling homepage",
        galleryAlts: [
          "Real weddings portfolio",
          "Event styling gallery",
          "Event enquiry form",
          "About the event styling business",
        ],
      },
      "foris-forum-chat": {
        title: "FORIS Forum & Chat",
        subtitle: "A community forum with topic-based posts and real-time chat.",
        description:
          "A Spanish-language platform for sharing posts, participating in communities, and chatting. The React frontend and NestJS backend share a monorepo.",
        highlights: [
          "Forum posts organized by topics and tags",
          "Communities and real-time chat",
          "PostgreSQL persistence and SonarQube code analysis",
        ],
        coverAlt: "FORIS forum homepage",
        galleryAlts: [
          "FORIS communities view",
          "FORIS chat interface",
          "FORIS post editor",
          "FORIS sign-in screen",
        ],
      },
    },
  },
  stack: {
    headingLead: "Under the",
    headingAccent: "hood.",
    indexAria: "Technologies by layer",
    layers: {
      "stack-frontend": "Frontend",
      "stack-backend": "Backend",
      "stack-cloud": "Cloud & DevOps",
      "stack-data": "Data & BI",
      "stack-tooling": "Tooling",
    },
  },
  about: {
    heading: "About <1>me.</1>",
    location: "Ambato, Ecuador",
    tabsAria: "About me",
    tabs: {
      profile: "Profile",
      university: "University",
      personal: "Personal",
    },
    profile: {
      lead: "Full-stack developer, <1>microservices at heart.</1>",
      copy: "I’m David Barragán, with <1>one year of professional experience</1> building web and mobile software, developing microservices, and working in cloud environments. I use Clean Architecture and domain-driven design (DDD) to build reliable backend services, with clean, scalable code that’s easy to improve as the product grows. I care about code quality.",
      educationHeading: "Education",
      degree: "Software Engineering",
      languagesHeading: "Languages",
      spanish: "Spanish",
      spanishLevel: "Native",
      english: "English",
      englishLevel: "B2+",
      certificatesHeading: "Certificates",
      credentials: {
        awsPractitioner: "AWS Certified Cloud Practitioner",
        awsSimuLearn: "AWS SimuLearn – Solutions Architect – Training Badge",
        esp32: "ESP32 Microcontroller Programming Course",
        pythonDjango: "Desarrollo Web con Python y Django",
      },
    },
    university: {
      lead: "Competitions <1>and conferences.</1>",
      copy: "Meetups, programming contests, and conferences from my time at {{university}}.",
      eventWebsite: "Event website",
      types: {
        community: "Community",
        competition: "Competition",
        conference: "Conference",
      },
      events: {
        grok: {
          title: "Grok Bot Ambato Meetup",
          detail:
            "A local meetup on AI agents and what people are building with them.",
        },
        hackathon: {
          title: "UTA 2026 Hackathon",
          detail:
            "An on-campus hackathon focused on building working prototypes.",
        },
        congress: {
          title: "3rd Universal Congress of Sciences and Research",
          detail: "Attended the 32-hour program.",
        },
        codificadas: {
          title: "Codificadas, first edition",
          detail: "A regional programming competition for women in tech.",
        },
        csei: {
          title: "CSEI 2024",
          detail:
            "Attended the sixth Conference on Computer Science, Electronics and Industrial Engineering online.",
        },
        hatunsoft: {
          title: "HatunSoft, first programming contest",
          detail: "Five hours of programming problems at the FISEI agora.",
        },
      },
    },
    personal: {
      lead: "Off the <1>clock.</1>",
      basketball: {
        title: "Basketball",
        detail:
          "Give me a court and a ball and I’m happy. Playing basketball is one of my favorite ways to unwind.",
        toyAria: "Bounce the basketball",
      },
      friends: {
        title: "Friends",
        detail:
          "I always look forward to getting out and catching up with friends in person.",
      },
      valorant: {
        title: "Valorant",
        detail:
          "Valorant is my go-to game. I love how a round can turn on one smart play or a good call from the team.",
      },
      music: {
        title: "Music",
        detail:
          "I love music. I’m the kind of person who wants a soundtrack for the whole day.",
        spotifyCta: "Find me on Spotify",
      },
      surrealism: {
        title: "Surrealism",
        detail:
          "Surrealism is the art I keep coming back to. I like how a familiar scene can start to feel like a dream.",
        alt: "Surrealist painting of a reclining figure whose silhouette opens onto a blue sky with clouds",
      },
    },
  },
  contact: {
    sectionHeading: "Let’s build something <1>together.</1>",
    sectionCta: "Get in touch",
    page: {
      title: "Let’s <1>talk.</1>",
      subtitle:
        "Tell me what you have in mind. A few details are enough to get started.",
      optional: "(optional)",
      fields: {
        name: {
          label: "Name",
          placeholder: "Your name",
        },
        email: {
          label: "Email",
          placeholder: "you@example.com",
        },
        subject: {
          label: "Subject",
          placeholder: "What’s on your mind?",
        },
        message: {
          label: "Message",
          placeholder: "A little about what you’d like to build",
        },
      },
      submit: "Send message",
      sending: "Sending…",
      validation: {
        nameRequired: "Enter your name.",
        messageRequired: "Enter a message.",
      },
      feedback: {
        sent: "Message sent.",
        unavailable:
          "Contact is temporarily unavailable. Please try again later.",
        rateLimited:
          "Too many messages were sent. Wait a moment and try again.",
        error: "Your message could not be sent. Please try again.",
      },
    },
  },
} as const
