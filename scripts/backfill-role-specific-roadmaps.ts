import { prisma } from "../lib/prisma";
import { getRoleTailoredPlan } from "../app/api/roadmap/generate/route";
import { getRoleRequirement } from "../lib/skills/role-requirements";

async function main() {
  console.log("=== Starting Backfill: Role-Specific Roadmaps ===");

  const users = await prisma.user.findMany({
    include: {
      careerProfiles: true,
      roadmaps: {
        include: {
          items: true,
        },
      },
      dailyMissions: true,
      progress: true,
      assessments: true,
      userSkills: {
        include: {
          skill: true,
        },
      },
    },
  });

  console.log(`Found ${users.length} total users in database.`);
  let updatedCount = 0;

  for (const user of users) {
    const roadmap = user.roadmaps?.[0];
    const targetRole =
      user.careerProfiles?.[0]?.targetRole ||
      roadmap?.targetRole ||
      "Software Engineer";

    console.log(`\nProcessing user ${user.id} (${user.email || "no-email"}) -> Target Role: "${targetRole}"`);

    // Fetch canonical requirements & compute skill gaps
    const roleReq = getRoleRequirement(targetRole);
    const userSkillMap = new Map(
      user.userSkills.map((us) => [us.skill.name.toLowerCase(), us])
    );

    const trueGaps: string[] = [];
    for (const reqSkill of roleReq.requiredSkills || []) {
      const us = userSkillMap.get(reqSkill.toLowerCase());
      if (!us || !us.found || us.confidence === "none" || us.confidence === "weak") {
        trueGaps.push(reqSkill);
      }
    }

    const timelineWeeks = roadmap?.timelineWeeks || 8;
    const weeklyHours = roadmap?.weeklyHours || 18;

    // Generate role-specific weeks plan targeting specific gaps
    const { weeks, agentSummary } = getRoleTailoredPlan(
      targetRole,
      timelineWeeks,
      weeklyHours,
      undefined,
      trueGaps
    );
    const weeksDataStr = JSON.stringify(weeks);
    const strategyTitle = `${timelineWeeks}-Week ${targetRole} Roadmap`;

    let roadmapId = roadmap?.id;

    if (roadmap) {
      await prisma.roadmap.update({
        where: { id: roadmap.id },
        data: {
          targetRole,
          weeksData: weeksDataStr,
          strategyTitle,
          strategicAdvice: agentSummary.strategicAdvice || roadmap.strategicAdvice,
          timelineWeeks,
          weeklyHours,
        },
      });
      console.log(`  Updated Roadmap ${roadmap.id} -> "${strategyTitle}" (${weeks.length} tailored weeks)`);
    } else {
      const newRoadmap = await prisma.roadmap.create({
        data: {
          userId: user.id,
          targetRole,
          weeksData: weeksDataStr,
          strategyTitle,
          strategicAdvice: agentSummary.strategicAdvice,
          timelineWeeks,
          weeklyHours,
          daysData: "{}",
          dayResults: "{}",
        },
      });
      roadmapId = newRoadmap.id;
      console.log(`  Created new Roadmap ${newRoadmap.id} for user ${user.id}`);
    }

    // Map existing completion status for days across dailyMissions, assessments, and roadmapItems
    const completedDaysMap = new Map<number, { completed: boolean; score: number | null }>();

    for (const m of user.dailyMissions) {
      if (m.completed) {
        completedDaysMap.set(m.dayNumber, { completed: true, score: m.score ?? 80 });
      }
    }

    for (const a of user.assessments) {
      if (a.dayNumber && a.passed) {
        completedDaysMap.set(a.dayNumber, { completed: true, score: a.overallScore });
      }
    }

    if (roadmap?.items) {
      for (const item of roadmap.items) {
        if (item.dayNumber && item.completed) {
          completedDaysMap.set(item.dayNumber, { completed: true, score: item.score ?? 80 });
        }
      }
    }

    // Regenerate RoadmapItems for all days in the roadmap
    if (roadmapId) {
      // Clear legacy items for fresh role-calibrated insertion
      await prisma.roadmapItem.deleteMany({
        where: { roadmapId },
      });

      const roadmapItemsData = [];
      for (let w = 0; w < weeks.length; w++) {
        const week = weeks[w];
        for (let d = 1; d <= 5; d++) {
          const dayNumber = w * 5 + d;
          const skillIndex = (d - 1) % (week.focusSkills.length || 1);
          const focusSkill = week.focusSkills[skillIndex] || week.focusSkills[0] || targetRole;
          const status = completedDaysMap.get(dayNumber);

          roadmapItemsData.push({
            roadmapId,
            weekNumber: w + 1,
            dayNumber,
            title: `Day ${dayNumber}: ${focusSkill} Production Mastery`,
            description: `Role-calibrated milestone for ${targetRole}: master ${focusSkill} through applied architecture, code sandbox, and interview assessment.`,
            completed: status?.completed || false,
            score: status?.score || null,
          });
        }
      }

      await prisma.roadmapItem.createMany({
        data: roadmapItemsData,
      });
      console.log(`  Regenerated ${roadmapItemsData.length} role-specific RoadmapItems`);
    }

    // Update or create DailyMissions for the user
    for (let w = 0; w < weeks.length; w++) {
      const week = weeks[w];
      for (let d = 1; d <= 5; d++) {
        const dayNumber = w * 5 + d;
        const skillIndex = (d - 1) % (week.focusSkills.length || 1);
        const focusSkill = week.focusSkills[skillIndex] || week.focusSkills[0] || targetRole;
        const status = completedDaysMap.get(dayNumber);

        const existingMission = user.dailyMissions.find((m) => m.dayNumber === dayNumber);
        if (existingMission) {
          await prisma.dailyMission.update({
            where: { id: existingMission.id },
            data: {
              weekNumber: w + 1,
              title: `Day ${dayNumber}: ${focusSkill} Production Mastery`,
              description: `Role-tailored mission for ${targetRole}: master ${focusSkill} with deep architecture lessons, interactive sandbox coding, and interview assessments.`,
              completed: status?.completed || existingMission.completed,
              score: status?.score ?? existingMission.score,
            },
          });
        } else if (dayNumber <= 10) {
          // Seed initial daily missions for new roadmaps
          await prisma.dailyMission.create({
            data: {
              userId: user.id,
              dayNumber,
              weekNumber: w + 1,
              title: `Day ${dayNumber}: ${focusSkill} Production Mastery`,
              description: `Role-tailored mission for ${targetRole}: master ${focusSkill} with deep architecture lessons, interactive sandbox coding, and interview assessments.`,
              completed: status?.completed || false,
              score: status?.score || null,
            },
          });
        }
      }
    }

    // Preserve and update Progress records per week
    for (let w = 0; w < weeks.length; w++) {
      const weekNumber = w + 1;
      const weekId = `week-${weekNumber}`;
      let completedInWeek = 0;
      for (let d = 1; d <= 5; d++) {
        const dayNumber = w * 5 + d;
        if (completedDaysMap.get(dayNumber)?.completed) {
          completedInWeek++;
        }
      }

      const existingProgress = user.progress.find((p) => p.weekId === weekId);
      const overallProgress = (completedInWeek / 5) * 100;

      if (existingProgress) {
        await prisma.progress.update({
          where: { id: existingProgress.id },
          data: {
            completedDays: completedInWeek,
            totalDays: 5,
            overallProgress,
          },
        });
      } else {
        await prisma.progress.create({
          data: {
            userId: user.id,
            weekId,
            completedDays: completedInWeek,
            totalDays: 5,
            overallProgress,
          },
        });
      }
    }

    updatedCount++;
  }

  console.log(`\n=== Backfill Complete: ${updatedCount} users processed successfully ===`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
