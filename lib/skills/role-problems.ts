import { PracticeProblem, StructuredLearnLesson } from "@/types";

export type RoleCategory =
  | "frontend"
  | "backend"
  | "devops"
  | "aiml"
  | "data"
  | "qa"
  | "cybersecurity"
  | "software_engineer";

export function getRoleCategory(career: string): RoleCategory {
  const norm = (career || "").toLowerCase().trim();
  if (norm.includes("frontend") || norm.includes("ui") || norm.includes("react")) return "frontend";
  if (norm.includes("full stack") || norm.includes("fullstack")) return "backend";
  if (norm.includes("backend") || norm.includes("node") || norm.includes("api") || norm.includes("fastapi")) return "backend";
  if (norm.includes("devops") || norm.includes("cloud") || norm.includes("sre") || norm.includes("infrastructure")) return "devops";
  if (norm.includes("ai") || norm.includes("machine learning") || norm.includes("ml") || norm.includes("deep learning")) return "aiml";
  if (norm.includes("data analyst") || norm.includes("data science") || norm.includes("data scientist") || norm.includes("analytics")) return "data";
  if (norm.includes("qa") || norm.includes("test") || norm.includes("sdet") || norm.includes("quality")) return "qa";
  if (norm.includes("security") || norm.includes("cyber")) return "cybersecurity";
  return "software_engineer";
}

/**
 * Returns role-specific practice problems tailored to the candidate's career track.
 */
export function getRoleSpecificPracticeProblems(
  career: string,
  dayNumber: number,
  primarySkill: string
): PracticeProblem[] {
  const category = getRoleCategory(career);

  switch (category) {
    case "frontend":
      return [
        {
          id: `prob-${dayNumber}-1`,
          problemNumber: 1,
          title: `Debounce Input Dispatcher`,
          difficulty: "Easy",
          description: `Implement a search input event sanitizer \`debounceInput\`. Given an array of keystroke timestamps in milliseconds and a delay threshold \`delay\`, return an array of timestamps where the API query would actually execute (i.e. only when at least \`delay\` milliseconds elapsed before the next keystroke or after the last keystroke).`,
          examples: [
            {
              input: "[100, 200, 300, 800, 900], 300",
              output: "[600, 1200]",
              explanation: "Keystrokes at 100, 200, 300 are debounced until 300 + 300 = 600. Keystrokes at 800, 900 are debounced until 900 + 300 = 1200.",
            },
          ],
          constraints: ["1 <= timestamps.length <= 10^4", "1 <= delay <= 5000"],
          expectedTimeComplexity: "O(N)",
          expectedSpaceComplexity: "O(N)",
          interviewRelevance: "Essential frontend UI design pattern tested at Meta, Netflix, and Airbnb for search-as-you-type and performance optimization.",
          solutionHint: "Iterate through timestamps. If the next timestamp is further than delay, record current timestamp + delay.",
          starterCodes: {
            javascript: `function debounceInput(timestamps, delay) {\n  // Write your frontend solution here\n  \n}`,
            python: `def debounce_input(timestamps, delay):\n    # Write your frontend solution here\n    pass`,
            typescript: `function debounceInput(timestamps: number[], delay: number): number[] {\n  // Write your frontend solution here\n  return [];\n}`,
          },
          testCases: [
            { id: "tc-1-1", input: "[100, 200, 300, 800, 900], 300", expectedOutput: "[600, 1200]", isHidden: false },
            { id: "tc-1-2", input: "[1000], 250", expectedOutput: "[1250]", isHidden: false },
            { id: "tc-1-3", input: "[100, 500, 1000], 200", expectedOutput: "[300, 700, 1200]", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-2`,
          problemNumber: 2,
          title: `Virtual DOM Node Tag Flatten & ClassNames Builder`,
          difficulty: "Medium",
          description: `Given a nested UI component specification object or class mapping object, write a function \`buildClassNames\` that filters out falsy values (\`false\`, \`null\`, \`undefined\`, \`""\`) and returns a single concatenated space-separated string. Numbers and non-empty strings are preserved.`,
          examples: [
            {
              input: "['btn', 'btn-primary', null, false, 'active']",
              output: "'btn btn-primary active'",
              explanation: "Falsy values null and false are stripped out.",
            },
          ],
          constraints: ["0 <= items.length <= 10^3"],
          expectedTimeComplexity: "O(N)",
          expectedSpaceComplexity: "O(N)",
          interviewRelevance: "Industry standard utility (clsx / classnames) required for scalable React & Tailwind component styling.",
          solutionHint: "Filter array elements for Boolean truthiness, trim strings, and join with a single space.",
          starterCodes: {
            javascript: `function buildClassNames(classes) {\n  // Write your solution here\n  \n}`,
            python: `def build_class_names(classes):\n    # Write your solution here\n    pass`,
            typescript: `function buildClassNames(classes: (string | boolean | null | undefined)[]): string {\n  // Write your solution here\n  return "";\n}`,
          },
          testCases: [
            { id: "tc-2-1", input: "['btn', 'btn-primary', null, false, 'active']", expectedOutput: "'btn btn-primary active'", isHidden: false },
            { id: "tc-2-2", input: "[null, undefined, false]", expectedOutput: "''", isHidden: false },
            { id: "tc-2-3", input: "['card', '', 'shadow-lg']", expectedOutput: "'card shadow-lg'", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-3`,
          problemNumber: 3,
          title: `Deep Reactive State Differ & Patch Generator`,
          difficulty: "Hard",
          description: `Implement a shallow state diffing engine \`diffVirtualState(prev, next)\`. Given two state objects, return a new object containing only the keys whose values have changed or were newly added in \`next\`. If a key was removed in \`next\`, assign it the value \`null\`.`,
          examples: [
            {
              input: "{ theme: 'dark', count: 1 }, { theme: 'light', count: 1, auth: true }",
              output: "{ theme: 'light', auth: true }",
              explanation: "count was unchanged, theme was updated to 'light', and auth was added.",
            },
          ],
          constraints: ["Object depth is shallow", "Keys are alphanumeric"],
          expectedTimeComplexity: "O(K) where K is unique keys count",
          expectedSpaceComplexity: "O(K)",
          interviewRelevance: "Virtual DOM reconciliation core algorithm tested in Staff Frontend engineering rounds at Vercel and Google.",
          solutionHint: "Compare keys across both objects. Include keys in next that differ from prev, and include keys in prev missing in next as null.",
          starterCodes: {
            javascript: `function diffVirtualState(prev, next) {\n  // Write your reactive differ here\n  \n}`,
            python: `def diff_virtual_state(prev, next):\n    # Write your reactive differ here\n    pass`,
            typescript: `function diffVirtualState(prev: Record<string, any>, next: Record<string, any>): Record<string, any> {\n  // Write your reactive differ here\n  return {};\n}`,
          },
          testCases: [
            { id: "tc-3-1", input: "{ theme: 'dark', count: 1 }, { theme: 'light', count: 1, auth: true }", expectedOutput: "{ theme: 'light', auth: true }", isHidden: false },
            { id: "tc-3-2", input: "{ a: 10 }, { a: 10 }", expectedOutput: "{}", isHidden: false },
            { id: "tc-3-3", input: "{ old: 1 }, {}", expectedOutput: "{ old: null }", isHidden: true },
          ],
        },
      ];

    case "devops":
      return [
        {
          id: `prob-${dayNumber}-1`,
          problemNumber: 1,
          title: `Dockerfile Instruction Validator & Multi-Stage Parser`,
          difficulty: "Easy",
          description: `Implement \`validateDockerfileInstructions(instructions)\`. Given an array of Dockerfile lines (e.g. \`["FROM node:20", "WORKDIR /app", "RUN npm install"]\`), return \`true\` if the file starts with a valid \`FROM\` instruction and contains at least one \`CMD\` or \`ENTRYPOINT\` instruction. Otherwise return \`false\`. Ignore whitespace and comments (\`#\`).`,
          examples: [
            {
              input: "['FROM node:20', 'WORKDIR /app', 'RUN npm ci', 'CMD [\"npm\", \"start\"]']",
              output: "true",
              explanation: "Starts with FROM and concludes with CMD instruction.",
            },
          ],
          constraints: ["1 <= instructions.length <= 100"],
          expectedTimeComplexity: "O(N)",
          expectedSpaceComplexity: "O(1)",
          interviewRelevance: "DevOps linting check tested in cloud infrastructure and SRE interviews.",
          solutionHint: "Filter out empty lines and lines starting with '#'. Verify the first line begins with 'FROM' and check for 'CMD' or 'ENTRYPOINT'.",
          starterCodes: {
            javascript: `function validateDockerfileInstructions(instructions) {\n  // Write your DevOps validator here\n  \n}`,
            python: `def validate_dockerfile_instructions(instructions):\n    # Write your DevOps validator here\n    pass`,
            typescript: `function validateDockerfileInstructions(instructions: string[]): boolean {\n  // Write your DevOps validator here\n  return false;\n}`,
          },
          testCases: [
            { id: "tc-1-1", input: "['FROM node:20', 'CMD [\"npm\", \"start\"]']", expectedOutput: "true", isHidden: false },
            { id: "tc-1-2", input: "['RUN echo 1', 'FROM alpine']", expectedOutput: "false", isHidden: false },
            { id: "tc-1-3", input: "['FROM alpine', 'RUN apk add curl']", expectedOutput: "false", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-2`,
          problemNumber: 2,
          title: `Kubernetes Pod Resource Limits & Memory Allocator`,
          difficulty: "Medium",
          description: `Given a node memory capacity in megabytes (MB) and an array of container memory requests in string format (e.g. \`"512Mi"\`, \`"1Gi"\`, \`"256Mi"\`), write \`calculateMemoryUsage(nodeCapacityMb, containerRequests)\`. Return the remaining available memory in MB. If total requests exceed node capacity, return \`-1\` to indicate an unschedulable pod (OOM). 1Gi = 1024Mi.`,
          examples: [
            {
              input: "2048, ['512Mi', '1Gi', '256Mi']",
              output: "256",
              explanation: "Total requested = 512 + 1024 + 256 = 1792 MB. Remaining = 2048 - 1792 = 256 MB.",
            },
          ],
          constraints: ["1 <= nodeCapacityMb <= 10^6", "1 <= containerRequests.length <= 50"],
          expectedTimeComplexity: "O(N)",
          expectedSpaceComplexity: "O(1)",
          interviewRelevance: "Kubernetes scheduler resource boundary evaluation tested in AWS/GCP Cloud Architect rounds.",
          solutionHint: "Parse suffixes 'Gi' and 'Mi', convert everything to MB, sum the requests, and subtract from capacity.",
          starterCodes: {
            javascript: `function calculateMemoryUsage(nodeCapacityMb, containerRequests) {\n  // Write your K8s scheduler calculation here\n  \n}`,
            python: `def calculate_memory_usage(node_capacity_mb, container_requests):\n    # Write your K8s scheduler calculation here\n    pass`,
            typescript: `function calculateMemoryUsage(nodeCapacityMb: number, containerRequests: string[]): number {\n  // Write your K8s scheduler calculation here\n  return 0;\n}`,
          },
          testCases: [
            { id: "tc-2-1", input: "2048, ['512Mi', '1Gi', '256Mi']", expectedOutput: "256", isHidden: false },
            { id: "tc-2-2", input: "1024, ['1Gi', '512Mi']", expectedOutput: "-1", isHidden: false },
            { id: "tc-2-3", input: "4096, ['2Gi', '2Gi']", expectedOutput: "0", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-3`,
          problemNumber: 3,
          title: `CI/CD Pipeline Job Dependency Topological Sorter`,
          difficulty: "Hard",
          description: `Given a list of CI/CD build jobs and their direct dependencies as pairs \`[job, dependsOnJob]\`, write \`orderPipelineJobs(jobs, dependencies)\`. Return an array of jobs in valid execution order. If a circular dependency exists (e.g. A depends on B and B depends on A), return \`[]\` to halt the pipeline.`,
          examples: [
            {
              input: "['test', 'build', 'deploy'], [['deploy', 'build'], ['build', 'test']]",
              output: "['test', 'build', 'deploy']",
              explanation: "Test must finish before build, and build must finish before deploy.",
            },
          ],
          constraints: ["1 <= jobs.length <= 100", "0 <= dependencies.length <= 500"],
          expectedTimeComplexity: "O(V + E) using Kahn's algorithm",
          expectedSpaceComplexity: "O(V + E)",
          interviewRelevance: "DAG compilation core tested at GitHub, GitLab, and CircleCI for automated build engines.",
          solutionHint: "Build an adjacency list and in-degree map. Use a queue to process nodes with 0 in-degree.",
          starterCodes: {
            javascript: `function orderPipelineJobs(jobs, dependencies) {\n  // Write topological pipeline sorter here\n  \n}`,
            python: `def order_pipeline_jobs(jobs, dependencies):\n    # Write topological pipeline sorter here\n    pass`,
            typescript: `function orderPipelineJobs(jobs: string[], dependencies: [string, string][]): string[] {\n  // Write topological pipeline sorter here\n  return [];\n}`,
          },
          testCases: [
            { id: "tc-3-1", input: "['test', 'build', 'deploy'], [['deploy', 'build'], ['build', 'test']]", expectedOutput: "['test', 'build', 'deploy']", isHidden: false },
            { id: "tc-3-2", input: "['a', 'b'], [['a', 'b'], ['b', 'a']]", expectedOutput: "[]", isHidden: false },
            { id: "tc-3-3", input: "['compile'], []", expectedOutput: "['compile']", isHidden: true },
          ],
        },
      ];

    case "aiml":
    case "data":
      return [
        {
          id: `prob-${dayNumber}-1`,
          problemNumber: 1,
          title: `Vector Dot Product & Cosine Similarity Distance`,
          difficulty: "Easy",
          description: `Implement \`cosineSimilarity(vecA, vecB)\`. Given two 1D numerical vectors of equal length, return their cosine similarity rounded to 2 decimal places. If either vector has zero magnitude, return \`0.0\`.
Formula: \`dotProduct(A, B) / (norm(A) * norm(B))\`.`,
          examples: [
            {
              input: "[1, 2, 3], [1, 2, 3]",
              output: "1.0",
              explanation: "Identical vectors have maximum similarity of 1.0.",
            },
            {
              input: "[1, 0], [0, 1]",
              output: "0.0",
              explanation: "Orthogonal vectors have cosine similarity of 0.0.",
            },
          ],
          constraints: ["1 <= vecA.length == vecB.length <= 10^4", "-100 <= vec[i] <= 100"],
          expectedTimeComplexity: "O(N)",
          expectedSpaceComplexity: "O(1)",
          interviewRelevance: "Vector database retrieval and embedding ranking core calculation in LLM & RAG architectures.",
          solutionHint: "Calculate dot product, and the sum of squares for each vector. Compute sqrt of sums and divide.",
          starterCodes: {
            javascript: `function cosineSimilarity(vecA, vecB) {\n  // Write vector similarity calculation here\n  \n}`,
            python: `def cosine_similarity(vec_a, vec_b):\n    # Write vector similarity calculation here\n    pass`,
            typescript: `function cosineSimilarity(vecA: number[], vecB: number[]): number {\n  // Write vector similarity calculation here\n  return 0;\n}`,
          },
          testCases: [
            { id: "tc-1-1", input: "[1, 2, 3], [1, 2, 3]", expectedOutput: "1.0", isHidden: false },
            { id: "tc-1-2", input: "[1, 0], [0, 1]", expectedOutput: "0.0", isHidden: false },
            { id: "tc-1-3", input: "[3, 4], [4, 3]", expectedOutput: "0.96", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-2`,
          problemNumber: 2,
          title: `Precision, Recall & F1-Score Metrics Calculator`,
          difficulty: "Medium",
          description: `Given ground truth binary labels \`yTrue\` (array of 0s and 1s) and model predictions \`yPred\`, calculate the F1-Score rounded to 2 decimal places. If Precision + Recall == 0, return \`0.0\`.
Formula: \`F1 = 2 * (Precision * Recall) / (Precision + Recall)\`.`,
          examples: [
            {
              input: "[1, 1, 0, 1], [1, 0, 0, 1]",
              output: "0.8",
              explanation: "TP = 2, FP = 0, FN = 1. Precision = 2/(2+0) = 1.0. Recall = 2/(2+1) = 0.67. F1 = 2*(1.0*0.67)/(1.67) = 0.8.",
            },
          ],
          constraints: ["1 <= yTrue.length == yPred.length <= 10^5"],
          expectedTimeComplexity: "O(N)",
          expectedSpaceComplexity: "O(1)",
          interviewRelevance: "Essential machine learning model validation metric tested in data science & ML engineering interviews.",
          solutionHint: "Count True Positives (1,1), False Positives (0,1), and False Negatives (1,0). Calculate Precision and Recall, then F1.",
          starterCodes: {
            javascript: `function calculateF1Score(yTrue, yPred) {\n  // Write ML evaluation calculation here\n  \n}`,
            python: `def calculate_f1_score(y_true, y_pred):\n    # Write ML evaluation calculation here\n    pass`,
            typescript: `function calculateF1Score(yTrue: number[], yPred: number[]): number {\n  // Write ML evaluation calculation here\n  return 0;\n}`,
          },
          testCases: [
            { id: "tc-2-1", input: "[1, 1, 0, 1], [1, 0, 0, 1]", expectedOutput: "0.8", isHidden: false },
            { id: "tc-2-2", input: "[1, 1, 1], [0, 0, 0]", expectedOutput: "0.0", isHidden: false },
            { id: "tc-2-3", input: "[1, 0, 1, 0], [1, 0, 1, 0]", expectedOutput: "1.0", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-3`,
          problemNumber: 3,
          title: `Rolling Moving Average & Anomaly Spike Detector`,
          difficulty: "Hard",
          description: `Given a stream of numeric time-series values and a window size \`k\`, return an array of boolean flags \`isAnomaly\` where an element is flagged as an anomaly (\`true\`) if its value exceeds 2x the moving average of the previous \`k\` elements. For the first \`k\` elements (warm-up phase), return \`false\`.`,
          examples: [
            {
              input: "[10, 10, 10, 35, 12], 3",
              output: "[false, false, false, true, false]",
              explanation: "First 3 are warm-up. At index 3, moving avg of [10,10,10] is 10. Value 35 > 2*10 -> true. At index 4, moving avg of [10,10,35] is 18.33. Value 12 < 36.66 -> false.",
            },
          ],
          constraints: ["1 <= k <= values.length <= 10^5"],
          expectedTimeComplexity: "O(N) using sliding sum accumulator",
          expectedSpaceComplexity: "O(N)",
          interviewRelevance: "Real-time telemetry and anomaly detection engine tested at Datadog, Stripe, and Palantir.",
          solutionHint: "Maintain a rolling sum of the previous k elements to compute moving average in O(1) time per step.",
          starterCodes: {
            javascript: `function detectAnomalies(values, k) {\n  // Write time-series anomaly detector here\n  \n}`,
            python: `def detect_anomalies(values, k):\n    # Write time-series anomaly detector here\n    pass`,
            typescript: `function detectAnomalies(values: number[], k: number): boolean[] {\n  // Write time-series anomaly detector here\n  return [];\n}`,
          },
          testCases: [
            { id: "tc-3-1", input: "[10, 10, 10, 35, 12], 3", expectedOutput: "[false, false, false, true, false]", isHidden: false },
            { id: "tc-3-2", input: "[5, 5, 5, 5], 2", expectedOutput: "[false, false, false, false]", isHidden: false },
            { id: "tc-3-3", input: "[10, 20, 100], 2", expectedOutput: "[false, false, true]", isHidden: true },
          ],
        },
      ];

    case "qa":
      return [
        {
          id: `prob-${dayNumber}-1`,
          problemNumber: 1,
          title: `Boundary Value Form Input Partition Tester`,
          difficulty: "Easy",
          description: `In QA testing, boundary value analysis checks minimum, nominal, and maximum limits. Given an integer range \`[min, max]\`, write \`generateBoundaryTestValues(min, max)\` that returns the 5 canonical boundary points sorted in ascending order: \`[min - 1, min, min + 1, max - 1, max, max + 1]\` with duplicates removed.`,
          examples: [
            {
              input: "1, 10",
              output: "[0, 1, 2, 9, 10, 11]",
              explanation: "Standard boundary partition values.",
            },
          ],
          constraints: ["min < max", "-10^6 <= min, max <= 10^6"],
          expectedTimeComplexity: "O(1)",
          expectedSpaceComplexity: "O(1)",
          interviewRelevance: "Fundamental black-box test engineering standard used in QA and SDET certification rounds.",
          solutionHint: "Generate the array of points, filter out duplicates with a Set, and sort numerically.",
          starterCodes: {
            javascript: `function generateBoundaryTestValues(min, max) {\n  // Write your QA boundary test generator here\n  \n}`,
            python: `def generate_boundary_test_values(min, max):\n    # Write your QA boundary test generator here\n    pass`,
            typescript: `function generateBoundaryTestValues(min: number, max: number): number[] {\n  // Write your QA boundary test generator here\n  return [];\n}`,
          },
          testCases: [
            { id: "tc-1-1", input: "1, 10", expectedOutput: "[0, 1, 2, 9, 10, 11]", isHidden: false },
            { id: "tc-1-2", input: "5, 6", expectedOutput: "[4, 5, 6, 7]", isHidden: false },
            { id: "tc-1-3", input: "0, 1", expectedOutput: "[-1, 0, 1, 2]", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-2`,
          problemNumber: 2,
          title: `HTTP Response JSON Schema & Status Assertion`,
          difficulty: "Medium",
          description: `Write an API test assertion function \`assertApiResponse(response, expectedSchema)\`. Given an API response object \`{ status: number, body: Record<string, any> }\` and expected schema requirements \`{ expectedStatus: number, requiredKeys: string[] }\`, return \`true\` if the status matches AND all required keys exist and are non-null in the response body. Otherwise return \`false\`.`,
          examples: [
            {
              input: "{ status: 200, body: { id: '123', name: 'Manoj' } }, { expectedStatus: 200, requiredKeys: ['id', 'name'] }",
              output: "true",
              explanation: "Status matches 200 and all required keys are present and non-null.",
            },
          ],
          constraints: ["1 <= requiredKeys.length <= 50"],
          expectedTimeComplexity: "O(K)",
          expectedSpaceComplexity: "O(1)",
          interviewRelevance: "Automated API contract testing core assertion tested in Postman and Playwright automation rounds.",
          solutionHint: "Check response.status === expectedStatus, then verify every key in requiredKeys exists in response.body and is not null or undefined.",
          starterCodes: {
            javascript: `function assertApiResponse(response, expectedSchema) {\n  // Write your API assertion here\n  \n}`,
            python: `def assert_api_response(response, expected_schema):\n    # Write your API assertion here\n    pass`,
            typescript: `function assertApiResponse(response: any, expectedSchema: any): boolean {\n  // Write your API assertion here\n  return false;\n}`,
          },
          testCases: [
            { id: "tc-2-1", input: "{ status: 200, body: { id: '123', name: 'Manoj' } }, { expectedStatus: 200, requiredKeys: ['id', 'name'] }", expectedOutput: "true", isHidden: false },
            { id: "tc-2-2", input: "{ status: 404, body: {} }, { expectedStatus: 200, requiredKeys: [] }", expectedOutput: "false", isHidden: false },
            { id: "tc-2-3", input: "{ status: 200, body: { id: null } }, { expectedStatus: 200, requiredKeys: ['id'] }", expectedOutput: "false", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-3`,
          problemNumber: 3,
          title: `Retry Flaky Test with Exponential Backoff Simulator`,
          difficulty: "Hard",
          description: `Simulate a test runner retry engine \`simulateTestRetry(attemptOutcomes, maxRetries, baseDelayMs)\`. Given an array of booleans indicating pass (\`true\`) or fail (\`false\`) on consecutive attempts, return the total time spent in milliseconds before the test either passed or exceeded \`maxRetries\`. Exponential backoff formula for retry \`i\` (0-indexed): \`baseDelayMs * 2^i\`. Execution time per attempt is 100ms.`,
          examples: [
            {
              input: "[false, false, true], 3, 500",
              output: "1800",
              explanation: "Attempt 0: fails (100ms) + waits 500ms (500*2^0). Attempt 1: fails (100ms) + waits 1000ms (500*2^1). Attempt 2: passes (100ms). Total = 100+500+100+1000+100 = 1800ms.",
            },
          ],
          constraints: ["1 <= maxRetries <= 10", "100 <= baseDelayMs <= 5000"],
          expectedTimeComplexity: "O(R) where R is max retries",
          expectedSpaceComplexity: "O(1)",
          interviewRelevance: "Test runner resilience architecture tested in Senior SDET engineering rounds.",
          solutionHint: "Iterate through attempts. Add attempt duration (100ms). If attempt fails and more retries remain, add backoff delay.",
          starterCodes: {
            javascript: `function simulateTestRetry(attemptOutcomes, maxRetries, baseDelayMs) {\n  // Write test retry engine here\n  \n}`,
            python: `def simulate_test_retry(attempt_outcomes, max_retries, base_delay_ms):\n    # Write test retry engine here\n    pass`,
            typescript: `function simulateTestRetry(attemptOutcomes: boolean[], maxRetries: number, baseDelayMs: number): number {\n  // Write test retry engine here\n  return 0;\n}`,
          },
          testCases: [
            { id: "tc-3-1", input: "[false, false, true], 3, 500", expectedOutput: "1800", isHidden: false },
            { id: "tc-3-2", input: "[true], 3, 500", expectedOutput: "100", isHidden: false },
            { id: "tc-3-3", input: "[false, false], 1, 200", expectedOutput: "300", isHidden: true },
          ],
        },
      ];

    case "cybersecurity":
      return [
        {
          id: `prob-${dayNumber}-1`,
          problemNumber: 1,
          title: `SQL Injection & XSS Payload Filter`,
          difficulty: "Easy",
          description: `Write an input sanitizer \`detectMaliciousPayload(userInput)\`. Return \`true\` if the input string contains any known attack signatures: \`"<script>"\`, \`"DROP TABLE"\`, \`"OR 1=1"\`, or \`"--"\` (case-insensitive). Return \`false\` if the string is clean.`,
          examples: [
            {
              input: "'SELECT * FROM users WHERE id = 1 OR 1=1--'",
              output: "true",
              explanation: "Contains OR 1=1 and SQL comment delimiter.",
            },
            {
              input: "'Hello world'",
              output: "false",
              explanation: "Clean string.",
            },
          ],
          constraints: ["1 <= userInput.length <= 10^4"],
          expectedTimeComplexity: "O(N)",
          expectedSpaceComplexity: "O(1)",
          interviewRelevance: "Web application firewall (WAF) rule detection tested in AppSec & Cyber defense rounds.",
          solutionHint: "Convert input to uppercase and check for substring containment of target attack signatures.",
          starterCodes: {
            javascript: `function detectMaliciousPayload(userInput) {\n  // Write cyber sanitizer here\n  \n}`,
            python: `def detect_malicious_payload(user_input):\n    # Write cyber sanitizer here\n    pass`,
            typescript: `function detectMaliciousPayload(userInput: string): boolean {\n  // Write cyber sanitizer here\n  return false;\n}`,
          },
          testCases: [
            { id: "tc-1-1", input: "'SELECT * FROM users WHERE id = 1 OR 1=1--'", expectedOutput: "true", isHidden: false },
            { id: "tc-1-2", input: "'hello world'", expectedOutput: "false", isHidden: false },
            { id: "tc-1-3", input: "'<SCRIPT>alert(1)</script>'", expectedOutput: "true", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-2`,
          problemNumber: 2,
          title: `Password Entropy & Complexity Evaluator`,
          difficulty: "Medium",
          description: `Implement \`evaluatePasswordEntropy(password)\`. Return a security rating string: \`"WEAK"\` (length < 8 or charset < 2), \`"MEDIUM"\` (length >= 8 and at least 3 distinct character classes: lowercase, uppercase, digits, symbols), or \`"STRONG"\` (length >= 12 and all 4 character classes present).`,
          examples: [
            {
              input: "'P@ssw0rd2026!'",
              output: "'STRONG'",
              explanation: "Length >= 12 and contains lowercase, uppercase, digit, and special character.",
            },
          ],
          constraints: ["1 <= password.length <= 128"],
          expectedTimeComplexity: "O(N)",
          expectedSpaceComplexity: "O(1)",
          interviewRelevance: "NIST password guidelines and identity authentication defense.",
          solutionHint: "Inspect length and count matching character categories (lower, upper, digit, symbol).",
          starterCodes: {
            javascript: `function evaluatePasswordEntropy(password) {\n  // Write password strength evaluator here\n  \n}`,
            python: `def evaluate_password_entropy(password):\n    # Write password strength evaluator here\n    pass`,
            typescript: `function evaluatePasswordEntropy(password: string): string {\n  // Write password strength evaluator here\n  return "WEAK";\n}`,
          },
          testCases: [
            { id: "tc-2-1", input: "'P@ssw0rd2026!'", expectedOutput: "'STRONG'", isHidden: false },
            { id: "tc-2-2", input: "'secret'", expectedOutput: "'WEAK'", isHidden: false },
            { id: "tc-2-3", input: "'SecurePass123'", expectedOutput: "'MEDIUM'", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-3`,
          problemNumber: 3,
          title: `Token Bucket Rate Limiter with IP Blacklist`,
          difficulty: "Hard",
          description: `Implement an IP request filter \`filterRequests(requests, rateLimitPerMin, blacklist)\`. Given an array of incoming request IP strings, return an array of statuses: \`"BLOCKED"\` if IP is in blacklist, \`"ALLOWED"\` if requests from this IP in the current batch do not exceed \`rateLimitPerMin\`, or \`"RATE_LIMITED"\` if request quota is exhausted.`,
          examples: [
            {
              input: "['1.1.1.1', '1.1.1.1', '2.2.2.2'], 1, ['2.2.2.2']",
              output: "['ALLOWED', 'RATE_LIMITED', 'BLOCKED']",
              explanation: "First 1.1.1.1 is allowed, second exceeds limit of 1. 2.2.2.2 is blacklisted.",
            },
          ],
          constraints: ["1 <= requests.length <= 10^4", "1 <= rateLimitPerMin <= 1000"],
          expectedTimeComplexity: "O(N)",
          expectedSpaceComplexity: "O(N)",
          interviewRelevance: "DDoS mitigation and API gateway security tested at Cloudflare, CrowdStrike, and Akamai.",
          solutionHint: "Use a Set for blacklist lookup and a Map for tracking IP request counts.",
          starterCodes: {
            javascript: `function filterRequests(requests, rateLimitPerMin, blacklist) {\n  // Write firewall request filter here\n  \n}`,
            python: `def filter_requests(requests, rate_limit_per_min, blacklist):\n    # Write firewall request filter here\n    pass`,
            typescript: `function filterRequests(requests: string[], rateLimitPerMin: number, blacklist: string[]): string[] {\n  // Write firewall request filter here\n  return [];\n}`,
          },
          testCases: [
            { id: "tc-3-1", input: "['1.1.1.1', '1.1.1.1', '2.2.2.2'], 1, ['2.2.2.2']", expectedOutput: "['ALLOWED', 'RATE_LIMITED', 'BLOCKED']", isHidden: false },
            { id: "tc-3-2", input: "['5.5.5.5'], 5, []", expectedOutput: "['ALLOWED']", isHidden: false },
            { id: "tc-3-3", input: "['9.9.9.9'], 10, ['9.9.9.9']", expectedOutput: "['BLOCKED']", isHidden: true },
          ],
        },
      ];

    case "backend":
      return [
        {
          id: `prob-${dayNumber}-1`,
          problemNumber: 1,
          title: `URL Query Parameter Normalizer & Canonicalizer`,
          difficulty: "Easy",
          description: `Given a raw URL query string (e.g. \`"sort=desc&page=1&filter=active&sort=asc"\`), implement \`canonicalizeQueryString(queryString)\`. Return a clean, sorted query string where duplicate keys take the last seen value, empty keys are removed, and parameters are sorted alphabetically by key.`,
          examples: [
            {
              input: "'sort=desc&page=1&filter=active&sort=asc'",
              output: "'filter=active&page=1&sort=asc'",
              explanation: "sort was overwritten by 'asc', and keys are sorted alphabetically.",
            },
          ],
          constraints: ["0 <= queryString.length <= 1000"],
          expectedTimeComplexity: "O(K log K)",
          expectedSpaceComplexity: "O(K)",
          interviewRelevance: "Backend HTTP caching and URL signature verification tested in API engineering rounds.",
          solutionHint: "Split by '&', parse key-value pairs into a Map, sort keys, and join with '&'.",
          starterCodes: {
            javascript: `function canonicalizeQueryString(queryString) {\n  // Write query normalizer here\n  \n}`,
            python: `def canonicalize_query_string(query_string):\n    # Write query normalizer here\n    pass`,
            typescript: `function canonicalizeQueryString(queryString: string): string {\n  // Write query normalizer here\n  return "";\n}`,
          },
          testCases: [
            { id: "tc-1-1", input: "'sort=desc&page=1&filter=active&sort=asc'", expectedOutput: "'filter=active&page=1&sort=asc'", isHidden: false },
            { id: "tc-1-2", input: "'b=2&a=1'", expectedOutput: "'a=1&b=2'", isHidden: false },
            { id: "tc-1-3", input: "''", expectedOutput: "''", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-2`,
          problemNumber: 2,
          title: `In-Memory LRU Cache with Max Capacity Eviction`,
          difficulty: "Medium",
          description: `Implement a cache simulator \`simulateLruCache(operations, capacity)\`. Given operations array of \`["PUT", key, val]\` and \`["GET", key]\`, return an array of values returned by all \`GET\` operations (return \`-1\` if key is missing or was evicted). Evict the Least Recently Used item when capacity is exceeded.`,
          examples: [
            {
              input: "[['PUT', 1, 10], ['PUT', 2, 20], ['GET', 1], ['PUT', 3, 30], ['GET', 2]], 2",
              output: "[10, -1]",
              explanation: "GET 1 refreshes key 1. Adding 3 evicts key 2 (least recently used). GET 2 returns -1.",
            },
          ],
          constraints: ["1 <= capacity <= 1000", "1 <= operations.length <= 5000"],
          expectedTimeComplexity: "O(1) per operation using Map/DoublyLinkedList",
          expectedSpaceComplexity: "O(capacity)",
          interviewRelevance: "Classic backend system design data structure tested at Amazon, Microsoft, and Uber.",
          solutionHint: "Use a JavaScript Map (which preserves insertion order) or Hash Table + Doubly Linked List.",
          starterCodes: {
            javascript: `function simulateLruCache(operations, capacity) {\n  // Write LRU Cache simulator here\n  \n}`,
            python: `def simulate_lru_cache(operations, capacity):\n    # Write LRU Cache simulator here\n    pass`,
            typescript: `function simulateLruCache(operations: any[], capacity: number): number[] {\n  // Write LRU Cache simulator here\n  return [];\n}`,
          },
          testCases: [
            { id: "tc-2-1", input: "[['PUT', 1, 10], ['PUT', 2, 20], ['GET', 1], ['PUT', 3, 30], ['GET', 2]], 2", expectedOutput: "[10, -1]", isHidden: false },
            { id: "tc-2-2", input: "[['GET', 100]], 1", expectedOutput: "[-1]", isHidden: false },
            { id: "tc-2-3", input: "[['PUT', 1, 5], ['GET', 1]], 1", expectedOutput: "[5]", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-3`,
          problemNumber: 3,
          title: `Consistent Hash Ring Distributed Request Router`,
          difficulty: "Hard",
          description: `Given a list of backend node IDs and incoming user IDs, write \`routeConsistentHash(nodes, userIds)\`. Hash each node and user with the function: \`hash(str) = sum(charCodeAt(char)) % 360\`. Place nodes on a 0-359 degree ring. Assign each user to the first node encountered moving clockwise (>= userHash). If userHash exceeds all node hashes, wrap around to the first node on the ring. Return an array of assigned node IDs.`,
          examples: [
            {
              input: "['node-A', 'node-B'], ['usr-1', 'usr-2']",
              output: "['node-B', 'node-A']",
              explanation: "Users routed to closest node clockwise on consistent hash ring.",
            },
          ],
          constraints: ["1 <= nodes.length <= 100", "1 <= userIds.length <= 10^4"],
          expectedTimeComplexity: "O(U log N) where N is node count and U is user count",
          expectedSpaceComplexity: "O(N + U)",
          interviewRelevance: "Distributed systems load balancing tested at Discord, Netflix, and Amazon Dynamo.",
          solutionHint: "Sort nodes by their hash on the ring. For each user hash, use binary search to find the next node on the ring.",
          starterCodes: {
            javascript: `function routeConsistentHash(nodes, userIds) {\n  // Write consistent hash router here\n  \n}`,
            python: `def route_consistent_hash(nodes, user_ids):\n    # Write consistent hash router here\n    pass`,
            typescript: `function routeConsistentHash(nodes: string[], userIds: string[]): string[] {\n  // Write consistent hash router here\n  return [];\n}`,
          },
          testCases: [
            { id: "tc-3-1", input: "['node-A', 'node-B'], ['usr-1', 'usr-2']", expectedOutput: "['node-B', 'node-A']", isHidden: false },
            { id: "tc-3-2", input: "['server-1'], ['client-1']", expectedOutput: "['server-1']", isHidden: false },
            { id: "tc-3-3", input: "['alpha', 'beta', 'gamma'], ['req-A']", expectedOutput: "['alpha']", isHidden: true },
          ],
        },
      ];

    case "software_engineer":
    default:
      return [
        {
          id: `prob-${dayNumber}-1`,
          problemNumber: 1,
          title: `Valid Identifier & Boundary Guard`,
          difficulty: "Easy",
          description: `Implement a function \`validateAndProcess\` that takes an array of numeric tokens and a multiplier. Return a new array where each positive number is multiplied by the factor. If the array is empty or null, return an empty array \`[]\`. Zero and negative numbers should be filtered out.`,
          examples: [
            {
              input: "[1, -2, 3, 0, 4], 2",
              output: "[2, 6, 8]",
              explanation: "Negative and zero numbers are filtered out. Positives [1, 3, 4] * 2 = [2, 6, 8].",
            },
          ],
          constraints: ["0 <= nums.length <= 10^5", "1 <= multiplier <= 100"],
          expectedTimeComplexity: "O(N)",
          expectedSpaceComplexity: "O(N)",
          interviewRelevance: "Defensive input validation and collection streaming tested at FAANG.",
          solutionHint: "Filter for element > 0, then map over the remaining elements with the multiplier.",
          starterCodes: {
            javascript: `function validateAndProcess(nums, multiplier) {\n  // Write your code here\n  \n}`,
            python: `def validate_and_process(nums, multiplier):\n    # Write your code here\n    pass`,
            typescript: `function validateAndProcess(nums: number[], multiplier: number): number[] {\n  // Write your code here\n  return [];\n}`,
          },
          testCases: [
            { id: "tc-1-1", input: "[1, -2, 3, 0, 4], 2", expectedOutput: "[2, 6, 8]", isHidden: false },
            { id: "tc-1-2", input: "[], 5", expectedOutput: "[]", isHidden: false },
            { id: "tc-1-3", input: "[10, 20, 30], 1", expectedOutput: "[10, 20, 30]", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-2`,
          problemNumber: 2,
          title: `Optimal Pair Target Search`,
          difficulty: "Medium",
          description: `Given an array of integers \`nums\` and an integer \`target\`, find two distinct indices \`[i, j]\` such that \`nums[i] + nums[j] == target\`. Return indices sorted ascending.`,
          examples: [
            {
              input: "[2, 7, 11, 15], 9",
              output: "[0, 1]",
              explanation: "nums[0] + nums[1] == 2 + 7 == 9.",
            },
          ],
          constraints: ["2 <= nums.length <= 10^4", "-10^9 <= target <= 10^9"],
          expectedTimeComplexity: "O(N)",
          expectedSpaceComplexity: "O(N)",
          interviewRelevance: "Classic Two-Sum benchmark testing hash map lookup optimization.",
          solutionHint: "Use a map to store seen numbers and their indices.",
          starterCodes: {
            javascript: `function twoSum(nums, target) {\n  // Write your code here\n  \n}`,
            python: `def two_sum(nums, target):\n    # Write your code here\n    pass`,
            typescript: `function twoSum(nums: number[], target: number): number[] {\n  // Write your code here\n  return [];\n}`,
          },
          testCases: [
            { id: "tc-2-1", input: "[2, 7, 11, 15], 9", expectedOutput: "[0, 1]", isHidden: false },
            { id: "tc-2-2", input: "[3, 2, 4], 6", expectedOutput: "[1, 2]", isHidden: false },
            { id: "tc-2-3", input: "[3, 3], 6", expectedOutput: "[0, 1]", isHidden: true },
          ],
        },
        {
          id: `prob-${dayNumber}-3`,
          problemNumber: 3,
          title: `Sliding Window Maximum Invariant`,
          difficulty: "Hard",
          description: `Given an array of integers \`nums\` and a sliding window of size \`k\` moving from left to right, return the maximum element in each window.`,
          examples: [
            {
              input: "[1, 3, -1, -3, 5, 3, 6, 7], 3",
              output: "[3, 3, 5, 5, 6, 7]",
              explanation: "Sliding window maximums across consecutive subarrays.",
            },
          ],
          constraints: ["1 <= k <= nums.length <= 10^5"],
          expectedTimeComplexity: "O(N) using a monotonic deque",
          expectedSpaceComplexity: "O(K)",
          interviewRelevance: "Monotonic deque invariance tested at Meta and Microsoft.",
          solutionHint: "Maintain indices in a monotonic double-ended queue.",
          starterCodes: {
            javascript: `function maxSlidingWindow(nums, k) {\n  // Write your code here\n  \n}`,
            python: `def max_sliding_window(nums, k):\n    # Write your code here\n    pass`,
            typescript: `function maxSlidingWindow(nums: number[], k: number): number[] {\n  // Write your code here\n  return [];\n}`,
          },
          testCases: [
            { id: "tc-3-1", input: "[1, 3, -1, -3, 5, 3, 6, 7], 3", expectedOutput: "[3, 3, 5, 5, 6, 7]", isHidden: false },
            { id: "tc-3-2", input: "[1], 1", expectedOutput: "[1]", isHidden: false },
            { id: "tc-3-3", input: "[9, 11], 2", expectedOutput: "[11]", isHidden: true },
          ],
        },
      ];
  }
}

/**
 * Generates an in-depth 10-point pedagogical lesson tailored to the candidate's target role.
 */
export function getRoleSpecificLearnLesson(
  career: string,
  dayNumber: number,
  primarySkill: string
): StructuredLearnLesson {
  const category = getRoleCategory(career);

  switch (category) {
    case "frontend":
      return {
        concept: `${primarySkill}: UI Component Lifecycle & State Reconciliation`,
        whyItMatters: `In modern Frontend development, unoptimized renders and state mutations lead to memory leaks, sluggish frame rates, and race conditions in user interactions.`,
        syntax: `// React Custom Hook Pattern for ${primarySkill}
function useDebouncedSearch<T>(initialValue: T, delayMs: number): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [debounced, setDebounced] = useState<T>(initialValue);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return [debounced, setValue];
}`,
        exampleCode: `import React, { useState, useEffect, useTransition } from "react";

export function OptimizedSearchInput({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        onSearch(query.trim());
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [query, onSearch]);

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search resources..."
        className="px-3 py-2 border rounded"
      />
      {isPending && <span className="text-xs text-muted">Updating...</span>}
    </div>
  );
}`,
        language: "typescript",
        lineByLineExplanation: [
          { line: "const [isPending, startTransition] = useTransition();", explanation: "Initializes React concurrent mode transition hook to keep the input responsive." },
          { line: "return () => clearTimeout(handler);", explanation: "Teardown effect that aborts the pending timer if user keystrokes occur before 300ms." },
          { line: "startTransition(() => onSearch(query.trim()));", explanation: "Demotes search dispatch to non-blocking priority, preserving 60fps input typing." }
        ],
        whyThisSyntax: `Concurrent React primitives allow high-frequency UI interactions to execute immediately while expensive filtering executes asynchronously.`,
        commonMistakes: [
          "Forgetting the cleanup return in useEffect, causing memory leaks and out-of-order API dispatches.",
          "Mutating state objects directly rather than calling the state setter with an updated copy.",
          "Triggering state updates inside render phase rather than event handlers or effects."
        ],
        timeComplexity: "O(1) amortized state update dispatch",
        spaceComplexity: "O(1) timer handle reference",
        interviewConnection: {
          question: "How do React 19 transitions and debouncing work together to optimize high-volume search inputs?",
          answer: "Debouncing reduces network or computation volume by delaying execution until input ceases. React transitions mark the resulting state update as non-urgent, allowing user keystrokes to remain buttery smooth at 60fps without freezing the UI thread.",
          whyAsked: "Tests candidate understanding of the DOM event loop, React concurrent rendering, and real-world frontend performance."
        },
        quickCheck: {
          question: "What happens if a useEffect timer is not cleared in its cleanup function?",
          options: [
            "Previous callbacks fire after component unmounts or state updates, causing race conditions and memory leaks",
            "The browser crashes immediately with an unhandled SIGSEGV",
            "React automatically cancels unmounted timers without any developer action",
            "The network protocol downgrades from HTTP/2 to HTTP/1.1"
          ],
          correctIndex: 0,
          explanation: "Omitting timer teardown leads to dangling closures referencing old state and unmounted DOM nodes."
        }
      };

    case "backend":
      return {
        concept: `${primarySkill}: Idempotent API Architecture & Database Transactions`,
        whyItMatters: `Backend services in distributed environments must guarantee data consistency despite network partitions, retries, and concurrent access.`,
        syntax: `// Idempotent Transaction Pattern for ${primarySkill}
async function executeIdempotentTransaction<T>(
  idempotencyKey: string,
  work: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.idempotencyRecord.findUnique({ where: { key: idempotencyKey } });
    if (existing) return JSON.parse(existing.cachedResponse);
    const result = await work(tx);
    await tx.idempotencyRecord.create({ data: { key: idempotencyKey, cachedResponse: JSON.stringify(result) } });
    return result;
  });
}`,
        exampleCode: `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function processPaymentOrder(orderId: string, amountCents: number, idempotencyKey: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Guard against duplicate replay attacks / network retries
    const existingKey = await tx.idempotencyKey.findUnique({
      where: { key: idempotencyKey }
    });
    if (existingKey) {
      return { status: "ALREADY_PROCESSED", orderId: existingKey.orderId };
    }

    // 2. Perform ACID-compliant atomic deduction & status update
    const order = await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt: new Date() }
    });

    await tx.idempotencyKey.create({
      data: { key: idempotencyKey, orderId: order.id }
    });

    return { status: "SUCCESS", order };
  });
}`,
        language: "typescript",
        lineByLineExplanation: [
          { line: "prisma.$transaction(async (tx) => {", explanation: "Begins an isolated ACID transaction. If any statement fails, the entire transaction rolls back." },
          { line: "const existingKey = await tx.idempotencyKey.findUnique(...);", explanation: "Checks whether this specific client request was previously committed." },
          { line: "await tx.idempotencyKey.create(...);", explanation: "Locks the idempotency key within the same atomic transaction to prevent concurrent duplicate deductions." }
        ],
        whyThisSyntax: `Atomic transactions prevent double-spending and ensure database state stays consistent even when upstream networks drop connections.`,
        commonMistakes: [
          "Checking idempotency keys outside the database transaction, allowing race conditions between concurrent requests.",
          "Performing non-rollbackable external API calls inside database transactions, causing inconsistent external states.",
          "Failing to handle database lock timeouts and deadlocks with jittered retry policies."
        ],
        timeComplexity: "O(1) with indexed idempotency key lookup",
        spaceComplexity: "O(1) auxiliary per transaction",
        interviewConnection: {
          question: "How do you guarantee idempotency in payment processing systems under distributed network retries?",
          answer: "We pair an idempotency-key header supplied by the client with an ACID database constraint. Within an isolated transaction, we query the key; if present, we return the cached outcome. Otherwise, we execute the deduction and store the key atomically.",
          whyAsked: "Evaluates production backend resilience, distributed systems understanding, and database transaction fundamentals."
        },
        quickCheck: {
          question: "Why must the idempotency record creation occur inside the same transaction as the business operation?",
          options: [
            "To prevent a race condition where two concurrent requests with the same key both pass the check and execute duplicate writes",
            "Because SQL databases forbid creating tables outside transactions",
            "To automatically encrypt all user data with AES-256",
            "Because Node.js single-threaded event loop cannot run async functions otherwise"
          ],
          correctIndex: 0,
          explanation: "Atomicity guarantees that either both the business logic and the idempotency lock succeed, or both roll back together."
        }
      };

    case "devops":
      return {
        concept: `${primarySkill}: Infrastructure-as-Code & Zero-Downtime Deployment`,
        whyItMatters: `DevOps engineers build reliable CI/CD pipelines, container orchestration, and automated rollbacks to guarantee 99.99% system availability.`,
        syntax: `# Kubernetes RollingUpdate & Health Probe Spec for ${primarySkill}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: api
        image: api-service:v2.1
        readinessProbe:
          httpGet: { path: /healthz, port: 8080 }
          initialDelaySeconds: 5
          periodSeconds: 10`,
        exampleCode: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: core-career-api
  labels:
    app: career-os
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  selector:
    matchLabels:
      app: career-os
  template:
    metadata:
      labels:
        app: career-os
    spec:
      containers:
      - name: server
        image: registry.internal/career-os:v1.4.0
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /api/health/liveness
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /api/health/readiness
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5`,
        language: "yaml",
        lineByLineExplanation: [
          { line: "maxUnavailable: 0", explanation: "Ensures no active pods are terminated until new candidate pods have passed health probes." },
          { line: "maxSurge: 25%", explanation: "Spawns 25% extra pod capacity during rollouts to absorb incoming traffic without performance drop." },
          { line: "readinessProbe: ... initialDelaySeconds: 5", explanation: "Traffic is routed to new pods only after their readiness probe returns HTTP 200." }
        ],
        whyThisSyntax: `Declarative Kubernetes manifests allow deterministic rollouts, automated zero-downtime upgrades, and instantaneous rollbacks on failure.`,
        commonMistakes: [
          "Setting maxUnavailable to 100%, causing a total outage during deployments.",
          "Conflating liveness and readiness probes (liveness restarts a stuck pod; readiness controls traffic ingress).",
          "Hardcoding container secrets into Git repository manifests instead of using Vault or sealed secrets."
        ],
        timeComplexity: "O(K) rolling pod replacement where K is replica count",
        spaceComplexity: "O(1) declarative spec footprint",
        interviewConnection: {
          question: "What is the operational distinction between Kubernetes livenessProbe and readinessProbe?",
          answer: "A liveness probe determines if the process is healthy or deadlocked; if it fails, kubelet kills and restarts the container. A readiness probe determines if the application is ready to accept user network traffic; if it fails, the pod is removed from service endpoints without being restarted.",
          whyAsked: "Crucial DevOps competency question testing container lifecycle and high-availability operations."
        },
        quickCheck: {
          question: "What happens if a pod's readiness probe returns HTTP 503 while its liveness probe returns HTTP 200?",
          options: [
            "Traffic stops routing to the pod, but the container continues running without being killed or restarted",
            "The container is immediately killed and restarted by kubelet",
            "The entire Kubernetes cluster initiates an emergency reboot",
            "The deployment controller deletes the deployment spec"
          ],
          correctIndex: 0,
          explanation: "Readiness probes isolate traffic without destroying running container state, allowing caches to warm or transient backpressure to clear."
        }
      };

    case "data":
    case "aiml":
      return {
        concept: `${primarySkill}: Feature Engineering & Vectorized Pipeline Transformations`,
        whyItMatters: `In data analytics and ML engineering, unvectorized Python loops run 50x-100x slower. Vectorization and structured feature pipelines are mandatory for scaling.`,
        syntax: `# Vectorized Feature Normalization & Imputation for ${primarySkill}
import numpy as np
import pandas as pd

def normalize_features(df: pd.DataFrame, feature_cols: list[str]) -> pd.DataFrame:
    df_clean = df.copy()
    for col in feature_cols:
        col_mean = df_clean[col].mean()
        col_std = df_clean[col].std() or 1.0
        df_clean[f"{col}_zscore"] = (df_clean[col] - col_mean) / col_std
    return df_clean`,
        exampleCode: `import pandas as pd
import numpy as np

def build_feature_pipeline(raw_df: pd.DataFrame) -> pd.DataFrame:
    """Prepares raw engagement metrics for downstream prediction models."""
    df = raw_df.copy()
    
    # 1. Fill missing values with column medians
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    
    # 2. Vectorized log transformation for skewed distributions
    if "session_duration_seconds" in df.columns:
        df["log_session_duration"] = np.log1p(df["session_duration_seconds"])
        
    # 3. Categorical encoding
    if "role_tier" in df.columns:
        df = pd.get_dummies(df, columns=["role_tier"], drop_first=True)
        
    return df`,
        language: "python",
        lineByLineExplanation: [
          { line: "df = raw_df.copy()", explanation: "Avoids modifying the caller's DataFrame in place, preventing side-effect corruption." },
          { line: "df[numeric_cols].fillna(df[numeric_cols].median())", explanation: "Vectorized imputation across all numeric columns without iterative row loops." },
          { line: "np.log1p(df['session_duration_seconds'])", explanation: "Log(1 + x) transformation compresses power-law outliers in telemetry data into normal distribution." }
        ],
        whyThisSyntax: `Vectorized NumPy and Pandas routines compile down to C SIMD instructions, processing millions of rows per second.`,
        commonMistakes: [
          "Using df.iterrows() or Python for-loops to transform row values instead of vectorized Pandas methods.",
          "Data leakage: computing normalization parameters (mean/std) on the test split rather than the training set.",
          "Failing to handle division by zero when standard deviations are zero."
        ],
        timeComplexity: "O(N * M) vectorized across N rows and M features",
        spaceComplexity: "O(N * M) memory copy for transformed DataFrame",
        interviewConnection: {
          question: "Why is data leakage dangerous in feature engineering pipelines, and how do you prevent it?",
          answer: "Data leakage happens when information from outside the training dataset (such as target distributions or future timestamps) leaks into model training. It produces artificially high validation scores that fail dramatically in live production. It is prevented by computing transformations strictly on training splits and storing parameters in pipeline objects.",
          whyAsked: "Tests core ML engineering rigour, statistical hygiene, and production readiness."
        },
        quickCheck: {
          question: "Why is np.log1p(x) preferred over np.log(x) for positive telemetry data?",
          options: [
            "It computes log(1 + x), preventing -infinity when x is 0",
            "It automatically converts floats to 64-bit strings",
            "It executes directly on GPU tensor cores without CPU memory transfer",
            "It performs automatic one-hot encoding on string labels"
          ],
          correctIndex: 0,
          explanation: "np.log(0) evaluates to -inf, causing crashes or NaN gradients; log1p smoothly handles 0 inputs."
        }
      };

    case "qa":
      return {
        concept: `${primarySkill}: Automated End-to-End Testing & Mock Fixtures`,
        whyItMatters: `High-confidence software delivery requires fast, deterministic automated test suites that catch regressions before customers do.`,
        syntax: `// Deterministic Mock Testing Pattern for ${primarySkill}
import { describe, it, expect, vi } from "vitest";

describe("CareerService", () => {
  it("should process valid user mission submission", async () => {
    const mockDb = { update: vi.fn().mockResolvedValue({ id: 1, score: 95 }) };
    const service = new CareerService(mockDb as any);
    const result = await service.submitScore("user_1", 95);
    expect(mockDb.update).toHaveBeenCalledWith(expect.objectContaining({ score: 95 }));
    expect(result.score).toBe(95);
  });
});`,
        exampleCode: `import { describe, it, expect, beforeEach, vi } from "vitest";
import { UserOnboardingController } from "@/controllers/onboarding";

describe("UserOnboardingController Test Suite", () => {
  let mockPrisma: any;
  let controller: UserOnboardingController;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      analyticsEvent: {
        create: vi.fn().mockResolvedValue({ id: "evt_123" }),
      },
    };
    controller = new UserOnboardingController(mockPrisma);
  });

  it("should complete onboarding and record analytics event atomically", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "usr_1", email: "test@example.com" });
    mockPrisma.user.update.mockResolvedValue({ id: "usr_1", onboardingCompleted: true });

    const response = await controller.completeStep("usr_1", { step: 3 });

    expect(response.success).toBe(true);
    expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventName: "onboarding_completed" }),
      })
    );
  });
});`,
        language: "typescript",
        lineByLineExplanation: [
          { line: "beforeEach(() => { ... });", explanation: "Resets all test doubles before every test case to prevent state contamination between tests." },
          { line: "mockPrisma.user.findUnique.mockResolvedValue(...);", explanation: "Simulates database response without opening external network or disk connections." },
          { line: "expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith(...);", explanation: "Asserts that the analytics contract was satisfied with correct payload data." }
        ],
        whyThisSyntax: `Mock-driven unit tests execute in milliseconds, isolating code-under-test from external infrastructure flakiness.`,
        commonMistakes: [
          "Letting state leak across tests by failing to clear mocks in beforeEach.",
          "Testing implementation details (private methods) rather than public component contracts.",
          "Writing slow tests that rely on active internet connections or live third-party APIs."
        ],
        timeComplexity: "O(1) execution time with zero network I/O",
        spaceComplexity: "O(1) in-memory mock registry",
        interviewConnection: {
          question: "How do you eliminate flakiness in automated end-to-end and integration test suites?",
          answer: "Flakiness is eliminated by: (1) isolating test databases with transaction rollbacks, (2) using explicit element polling/waiting instead of hardcoded sleeps, (3) mocking non-deterministic external dependencies like third-party payment gateways, and (4) ensuring test cases run independently in parallel.",
          whyAsked: "Evaluates the candidate's understanding of test pyramid principles, CI/CD reliability, and production quality standards."
        },
        quickCheck: {
          question: "Why should you never use arbitrary sleep(3000) delays in automated UI or API tests?",
          options: [
            "It slows test execution and still flakes when networks or CI runners take slightly longer than the hardcoded duration",
            "JavaScript engines disallow setTimeout in test runner environments",
            "It violates ACID database transaction consistency rules",
            "It forces all test assertions to run synchronously"
          ],
          correctIndex: 0,
          explanation: "Hardcoded sleeps create slow, unreliable test suites. Use conditional polling or event-based assertions instead."
        }
      };

    case "cybersecurity":
      return {
        concept: `${primarySkill}: Constant-Time Cryptographic Verification & Auth Tokens`,
        whyItMatters: `Security vulnerabilities like timing attacks, JWT forgery, and parameter tampering compromise entire corporate data infrastructures.`,
        syntax: `// Constant-Time Hash Comparison for ${primarySkill}
import crypto from "crypto";

export function verifySecretTimingSafe(userSupplied: string, trueSecret: string): boolean {
  const userBuf = Buffer.from(userSupplied);
  const trueBuf = Buffer.from(trueSecret);
  if (userBuf.length !== trueBuf.length) return false;
  return crypto.timingSafeEqual(userBuf, trueBuf);
}`,
        exampleCode: `import crypto from "crypto";
import jwt from "jsonwebtoken";

export class SecurityGuard {
  private readonly jwtSecret: string;

  constructor(secret: string) {
    if (!secret || secret.length < 32) {
      throw new Error("SECURITY FAULT: JWT Secret must be at least 256 bits (32 bytes)");
    }
    this.jwtSecret = secret;
  }

  public verifyToken(authHeader?: string): { userId: string } | null {
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ["HS256"],
        maxAge: "2h",
      }) as { userId: string };
      return decoded;
    } catch {
      return null;
    }
  }

  public static safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
}`,
        language: "typescript",
        lineByLineExplanation: [
          { line: "if (!secret || secret.length < 32)", explanation: "Enforces cryptographically strong 256-bit minimum key entropy at initialization time." },
          { line: "algorithms: ['HS256']", explanation: "Restricts allowed signature algorithms, preventing 'alg: none' token substitution vulnerabilities." },
          { line: "crypto.timingSafeEqual(bufA, bufB)", explanation: "Executes comparison in constant time, preventing side-channel timing attacks that leak secret bytes." }
        ],
        whyThisSyntax: `Constant-time operations prevent attackers from measuring CPU execution differences to deduce cryptographic hashes byte-by-byte.`,
        commonMistakes: [
          "Using standard string comparison (===) for password hashes or API tokens, enabling timing attacks.",
          "Allowing arbitrary JWT algorithm headers without explicitly whitelisting allowed verification algorithms.",
          "Storing secrets in plain text or committing .env files to Git version control."
        ],
        timeComplexity: "O(N) constant-time byte iteration where N is buffer byte length",
        spaceComplexity: "O(N) memory buffer allocation",
        interviewConnection: {
          question: "What is a timing attack, and how does crypto.timingSafeEqual prevent it?",
          answer: "In standard string comparison (===), execution terminates at the first non-matching byte. An attacker measuring response times over thousands of network requests can determine how many leading bytes match, incrementally guessing the entire token. crypto.timingSafeEqual always compares all bytes regardless of mismatches, ensuring uniform execution duration.",
          whyAsked: "Crucial cybersecurity topic testing defensive engineering and cryptographic awareness."
        },
        quickCheck: {
          question: "Why is specifying the 'algorithms' array mandatory when verifying JSON Web Tokens?",
          options: [
            "To prevent algorithm confusion attacks where an attacker signs a token with a public key using HMAC or uses 'none'",
            "Because TypeScript will not compile without the algorithms option",
            "To speed up JWT decryption by 10x",
            "Because browsers do not support JWT tokens without explicit algorithms"
          ],
          correctIndex: 0,
          explanation: "Without strict algorithm whitelisting, malicious tokens with header 'alg: none' or mismatched asymmetric keys may be accepted."
        }
      };

    default: // software_engineer
      return {
        concept: `${primarySkill}: Deterministic State Architecture & Scalable Clean Code`,
        whyItMatters: `High-scale software engineering requires loose coupling, deterministic state transitions, and defensive programming to prevent regressions across teams.`,
        syntax: `// Immutable State Contract for ${primarySkill}
export interface StateSnapshot<T> {
  readonly id: string;
  readonly version: number;
  readonly payload: Readonly<T>;
  readonly timestamp: number;
}

export function advanceState<T>(current: StateSnapshot<T>, patch: Partial<T>): StateSnapshot<T> {
  return Object.freeze({
    ...current,
    version: current.version + 1,
    payload: Object.freeze({ ...current.payload, ...patch }),
    timestamp: Date.now(),
  });
}`,
        exampleCode: `export class ResilientTaskManager<T extends { id: string }> {
  private items = new Map<string, Readonly<T>>();

  public upsert(item: T): void {
    if (!item?.id) throw new Error("Item must include a non-empty string ID");
    this.items.set(item.id, Object.freeze({ ...item }));
  }

  public get(id: string): Readonly<T> | undefined {
    return this.items.get(id);
  }

  public getAll(): ReadonlyArray<Readonly<T>> {
    return Array.from(this.items.values());
  }
}

// Verification usage
const manager = new ResilientTaskManager<{ id: string; title: string }>();
manager.upsert({ id: "t1", title: "Complete Mission" });
console.log(manager.get("t1")?.title); // "Complete Mission"`,
        language: "typescript",
        lineByLineExplanation: [
          { line: "private items = new Map<string, Readonly<T>>();", explanation: "Encapsulates internal state within a Map for O(1) constant-time lookups." },
          { line: "this.items.set(item.id, Object.freeze({ ...item }));", explanation: "Defensive shallow freeze prevents downstream mutations from corrupting internal collection state." },
          { line: "public getAll(): ReadonlyArray<Readonly<T>>", explanation: "Returns a readonly array projection to enforce consumers cannot splice or push into the list." }
        ],
        whyThisSyntax: `Clean architecture guarantees that entities remain self-validating and protected from external side-effects.`,
        commonMistakes: [
          "Exposing internal mutable collections directly to consumers, allowing external code to bypass business rules.",
          "Swallowing caught exceptions with empty catch blocks, masking silent data corruption.",
          "Premature optimization over clear, readable, and well-tested architectural boundaries."
        ],
        timeComplexity: "O(1) average lookup and insertion",
        spaceComplexity: "O(N) for stored entities",
        interviewConnection: {
          question: "Why should internal class collections be returned as immutable snapshots or readonly copies in enterprise systems?",
          answer: "Returning direct references to mutable internal collections breaks encapsulation. External callers can mutate, clear, or corrupt the data structure without the owning class validating the change. Returning frozen snapshots or readonly interfaces preserves class invariants.",
          whyAsked: "Standard system design and object-oriented architectural question asked across FAANG/MNC interviews."
        },
        quickCheck: {
          question: "What is the primary benefit of encapsulating collection state behind explicit methods?",
          options: [
            "It guarantees that all state transitions pass through domain validation rules and prevents direct external corruption",
            "It compiles the code directly to assembly language",
            "It eliminates the need for database indexing",
            "It allows the frontend to run without JavaScript"
          ],
          correctIndex: 0,
          explanation: "Encapsulation ensures business invariants are enforced on every write, preventing unauthorized mutations."
        }
      };
  }
}

