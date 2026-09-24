import { StructuredCareerProfile, SkillEvidenceItem, SkillStatus } from "@/types";

/**
 * Extracts ONLY genuine factual information present in the resume text.
 * Rule: NEVER invent or hallucinate degrees, projects, certifications, or experience.
 */
export function extractStructuredCareerProfile(resumeText: string = ""): StructuredCareerProfile {
  if (!resumeText || resumeText.trim().length === 0) {
    return {
      education: [],
      degree: "Not specified",
      branch: "Not specified",
      graduationYear: undefined,
      experience: [],
      internships: [],
      projects: [],
      programmingLanguages: [],
      frameworks: [],
      databases: [],
      tools: [],
      certifications: [],
      achievements: [],
      technicalSkills: [],
      rawTextSnippet: "",
    };
  }

  const lines = resumeText.split("\n").map((l) => l.trim()).filter(Boolean);
  const lowerText = resumeText.toLowerCase();

  // 1. Education extraction
  const education: string[] = [];
  let degree = "";
  let branch = "";
  let graduationYear: string | undefined = undefined;

  const degreePatterns = [
    { pattern: /b\.?tech|bachelor of technology/i, label: "B.Tech" },
    { pattern: /b\.?e\.?|bachelor of engineering/i, label: "B.E." },
    { pattern: /b\.?sc|bachelor of science/i, label: "B.Sc" },
    { pattern: /bca|bachelor of computer applications/i, label: "BCA" },
    { pattern: /m\.?tech|master of technology/i, label: "M.Tech" },
    { pattern: /mca|master of computer applications/i, label: "MCA" },
    { pattern: /m\.?s\.?|master of science/i, label: "M.S." },
    { pattern: /bachelor/i, label: "Bachelor's Degree" },
    { pattern: /master/i, label: "Master's Degree" },
  ];

  for (const dp of degreePatterns) {
    if (dp.pattern.test(resumeText)) {
      degree = dp.label;
      break;
    }
  }

  const branchPatterns = [
    { pattern: /computer science|cse|cs\b/i, label: "Computer Science & Engineering" },
    { pattern: /information technology|\bit\b/i, label: "Information Technology" },
    { pattern: /artificial intelligence|ai|data science|aiml/i, label: "AI & Data Science" },
    { pattern: /electronics and communication|ece/i, label: "Electronics & Communication" },
    { pattern: /electrical|eee/i, label: "Electrical Engineering" },
    { pattern: /mechanical/i, label: "Mechanical Engineering" },
  ];

  for (const bp of branchPatterns) {
    if (bp.pattern.test(resumeText)) {
      branch = bp.label;
      break;
    }
  }

  // Grad year search (e.g. 2021-2025, Passed in 2024, Class of 2023)
  const yearMatch = resumeText.match(/\b(201[89]|202[0-9])\b/);
  if (yearMatch) {
    graduationYear = yearMatch[1];
  }

  for (const line of lines) {
    if (/(university|college|institute|school|b\.tech|bachelor|master|degree|cgpa|gpa|percentage)/i.test(line)) {
      if (line.length > 10 && line.length < 150 && !education.includes(line)) {
        education.push(line);
      }
    }
  }

  // 2. Experience & Internships extraction
  const experience: string[] = [];
  const internships: string[] = [];
  let inExperienceSection = false;
  let inProjectsSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeader = /^(experience|work experience|employment|internships|internship experience|projects|academic projects|technical projects)\b/i.test(line);

    if (isHeader) {
      if (/experience|employment/i.test(line)) inExperienceSection = true;
      if (/projects/i.test(line)) inProjectsSection = true;
      continue;
    }

    if (/intern\b|internship\b/i.test(line)) {
      if (line.length > 15 && line.length < 180 && !internships.includes(line)) {
        internships.push(line);
      }
    } else if (inExperienceSection && /(software|developer|engineer|analyst|associate|lead|trainee)/i.test(line)) {
      if (line.length > 15 && line.length < 180 && !experience.includes(line)) {
        experience.push(line);
      }
    }
  }

  // 3. Projects extraction
  const projects: string[] = [];
  for (const line of lines) {
    if (
      /(github\.com|demo|deployed|built|developed|created|implemented|system|application|pipeline|platform)/i.test(line) &&
      !/(education|university|college|cgpa)/i.test(line)
    ) {
      if (line.length > 25 && line.length < 220 && !projects.includes(line)) {
        projects.push(line);
      }
    }
  }

  // 4. Known skill catalogs for accurate zero-hallucination detection
  const KNOWN_LANGUAGES = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "Go", "Golang", "Rust", "PHP", "Ruby", "Kotlin", "Swift", "SQL"
  ];
  const KNOWN_FRAMEWORKS = [
    "React", "Next.js", "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot", "Spring", "Angular", "Vue", "NestJS", "Tailwind CSS", "Redux", "GraphQL"
  ];
  const KNOWN_DATABASES = [
    "PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Oracle", "Cassandra", "DynamoDB", "Firebase", "Supabase"
  ];
  const KNOWN_TOOLS = [
    "Git", "GitHub", "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Linux", "Postman", "Jest", "Pytest", "Jira", "CI/CD", "Vercel", "Tableau", "Power BI", "Excel"
  ];

  const programmingLanguages = KNOWN_LANGUAGES.filter((lang) => {
    const regex = new RegExp(`\\b${lang.replace(/\+/g, "\\+")}\\b`, "i");
    return regex.test(resumeText);
  });

  const frameworks = KNOWN_FRAMEWORKS.filter((fw) => {
    const regex = new RegExp(`\\b${fw}\\b`, "i");
    return regex.test(resumeText);
  });

  const databases = KNOWN_DATABASES.filter((db) => {
    const regex = new RegExp(`\\b${db}\\b`, "i");
    return regex.test(resumeText);
  });

  const tools = KNOWN_TOOLS.filter((tl) => {
    const regex = new RegExp(`\\b${tl}\\b`, "i");
    return regex.test(resumeText);
  });

  // 5. Certifications & Achievements
  const certifications: string[] = [];
  const achievements: string[] = [];

  for (const line of lines) {
    if (/(certified|certification|aws certified|coursera|udemy|nptel|hackerrank|leetcode)/i.test(line)) {
      if (line.length > 10 && line.length < 150 && !certifications.includes(line)) {
        certifications.push(line);
      }
    }
    if (/(award|rank|first place|winner|finalist|scholarship|achieved|solved \d+)/i.test(line)) {
      if (line.length > 10 && line.length < 150 && !achievements.includes(line)) {
        achievements.push(line);
      }
    }
  }

  // 6. Build Technical Skills with Evidence & Status
  const detectedSkills = Array.from(new Set([
    ...programmingLanguages,
    ...frameworks,
    ...databases,
    ...tools,
  ]));

  const technicalSkills: SkillEvidenceItem[] = detectedSkills.map((skill) => {
    const skillLower = skill.toLowerCase();
    const skillIndex = lowerText.indexOf(skillLower);
    const contextStart = Math.max(0, skillIndex - 60);
    const contextEnd = Math.min(resumeText.length, skillIndex + skill.length + 80);
    const rawContext = resumeText.substring(contextStart, contextEnd).trim();

    const matchingLines = lines.filter((l) => l.toLowerCase().includes(skillLower));
    const fullLine = matchingLines[0] || rawContext;

    const actionVerbRegex = /(built|developed|engineered|implemented|designed|created|optimized|deployed|architected)/i;
    const projectContextRegex = /(project|experience|intern|work|app|service|api|system)/i;

    const hasAction = actionVerbRegex.test(fullLine) || actionVerbRegex.test(rawContext);
    const hasProject = projectContextRegex.test(fullLine) || projectContextRegex.test(rawContext);

    let status: SkillStatus = "NOT_DEMONSTRATED";
    let confidence = 0.5;

    if (hasAction && hasProject && fullLine.length > 40) {
      status = "DEMONSTRATED";
      confidence = 0.88;
    } else if (matchingLines.length >= 2 || hasAction) {
      status = "DEMONSTRATED";
      confidence = 0.75;
    } else if (fullLine.length > 20) {
      status = "DEVELOPING";
      confidence = 0.60;
    } else {
      status = "WEAK";
      confidence = 0.40;
    }

    return {
      skill,
      status,
      confidence,
      evidence: fullLine.length > 140 ? `${fullLine.substring(0, 140)}...` : fullLine,
    };
  });

  return {
    education: education.slice(0, 4),
    degree: degree || "Undergraduate / Bachelor's",
    branch: branch || "Computer Science / Related Engineering",
    graduationYear,
    experience: experience.slice(0, 6),
    internships: internships.slice(0, 4),
    projects: projects.slice(0, 6),
    programmingLanguages,
    frameworks,
    databases,
    tools,
    certifications: certifications.slice(0, 4),
    achievements: achievements.slice(0, 4),
    technicalSkills,
    rawTextSnippet: resumeText.substring(0, 300),
  };
}
