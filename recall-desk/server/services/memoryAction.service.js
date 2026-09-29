import { CATEGORIES } from './memoryTransparency.service.js';

/**
 * Derive a Memory → Action suggestion strictly from classified recall results.
 * Returns null when no Previous Solution memory is available.
 * Never invents facts or triggers financial transactions.
 */

function pickBest(memories) {
  const rank = { high: 3, medium: 2, low: 1 };
  return [...(memories || [])].sort(
    (a, b) => (rank[b.relevance] || 0) - (rank[a.relevance] || 0)
  )[0];
}

function firstSentence(text, maxLen = 160) {
  const cleaned = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';

  const sentence = cleaned.split(/(?<=[.!?])\s+/)[0] || cleaned;
  if (sentence.length <= maxLen) return sentence;
  return `${sentence.slice(0, maxLen - 1).trim()}…`;
}

/**
 * Pull a short solution label from memory text using conservative patterns.
 * Falls back to a short quote from the memory — never invents a new solution.
 */
function extractSolutionLabel(content) {
  const text = String(content || '');
  const lower = text.toLowerCase();

  const patterns = [
    {
      test: /\bupi\b/i,
      label: 'UPI payment',
    },
    {
      test: /\bpassword reset\b/i,
      label: 'password reset',
    },
    {
      test: /\bmanually initiated\b.*\brefund\b|\brefund\b.*\bmanually initiated\b/i,
      label: 'manually initiated refund',
    },
    {
      test: /\brefund\b/i,
      label: 'refund process',
    },
    {
      test: /\bmfa\b|\bmulti[- ]factor\b/i,
      label: 'MFA reset',
    },
  ];

  for (const pattern of patterns) {
    if (pattern.test.test(text)) return pattern.label;
  }

  const solutionMatch = text.match(
    /(?:previous solution|solution|resolved (?:via|with|by)|successfully)\s*[:\-]?\s*([^.!\n]{3,80})/i
  );
  if (solutionMatch?.[1]) {
    return solutionMatch[1].trim();
  }

  // Last resort: short excerpt from the solution memory itself
  return firstSentence(text, 90);
}

function extractProblemLabel(content) {
  const text = String(content || '');

  const patterns = [
    { test: /\bpayment fail/i, label: 'Payment failure' },
    { test: /\baccount lock/i, label: 'Account locked' },
    { test: /\bdelayed refund|\brefund.*delay|\bdelay.*refund/i, label: 'Delayed refund' },
    { test: /\blogin|sign[- ]?in/i, label: 'Sign-in issue' },
    { test: /\brefund/i, label: 'Refund issue' },
  ];

  for (const pattern of patterns) {
    if (pattern.test.test(text)) return pattern.label;
  }

  const issueMatch = text.match(
    /(?:scenario|issue|problem|reported|experiencing)\s*[:\-]?\s*([^.!\n]{3,80})/i
  );
  if (issueMatch?.[1]) {
    return issueMatch[1].trim().replace(/^\w/, (c) => c.toUpperCase());
  }

  return firstSentence(text, 90);
}

function extractPreferenceLabel(content) {
  const text = String(content || '');
  const lower = text.toLowerCase();

  if (/\bconcise\b/.test(lower)) return 'Concise instructions';
  if (/\bdetailed\b/.test(lower)) return 'Detailed instructions';
  if (/\bstatus updates?\b/.test(lower)) return 'Status updates';

  // Prefer an explicit "prefers X" clause over unrelated earlier sentences.
  const prefersClause = text.match(
    /\bprefers?\s+([^.!\n]{3,80})/i
  );
  if (prefersClause?.[1]) {
    return prefersClause[1].trim().replace(/^\w/, (c) => c.toUpperCase());
  }

  const preferMatch = text.match(
    /(?:preference)\s*[:\-]?\s*([^.!\n]{3,80})/i
  );
  if (preferMatch?.[1]) {
    return preferMatch[1].trim().replace(/^\w/, (c) => c.toUpperCase());
  }

  return firstSentence(text, 90);
}

function buildComposerDraft({ previousSolution, preference, detectedProblem }) {
  const solution = previousSolution;
  const wantsConcise =
    preference && /\bconcise\b/i.test(preference);

  if (wantsConcise) {
    return `I remember ${solution} worked for you before on a similar ${detectedProblem.toLowerCase()}. Want to try that again?`;
  }

  if (preference) {
    return `I remember a previous successful approach for this kind of ${detectedProblem.toLowerCase()}: ${solution}. Based on your preference for ${preference.toLowerCase()}, I can walk you through that same path — without starting any payment or refund myself. Would you like to continue?`;
  }

  return `I remember ${solution} resolved a similar ${detectedProblem.toLowerCase()} for you previously. I can guide you through that same approach (I won't run any payment or refund automatically). Shall we try it?`;
}

/**
 * @param {string} currentMessage
 * @param {Array<{ category: string, content: string, relevance?: string }>} memories
 * @returns {null | {
 *   available: true,
 *   detectedProblem: string,
 *   previousSolution: string,
 *   preference: string | null,
 *   suggestedNextStep: string,
 *   composerDraft: string,
 *   disclaimer: string,
 *   sources: { category: string, content: string }[]
 * }}
 */
export function buildMemoryAction(currentMessage, memories) {
  const list = Array.isArray(memories) ? memories : [];

  const looksLikeSolution = (content) =>
    /\b(previous solution|worked successfully|successfully|resolved (?:via|with|by)|password reset|upi|manually initiated)\b/i.test(
      String(content || '')
    );

  const solutions = list.filter(
    (m) =>
      m.content?.trim() &&
      (m.category === CATEGORIES.PREVIOUS_SOLUTION ||
        looksLikeSolution(m.content))
  );

  if (!solutions.length) {
    return null;
  }

  const solutionMemory = pickBest(solutions);
  const issueMemory = pickBest(
    list.filter(
      (m) =>
        m.content?.trim() &&
        (m.category === CATEGORIES.PREVIOUS_ISSUE ||
          /\b(fail|failure|locked|refund|issue|problem)\b/i.test(m.content))
    )
  );
  const preferenceCandidates = list.filter((m) => {
    if (!m.content?.trim()) return false;
    if (
      /\b(concise|detailed instructions|status updates|prefers?\s+)/i.test(
        m.content
      )
    ) {
      return true;
    }
    return m.category === CATEGORIES.PREFERENCE;
  });

  // Prefer communication-style preferences over payment-method wording.
  const stylePrefs = preferenceCandidates.filter((m) =>
    /\b(concise|detailed|status updates)\b/i.test(m.content)
  );
  const preferenceMemory = pickBest(
    stylePrefs.length ? stylePrefs : preferenceCandidates
  );

  const previousSolution = extractSolutionLabel(solutionMemory.content);

  // Problem must come from retrieved memories (issue first, else solution text).
  const detectedProblem = issueMemory
    ? extractProblemLabel(issueMemory.content)
    : extractProblemLabel(solutionMemory.content);

  if (!detectedProblem || !previousSolution) {
    return null;
  }

  const preference = preferenceMemory
    ? extractPreferenceLabel(preferenceMemory.content)
    : null;

  const suggestedNextStep = `Guide customer through ${previousSolution}`;

  const sources = [solutionMemory, issueMemory, preferenceMemory]
    .filter(Boolean)
    .map((m) => ({
      category: m.category,
      content: m.content,
      relevance: m.relevance,
    }));

  return {
    available: true,
    detectedProblem,
    previousSolution,
    preference,
    suggestedNextStep,
    composerDraft: buildComposerDraft({
      previousSolution,
      preference,
      detectedProblem,
    }),
    disclaimer:
      'Derived only from retrieved memories. Does not execute payments, refunds, or other financial transactions.',
    sources,
  };
}
