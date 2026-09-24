import { DayPlan, DayResult, DayResultQuestionReview } from "@/types";

export function exportDayNotesAsPdf(dayPlan: DayPlan, targetRole: string = "Software Engineering") {
  const primarySkill = dayPlan.skills[0] || targetRole;
  const dayTopics = (dayPlan.topics && dayPlan.topics.length > 0) ? dayPlan.topics : (dayPlan.requiredModules || []);
  const fileName = `Day_${dayPlan.dayNumber}_${primarySkill.replace(/[^a-zA-Z0-9]/g, "_")}_Comprehensive_Notes.pdf`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${dayPlan.topic} - Masterclass Notes</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4;
      margin: 18mm 16mm 20mm 16mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 9pt;
        color: #71717a;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #18181b;
      background: #ffffff;
      line-height: 1.65;
      font-size: 10pt;
      margin: 0;
      padding: 12px;
    }

    .doc-header {
      border: 1.5px solid #e4e4e7;
      border-radius: 8px;
      padding: 20px 24px;
      background: #fafafa;
      margin-bottom: 24px;
    }

    .badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 700;
      padding: 4px 9px;
      border-radius: 4px;
      background: #f4f4f5;
      color: #27272a;
      border: 1px solid #e4e4e7;
    }

    .badge-primary {
      background: #09090b;
      color: #ffffff;
      border: 1px solid #09090b;
    }

    .badge-telugu {
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #ffedd5;
      font-weight: 700;
    }

    .badge-english {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #dbeafe;
      font-weight: 700;
    }

    h1 {
      font-size: 19pt;
      font-weight: 800;
      color: #09090b;
      margin: 8px 0 12px 0;
      letter-spacing: -0.025em;
      line-height: 1.25;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px 20px;
      font-size: 9pt;
      color: #52525b;
      padding-top: 14px;
      border-top: 1px solid #e4e4e7;
    }

    .meta-item strong {
      color: #18181b;
      font-weight: 700;
    }

    .section-title {
      font-size: 13.5pt;
      font-weight: 800;
      color: #09090b;
      border-bottom: 2px solid #09090b;
      padding-bottom: 5px;
      margin-top: 28px;
      margin-bottom: 14px;
      letter-spacing: -0.015em;
      page-break-after: avoid;
    }

    .topic-card {
      margin-bottom: 28px;
      page-break-inside: auto;
    }

    .topic-title {
      font-size: 12pt;
      font-weight: 800;
      color: #09090b;
      margin-top: 20px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    .topic-subtitle {
      font-size: 9.5pt;
      color: #71717a;
      font-style: italic;
      margin-top: -4px;
      margin-bottom: 12px;
    }

    .overview-box {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 12px 16px;
      border-radius: 0 6px 6px 0;
      margin: 14px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }

    .overview-box-title {
      font-weight: 800;
      color: #1e40af;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }

    .theory-box {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 14px 18px;
      border-radius: 0 6px 6px 0;
      margin: 16px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }

    .theory-box-title {
      font-weight: 800;
      color: #15803d;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 6px;
    }

    .theory-content {
      color: #14532d;
      line-height: 1.65;
      white-space: pre-line;
      font-size: 9pt;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    th {
      background: #f4f4f5;
      color: #18181b;
      font-weight: 700;
      text-align: left;
      padding: 9px 12px;
      border: 1px solid #d4d4d8;
      font-family: 'JetBrains Mono', monospace;
    }

    td {
      padding: 8px 12px;
      border: 1px solid #e4e4e7;
      color: #3f3f46;
      vertical-align: top;
      line-height: 1.5;
    }

    tr:nth-child(even) {
      background: #fafafa;
    }

    .code-container {
      margin: 14px 0;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #27272a;
      page-break-inside: avoid;
    }

    .code-header {
      background: #18181b;
      color: #a1a1aa;
      padding: 6px 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 600;
      border-bottom: 1px solid #27272a;
      text-transform: uppercase;
    }

    pre {
      background: #09090b !important;
      color: #f4f4f5 !important;
      padding: 14px 16px;
      margin: 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      line-height: 1.5;
      overflow-x: auto;
    }

    .code-explanation {
      background: #18181b;
      color: #d4d4d8;
      padding: 8px 14px;
      font-size: 8.5pt;
      border-top: 1px solid #27272a;
      font-style: italic;
    }

    .cmd-box {
      background: #09090b;
      color: #4ade80;
      padding: 10px 14px;
      border-radius: 5px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      margin: 10px 0;
      border: 1px solid #27272a;
      page-break-inside: avoid;
    }

    ul {
      margin: 6px 0 12px 0;
      padding-left: 20px;
    }

    li {
      margin-bottom: 5px;
      color: #3f3f46;
    }

    .qa-box {
      border: 1.5px solid #e4e4e7;
      border-radius: 6px;
      padding: 12px 16px;
      margin: 10px 0;
      background: #ffffff;
      page-break-inside: avoid;
    }

    .qa-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .qa-q {
      font-size: 9.5pt;
      font-weight: 700;
      color: #09090b;
    }

    .qa-a {
      font-size: 9pt;
      color: #3f3f46;
      line-height: 1.6;
      margin: 0;
    }

    .video-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      padding: 10px 14px;
      margin: 8px 0;
      background: #ffffff;
      page-break-inside: avoid;
      text-decoration: none;
      color: inherit;
    }

    .footer {
      text-align: center;
      font-size: 8pt;
      color: #a1a1aa;
      margin-top: 36px;
      padding-top: 12px;
      border-top: 1px solid #e4e4e7;
    }
  </style>
</head>
<body>

  <!-- Document Header -->
  <div class="doc-header">
    <div class="badge-row">
      <span class="badge badge-primary">DAY ${dayPlan.dayNumber} CURRICULUM</span>
      <span class="badge">GEEKSFORGEEKS COMPREHENSIVE NOTES</span>
      <span class="badge">PROFESSIONAL STUDY GUIDE</span>
    </div>

    <h1>${dayPlan.topic}</h1>

    <div class="meta-grid">
      <div class="meta-item"><strong>Target Career Track:</strong> ${targetRole}</div>
      <div class="meta-item"><strong>Focus Skills:</strong> ${dayPlan.skills.join(", ")}</div>
      <div class="meta-item"><strong>Content Scope:</strong> Complete Theory, Architecture, Code & Interview Q&A</div>
      <div class="meta-item"><strong>Estimated Study Time:</strong> 90 – 120 Minutes</div>
    </div>
  </div>

  <!-- Executive Overview -->
  <div class="overview-box">
    <div class="overview-box-title">📌 Executive Overview & Core Learning Objectives</div>
    <p style="margin: 0; color: #1e293b; font-size: 9.5pt; line-height: 1.6;">${dayPlan.description}</p>
  </div>

  <!-- Sequential Topics -->
  ${dayTopics.map((topic, tIdx) => `
    <div class="topic-card">
      <h2 class="section-title">Topic ${tIdx + 1}: ${topic.title}</h2>
      ${topic.subtitle ? `<div class="topic-subtitle">${topic.subtitle}</div>` : ""}

      ${topic.overview ? `
        <p style="font-size: 9.5pt; color: #3f3f46; margin-bottom: 12px;"><strong>Concept Overview:</strong> ${topic.overview}</p>
      ` : ""}

      <!-- In-Depth Theoretical Deep Dive -->
      ${topic.comprehensiveTheory ? `
        <div class="theory-box">
          <div class="theory-box-title">🧠 Theoretical Deep Dive & Internal Mechanics</div>
          <div class="theory-content">${topic.comprehensiveTheory}</div>
        </div>
      ` : ""}

      <!-- Technical Comparison Table -->
      ${topic.comparisonTable && topic.comparisonTable.headers && topic.comparisonTable.rows ? `
        <h3 style="font-size: 10.5pt; font-weight: 700; color: #18181b; margin-top: 16px; margin-bottom: 8px;">
          📊 Technical Comparison & Architectural Tradeoffs
        </h3>
        <table>
          <thead>
            <tr>
              ${topic.comparisonTable.headers.map(h => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${topic.comparisonTable.rows.map(row => `
              <tr>
                ${row.map((cell, cIdx) => `<td ${cIdx === 0 ? 'style="font-weight: 600; color: #09090b;"' : ''}>${cell}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : ""}

      <!-- Practical Concepts, Commands & Annotated Code -->
      ${topic.modules && topic.modules.length > 0 ? `
        <h3 style="font-size: 10.5pt; font-weight: 700; color: #18181b; margin-top: 20px; margin-bottom: 8px;">
          💻 Implementation Walkthrough & Code Labs
        </h3>
        ${topic.modules.map((mod, mIdx) => `
          <div style="margin-bottom: 16px; padding: 12px 14px; border: 1px solid #e4e4e7; border-radius: 6px; background: #ffffff; page-break-inside: avoid;">
            <div style="font-weight: 700; font-size: 10pt; color: #09090b; margin-bottom: 4px;">
              Module ${tIdx + 1}.${mIdx + 1}: ${mod.title}
            </div>
            ${mod.overview ? `<p style="font-size: 9pt; color: #52525b; margin-bottom: 8px;">${mod.overview}</p>` : ""}

            ${mod.notes && mod.notes.length > 0 ? `
              <ul style="font-size: 9pt;">
                ${mod.notes.map(n => `<li>${n}</li>`).join("")}
              </ul>
            ` : ""}

            ${mod.commands && mod.commands.length > 0 ? `
              <div style="font-size: 8pt; font-weight: 700; color: #71717a; text-transform: uppercase; margin-top: 8px; margin-bottom: 2px;">
                Terminal Commands
              </div>
              <div class="cmd-box">
                ${mod.commands.map(c => `<div>$ ${c}</div>`).join("")}
              </div>
            ` : ""}

            ${mod.codeSnippet && mod.codeSnippet.code ? `
              <div class="code-container">
                <div class="code-header">${mod.codeSnippet.language || "TypeScript"} Source Implementation</div>
                <pre><code>${escapeHtml(mod.codeSnippet.code)}</code></pre>
                ${mod.codeSnippet.explanation ? `
                  <div class="code-explanation"><strong>Analysis:</strong> ${mod.codeSnippet.explanation}</div>
                ` : ""}
              </div>
            ` : ""}

            ${mod.keyTakeaways && mod.keyTakeaways.length > 0 ? `
              <div style="margin-top: 10px; font-size: 8.5pt; color: #15803d;">
                ${mod.keyTakeaways.map(t => `<div>✓ ${t}</div>`).join("")}
              </div>
            ` : ""}
          </div>
        `).join("")}
      ` : ""}

      <!-- High-Yield Interview Q&A -->
      ${topic.interviewQuestions && topic.interviewQuestions.length > 0 ? `
        <h3 style="font-size: 10.5pt; font-weight: 700; color: #18181b; margin-top: 20px; margin-bottom: 8px;">
          🎯 GeeksforGeeks Top Interview Questions & Comprehensive Answers
        </h3>
        ${topic.interviewQuestions.map((iq, qIdx) => `
          <div class="qa-box">
            <div class="qa-header">
              <div class="qa-q">Q${qIdx + 1}: ${iq.question}</div>
              ${iq.difficulty ? `<span class="badge" style="font-size: 7.5pt;">${iq.difficulty}</span>` : ""}
            </div>
            <p class="qa-a"><strong>Answer:</strong> ${iq.answer}</p>
          </div>
        `).join("")}
      ` : ""}
    </div>
  `).join("")}

  <!-- Curated Video Masterclasses -->
  ${dayPlan.youtubeResources && dayPlan.youtubeResources.length > 0 ? `
    <h2 class="section-title">🎥 Curated Video Tutorials & Masterclasses (Telugu & English)</h2>
    ${dayPlan.youtubeResources.map(yt => {
      const isTelugu = yt.language === "Telugu";
      return `
        <div class="video-card">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge ${isTelugu ? 'badge-telugu' : 'badge-english'}">
                ${isTelugu ? '🗣️ Telugu (తెలుగు)' : '🌐 English'}
              </span>
              <strong style="font-size: 9.5pt;">${yt.title}</strong>
            </div>
            ${yt.channel ? `<div style="font-size: 8.5pt; color: #71717a; margin-top: 3px;">Channel: ${yt.channel}</div>` : ""}
            ${yt.description ? `<div style="font-size: 8.5pt; color: #52525b; margin-top: 3px;">${yt.description}</div>` : ""}
          </div>
          <a href="${yt.url}" target="_blank" style="font-size: 8.5pt; font-family: 'JetBrains Mono', monospace; color: #dc2626; text-decoration: underline; white-space: nowrap; margin-left: 14px; font-weight: 700;">
            Watch Video ↗
          </a>
        </div>
      `;
    }).join("")}
  ` : ""}

  <!-- References -->
  ${dayPlan.learningResources && dayPlan.learningResources.length > 0 ? `
    <h2 class="section-title">📚 Official Documentation & References</h2>
    <ul style="font-size: 9pt;">
      ${dayPlan.learningResources.map(r => `<li>${r}</li>`).join("")}
    </ul>
  ` : ""}

  <div class="footer">
    Generated by AI Career OS &bull; GeeksforGeeks Masterclass Companion &bull; ${new Date().toLocaleDateString()}
  </div>

  <script>
    window.onload = function() {
      document.title = "${fileName.replace(".pdf", "")}";
      window.print();
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}

export function exportAssessmentReviewAsPdf(
  dayPlan: DayPlan,
  dayResult: DayResult,
  targetRole: string = "Software Engineering"
) {
  const primarySkill = dayPlan.skills[0] || targetRole;
  const fileName = `Day_${dayPlan.dayNumber}_${primarySkill.replace(/[^a-zA-Z0-9]/g, "_")}_Assessment_Report_and_Explanations.pdf`;
  const reviewItems: DayResultQuestionReview[] = dayResult.review || dayPlan.assessment.map((q) => ({
    id: q.id,
    question: q.question,
    codeSnippet: q.codeSnippet,
    language: q.language,
    options: q.options,
    userAnswerIndex: typeof dayResult.answers?.[q.id] === "number" ? dayResult.answers[q.id] : -1,
    correctIndex: q.correctIndex,
    isCorrect: dayResult.answers?.[q.id] === q.correctIndex,
    explanation: q.explanation || "Verified correct solution.",
    explanationBreakdown: q.explanationBreakdown,
  }));

  const correctCount = reviewItems.filter((r: DayResultQuestionReview) => r.isCorrect).length;
  const totalCount = reviewItems.length;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${dayPlan.topic} - Assessment Report & Explanations</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4;
      margin: 16mm 14mm 18mm 14mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8.5pt;
        color: #71717a;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #18181b;
      background: #ffffff;
      line-height: 1.6;
      font-size: 9.5pt;
      margin: 0;
      padding: 8px;
    }

    .report-header {
      border: 1.5px solid #e4e4e7;
      border-radius: 8px;
      padding: 18px 22px;
      background: #fafafa;
      margin-bottom: 22px;
    }

    .badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      background: #f4f4f5;
      color: #27272a;
      border: 1px solid #e4e4e7;
    }

    .badge-passed {
      background: #ecfdf5;
      color: #065f46;
      border-color: #a7f3d0;
    }

    .badge-failed {
      background: #fffbeb;
      color: #92400e;
      border-color: #fde68a;
    }

    .badge-dark {
      background: #09090b;
      color: #ffffff;
      border-color: #09090b;
    }

    h1 {
      font-size: 17pt;
      font-weight: 800;
      color: #09090b;
      margin: 6px 0 10px 0;
      letter-spacing: -0.02em;
      line-height: 1.25;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 14px;
    }

    .metric-card {
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      padding: 10px 12px;
    }

    .metric-label {
      font-size: 7.5pt;
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      color: #71717a;
      font-weight: 600;
    }

    .metric-val {
      font-size: 13pt;
      font-weight: 800;
      color: #09090b;
      margin-top: 2px;
    }

    .q-card {
      border: 1.5px solid #e4e4e7;
      border-radius: 6px;
      margin-bottom: 18px;
      page-break-inside: avoid;
      background: #ffffff;
      overflow: hidden;
    }

    .q-card-correct {
      border-left: 5px solid #10b981;
    }

    .q-card-incorrect {
      border-left: 5px solid #ef4444;
    }

    .q-header {
      padding: 12px 16px;
      background: #fbfbfb;
      border-bottom: 1px solid #f4f4f5;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .q-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #09090b;
    }

    .q-body {
      padding: 14px 16px;
    }

    pre.code-box {
      background: #09090b;
      color: #f4f4f5;
      padding: 10px 14px;
      border-radius: 5px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      line-height: 1.5;
      overflow-x: auto;
      margin: 10px 0;
    }

    .options-list {
      margin: 12px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .opt-item {
      font-size: 8.5pt;
      padding: 8px 10px;
      border-radius: 4px;
      border: 1px solid #e4e4e7;
      background: #fafafa;
    }

    .opt-correct {
      background: #ecfdf5;
      border-color: #10b981;
      font-weight: 600;
      color: #065f46;
    }

    .opt-user-wrong {
      background: #fef2f2;
      border-color: #ef4444;
      text-decoration: line-through;
      color: #991b1b;
    }

    .explanation-panel {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      margin-top: 12px;
      font-size: 9pt;
    }

    .exp-heading {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #047857;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .exp-traps {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
    }

    .exp-traps-heading {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #b45309;
      margin-bottom: 4px;
    }

    .exp-principle {
      margin-top: 8px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      padding: 8px 10px;
      font-size: 8.5pt;
      color: #1e40af;
    }

    .footer {
      text-align: center;
      font-size: 8pt;
      font-family: 'JetBrains Mono', monospace;
      color: #a1a1aa;
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid #e4e4e7;
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="badge-row">
      <span class="badge badge-dark">Day ${dayPlan.dayNumber} Assessment Report</span>
      <span class="badge ${dayResult.passed ? 'badge-passed' : 'badge-failed'}">
        ${dayResult.passed ? 'PASSED (≥70%) ✓' : 'NEEDS REVIEW (<70%) ✗'}
      </span>
      <span class="badge">Attempt #${dayResult.attemptNumber || 1}</span>
      <span class="badge">${escapeHtml(targetRole)}</span>
    </div>
    <h1>${escapeHtml(dayPlan.topic)}</h1>
    <p style="font-size: 9pt; color: #52525b; margin: 0;">
      Official comprehensive evaluation report, candidate score analytics, verified correct answers, and senior engineering technical explanations.
    </p>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Final Score</div>
        <div class="metric-val" style="color: ${dayResult.passed ? '#059669' : '#d97706'};">${dayResult.score}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Correct Answers</div>
        <div class="metric-val" style="color: #059669;">${correctCount} / ${totalCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Threshold Required</div>
        <div class="metric-val">70%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Completed On</div>
        <div class="metric-val" style="font-size: 9pt; margin-top: 6px;">${new Date(dayResult.completedAt || Date.now()).toLocaleDateString()}</div>
      </div>
    </div>
  </div>

  <h2 style="font-size: 12pt; font-weight: 800; color: #09090b; margin-bottom: 14px; text-transform: uppercase; font-family: 'JetBrains Mono', monospace;">
    📝 Question-by-Question Technical Explanations (${totalCount} Questions)
  </h2>

  ${reviewItems.map((item: DayResultQuestionReview, idx: number) => {
    const correctLetter = ["A", "B", "C", "D"][item.correctIndex];
    const userLetter = item.userAnswerIndex >= 0 ? ["A", "B", "C", "D"][item.userAnswerIndex] : null;

    return `
      <div class="q-card ${item.isCorrect ? 'q-card-correct' : 'q-card-incorrect'}">
        <div class="q-header">
          <div>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; font-weight: 700; color: #71717a;">
              QUESTION ${idx + 1}
            </span>
            <div class="q-title">${escapeHtml(item.question)}</div>
          </div>
          <span class="badge ${item.isCorrect ? 'badge-passed' : 'badge-failed'}">
            ${item.isCorrect ? 'CORRECT ✓' : 'INCORRECT ✗'}
          </span>
        </div>

        <div class="q-body">
          ${item.codeSnippet ? `
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; text-transform: uppercase; color: #71717a; margin-bottom: 4px;">
              ${item.language || 'Code Snippet'}:
            </div>
            <pre class="code-box"><code>${escapeHtml(item.codeSnippet)}</code></pre>
          ` : ""}

          <div class="options-list">
            ${item.options.map((opt: string, optIdx: number) => {
              const isSelected = item.userAnswerIndex === optIdx;
              const isCorrectOpt = item.correctIndex === optIdx;
              const optLetter = ["A", "B", "C", "D"][optIdx];
              let optClass = "opt-item";
              let label = "";

              if (isCorrectOpt) {
                optClass += " opt-correct";
                label = " (Verified Correct Answer ✓)";
              } else if (isSelected) {
                optClass += " opt-user-wrong";
                label = " (Your Selection ✗)";
              }

              return `
                <div class="${optClass}">
                  <strong>${optLetter}.</strong> ${escapeHtml(opt)}${label}
                </div>
              `;
            }).join("")}
          </div>

          <div class="explanation-panel">
            <div class="exp-heading">
              💡 Technical Explanation (Why Option ${correctLetter} is Correct):
            </div>
            <p style="margin: 0; line-height: 1.55; color: #1e293b;">
              ${escapeHtml(item.explanationBreakdown?.whyCorrect || (typeof item.explanation === "string" ? item.explanation : item.explanation?.whyCorrect || ""))}
            </p>

            ${item.explanationBreakdown?.whyIncorrect && item.explanationBreakdown.whyIncorrect.length > 0 ? `
              <div class="exp-traps">
                <div class="exp-traps-heading">⚠️ Why Other Options Are Incorrect / Common Traps:</div>
                <ul style="margin: 4px 0 0 0; padding-left: 18px; color: #475569; font-size: 8.5pt;">
                  ${item.explanationBreakdown.whyIncorrect.map((reason: string) => `
                    <li style="margin-bottom: 3px;">${escapeHtml(reason)}</li>
                  `).join("")}
                </ul>
              </div>
            ` : ""}

            ${item.explanationBreakdown?.keyPrinciple ? `
              <div class="exp-principle">
                <strong>🎯 Core Principle & Interview Rule of Thumb:</strong> ${escapeHtml(item.explanationBreakdown.keyPrinciple)}
              </div>
            ` : ""}
          </div>
        </div>
      </div>
    `;
  }).join("")}

  <div class="footer">
    AI Career OS Assessment Certification &bull; Comprehensive Performance Breakdown &bull; Generated ${new Date().toLocaleDateString()}
  </div>

  <script>
    window.onload = function() {
      document.title = "${fileName.replace(".pdf", "")}";
      window.print();
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

