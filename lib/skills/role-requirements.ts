import { RoleRequirement } from "@/types";
import { MASTERY_THRESHOLD, toCanonicalRoleId, toRoleDisplayName } from "@/lib/skills/constants";

/**
 * Modular data structure of role requirements for tech roles.
 * Not hardcoded in UI; reusable across discovery, scoring, gap analysis, and roadmap.
 * Explicit skill weights sum to exactly 100 for each role.
 * Standardized to global MASTERY_THRESHOLD (70%).
 */
export const ROLE_REQUIREMENTS: Record<string, RoleRequirement> = {
  "Software Engineer": {
    roleName: "Software Engineer",
    coreSkills: ["Programming", "DSA", "OOP", "DBMS", "Operating Systems", "Computer Networks"],
    requiredSkills: ["DSA", "Programming", "OOP", "DBMS", "Operating Systems", "Computer Networks", "Git"],
    preferredSkills: ["System Design", "Testing", "Linux", "CI/CD"],
    skillWeights: {
      "DSA": 25,
      "Programming": 15,
      "OOP": 15,
      "DBMS": 15,
      "Operating Systems": 10,
      "Computer Networks": 10,
      "Git": 10,
    },
    projectExpectations: [
      "Modular full-stack or backend system with clean OOP separation",
      "Demonstrated data structure implementation and algorithmic efficiency",
      "Version controlled repository with automated unit tests"
    ],
    interviewTopics: [
      "Data Structures & Algorithmic Time/Space Complexity",
      "Object-Oriented Design & SOLID Principles",
      "Database Indexing, Transactions & Normalization",
      "Process vs Threads, Concurrency & Deadlocks",
      "TCP/IP, HTTP/HTTPS Protocol Mechanics"
    ],
    minExpectedScore: MASTERY_THRESHOLD,
  },

  "Backend Developer": {
    roleName: "Backend Developer",
    coreSkills: ["Programming", "REST APIs", "Databases", "SQL", "Backend Framework"],
    requiredSkills: ["REST APIs", "SQL", "Databases", "Node.js", "Backend Framework", "Git"],
    preferredSkills: ["Docker", "Redis", "Cloud", "System Design", "Microservices", "Testing"],
    skillWeights: {
      "REST APIs": 25,
      "SQL": 20,
      "Databases": 15,
      "Node.js": 15,
      "Backend Framework": 15,
      "Git": 10,
    },
    projectExpectations: [
      "Production-ready REST/GraphQL API with authentication and JWT",
      "Relational or document database schemas with optimized query indexes",
      "Defensive error handling, rate limiting, and request validation"
    ],
    interviewTopics: [
      "RESTful API design standards and idempotency",
      "SQL query performance, indexing strategies, and ACID transactions",
      "Authentication mechanisms (OAuth2, JWT, Session management)",
      "Caching layers (Redis) and cache invalidation",
      "Asynchronous message queues and background worker processing"
    ],
    minExpectedScore: MASTERY_THRESHOLD,
  },

  "Frontend Developer": {
    roleName: "Frontend Developer",
    coreSkills: ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Responsive Design"],
    requiredSkills: ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Git"],
    preferredSkills: ["Next.js", "Redux", "Testing", "Performance Optimization", "WebSockets"],
    skillWeights: {
      "React": 25,
      "JavaScript": 20,
      "TypeScript": 15,
      "HTML": 15,
      "CSS": 15,
      "Git": 10,
    },
    projectExpectations: [
      "Interactive SPA or SSR web application with complex client-side state",
      "Pixel-perfect responsive styling across mobile, tablet, and desktop",
      "Integration with external RESTful or GraphQL endpoints"
    ],
    interviewTopics: [
      "JavaScript Event Loop, Closures, Prototypal Inheritance & Promises",
      "React Reconciliation, Virtual DOM, and Hook lifecycles",
      "State management patterns and minimizing unnecessary re-renders",
      "Core Web Vitals, critical rendering path, and bundle optimization",
      "Cross-browser compatibility and web accessibility (a11y)"
    ],
    minExpectedScore: MASTERY_THRESHOLD,
  },

  "Full Stack Developer": {
    roleName: "Full Stack Developer",
    coreSkills: ["JavaScript", "React", "Node.js", "SQL", "REST APIs", "HTML", "CSS"],
    requiredSkills: ["React", "Node.js", "JavaScript", "SQL", "REST APIs", "Git"],
    preferredSkills: ["TypeScript", "Next.js", "Docker", "PostgreSQL", "MongoDB", "Cloud"],
    skillWeights: {
      "React": 20,
      "Node.js": 20,
      "JavaScript": 15,
      "SQL": 15,
      "REST APIs": 15,
      "Git": 15,
    },
    projectExpectations: [
      "End-to-end web product with interactive frontend and persistent API backend",
      "Secure user authentication, payment or webhook integration, and database migrations",
      "Live deployment on Vercel/Render/AWS with CI/CD automation"
    ],
    interviewTopics: [
      "Client-server request/response lifecycles and CORS policies",
      "Full-stack state synchronization and optimistic UI updates",
      "Database schema relationships and aggregation pipelines",
      "Security best practices (XSS, CSRF, SQL Injection, sanitization)",
      "Deployment pipelines and environment variable secrets management"
    ],
    minExpectedScore: MASTERY_THRESHOLD,
  },

  "Python Developer": {
    roleName: "Python Developer",
    coreSkills: ["Python", "FastAPI", "Django", "SQL", "OOP", "REST APIs"],
    requiredSkills: ["Python", "SQL", "REST APIs", "OOP", "Git"],
    preferredSkills: ["FastAPI", "Django", "Docker", "PostgreSQL", "Pytest", "Celery"],
    skillWeights: {
      "Python": 30,
      "SQL": 20,
      "REST APIs": 20,
      "OOP": 15,
      "Git": 15,
    },
    projectExpectations: [
      "Clean Python service with type annotations, Pydantic models, and pytest suite",
      "Asynchronous request handling with ASGI or distributed tasks using Celery/Redis",
      "Database access layer using SQLAlchemy or Django ORM"
    ],
    interviewTopics: [
      "Python Memory Management, Garbage Collection & Global Interpreter Lock (GIL)",
      "Generators, Iterators, Decorators, and Context Managers",
      "Asyncio event loops, coroutines, and synchronous vs asynchronous I/O",
      "Data structures complexity in Python (Dict hash collisions, List resizing)",
      "Unit testing, mocking strategies, and PEP8 standards"
    ],
    minExpectedScore: MASTERY_THRESHOLD,
  },

  "Java Developer": {
    roleName: "Java Developer",
    coreSkills: ["Java", "Spring Boot", "OOP", "DBMS", "SQL", "REST APIs"],
    requiredSkills: ["Java", "Spring Boot", "OOP", "SQL", "Git"],
    preferredSkills: ["Hibernate", "PostgreSQL", "Docker", "Microservices", "JUnit", "Maven"],
    skillWeights: {
      "Java": 30,
      "Spring Boot": 25,
      "OOP": 15,
      "SQL": 15,
      "Git": 15,
    },
    projectExpectations: [
      "Enterprise Spring Boot microservice with layered architecture (Controller, Service, Repository)",
      "Hibernate/JPA relational entity modeling with Flyway/Liquibase migrations",
      "Comprehensive test coverage with JUnit and Mockito"
    ],
    interviewTopics: [
      "Java Virtual Machine (JVM) Architecture, Memory Areas & Garbage Collectors",
      "Core Java Collections Framework mechanics (HashMap, ConcurrentHashMap)",
      "Spring IoC (Inversion of Control), Dependency Injection & Spring Bean lifecycles",
      "Multithreading, thread safety, synchronization, and ExecutorService",
      "JPA/Hibernate N+1 query problem, fetch types (EAGER vs LAZY)"
    ],
    minExpectedScore: MASTERY_THRESHOLD,
  },

  "Data Analyst": {
    roleName: "Data Analyst",
    coreSkills: ["SQL", "Excel", "Data Visualization", "Statistics", "Python"],
    requiredSkills: ["SQL", "Excel", "Statistics", "Data Visualization", "Python"],
    preferredSkills: ["Pandas", "PostgreSQL", "ETL", "Reporting", "Tableau", "Power BI"],
    skillWeights: {
      "SQL": 35,
      "Excel": 20,
      "Statistics": 20,
      "Data Visualization": 15,
      "Python": 10,
    },
    projectExpectations: [
      "Comprehensive business analytics dashboard in Tableau, Power BI, or Streamlit",
      "Complex SQL analytical queries utilizing CTEs, Window Functions, and aggregations",
      "Exploratory Data Analysis (EDA) report uncovering actionable business insights"
    ],
    interviewTopics: [
      "SQL Window Functions (ROW_NUMBER, RANK, DENSE_RANK, LEAD/LAG)",
      "Descriptive vs Inferential Statistics, Hypothesis Testing, and P-values",
      "Data cleaning, missing value imputation, and outlier detection",
      "Cohort analysis, customer retention, and conversion rate modeling",
      "Executive storytelling with data and dashboard KPI structuring"
    ],
    minExpectedScore: MASTERY_THRESHOLD,
  },

  "QA / Software Testing Engineer": {
    roleName: "QA / Software Testing Engineer",
    coreSkills: ["Software Testing", "Test Automation", "Selenium", "API Testing", "Postman", "Git"],
    requiredSkills: ["Manual Testing", "Test Automation", "API Testing", "Test Cases", "Git"],
    preferredSkills: ["Selenium", "Cypress", "Python", "Java", "CI/CD", "Performance Testing"],
    skillWeights: {
      "Manual Testing": 25,
      "Test Automation": 25,
      "API Testing": 20,
      "Test Cases": 15,
      "Git": 15,
    },
    projectExpectations: [
      "Automated End-to-End (E2E) test suite using Cypress, Playwright, or Selenium",
      "REST API automated test collection in Postman/Newman with assertion scripts",
      "Traceable test plan, test cases, and bug reports with reproducibility steps"
    ],
    interviewTopics: [
      "Software Testing Life Cycle (STLC) & Defect Management Lifecycle",
      "Black-box vs White-box testing techniques (Equivalence Partitioning, Boundary Value Analysis)",
      "Automated testing frameworks (Page Object Model design pattern)",
      "API validation (Status codes, headers, JSON payload assertion, latency)",
      "Continuous testing integration in CI/CD pipelines"
    ],
    minExpectedScore: MASTERY_THRESHOLD,
  },

  "DevOps / Cloud Engineer": {
    roleName: "DevOps / Cloud Engineer",
    coreSkills: ["Linux", "Docker", "Kubernetes", "AWS", "CI/CD", "Networking"],
    requiredSkills: ["Linux", "Docker", "AWS", "CI/CD", "Networking"],
    preferredSkills: ["Kubernetes", "Terraform", "GitHub Actions", "Monitoring", "Prometheus", "Bash"],
    skillWeights: {
      "Linux": 25,
      "Docker": 25,
      "AWS": 20,
      "CI/CD": 15,
      "Networking": 15,
    },
    projectExpectations: [
      "Multi-stage Dockerized container architecture deployed to cloud infrastructure",
      "Automated CI/CD pipeline building, linting, testing, and deploying automatically",
      "Infrastructure as Code (Terraform) scripts provisioning VPC, subnets, and compute"
    ],
    interviewTopics: [
      "Linux system administration, file permissions, shell scripting & process monitoring",
      "Docker internal mechanics, image layering, volume storage & networking",
      "Kubernetes Core Architecture (Pod, Deployment, Service, Ingress, ConfigMaps)",
      "CI/CD release strategies (Rolling updates, Blue-Green, Canary deployments)",
      "Cloud networking (VPC peering, Subnets, Route tables, Security Groups, NAT Gateways)"
    ],
    minExpectedScore: MASTERY_THRESHOLD,
  },

  "AI / ML Engineer": {
    roleName: "AI / ML Engineer",
    coreSkills: ["Python", "Machine Learning", "Deep Learning", "SQL", "Git"],
    requiredSkills: ["Python", "Machine Learning", "Deep Learning", "SQL", "Git"],
    preferredSkills: ["PyTorch", "TensorFlow", "LLMs", "RAG", "Model Serving", "Docker"],
    skillWeights: {
      "Python": 25,
      "Machine Learning": 25,
      "Deep Learning": 20,
      "SQL": 15,
      "Git": 15,
    },
    projectExpectations: [
      "End-to-end Machine Learning pipeline with data preprocessing and model evaluation",
      "Deep learning or LLM fine-tuning/RAG application deployed with an API endpoint",
      "Experiment tracking and model versioning"
    ],
    interviewTopics: [
      "Supervised vs Unsupervised learning algorithms and bias-variance tradeoff",
      "Gradient descent optimization, backpropagation, and loss functions",
      "Transformer architectures, attention mechanisms, and tokenization",
      "Model evaluation metrics (Precision, Recall, F1, ROC-AUC)",
      "Data preprocessing, embeddings, and vector databases"
    ],
    minExpectedScore: MASTERY_THRESHOLD,
  },
};

/**
 * Helper to retrieve role requirements safely by canonical ID or display name with fallback to Software Engineer
 */
export function getRoleRequirement(roleName: string): RoleRequirement {
  const displayName = toRoleDisplayName(roleName);
  if (ROLE_REQUIREMENTS[displayName]) {
    return ROLE_REQUIREMENTS[displayName];
  }

  const canonicalId = toCanonicalRoleId(roleName);
  const found = Object.values(ROLE_REQUIREMENTS).find(
    (r) => toCanonicalRoleId(r.roleName) === canonicalId
  );

  return found || ROLE_REQUIREMENTS["Software Engineer"];
}
