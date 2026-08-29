export const profile = {
  name: "Samir Patel",
  shortName: "Sam Patel",
  school: "University of Florida",
  taglines: ["Computer Science @ UF", "CS student · turning caffeine into code"],
  activeTagline: 0,
  bio: "Junior Computer Science student at the University of Florida. I like building things end to end — from wiring up hardware and offline data pipelines to shipping polished, usable interfaces. Currently exploring energy systems, mobile apps, and open-source contributions.",
  quickFacts: [
    { label: "SCHOOL", value: "University of Florida" },
    { label: "YEAR", value: "Junior" },
    { label: "FOCUS", value: "Full-stack + systems" },
    { label: "BUILDING", value: "CleanVision, The Pause Protocol" },
    { label: "THIS SITE", value: "Hand-built, vanilla TS + Canvas — no game libraries, including the mini-game (try PRESS SPACE up top)" },
  ],
  links: {
    github: "https://github.com/spateluf04",
    linkedin: "https://www.linkedin.com/in/samir-patel-3909a2335/",
    email: "sampatel0803@gmail.com",
    resume: "./resume.pdf",
  },
} as const;

export interface Project {
  stage: string;
  title: string;
  blurb: string;
  detail: string;
  tech: string[];
  github: string;
  demo?: string;
}

export const projects: Project[] = [
  {
    stage: "STAGE 01",
    title: "CleanVision",
    blurb: "Energy-waste scanner built on smart glasses.",
    detail:
      "Built on Meta Project Aria Gen 1 smart glasses to identify appliances and estimate energy costs on a live dashboard. Handles offline VRS sensor-data processing in WSL2. Placed 3rd at a UCF hackathon.",
    tech: ["Python 3.12", "projectaria_tools", "WSL2"],
    github: "https://github.com/spateluf04/CleanVision",
    demo: undefined,
  },
  {
    stage: "STAGE 02",
    title: "The Pause Protocol",
    blurb: "Mindfulness app that intercepts distracting app launches.",
    detail:
      "Intercepts distracting app launches via iOS Shortcuts and shows a breathing countdown before letting you in. Built with React Native + Expo, Firebase Auth, a Firestore-backed quote database, and an admin role system. Built as a team project.",
    tech: ["React Native", "Expo", "Firebase", "Firestore"],
    github: "https://github.com/SamirOrgSWE/sweGroupProject",
    demo: undefined,
  },
  {
    stage: "STAGE 03",
    title: "PharmacyDash",
    blurb: "Clinical dashboard that catches medication over-prescription errors.",
    detail:
      "A clinical dashboard built on a 'two-brain' architecture: a deterministic rules engine (max dose, duplicate therapy, MME, age checks) makes every safety decision, while Claude sits in an advisory layer — translating pharmacists' plain-English protocols into structured rules and explaining flags in plain language, but never making the clinical call itself. A strict de-identification boundary ensures only tokenized, non-PHI data ever reaches the AI layer, keeping it HIPAA-manageable and outside FDA medical-device regulation.",
    tech: ["FastAPI", "Python", "React", "TypeScript", "Claude API"],
    github: "https://github.com/spateluf04/PharmacyDash",
    demo: undefined,
  },
  {
    stage: "STAGE 04",
    title: "DSA E-Commerce Engine",
    blurb: "C++ engine that mines e-commerce data for recommendations.",
    detail:
      "A command-line tool built for Data Structures & Algorithms coursework. Ingests e-commerce order, product, and customer CSV data and provides dataset statistics, a merge-sort-vs-quick-sort benchmark, and a product co-purchase graph built from order histories — powering 'customers who bought this also bought...' recommendations via nearest-neighbor queries on a given product ID.",
    tech: ["C++", "CMake", "Graphs", "Sorting"],
    github: "https://github.com/spateluf04/DSAProject2-ECommerce",
    demo: undefined,
  },
];

export interface SkillGroup {
  label: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    items: ["Python", "JavaScript / TypeScript", "C++"],
  },
  {
    label: "Frameworks",
    items: ["React", "React Native / Expo", "Next.js", "Node"],
  },
  {
    label: "Tools",
    items: ["Git", "Firebase / Firestore", "Linux / WSL2", "VS Code"],
  },
  {
    label: "Coursework",
    items: [
      "Programming Fundamentals 1",
      "Programming Fundamentals 2",
      "Data Structures & Algorithms",
      "Operating Systems",
      "Linear Algebra",
      "Software Engineering",
    ],
  },
];

export const nav = [
  { id: "about", label: "ABOUT" },
  { id: "projects", label: "PROJECTS" },
  { id: "skills", label: "SKILLS" },
  { id: "contact", label: "CONTACT" },
] as const;
