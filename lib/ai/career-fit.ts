import {
  StructuredCareerProfile,
  CareerDiscoveryMatch,
  RoleFitDeepDive,
  SkillEvidenceClassification,
  SkillStatus,
} from "@/types";
import { extractStructuredCareerProfile } from "@/lib/skills/profile-extractor";
import { matchProfileToRoles } from "@/lib/skills/discovery-engine";
import { ROLE_REQUIREMENTS } from "@/lib/skills/role-requirements";
import { generateGeminiJson } from "@/lib/ai/gemini";

/**
 * Evaluates career fit for a candidate against all standard tech tracks.
 */
export function evaluateCandidateCareerFit(resumeText: string): {
  profile: StructuredCareerProfile;
  recommendations: CareerDiscoveryMatch[];
} {
  const profile = extractStructuredCareerProfile(resumeText);
  const recommendations = matchProfileToRoles(profile, resumeText);
  return { profile, recommendations };
}

/**
 * Slugifies a role title for URL usage (e.g. "Software Engineer" -> "software-engineer")
 */
export function slugifyRole(roleName: string): string {
  return roleName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Finds matching role requirement by slug or exact name
 */
export function resolveRoleFromSlug(slug: string): string {
  const decoded = decodeURIComponent(slug).toLowerCase().trim();
  const allRoles = Object.keys(ROLE_REQUIREMENTS);

  for (const role of allRoles) {
    if (slugifyRole(role) === decoded || role.toLowerCase() === decoded) {
      return role;
    }
  }

  // Fallback match
  if (decoded.includes("software")) return "Software Engineer";
  if (decoded.includes("backend")) return "Backend Developer";
  if (decoded.includes("frontend")) return "Frontend Developer";
  if (decoded.includes("data-sci") || decoded.includes("scientist")) return "Data Scientist";
  if (decoded.includes("data-ana") || decoded.includes("analyst")) return "Data Analyst";
  if (decoded.includes("qa") || decoded.includes("test")) return "QA Engineer";
  if (decoded.includes("devops") || decoded.includes("cloud")) return "DevOps Engineer";
  if (decoded.includes("ai") || decoded.includes("ml")) return "AI / ML Engineer";
  if (decoded.includes("cyber") || decoded.includes("security")) return "Cybersecurity Engineer";

  return "Software Engineer";
}

/**
 * Generates an exhaustive evidence-backed deep dive for a selected role.
 * Rule: NEVER hallucinate skills or evidence not present in the resume.
 */
export async function generateRoleDeepDive(
  resumeText: string,
  targetRole: string
): Promise<RoleFitDeepDive> {
  const profile = extractStructuredCareerProfile(resumeText);
  const matches = matchProfileToRoles(profile, resumeText);
  const roleMatch = matches.find((m) => m.roleName.toLowerCase() === targetRole.toLowerCase()) || matches[0];
  const roleReq = ROLE_REQUIREMENTS[targetRole] || ROLE_REQUIREMENTS["Software Engineer"];

  const lowerText = resumeText.toLowerCase();

  const strongMatches: SkillEvidenceClassification[] = [];
  const developingSkills: SkillEvidenceClassification[] = [];
  const missingSkills: SkillEvidenceClassification[] = [];

  const allReqSkills = Array.from(new Set([
    ...roleReq.coreSkills,
    ...roleReq.requiredSkills,
    ...roleReq.preferredSkills,
  ]));

  allReqSkills.forEach((skill) => {
    const sLower = skill.toLowerCase();
    const foundInTech = profile.technicalSkills.find((t) => t.skill.toLowerCase() === sLower);
    const mentions = lowerText.includes(sLower);

    if (foundInTech && foundInTech.status === "DEMONSTRATED") {
      strongMatches.push({
        skill,
        status: "DEMONSTRATED",
        evidence: foundInTech.evidence || `Demonstrated practical application in project/experience section`,
      });
    } else if (foundInTech && foundInTech.status === "DEVELOPING") {
      developingSkills.push({
        skill,
        status: "DEVELOPING",
        evidence: foundInTech.evidence || `Mentioned with introductory/coursework context`,
      });
    } else if (mentions) {
      developingSkills.push({
        skill,
        status: "DEVELOPING",
        evidence: `Mentioned in resume text with limited project implementation context`,
      });
    } else {
      const isCore = roleReq.coreSkills.some((c) => c.toLowerCase() === sLower);
      missingSkills.push({
        skill,
        status: isCore ? "MISSING" : "NOT_DEMONSTRATED",
        evidence: "Not found in resume experience or project evidence",
        reason: isCore ? `Essential core requirement for ${targetRole}` : `Preferred industry capability`,
      });
    }
  });

  // Biggest gaps
  const biggestGaps = missingSkills
    .filter((s) => s.status === "MISSING")
    .map((s) => s.skill)
    .slice(0, 4);

  if (biggestGaps.length === 0) {
    biggestGaps.push(...missingSkills.map((s) => s.skill).slice(0, 3));
  }

  // Recommended next steps
  const recommendedNextSteps = [
    `Bridge highest-priority gap in ${biggestGaps[0] || "Advanced Architecture"} through applied hands-on implementation`,
    `Build an end-to-end portfolio project explicitly demonstrating ${biggestGaps.slice(0, 2).join(" & ")}`,
    `Refine resume bullet points with quantified metrics and explicit technical verbs`,
    `Complete adaptive daily missions to master core production standards`,
  ];

  return {
    roleName: targetRole,
    suitabilityScore: roleMatch ? roleMatch.matchPercentage : 70,
    whyItFits: roleMatch ? roleMatch.whyItMatches : ["Foundational computer science coursework"],
    strongMatches,
    developingSkills,
    missingSkills,
    biggestGaps,
    recommendedNextSteps,
  };
}
