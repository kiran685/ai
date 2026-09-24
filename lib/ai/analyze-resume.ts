import { ResumeAnalysisInput, ResumeAnalysisResult } from "./types";
import { generateGeminiJson } from "./gemini";

interface RoleCompetencies {
  core: string[];
  secondary: string[];
  tools: string[];
}

const ROLE_PROFILES: Record<string, RoleCompetencies> = {
  "Frontend Engineer": {
    core: ["React", "JavaScript", "TypeScript", "HTML", "CSS"],
    secondary: ["Next.js", "Redux", "Tailwind CSS", "Responsive Design", "REST API"],
    tools: ["Git", "Webpack", "Vite", "Jest", "Performance Optimization"],
  },
  "Backend Engineer": {
    core: ["Node.js", "Python", "SQL", "REST API", "PostgreSQL"],
    secondary: ["Express", "MongoDB", "Authentication", "Docker", "Database Design"],
    tools: ["Git", "Redis", "AWS", "CI/CD", "Linux"],
  },
  "Full Stack Developer": {
    core: ["React", "Node.js", "JavaScript", "SQL", "REST API"],
    secondary: ["TypeScript", "Next.js", "MongoDB", "HTML", "CSS"],
    tools: ["Git", "Docker", "PostgreSQL", "Tailwind CSS", "AWS"],
  },
  "AI / ML Engineer": {
    core: ["Python", "Machine Learning", "PyTorch", "TensorFlow", "Deep Learning"],
    secondary: ["NumPy", "Pandas", "Scikit-learn", "NLP", "Computer Vision"],
    tools: ["Git", "Docker", "MLOps", "Jupyter", "SQL"],
  },
  "AI/ML Engineer": {
    core: ["Python", "Machine Learning", "PyTorch", "TensorFlow", "Deep Learning"],
    secondary: ["NumPy", "Pandas", "Scikit-learn", "NLP", "Computer Vision"],
    tools: ["Git", "Docker", "MLOps", "Jupyter", "SQL"],
  },
  "Data Scientist": {
    core: ["Python", "SQL", "Statistics", "Pandas", "Machine Learning"],
    secondary: ["NumPy", "Scikit-learn", "Data Visualization", "R", "EDA"],
    tools: ["Git", "Jupyter", "Tableau", "Power BI", "Docker"],
  },
  "Data Analyst": {
    core: ["SQL", "Excel", "Tableau", "Data Visualization", "Statistics"],
    secondary: ["Python", "Power BI", "Data Wrangling", "Reporting", "ETL"],
    tools: ["Git", "PostgreSQL", "Jupyter", "Spreadsheets"],
  },
  "Cloud / DevOps Engineer": {
    core: ["Linux", "Docker", "Kubernetes", "AWS", "CI/CD"],
    secondary: ["Terraform", "GitHub Actions", "Networking", "Bash", "Monitoring"],
    tools: ["Git", "Ansible", "GCP", "Azure", "Prometheus"],
  },
  "DevOps Engineer": {
    core: ["Linux", "Docker", "Kubernetes", "AWS", "CI/CD"],
    secondary: ["Terraform", "GitHub Actions", "Networking", "Bash", "Monitoring"],
    tools: ["Git", "Ansible", "GCP", "Azure", "Prometheus"],
  },
  "Cybersecurity Engineer": {
    core: ["Networking", "Linux", "Penetration Testing", "Firewalls", "Cryptography"],
    secondary: ["Vulnerability Assessment", "SIEM", "Incident Response", "Python", "IAM"],
    tools: ["Git", "Wireshark", "Burp Suite", "Kali Linux", "Security Auditing"],
  },
  "Software Engineer": {
    core: ["JavaScript", "Python", "Data Structures", "Algorithms", "Git"],
    secondary: ["SQL", "REST API", "TypeScript", "Object-Oriented Programming", "Testing"],
    tools: ["Docker", "Linux", "CI/CD", "System Design"],
  },
};

/**
 * Creates an intelligent, role-weighted deterministic evaluation when Gemini is unavailable.
 */
function createFallbackResumeAnalysis(input: ResumeAnalysisInput): ResumeAnalysisResult {
  const text = input.resumeText.toLowerCase();
  const profile = ROLE_PROFILES[input.targetRole] || {
    core: ["Programming", "Problem Solving", "Git", "REST API"],
    secondary: ["Databases", "Testing", "Architecture"],
    tools: ["CI/CD", "Linux", "Documentation"],
  };

  const allTechKeywords = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "Python", "Java", "C++",
    "SQL", "PostgreSQL", "MongoDB", "MySQL", "Docker", "Kubernetes", "AWS", "Git", "REST API",
    "GraphQL", "HTML", "CSS", "Tailwind CSS", "Redux", "Linux", "PyTorch", "TensorFlow",
    "Pandas", "NumPy", "Scikit-learn", "Machine Learning", "Deep Learning", "CI/CD", "Terraform",
    "Data Structures", "Algorithms"
  ];

  const detectedTech = allTechKeywords.filter((tech) => text.includes(tech.toLowerCase()));
  const technicalSkills = detectedTech.length > 0 ? detectedTech : ["Computer Science Foundations", "Analytical Thinking"];

  // Evaluate matches across tiers
  const coreMatches = profile.core.filter((skill) => text.includes(skill.toLowerCase()));
  const secondaryMatches = profile.secondary.filter((skill) => text.includes(skill.toLowerCase()));
  const toolsMatches = profile.tools.filter((skill) => text.includes(skill.toLowerCase()));

  // Identify true missing skills for this role
  const missingCore = profile.core.filter((skill) => !text.includes(skill.toLowerCase()));
  const missingSecondary = profile.secondary.filter((skill) => !text.includes(skill.toLowerCase()));
  const missingSkills = [...missingCore, ...missingSecondary.slice(0, 2)];

  // Depth indicators in resume text
  const projectMentions = (text.match(/project|developed|built|engineered|architected|implemented/g) || []).length;
  const metricsCount = (text.match(/\d+%/g) || []).length;
  const hasExperience = text.includes("experience") || text.includes("intern") || text.includes("engineer");

  // Weighted scoring calculation
  // 1. Core skills coverage: 45 points max
  const coreScore = (coreMatches.length / profile.core.length) * 45;

  // 2. Secondary skills coverage: 30 points max
  const secondaryScore = (secondaryMatches.length / profile.secondary.length) * 30;

  // 3. Tooling coverage: 15 points max
  const toolsScore = (toolsMatches.length / profile.tools.length) * 15;

  // 4. Project & Experience Evidence: 10 points max
  let evidenceScore = 0;
  if (projectMentions >= 5) evidenceScore += 5;
  else if (projectMentions >= 2) evidenceScore += 3;
  if (metricsCount >= 2) evidenceScore += 3;
  if (hasExperience) evidenceScore += 2;

  // Penalty for missing critical core skills (e.g. Frontend missing React)
  let penalty = 0;
  if (missingCore.length >= 3) {
    penalty = 25;
  } else if (missingCore.length === 2) {
    penalty = 15;
  } else if (missingCore.length === 1) {
    penalty = 8;
  }

  const rawScore = Math.round(coreScore + secondaryScore + toolsScore + evidenceScore - penalty);
  // Realistic bounds: entry level gaps get 25-45%, partial matches 50-70%, strong matches 75-92%
  const roleAlignment = Math.min(94, Math.max(24, rawScore));

  const strengths: string[] = [];
  if (coreMatches.length > 0) {
    strengths.push(`Demonstrated proficiency in core competencies: ${coreMatches.slice(0, 3).join(", ")}`);
  } else {
    strengths.push("General programming problem-solving foundations");
  }
  if (secondaryMatches.length > 0) {
    strengths.push(`Practical exposure to ecosystem tooling including ${secondaryMatches.slice(0, 2).join(" & ")}`);
  }
  if (projectMentions >= 3) {
    strengths.push("Hands-on implementation evidenced across portfolio initiatives");
  } else {
    strengths.push("Eager foundation with rapid upskilling capability");
  }

  const weaknesses: string[] = [];
  if (missingCore.length > 0) {
    weaknesses.push(`Absence of critical role requirement: ${missingCore.join(", ")}`);
  }
  if (missingSecondary.length > 0) {
    weaknesses.push(`Gaps in modern workflows: ${missingSecondary.slice(0, 2).join(", ")}`);
  }
  if (metricsCount === 0) {
    weaknesses.push("Lack of quantifiable business metrics or performance benchmarks in project descriptions");
  }

  return {
    targetRole: input.targetRole,
    summary: `Resume evaluated for ${input.targetRole}. Shows ${coreMatches.length}/${profile.core.length} core competencies. Key gap priority: ${missingCore.length > 0 ? missingCore.join(", ") : "Advanced system scaling"}. Alignment calculated at ${roleAlignment}%.`,
    skills: technicalSkills,
    technicalSkills,
    softSkills: ["Technical Communication", "Collaborative Problem Solving", "Analytical Thinking"],
    education: [
      {
        degree: "Degree in Computer Science, Information Technology, or Relevant Discipline",
        institution: "Accredited University / Technical Institution",
      },
    ],
    experience: [
      {
        title: `${input.targetRole} Candidate`,
        company: "Academic, Professional, or Self-Directed Development",
        description: `Constructed software systems aligning with ${input.targetRole} responsibilities.`,
      },
    ],
    projects: [
      {
        name: "Technical Portfolio Application",
        description: `Engineered end-to-end application utilizing ${technicalSkills.slice(0, 3).join(", ")}.`,
        technologies: technicalSkills.slice(0, 3),
      },
    ],
    certifications: [],
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    missingSkills: missingSkills.length > 0 ? missingSkills : ["Advanced Distributed Systems", "Enterprise CI/CD"],
    roleAlignment,
  };
}

/**
 * Analyzes resume text against a target career role using Gemini AI.
 *
 * @param input Resume text and target career role.
 * @returns Strongly typed ResumeAnalysisResult.
 */
export async function analyzeResume(
  input: ResumeAnalysisInput
): Promise<ResumeAnalysisResult> {
  const fallback = createFallbackResumeAnalysis(input);

  const prompt = `
You are an elite technical executive recruiter and principal engineer.
Evaluate the candidate's resume text below specifically for the target role: "${input.targetRole}".

CRITICAL SCORING RUBRIC FOR "roleAlignment" (0 to 100):
- MUST BE DIFFERENT AND REALISTIC FOR EACH RESUME. Do NOT give a default 80-85%.
- Essential Core Skills Missing (e.g. Candidate targets "Frontend Engineer" but lacks React/Modern JS frameworks, or targets "Backend Engineer" but lacks APIs/Databases): Score MUST be between 25% and 52%.
- Partial Foundations (Has 1-2 core skills but missing secondary stack and has few real projects): Score MUST be between 53% and 68%.
- Strong Alignment (Demonstrates all primary skills, projects, and relevant experience for ${input.targetRole}): Score MUST be between 70% and 92%.
- Identify top missing skills in "missingSkills", with highest priority core gaps listed first.

Return your complete assessment strictly in JSON format matching the following schema:
{
  "targetRole": "${input.targetRole}",
  "summary": "A high-signal 2-3 sentence executive summary of the candidate's background, key gaps, and calculated fit for ${input.targetRole}.",
  "skills": ["Array of all extracted technical and soft skills"],
  "technicalSkills": ["Array of specific programming languages, frameworks, databases, cloud, and tools"],
  "softSkills": ["Array of interpersonal, leadership, and operational skills"],
  "education": [
    {
      "degree": "Degree name or credential",
      "institution": "School or organization name",
      "year": "Graduation year or dates if stated"
    }
  ],
  "experience": [
    {
      "title": "Job title",
      "company": "Company or organization",
      "duration": "Time period",
      "description": "Concise overview of key impact and duties"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "What was built and candidate's contribution",
      "technologies": ["Tech used"]
    }
  ],
  "certifications": ["List of any certificates or licenses"],
  "strengths": ["Top 3 specific technical strengths relevant to ${input.targetRole}"],
  "weaknesses": ["Top 3 technical or experience gaps compared against standard requirements for ${input.targetRole}"],
  "missingSkills": ["Critical skills or tools expected for ${input.targetRole} that are completely absent in this resume, prioritized by importance"],
  "roleAlignment": an integer from 0 to 100 calculated according to the strict rubric
}

--- RESUME TEXT ---
${input.resumeText}
`;

  return generateGeminiJson<ResumeAnalysisResult>(prompt, fallback, {
    temperature: 0.1,
  });
}
