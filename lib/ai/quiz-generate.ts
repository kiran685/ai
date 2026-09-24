import { QuizQuestion } from "@/types";
import { generateGeminiJson } from "./gemini";

function createFallbackQuizQuestions(career: string): QuizQuestion[] {
  const banks: Record<string, QuizQuestion[]> = {
    "Software Engineer": [
      {
        id: "q1",
        skill: "DSA",
        topic: "Searching",
        difficulty: "EASY",
        question: "What is the worst-case time complexity of Binary Search on a sorted array of size N?",
        options: ["O(log N)", "O(N)", "O(1)", "O(N log N)"],
        correctIndex: 0,
      },
      {
        id: "q2",
        skill: "DSA",
        topic: "Arrays",
        difficulty: "MEDIUM",
        question: "When applying the Two-Pointer technique on a sorted array to find a target sum, which step is correct?",
        options: [
          "If current sum < target, move the left pointer right to increase the sum",
          "Always move both pointers inward simultaneously",
          "If current sum > target, move the left pointer right to decrease the sum",
          "Sort the array again on every pointer step",
        ],
        correctIndex: 0,
      },
      {
        id: "q3",
        skill: "Programming",
        topic: "Scope & Closures",
        difficulty: "MEDIUM",
        question: "What defines a closure in modern programming languages?",
        options: [
          "A function bundled together with references to its lexical environment",
          "A method that immediately terminates execution and closes socket connections",
          "A compiler directive that forces synchronous garbage collection",
          "An object method that cannot return any values",
        ],
        correctIndex: 0,
      },
      {
        id: "q4",
        skill: "DBMS",
        topic: "ACID Transactions",
        difficulty: "MEDIUM",
        question: "Which ACID property guarantees that database changes survive system crashes once committed?",
        options: ["Durability", "Atomicity", "Consistency", "Isolation"],
        correctIndex: 0,
      },
      {
        id: "q5",
        skill: "SQL",
        topic: "Aggregations & GROUP BY",
        difficulty: "EASY",
        question: "Which SQL clause must be used to filter groups *after* applying a GROUP BY aggregation?",
        options: ["HAVING", "WHERE", "ORDER BY", "DISTINCT"],
        correctIndex: 0,
      },
      {
        id: "q6",
        skill: "Operating Systems",
        topic: "Synchronization & Deadlocks",
        difficulty: "MEDIUM",
        question: "Which condition is NOT one of Coffman's four necessary conditions for deadlock?",
        options: [
          "Preemptive resource allocation",
          "Mutual exclusion",
          "Hold and wait",
          "Circular wait",
        ],
        correctIndex: 0,
      },
      {
        id: "q7",
        skill: "Computer Networks",
        topic: "HTTP & HTTPS",
        difficulty: "EASY",
        question: "What is the primary protocol improvement introduced in HTTP/2 over HTTP/1.1?",
        options: [
          "Binary framing and request multiplexing over a single TCP connection",
          "Elimination of TLS/SSL encryption certificates",
          "Replacing TCP sockets with UDP for all connections without handshake",
          "Mandatory plain-text human-readable header streams",
        ],
        correctIndex: 0,
      },
      {
        id: "q8",
        skill: "System Design",
        topic: "Scalability & Caching",
        difficulty: "HARD",
        question: "In a distributed cache using Redis, what is the 'Thundering Herd' (Cache Stampede) problem?",
        options: [
          "Simultaneous cache miss for a hot key causing hundreds of concurrent queries to overwhelm the primary database",
          "Running out of memory on the Redis server when storing large strings",
          "Data loss when replicating from master to read-replicas",
          "Slow network round-trip latency between client and CDN",
        ],
        correctIndex: 0,
      },
      {
        id: "q9",
        skill: "Git",
        topic: "Branching & Merging",
        difficulty: "EASY",
        question: "What is the primary difference between 'git merge' and 'git rebase'?",
        options: [
          "Rebase rewrites commit history onto a new base, whereas merge preserves original commit topology",
          "Merge deletes the branch, while rebase duplicates the repository",
          "Rebase can only be used on the remote origin server",
          "Merge is only for single files, while rebase is for folders",
        ],
        correctIndex: 0,
      },
      {
        id: "q10",
        skill: "Testing",
        topic: "Unit Testing & Mocking",
        difficulty: "MEDIUM",
        question: "Why should unit tests isolate external network and database dependencies using test doubles/mocks?",
        options: [
          "To ensure tests are deterministic, fast, and test only the unit under evaluation without external failure variables",
          "Because external networks do not support unit testing frameworks",
          "To prevent the compiler from generating bytecode",
          "To automatically generate end-to-end integration reports",
        ],
        correctIndex: 0,
      },
    ],
  };

  return (
    banks[career] || [
      {
        id: "q1",
        skill: "DSA",
        topic: "Searching",
        difficulty: "EASY",
        question: "What is the time complexity of searching a balanced binary search tree with N elements?",
        options: ["O(log N)", "O(N)", "O(1)", "O(N^2)"],
        correctIndex: 0,
      },
      {
        id: "q2",
        skill: "Programming",
        topic: "Memory Management",
        difficulty: "MEDIUM",
        question: "How does generational garbage collection optimize object reclamation?",
        options: [
          "By focusing collection frequency on newly allocated objects, which typically have short lifespans",
          "By never freeing objects allocated in the heap",
          "By deleting all variables after each function returns",
          "By compiling JavaScript directly to hardware registers",
        ],
        correctIndex: 0,
      },
      {
        id: "q3",
        skill: "DBMS",
        topic: "Indexing",
        difficulty: "MEDIUM",
        question: "Why are B+ Trees predominantly used as database index storage structures over standard Binary Search Trees?",
        options: [
          "High fanout reduces disk I/O depth and leaf sequential pointers facilitate range scans",
          "B+ Trees use zero disk space",
          "Binary Search Trees cannot store numbers",
          "B+ Trees eliminate the need for primary keys",
        ],
        correctIndex: 0,
      },
      {
        id: "q4",
        skill: "System Design",
        topic: "Load Balancing",
        difficulty: "HARD",
        question: "Which load-balancing algorithm is most effective when servers have heterogeneous hardware capacities?",
        options: [
          "Weighted Least Connections or Weighted Round Robin",
          "Random selection",
          "Round Robin without weights",
          "FIFO queueing",
        ],
        correctIndex: 0,
      },
      {
        id: "q5",
        skill: "Operating Systems",
        topic: "Processes & Threads",
        difficulty: "MEDIUM",
        question: "What resource is shared among threads belonging to the same process?",
        options: [
          "Address space, global variables, and open file descriptors",
          "Stack pointer and CPU register states",
          "Thread ID and program counter",
          "None; threads have completely isolated memory spaces",
        ],
        correctIndex: 0,
      },
      {
        id: "q6",
        skill: "SQL",
        topic: "Joins",
        difficulty: "EASY",
        question: "Which JOIN returns all rows from the left table regardless of whether there is a match in the right table?",
        options: ["LEFT JOIN", "INNER JOIN", "CROSS JOIN", "RIGHT JOIN"],
        correctIndex: 0,
      },
      {
        id: "q7",
        skill: "Computer Networks",
        topic: "DNS",
        difficulty: "EASY",
        question: "What is the primary role of the Domain Name System (DNS)?",
        options: [
          "Translating human-readable hostnames into IP addresses",
          "Encrypting credit card transactions",
          "Compressing video streams across the internet",
          "Allocating memory to browser tabs",
        ],
        correctIndex: 0,
      },
      {
        id: "q8",
        skill: "OOP",
        topic: "SOLID Principles",
        difficulty: "MEDIUM",
        question: "What does the Single Responsibility Principle (SRP) dictate?",
        options: [
          "A class or module should have only one reason to change",
          "A program should contain only a single class",
          "Every function must accept only one argument",
          "Classes cannot inherit from more than one interface",
        ],
        correctIndex: 0,
      },
      {
        id: "q9",
        skill: "Git",
        topic: "Conflict Resolution",
        difficulty: "EASY",
        question: "When does a Git merge conflict occur?",
        options: [
          "When two branches modify the same line of code in conflicting ways",
          "When pushing to an empty remote repository",
          "When deleting a local branch that was already merged",
          "When committing with an empty commit message",
        ],
        correctIndex: 0,
      },
      {
        id: "q10",
        skill: "Testing",
        topic: "TDD",
        difficulty: "MEDIUM",
        question: "What is the correct Red-Green-Refactor sequence in Test-Driven Development?",
        options: [
          "Write a failing test, write minimal code to pass it, then refactor cleanly",
          "Write all code, write all tests, then delete failing tests",
          "Refactor existing code, write green code, then run tests once",
          "Deploy to production, observe errors, then write automated tests",
        ],
        correctIndex: 0,
      },
    ]
  );
}

export async function generateQuizQuestions(
  career: string,
  resumeText?: string
): Promise<QuizQuestion[]> {
  const fallback = createFallbackQuizQuestions(career);

  const prompt = `
You are an expert technical interviewer creating a diagnostic skill assessment for: "${career}".
${resumeText ? `Candidate resume context:\n${resumeText.substring(0, 2000)}\n` : ""}

REQUIREMENTS:
1. Generate exactly 10 high-quality technical multiple-choice questions for "${career}".
2. Every question MUST include explicit metadata:
   - "skill": The core technical competency (e.g. "DSA", "Programming", "OOP", "DBMS", "SQL", "Operating Systems", "Computer Networks", "System Design", "Git", "Testing").
   - "topic": The pinpoint subtopic (e.g. "Arrays", "Searching", "Scope & Closures", "ACID Transactions", "Scalability", "Joins").
   - "difficulty": "EASY" | "MEDIUM" | "HARD".
3. Return clean JSON matching:
{
  "questions": [
    {
      "id": "q1",
      "skill": "DSA",
      "topic": "Searching",
      "difficulty": "EASY",
      "question": "What is the time complexity of binary search on a sorted array?",
      "options": ["O(log N)", "O(N)", "O(1)", "O(N log N)"],
      "correctIndex": 0
    }
  ]
}
`;

  const result = await generateGeminiJson<{ questions: QuizQuestion[] }>(
    prompt,
    { questions: fallback },
    { temperature: 0.2 }
  );

  return result.questions && result.questions.length > 0 ? result.questions : fallback;
}
