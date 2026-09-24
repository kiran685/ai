import {
  DayTopicItem,
  DaySubModuleItem,
  DayAssessmentQuestion,
  QuestionExplanationBreakdown,
} from "@/types";
import { getRoleCategory, RoleCategory } from "./role-problems";

export { getRoleCategory };
export type { RoleCategory };

function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffleArray<T>(arr: T[], rand: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface RawQuestion {
  question: string;
  codeSnippet?: string;
  language?: string;
  correctOption: string;
  distractors: string[];
  whyCorrect: string;
  whyIncorrect: string[];
  keyPrinciple: string;
  skill?: string;
  topic?: string;
  concept?: string;
  difficulty?: "easy" | "medium" | "hard";
}

// -------------------------------------------------------------
// Role-Specific Assessment Question Pools
// -------------------------------------------------------------

const ROLE_QUESTIONS: Record<RoleCategory, RawQuestion[]> = {
  frontend: [
    {
      question: "In React, why must Hook calls remain at the top level of components and never inside loops or conditional blocks?",
      correctOption: "React relies on a deterministic call order to maintain state across consecutive render passes",
      distractors: [
        "Hooks execute in separate web workers that cannot access conditionals",
        "It prevents JavaScript garbage collection from deleting DOM nodes",
        "Conditional hooks cause memory leaks in the browser V8 heap"
      ],
      whyCorrect: "React preserves component state in linked arrays indexed by the chronological order of Hook executions during render.",
      whyIncorrect: [
        "Hooks run synchronously on the browser main UI thread, not in Web Workers.",
        "Garbage collection is managed automatically by browser runtimes based on reference reachability.",
        "The limitation is algorithmic for state alignment, not an inherent V8 engine memory leak."
      ],
      keyPrinciple: "Unconditional, top-level hook execution guarantees stable state indices across renders.",
      skill: "React",
      topic: "React Hooks Architecture",
      concept: "Hook Call Order Rule",
      difficulty: "medium",
    },
    {
      question: "Analyze this React snippet. What problem will occur when the button is clicked?",
      codeSnippet: `function Counter() {
  const [count, setCount] = useState(0);
  const handleIncrement = () => {
    setCount(count + 1);
    setCount(count + 1);
  };
  return <button onClick={handleIncrement}>Count: {count}</button>;
}`,
      language: "typescript",
      correctOption: "Both updates read the same closed-over count value, incrementing by only 1 instead of 2",
      distractors: [
        "The component throws a fatal Infinite Re-render error",
        "The count updates to 2 synchronously before the button finishes clicking",
        "The count resets to 0 due to an unhandled promise rejection"
      ],
      whyCorrect: "State updates in event handlers are batched. Both calls reference the captured count (0), so both enqueue setting state to 0 + 1 = 1.",
      whyIncorrect: [
        "Infinite re-renders happen when setState is called unconditionally in component body, not in click handlers.",
        "React state updates are asynchronous and enqueued; they never update state variables synchronously in place.",
        "No promises are involved in standard useState dispatches."
      ],
      keyPrinciple: "Use the updater function form `setCount(prev => prev + 1)` when new state derives from previous state.",
      skill: "React",
      topic: "State Batching & Functional Updates",
      concept: "State Closure Capturing",
      difficulty: "medium",
    },
    {
      question: "What is the primary difference between useEffect and useLayoutEffect in modern frontend systems?",
      correctOption: "useLayoutEffect executes synchronously after DOM mutations but before the browser paints pixels",
      distractors: [
        "useEffect only runs on the Node.js SSR server, while useLayoutEffect runs in client browsers",
        "useLayoutEffect cannot update React state or attach event listeners",
        "useEffect blocks user input until all asynchronous network requests resolve"
      ],
      whyCorrect: "useLayoutEffect fires synchronously immediately after DOM mutations, allowing measurement of DOM layout before the screen visually flickers.",
      whyIncorrect: [
        "useEffect runs on both client and client-hydrated SSR components.",
        "useLayoutEffect can execute any valid JavaScript code, including state setters.",
        "useEffect runs asynchronously after browser paint, deliberately avoiding blocking user input."
      ],
      keyPrinciple: "Reserve useLayoutEffect for layout measurements; use useEffect for general data fetching and subscriptions.",
      skill: "React",
      topic: "Lifecycle & Painting",
      concept: "Synchronous DOM Mutation Timing",
      difficulty: "hard",
    },
    {
      question: "When optimizing Core Web Vitals, how does dynamic code-splitting improve Largest Contentful Paint (LCP)?",
      correctOption: "It minimizes the initial JavaScript bundle weight, speeding up critical rendering path parsing and CPU availability",
      distractors: [
        "It forces all CSS rules to be loaded as inline HTML style attributes",
        "It bypasses the browser HTTP caching layer completely",
        "It converts client-side state into server-side cookies"
      ],
      whyCorrect: "Smaller critical JavaScript bundles allow browsers to parse and compile scripts faster, freeing the main thread to render the largest visible element.",
      whyIncorrect: [
        "Inlining all CSS increases HTML document payload and does not split JavaScript.",
        "Bypassing cache worsens performance rather than improving it.",
        "Cookies increase request header overhead and are unrelated to bundle chunking."
      ],
      keyPrinciple: "Defer non-critical JavaScript to keep the critical rendering path lean and sub-second.",
      skill: "Web Performance",
      topic: "Core Web Vitals",
      concept: "Bundle Chunking & LCP",
      difficulty: "medium",
    },
    {
      question: "Which CSS layout mechanism provides true two-dimensional track positioning across rows and columns simultaneously?",
      correctOption: "CSS Grid Layout (display: grid)",
      distractors: [
        "Flexbox Layout (display: flex)",
        "Position Relative / Absolute positioning",
        "Inline-Block float layouts"
      ],
      whyCorrect: "CSS Grid is inherently two-dimensional, allowing items to be aligned across defined row and column tracks simultaneously.",
      whyIncorrect: [
        "Flexbox is designed for one-dimensional layouts along either a main-axis or cross-axis.",
        "Absolute positioning removes elements from the document flow without track coordinates.",
        "Floats are legacy one-dimensional text wrapping tools."
      ],
      keyPrinciple: "Use CSS Grid for page layouts and 2D matrices; use Flexbox for 1D component item distribution.",
      skill: "CSS",
      topic: "Modern CSS Architecture",
      concept: "Two-Dimensional Grid Layout",
      difficulty: "easy",
    },
  ],

  devops: [
    {
      question: "In container runtime architecture, what Linux kernel primitive provides process resource limitation (CPU, memory, I/O)?",
      correctOption: "Control Groups (cgroups)",
      distractors: [
        "Namespaces (pid, net, mnt)",
        "Seccomp security profiles",
        "Chroot jail environments"
      ],
      whyCorrect: "Linux cgroups constrain, allocate, and monitor physical system resources (CPU, RAM, block I/O) allocated to a group of processes.",
      whyIncorrect: [
        "Namespaces provide isolation of system views (network interfaces, process trees, mount points), not resource quotas.",
        "Seccomp filters permitted system calls, not CPU/memory limits.",
        "Chroot modifies the apparent root directory for the current process."
      ],
      keyPrinciple: "Containers are processes isolated by Namespaces and constrained by Cgroups.",
      skill: "Docker / Linux",
      topic: "Container Internals",
      concept: "Control Groups (cgroups)",
      difficulty: "medium",
    },
    {
      question: "Why should multi-stage builds be utilized when authoring production Dockerfiles?",
      correctOption: "They isolate build-time tools (compilers, SDKs) and copy only runtime artifacts into a lean, minimal base image",
      distractors: [
        "They automatically replicate container images across all cloud zones without a registry",
        "They enable containers to bypass root privilege escalation checks",
        "They merge all Docker layers into an uncompressed tarball"
      ],
      whyCorrect: "Multi-stage builds leave behind heavy compilers, source code, and package managers, drastically reducing the final image attack surface and download size.",
      whyIncorrect: [
        "Multi-stage builds operate at build time; cluster replication requires container registries and orchestrators.",
        "Security privileges depend on the runtime USER directive and runtime flags, not multi-stage syntax.",
        "Docker layers remain standard OCI image layers."
      ],
      keyPrinciple: "Ship minimal images containing only runtime binaries to eliminate vulnerabilities and optimize deployment speed.",
      skill: "Docker",
      topic: "Dockerfile Optimization",
      concept: "Multi-Stage Build Architecture",
      difficulty: "medium",
    },
    {
      question: "In Kubernetes, what is the role of an Ingress Controller compared to a standard ClusterIP Service?",
      correctOption: "Ingress routes external HTTP/HTTPS traffic to internal services using URL path and hostname rules",
      distractors: [
        "ClusterIP connects pods directly to physical hard drives",
        "Ingress replaces the Kubernetes API server for scheduling pods",
        "ClusterIP exposes pods publicly on the public internet on static IP addresses"
      ],
      whyCorrect: "An Ingress Controller (e.g. Nginx, Traefik) evaluates L7 HTTP routing rules, SSL termination, and hostnames to route external requests to internal ClusterIP services.",
      whyIncorrect: [
        "ClusterIP provides internal VIP networking between pods, not storage mounting.",
        "Ingress has no role in pod scheduling (handled by kube-scheduler).",
        "ClusterIP is strictly internal to the cluster virtual network."
      ],
      keyPrinciple: "ClusterIP provides internal microservice discovery; Ingress manages L7 external entry and routing.",
      skill: "Kubernetes",
      topic: "Kubernetes Networking",
      concept: "Ingress vs ClusterIP",
      difficulty: "hard",
    },
    {
      question: "What is the purpose of remote state locking in Terraform (e.g. using AWS DynamoDB with S3)?",
      correctOption: "It prevents concurrent terraform apply executions from corrupting infrastructure state files",
      distractors: [
        "It encrypts AWS API access keys on local developer laptops",
        "It forces Terraform to recreate all cloud servers on every commit",
        "It translates HCL code into CloudFormation JSON syntax"
      ],
      whyCorrect: "DynamoDB state locking acquires a lock when an execution begins, preventing simultaneous pipeline jobs from writing colliding state modifications.",
      whyIncorrect: [
        "State locking manages concurrent execution; secrets encryption is handled via KMS or vault solutions.",
        "State locks protect existing state rather than triggering destructive rebuilds.",
        "Terraform applies HCL directly using cloud provider APIs."
      ],
      keyPrinciple: "Always lock state files during infrastructure changes to prevent race conditions and split-brain states.",
      skill: "Terraform",
      topic: "Infrastructure as Code",
      concept: "Remote State Locking",
      difficulty: "medium",
    },
    {
      question: "Which Linux signal does Kubernetes send first when gracefully terminating a pod container?",
      correctOption: "SIGTERM (signal 15), followed by SIGKILL (signal 9) if grace period expires",
      distractors: [
        "SIGKILL immediately with 0 second grace period",
        "SIGHUP to reload configuration files",
        "SIGSTOP to pause process execution in memory"
      ],
      whyCorrect: "Kubernetes issues SIGTERM first to give the application time to drain active network connections and finish current requests before forceful SIGKILL.",
      whyIncorrect: [
        "Immediate SIGKILL aborts in-flight transactions without cleanup.",
        "SIGHUP does not terminate processes; it typically instructs daemons to reload configs.",
        "SIGSTOP suspends execution rather than initiating graceful teardown."
      ],
      keyPrinciple: "Application servers must catch SIGTERM to drain connection pools cleanly within the grace period.",
      skill: "Linux / Kubernetes",
      topic: "Process Signals & Pod Lifecycle",
      concept: "Graceful Shutdown (SIGTERM)",
      difficulty: "medium",
    },
  ],

  backend: [
    {
      question: "In relational databases, which ACID transaction isolation level prevents Dirty Reads but still allows Non-Repeatable Reads?",
      correctOption: "Read Committed",
      distractors: [
        "Read Uncommitted",
        "Repeatable Read",
        "Serializable"
      ],
      whyCorrect: "Read Committed guarantees that transactions only read data that has already been committed, preventing dirty reads while still allowing rows to be updated concurrently.",
      whyIncorrect: [
        "Read Uncommitted permits reading uncommitted transactions (dirty reads).",
        "Repeatable Read prevents non-repeatable reads by locking rows or snapshot versions.",
        "Serializable eliminates all concurrency anomalies including phantom reads."
      ],
      keyPrinciple: "Read Committed is the default production isolation level balancing integrity and concurrency throughput.",
      skill: "SQL / Databases",
      topic: "Database Concurrency",
      concept: "ACID Isolation Levels",
      difficulty: "medium",
    },
    {
      question: "Why are B-Tree indexes preferred over Hash indexes for general-purpose relational database columns?",
      correctOption: "B-Trees support range queries (BETWEEN, >, <) and ORDER BY sorting via ordered leaf nodes",
      distractors: [
        "Hash indexes require O(N^2) memory footprint",
        "B-Trees eliminate the need for primary keys",
        "Hash indexes cannot be stored on physical SSD storage"
      ],
      whyCorrect: "B-Tree leaf pages are linked sequentially in sorted order, making range scans and sorting operations O(log N + K), whereas Hash indexes only support O(1) exact equality (=).",
      whyIncorrect: [
        "Hash indexes have O(N) memory overhead, not quadratic.",
        "Primary keys are logical entity identifiers independent of index tree structure.",
        "Hash indexes can reside on any block storage media."
      ],
      keyPrinciple: "B-Tree indexes optimize both equality lookups and range scans across ordered datasets.",
      skill: "Databases",
      topic: "Database Indexing",
      concept: "B-Tree vs Hash Indexing",
      difficulty: "medium",
    },
    {
      question: "In Node.js, what is the role of the Libuv thread pool during runtime execution?",
      correctOption: "It handles asynchronous file system I/O, DNS lookups, and crypto hashing off the main thread",
      distractors: [
        "It compiles JavaScript source code into machine bytecode",
        "It runs all incoming HTTP server connection listeners concurrently",
        "It parses JSON strings in parallel for every API request"
      ],
      whyCorrect: "Node.js offloads blocking OS operations (file system calls, crypto, DNS lookups) to the background Libuv thread pool (default 4 threads) to prevent blocking the event loop.",
      whyIncorrect: [
        "Bytecode compilation is handled by the Google V8 engine on the main thread.",
        "Network I/O utilizes non-blocking OS kernel polling (epoll/kqueue) without dedicated thread pool threads.",
        "JSON.parse is a synchronous CPU operation executed on the main event loop thread."
      ],
      keyPrinciple: "Keep synchronous CPU tasks off the Node.js event loop to prevent latency spikes across all concurrent connections.",
      skill: "Node.js",
      topic: "Runtime Architecture",
      concept: "Libuv Thread Pool & Event Loop",
      difficulty: "hard",
    },
    {
      question: "What is the Cache Avalanche problem in Redis, and what is the standard architectural remedy?",
      correctOption: "Many keys expiring simultaneously causing a flood of direct database queries; fix by adding random jitter to TTLs",
      distractors: [
        "Redis running out of RAM and crashing; fix by disabling persistence",
        "Client network disconnects causing deadlocks; fix by restarting the Redis cluster",
        "Corrupted AOF files; fix by switching exclusively to MongoDB"
      ],
      whyCorrect: "Adding random TTL jitter (e.g. 3600s + random(0, 300s)) staggers key invalidations, preventing simultaneous database cache-miss stampedes.",
      whyIncorrect: [
        "RAM exhaustion is handled by maxmemory policies (LRU/LFU eviction), not cache avalanche.",
        "Network disconnects do not cause avalanche stampedes on databases.",
        "AOF files are append-only persistence logs unrelated to simultaneous TTL expirations."
      ],
      keyPrinciple: "Always apply TTL jitter and circuit breakers to prevent cache expiration stampedes on underlying databases.",
      skill: "Redis / Caching",
      topic: "Distributed Caching",
      concept: "Cache Avalanche & TTL Jitter",
      difficulty: "hard",
    },
    {
      question: "Why should REST API endpoints designed to update resource state be idempotent?",
      correctOption: "To guarantee that duplicate network retries do not result in unintended duplicate side effects",
      distractors: [
        "To allow browsers to cache POST requests indefinitely",
        "To compress request payloads with gzip algorithms automatically",
        "To eliminate the requirement for Bearer authentication headers"
      ],
      whyCorrect: "Idempotency (like in PUT, DELETE) ensures that if an unstable network drops a response and the client retries, the final system state remains identical.",
      whyIncorrect: [
        "POST requests are non-idempotent and not cached by HTTP specifications.",
        "Payload compression is an HTTP transport feature handled by Content-Encoding.",
        "Authentication is required regardless of idempotency semantics."
      ],
      keyPrinciple: "Design critical payment and mutation APIs with idempotency keys to ensure safe automatic client retries.",
      skill: "REST APIs",
      topic: "API Architecture",
      concept: "Idempotent API Design",
      difficulty: "medium",
    },
  ],

  data: [
    {
      question: "In SQL analytical queries, what is the difference between RANK() and DENSE_RANK() window functions?",
      correctOption: "RANK() leaves gaps in sequence after duplicate ties (e.g. 1, 2, 2, 4), while DENSE_RANK() does not (1, 2, 2, 3)",
      distractors: [
        "DENSE_RANK() only works on integer columns, while RANK() works on text",
        "RANK() modifies underlying table rows, while DENSE_RANK() operates as an in-memory view",
        "DENSE_RANK() calculates cumulative distribution percentiles between 0 and 1"
      ],
      whyCorrect: "RANK() skips ranking positions following tie values; DENSE_RANK() always produces contiguous sequence ranks.",
      whyIncorrect: [
        "Both window functions operate on any data type in the ORDER BY clause.",
        "Neither window function mutates physical table rows; both produce computed projection columns.",
        "Cumulative distribution is calculated by CUME_DIST() or PERCENT_RANK()."
      ],
      keyPrinciple: "Use DENSE_RANK() when consecutive positional rankings are required without index gaps.",
      skill: "SQL",
      topic: "Advanced SQL & Analytics",
      concept: "RANK vs DENSE_RANK",
      difficulty: "easy",
    },
    {
      question: "In statistical hypothesis testing, what does a p-value of 0.03 indicate when testing with significance level alpha = 0.05?",
      correctOption: "There is sufficient evidence to reject the Null Hypothesis (p < 0.05)",
      distractors: [
        "There is a 97% probability that the Null Hypothesis is universally true",
        "The effect size is exactly 0.03 standard deviations",
        "The test is invalid and must be repeated with a larger sample size"
      ],
      whyCorrect: "When the p-value is less than the predetermined threshold alpha (0.03 < 0.05), the observed data is statistically significant, warranting rejection of H0.",
      whyIncorrect: [
        "A p-value is the probability of observing results as extreme assuming H0 is true, not the probability of H0 itself.",
        "P-value is a significance metric, not a measure of effect size (which is measured by Cohen's d).",
        "0.03 is a valid statistical result indicating statistical significance."
      ],
      keyPrinciple: "A low p-value (p < alpha) indicates observed variance is unlikely due to random chance alone.",
      skill: "Statistics",
      topic: "Inferential Statistics",
      concept: "P-Value & Hypothesis Testing",
      difficulty: "medium",
    },
    {
      question: "In Python Pandas, why is `df['col'] = df['col'].astype('category')` recommended for low-cardinality string columns?",
      correctOption: "It drastically reduces RAM consumption and accelerates groupby aggregation performance",
      distractors: [
        "It encrypts the column data to prevent unauthorized access",
        "It converts text into floating-point numbers automatically",
        "It deletes duplicate rows from the DataFrame"
      ],
      whyCorrect: "Categorical types store distinct strings once in an internal dictionary and represent series rows with small integer codes, cutting RAM footprint by 70-90%.",
      whyIncorrect: [
        "Categorical encoding is an in-memory optimization, not cryptographic encryption.",
        "Strings remain represented as category labels, not float values.",
        "Categorical conversion does not drop rows from the dataset."
      ],
      keyPrinciple: "Optimize dataframe memory by converting repetitive string columns into Categorical types.",
      skill: "Pandas",
      topic: "Data Wrangling & Memory Optimization",
      concept: "Categorical Data Types",
      difficulty: "medium",
    },
    {
      question: "When detecting outliers in skewed numerical distributions, why is the Interquartile Range (IQR) rule preferred over Z-Score?",
      correctOption: "IQR relies on medians and quartiles, making it robust against extreme outlier contamination",
      distractors: [
        "Z-scores cannot be calculated in Python",
        "IQR only works when datasets follow a perfect Gaussian normal curve",
        "Z-scores require converting all numbers into integers"
      ],
      whyCorrect: "Mean and standard deviation (used in Z-score) are heavily pulled by extreme values. Median and IQR are non-parametric and resistant to distortion.",
      whyIncorrect: [
        "Scipy and NumPy compute Z-scores readily.",
        "Z-score assumes normal distribution; IQR is robust precisely when data is non-normal or skewed.",
        "Z-scores work with floating-point numbers."
      ],
      keyPrinciple: "Use IQR (Q1 - 1.5*IQR to Q3 + 1.5*IQR) for skewed or non-Gaussian outlier filtering.",
      skill: "Data Science",
      topic: "Exploratory Data Analysis",
      concept: "IQR vs Z-Score Outlier Detection",
      difficulty: "medium",
    },
    {
      question: "In dimensional data modeling, what is the role of a Fact table compared to a Dimension table in a Star Schema?",
      correctOption: "Fact tables record measurable numerical business events (e.g. revenue), while Dimension tables provide context (who, where, when)",
      distractors: [
        "Fact tables contain text descriptions, while Dimension tables store binary images",
        "Dimension tables must always be stored in MongoDB instead of SQL",
        "Fact tables never contain foreign keys"
      ],
      whyCorrect: "Fact tables contain quantitative metrics and foreign keys referencing surrounding Dimension tables that provide descriptive contextual attributes.",
      whyIncorrect: [
        "Fact tables hold numeric metrics; dimension tables hold descriptive strings.",
        "Star schemas are standard relational data warehouse constructs (Snowflake, BigQuery, Postgres).",
        "Fact tables are heavily indexed with foreign keys to dimensions."
      ],
      keyPrinciple: "Star schemas separate business metrics (facts) from contextual filtering attributes (dimensions).",
      skill: "Data Modeling",
      topic: "Data Warehousing",
      concept: "Fact vs Dimension Tables",
      difficulty: "easy",
    },
  ],

  aiml: [
    {
      question: "In PyTorch, why is `optimizer.zero_grad()` called before executing `loss.backward()` during training iterations?",
      correctOption: "PyTorch accumulates gradients by default; failing to zero them adds gradients across consecutive batches",
      distractors: [
        "It resets model neural network weights back to random initialization",
        "It frees GPU memory by deleting the input tensors",
        "It saves model checkpoints to disk automatically"
      ],
      whyCorrect: "By default, `.backward()` computes gradients and adds (`+=`) them to `.grad` buffers to support gradient accumulation. Unzeroed buffers corrupt parameter updates.",
      whyIncorrect: [
        "Weights are updated via `optimizer.step()`, not zero_grad.",
        "zero_grad cleans gradient buffers, not GPU tensor memory.",
        "Checkpointing requires explicit `torch.save()` invocations."
      ],
      keyPrinciple: "Always zero gradients between mini-batches to prevent unintended cross-batch gradient accumulation.",
      skill: "PyTorch",
      topic: "Deep Learning Foundations",
      concept: "Gradient Accumulation & Zeroing",
      difficulty: "medium",
    },
    {
      question: "What failure mode occurs when a deep neural network encounters Vanishing Gradients during backpropagation?",
      correctOption: "Gradients shrink exponentially as they propagate backward, preventing early layers from updating weights",
      distractors: [
        "Model weights become NaN due to numerical overflow",
        "The model predicts only random strings on evaluation datasets",
        "The loss function becomes non-differentiable at zero"
      ],
      whyCorrect: "Repeated multiplication of small derivatives (e.g. through Sigmoid or Tanh activations) causes gradients to decay near zero in early network layers.",
      whyIncorrect: [
        "Exploding gradients cause numerical overflow and NaNs, not vanishing gradients.",
        "Vanishing gradients cause stagnant early layers and slow learning, not random token output.",
        "Loss differentiability depends on the chosen objective function."
      ],
      keyPrinciple: "Use ReLU/GELU activations, Residual connections, and LayerNorm to preserve gradient flow through deep networks.",
      skill: "Deep Learning",
      topic: "Neural Network Mechanics",
      concept: "Vanishing Gradient Problem",
      difficulty: "medium",
    },
    {
      question: "In Retrieval-Augmented Generation (RAG) pipelines, what is the role of Vector Embeddings?",
      correctOption: "They project text into high-dimensional semantic vector space where cosine similarity identifies relevant context",
      distractors: [
        "They encrypt confidential documents with asymmetric public keys",
        "They translate English text into binary executable code",
        "They compress documents into zip archives to save disk space"
      ],
      whyCorrect: "Embeddings represent semantic meaning as dense floating-point vectors, allowing nearest-neighbor search to retrieve relevant context for LLM prompts.",
      whyIncorrect: [
        "Embeddings capture semantic relationships, not cryptographic security.",
        "Embeddings generate numerical vectors, not machine code.",
        "Vector representations typically expand storage size rather than compressing it."
      ],
      keyPrinciple: "Vector embeddings enable semantic similarity retrieval independent of exact keyword matches.",
      skill: "LLMs / RAG",
      topic: "Retrieval-Augmented Generation",
      concept: "Semantic Vector Embeddings",
      difficulty: "medium",
    },
    {
      question: "When evaluating a classification model on highly imbalanced fraud detection data (99.9% legit, 0.1% fraud), why is Accuracy misleading?",
      correctOption: "A naive model predicting 'legit' for 100% of samples achieves 99.9% accuracy while catching 0% of fraud",
      distractors: [
        "Accuracy cannot be calculated on binary labels",
        "Accuracy is only defined for linear regression algorithms",
        "Accuracy always decreases as dataset size increases"
      ],
      whyCorrect: "On heavily skewed classes, the majority class dominates raw accuracy. Metrics like Precision, Recall, and PR-AUC measure true minority class performance.",
      whyIncorrect: [
        "Accuracy is defined as (TP + TN) / Total across all classification problems.",
        "Accuracy is an evaluation metric for classification, not regression.",
        "Accuracy depends on model predictions, not monotonically on dataset volume."
      ],
      keyPrinciple: "Never rely on Accuracy for imbalanced datasets; always evaluate Precision, Recall, and F1/PR-AUC.",
      skill: "Machine Learning",
      topic: "Model Evaluation",
      concept: "Imbalanced Classification Metrics",
      difficulty: "easy",
    },
    {
      question: "What is the primary role of the Self-Attention mechanism in Transformer architectures?",
      correctOption: "It computes pairwise relevance weights across all tokens in a sequence simultaneously, capturing long-range dependencies",
      distractors: [
        "It sequentially processes tokens one-by-one using recurrent hidden states",
        "It deletes words that are not in the dictionary",
        "It converts audio waveforms into frequency spectrograms"
      ],
      whyCorrect: "Self-attention computes Query-Key dot products across all sequence tokens in parallel, dynamically weighting which words inform the context of other words.",
      whyIncorrect: [
        "Sequential one-by-one recurrence is the defining characteristic of RNNs/LSTMs, which Transformers replace.",
        "Transformers handle out-of-vocabulary tokens via subword tokenizers (BPE/WordPiece).",
        "Spectrogram conversion is an audio preprocessing step, not self-attention."
      ],
      keyPrinciple: "Self-attention enables parallel computation of bidirectional contextual relationships across tokens.",
      skill: "Transformers",
      topic: "Transformer Architecture",
      concept: "Self-Attention Mechanism",
      difficulty: "hard",
    },
  ],

  qa: [
    {
      question: "In test engineering, which test design technique tests values at the boundaries of input partitions?",
      correctOption: "Boundary Value Analysis (BVA)",
      distractors: [
        "Equivalence Partitioning only",
        "State Transition Matrix",
        "Mutation Testing"
      ],
      whyCorrect: "Defects cluster around boundary edges (e.g. min, min+1, max-1, max). BVA systematically validates these boundary thresholds.",
      whyIncorrect: [
        "Equivalence partitioning selects representative interior values from valid/invalid partitions.",
        "State transition testing evaluates system states and trigger events.",
        "Mutation testing seeds intentional code changes to test test suite efficacy."
      ],
      keyPrinciple: "Boundary Value Analysis targets edge conditions where off-by-one errors frequently occur.",
      skill: "Software Testing",
      topic: "Test Case Design",
      concept: "Boundary Value Analysis (BVA)",
      difficulty: "easy",
    },
    {
      question: "In Playwright / Cypress UI automation, why are resilient locator strategies based on user-visible attributes (e.g. getByRole, getByText) preferred over brittle XPath?",
      correctOption: "They reflect actual user interactions and do not break when internal DOM structures or CSS classes change",
      distractors: [
        "XPath is deprecated by modern web browsers",
        "getByRole executes on the GPU rather than browser CPU",
        "XPath cannot select button elements"
      ],
      whyCorrect: "Locators based on accessibility roles and text content maintain test stability across UI refactors and CSS restyling.",
      whyIncorrect: [
        "XPath remains fully supported in browsers, but nested DOM paths (/div[2]/div/span) break easily.",
        "Locators evaluate on the DOM tree on browser threads, not GPUs.",
        "XPath can select any XML/HTML element."
      ],
      keyPrinciple: "Test user-facing behavior using accessibility roles (`getByRole`) rather than brittle DOM hierarchy selectors.",
      skill: "Test Automation",
      topic: "Locator Strategies",
      concept: "User-Centric Resilient Locators",
      difficulty: "medium",
    },
    {
      question: "In automated API testing, what is the role of JSON Schema Validation?",
      correctOption: "It validates that response payloads match expected property types, required fields, and structural constraints",
      distractors: [
        "It encrypts the API response before saving to database",
        "It translates JSON into SQL table definitions automatically",
        "It limits the maximum speed of the client internet connection"
      ],
      whyCorrect: "JSON Schema assertions guarantee contract compliance (types, nested arrays, required keys) to catch breaking API regressions before frontend code crashes.",
      whyIncorrect: [
        "Schema validation inspects format, not cryptographic encryption.",
        "Schema validation verifies payloads; ORMs handle database mappings.",
        "Network speed is managed by traffic shaping tools, not schema validation."
      ],
      keyPrinciple: "Combine HTTP status code checks with JSON Schema validation to verify API contractual integrity.",
      skill: "API Testing",
      topic: "REST API Validation",
      concept: "JSON Schema Contract Verification",
      difficulty: "medium",
    },
    {
      question: "When executing load and performance tests with k6 or JMeter, what does the 95th Percentile (p95) response time metric represent?",
      correctOption: "95% of all requests completed in equal to or less than this duration, isolating slow outlier tails",
      distractors: [
        "The average response time across the top 5% of users",
        "The exact error rate percentage of failed HTTP requests",
        "The total throughput capacity divided by 95"
      ],
      whyCorrect: "Percentiles eliminate distortions from arithmetic means. p95 represents the threshold below which 95% of user requests resolved.",
      whyIncorrect: [
        "p95 is a latency threshold, not an average of top users.",
        "Error rates are computed separately (failed requests / total requests).",
        "Throughput is measured in requests per second (RPS), not latency percentiles."
      ],
      keyPrinciple: "Rely on p95 and p99 percentiles instead of arithmetic averages to identify real user performance bottlenecks.",
      skill: "Performance Testing",
      topic: "Load Testing Metrics",
      concept: "Latency Percentiles (p95 / p99)",
      difficulty: "medium",
    },
    {
      question: "What is the primary objective of automated Smoke Testing in a CI/CD deployment pipeline?",
      correctOption: "To quickly verify that the most critical core build functionalities work before running exhaustive test suites",
      distractors: [
        "To stress-test server hardware until CPU overheating occurs",
        "To fuzz all form input fields with random unicode strings for 24 hours",
        "To inspect developer code formatting and tab indentation"
      ],
      whyCorrect: "Smoke tests are fast, high-priority health checks that fail early if essential services (e.g. login, health endpoint) are broken.",
      whyIncorrect: [
        "Hardware stress testing is endurance/soak testing.",
        "Long fuzz testing is part of deep security testing suites.",
        "Code formatting is the responsibility of linters and formatters."
      ],
      keyPrinciple: "Run fast smoke tests first in CI/CD pipelines to fail builds rapidly before expensive tests run.",
      skill: "CI/CD & Testing",
      topic: "Test Pipeline Architecture",
      concept: "Smoke Testing in CI/CD",
      difficulty: "easy",
    },
  ],

  cybersecurity: [
    {
      question: "In modern web application security, how does Content Security Policy (CSP) mitigate Cross-Site Scripting (XSS)?",
      correctOption: "It restricts the domains and script sources from which browsers are permitted to load and execute executable code",
      distractors: [
        "It encrypts all HTML elements before sending them over HTTPS",
        "It replaces JavaScript with WebAssembly automatically",
        "It disables CSS animations to save CPU cycles"
      ],
      whyCorrect: "CSP HTTP response headers restrict script execution to trusted origins and disable unsafe inline scripts (`'unsafe-inline'`), blocking injected attacker payloads.",
      whyIncorrect: [
        "CSP governs resource origins, not HTML element encryption.",
        "WebAssembly has independent security models and does not replace JavaScript via CSP.",
        "CSS animations are unrelated to script execution boundaries."
      ],
      keyPrinciple: "Deploy strict Content Security Policy headers to neutralize unauthorized inline script injection.",
      skill: "Web Security",
      topic: "OWASP & Web Defense",
      concept: "Content Security Policy (CSP)",
      difficulty: "medium",
    },
    {
      question: "Why should cryptographic password hashes be salted with unique cryptographically random values?",
      correctOption: "To prevent attackers from using precomputed Rainbow Tables and to ensure identical passwords have different hashes",
      distractors: [
        "To speed up password hashing execution by 100x",
        "To compress long passwords into exactly 8 characters",
        "To enable plain-text password recovery for forgotten accounts"
      ],
      whyCorrect: "A unique salt ensures that two users with the same password produce completely distinct hashes, rendering precomputed lookup tables (Rainbow Tables) useless.",
      whyIncorrect: [
        "Salting does not accelerate hashing; key derivation functions (Argon2, bcrypt) are intentionally computationally slow.",
        "Hashes are fixed-length digests independent of salt compression.",
        "Salted hashes are irreversible one-way functions; they never permit plain-text recovery."
      ],
      keyPrinciple: "Always pair password hashes with unique cryptographically random salts using adaptive algorithms (Argon2id, bcrypt).",
      skill: "Cryptography",
      topic: "Authentication & Password Security",
      concept: "Password Salting & Rainbow Tables",
      difficulty: "easy",
    },
    {
      question: "In network defense, what mechanism does a Stateful Firewall use that distinguishes it from a simple Stateless Packet Filter?",
      correctOption: "It tracks active connection states (e.g. TCP 3-way handshake) and dynamically allows return packets matching established flows",
      distractors: [
        "It decrypts all TLS traffic using quantum computing",
        "It blocks all incoming traffic regardless of protocol",
        "It converts IPv4 addresses into domain names"
      ],
      whyCorrect: "Stateful firewalls maintain connection tables. When an internal client initiates an outbound connection, inbound response packets belonging to that established flow are automatically permitted.",
      whyIncorrect: [
        "Firewalls do not possess quantum decryption capabilities.",
        "Blocking all traffic breaks network communication.",
        "DNS resolvers handle IP-to-domain translation, not packet firewalls."
      ],
      keyPrinciple: "Stateful packet inspection tracks connection lifecycles to permit legitimate return traffic without broad port openings.",
      skill: "Networking",
      topic: "Network Security & Firewalls",
      concept: "Stateful Packet Inspection",
      difficulty: "medium",
    },
    {
      question: "What vulnerability allows an attacker to manipulate backend SQL query logic when user input is concatenated directly into SQL statements?",
      correctOption: "SQL Injection (SQLi); remediated by utilizing Parameterized Queries / Prepared Statements",
      distractors: [
        "Cross-Site Request Forgery (CSRF); remediated by CORS headers",
        "Server-Side Request Forgery (SSRF); remediated by gzip encoding",
        "Buffer Overflow; remediated by running in Docker"
      ],
      whyCorrect: "Direct concatenation treats user input as executable SQL syntax. Prepared statements separate SQL code from untrusted data parameters, completely preventing injection.",
      whyIncorrect: [
        "CSRF is unauthorized actions on authenticated sessions, not SQL manipulation.",
        "SSRF involves backend requests to internal networks, not SQL logic.",
        "Buffer overflow is a memory corruption flaw in low-level languages (C/C++)."
      ],
      keyPrinciple: "Always use parameterized queries or type-safe ORMs; never concatenate user input into SQL strings.",
      skill: "Application Security",
      topic: "OWASP Top 10",
      concept: "SQL Injection & Parameterized Queries",
      difficulty: "easy",
    },
    {
      question: "In security operations, what is the role of a SIEM (Security Information and Event Management) system?",
      correctOption: "To aggregate, normalize, and correlate security event logs across diverse systems to detect active intrusions and threats",
      distractors: [
        "To compile software code into binary executables",
        "To host public company websites and handle e-commerce checkout",
        "To replace antivirus software on user laptops"
      ],
      whyCorrect: "SIEM platforms (e.g. Splunk, Elastic Security) centralize log streams from firewalls, servers, and identity providers, triggering correlation alerts on anomalous activity.",
      whyIncorrect: [
        "SIEM is an analytical monitoring platform, not a software compiler.",
        "SIEM monitors infrastructure; it does not host web applications.",
        "SIEM complements endpoint detection (EDR/antivirus) rather than replacing local agents."
      ],
      keyPrinciple: "Centralized SIEM log aggregation and correlation rules enable rapid threat detection and forensic audit trails.",
      skill: "Security Operations",
      topic: "SIEM & Threat Detection",
      concept: "Log Correlation & Threat Detection",
      difficulty: "medium",
    },
  ],

  software_engineer: [
    {
      question: "What is the worst-case time complexity of searching for an element in an unindexed Array versus a Hash Map?",
      correctOption: "Array search is O(N) linear time; Hash Map average lookup is O(1) constant time",
      distractors: [
        "Array search is O(1); Hash Map lookup is O(N^2)",
        "Both data structures guarantee O(log N) worst-case search time",
        "Array search is O(N!); Hash Map lookup is O(N)"
      ],
      whyCorrect: "Unindexed arrays require iterating elements one by one (O(N)). Hash Maps compute a hash of the key to index directly to the bucket in O(1) average time.",
      whyIncorrect: [
        "Arrays cannot look up arbitrary values in O(1) without knowing the exact index.",
        "Binary Search Trees achieve O(log N), not unindexed arrays.",
        "O(N!) is factorial permutation complexity."
      ],
      keyPrinciple: "Hash Maps provide O(1) average key lookups by converting keys into bucket array indices.",
      skill: "Data Structures",
      topic: "Algorithmic Complexity",
      concept: "Array vs Hash Map Complexity",
      difficulty: "easy",
    },
    {
      question: "In Object-Oriented Design, what does the Single Responsibility Principle (SRP) dictate?",
      correctOption: "A class or module should have one, and only one, reason to change",
      distractors: [
        "Every function must have only one line of code",
        "An application can have only one database connection pool",
        "A class must never implement more than one interface"
      ],
      whyCorrect: "SRP states that a module should be responsible to one, and only one, actor or business capability, preventing coupled side-effects when requirements evolve.",
      whyIncorrect: [
        "Function length is a readability metric, not the definition of SRP.",
        "Connection pooling is an infrastructure resource strategy.",
        "Classes can implement multiple specialized interfaces (Interface Segregation)."
      ],
      keyPrinciple: "Keep modules focused on a single business capability to prevent ripple effects during changes.",
      skill: "Software Engineering",
      topic: "SOLID Design Principles",
      concept: "Single Responsibility Principle",
      difficulty: "easy",
    },
    {
      question: "What is the primary difference between Stack memory and Heap memory in application runtimes?",
      correctOption: "Stack allocates sequential frames with automatic O(1) cleanup upon function exit; Heap allocates dynamic objects with runtime garbage collection",
      distractors: [
        "Stack memory resides on physical SSD drives; Heap memory resides in CPU cache",
        "Stack memory is unlimited in size; Heap memory is restricted to 64 kilobytes",
        "Heap memory can only store primitive integers and booleans"
      ],
      whyCorrect: "Stack memory is fast and managed via stack pointers as functions enter/exit. Heap memory accommodates arbitrary dynamic allocations whose lifecycles outlive individual stack frames.",
      whyIncorrect: [
        "Both Stack and Heap reside in physical RAM.",
        "Stack memory has a fixed size limit (causing Stack Overflow if exceeded); Heap occupies available system memory.",
        "Primitives typically reside on the stack; heap stores dynamic reference objects and arrays."
      ],
      keyPrinciple: "Stack provides fast, scoped allocation; Heap manages dynamic objects with variable lifecycles.",
      skill: "Computer Science",
      topic: "Memory Architecture",
      concept: "Stack vs Heap Allocation",
      difficulty: "medium",
    },
    {
      question: "When traversing a graph, which algorithm uses a Queue and explores neighbor nodes layer-by-layer to guarantee finding the shortest path on unweighted graphs?",
      correctOption: "Breadth-First Search (BFS)",
      distractors: [
        "Depth-First Search (DFS)",
        "Binary Search",
        "Quicksort"
      ],
      whyCorrect: "BFS explores all vertices at depth d before moving to depth d+1 using a FIFO Queue, guaranteeing the minimum edge traversal distance on unweighted graphs.",
      whyIncorrect: [
        "DFS uses a LIFO Stack and explores deep down single branches without shortest-path guarantees.",
        "Binary search operates on sorted linear arrays, not general graphs.",
        "Quicksort is an array sorting algorithm."
      ],
      keyPrinciple: "Use BFS with a Queue for shortest paths on unweighted graphs; use DFS with a Stack for exhaustive branch exploration.",
      skill: "Algorithms",
      topic: "Graph Algorithms",
      concept: "Breadth-First Search (BFS)",
      difficulty: "medium",
    },
    {
      question: "In concurrent software systems, what condition constitutes a Deadlock?",
      correctOption: "Two or more processes are blocked indefinitely, each holding a lock the other requires to proceed",
      distractors: [
        "A server CPU reaching 100% utilization during heavy mathematical calculations",
        "A network socket timing out due to packet drops",
        "An application throwing an uncaught NullPointerException"
      ],
      whyCorrect: "Deadlock occurs when processes acquire resources in circular wait orders (Coffman conditions), preventing any of them from completing without external intervention.",
      whyIncorrect: [
        "High CPU utilization is computational load, not synchronization deadlock.",
        "Socket timeouts indicate network degradation or dropped packets.",
        "Null pointer exceptions are logical software crashes."
      ],
      keyPrinciple: "Prevent deadlocks by establishing strict, global acquisition hierarchies across all shared resource locks.",
      skill: "Concurrency",
      topic: "Concurrency & Synchronization",
      concept: "Deadlock Conditions & Prevention",
      difficulty: "hard",
    },
  ],
};

// Mirror common aliases
ROLE_QUESTIONS["backend"] = ROLE_QUESTIONS["backend"] || [];

export function getRoleSpecificQuestionPool(
  career: string,
  primarySkill: string,
  dayNumber: number,
  userId: string,
  attemptNumber: number
): DayAssessmentQuestion[] {
  const category = getRoleCategory(career);
  const basePool = ROLE_QUESTIONS[category] || ROLE_QUESTIONS.software_engineer;

  const seedString = `${userId || "user"}_day${dayNumber}_att${attemptNumber}_${primarySkill}_${category}`;
  const seedNum = stringHash(seedString);
  const rand = seededRandom(seedNum);

  const shuffled = shuffleArray(basePool, rand);
  const selected = shuffled.slice(0, 5);

  return selected.map((t, idx) => {
    const rawOptions = [t.correctOption, ...t.distractors];
    const shuffledOptions = shuffleArray(rawOptions, rand);
    const correctIndex = shuffledOptions.indexOf(t.correctOption);

    const breakdown: QuestionExplanationBreakdown = {
      whyCorrect: t.whyCorrect,
      whyIncorrect: t.whyIncorrect,
      keyPrinciple: t.keyPrinciple,
    };

    return {
      id: `q-day${dayNumber}-role-${idx + 1}-${stringHash(t.question).toString(36)}`,
      question: t.question,
      codeSnippet: t.codeSnippet,
      language: t.language,
      options: shuffledOptions,
      correctIndex,
      correctAnswer: correctIndex,
      correctOption: correctIndex,
      skill: t.skill || primarySkill,
      topic: t.topic || `${primarySkill} Architecture`,
      concept: t.concept || `${primarySkill} Principle`,
      difficulty: t.difficulty || "medium",
      explanation: `Option ${["A", "B", "C", "D"][correctIndex]} is correct: ${t.whyCorrect} ${t.keyPrinciple}`,
      explanationBreakdown: breakdown,
    };
  });
}

// -------------------------------------------------------------
// Role-Specific Lesson & Theory Packages
// -------------------------------------------------------------

export interface RoleTheoryPackage {
  topic1Title: string;
  topic1Subtitle: string;
  topic1Theory: string;
  topic1Comparison: { headers: string[]; rows: string[][] };
  topic1Modules: DaySubModuleItem[];
  interviewQuestionsTopic1: { question: string; answer: string; difficulty: "Intermediate" | "Advanced" }[];

  topic2Title: string;
  topic2Subtitle: string;
  topic2Theory: string;
  topic2Comparison: { headers: string[]; rows: string[][] };
  topic2Modules: DaySubModuleItem[];
  interviewQuestionsTopic2: { question: string; answer: string; difficulty: "Intermediate" | "Advanced" }[];
}

export function getRoleSpecificDayTheory(
  career: string,
  dayNumber: number,
  primarySkill: string
): RoleTheoryPackage {
  const category = getRoleCategory(career);

  switch (category) {
    case "frontend":
      return {
        topic1Title: `${primarySkill} Component Lifecycle & Reactive State Synchronization`,
        topic1Subtitle: "Virtual DOM diffing, reactive unidirectional data flow, and modern Hooks architecture",
        topic1Theory: `### 1. Modern Frontend Architecture & Component Mechanics
In frontend engineering, building accessible, performant user interfaces requires deep mastery over component lifecycles, reactivity models, and unidirectional state trees.

#### Virtual DOM Reconciliation & Render Cycles
1. **Reconciliation & Double Buffering**:
   - Modern declarative UI frameworks compute a virtual representation of the DOM. When state changes occur, a reconciliation pass compares the new tree against the current fiber representation.
   - Updates calculate the minimal diff and batch DOM operations together to prevent expensive browser layout recalculations and repaints.
2. **Unidirectional Data Flow**:
   - State flows downward through component props; events and updates propagate upward via callback dispatches. This prevents cyclic dependencies and ensures predictable state synchronization across complex component trees.
3. **Immutability & Change Detection**:
   - Treating state objects as immutable snapshots enables rapid reference equality checks (\`prevProps.item === nextProps.item\`) in $O(1)$ constant time, bypassing deep recursive object traversal.`,
        topic1Comparison: {
          headers: ["Architectural Factor", "Senior Frontend Standard", "Junior Anti-Pattern / Legacy Pitfall"],
          rows: [
            ["State Updates", "Deterministic immutable transitions / functional reducers", "Direct in-place object property mutation"],
            ["Data Fetching", "TanStack Query / SWR with caching & revalidation", "Raw useEffect without abort signals or deduplication"],
            ["Component Styling", "Design system tokens / Tailwind utility contracts", "Ad-hoc global CSS with high specificity collisions"],
            ["DOM Interaction", "Declarative React refs & state hooks", "Direct document.getElementById DOM mutations"],
          ]
        },
        topic1Modules: [
          {
            id: `mod-${dayNumber}-1`,
            title: `Module 1: Component Mental Model & Strict TypeScript Contracts`,
            overview: `Defining type-safe component props, discriminated unions, and clean architectural boundaries.`,
            notes: [
              "Always type component props with strict TypeScript interfaces.",
              "Use discriminated unions for conditional UI states (e.g. idle, loading, success, error).",
              "Prevent prop drilling by leveraging context providers or lightweight global stores (Zustand)."
            ],
            commands: ["npm install clsx tailwind-merge lucide-react", "npm run type-check"],
            codeSnippet: {
              language: "typescript",
              code: `// Type-Safe Discriminated Component State
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

export interface ActionButtonProps {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  onClick: () => Promise<void> | void;
}`,
              explanation: "Discriminated unions ensure that data is only accessible when status === 'success', eliminating undefined runtime errors."
            },
            keyTakeaways: [
              "Discriminated unions eliminate invalid component states at compile time.",
              "Never allow unhandled undefined states to reach UI rendering."
            ]
          },
          {
            id: `mod-${dayNumber}-2`,
            title: `Module 2: Custom Hook Architecture & Logic Extraction`,
            overview: `Extracting reusable reactive logic into modular custom hooks with AbortController cleanup.`,
            notes: [
              "Encapsulate state and side effects inside custom hooks prefixed with 'use'.",
              "Always detach event listeners and cancel network promises on unmount.",
              "Return stable memoized callbacks using useCallback where appropriate."
            ],
            commands: ["npm test -- hooks.test.ts"],
            codeSnippet: {
              language: "typescript",
              code: `import { useState, useEffect } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle); // Teardown previous timer
  }, [value, delayMs]);

  return debounced;
}`,
              explanation: "Custom hook that cleanly debounces fast input mutations, cancelling obsolete timers on each keystroke."
            },
            keyTakeaways: [
              "Always provide cleanup functions in useEffect hooks to prevent memory leaks.",
              "Custom hooks decouple presentation components from complex business logic."
            ]
          }
        ],
        interviewQuestionsTopic1: [
          {
            question: "How does React Fiber enable asynchronous, interruptible rendering?",
            answer: "React Fiber breaks the rendering work into small units called fiber nodes. Instead of executing recursive synchronous updates that block the browser main thread, Fiber uses a cooperatively scheduled loop. Urgent updates (like keyboard typing or click animations) can yield control back to the browser, process the user event, and resume background tree reconciliation without frame drops.",
            difficulty: "Advanced"
          },
          {
            question: "What causes stale closures in React hooks, and how do you prevent them?",
            answer: "A stale closure happens when an asynchronous callback captures a reference to state from an earlier render pass. When the promise or timer later executes, it reads the old captured variable. We prevent this by: (1) using functional state updates like setCount(prev => prev + 1), (2) ensuring all referenced variables are declared in dependency arrays, or (3) using useRef for values that mutate without requiring re-renders.",
            difficulty: "Intermediate"
          }
        ],

        topic2Title: `${primarySkill} Performance Optimization, Core Web Vitals & Production Hardening`,
        topic2Subtitle: "Eliminating re-render bottlenecks, dynamic bundle splitting, and sub-second loading",
        topic2Theory: `### 2. Frontend Performance & Core Web Vitals
High-performance frontend systems deliver instant interactivity and smooth 60fps animations by eliminating main-thread congestion and bundle bloat.

#### Core Web Vitals Engineering
1. **Largest Contentful Paint (LCP)**:
   - Measures perceived loading speed. Optimized by preloading hero assets, applying server-side rendering (SSR), and stripping unused CSS/JS from the critical path.
2. **Interaction to Next Paint (INP)**:
   - Measures interface responsiveness. Optimized by breaking long JavaScript tasks (>50ms) using requestAnimationFrame or scheduler.yield(), and wrapping non-urgent updates in \`startTransition\`.
3. **Cumulative Layout Shift (CLS)**:
   - Measures visual stability. Prevented by reserving explicit width/height dimensions on images, dynamic ads, and skeleton placeholders before network loads complete.`,
        topic2Comparison: {
          headers: ["Performance Metric", "Optimal Threshold", "Common Degradation Cause"],
          rows: [
            ["LCP (Largest Contentful Paint)", "≤ 2.5 seconds", "Large uncompressed images and monolithic JS bundles blocking the main thread"],
            ["INP (Interaction to Next Paint)", "≤ 200 milliseconds", "Long-running synchronous loops and heavy DOM re-renders inside click handlers"],
            ["CLS (Cumulative Layout Shift)", "≤ 0.1 score", "Images or dynamic banners rendering without explicit aspect-ratio reserves"],
            ["Bundle Size", "≤ 150KB initial gzip", "Wildcard barrel exports and heavy un-treeshaken external libraries"],
          ]
        },
        topic2Modules: [
          {
            id: `mod-${dayNumber}-3`,
            title: `Module 3: Code Splitting & Dynamic Lazy Loading`,
            overview: `Splitting client bundles by route and viewport visibility to minimize initial download overhead.`,
            notes: [
              "Use React.lazy and Suspense for heavy route-level components.",
              "Defer non-critical third-party analytics and charting packages.",
              "Audit bundles using webpack-bundle-analyzer or @next/bundle-analyzer."
            ],
            commands: ["npx @next/bundle-analyzer", "npx lighthouse-ci collect"],
            codeSnippet: {
              language: "typescript",
              code: `import { lazy, Suspense } from "react";

const AnalyticsChart = lazy(() => import("@/components/HeavyChart"));

export function DashboardView() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-slate-900 rounded-xl" />}>
      <AnalyticsChart />
    </Suspense>
  );
}`,
              explanation: "Lazy-loaded chart component that downloads its bundle chunk only when rendered into the DOM."
            },
            keyTakeaways: [
              "Never import heavy libraries at the top of shared root pages.",
              "Always wrap dynamic lazy imports with accessible fallback skeletons."
            ]
          },
          {
            id: `mod-${dayNumber}-4`,
            title: `Module 4: Re-render Profiling & Memoization Strategy`,
            overview: `Identifying unnecessary renders and applying useMemo / React.memo defensively.`,
            notes: [
              "Profile components using React DevTools Profiler to identify high-render nodes.",
              "Do not prematurely memoize simple primitive calculations; focus on heavy array filtering.",
              "Maintain stable object references passed to deeply nested child components."
            ],
            commands: ["npm run build", "npm run start"],
            codeSnippet: {
              language: "typescript",
              code: `import { useMemo } from "react";

export function TransactionList({ items, filterQuery }: { items: Transaction[]; filterQuery: string }) {
  // Only recompute filtered list when items or search query change
  const filtered = useMemo(() => {
    return items.filter(i => i.title.toLowerCase().includes(filterQuery.toLowerCase()));
  }, [items, filterQuery]);

  return <ul>{filtered.map(i => <li key={i.id}>{i.title}</li>)}</ul>;
}`,
              explanation: "Memoized array filter that prevents recalculating thousands of items on unrelated parent state updates."
            },
            keyTakeaways: [
              "Measure before memoizing; unneeded memoization adds memory overhead without user benefit.",
              "Keys must remain stable UUIDs or IDs, never random math values."
            ]
          }
        ],
        interviewQuestionsTopic2: [
          {
            question: "Why should React component keys never be set to Math.random() or array index when items can reorder?",
            answer: "React uses the 'key' attribute during reconciliation to match elements between render trees. If keys are randomized on each render, React destroys and recreates the entire DOM node and all child state, causing input loss and severe performance drops. If array indices are used and items are inserted or removed, keys shift, causing incorrect state attachment to neighboring elements.",
            difficulty: "Intermediate"
          },
          {
            question: "Explain the architectural difference between Server Components (RSC) and Client Components in modern Next.js.",
            answer: "Server Components execute strictly on the Node.js server. Their dependencies (database drivers, heavy markdown parsers, secrets) are never bundled into the client JavaScript payload, resulting in zero client bundle weight. Client Components ('use client') execute both on the server during initial SSR and hydrate on the browser, allowing interactive state (useState, event listeners).",
            difficulty: "Advanced"
          }
        ],
      };

    case "devops":
      return {
        topic1Title: `${primarySkill} Systems Architecture & Container Infrastructure`,
        topic1Subtitle: "Linux kernel namespaces, cgroups, containerization mechanics, and automation",
        topic1Theory: `### 1. Cloud & DevOps Infrastructure Foundations
Modern DevOps engineering centers on reproducibility, declarative infrastructure, container isolation, and automated delivery pipelines.

#### Containerization & Linux Kernel Primitives
1. **Linux Namespaces**:
   - Namespaces partition global kernel resources into isolated views. Process trees (PID), network interfaces (NET), mount tables (MNT), and user IDs (USER) are virtualized so that container processes perceive they own the entire OS.
2. **Control Groups (cgroups v2)**:
   - Control groups constrain and account for physical resource utilization. They enforce strict CPU quotas, memory limits (preventing Out-Of-Memory host crashes), and block I/O bandwidth.
3. **Layered Copy-on-Write (CoW) Storage**:
   - Container storage engines (Overlay2) stack immutable read-only image layers. Modifications write strictly to a transient, writable upper layer, enabling lightweight image sharing and instant spin-up.`,
        topic1Comparison: {
          headers: ["Infrastructure Vector", "Cloud-Native Production Standard", "Legacy Anti-Pattern / Risk"],
          rows: [
            ["Configuration", "Declarative GitOps & Infrastructure as Code (Terraform)", "Manual SSH changes & snowflake servers"],
            ["Container Images", "Multi-stage minimal distroless/alpine containers", "Fat monolithic images containing compilers and dev tools"],
            ["Secret Management", "Encrypted secrets engines (AWS Secrets Manager, Vault)", "Hardcoded plaintext credentials in Dockerfiles or Git"],
            ["Deployment Strategy", "Canary or Blue-Green rolling updates with automated rollback", "Downtime deployments with in-place service restarts"],
          ]
        },
        topic1Modules: [
          {
            id: `mod-${dayNumber}-1`,
            title: `Module 1: Production Dockerfile Optimization & Multi-Stage Builds`,
            overview: `Constructing secure, cache-optimized Dockerfiles with minimal attack surfaces.`,
            notes: [
              "Order Dockerfile instructions from least-frequently changed to most-frequently changed.",
              "Run container processes as non-root users (USER 1001) for security hardening.",
              "Use .dockerignore to exclude git directories, tests, and node_modules from build contexts."
            ],
            commands: [
              "docker build -t app:prod --target runner .",
              "docker run --rm -it --user 1001:1001 -p 8080:8080 app:prod"
            ],
            codeSnippet: {
              language: "dockerfile",
              code: `# Multi-Stage Production Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
USER appuser
EXPOSE 3000
CMD ["node", "dist/server.js"]`,
              explanation: "Lean multi-stage Docker build leaving compilers behind and executing under unprivileged user."
            },
            keyTakeaways: [
              "Multi-stage builds eliminate compiler toolchains from final production container images.",
              "Never run container processes as root in production clusters."
            ]
          },
          {
            id: `mod-${dayNumber}-2`,
            title: `Module 2: Automated CI/CD Workflows with GitHub Actions`,
            overview: `Implementing automated linting, testing, image building, and vulnerability scanning.`,
            notes: [
              "Enforce pipeline gates: lint, unit test, build, and vulnerability scan.",
              "Cache dependency directories between workflow runs to optimize build times.",
              "Deploy only upon passing automated integration checks."
            ],
            commands: ["act -l", "git push origin main"],
            codeSnippet: {
              language: "yaml",
              code: `name: Production CI/CD Pipeline
on:
  push:
    branches: [main]
jobs:
  verify-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - name: Build & Publish Image
        run: |
          docker build -t registry.company.io/app:\${{ github.sha }} .
          echo "Image built and ready for staging deployment"`,
              explanation: "GitHub Actions workflow enforcing automated test suites and tagged release image creation."
            },
            keyTakeaways: [
              "Automate continuous integration checks on every commit.",
              "Tag container images with git commit SHAs for instant provenance and rollback."
            ]
          }
        ],
        interviewQuestionsTopic1: [
          {
            question: "How do Linux namespaces and cgroups differ in container runtimes?",
            answer: "Linux namespaces provide boundary isolation: they determine what a process can see (e.g. its own private PID process tree, dedicated virtual network interface, and isolated mount points). Cgroups (Control Groups) provide resource accounting and limits: they determine how much physical host resource a process can consume (e.g. limiting a container to 1 CPU core and 512MB RAM, triggering OOM kill if exceeded).",
            difficulty: "Intermediate"
          },
          {
            question: "Explain the difference between a Blue-Green deployment and a Canary deployment.",
            answer: "In a Blue-Green deployment, two identical production environments exist. The new version is deployed and tested fully in Green; once verified, the router/load balancer instantly flips 100% of traffic to Green. In a Canary deployment, the new release is deployed alongside the old version and receives a tiny fraction of traffic (e.g. 5%), allowing engineers to monitor metrics and error rates before gradually scaling to 100%.",
            difficulty: "Intermediate"
          }
        ],

        topic2Title: `${primarySkill} Kubernetes Orchestration, Cloud Networking & Observability`,
        topic2Subtitle: "Declarative cluster architecture, ingress controllers, and telemetry instrumentation",
        topic2Theory: `### 2. Orchestration, Networking & Infrastructure Scaling
Enterprise cloud systems handle massive concurrency across distributed Kubernetes clusters, governed by declarative state and deep observability.

#### Kubernetes Architectural Planes
1. **Control Plane Components**:
   - \`kube-apiserver\` acts as the central hub; \`etcd\` provides distributed consensus key-value storage; \`kube-scheduler\` assigns pods to available worker nodes; \`kube-controller-manager\` maintains desired state loops.
2. **Worker Node Architecture**:
   - \`kubelet\` communicates with the container runtime (containerd); \`kube-proxy\` manages L4 network iptables/IPVS rules across node IPs.
3. **Observability Pillars**:
   - Metrics (Prometheus scrapers), Logs (structured JSON streams), and Traces (OpenTelemetry distributed trace spans) ensure rapid incident detection.`,
        topic2Comparison: {
          headers: ["Observability Element", "Production Standard", "Common Operational Trap"],
          rows: [
            ["Health Probes", "Distinct livenessProbe (restarts) and readinessProbe (traffic routing)", "Identical heavy database query probes causing cascading pod restarts"],
            ["Metric Collection", "Prometheus pull-based metric endpoints with custom counters", "Unstructured textual console logs with no metric parsing"],
            ["Traffic Routing", "Ingress Controller with TLS termination and path routing", "Exposing individual pods directly via NodePort across firewalls"],
            ["Secret Management", "External Secrets Operator syncing from AWS Secrets Manager", "Committing base64-encoded Kubernetes secrets directly to Git"],
          ]
        },
        topic2Modules: [
          {
            id: `mod-${dayNumber}-3`,
            title: `Module 3: Kubernetes Deployment Contracts & Health Probes`,
            overview: `Authoring resilient Kubernetes deployment manifests with explicit resource requests and probes.`,
            notes: [
              "Always declare explicit CPU and memory requests and limits.",
              "Configure readinessProbe to hold traffic until caches and connection pools initialize.",
              "Separate liveness probes from readiness probes to avoid unnecessary restart loops."
            ],
            commands: ["kubectl apply -f deployment.yaml", "kubectl get pods -w"],
            codeSnippet: {
              language: "yaml",
              code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-service
  template:
    metadata:
      labels:
        app: api-service
    spec:
      containers:
      - name: api
        image: company/api:v1.2.0
        resources:
          requests:
            cpu: "250m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10`,
              explanation: "Kubernetes deployment specifying exact resource budgets and readiness health checks."
            },
            keyTakeaways: [
              "Resource requests dictate cluster scheduling; limits prevent noisy-neighbor host exhaustion.",
              "Readiness probes prevent zero-downtime deployment traffic from hitting uninitialized pods."
            ]
          },
          {
            id: `mod-${dayNumber}-4`,
            title: `Module 4: Prometheus Metric Instrumentation & Alerting`,
            overview: `Instrumenting application metrics and setting up latency threshold alerts.`,
            notes: [
              "Expose /metrics endpoint formatted for Prometheus scraping.",
              "Track RED metrics: Rate (RPS), Errors (5xx rate), and Duration (latency distribution).",
              "Set alerts on p99 latency thresholds and error rates rather than raw CPU spikes."
            ],
            commands: ["curl -s http://localhost:9090/metrics | grep http_requests_total"],
            codeSnippet: {
              language: "typescript",
              code: `// Prometheus Metric Counter & Histogram
import client from "prom-client";

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5]
});`,
              explanation: "Prometheus histogram bucket instrumenting API response latency distributions."
            },
            keyTakeaways: [
              "Instrument latency histograms to track real p95/p99 user experience percentiles.",
              "Alert on actionable service degradation rather than transient resource blips."
            ]
          }
        ],
        interviewQuestionsTopic2: [
          {
            question: "What is the difference between a Kubernetes livenessProbe and a readinessProbe?",
            answer: "A livenessProbe checks if the application container is still running and healthy. If it fails, Kubernetes kills and restarts the container. A readinessProbe checks if the application is ready to accept user network traffic (e.g. after database connections and cache warmups complete). If it fails, Kubernetes removes the pod's IP from Service endpoints so no traffic is routed to it, without restarting the container.",
            difficulty: "Intermediate"
          },
          {
            question: "How does Terraform track infrastructure state, and why is remote state locking mandatory in teams?",
            answer: "Terraform records mapped cloud resource IDs, metadata, and dependencies in a 'terraform.tfstate' file. When applying changes, Terraform computes a diff between this state file, the code configuration, and actual live cloud APIs. Remote state locking (e.g. S3 with DynamoDB table locking) ensures that only one pipeline or engineer can execute 'terraform apply' at a time, preventing state corruption and race conditions.",
            difficulty: "Advanced"
          }
        ],
      };

    default: // backend, software_engineer, data, aiml, qa, cybersecurity fallback
      return {
        topic1Title: `${primarySkill} Architectural Foundations & Execution Mechanics`,
        topic1Subtitle: "Internal runtime contracts, state lifecycles, and resilient system engineering",
        topic1Theory: `### 1. Architectural Foundations of ${primarySkill}
In enterprise systems, mastering **${primarySkill}** for **${career}** requires deep comprehension of execution models, algorithmic efficiency, and defensive design contracts.

#### Core Execution & Memory Models
1. **Deterministic State Transitions**:
   - Modern systems avoid direct global state mutations. State is transitioned through pure, deterministic functions that produce verifiable audit logs and predictable outcomes.
2. **Computational Complexity**:
   - Balancing time complexity $O(N)$ with space memory allocation ensures systems scale gracefully under high-throughput request loads.
3. **Decoupled Architecture**:
   - Isolating domain business rules from storage and transport protocols guarantees code maintainability and comprehensive unit testability.`,
        topic1Comparison: {
          headers: ["Engineering Principle", "Senior Modern Standard", "Junior Anti-Pattern / Legacy Pitfall"],
          rows: [
            ["State Handling", "Immutable state snapshots with version checks", "Direct in-place object property mutation"],
            ["Error Propagation", "Explicit domain error hierarchies and logging", "Silent exception swallowing with empty catch blocks"],
            ["Resource Lifecycle", "Deterministic cleanup hooks & teardown contracts", "Dangling handles and leaked file/network sockets"],
            ["Type Safety", "Strict compile-time schemas & runtime validation", "Permissive 'any' types and untyped dynamic JSON"],
          ]
        },
        topic1Modules: [
          {
            id: `mod-${dayNumber}-1`,
            title: `Module 1: Core Domain Contracts & Setup`,
            overview: `Establishing strict domain contracts and clean architectural boundaries for ${primarySkill}.`,
            notes: [
              "Declare immutable domain entity contracts.",
              "Enforce strict validation at system ingress points.",
              "Separate business logic from external I/O protocols."
            ],
            commands: ["npm init -y", "npm install typescript @types/node vitest", "npx tsc --init"],
            codeSnippet: {
              language: "typescript",
              code: `// Domain Contract for ${primarySkill}
export interface DomainRecord<T> {
  readonly id: string;
  readonly payload: Readonly<T>;
  readonly version: number;
  readonly createdAt: number;
}`,
              explanation: "Immutable record contract guaranteeing versioning and thread-safe data access."
            },
            keyTakeaways: [
              "Explicit interfaces catch 90% of contract integration bugs at compile time.",
              "Always enforce immutability on core state objects."
            ]
          },
          {
            id: `mod-${dayNumber}-2`,
            title: `Module 2: Practical Implementation & Validation`,
            overview: `Building resilient transformation pipelines for ${primarySkill}.`,
            notes: [
              "Validate input schemas defensively before executing mutations.",
              "Return structured success/failure result objects.",
              "Preserve idempotency across duplicate invocations."
            ],
            commands: ["npx vitest run"],
            codeSnippet: {
              language: "typescript",
              code: `export function processRecord<T>(record: DomainRecord<T>): DomainRecord<T> {
  return Object.freeze({
    ...record,
    version: record.version + 1,
  });
}`,
              explanation: "Deterministic transition function creating a new versioned state snapshot."
            },
            keyTakeaways: [
              "Pure functions without side effects guarantee testability and reproducibility.",
              "Increment state versions to detect concurrent update conflicts."
            ]
          }
        ],
        interviewQuestionsTopic1: [
          {
            question: `How does ${primarySkill} handle concurrency and race conditions under high throughput?`,
            answer: `In high-scale architectures, ${primarySkill} utilizes optimistic concurrency control (checking record version tags before committing writes) or distributed locks. Operations avoid unbounded shared mutable memory, preferring message queues or atomic transactional updates to guarantee serializability.`,
            difficulty: "Intermediate"
          },
          {
            question: `What architectural trade-offs are involved when choosing between synchronous RPC and asynchronous event streams in ${career}?`,
            answer: `Synchronous RPC (HTTP/gRPC) provides immediate request-response semantics and simplicity, but couples client-server availability and increases cascading failure risk. Asynchronous event streams (Kafka/RabbitMQ) decouple producers and consumers, offer high throughput buffering, and isolate failures, but introduce eventual consistency and complexity in tracing and debugging.`,
            difficulty: "Advanced"
          }
        ],

        topic2Title: `${primarySkill} Performance Optimization, Reliability & Production Hardening`,
        topic2Subtitle: "Memory management, defensive recovery policies, and high-availability design",
        topic2Theory: `### 2. High-Availability & Defensive System Engineering
Scaling ${primarySkill} into production requires robust fault tolerance, circuit breaking, and telemetry instrumentation.

#### Fault Tolerance Patterns
1. **Circuit Breaking & Jittered Backoff**:
   - Prevent cascading failures across downstream dependencies by opening circuits when failure thresholds are breached, and retrying with exponential backoff and jitter.
2. **Defensive Resource Cleanup**:
   - Always ensure memory allocations, database connections, and file handles are explicitly released during both normal teardown and unexpected panic conditions.
3. **Structured Telemetry**:
   - Output machine-parseable JSON log events containing correlation IDs to enable distributed end-to-end request tracing.`,
        topic2Comparison: {
          headers: ["Reliability Factor", "Enterprise Standard", "Common Vulnerability"],
          rows: [
            ["Network Retries", "Exponential backoff with randomized jitter", "Immediate tight-loop retries causing thundering herd"],
            ["Resource Leaks", "Strict try/finally or using-statement teardown", "Unclosed database connection handles under error paths"],
            ["Telemetry", "Structured JSON with request correlation IDs", "Ad-hoc unstructured print statements"],
            ["Traffic Surges", "Rate limiting with token bucket algorithms", "Unbounded queueing leading to memory exhaustion"],
          ]
        },
        topic2Modules: [
          {
            id: `mod-${dayNumber}-3`,
            title: `Module 3: Concurrency Hazards & Memory Management`,
            overview: `Diagnosing and mitigating memory leaks, dangling pointers, and race hazards.`,
            notes: [
              "Always pair resource allocations with explicit release mechanisms.",
              "Track in-flight requests with cancellation tokens.",
              "Profile heap growth under synthetic load testing."
            ],
            commands: ["node --inspect server.js"],
            codeSnippet: {
              language: "typescript",
              code: `export class ResourceManager {
  private active = true;
  public dispose(): void {
    this.active = false;
    // Teardown connections and listeners cleanly
  }
}`,
              explanation: "Disposable resource pattern preventing retained memory references."
            },
            keyTakeaways: [
              "Always clean up long-lived event listeners and timer handles.",
              "Monitor heap usage continuously during load spikes."
            ]
          },
          {
            id: `mod-${dayNumber}-4`,
            title: `Module 4: Performance Benchmarking & Telemetry`,
            overview: `Measuring execution latency and instrumenting production alerts.`,
            notes: [
              "Benchmark critical path functions with nanosecond precision timers.",
              "Set alerts on p95 and p99 latency regressions.",
              "Log structured context with every unhandled exception."
            ],
            commands: ["npm run benchmark"],
            codeSnippet: {
              language: "typescript",
              code: `export async function timeOperation<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const elapsed = performance.now() - start;
    if (elapsed > 200) console.warn(\`[SLOW OPERATION] \${label}: \${elapsed.toFixed(1)}ms\`);
  }
}`,
              explanation: "Execution timer decorator alerting on latency threshold breaches."
            },
            keyTakeaways: [
              "Latency budgets prevent feature bloat from degrading end-user response times.",
              "Always capture contextual tags alongside performance metrics."
            ]
          }
        ],
        interviewQuestionsTopic2: [
          {
            question: `How do you identify and diagnose a memory leak in a production ${career} environment?`,
            answer: `Memory leaks are diagnosed by: (1) observing steadily increasing memory consumption that fails to drop after garbage collection cycles, (2) capturing heap snapshots at spaced intervals and computing the diff in tools like Chrome DevTools or pprof, (3) identifying accumulating object constructors (e.g. uncleaned event listeners, cached closures, or unbounded maps), and (4) verifying that teardown methods release all held references.`,
            difficulty: "Intermediate"
          },
          {
            question: `What is the Thundering Herd problem, and what architectural strategies prevent it?`,
            answer: `The Thundering Herd problem occurs when a heavily requested cached item expires, causing hundreds of concurrent requests to simultaneously miss the cache and overwhelm the primary database with identical queries. It is prevented by: (1) using mutex locks / single-flight request coalescing so only one query refreshes the cache while others wait, (2) adding random jitter to expiration TTLs, or (3) background cache pre-warming before expiration.`,
            difficulty: "Advanced"
          }
        ],
      };
  }
}
