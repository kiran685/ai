/**
 * Global Constants & Canonical Role Taxonomy for AI Career OS
 * Single source of truth for mastery thresholds and canonical role identifiers.
 */

export const MASTERY_THRESHOLD = 70;

export type CanonicalRoleId =
  | "software-engineer"
  | "backend-developer"
  | "frontend-developer"
  | "full-stack-developer"
  | "python-developer"
  | "java-developer"
  | "data-analyst"
  | "qa-engineer"
  | "devops-engineer"
  | "ai-ml-engineer";

export interface CanonicalRoleMeta {
  id: CanonicalRoleId;
  displayName: string;
  description: string;
  category: "Engineering" | "Data" | "Infrastructure" | "Quality";
  defaultRequiredSkills: string[];
}

export const CANONICAL_ROLES: Record<CanonicalRoleId, CanonicalRoleMeta> = {
  "software-engineer": {
    id: "software-engineer",
    displayName: "Software Engineer",
    description: "Core algorithms, data structures, OOP, operating systems, and full-spectrum engineering",
    category: "Engineering",
    defaultRequiredSkills: ["DSA", "Programming", "OOP", "DBMS", "Operating Systems", "Computer Networks", "Git"],
  },
  "backend-developer": {
    id: "backend-developer",
    displayName: "Backend Developer",
    description: "Distributed REST/GraphQL APIs, relational & document databases, authentication, and scalability",
    category: "Engineering",
    defaultRequiredSkills: ["REST APIs", "SQL", "Databases", "Node.js", "Backend Framework", "Git"],
  },
  "frontend-developer": {
    id: "frontend-developer",
    displayName: "Frontend Developer",
    description: "Modern React/Next.js, TypeScript, state architectures, browser performance, and responsive interfaces",
    category: "Engineering",
    defaultRequiredSkills: ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Git"],
  },
  "full-stack-developer": {
    id: "full-stack-developer",
    displayName: "Full Stack Developer",
    description: "End-to-end web product architectures, full-stack state sync, persistent APIs, and databases",
    category: "Engineering",
    defaultRequiredSkills: ["React", "Node.js", "JavaScript", "SQL", "REST APIs", "Git"],
  },
  "python-developer": {
    id: "python-developer",
    displayName: "Python Developer",
    description: "Pythonic systems, FastAPI/Django services, asynchronous asyncio event loops, and data access layers",
    category: "Engineering",
    defaultRequiredSkills: ["Python", "SQL", "REST APIs", "OOP", "Git"],
  },
  "java-developer": {
    id: "java-developer",
    displayName: "Java Developer",
    description: "Enterprise Spring Boot microservices, JVM memory internals, JPA/Hibernate entities, and multithreading",
    category: "Engineering",
    defaultRequiredSkills: ["Java", "Spring Boot", "OOP", "SQL", "Git"],
  },
  "data-analyst": {
    id: "data-analyst",
    displayName: "Data Analyst",
    description: "Complex SQL window functions, statistical inference, data visualization, and business intelligence",
    category: "Data",
    defaultRequiredSkills: ["SQL", "Excel", "Statistics", "Data Visualization", "Python"],
  },
  "qa-engineer": {
    id: "qa-engineer",
    displayName: "QA / Software Testing Engineer",
    description: "Automated end-to-end test suites, REST API assertions, defect management, and CI/CD testing gates",
    category: "Quality",
    defaultRequiredSkills: ["Manual Testing", "Test Automation", "API Testing", "Test Cases", "Git"],
  },
  "devops-engineer": {
    id: "devops-engineer",
    displayName: "DevOps / Cloud Engineer",
    description: "Linux systems, Docker containers, Kubernetes clusters, CI/CD pipelines, and cloud networking",
    category: "Infrastructure",
    defaultRequiredSkills: ["Linux", "Docker", "AWS", "CI/CD", "Networking"],
  },
  "ai-ml-engineer": {
    id: "ai-ml-engineer",
    displayName: "AI / ML Engineer",
    description: "Machine learning pipelines, deep learning model evaluation, transformer architectures, and embeddings",
    category: "Data",
    defaultRequiredSkills: ["Python", "Machine Learning", "Deep Learning", "SQL", "Git"],
  },
};

/**
 * Normalizes any freeform, display, or slugified role title to its canonical ID.
 */
export function toCanonicalRoleId(roleInput: string): CanonicalRoleId {
  if (!roleInput) return "software-engineer";

  const clean = roleInput.trim().toLowerCase().replace(/[\s_]+/g, "-");

  // Direct canonical match
  if (clean in CANONICAL_ROLES) {
    return clean as CanonicalRoleId;
  }

  // Common aliases
  if (clean.includes("software") || clean.includes("swe")) return "software-engineer";
  if (clean.includes("front") || clean.includes("ui")) return "frontend-developer";
  if (clean.includes("back") || clean.includes("api")) return "backend-developer";
  if (clean.includes("full") || clean.includes("stack")) return "full-stack-developer";
  if (clean.includes("python")) return "python-developer";
  if (clean.includes("java")) return "java-developer";
  if (clean.includes("data") && (clean.includes("analyst") || clean.includes("bi"))) return "data-analyst";
  if (clean.includes("data") && (clean.includes("scientist") || clean.includes("science"))) return "data-analyst";
  if (clean.includes("qa") || clean.includes("test") || clean.includes("quality")) return "qa-engineer";
  if (clean.includes("devops") || clean.includes("cloud") || clean.includes("infra") || clean.includes("sre")) return "devops-engineer";
  if (clean.includes("ai") || clean.includes("ml") || clean.includes("machine-learning")) return "ai-ml-engineer";

  return "software-engineer";
}

/**
 * Returns the human-readable display name for any role input.
 */
export function toRoleDisplayName(roleInput: string): string {
  const canonicalId = toCanonicalRoleId(roleInput);
  return CANONICAL_ROLES[canonicalId]?.displayName || "Software Engineer";
}
