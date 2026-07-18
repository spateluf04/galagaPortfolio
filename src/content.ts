export const profile = {
  name: "Samir Patel",
  shortName: "Sam Patel",
  school: "University of Florida",
  taglines: [
    "CS student · I build software",
    "Computer Science @ UF · shipping small, useful things",
    "CS student · turning caffeine into code",
  ],
  activeTagline: 0,
  bio: "Computer Science student at the University of Florida. I like building things end to end — from wiring up hardware and offline data pipelines to shipping polished, usable interfaces. Currently exploring energy systems, mobile apps, and open-source contributions.",
  quickFacts: [
    { label: "SCHOOL", value: "University of Florida" },
    { label: "FOCUS", value: "Full-stack + systems" },
    { label: "BUILDING", value: "RoomScan, The Pause Protocol" },
  ],
  links: {
    github: "https://github.com/spateluf04",
    linkedin: "", // PLACEHOLDER — add LinkedIn URL
    email: "sampatel0803@gmail.com",
    resume: "/resume.pdf",
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
    title: "RoomScan",
    blurb: "Energy-waste scanner built on smart glasses.",
    detail:
      "Built on Meta Project Aria Gen 1 smart glasses to identify appliances and estimate energy costs on a live dashboard. Handles offline VRS sensor-data processing in WSL2. Placed 3rd at a UCF hackathon.",
    tech: ["Python 3.12", "projectaria_tools", "WSL2"],
    github: "", // PLACEHOLDER — add repo URL
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
    title: "Checkmate",
    blurb: "Open-source contribution: escalated notifications.",
    detail:
      "Implemented an escalated-notifications feature for Checkmate, an open-source server monitoring tool, as part of CEN3031 coursework.",
    tech: ["Open Source", "Node.js"],
    github: "", // PLACEHOLDER — add PR/repo URL
    demo: undefined,
  },
  {
    stage: "STAGE 04",
    title: "Hackathon Starter",
    blurb: "Next.js template built to speed up hackathon teams.",
    detail:
      "A Next.js 14 + TypeScript + Tailwind + Firebase template with drop-in LLM, storage, and Firestore modules, designed to get hackathon teams from zero to building in minutes.",
    tech: ["Next.js 14", "TypeScript", "Tailwind", "Firebase"],
    github: "", // PLACEHOLDER — add repo URL
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
    items: ["Operating Systems", "Linear Algebra", "Software Engineering"],
  },
];

export const nav = [
  { id: "about", label: "ABOUT" },
  { id: "projects", label: "PROJECTS" },
  { id: "skills", label: "SKILLS" },
  { id: "contact", label: "CONTACT" },
] as const;
