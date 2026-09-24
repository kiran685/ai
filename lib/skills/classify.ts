export type SkillLevel = "STRONG" | "DEVELOPING" | "WEAK" | "MISSING" | "NOT_DEMONSTRATED";

export interface ClassifiedSkill {
  skill: string;
  level: SkillLevel;
  confidence: number;
  source: "resume" | "assessment" | "both";
}

export function classifySkills(
  resumeSkills: string[],
  assessmentScores: Record<string, number>
): ClassifiedSkill[] {
  const allSkills = new Set([...resumeSkills, ...Object.keys(assessmentScores)]);

  return Array.from(allSkills)
    .map((skill) => {
      const inResume = resumeSkills.some(
        (s) => s.toLowerCase() === skill.toLowerCase()
      );
      const score = assessmentScores[skill];

      let level: SkillLevel;
      let confidence: number;
      let source: "resume" | "assessment" | "both";

      if (inResume && score !== undefined) {
        source = "both";
        confidence = (100 + score) / 2;
        if (confidence >= 75) level = "STRONG";
        else if (confidence >= 50) level = "DEVELOPING";
        else level = "WEAK";
      } else if (inResume) {
        source = "resume";
        confidence = 60;
        level = "DEVELOPING";
      } else if (score !== undefined) {
        source = "assessment";
        confidence = score;
        if (score >= 75) level = "STRONG";
        else if (score >= 50) level = "DEVELOPING";
        else if (score >= 25) level = "WEAK";
        else level = "MISSING";
      } else {
        source = "resume";
        confidence = 0;
        level = "NOT_DEMONSTRATED";
      }

      return { skill, level, confidence, source };
    })
    .sort((a, b) => b.confidence - a.confidence);
}

export function getSkillsByLevel(classified: ClassifiedSkill[]): Record<SkillLevel, ClassifiedSkill[]> {
  const grouped: Record<SkillLevel, ClassifiedSkill[]> = {
    STRONG: [],
    DEVELOPING: [],
    WEAK: [],
    MISSING: [],
    NOT_DEMONSTRATED: [],
  };

  classified.forEach((s) => grouped[s.level].push(s));
  return grouped;
}
