/**
 * Synthetic demo customers for RecallDesk hackathon demos.
 * Seeded into Hindsight via POST /api/demo/seed (idempotent).
 */
export const DEMO_SEED_VERSION = 'recalldesk-demo-v1';

export const demoCustomers = [
  {
    id: 'sarah-wilson',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    scenario: 'payment failure',
    previousSolution: 'UPI',
    preference: 'concise responses',
    unresolvedIssue: 'refund status',
    customerMessage: 'My payment failed again.',
    assistantResponse:
      'I remember you had a similar payment issue during your previous renewal. UPI worked successfully last time. Would you like to try that again? Also still tracking your refund status — I can check that next if you prefer.',
  },
  {
    id: 'david-miller',
    name: 'David Miller',
    email: 'david.miller@example.com',
    scenario: 'account locked',
    previousSolution: 'password reset',
    preference: 'detailed instructions',
    unresolvedIssue: 'account recovery',
    customerMessage: 'My account is locked again and I cannot sign in.',
    assistantResponse:
      'I remember your account was locked before and a password reset resolved it. Here is a detailed recovery path: 1) request a reset link, 2) choose a new password, 3) sign in and confirm MFA. Account recovery is still open on our side if this does not unblock you.',
  },
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    scenario: 'delayed refund',
    previousSolution: 'refund manually initiated',
    preference: 'status updates',
    unresolvedIssue: 'refund confirmation',
    customerMessage: 'My refund still has not arrived.',
    assistantResponse:
      'I remember we manually initiated your refund after the delay. You prefer status updates, so here is the current state: processing continues and we are waiting on refund confirmation. I will keep you posted as that status changes.',
  },
];

export function demoSeedDocumentId(customerId) {
  return `${DEMO_SEED_VERSION}-${customerId}`;
}

export function buildDemoSeedContent(customer) {
  return [
    `DEMO_SEED_MARKER: ${DEMO_SEED_VERSION}`,
    `Customer ID: ${customer.id}`,
    `Customer name: ${customer.name}`,
    '',
    'Customer message:',
    `"${customer.customerMessage}"`,
    '',
    'Assistant response:',
    `"${customer.assistantResponse}"`,
    '',
    'Demo profile facts:',
    `- Scenario: ${customer.scenario}`,
    `- Previous solution: ${customer.previousSolution}`,
    `- Preference: ${customer.preference}`,
    `- Unresolved issue: ${customer.unresolvedIssue}`,
    '',
    'Context:',
    '"RecallDesk synthetic demo seed conversation."',
  ].join('\n');
}
