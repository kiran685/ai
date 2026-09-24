import { NextResponse } from "next/server";
import { WeekOverview, RoadmapQuestionnaireData, AgentRoadmapSummary, CombinedSkillEvaluation } from "@/types";
import { generateRoadmap } from "@/lib/ai/roadmap";
import { SkillGap } from "@/lib/ai/types";

export const runtime = "nodejs";

export interface RoleWeekTemplate {
  title: string;
  skills: string[];
  description: string;
}

export const ROLE_CURRICULA: Record<string, RoleWeekTemplate[]> = {
  "Frontend Engineer": [
    {
      title: "Modern React & Component Lifecycle Mastery",
      skills: ["React", "JSX & Virtual DOM", "Hooks & State", "Component Architecture"],
      description: "Deep dive into React core mechanics, reactive state propagation, and clean component interfaces.",
    },
    {
      title: "TypeScript for Enterprise Frontend Systems",
      skills: ["TypeScript", "Generics", "Type Narrowing", "React Props & State Typing"],
      description: "Build robust, compile-time verified user interfaces using TypeScript generics and discriminated unions.",
    },
    {
      title: "Advanced State Architecture & Data Fetching",
      skills: ["State Management", "Zustand / Redux", "TanStack Query", "REST API Integration"],
      description: "Architect global client state, caching strategies, and seamless server synchronization.",
    },
    {
      title: "Full-Stack React with Next.js & Server Components",
      skills: ["Next.js", "Server Components (RSC)", "Server Actions", "App Router Architecture"],
      description: "Master modern Next.js paradigms, streaming SSR, and SEO-optimized web applications.",
    },
    {
      title: "Responsive Styling, Tailwind CSS & Design Systems",
      skills: ["Tailwind CSS", "Design Systems", "CSS Grid/Flexbox", "Component Libraries"],
      description: "Construct accessible, pixel-perfect, and mobile-responsive UI components.",
    },
    {
      title: "Web Performance, Core Web Vitals & Bundle Optimization",
      skills: ["Performance Optimization", "Code Splitting", "Lighthouse", "Core Web Vitals"],
      description: "Diagnose rendering bottlenecks, optimize bundle sizes, and achieve sub-second load times.",
    },
    {
      title: "Frontend Testing, Accessibility (a11y) & CI/CD",
      skills: ["Vitest / Jest", "React Testing Library", "WCAG Accessibility", "Playwright E2E"],
      description: "Ensure enterprise reliability with unit, integration, and automated end-to-end testing.",
    },
    {
      title: "Production Frontend Capstone & Interview Readiness",
      skills: ["Frontend Portfolio Delivery", "System Design for Web", "Mock Interviews"],
      description: "Deliver a polished, production-grade frontend portfolio project and master frontend interview questions.",
    },
  ],

  "Backend Engineer": [
    {
      title: "Backend Core & Runtime Execution Mechanics",
      skills: ["Node.js", "Event Loop", "Asynchronous Pipelines", "TypeScript / Python"],
      description: "Master runtime concurrency models, non-blocking I/O, and asynchronous backend execution.",
    },
    {
      title: "RESTful & GraphQL API Architecture",
      skills: ["REST API", "Express / FastAPI", "GraphQL", "HTTP Protocol & Status"],
      description: "Design and implement production-ready API contracts with schema validation.",
    },
    {
      title: "Relational Database Design & SQL Optimization",
      skills: ["SQL", "PostgreSQL", "Query Optimization", "Indexing & Transactions"],
      description: "Architect ACID-compliant relational schemas, write complex queries, and tune indexes.",
    },
    {
      title: "NoSQL Stores, In-Memory Caching & Redis",
      skills: ["Redis", "MongoDB", "Distributed Caching", "Rate Limiting"],
      description: "Implement high-throughput caching layers and document storage patterns.",
    },
    {
      title: "Enterprise Authentication & Security Protocols",
      skills: ["Authentication", "JWT / OAuth2", "CORS & CSRF Defense", "Data Encryption"],
      description: "Secure APIs with robust token lifecycles, role-based access control (RBAC), and crypto best practices.",
    },
    {
      title: "Containerization, Microservices & Docker",
      skills: ["Docker", "Microservices", "API Gateway", "Message Queues (RabbitMQ/Kafka)"],
      description: "Decouple monolithic backends into containerized microservices and asynchronous message queues.",
    },
    {
      title: "Backend System Design & High-Availability Scaling",
      skills: ["System Design", "Load Balancing", "Horizontal Scaling", "Sharding"],
      description: "Architect distributed systems capable of handling millions of concurrent requests.",
    },
    {
      title: "Production Deployment, CI/CD & Capstone Showcase",
      skills: ["CI/CD Pipelines", "Cloud Deployment (AWS)", "Logging & Telemetry", "Capstone Project"],
      description: "Deploy a resilient backend system to cloud infrastructure with automated CI/CD and monitoring.",
    },
  ],

  "Full Stack Developer": [
    {
      title: "React Frontend Foundations & Component UI",
      skills: ["React", "JavaScript", "JSX & State", "Modern Component Architecture"],
      description: "Establish strong mastery over modern React components, reactive hooks, and responsive interfaces.",
    },
    {
      title: "Backend API Design & Node.js Server Engineering",
      skills: ["Node.js", "Express", "REST API", "HTTP & Middleware"],
      description: "Build secure, modular server endpoints and integrate frontend requests.",
    },
    {
      title: "Full Stack Database Integration & ORM Modeling",
      skills: ["SQL / PostgreSQL", "Prisma / Mongoose", "Schema Design", "Migrations"],
      description: "Connect frontends to persistent databases with type-safe ORM layers and optimized queries.",
    },
    {
      title: "Next.js Full-Stack Architecture & Modern SSR",
      skills: ["Next.js", "Server Actions", "App Router", "API Routes"],
      description: "Unify frontend presentation and backend logic within modern full-stack frameworks.",
    },
    {
      title: "Secure Authentication, Session Management & RBAC",
      skills: ["Authentication", "NextAuth / JWT", "Password Hashing", "Protected Routes"],
      description: "Implement end-to-end authentication, session storage, and security headers.",
    },
    {
      title: "Real-Time WebSockets & Asynchronous Background Tasks",
      skills: ["WebSockets", "Socket.io", "Real-Time Updates", "Background Jobs"],
      description: "Build live collaborative features, instant messaging, and asynchronous job processing.",
    },
    {
      title: "Containerization, Cloud CI/CD & Production Testing",
      skills: ["Docker", "GitHub Actions", "Full Stack Testing", "Vercel / AWS Deployment"],
      description: "Automate build pipelines and deploy containerized full-stack apps to production.",
    },
    {
      title: "Full Stack Enterprise Capstone & System Showcase",
      skills: ["Portfolio Delivery", "Full Stack Architecture", "Interview Preparation"],
      description: "Deliver an end-to-end full-stack SaaS application and simulate senior technical interviews.",
    },
  ],

  "AI / ML Engineer": [
    {
      title: "Python for Scientific Computing & Matrix Algebra",
      skills: ["Python", "NumPy", "Linear Algebra", "Vectorized Computation"],
      description: "Master numerical computing foundations, tensor manipulation, and matrix operations.",
    },
    {
      title: "Data Engineering, Wrangling & Statistical Analysis",
      skills: ["Pandas", "Data Cleaning", "Feature Engineering", "Exploratory Data Analysis"],
      description: "Transform unstructured data, engineer predictive features, and analyze distributions.",
    },
    {
      title: "Classical Machine Learning Algorithms & Evaluation",
      skills: ["Scikit-learn", "Regression & Classification", "Random Forests", "Cross-Validation"],
      description: "Train and benchmark supervised and unsupervised machine learning models.",
    },
    {
      title: "Deep Learning Architectures & PyTorch Foundations",
      skills: ["PyTorch", "Neural Networks", "Backpropagation", "Loss Functions"],
      description: "Build and train multi-layer perceptrons and deep neural networks using PyTorch.",
    },
    {
      title: "Computer Vision & Natural Language Processing",
      skills: ["Computer Vision (CNNs)", "NLP Basics", "Tokenization", "Embeddings"],
      description: "Process spatial image data and textual sequences with deep learning architectures.",
    },
    {
      title: "Transformers, Large Language Models & Modern RAG",
      skills: ["Transformers", "Hugging Face", "Vector Databases", "Retrieval-Augmented Generation (RAG)"],
      description: "Harness modern LLMs, implement embedding retrieval pipelines, and fine-tune models.",
    },
    {
      title: "MLOps, Model Serving & Automated Pipelines",
      skills: ["FastAPI", "Docker", "Model Registry (MLflow)", "Inference Optimization"],
      description: "Package machine learning models into high-performance REST inference endpoints.",
    },
    {
      title: "Production AI Capstone & Technical Interview Mastery",
      skills: ["Production AI System", "End-to-End Showcase", "ML System Design"],
      description: "Deliver a production-grade AI application and master machine learning interview questions.",
    },
  ],

  "Data Scientist": [
    {
      title: "Python Data Science Stack & Exploratory Analysis",
      skills: ["Python", "Pandas", "NumPy", "Data Cleaning"],
      description: "Master core data science workflows, dataframe wrangling, and descriptive analytics.",
    },
    {
      title: "Applied Probability & Inferential Statistics",
      skills: ["Statistics", "Hypothesis Testing", "A/B Testing", "Confidence Intervals"],
      description: "Apply rigorous statistical significance testing to validate business hypotheses.",
    },
    {
      title: "Advanced SQL for Analytical Querying & ETL",
      skills: ["SQL", "Window Functions", "Common Table Expressions (CTEs)", "Data Pipelines"],
      description: "Query analytical databases to extract clean, aggregated business datasets.",
    },
    {
      title: "Predictive Machine Learning Modeling",
      skills: ["Scikit-learn", "Supervised Learning", "Model Tuning", "Evaluation Metrics"],
      description: "Build predictive models and optimize hyper-parameters for precision and recall.",
    },
    {
      title: "Interactive Data Storytelling & Dashboarding",
      skills: ["Data Visualization", "Tableau / Power BI", "Matplotlib / Seaborn", "Executive Reporting"],
      description: "Translate complex analytical findings into compelling visual stories for stakeholders.",
    },
    {
      title: "Unsupervised Learning & Clustering Patterns",
      skills: ["K-Means", "PCA & Dimensionality Reduction", "Anomaly Detection", "Customer Segmentation"],
      description: "Uncover hidden behavioral patterns and reduce high-dimensional dataset complexity.",
    },
    {
      title: "Big Data Processing & Production Pipelines",
      skills: ["PySpark / BigQuery", "ETL Automation", "Data Modeling", "Cloud Data Warehouses"],
      description: "Scale data workflows across distributed data warehouses and automated ETL jobs.",
    },
    {
      title: "Data Science Portfolio Capstone & Defense",
      skills: ["Portfolio Defense", "Business Impact Analysis", "Technical Interview Prep"],
      description: "Complete an impactful data science capstone project with clear business value metrics.",
    },
  ],

  "Cloud / DevOps Engineer": [
    {
      title: "Linux Operating Systems & Shell Automation",
      skills: ["Linux", "Bash Scripting", "System Administration", "Process & Memory Management"],
      description: "Master Unix internals, shell scripting, permissions, and network troubleshooting.",
    },
    {
      title: "Docker Containerization & Multi-Stage Builds",
      skills: ["Docker", "Containerization", "Dockerfile Optimization", "Docker Compose"],
      description: "Package distributed applications into secure, lightweight container images.",
    },
    {
      title: "Continuous Integration & Automated Pipelines",
      skills: ["CI/CD", "GitHub Actions", "Automated Testing", "Artifact Registries"],
      description: "Design automated build, test, and release pipelines using GitHub Actions.",
    },
    {
      title: "Kubernetes Orchestration & Cluster Management",
      skills: ["Kubernetes", "Pods & Deployments", "Services & Ingress", "ConfigMaps & Secrets"],
      description: "Deploy and manage containerized workloads across production Kubernetes clusters.",
    },
    {
      title: "Infrastructure as Code (IaC) with Terraform",
      skills: ["Terraform", "HCL", "State Management", "Cloud Provisioning"],
      description: "Declare, version, and provision reproducible cloud infrastructure using Terraform.",
    },
    {
      title: "AWS Cloud Architecture & Networking",
      skills: ["AWS", "VPC & Subnets", "IAM Security", "EC2, S3 & RDS"],
      description: "Architect secure, scalable cloud environments adhering to AWS Well-Architected Framework.",
    },
    {
      title: "Observability, Monitoring & Incident Management",
      skills: ["Prometheus", "Grafana", "Log Aggregation", "Alerting & SRE Best Practices"],
      description: "Set up comprehensive system telemetry, metric dashboards, and automated alert routing.",
    },
    {
      title: "DevOps Capstone Project & Cloud Interview Prep",
      skills: ["Production Infrastructure Showcase", "Disaster Recovery", "Mock Technical Interviews"],
      description: "Demonstrate a complete gitops-driven infrastructure pipeline from scratch.",
    },
  ],

  "Cybersecurity Engineer": [
    {
      title: "Computer Networking & Network Defense",
      skills: ["Networking", "TCP/IP Protocol", "Packet Inspection (Wireshark)", "Firewalls"],
      description: "Deep dive into network protocols, packet routing, and perimeter boundary defense.",
    },
    {
      title: "Linux Security Hardening & Systems Auditing",
      skills: ["Linux", "Security Auditing", "SSH Hardening", "User Privileges & Sudoers"],
      description: "Harden operating systems against unauthorized privilege escalation and lateral movement.",
    },
    {
      title: "Web Application Security & OWASP Top 10",
      skills: ["OWASP Top 10", "SQL Injection", "XSS & CSRF", "Secure Coding Practices"],
      description: "Identify and remediate critical web application vulnerabilities using industry standards.",
    },
    {
      title: "Cryptography, PKI & Identity Access Management",
      skills: ["Cryptography", "Public Key Infrastructure (PKI)", "Hashing & Encryption", "IAM Policies"],
      description: "Implement secure key lifecycles, asymmetric encryption, and strict identity governance.",
    },
    {
      title: "Penetration Testing Tools & Threat Simulation",
      skills: ["Penetration Testing", "Burp Suite", "Nmap & Vulnerability Scanning", "Exploitation Basics"],
      description: "Simulate adversarial attack paths to detect system vulnerabilities before exploitation.",
    },
    {
      title: "Security Information & Event Management (SIEM)",
      skills: ["SIEM", "Log Analysis", "Threat Detection", "Splunk / Elastic Security"],
      description: "Centralize security event logs and write correlation rules to catch active intrusions.",
    },
    {
      title: "Incident Response & Forensics Investigation",
      skills: ["Incident Response", "Digital Forensics", "Containment Strategies", "Post-Mortem Analysis"],
      description: "Coordinate containment, eradication, and forensic root-cause analysis during breaches.",
    },
    {
      title: "Cybersecurity Capstone & Interview Readiness",
      skills: ["Security Architecture Showcase", "Threat Modeling", "Technical Interview Defense"],
      description: "Present a hardened defense architecture and prepare for security analyst/engineer interviews.",
    },
  ],

  "QA / Software Testing Engineer": [
    {
      title: "Software Testing Fundamentals & Test Case Design",
      skills: ["Manual Testing", "Test Cases", "STLC", "Boundary Value Analysis", "Equivalence Partitioning"],
      description: "Master testing methodologies, test plan authoring, boundary analysis, and defect tracking lifecycles.",
    },
    {
      title: "API Testing & Automation with Postman / Newman",
      skills: ["API Testing", "Postman", "Newman", "REST API", "JSON Schema Validation"],
      description: "Automate API assertions, status checks, latency benchmarks, and CLI test execution with Newman.",
    },
    {
      title: "UI Test Automation with Playwright / Cypress",
      skills: ["Test Automation", "Playwright", "Cypress", "Page Object Model (POM)", "Locator Strategies"],
      description: "Design robust, flake-resistant browser automation suites using modern async locator strategies.",
    },
    {
      title: "Web Element Locators, XPath & Dynamic Waiting",
      skills: ["Selenium / Playwright", "XPath", "Explicit Waits", "Cross-Browser Testing"],
      description: "Overcome asynchronous DOM rendering challenges, dynamic shadow roots, and multi-browser execution.",
    },
    {
      title: "Performance & Load Testing with k6 / JMeter",
      skills: ["Performance Testing", "k6", "JMeter", "Concurrency Simulation", "Latency Analysis"],
      description: "Simulate thousands of concurrent virtual users to identify backend bottlenecks and throughput degradation.",
    },
    {
      title: "Security & Vulnerability Testing Basics",
      skills: ["Security Testing", "OWASP ZAP", "Input Fuzzing", "Authentication Checks"],
      description: "Execute automated security scans and basic penetration testing checks to identify vulnerabilities.",
    },
    {
      title: "CI/CD Pipeline Test Automation & Reporting",
      skills: ["CI/CD", "GitHub Actions", "Allure Reporting", "Automated Regression Gates"],
      description: "Integrate automated regression suites into pull request pipelines with rich visual reporting.",
    },
    {
      title: "QA Capstone Framework Delivery & Interview Prep",
      skills: ["Test Framework Portfolio", "Mock Technical Defense", "SDET Interview Readiness"],
      description: "Present a production-grade automated testing framework from scratch and defend test strategies in interviews.",
    },
  ],

  "Software Engineer": [
    {
      title: "Programming & Problem Solving Foundations",
      skills: ["Programming Fundamentals", "Variables & Control Flow", "Functions & Scope", "Arrays & Strings", "Basic Problem Solving"],
      description: "Solidify core language fundamentals, variables, control flow, functions, scope, and array/string manipulation.",
    },
    {
      title: "DSA & Core Computer Science",
      skills: ["Arrays & Strings", "Hashing & HashMaps", "Linked Lists", "Stacks & Queues", "Trees & Recursion"],
      description: "Master foundational data structures, algorithmic time and space complexity, and efficient tree traversals.",
    },
    {
      title: "Core CS & Software Engineering",
      skills: ["OOP", "DBMS & SQL", "Operating Systems", "Computer Networks", "Git & Testing"],
      description: "Learn essential computer science pillars: object-oriented design, relational databases, OS concurrency, and testing.",
    },
    {
      title: "Projects & Interview Readiness",
      skills: ["Backend APIs", "Project Presentation", "Coding Interview Practice", "Behavioral Interview", "System Architecture"],
      description: "Deliver a clean software project, practice live coding interviews, and master technical communication.",
    },
  ],
};

// Mirror common aliases so direct lookup never fails
ROLE_CURRICULA["Frontend Developer"] = ROLE_CURRICULA["Frontend Engineer"];
ROLE_CURRICULA["Backend Developer"] = ROLE_CURRICULA["Backend Engineer"];
ROLE_CURRICULA["DevOps / Cloud Engineer"] = ROLE_CURRICULA["Cloud / DevOps Engineer"];
ROLE_CURRICULA["DevOps Engineer"] = ROLE_CURRICULA["Cloud / DevOps Engineer"];
ROLE_CURRICULA["Data Analyst"] = ROLE_CURRICULA["Data Scientist"];
ROLE_CURRICULA["QA Engineer"] = ROLE_CURRICULA["QA / Software Testing Engineer"];

export function resolveRoleCurriculum(roleName: string): RoleWeekTemplate[] {
  if (ROLE_CURRICULA[roleName]) {
    return ROLE_CURRICULA[roleName];
  }

  const normalized = (roleName || "").toLowerCase().trim();

  if (normalized.includes("frontend") || normalized.includes("ui")) {
    return ROLE_CURRICULA["Frontend Engineer"];
  }
  if (normalized.includes("full stack") || normalized.includes("fullstack")) {
    return ROLE_CURRICULA["Full Stack Developer"];
  }
  if (normalized.includes("backend") || normalized.includes("node") || normalized.includes("api")) {
    return ROLE_CURRICULA["Backend Engineer"];
  }
  if (normalized.includes("devops") || normalized.includes("cloud") || normalized.includes("sre") || normalized.includes("infrastructure")) {
    return ROLE_CURRICULA["Cloud / DevOps Engineer"];
  }
  if (normalized.includes("ai") || normalized.includes("machine learning") || normalized.includes("ml") || normalized.includes("deep learning")) {
    return ROLE_CURRICULA["AI / ML Engineer"];
  }
  if (normalized.includes("data analyst") || normalized.includes("data science") || normalized.includes("data scientist") || normalized.includes("analytics")) {
    return ROLE_CURRICULA["Data Scientist"];
  }
  if (normalized.includes("qa") || normalized.includes("test") || normalized.includes("sdet") || normalized.includes("quality")) {
    return ROLE_CURRICULA["QA / Software Testing Engineer"];
  }
  if (normalized.includes("security") || normalized.includes("cyber")) {
    return ROLE_CURRICULA["Cybersecurity Engineer"];
  }

  return ROLE_CURRICULA["Software Engineer"];
}

/**
 * Dynamically organizes roadmap weeks prioritizing the candidate's highest missing skills.
 * Strictly constrained to the target role's curriculum templates to prevent cross-curriculum contamination.
 */
export function getRoleTailoredPlan(
  career: string,
  timelineWeeks: number,
  weeklyHours: number,
  answers?: RoadmapQuestionnaireData,
  trueGaps: string[] = []
): { weeks: WeekOverview[]; agentSummary: AgentRoadmapSummary } {
  const baseTemplates = resolveRoleCurriculum(career);
  const preferredLang = answers?.preferredLanguage || answers?.currentLanguage || "";
  const companyType = answers?.targetCompanyType || "Tech Companies";

  // Inspect highest priority missing skills strictly within baseTemplates
  let orderedTemplates = baseTemplates.map((t, idx) => {
    const clone = { ...t, skills: [...t.skills] };
    // If student selected a preferred programming language, adapt foundational modules
    if (preferredLang && idx === 0 && (career === "Software Engineer" || career === "Backend Engineer")) {
      clone.title = `${preferredLang} Programming & Problem Solving Foundations`;
      clone.skills = [preferredLang, "Variables & Control Flow", "Functions & Scope", "Arrays & Strings", "Complexity Basics"];
      clone.description = `Master foundational syntax and coding idioms in ${preferredLang}, write algorithmic functions, and analyze Big-O complexity.`;
    }
    return clone;
  });

  if (trueGaps.length > 0) {
    const prioritizedModules: RoleWeekTemplate[] = [];
    const remainingTemplates = orderedTemplates.map(t => ({ ...t }));

    for (const gap of trueGaps) {
      const idx = remainingTemplates.findIndex(
        (t) =>
          t.skills.some(
            (s) =>
              s.toLowerCase().includes(gap.toLowerCase()) ||
              gap.toLowerCase().includes(s.toLowerCase())
          ) || t.title.toLowerCase().includes(gap.toLowerCase())
      );

      if (idx !== -1) {
        const [matched] = remainingTemplates.splice(idx, 1);
        matched.title = `${matched.title} (Priority: ${gap})`;
        matched.description = `Targeting identified priority gap in ${gap} as verified in your skill assessment.`;
        prioritizedModules.push(matched);
      }
    }

    orderedTemplates = [...prioritizedModules, ...remainingTemplates];
  }

  const weeks: WeekOverview[] = [];
  for (let i = 0; i < timelineWeeks; i++) {
    const template = orderedTemplates[i % orderedTemplates.length];
    const cycle = Math.floor(i / orderedTemplates.length);
    weeks.push({
      id: `week-${i + 1}`,
      weekNumber: i + 1,
      title: cycle > 0 ? `${template.title} (Part ${cycle + 1})` : template.title,
      focusSkills: template.skills,
      description: template.description,
      totalDays: 5,
    });
  }

  const focusSummary = trueGaps.length > 0 ? trueGaps.slice(0, 3) : orderedTemplates[0].skills.slice(0, 3);
  const hurdle = answers?.biggestHurdle || "Consistent Direction";
  const deliverable = answers?.targetDeliverable || "Portfolio Capstone";
  const langTag = preferredLang ? ` (${preferredLang} Track)` : "";

  const agentSummary: AgentRoadmapSummary = {
    strategyTitle: `Tailored ${timelineWeeks}-Week ${career}${langTag} Accelerator`,
    timelineWeeks,
    weeklyHours,
    pace: `${weeklyHours} hrs/week structured learning pace`,
    keyFocusAreas: focusSummary,
    strategicAdvice: `Customized for your ${timelineWeeks}-week timeframe and calibrated for ${companyType}. High priority gap remediation (${focusSummary.join(", ")}) front-loaded in Week 1 with a focus on ${preferredLang || "core technologies"}. Designed at ${weeklyHours} hrs/week to conquer '${hurdle}' and ship '${deliverable}'.`,
    milestones: [
      { week: 1, title: `Week 1 Foundations & Gap Remediation: ${focusSummary[0] || "Core Skills"}`, goal: `Establish daily momentum in ${preferredLang || "programming"} and close core gaps in ${focusSummary[0] || "fundamentals"}.` },
      { week: Math.max(2, Math.round(timelineWeeks * 0.4)), title: "Applied Architecture & Engineering", goal: `Build functional portfolio modules integrating primary ${career} competencies.` },
      { week: Math.max(3, Math.round(timelineWeeks * 0.75)), title: "Optimization, Testing & System Design", goal: `Incorporate enterprise testing, performance benchmarking, and architectural patterns aligned with ${companyType}.` },
      { week: timelineWeeks, title: "Capstone Delivery & Hiring Readiness", goal: `Deliver ${deliverable} and complete technical interview simulations.` },
    ],
  };

  return { weeks, agentSummary };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      text = "",
      career,
      answers,
      quizResult = null,
      combinedSkills = [],
    } = body;

    if (!career || typeof career !== "string") {
      return NextResponse.json({ error: "Target career is required." }, { status: 400 });
    }

    const typedAnswers = answers as RoadmapQuestionnaireData | undefined;
    const timelineWeeks = typedAnswers?.targetWeeks || 8;
    const hoursPerWeek = typedAnswers?.weeklyHours || 15;

    // Filter true gaps from resume analysis
    const trueGaps: string[] = (combinedSkills as CombinedSkillEvaluation[])
      .filter((s) => s.category === "true_gap" || s.category === "overstated" || s.category === "needs_work")
      .map((s) => s.skill);

    // Try AI generation via service layer
    try {
      const skillGaps: SkillGap[] = trueGaps.map((skill, idx) => ({
        skill,
        currentLevel: "Beginner",
        targetLevel: "Proficient",
        priority: idx === 0 ? "HIGH" : idx < 3 ? "MEDIUM" : "LOW",
        reason: `Identified gap for ${career}`,
      }));

      const aiDays = await generateRoadmap({
        skillGaps,
        targetRole: career,
        timeline: timelineWeeks,
        hoursPerWeek,
        currentLevel: typedAnswers?.currentKnowledge || "Intermediate",
      });

      if (aiDays && aiDays.length > 0) {
        const fallbackPlan = getRoleTailoredPlan(career, timelineWeeks, hoursPerWeek, typedAnswers, trueGaps);

        const formattedWeeks: WeekOverview[] = [];
        for (let w = 0; w < timelineWeeks; w++) {
          const weekDays = aiDays.filter((d) => {
            const dayNum = d.dayNumber;
            return dayNum >= w * 5 + 1 && dayNum <= (w + 1) * 5;
          });
          const weekSkills = [...new Set(weekDays.map((d) => d.skillFocus))];
          const fallbackWeek = fallbackPlan.weeks[w];

          formattedWeeks.push({
            id: `week-${w + 1}`,
            weekNumber: w + 1,
            title: fallbackWeek ? fallbackWeek.title : `Week ${w + 1}: ${weekSkills[0] || career}`,
            focusSkills: weekSkills.length > 0 ? weekSkills : (fallbackWeek ? fallbackWeek.focusSkills : [career]),
            description: fallbackWeek ? fallbackWeek.description : `Focus on ${weekSkills.join(", ") || "core concepts"}.`,
            totalDays: 5,
          });
        }

        const agentSummary: AgentRoadmapSummary = {
          strategyTitle: `Tailored ${timelineWeeks}-Week Career Acceleration Path for ${career}`,
          timelineWeeks,
          weeklyHours: hoursPerWeek,
          pace: `${hoursPerWeek} hrs/week`,
          keyFocusAreas: trueGaps.length > 0 ? trueGaps.slice(0, 3) : fallbackPlan.agentSummary.keyFocusAreas,
          strategicAdvice: `Personalized ${timelineWeeks}-week roadmap prioritizing core gaps (${trueGaps.slice(0, 3).join(", ") || "foundational requirements"}). Calibrated for ${hoursPerWeek} hrs/week.`,
          milestones: fallbackPlan.agentSummary.milestones,
        };

        return NextResponse.json({
          success: true,
          weeks: formattedWeeks,
          agentSummary,
          source: "ai",
        });
      }
    } catch (aiError) {
      console.error("AI roadmap generation failed, using tailored fallback:", aiError);
    }

    // Role-tailored plan with prioritized gap injection
    const tailoredResult = getRoleTailoredPlan(career, timelineWeeks, hoursPerWeek, typedAnswers, trueGaps);
    return NextResponse.json({
      success: true,
      weeks: tailoredResult.weeks,
      agentSummary: tailoredResult.agentSummary,
      source: "tailored_curriculum",
    });
  } catch (error) {
    console.error("Roadmap generation error:", error);
    return NextResponse.json({ error: "Failed to generate roadmap." }, { status: 500 });
  }
}
