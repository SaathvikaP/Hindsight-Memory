export const customers = [
  {
    id: 'sarah-wilson',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    status: 'Returning customer',
    plan: 'Pro',
    customerSince: 'Mar 2024',
    scenario: 'payment failure',
    previousSolution: 'UPI',
    preference: 'concise responses',
    unresolvedIssue: 'refund status',
  },
  {
    id: 'david-miller',
    name: 'David Miller',
    email: 'david.miller@example.com',
    status: 'Returning customer',
    plan: 'Plus',
    customerSince: 'Jan 2025',
    scenario: 'account locked',
    previousSolution: 'password reset',
    preference: 'detailed instructions',
    unresolvedIssue: 'account recovery',
  },
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    status: 'Returning customer',
    plan: 'Pro',
    customerSince: 'Aug 2024',
    scenario: 'delayed refund',
    previousSolution: 'refund manually initiated',
    preference: 'status updates',
    unresolvedIssue: 'refund confirmation',
  },
];

/** @deprecated use customers[0] — kept for older imports */
export const customer = customers[0];

export const memoriesByCustomer = {
  'sarah-wilson': {
    previousIssues: ['Payment failure during renewal'],
    previousSolutions: ['UPI succeeded on previous renewal attempt'],
    preferences: ['Prefers concise responses'],
    unresolvedIssues: ['Refund status still open'],
  },
  'david-miller': {
    previousIssues: ['Account locked / unable to sign in'],
    previousSolutions: ['Password reset restored access'],
    preferences: ['Prefers detailed instructions'],
    unresolvedIssues: ['Account recovery still in progress'],
  },
  'priya-sharma': {
    previousIssues: ['Delayed refund'],
    previousSolutions: ['Refund manually initiated'],
    preferences: ['Prefers status updates'],
    unresolvedIssues: ['Awaiting refund confirmation'],
  },
};

export const customerMemory = memoriesByCustomer['sarah-wilson'];

export const learningTimeline = [
  { id: 't1', label: 'Interaction 1', detail: 'Sarah reported a payment failure' },
  { id: 't2', label: 'Memory stored', detail: 'UPI solution + concise preference saved' },
  { id: 't3', label: 'Interaction 2', detail: 'Sarah asked about refund status' },
  { id: 't4', label: 'Memory recalled', detail: 'Prior payment + refund context loaded' },
  { id: 't5', label: 'Personalized response', detail: 'Agent referenced past solution & preference' },
];
