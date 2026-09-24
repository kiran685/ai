/**
 * Structured Skill Taxonomy & Subskill/Concept Hierarchy
 * Provides verifiable skill models with concepts, prerequisites, and difficulties.
 */

export interface ConceptDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  criticality: number; // 1 (low) to 5 (highest critical importance)
  prerequisites?: string[];
}

export interface SkillDefinition {
  id: string;
  name: string;
  category: "Core Computer Science" | "Software Engineering" | "System Architecture" | "Data & Analytics" | "Infrastructure & Tooling";
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  prerequisites: string[];
  concepts: ConceptDefinition[];
}

export const SKILL_CATALOG: Record<string, SkillDefinition> = {
  DSA: {
    id: "DSA",
    name: "DSA",
    category: "Core Computer Science",
    description: "Data Structures & Algorithms: Foundation of algorithmic time/space efficiency and problem solving.",
    difficulty: "Advanced",
    prerequisites: ["Programming"],
    concepts: [
      { id: "ARRAYS_TWO_POINTER", name: "Arrays & Two-Pointer Technique", description: "In-place array manipulations, window bounds, and two-pointer traversal.", difficulty: "Beginner", criticality: 4 },
      { id: "STRINGS_MANIPULATION", name: "String Processing & Hashing", description: "Immutable string operations, substring searching, and frequency counting.", difficulty: "Beginner", criticality: 3 },
      { id: "LINKED_LISTS", name: "Linked List Reversal & Pointers", description: "Singly and doubly linked list pointer updates, cycle detection, and merging.", difficulty: "Intermediate", criticality: 4 },
      { id: "STACKS_AND_QUEUES", name: "Monotonic Stacks & Queues", description: "LIFO/FIFO invariants, monotonic queue bounds, and sliding window maximums.", difficulty: "Intermediate", criticality: 4 },
      { id: "HASH_MAPS", name: "Hash Maps & Amortized Lookup", description: "Hash collision resolution, key-value lookup, and complement tracking.", difficulty: "Beginner", criticality: 5 },
      { id: "BINARY_TREE", name: "Binary Tree Traversal & Recursion", description: "DFS (Inorder, Preorder, Postorder) and BFS Level-order traversals.", difficulty: "Intermediate", criticality: 4 },
      { id: "BST_COMPLEXITY", name: "Binary Search Tree Complexity", description: "BST invariants, search bounds, balanced tree rotations, and worst-case vs average time bounds.", difficulty: "Intermediate", criticality: 5 },
      { id: "HEAPS_PRIORITY_QUEUE", name: "Heaps & Top-K Invariance", description: "Min/Max binary heaps, priority queuing, and streaming Top-K tracking.", difficulty: "Intermediate", criticality: 4 },
      { id: "GRAPHS_BFS_DFS", name: "Graph Traversal & Shortest Path", description: "Adjacency matrix/list representations, BFS shortest path, DFS cycle detection, and Dijkstra.", difficulty: "Advanced", criticality: 4 },
      { id: "DYNAMIC_PROGRAMMING", name: "Dynamic Programming & Memoization", description: "Subproblem optimal substructure, state transitions, memoization, and tabulations.", difficulty: "Advanced", criticality: 5 },
    ],
  },

  Programming: {
    id: "Programming",
    name: "Programming",
    category: "Software Engineering",
    description: "Language mechanics, scope rules, asynchronous execution models, and clean coding paradigms.",
    difficulty: "Intermediate",
    prerequisites: [],
    concepts: [
      { id: "SCOPE_HOISTING", name: "Block Scoping vs Hoisting", description: "Lexical scoping, TDZ (Temporal Dead Zone), variable declarations, and shadow binding.", difficulty: "Beginner", criticality: 4 },
      { id: "CLOSURES_CONTEXT", name: "Closures & Execution Contexts", description: "Lexical environment persistence, memory retention, and closure patterns.", difficulty: "Intermediate", criticality: 5 },
      { id: "EVENT_LOOP", name: "Event Loop & Promise.all", description: "Microtask vs macrotask execution order, asynchronous event loop, and concurrent promises.", difficulty: "Advanced", criticality: 5 },
      { id: "STATE_MUTATION", name: "Decoupled State Mutation", description: "Pure functions, reference vs value mutation mechanics, and immutable data handling.", difficulty: "Intermediate", criticality: 4 },
      { id: "ERROR_HANDLING", name: "Defensive Exception Propagation", description: "Try-catch-finally lifecycle, custom errors, unhandled rejections, and fail-safe boundaries.", difficulty: "Intermediate", criticality: 4 },
    ],
  },

  OOP: {
    id: "OOP",
    name: "OOP",
    category: "Software Engineering",
    description: "Object-oriented design patterns, SOLID architectural standards, and polymorphism.",
    difficulty: "Intermediate",
    prerequisites: ["Programming"],
    concepts: [
      { id: "SOLID_PRINCIPLES", name: "SOLID Principles & Single Responsibility", description: "Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.", difficulty: "Intermediate", criticality: 5 },
      { id: "POLYMORPHISM_INHERITANCE", name: "Polymorphism & Composition over Inheritance", description: "Dynamic method dispatch, abstract base classes, and composition vs deep class hierarchies.", difficulty: "Intermediate", criticality: 4 },
      { id: "DESIGN_PATTERNS", name: "Factory, Singleton & Observer Patterns", description: "Creational and behavioral design patterns in enterprise software architecture.", difficulty: "Advanced", criticality: 4 },
      { id: "ENCAPSULATION", name: "Encapsulation & Access Modifiers", description: "Data hiding, private properties, accessor guards, and domain modeling integrity.", difficulty: "Beginner", criticality: 3 },
    ],
  },

  DBMS: {
    id: "DBMS",
    name: "DBMS",
    category: "Core Computer Science",
    description: "Relational database internals, ACID guarantees, transaction isolation, and indexing engines.",
    difficulty: "Intermediate",
    prerequisites: [],
    concepts: [
      { id: "ACID_TRANSACTIONS", name: "ACID Guarantees & Transaction Isolation", description: "Atomicity, Consistency, Isolation levels (Read Committed, Repeatable Read, Serializable), and Durability.", difficulty: "Intermediate", criticality: 5 },
      { id: "B_TREE_INDEXING", name: "B-Tree Indexing & Query Plans", description: "Clustered vs non-clustered indexes, composite indexes, B+ Tree traversal, and EXPLAIN query plan analysis.", difficulty: "Advanced", criticality: 5 },
      { id: "NORMALIZATION", name: "Database Normalization (1NF to 3NF/BCNF)", description: "Functional dependencies, elimination of data redundancies, and relational schema integrity.", difficulty: "Beginner", criticality: 4 },
      { id: "CONCURRENCY_LOCKS", name: "Concurrency Control & Deadlocks", description: "Pessimistic vs optimistic locking, 2PL (Two-Phase Locking), and deadlock resolution.", difficulty: "Advanced", criticality: 4 },
    ],
  },

  SQL: {
    id: "SQL",
    name: "SQL",
    category: "Software Engineering",
    description: "Complex analytical queries, window functions, CTEs, and schema design.",
    difficulty: "Intermediate",
    prerequisites: ["DBMS"],
    concepts: [
      { id: "WINDOW_FUNCTIONS", name: "Window Functions (ROW_NUMBER, RANK, DENSE_RANK)", description: "Analytical partitioning, order bounds, framing, and running totals.", difficulty: "Intermediate", criticality: 5 },
      { id: "CTES_SUBQUERIES", name: "Common Table Expressions (CTEs) & Subqueries", description: "Recursive CTEs, correlated subqueries, and modular query structuring.", difficulty: "Intermediate", criticality: 4 },
      { id: "JOINS_AGGREGATION", name: "Complex Multi-Table Joins & GROUP BY", description: "Inner, Left, Right, Full Outer joins, cross joins, and multi-dimensional aggregations.", difficulty: "Beginner", criticality: 4 },
    ],
  },

  "Operating Systems": {
    id: "Operating Systems",
    name: "Operating Systems",
    category: "Core Computer Science",
    description: "Process management, virtual memory, concurrency synchronization, and system calls.",
    difficulty: "Intermediate",
    prerequisites: [],
    concepts: [
      { id: "PROCESSES_THREADS", name: "Process vs Thread Architecture", description: "Process address space, context switching, thread pools, and IPC (Inter-Process Communication).", difficulty: "Intermediate", criticality: 5 },
      { id: "CONCURRENCY_DEADLOCKS", name: "Synchronization Primitives & Deadlocks", description: "Mutexes, semaphores, race conditions, critical sections, and Coffman conditions.", difficulty: "Advanced", criticality: 5 },
      { id: "VIRTUAL_MEMORY", name: "Virtual Memory & Paging Mechanisms", description: "Page tables, TLB (Translation Lookaside Buffer), page faults, and page replacement algorithms.", difficulty: "Intermediate", criticality: 4 },
    ],
  },

  "Computer Networks": {
    id: "Computer Networks",
    name: "Computer Networks",
    category: "Core Computer Science",
    description: "Transport protocols, HTTP/HTTPS lifecycles, WebSockets, and socket communication.",
    difficulty: "Intermediate",
    prerequisites: [],
    concepts: [
      { id: "TCP_UDP_HANDSHAKE", name: "TCP Three-Way Handshake & Flow Control", description: "Reliable transport, SYN/ACK, window sizing, congestion control, and UDP tradeoffs.", difficulty: "Intermediate", criticality: 4 },
      { id: "HTTP_HTTPS_LIFECYCLE", name: "HTTP/1.1 vs HTTP/2 vs HTTP/3 & TLS", description: "Stateless protocol semantics, TLS handshake, multiplexing, headers compression, and caching.", difficulty: "Intermediate", criticality: 5 },
      { id: "DNS_SOCKETS", name: "DNS Resolution & WebSocket Communication", description: "Hierarchical DNS lookups, full-duplex socket connections, and real-time streaming.", difficulty: "Beginner", criticality: 4 },
    ],
  },

  "System Design": {
    id: "System Design",
    name: "System Design",
    category: "System Architecture",
    description: "Scalability, distributed caching, load balancing, sharding, and high-availability architecture.",
    difficulty: "Advanced",
    prerequisites: ["Computer Networks", "DBMS"],
    concepts: [
      { id: "CACHING_REDIS", name: "Distributed Caching & Invalidation", description: "Cache-aside, write-through, write-behind, LRU eviction, and cache stampede prevention.", difficulty: "Intermediate", criticality: 5 },
      { id: "LOAD_BALANCING", name: "Load Balancing & Horizontal Scaling", description: "Reverse proxies, Layer 4 vs Layer 7 balancing, round-robin, consistent hashing, and health checks.", difficulty: "Intermediate", criticality: 4 },
      { id: "DATABASE_SHARDING", name: "Database Sharding & Replication", description: "Horizontal partitioning, primary-replica replication, read replicas, and split-brain resolution.", difficulty: "Advanced", criticality: 5 },
      { id: "RATE_LIMITING", name: "Rate Limiting & Defensive Throttling", description: "Token bucket, leaky bucket, sliding window counters, and DDoS mitigation.", difficulty: "Intermediate", criticality: 4 },
    ],
  },

  Git: {
    id: "Git",
    name: "Git",
    category: "Infrastructure & Tooling",
    description: "Distributed version control, branch management, rebase mechanics, and commit hygiene.",
    difficulty: "Beginner",
    prerequisites: [],
    concepts: [
      { id: "BRANCHING_MERGING", name: "Branching Strategies & Fast-Forward Merges", description: "Git flow, trunk-based development, merge vs rebase, and HEAD pointer navigation.", difficulty: "Beginner", criticality: 4 },
      { id: "CONFLICT_RESOLUTION", name: "Merge Conflict Resolution & Stashing", description: "Three-way merge diff inspection, stashing working trees, and cherry-picking.", difficulty: "Intermediate", criticality: 4 },
    ],
  },

  Projects: {
    id: "Projects",
    name: "Projects",
    category: "Software Engineering",
    description: "End-to-end production software engineering, clean code modularity, and applied architectural delivery.",
    difficulty: "Intermediate",
    prerequisites: ["Programming", "OOP", "DBMS"],
    concepts: [
      { id: "FULL_STACK_INTEGRATION", name: "End-to-End System Architecture", description: "Integrating client presentation, API boundary, persistent storage, and background processing.", difficulty: "Intermediate", criticality: 5 },
      { id: "PRODUCTION_DEFENSE", name: "Production Resiliency & Observability", description: "Structured logging, defensive validation, graceful degradation, and containerized deployment.", difficulty: "Intermediate", criticality: 4 },
    ],
  },
};

/**
 * Returns concepts for a given skill name, with case-insensitive fallback lookup
 */
export function getConceptsForSkill(skillName: string): ConceptDefinition[] {
  const normalized = skillName.trim();
  const direct = SKILL_CATALOG[normalized];
  if (direct) return direct.concepts;

  // Search case-insensitively or by alias
  const found = Object.values(SKILL_CATALOG).find(
    (s) => s.name.toLowerCase() === normalized.toLowerCase() || normalized.toLowerCase().includes(s.name.toLowerCase())
  );
  return found?.concepts || [];
}

/**
 * Returns full skill definition by name, with case-insensitive fallback
 */
export function getSkillDefinition(skillName: string): SkillDefinition | undefined {
  const normalized = (skillName || "").trim();
  const direct = SKILL_CATALOG[normalized];
  if (direct) return direct;

  return Object.values(SKILL_CATALOG).find(
    (s) => s.name.toLowerCase() === normalized.toLowerCase() || normalized.toLowerCase().includes(s.name.toLowerCase())
  );
}
