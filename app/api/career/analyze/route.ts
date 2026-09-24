import { NextResponse } from "next/server";
import { SkillMatch, CareerAnalysis, RoadmapModule } from "@/types";
import { analyzeResume } from "@/lib/ai/analyze-resume";

export const runtime = "nodejs";

interface RoleTieredSkills {
  core: string[];        // Weight 3x: Essential core foundations
  secondary: string[];   // Weight 2x: Frameworks & architectural skills
  tools: string[];       // Weight 1x: Tooling & ecosystem
}

const ROLE_TIERED_SKILLS: Record<string, RoleTieredSkills> = {
  "Frontend Engineer": {
    core: ["React", "JavaScript", "TypeScript", "HTML", "CSS"],
    secondary: ["Next.js", "Redux", "Tailwind CSS", "Responsive Design", "REST API"],
    tools: ["Git", "Webpack", "Vite", "Performance Optimization", "Accessibility", "Testing"],
  },
  "Backend Engineer": {
    core: ["Node.js", "Python", "SQL", "REST API", "PostgreSQL"],
    secondary: ["Express", "MongoDB", "Authentication", "Docker", "Database Design"],
    tools: ["Git", "Redis", "AWS", "CI/CD", "Linux", "Microservices"],
  },
  "Full Stack Developer": {
    core: ["React", "Node.js", "JavaScript", "SQL", "REST API"],
    secondary: ["TypeScript", "Next.js", "MongoDB", "HTML", "CSS"],
    tools: ["Git", "Docker", "PostgreSQL", "Tailwind CSS", "AWS", "CI/CD"],
  },
  "AI / ML Engineer": {
    core: ["Python", "Machine Learning", "PyTorch", "TensorFlow", "Deep Learning"],
    secondary: ["NumPy", "Pandas", "Scikit-learn", "NLP", "Computer Vision"],
    tools: ["Git", "Docker", "MLOps", "Jupyter", "SQL", "Data Pipelines"],
  },
  "AI/ML Engineer": {
    core: ["Python", "Machine Learning", "PyTorch", "TensorFlow", "Deep Learning"],
    secondary: ["NumPy", "Pandas", "Scikit-learn", "NLP", "Computer Vision"],
    tools: ["Git", "Docker", "MLOps", "Jupyter", "SQL", "Data Pipelines"],
  },
  "Data Scientist": {
    core: ["Python", "SQL", "Statistics", "Pandas", "Machine Learning"],
    secondary: ["NumPy", "Scikit-learn", "Data Visualization", "R", "Deep Learning"],
    tools: ["Git", "Jupyter", "Tableau", "Power BI", "Docker"],
  },
  "Data Analyst": {
    core: ["SQL", "Excel", "Tableau", "Data Visualization", "Statistics"],
    secondary: ["Python", "Power BI", "Data Wrangling", "Reporting", "ETL"],
    tools: ["Git", "PostgreSQL", "Jupyter", "Spreadsheets", "A/B Testing"],
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
    tools: ["Docker", "Linux", "CI/CD", "System Design", "API Design"],
  },
};

const CAREER_SKILLS: Record<string, string[]> = Object.fromEntries(
  Object.entries(ROLE_TIERED_SKILLS).map(([role, tiers]) => [
    role,
    [...tiers.core, ...tiers.secondary, ...tiers.tools],
  ])
);

function findSkillsInText(text: string, skills: string[]): SkillMatch[] {
  const lowerText = text.toLowerCase();
  return skills.map((skill) => {
    const skillLower = skill.toLowerCase();
    const found = lowerText.includes(skillLower);
    let confidence: "strong" | "weak" | "none" = "none";
    let evidence = "";

    if (found) {
      const skillIndex = lowerText.indexOf(skillLower);
      const contextStart = Math.max(0, skillIndex - 60);
      const contextEnd = Math.min(text.length, skillIndex + skill.length + 60);
      evidence = text.substring(contextStart, contextEnd).trim();

      const linesWithSkill = text.split("\n").filter((line) =>
        line.toLowerCase().includes(skillLower)
      );

      const hasActionVerbs = /(built|developed|engineered|implemented|designed|created|optimized|deployed)/i.test(evidence);
      const hasMetrics = /\d+%/i.test(evidence);

      if (linesWithSkill.length >= 2 || (hasActionVerbs && evidence.length > 40) || hasMetrics) {
        confidence = "strong";
      } else {
        confidence = "weak";
      }
    }

    return { skill, found, confidence, evidence };
  });
}

/**
 * Role-weighted alignment calculation with missing-core penalties.
 */
function calculateWeightedAlignment(career: string, matches: SkillMatch[], text: string): number {
  const tiers = ROLE_TIERED_SKILLS[career] || {
    core: ["Programming", "Problem Solving", "Git"],
    secondary: ["Databases", "APIs"],
    tools: ["Testing", "Linux"],
  };

  const getMatch = (skill: string) => matches.find((m) => m.skill.toLowerCase() === skill.toLowerCase());

  let totalWeight = 0;
  let earnedScore = 0;
  let missingCoreCount = 0;

  // 1. Core Tier (Weight: 3.5 per skill)
  for (const skill of tiers.core) {
    totalWeight += 3.5;
    const match = getMatch(skill);
    if (match?.found) {
      earnedScore += match.confidence === "strong" ? 3.5 : 2.0;
    } else {
      missingCoreCount++;
    }
  }

  // 2. Secondary Tier (Weight: 2.0 per skill)
  for (const skill of tiers.secondary) {
    totalWeight += 2.0;
    const match = getMatch(skill);
    if (match?.found) {
      earnedScore += match.confidence === "strong" ? 2.0 : 1.2;
    }
  }

  // 3. Tools Tier (Weight: 1.0 per skill)
  for (const skill of tiers.tools) {
    totalWeight += 1.0;
    const match = getMatch(skill);
    if (match?.found) {
      earnedScore += match.confidence === "strong" ? 1.0 : 0.6;
    }
  }

  // Calculate base percentage
  let percentage = totalWeight > 0 ? (earnedScore / totalWeight) * 100 : 50;

  // Evidence density adjustments
  const projectCount = (text.match(/project|portfolio|deployed|engineered/gi) || []).length;
  if (projectCount >= 4) percentage += 5;
  else if (projectCount <= 1) percentage -= 6;

  // Severe penalty for missing core foundational skills (e.g. Frontend missing React)
  if (missingCoreCount >= 3) {
    percentage -= 22;
  } else if (missingCoreCount === 2) {
    percentage -= 14;
  } else if (missingCoreCount === 1) {
    percentage -= 7;
  }

  // Ensure differentiated, authentic score range
  return Math.min(93, Math.max(22, Math.round(percentage)));
}

function generateFallbackRoadmap(career: string, missingSkills: string[]): RoadmapModule[] {
  const skillsToFocus = missingSkills.length > 0 ? missingSkills : (CAREER_SKILLS[career] || []).slice(0, 4);
  return [
    {
      id: "mod-1",
      title: `Phase 1: Priority Gap Remediation (${skillsToFocus[0] || "Foundations"})`,
      description: `Target high-priority missing requirements for ${career}: ${skillsToFocus.slice(0, 2).join(", ")}.`,
      estimatedWeeks: 4,
      skills: skillsToFocus.slice(0, Math.ceil(skillsToFocus.length / 2)),
      steps: [
        { id: "step-1-1", text: `Review core architectural paradigms for ${skillsToFocus.slice(0, 2).join(" and ")}.`, completed: false },
        { id: "step-1-2", text: "Build 2-3 focused hands-on mini-projects.", completed: false }
      ]
    },
    {
      id: "mod-2",
      title: "Phase 2: Applied System Architecture",
      description: "Build production portfolio applications integrating multiple enterprise skills.",
      estimatedWeeks: 6,
      skills: skillsToFocus.slice(Math.ceil(skillsToFocus.length / 2)),
      steps: [
        { id: "step-2-1", text: "Create GitHub showcase project applying newly mastered skills.", completed: false },
        { id: "step-2-2", text: "Document system design and architectural trade-offs.", completed: false }
      ]
    },
    {
      id: "mod-3",
      title: "Phase 3: Advanced Optimization & Interview Prep",
      description: `Refine production hygiene and prepare for senior interview panels.`,
      estimatedWeeks: 3,
      skills: ["Testing", "CI/CD", "System Design"],
      steps: [
        { id: "step-3-1", text: "Add comprehensive test suites and benchmark performance.", completed: false },
        { id: "step-3-2", text: "Execute mock technical and system design interview challenges.", completed: false }
      ]
    },
  ];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, career } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Resume text is required." }, { status: 400 });
    }
    if (!career || typeof career !== "string") {
      return NextResponse.json({ error: "Target career is required." }, { status: 400 });
    }

    const requiredSkills = CAREER_SKILLS[career] || [
      "JavaScript", "Python", "SQL", "Git", "REST API", "Docker", "Testing", "System Design"
    ];

    const tieredProfile = ROLE_TIERED_SKILLS[career];

    // Try AI analysis via service layer
    try {
      const aiResult = await analyzeResume({ resumeText: text, targetRole: career });

      const skills: SkillMatch[] = requiredSkills.map((skill) => {
        const techMatch = aiResult.technicalSkills?.find(
          (s) => s.toLowerCase() === skill.toLowerCase()
        );
        const allMatch = aiResult.skills?.find(
          (s) => s.toLowerCase() === skill.toLowerCase()
        );
        const found = !!(techMatch || allMatch);
        const inStrengths = aiResult.strengths?.some((s) => s.toLowerCase().includes(skill.toLowerCase()));
        const inWeaknesses = aiResult.weaknesses?.some((s) => s.toLowerCase().includes(skill.toLowerCase()));

        let confidence: "strong" | "weak" | "none" = "none";
        if (found) {
          confidence = inStrengths ? "strong" : inWeaknesses ? "weak" : "weak";
        }

        const localEvidence = findSkillsInText(text, [skill])[0]?.evidence || "";
        return { skill, found, confidence, evidence: localEvidence };
      });

      // Prioritize missing skills so that core requirements come first
      const missingSkillsSorted: string[] = [];
      if (tieredProfile) {
        for (const coreSkill of tieredProfile.core) {
          const m = skills.find((s) => s.skill.toLowerCase() === coreSkill.toLowerCase());
          if (!m?.found || m.confidence === "weak") missingSkillsSorted.push(coreSkill);
        }
        for (const secSkill of tieredProfile.secondary) {
          const m = skills.find((s) => s.skill.toLowerCase() === secSkill.toLowerCase());
          if (!m?.found && !missingSkillsSorted.includes(secSkill)) missingSkillsSorted.push(secSkill);
        }
      }

      // Calculate score with dynamic formula if AI returned out-of-bounds or identical score
      const alignmentScore = (aiResult.roleAlignment && aiResult.roleAlignment >= 20 && aiResult.roleAlignment <= 95)
        ? aiResult.roleAlignment
        : calculateWeightedAlignment(career, skills, text);

      const strengths = aiResult.strengths?.length > 0
        ? aiResult.strengths
        : skills.filter((s) => s.confidence === "strong").map((s) => s.skill);

      const rawWeaknesses = aiResult.weaknesses?.length > 0
        ? aiResult.weaknesses
        : skills.filter((s) => !s.found || s.confidence === "weak").map((s) => s.skill);

      // Order weaknesses by core priority
      const weaknesses = [
        ...missingSkillsSorted,
        ...rawWeaknesses.filter((w) => !missingSkillsSorted.includes(w))
      ];

      const prioritizedGaps = missingSkillsSorted.length > 0 ? missingSkillsSorted : weaknesses;
      const roadmap = generateFallbackRoadmap(career, prioritizedGaps);

      const analysis: CareerAnalysis = {
        targetRole: career,
        skills,
        strengths,
        weaknesses,
        alignmentScore,
        summary: aiResult.summary || `Analysis for ${career}. Alignment: ${alignmentScore}%. Core priority gap: ${prioritizedGaps[0] || "Advanced architecture"}.`,
        roadmap,
      };

      return NextResponse.json({ success: true, analysis });
    } catch (aiError) {
      console.error("AI analysis failed, using fallback:", aiError);
    }

    // Fallback: local keyword analysis
    const skills = findSkillsInText(text, requiredSkills);
    const alignmentScore = calculateWeightedAlignment(career, skills, text);

    const missingSkillsSorted: string[] = [];
    if (tieredProfile) {
      for (const coreSkill of tieredProfile.core) {
        const m = skills.find((s) => s.skill.toLowerCase() === coreSkill.toLowerCase());
        if (!m?.found || m.confidence === "weak") missingSkillsSorted.push(coreSkill);
      }
      for (const secSkill of tieredProfile.secondary) {
        const m = skills.find((s) => s.skill.toLowerCase() === secSkill.toLowerCase());
        if (!m?.found && !missingSkillsSorted.includes(secSkill)) missingSkillsSorted.push(secSkill);
      }
    }

    const strengths = skills.filter((s) => s.confidence === "strong").map((s) => s.skill);
    const weaknesses = [
      ...missingSkillsSorted,
      ...skills.filter((s) => !s.found && !missingSkillsSorted.includes(s.skill)).map((s) => s.skill)
    ];

    const roadmap = generateFallbackRoadmap(career, missingSkillsSorted.length > 0 ? missingSkillsSorted : weaknesses);

    const analysis: CareerAnalysis = {
      targetRole: career,
      skills,
      strengths,
      weaknesses,
      alignmentScore,
      summary: `[Audit Summary] Identified ${skills.filter((s) => s.found).length}/${skills.length} role competencies for ${career}. Role Alignment: ${alignmentScore}%. Priority focus: ${missingSkillsSorted[0] || "Core Architecture"}.`,
      roadmap,
    };

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Career analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze career fit." }, { status: 500 });
  }
}
