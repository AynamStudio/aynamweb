/**
 * AYNAM — single source of truth for site content.
 * Truthfulness policy: no invented clients, metrics, partners, team or awards.
 * Swap CONTACT_EMAIL once the public inbox exists; mailto links render only when set.
 */

export const CONTACT_EMAIL = ""; // e.g. "hello@aynam.com" once live

export const SOCIAL_HANDLE = "@aynam";

export const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/aynam", short: "IN" },
  { label: "GitHub", href: "https://github.com/aynam", short: "GH" },
  { label: "X", href: "https://x.com/aynam", short: "X" },
] as const;

export const NAV_LINKS = [
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Partners", href: "/#partners" },
  { label: "Contact", href: "/contact" },
] as const;

export const FOOTER_LINKS = NAV_LINKS;

export const HERO = {
  eyebrow: "SOFTWARE · AI · SYSTEMS",
  lines: ["Ideas to", "Impact.", "Through", "Better Software."],
  body: "We design, build and modernize software systems that help businesses work smarter and grow faster.",
  primaryCta: { label: "Let's Build Something", href: "/contact" },
  secondaryCta: { label: "Our Work", href: "/work" },
  visualNote: ["BETTER", "SYSTEMS", "A BRIGHTER", "TOMORROW."],
} as const;

export type Capability = {
  index: string;
  title: string[];
  blurb: string;
  image: string;
  alt: string;
  scope: string[];
};

export const CAPABILITIES: Capability[] = [
  {
    index: "01",
    title: ["Web & Product", "Development"],
    blurb: "Scalable, high-performance web applications.",
    image: "/images/capabilities/cap-web.jpg",
    alt: "Web development studio scene — laptop showing the AYNAM site surrounded by browser icons",
    scope: [
      "Product scoping & architecture",
      "Design engineering & interfaces",
      "Full-stack web applications",
      "Performance, accessibility & SEO",
    ],
  },
  {
    index: "02",
    title: ["AI &", "Automation"],
    blurb: "Practical AI systems that actually work.",
    image: "/images/capabilities/cap-ai.jpg",
    alt: "AI & automation studio scene — laptop with an automation workflow surrounded by AI platform icons",
    scope: [
      "Workflow & document automation",
      "LLM features grounded in your data",
      "Integration with existing systems",
      "Evaluation, guardrails & monitoring",
    ],
  },
  {
    index: "03",
    title: ["Business Software", "& Internal Tools"],
    blurb: "Custom tools to streamline your operations.",
    image: "/images/capabilities/cap-biz.jpg",
    alt: "Business software scene — laptop dashboard surrounded by internal tool integrations",
    scope: [
      "Operations & back-office systems",
      "Dashboards & reporting",
      "Approvals, billing & workflows",
      "Integrations between your tools",
    ],
  },
  {
    index: "04",
    title: ["Legacy System", "Modernization"],
    blurb: "Give your old systems a new life.",
    image: "/images/capabilities/cap-legacy.jpg",
    alt: "Legacy modernization scene — old CRT terminal beside a laptop showing a modern unified system",
    scope: [
      "Audit of legacy code & data",
      "Phased migration, not big-bang rewrites",
      "Modern web & API layers",
      "Safer deployments & maintenance",
    ],
  },
];

export const CITN = {
  number: "01 / 01",
  client: "CITN",
  title: "ERP Modernization",
  summary:
    "Rebuilt a legacy ERP system originally developed around a 2009-era C++ / MS SQL Server stack into a modern, scalable system.",
  tags: ["Next.js", "Express.js", "SQL Server 2025", "Modernization"],
  live: { label: "citn.in", href: "https://citn.in" },
  background:
    "The ERP had grown around its original 2009-era C++ and MS SQL Server stack. Years of business logic lived inside that codebase — central to daily operations, and increasingly hard to change.",
  approach: [
    "Deep audit of existing business logic and data model",
    "Web-native rebuild with a Next.js client and Express.js service layer",
    "SQL Server 2025 as the production data platform",
    "Phased, reviewed delivery from audit through cutover",
  ],
  outcome:
    "A modern, scalable system that replaces the 2009-era stack — easier to maintain, easier to extend, and designed to grow with the business.",
} as const;

export const EXPERIMENTS = [
  { name: "AGENTS", note: "Autonomous agent frameworks" },
  { name: "CyberSentinel", note: "Security monitoring research" },
  { name: "CODE Classroom", note: "Learning tooling prototypes" },
  { name: "JobOS", note: "Recruitment workflow experiments" },
] as const;

export type Industry = {
  name: string;
  image: string;
  alt: string;
  line: string;
};

export const INDUSTRIES: Industry[] = [
  {
    name: "Manufacturing",
    image: "/images/industries/manufacturing.jpg",
    alt: "Steel pipes, pumps and industrial machinery in a plant",
    line: "Production workflows, inventory and shop-floor systems.",
  },
  {
    name: "Automotive",
    image: "/images/industries/automotive.jpg",
    alt: "Dark garage with high-performance cars under low light",
    line: "Dealer, service and supply-chain tooling.",
  },
  {
    name: "Education",
    image: "/images/industries/education.jpg",
    alt: "Warmly lit library shelves receding into the distance",
    line: "Platforms for classrooms, administration and learning.",
  },
  {
    name: "Finance",
    image: "/images/industries/finance.jpg",
    alt: "Dark glass towers converging toward the sky",
    line: "Reporting, reconciliation and internal operations.",
  },
  {
    name: "Healthcare",
    image: "/images/industries/healthcare.jpg",
    alt: "Clean unoccupied clinical room with medical equipment",
    line: "Scheduling, records and operational workflows.",
  },
  {
    name: "Technology",
    image: "/images/industries/technology.jpg",
    alt: "Network patch panel with cabling in a dark server room",
    line: "Product engineering and platform support for software teams.",
  },
];

export const WHY = {
  label: "04. WHY AYNAM",
  lines: ["More Than", "Development.", "A True Partner."],
  body: "We don't just write code. We understand your business, work as an extension of your team, and stay committed from idea to execution and beyond.",
  principles: [
    { title: "Business-First Approach", body: "We focus on outcomes.", icon: "target" },
    { title: "Quality & Reliability", body: "Built to last.", icon: "shield" },
    { title: "End-to-End Support", body: "From strategy to scale.", icon: "path" },
    { title: "Long-Term Partnerships", body: "Your success is our success.", icon: "loop" },
  ],
} as const;

export const PROCESS = [
  {
    index: "01",
    title: "Discover",
    body: "We start in your operations, not in a framework. Understand the problem, the constraints and what success actually means.",
  },
  {
    index: "02",
    title: "Design",
    body: "Architecture, interfaces and a delivery plan sized to reality — never bigger than the problem deserves.",
  },
  {
    index: "03",
    title: "Build",
    body: "Short, reviewable increments. Working software in front of you early and often, until it is right.",
  },
  {
    index: "04",
    title: "Evolve",
    body: "Software is never finished. We stay on to measure, harden and extend what we shipped.",
  },
] as const;

export const CTA = {
  label: "LET'S BUILD TOGETHER",
  lines: ["Have a Project", "in Mind?"],
  body: "Let's talk about how AYNAM can help you build, automate, or modernize your systems.",
  button: { label: "Start a Conversation", href: "/contact" },
  sphereWords: ["IDEAS", "SYSTEMS", "IMPACT"],
} as const;

export const FOOTER = {
  tagline: "Software for a smarter tomorrow.",
  copyright: "© 2026 AYNAM. All rights reserved.",
  tiny: "Building smarter, more efficient tomorrow.",
} as const;

export const PROJECT_TYPES = [
  "Web & Product Development",
  "AI & Automation",
  "Business Software & Internal Tools",
  "Legacy System Modernization",
  "Other",
] as const;

export const BUDGET_RANGES = [
  "Not sure yet",
  "Under ₹50,000",
  "₹50,000 – ₹2,00,000",
  "₹2,00,000 – ₹5,00,000",
  "₹5,00,000+",
] as const;
