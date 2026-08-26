// Mock data for Sidenote app — no real API calls

// ─── Learning Threads ────────────────────────────────────────────────────────
// Used by ThreadsScreen. Each entry is one learning conversation.
export const THREADS = [
  // ── Pinned ──────────────────────────────────────────────────────────────
  {
    id: 't1',
    subject: 'DSA',
    title: 'Dynamic Programming',
    preview: 'Longest Increasing Subsequence — key patterns and recurrence relations',
    progress: 0.72,
    updatedAt: 'Today, 9:10 PM',
    pinned: true,
  },
  {
    id: 't2',
    subject: 'OS',
    title: 'Process Scheduling',
    preview: 'FCFS, SJF, Round Robin — context switch overhead and starvation',
    progress: 0.45,
    updatedAt: 'Today, 6:30 PM',
    pinned: true,
  },

  // ── Recent / unpinned ────────────────────────────────────────────────────
  {
    id: 't3',
    subject: 'DSA',
    title: 'Sorting Algorithms',
    preview: 'Merge Sort, QuickSort, Heap Sort — complexity tradeoffs explained',
    progress: 0.88,
    updatedAt: 'Yesterday',
    pinned: false,
  },
  {
    id: 't4',
    subject: 'DSA',
    title: 'Graphs',
    preview: 'BFS, DFS, Topological Sort, Shortest Paths — Dijkstra vs Bellman-Ford',
    progress: 0.55,
    updatedAt: 'Yesterday',
    pinned: false,
  },
  {
    id: 't5',
    subject: 'DBMS',
    title: 'SQL Joins & Subqueries',
    preview: 'Inner, Outer, Cross joins — correlated subqueries and performance',
    progress: 0.3,
    updatedAt: '2 days ago',
    pinned: false,
  },
  {
    id: 't6',
    subject: 'DSA',
    title: 'Recursion & Backtracking',
    preview: 'Tree recursion, subset generation, N-Queens, Sudoku solver',
    progress: 0.6,
    updatedAt: '2 days ago',
    pinned: false,
  },
  {
    id: 't7',
    subject: 'DBMS',
    title: 'Normalisation',
    preview: '1NF, 2NF, 3NF, BCNF — functional dependencies and decomposition',
    progress: 0.2,
    updatedAt: '3 days ago',
    pinned: false,
  },
  {
    id: 't8',
    subject: 'DSA',
    title: 'Arrays & Strings',
    preview: 'Sliding window, two-pointer, prefix sums — pattern recognition',
    progress: 0.95,
    updatedAt: '4 days ago',
    pinned: false,
  },
  {
    id: 't9',
    subject: 'OS',
    title: 'Memory Management',
    preview: 'Paging, segmentation, virtual memory — page replacement algorithms',
    progress: 0.4,
    updatedAt: '5 days ago',
    pinned: false,
  },
  {
    id: 't10',
    subject: 'DSA',
    title: 'Trees & BSTs',
    preview: 'Binary trees, segment trees, Fenwick trees, AVL balancing',
    progress: 0.78,
    updatedAt: '1 week ago',
    pinned: false,
  },
];

export const USER = {
  name: 'Ananya',
  email: 'ananya@example.com',
  phone: '+91 98765 43210',
  avatar: null, // will use initials
  plan: 'Glint Pro',
  creditsUsed: 628,
  creditsTotal: 1000,
  joinDate: '1 Jun 2025',
};

export const CURRENT_TOPIC = {
  id: '1',
  subject: 'DSA',
  title: 'Dynamic Programming',
  subtitle: 'Longest Increasing Subsequence',
  progress: 0.72,
  lastStudied: 'Today, 9:10 PM',
};

export const SUBJECTS = ['All', 'DSA', 'DBMS', 'OS', 'Media'];

export const NOTES = [
  {
    id: '1',
    subject: 'DSA',
    title: 'Dynamic Programming',
    preview: 'Longest Increasing Subsequence — key patterns and recurrence',
    updatedAt: '5:10 PM',
    noteCount: 6,
    color: '#E8D44D',
  },
  {
    id: '2',
    subject: 'DSA',
    title: 'Sorting Algorithms',
    preview: 'Merge Sort, QuickSort, Heap Sort — complexity tradeoffs',
    updatedAt: 'Yesterday',
    noteCount: 8,
    color: '#E87D6A',
  },
  {
    id: '3',
    subject: 'DSA',
    title: 'Graphs',
    preview: 'BFS, DFS, Topological Sort, Shortest Paths',
    updatedAt: 'Yesterday',
    noteCount: 5,
    color: '#6FCF97',
  },
  {
    id: '4',
    subject: 'DSA',
    title: 'Recursion',
    preview: 'Tree Recursion, Backtracking, Memoisation intro',
    updatedAt: '2 days ago',
    noteCount: 4,
    color: '#9B8EF2',
  },
  {
    id: '5',
    subject: 'DSA',
    title: 'Arrays & Strings',
    preview: 'Sliding window, two-pointer, prefix sums',
    updatedAt: '3 days ago',
    noteCount: 7,
    color: '#56CCF2',
  },
  {
    id: '6',
    subject: 'DSA',
    title: 'Trees',
    preview: 'Binary Trees, BST, Segment Trees, Fenwick Trees',
    updatedAt: '4 days ago',
    noteCount: 9,
    color: '#F2994A',
  },
  {
    id: '7',
    subject: 'DBMS',
    title: 'SQL Joins & Subqueries',
    preview: 'Inner, Outer, Cross joins — correlated subqueries',
    updatedAt: '5 days ago',
    noteCount: 3,
    color: '#E8D44D',
  },
  {
    id: '8',
    subject: 'OS',
    title: 'Process Scheduling',
    preview: 'FCFS, SJF, Round Robin, Priority Scheduling',
    updatedAt: '1 week ago',
    noteCount: 5,
    color: '#E87D6A',
  },
];

// ─── Per-topic individual notes ─────────────────────────────────────────────
// Keyed by NOTES[].id. Each entry is an array of individual note cards.
export const TOPIC_NOTES = {
  '1': [ // Dynamic Programming
    {
      id: 'n1-1',
      title: 'Longest Increasing Subsequence',
      preview: 'LIS can be solved in O(n²) with DP or O(n log n) with patience sorting.',
      tag: 'Concept',
      body: `The Longest Increasing Subsequence (LIS) problem asks for the length of the longest subsequence of a given sequence such that all elements are in increasing order.

**O(n²) DP approach:**
Define dp[i] = length of LIS ending at index i.
For each i, check all j < i where arr[j] < arr[i] and update dp[i] = max(dp[i], dp[j] + 1).

**O(n log n) approach:**
Maintain a "patience" array where each element is the smallest tail of all increasing subsequences of length i+1. Use binary search to find the right position.

**Key insight:** We never need to store the actual subsequence to compute its length — just the dp values.`,
      updatedAt: 'Today, 9:10 PM',
    },
    {
      id: 'n1-2',
      title: 'Memoization vs Tabulation',
      preview: 'Top-down memoization vs bottom-up tabulation — when to use each.',
      tag: 'Concept',
      body: `Both memoization and tabulation avoid recomputing overlapping subproblems, but they differ in approach.

**Memoization (Top-down):**
- Start from the original problem and recurse
- Cache results as you go (using a map or array)
- Only computes subproblems that are actually needed
- Can hit recursion stack limits on deep recursion

**Tabulation (Bottom-up):**
- Start from the smallest subproblems and build up
- Uses an explicit table filled iteratively
- No recursion overhead
- Always fills the entire table (may be wasteful)

**Rule of thumb:** Use memoization when the subproblem space is sparse; use tabulation when nearly all subproblems are needed.`,
      updatedAt: 'Today, 9:10 PM',
    },
    {
      id: 'n1-3',
      title: 'Recurrence Relation Pattern',
      preview: 'How to identify and write recurrence relations for DP problems.',
      tag: 'Insight',
      body: `Most DP problems follow a pattern: define what dp[i] (or dp[i][j]) represents, then express it in terms of smaller subproblems.

**Steps to write a recurrence:**
1. Define the state — what does dp[i] mean?
2. Identify the base case(s)
3. Express dp[i] in terms of dp[i-1], dp[i-2], etc.
4. Determine the answer (often dp[n] or max/min over all dp[i])

**Example (LIS):**
- State: dp[i] = length of LIS ending at index i
- Base: dp[i] = 1 for all i (every element is a subsequence of length 1)
- Recurrence: dp[i] = max(dp[j] + 1) for all j < i where arr[j] < arr[i]
- Answer: max(dp[0..n-1])`,
      updatedAt: 'Yesterday',
    },
    {
      id: 'n1-4',
      title: 'DP on Subsequences',
      preview: 'Classic subsequence problems: LCS, LIS, Edit Distance, Coin Change.',
      tag: 'Visual',
      body: `Subsequence problems are a major category of DP. Key problems to know:

**Longest Common Subsequence (LCS):**
dp[i][j] = LCS of first i chars of s1 and first j chars of s2.

**Edit Distance:**
dp[i][j] = min operations to convert s1[0..i] to s2[0..j].
Operations: insert, delete, replace.

**Coin Change:**
dp[amount] = min coins to make that amount.
dp[amount] = min(dp[amount - coin] + 1) for each coin.

**0/1 Knapsack:**
dp[i][w] = max value with first i items and weight limit w.
At each item: either skip it or take it (if it fits).

Each of these follows the same fundamental template — define state, write recurrence, handle base cases.`,
      updatedAt: '2 days ago',
    },
    {
      id: 'n1-5',
      title: 'State Space Reduction',
      preview: 'Tricks to reduce DP table dimensions and memory usage.',
      tag: 'Insight',
      body: `Many 2D DP tables can be reduced to 1D (or even O(1)) by observing which previous states you actually need.

**Example — 0/1 Knapsack:**
The 2D dp[i][w] table only ever reads from row i-1. So we can use a single 1D array and iterate in reverse to avoid overwriting values we still need.

**Example — Fibonacci:**
dp[n] = dp[n-1] + dp[n-2]. Instead of O(n) space, use two variables.

**General rule:**
If dp[i][...] only depends on dp[i-1][...], use rolling arrays.
If dp[i] only depends on dp[i-1] and dp[i-2], use two/three variables.

Always analyze the dependency structure before allocating full tables.`,
      updatedAt: '3 days ago',
    },
    {
      id: 'n1-6',
      title: 'Interval DP',
      preview: 'Solving problems on intervals: Matrix Chain Multiplication, Burst Balloons.',
      tag: 'Concept',
      body: `Interval DP solves problems where the answer for a range [i, j] depends on answers for sub-ranges.

**Template:**
for length = 2 to n:
  for i = 0 to n - length:
    j = i + length - 1
    for k = i to j - 1:
      dp[i][j] = min/max(dp[i][k] + dp[k+1][j] + cost(i,j,k))

**Classic problems:**
- Matrix Chain Multiplication: minimize scalar multiplications
- Burst Balloons: maximize coins collected
- Palindrome Partitioning: minimize cuts to make all parts palindromes

**Key insight:** Always iterate by increasing interval length, so that smaller sub-intervals are solved before larger ones that depend on them.`,
      updatedAt: '4 days ago',
    },
  ],
  '2': [ // Sorting Algorithms
    {
      id: 'n2-1',
      title: 'Merge Sort Deep Dive',
      preview: 'Divide-and-conquer, stable O(n log n) sort with O(n) extra space.',
      tag: 'Concept',
      body: `Merge Sort splits the array in half recursively, sorts each half, then merges them.

**Time:** O(n log n) always — divide is O(log n) levels, merge is O(n) per level.
**Space:** O(n) for the temporary merge buffer.
**Stability:** Yes — equal elements maintain their relative order.

**Merge step:**
Compare the front of both halves; take the smaller element and advance that pointer. Append remaining elements.

**When to use:**
- When stability is required
- When sorting linked lists (no extra space needed — pointers are rearranged)
- External sorting (data too large for memory)`,
      updatedAt: 'Yesterday',
    },
    {
      id: 'n2-2',
      title: 'QuickSort Partition Schemes',
      preview: 'Lomuto vs Hoare partition — pivot choice and worst-case avoidance.',
      tag: 'Concept',
      body: `QuickSort picks a pivot, partitions elements around it, and recurses on both sides.

**Lomuto partition:**
Pivot = last element. Maintain a boundary i; for each j, if arr[j] <= pivot, increment i and swap arr[i] with arr[j]. Finally swap pivot into position i+1.

**Hoare partition:**
Pivot = first element. Two pointers from ends moving inward, swapping when out of place. Generally fewer swaps than Lomuto.

**Pivot strategies to avoid O(n²) worst case:**
- Median-of-three: pick median of first, middle, last
- Random pivot: randomize pivot selection
- Introsort: fall back to heapsort when recursion depth exceeds 2·log n

**Stability:** Not stable (unless carefully implemented).`,
      updatedAt: 'Yesterday',
    },
    {
      id: 'n2-3',
      title: 'Counting & Radix Sort',
      preview: 'Linear-time sorting when input domain is bounded integers.',
      tag: 'Insight',
      body: `When the range of values k is small relative to n, comparison-based O(n log n) can be beaten.

**Counting Sort — O(n + k):**
Count frequency of each value. Compute prefix sums. Place elements into output using their count positions. Stable.

**Radix Sort — O(d·(n + k)):**
Sort digit by digit from least significant to most significant, using a stable sort (counting sort) at each digit. Works for integers, strings, dates.

**When to use:**
Counting sort: values in [0, k] with small k.
Radix sort: fixed-width keys (e.g. 32-bit ints, fixed-length strings).
Both are faster than comparison sorts only when k = O(n).`,
      updatedAt: '2 days ago',
    },
  ],
  '3': [ // Graphs
    {
      id: 'n3-1',
      title: 'BFS vs DFS — When to Use Which',
      preview: 'BFS for shortest paths in unweighted graphs; DFS for cycle detection, topological sort.',
      tag: 'Insight',
      body: `Both BFS and DFS traverse all reachable nodes, but their order and use cases differ.

**BFS (queue-based):**
- Visits nodes level by level
- Guarantees shortest path (fewest edges) in unweighted graphs
- Good for: shortest path, bipartite check, level-order traversal

**DFS (stack/recursion-based):**
- Explores as deep as possible before backtracking
- Good for: cycle detection, topological sort, connected components, SCC

**Memory comparison:**
BFS: O(width of graph) — can be huge for wide graphs.
DFS: O(depth of graph) — can be huge for deep/tall graphs.

Neither is universally better — choose based on what you need from the traversal.`,
      updatedAt: 'Yesterday',
    },
    {
      id: 'n3-2',
      title: 'Dijkstra\'s Algorithm',
      preview: 'Greedy shortest path for non-negative weighted graphs using a min-heap.',
      tag: 'Concept',
      body: `Dijkstra's finds the shortest path from a source to all other vertices in a graph with non-negative edge weights.

**Algorithm:**
1. Initialize dist[source] = 0, all others = ∞
2. Use a min-heap (priority queue) keyed by distance
3. Extract the vertex u with minimum distance
4. For each neighbor v of u: if dist[u] + weight(u,v) < dist[v], update dist[v] and push to heap

**Time complexity:** O((V + E) log V) with a binary heap.

**Correctness:** Relies on non-negative weights. Once a vertex is extracted from the heap, its distance is finalized.

**Limitation:** Does NOT work with negative edge weights. Use Bellman-Ford instead.`,
      updatedAt: 'Yesterday',
    },
    {
      id: 'n3-3',
      title: 'Topological Sort',
      preview: 'Linear ordering of DAG vertices. Kahn\'s algorithm (BFS) and DFS-based.',
      tag: 'Concept',
      body: `Topological sort orders vertices of a Directed Acyclic Graph (DAG) so that for every directed edge u → v, u comes before v.

**Kahn's Algorithm (BFS-based):**
1. Compute in-degree of all vertices
2. Add all zero in-degree vertices to a queue
3. While queue is non-empty: dequeue u, add to result, decrement in-degree of neighbors; if any reach 0, enqueue them
4. If result has fewer than V vertices → cycle detected

**DFS-based:**
Run DFS, pushing vertices to a stack on finish. Reverse the stack.

**Applications:**
- Build systems (compile order)
- Course prerequisites
- Event scheduling

Only valid on DAGs. If a cycle exists, no valid ordering exists.`,
      updatedAt: '2 days ago',
    },
  ],
  '4': [ // Recursion
    {
      id: 'n4-1',
      title: 'Recursion Mental Model',
      preview: 'Think in terms of: what does this function return? Trust the recursion.',
      tag: 'Insight',
      body: `The hardest part of recursion is trusting that recursive calls work correctly without tracing every step.

**The key mental model:**
1. Define what your function does (its contract)
2. Handle the base case
3. Assume the recursive call works correctly and use its result

**Example — sum of list:**
sum([]) = 0                         // base case
sum([head, ...tail]) = head + sum(tail)  // trust sum(tail) is correct

Don't try to trace the full call stack in your head for complex problems. Instead, verify the base case is correct and the recursive step correctly reduces toward the base case.`,
      updatedAt: '2 days ago',
    },
    {
      id: 'n4-2',
      title: 'Backtracking Template',
      preview: 'The choose → explore → unchoose pattern for exhaustive search.',
      tag: 'Concept',
      body: `Backtracking is recursion with the ability to undo choices that lead to dead ends.

**Template:**
\`\`\`
function backtrack(state, choices):
  if isGoal(state):
    record(state)
    return
  for each choice in choices:
    makeChoice(choice)       // choose
    backtrack(state, ...)    // explore
    undoChoice(choice)       // unchoose
\`\`\`

**Classic problems:**
- N-Queens: place queens row by row, backtrack when conflicts arise
- Sudoku: try digits 1–9 in each empty cell
- Subset generation: at each element, choose to include or exclude
- Permutations: at each position, try unused elements

**Pruning:** The power of backtracking comes from early termination — if a partial state can't lead to a valid solution, don't explore further.`,
      updatedAt: '3 days ago',
    },
  ],
  '5': [ // Arrays & Strings
    {
      id: 'n5-1',
      title: 'Sliding Window Technique',
      preview: 'Fixed and variable-size windows for subarray/substring problems.',
      tag: 'Concept',
      body: `The sliding window technique avoids nested loops by maintaining a window of elements and sliding it across the array.

**Fixed-size window:**
Compute result for first window. Slide by removing leftmost element and adding new rightmost element. O(n) instead of O(n·k).

**Variable-size window (two pointers):**
Expand right pointer when condition is satisfiable. Shrink left pointer when condition is violated.

**Classic problems:**
- Max sum subarray of size k (fixed)
- Longest substring without repeating characters (variable)
- Minimum window substring (variable)
- Longest subarray with sum ≤ k (variable)

**Key pattern:** Ask "does expanding help?" and "does shrinking restore the invariant?"`,
      updatedAt: '3 days ago',
    },
    {
      id: 'n5-2',
      title: 'Two Pointer Patterns',
      preview: 'Same direction, opposite ends — recognizing when two pointers apply.',
      tag: 'Visual',
      body: `Two pointers are used when you need to compare or process pairs of elements efficiently.

**Opposite ends (converging):**
Start left=0, right=n-1. Move based on some condition.
- Two sum in sorted array
- Container with most water
- Valid palindrome check

**Same direction (fast/slow):**
Both pointers move right; one leads.
- Sliding window (as above)
- Removing duplicates from sorted array in-place
- Floyd's cycle detection in linked list

**When to use:**
- Array/string is sorted (or can be)
- You need O(1) extra space
- Brute force is O(n²) and you suspect O(n) is possible

The key is finding an invariant: what relationship must hold between the pointers?`,
      updatedAt: '4 days ago',
    },
  ],
  '6': [ // Trees
    {
      id: 'n6-1',
      title: 'Tree Traversal Orders',
      preview: 'Inorder, Preorder, Postorder — what each reveals about the tree.',
      tag: 'Concept',
      body: `Three fundamental ways to traverse a binary tree, each useful for different purposes.

**Inorder (Left → Root → Right):**
For a BST, inorder traversal yields elements in sorted ascending order.
Use for: BST validation, k-th smallest element.

**Preorder (Root → Left → Right):**
Visits root before children. Good for copying/serializing a tree.
Use for: tree serialization, directory listing.

**Postorder (Left → Right → Root):**
Visits root after children. Good for deletion (delete children before parent).
Use for: evaluating expression trees, computing subtree properties.

**Level-order (BFS):**
Visit level by level using a queue.
Use for: minimum depth, level averages, right side view.`,
      updatedAt: '4 days ago',
    },
  ],
  '7': [ // SQL
    {
      id: 'n7-1',
      title: 'JOIN Types Explained',
      preview: 'INNER, LEFT, RIGHT, FULL OUTER, CROSS — with visual intuition.',
      tag: 'Visual',
      body: `SQL JOINs combine rows from two or more tables based on a related column.

**INNER JOIN:** Returns rows where the join condition matches in BOTH tables. Excludes non-matching rows from either side.

**LEFT (OUTER) JOIN:** Returns ALL rows from the left table, with NULLs for non-matching right table columns.

**RIGHT (OUTER) JOIN:** Returns ALL rows from the right table, with NULLs for non-matching left table columns.

**FULL OUTER JOIN:** Returns ALL rows from BOTH tables. NULLs where no match exists on either side.

**CROSS JOIN:** Returns the Cartesian product — every combination of rows. No join condition needed. Result has m × n rows.

**Self JOIN:** A table joined with itself. Useful for hierarchical data (manager → employee).`,
      updatedAt: '5 days ago',
    },
  ],
  '8': [ // OS
    {
      id: 'n8-1',
      title: 'CPU Scheduling Algorithms',
      preview: 'FCFS, SJF, Round Robin, Priority — tradeoffs in throughput and fairness.',
      tag: 'Concept',
      body: `CPU scheduling decides which process runs next when the CPU is free.

**FCFS (First Come First Served):**
Simple queue. No preemption. High average waiting time if a long job arrives first (convoy effect).

**SJF (Shortest Job First):**
Picks the job with smallest burst time. Optimal average waiting time (non-preemptive). Can cause starvation of long processes.

**Round Robin:**
Each process gets a fixed time quantum. After quantum expires, it goes to the back of the queue. Good fairness, poor for CPU-bound tasks if quantum is too small (high context-switch overhead).

**Priority Scheduling:**
Higher priority runs first. Can preempt lower-priority processes. Starvation risk — solved with aging (gradually raise priority of waiting processes).

**Multilevel Queue:** Different queues for different process types, each with its own scheduling algorithm.`,
      updatedAt: '1 week ago',
    },
  ],
};

// ─── Notebook content blocks ────────────────────────────────────────────────
// Each block has a `type` that NotebookBlock renders differently.
// Types: paragraph | code | diagram | result | divider | actions | think
export const NOTEBOOK_CONTENT = [
  {
    id: 'b1',
    type: 'paragraph',
    segments: [
      { text: 'When working with arrays in DP, the key is to make decisions based on ' },
      { text: 'previous results', highlight: true },
      { text: ', ' },
      { text: 'not', underline: true },
      { text: ' by reordering the array.' },
    ],
  },
  {
    id: 'b2',
    type: 'paragraph',
    segments: [
      { text: "Let's take " },
      { text: 'Longest Increasing Subsequence (LIS)', highlight: true },
      { text: ' as an example.' },
    ],
  },
  {
    id: 'b3',
    type: 'paragraph',
    text: 'We have an array:',
  },
  {
    id: 'b4',
    type: 'code',
    code: 'arr = [35, 3, 2, 5, 3, 7, 101, 18]',
  },
  {
    id: 'b5',
    type: 'paragraph',
    segments: [
      { text: "We don't sort or reorder this.\nWe explore " },
      { text: 'subsequences', highlight: true },
      { text: ' as we move forward.' },
    ],
  },
  {
    id: 'b6',
    type: 'paragraph',
    text: 'At every index, we ask:\n"What is the length of the LIS ending at this index?"',
  },
  {
    id: 'b7',
    type: 'diagram',
    indices:       [0, 1, 2, 3, 4, 5, 6, 7],
    values:        [35, 3, 2, 5, 3, 7, 101, 18],
    highlighted:   [6],
    dp:            [1, 1, 1, 2, 2, 3, 4, 3],
    dpHighlighted: [5, 6],
    annotation:    'length of LIS\nending at each index',
  },
  {
    id: 'b8',
    type: 'result',
    text: 'The maximum of this array is 4.\nSo, LIS = 4  →',
    resultCode: ' [3, 5, 7, 101]',
  },
  {
    id: 'b10',
    type: 'divider',
  },
  {
    id: 'b11',
    type: 'think',
    question: 'Why is the LIS ending at index 7 equal to 3?',
    hint: 'Take a moment. Try to think it through before looking below.',
    answer:
      "At index 7, the value is 18. Looking back, the best increasing chain ending before 18 is 2 → 5 → 7 (length 3). Adding 18 extends it — but 101 > 18 so we can't include that. So the LIS ending at 18 is 3, not 4.",
  },
];

// Kept for backward compatibility — no longer rendered by ChatScreen
export const CHAT_MESSAGES = [];

export const QUICK_ACTIONS = [
  { id: 'syllabus', label: 'Syllabus', icon: 'book-outline' },
  { id: 'notes', label: 'Notes', icon: 'document-text-outline' },
  { id: 'assignment', label: 'Assignment', icon: 'clipboard-outline' },
  { id: 'testme', label: 'Test Me', icon: 'flash-outline' },
];

export const PROFILE_STATS = {
  topicsStudied: 24,
  hoursThisWeek: 48,
  streak: 7,
};

export const LEARNING_INSIGHTS = [
  {
    id: '1',
    icon: '👁',
    text: 'You understand better with visual explanations.',
  },
  {
    id: '2',
    icon: '⏱',
    text: 'You tend to rush problem solving. Take a minute to plan first.',
  },
];

export const USAGE_THIS_MONTH = [
  { label: 'visual explanations', icon: 'eye-outline', count: 38 },
  { label: 'practice tests', icon: 'flash-outline', count: 12 },
  { label: 'pdf exports', icon: 'document-outline', count: 9 },
  { label: 'uploads', icon: 'cloud-upload-outline', count: 10 },
];

export const ONBOARDING_SLIDES = [
  {
    id: '1',
    emoji: '📖',
    title: 'Learn smarter,\nnot harder.',
    subtitle: 'Sidenote is your personal AI study partner — ask anything, explore everything.',
  },
  {
    id: '2',
    emoji: '✍️',
    title: 'Notes that\nthink with you.',
    subtitle: 'Your conversations become structured notes automatically. No manual effort.',
  },
  {
    id: '3',
    emoji: '⚡',
    title: 'Test yourself,\ntrack progress.',
    subtitle: 'Quick tests, visual explanations, and insights — all in one place.',
  },
];
