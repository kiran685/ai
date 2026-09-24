/**
 * Target Role Requirements Schema and Standards.
 * Extensible for any career role.
 */

export type SkillImportance = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface RoleSkillRequirement {
  skill: string;
  category: "Core Computer Science" | "Software Engineering" | "System Architecture" | "Professional Skills";
  importance: SkillImportance;
  expectedScore: number; // 0 - 100
  topics: string[];
  description: string;
}

export interface TargetRoleProfile {
  role: string;
  description: string;
  minimumPassingOverallScore: number;
  skills: RoleSkillRequirement[];
}

export const TARGET_ROLE_PROFILES: Record<string, TargetRoleProfile> = {
  "Software Engineer": {
    role: "Software Engineer",
    description: "Designs, develops, tests, and scales robust software systems and backend services.",
    minimumPassingOverallScore: 70,
    skills: [
      {
        skill: "DSA",
        category: "Core Computer Science",
        importance: "CRITICAL",
        expectedScore: 80,
        topics: ["Arrays", "Strings", "Searching", "Sorting", "HashMaps", "Trees", "Graphs", "Dynamic Programming"],
        description: "Data structures and algorithmic problem solving with optimal time/space complexity.",
      },
      {
        skill: "Programming",
        category: "Software Engineering",
        importance: "CRITICAL",
        expectedScore: 80,
        topics: ["Syntax", "Memory Management", "Scope & Closures", "Concurrency", "Standard Library"],
        description: "Core language syntax, runtime execution models, and modern paradigms in Python, Java, or JavaScript/TypeScript.",
      },
      {
        skill: "OOP",
        category: "Software Engineering",
        importance: "HIGH",
        expectedScore: 75,
        topics: ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction", "SOLID Principles", "Design Patterns"],
        description: "Object-oriented design, modularity, design patterns, and clean code principles.",
      },
      {
        skill: "DBMS",
        category: "Core Computer Science",
        importance: "HIGH",
        expectedScore: 75,
        topics: ["Relational Model", "ACID Transactions", "Normalization", "Indexing", "Concurrency Control"],
        description: "Database management system architecture, transaction isolation, and storage engines.",
      },
      {
        skill: "SQL",
        category: "Software Engineering",
        importance: "HIGH",
        expectedScore: 75,
        topics: ["SELECT & Filtering", "Joins", "Aggregations & GROUP BY", "Subqueries & CTEs", "Window Functions"],
        description: "Writing complex analytical queries, schema migrations, and query execution plan tuning.",
      },
      {
        skill: "Operating Systems",
        category: "Core Computer Science",
        importance: "HIGH",
        expectedScore: 70,
        topics: ["Processes & Threads", "CPU Scheduling", "Synchronization & Deadlocks", "Memory & Paging", "File Systems"],
        description: "Process management, virtual memory, concurrency synchronization, and system calls.",
      },
      {
        skill: "Computer Networks",
        category: "Core Computer Science",
        importance: "MEDIUM",
        expectedScore: 65,
        topics: ["OSI & TCP/IP Models", "HTTP & HTTPS", "DNS", "Sockets & WebSockets", "Load Balancing"],
        description: "Network protocols, socket communication, transport layers, and secure data transfer.",
      },
      {
        skill: "System Design",
        category: "System Architecture",
        importance: "HIGH",
        expectedScore: 65,
        topics: ["Scalability", "Caching & Redis", "Load Balancing", "Microservices", "Database Sharding", "Rate Limiting"],
        description: "Architecting high-availability distributed systems, caching strategies, and data partitioning.",
      },
      {
        skill: "Git",
        category: "Software Engineering",
        importance: "MEDIUM",
        expectedScore: 70,
        topics: ["Branching", "Merging & Rebasing", "Commit Hygiene", "Conflict Resolution", "Workflows"],
        description: "Distributed version control, collaborative workflows, and repository management.",
      },
      {
        skill: "Testing",
        category: "Software Engineering",
        importance: "MEDIUM",
        expectedScore: 70,
        topics: ["Unit Testing", "Integration Testing", "Mocking & Stubs", "Test-Driven Development", "CI Automation"],
        description: "Automated test suites, coverage analysis, mocking boundaries, and CI/CD pipelines.",
      },
    ],
  },
};

export function getRoleRequirements(career: string): TargetRoleProfile {
  return TARGET_ROLE_PROFILES[career] || TARGET_ROLE_PROFILES["Software Engineer"];
}
