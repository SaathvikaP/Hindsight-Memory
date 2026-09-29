/**
 * Classify recalled Hindsight memories for dashboard transparency.
 * Relevance is categorical only (high / medium / low) — never numeric scores.
 */

const CATEGORIES = {
  PREVIOUS_ISSUE: 'Previous Issue',
  PREVIOUS_SOLUTION: 'Previous Solution',
  PREFERENCE: 'Preference',
  UNRESOLVED: 'Unresolved Issue',
};

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function overlapCount(messageTokens, contentTokens) {
  const set = new Set(messageTokens);
  let count = 0;
  for (const token of contentTokens) {
    if (set.has(token)) count += 1;
  }
  return count;
}

/**
 * Map memory text to a support-facing category using keyword heuristics.
 * Does not invent facts — only labels existing recalled content.
 */
export function classifyMemoryCategory(content) {
  const text = String(content || '').toLowerCase();

  // Solutions before preferences — multi-fact memories often mention both.
  if (
    /\b(previous solution|resolved|successfully|fixed|issued|refunded|resent|upgraded|troubleshooting|worked successfully)\b/.test(
      text
    ) ||
    /\bsolution\b/.test(text)
  ) {
    return CATEGORIES.PREVIOUS_SOLUTION;
  }

  if (
    /\b(prefer|prefers|preference|timezone|concise|email follow|phone|channel|detailed instructions|status updates)\b/.test(
      text
    )
  ) {
    return CATEGORIES.PREFERENCE;
  }

  if (
    /\b(unresolved|still (marked|open|pending|awaiting)|awaiting|open ticket|in transit|not yet|pending)\b/.test(
      text
    )
  ) {
    return CATEGORIES.UNRESOLVED;
  }

  if (
    /\b(fail|failed|failure|issue|problem|charge|delay|error|duplicate|complaint|reported|locked|account)\b/.test(
      text
    )
  ) {
    return CATEGORIES.PREVIOUS_ISSUE;
  }

  return CATEGORIES.PREVIOUS_ISSUE;
}

/**
 * Assign categorical relevance from token overlap with the current message.
 */
export function classifyRelevance(currentMessage, content) {
  const messageTokens = tokenize(currentMessage);
  const contentTokens = tokenize(content);
  const overlap = overlapCount(messageTokens, contentTokens);

  if (overlap >= 3) return 'high';
  if (overlap >= 1) return 'medium';
  return 'low';
}

/**
 * Build transparency records for the dashboard (not for the customer reply text).
 *
 * @param {string} currentMessage
 * @param {Array<{ text?: string, type?: string|null, content?: string }>} memories
 * @returns {Array<{ type: string, category: string, content: string, relevance: 'high'|'medium'|'low' }>}
 */
export function buildMemoryTransparency(currentMessage, memories) {
  return (memories || [])
    .map((memory) => {
      const content = (memory.content || memory.text || '').trim();
      if (!content) return null;

      const category = classifyMemoryCategory(content);
      const relevance = classifyRelevance(currentMessage, content);
      const type = memory.type || 'experience';

      return {
        type,
        category,
        content,
        relevance,
      };
    })
    .filter(Boolean);
}

export { CATEGORIES };
