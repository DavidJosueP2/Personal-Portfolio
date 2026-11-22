import type { en } from "./en"

type DeepString<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly DeepString<U>[]
    : T extends Record<string, unknown>
      ? { readonly [K in keyof T]: DeepString<T[K]> }
      : T

export const es: DeepString<typeof en> = {
  meta: {
    home: {
      title: "David Barragán | Ingeniero de Software",
      description:
        "David Barragán es un desarrollador Full Stack en Ambato, Ecuador, enfocado en microservicios, Clean Architecture y software backend confiable. Explora su trabajo y portafolio.",
    },
    contact: {
      title: "Contacto | David Barragán",
      description:
        "Contacta a David Barragán sobre desarrollo Full Stack, servicios backend y proyectos de software.",
    },
  },
  nav: {
    brandAria: "DJB, David Barragán, inicio",
    mainAria: "Navegación principal",
    sections: {
      experience: "Experiencia",
      services: "Servicios",
      projects: "Proyectos",
      about: "Sobre mí",
    },
    accent: {
      ariaLabel: "Elegir color de acento",
      title: "Acento",
      heading: "ACENTO",
      current: "Actual:",
      setTo: "Cambiar acento a {{color}}",
      colors: {
        lime: "lima",
        emerald: "esmeralda",
        cyan: "cian",
        violet: "violeta",
        amber: "ámbar",
        red: "rojo",
      },
    },
    language: {
      label: "ES",
      switchAria: "Cambiar idioma a inglés",
      switchTitle: "Switch to English",
    },
    audio: {
      open: "Abrir reproductor de música (M)",
      close: "Cerrar reproductor de música (Esc)",
      hint: "pulsa 'm' para música",
    },
    contactCta: "Contáctame",
  },
  music: {
    dialogAria: "Reproductor de música",
    closeHint: "'esc' para cerrar",
    closeAria: "Cerrar reproductor de música",
    play: "Reproducir",
    pause: "Pausar",
    previous: "Canción anterior",
    next: "Siguiente canción",
    seekAria: "Mover posición de la canción",
    playlistAria: "Lista de canciones",
    playTrackAria: "Reproducir {{title}} de {{artist}}",
    pauseTrackAria: "Pausar {{title}} de {{artist}}",
  },
  footer: {
    greeting: "Hola.",
    navAria: "Navegación del pie de página",
    stack: "Stack",
    contact: "Contacto",
    backToTop: "Volver arriba",
  },
  hero: {
    role: "Ingeniero de Software",
    taglineVariants: [
      { prefix: "Arquitectura limpia para ", accent: "sistemas distribuidos", tail: "." },
      { prefix: "Sistemas diseñados para ", accent: "crecer con el producto", tail: "." },
      { prefix: "Software confiable ", accent: "del backend a la interfaz", tail: "." },
    ],
    summaryLine1: "Desarrollador Full Stack. Apasionado por Cloud,",
    summaryLine2: "<1>Microservicios</1>, Spring Boot y React Native.",
    viewProjects: "Ver proyectos",
    cv: "CV",
    humanFirst: {
      lead: "Primero las personas.",
      line1: "Escucho con atención, me comunico con claridad",
      line2: "y construyo mejor en equipo.",
    },
    location: "Ecuador",
    scrollToExplore: "Desliza para explorar",
    earthCredit: "Texturas de la Tierra: <1>Solar System Scope</1> · CC BY 4.0",
    gardenWords: {
      fullstack: {
        text: "Full stack",
        detail: "Desde la interfaz hasta la arquitectura.",
      },
      microservices: {
        text: "Microservicios",
        detail: "Java · Spring Boot · REST APIs",
      },
      cloud: {
        text: "Cloud & DevOps",
        detail: "Azure · Docker · Entrega continua",
      },
      data: {
        text: "Datos & BI",
        detail: "SQL · Reportes · Power BI",
      },
      human: {
        text: "Primero las personas",
        detail: "Escuchar con atención. Construir con criterio.",
      },
    },
  },
  experience: {
    mastheadLead: "Qué",
    mastheadAccent: "tal",
    mastheadBody:
      "Soy un desarrollador Full Stack que <1>escucha primero</1> y disfruta conversar con las personas, compartir ideas y resolver retos en equipo.",
    workQuestion: "<0>¿Dónde he </0><1>trabajado?</1>",
    jobTitle: "Desarrollador Full Stack",
    stackUsed: "Stack utilizado",
    toolsAria: "Tecnologías en {{company}}",
    jobs: {
      kronhos: {
        focus: "Desarrollo ERP y Business Intelligence",
        startLabel: "Dic 2025",
        endLabel: "Jun 2026",
        detail: "6 meses",
        contributions: [
          {
            title: "Módulos ERP a medida.",
            description:
              "Desarrollé funcionalidades en el frontend y la lógica backend que soporta los flujos del negocio.",
          },
          {
            title: "REST APIs e integraciones.",
            description:
              "Desarrollé endpoints en Java y Spring Boot que conectaron las pantallas del ERP con la lógica de negocio y los datos.",
          },
          {
            title: "SQL Server y rendimiento del ERP.",
            description:
              "Trabajé con los datos detrás de los flujos del ERP, optimicé el rendimiento de la aplicación y apoyé una migración de base de datos.",
          },
          {
            title: "Entornos en Azure.",
            description:
              "Trabajé con los servidores y entornos de aplicación que alojan el ERP en Azure.",
          },
          {
            title: "Reportes en Power BI.",
            description:
              "Creé reportes y dashboards que facilitaron explorar y aprovechar los datos del ERP para el análisis de negocio.",
          },
        ],
      },
      eeasa: {
        focus: "Incidencias de medidores eléctricos",
        detail: "Proyecto freelance · Varios meses",
        contributions: [
          {
            title: "Interfaces en Angular y React.",
            description:
              "Construí pantallas para la aplicación web utilizada en la gestión de incidencias de medidores eléctricos.",
          },
          {
            title: "Servicios en Java y Spring Boot.",
            description:
              "Refactoricé la lógica backend que gestiona las incidencias de medidores y respalda el flujo del frontend.",
          },
          {
            title: "Modelado de datos de incidencias.",
            description:
              "Reestructuré las entidades que utiliza la aplicación para representar y almacenar los registros de incidencias.",
          },
          {
            title: "Reglas de validación.",
            description:
              "Actualicé las validaciones que aplica el sistema antes de aceptar los datos de incidencias.",
          },
          {
            title: "Base de datos Oracle.",
            description:
              "Gestioné registros de incidencias en Oracle mientras actualizaba el modelo de datos de la aplicación.",
          },
        ],
      },
    },
  },
  services: {
    heading: "Servicios",
    question: "¿Cómo puedo <1>ayudarte?</1>",
    items: {
      web: "web",
      backend: "backend",
      microservices: "microservicios",
      mobile: "móvil",
      cloud: "cloud",
      devops: "devops",
    },
  },
  projects: {
    phrase: {
      line1: "Cada proyecto es una oportunidad",
      line2: "para <1>aprender, experimentar</1> y",
      line3: "superar mis límites.",
    },
    heading: {
      lead: "Trabajo",
      accent: "selecto.",
    },
    categories: {
      web: "Desarrollo web",
      backend: "Backend",
      mobile: "Móvil",
      devops: "DevOps",
      microservices: "Microservicios",
      fullstack: "Desarrollo Full Stack",
      other: "Desarrollo de software",
    },
    details: {
      category: "Categoría",
      technologies: "Tecnologías",
      source: "Código",
    },
    actions: {
      viewProject: "Ver proyecto",
      showProjectAria: "Mostrar {{title}}",
      repoAria: "{{title}}: repositorio {{label}}",
      liveSiteAria: "Visitar el sitio en vivo de {{title}}",
      viewProjectAria: "Ver proyecto: {{title}}",
      navAria: "Navegación de proyectos",
      previousAria: "Proyecto anterior",
      nextAria: "Siguiente proyecto",
      statusSr: "{{title}}, proyecto {{current}} de {{total}}",
      carouselRole: "carrusel",
    },
    dialog: {
      closeAria: "Cerrar proyecto",
      highlightsHeading: "Aspectos técnicos destacados",
      stackHeading: "Stack tecnológico",
      status: {
        live: "Despliegue activo",
        offline: "Despliegue fuera de línea",
        wip: "En desarrollo",
      },
    },
    carousel: {
      screenshotsAria: "Capturas del proyecto",
      previousAria: "Captura anterior",
      nextAria: "Siguiente captura",
      chooseAria: "Seleccionar captura",
      statusSr: "{{current}} de {{total}}. {{alt}}",
    },
    linkLabels: {
      github: "GitHub",
      backend: "Backend",
      frontend: "Frontend",
      liveSite: "Sitio en vivo",
    },
    items: {
      "clinic-platform": {
        title: "Plataforma de Gestión Clínica",
        subtitle:
          "Una plataforma clínica para pacientes y administradores, disponible en web y móvil.",
        description:
          "Sistema integral de gestión clínica con acceso seguro, flujos para pacientes y administradores, y experiencias multicliente.",
        highlights: [
          "Spring Boot + Spring Security con autenticación JWT",
          "Frontend web en React + cliente móvil en React Native",
          "Persistencia en PostgreSQL + arquitectura limpia en capas",
          "Desplegado en Azure (actualmente fuera de línea)",
        ],
        techNames: {
          reactNative: "React y React Native",
        },
        coverAlt:
          "Página principal de ClinicCare con opciones para explorar médicos y agendar una cita",
        galleryAlt: "Captura {{item}} de la plataforma clínica",
      },
      "fuel-control": {
        title: "Sistema de Control de Combustible, Viajes y Rutas",
        subtitle:
          "Control de combustible, planificación de viajes y seguimiento de rutas en Azure Kubernetes Service.",
        description:
          "Sistema distribuido para control de combustible, planificación de viajes y seguimiento de rutas diseñado para ser escalable y resiliente.",
        highlights: [
          "Microservicios en NestJS con service discovery",
          "Frontend en React + TypeScript",
          "Bases de datos por servicio en PostgreSQL gestionado",
          "Servicios dockerizados desplegados en Azure AKS con GitHub Actions",
          "Reproducción local con kind",
        ],
        coverAlt: "Tablero de viajes de FuelIQ con viajes agrupados por estado",
        galleryAlt: "Captura {{item}} del sistema de combustible",
      },
      "hospital-suite": {
        title: "Suite de Gestión Hospitalaria",
        subtitle:
          "Operaciones hospitalarias impulsadas por microservicios Spring y PostgreSQL distribuido.",
        description:
          "Suite de integración hospitalaria construida como ecosistema de microservicios con patrones arquitectónicos sólidos, datos distribuidos y un cliente web moderno.",
        highlights: [
          "Microservicios con Spring Boot y descubrimiento en Eureka",
          "Frontend en React + TypeScript",
          "Bases de datos distribuidas PostgreSQL con Citus",
          "Clean Architecture + patrones en capas",
          "CI/CD con GitHub Actions + despliegue en Azure",
        ],
        coverAlt:
          "Panel de administración hospitalaria con el listado de centros médicos",
        galleryAlt: "Captura {{item}} del sistema hospitalario",
      },
      "moderation-platform": {
        title: "Plataforma de Moderación",
        subtitle:
          "Consola de moderación con una API en Spring Boot y pipeline de entrega en Jenkins.",
        description:
          "Plataforma de herramientas de moderación con UI cuidada y flujos seguros, respaldada por una API en Spring Boot y un pipeline CI/CD.",
        highlights: [
          "Consola de moderación en React + TypeScript",
          "Backend en Spring Boot (API + flujos de trabajo)",
          "Desarrollo enfocado en testing",
          "Pipeline CI/CD en Jenkins + despliegue en Azure",
        ],
        coverAlt:
          "Panel de moderadores de Marketplace Link con contadores de estado y lista de moderadores",
        galleryAlt: "Captura {{item}} de la plataforma de moderación",
      },
      "white-lace-promises": {
        title: "White Lace & Promises",
        subtitle:
          "Sitio web de diseño de bodas y eventos construido con SvelteKit.",
        description:
          "Sitio web para un negocio de estilismo de eventos, con resumen de servicios, galerías de bodas reales y formulario de consultas.",
        highlights: [
          "SvelteKit y TypeScript",
          "Servicios para eventos y galerías de bodas reales",
          "Formulario de consulta para futuros clientes",
        ],
        coverAlt:
          "Página principal de bodas y estilismo de eventos de White Lace & Promises",
        galleryAlts: [
          "Portafolio de bodas reales",
          "Galería de estilismo de eventos",
          "Formulario de consulta para eventos",
          "Acerca del negocio de estilismo de eventos",
        ],
      },
      "foris-forum-chat": {
        title: "FORIS Foro & Chat",
        subtitle:
          "Foro comunitario con publicaciones por temas y chat en tiempo real.",
        description:
          "Plataforma en español para compartir publicaciones, participar en comunidades y chatear. El frontend en React y el backend en NestJS comparten un monorepo.",
        highlights: [
          "Publicaciones del foro organizadas por temas y etiquetas",
          "Comunidades y chat en tiempo real",
          "Persistencia en PostgreSQL y análisis de código con SonarQube",
        ],
        coverAlt: "Página principal del foro FORIS",
        galleryAlts: [
          "Vista de comunidades de FORIS",
          "Interfaz de chat de FORIS",
          "Editor de publicaciones de FORIS",
          "Pantalla de inicio de sesión de FORIS",
        ],
      },
    },
  },
  stack: {
    headingLead: "Detrás del",
    headingAccent: "código.",
    indexAria: "Tecnologías por capa",
    layers: {
      "stack-frontend": "Frontend",
      "stack-backend": "Backend",
      "stack-cloud": "Cloud & DevOps",
      "stack-data": "Datos & BI",
      "stack-tooling": "Herramientas",
    },
  },
  about: {
    heading: "Sobre <1>mí.</1>",
    location: "Ambato, Ecuador",
    tabsAria: "Sobre mí",
    tabs: {
      profile: "Perfil",
      university: "Universidad",
      personal: "Personal",
    },
    profile: {
      lead: "Desarrollador Full Stack, <1>microservicios de corazón.</1>",
      copy: "Soy David Barragán, con <1>un año de experiencia profesional</1> creando software web y móvil, desarrollando microservicios y trabajando en entornos cloud. Aplico Clean Architecture y Domain-Driven Design (DDD) para construir servicios backend confiables, con código limpio, escalable y fácil de evolucionar a medida que crece el producto. Me importa la calidad del código.",
      educationHeading: "Educación",
      degree: "Ingeniería en Software",
      languagesHeading: "Idiomas",
      spanish: "Español",
      spanishLevel: "Nativo",
      english: "Inglés",
      englishLevel: "B2+",
      certificatesHeading: "Certificados",
      credentials: {
        awsPractitioner: "AWS Certified Cloud Practitioner",
        awsSimuLearn: "AWS SimuLearn – Solutions Architect – Training Badge",
        esp32: "Curso de Programación de Microcontroladores ESP32",
        pythonDjango: "Desarrollo Web con Python y Django",
      },
    },
    university: {
      lead: "Competencias <1>y congresos.</1>",
      copy: "Meetups, concursos de programación y congresos durante mi etapa en la {{university}}.",
      eventWebsite: "Sitio del evento",
      types: {
        community: "Comunidad",
        competition: "Competencia",
        conference: "Congreso",
      },
      events: {
        grok: {
          title: "Grok Bot Ambato Meetup",
          detail:
            "Un meetup local sobre agentes de IA y lo que la comunidad está construyendo con ellos.",
        },
        hackathon: {
          title: "Hackathon UTA 2026",
          detail:
            "Un hackathon universitario enfocado en construir prototipos funcionales.",
        },
        congress: {
          title: "3.er Congreso Universal de Ciencias e Investigación",
          detail: "Asistencia al programa de 32 horas.",
        },
        codificadas: {
          title: "Codificadas, primera edición",
          detail:
            "Competencia regional de programación para mujeres en tecnología.",
        },
        csei: {
          title: "CSEI 2024",
          detail:
            "Asistencia en línea al sexto Congreso de Ciencias de la Computación, Electrónica e Ingeniería Industrial.",
        },
        hatunsoft: {
          title: "HatunSoft, primer concurso de programación",
          detail:
            "Cinco horas de resolución de problemas de programación en el ágora de la FISEI.",
        },
      },
    },
    personal: {
      lead: "Fuera del <1>código.</1>",
      basketball: {
        title: "Baloncesto",
        detail:
          "Dame una cancha y un balón y soy feliz. Jugar baloncesto es una de mis formas favoritas de desconectar.",
        toyAria: "Rebotar el balón de baloncesto",
      },
      friends: {
        title: "Amigos",
        detail:
          "Siempre disfruto salir y ponerme al día en persona con mis amigos.",
      },
      valorant: {
        title: "Valorant",
        detail:
          "Valorant es mi juego favorito. Me encanta cómo una ronda puede cambiar por una jugada inteligente o una buena llamada del equipo.",
      },
      music: {
        title: "Música",
        detail:
          "Me encanta la música. Soy de las personas que necesitan una banda sonora para todo el día.",
        spotifyCta: "Encuéntrame en Spotify",
      },
      surrealism: {
        title: "Surrealismo",
        detail:
          "El surrealismo es el arte al que siempre vuelvo. Me gusta cómo una escena cotidiana puede empezar a sentirse como un sueño.",
        alt: "Pintura surrealista de una figura recostada cuya silueta se abre hacia un cielo azul con nubes",
      },
    },
  },
  contact: {
    sectionHeading: "Construyamos algo <1>juntos.</1>",
    sectionCta: "Contáctame",
    page: {
      title: "Vamos a <1>hablar.</1>",
      subtitle:
        "Cuéntame qué tienes en mente. Unos pocos detalles bastan para empezar.",
      optional: "(opcional)",
      fields: {
        name: {
          label: "Nombre",
          placeholder: "Tu nombre",
        },
        email: {
          label: "Correo electrónico",
          placeholder: "tu@ejemplo.com",
        },
        subject: {
          label: "Asunto",
          placeholder: "¿Qué tienes en mente?",
        },
        message: {
          label: "Mensaje",
          placeholder: "Un poco sobre lo que te gustaría construir",
        },
      },
      submit: "Enviar mensaje",
      sending: "Enviando…",
      validation: {
        nameRequired: "Ingresa tu nombre.",
        messageRequired: "Ingresa un mensaje.",
      },
      feedback: {
        sent: "Mensaje enviado.",
        unavailable:
          "El contacto no está disponible temporalmente. Inténtalo de nuevo más tarde.",
        rateLimited:
          "Se enviaron demasiados mensajes. Espera un momento e inténtalo de nuevo.",
        error: "No se pudo enviar tu mensaje. Inténtalo de nuevo.",
      },
    },
  },
}
