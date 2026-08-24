// Mock data for Sidenote app — no real API calls

export const USER = {
  name: 'Ananya',
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

export const CHAT_MESSAGES = [
  {
    id: '1',
    type: 'assistant',
    content: 'You sorted the array… then tried DP on that? That\'s not how this works. Let\'s fix it.',
    timestamp: '9:10 PM',
  },
  {
    id: '2',
    type: 'note',
    title: 'watch this.',
    code: `arr = [35, 3, 2, 5, 3, 7, 101, 18]

not sorted order:`,
    tableRows: [
      ['1', '1', '2', '3', '4', '5', '6'],
      ['', '', '', '', '4', '', ''],
    ],
    highlight: 'LIS = 4 ✦',
    timestamp: '9:11 PM',
  },
  {
    id: '3',
    type: 'assistant',
    content: 'See the pattern? You extend from previous values, not reorder them.\nTry a quick one —',
    timestamp: '9:12 PM',
  },
];

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
