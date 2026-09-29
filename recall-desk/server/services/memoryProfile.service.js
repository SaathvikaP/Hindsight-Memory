import { classifyMemoryCategory, CATEGORIES } from './memoryTransparency.service.js';

function isRecentInteraction(memory) {
  const text = String(memory.text || memory.content || '').toLowerCase();
  const context = String(memory.context || '').toLowerCase();

  // Only treat conversation-shaped retained content as "Recent Interactions".
  // Derived facts/observations should be categorized by meaning instead.
  if (
    text.includes('customer message:') &&
    text.includes('assistant response:')
  ) {
    return true;
  }

  if (
    context.includes('recalldesk customer support interaction') &&
    text.includes('customer id:') &&
    text.includes('customer message:')
  ) {
    return true;
  }

  return false;
}

function toMemoryItem(memory) {
  const content = (memory.text || memory.content || '').trim();
  if (!content) return null;

  return {
    content,
    type: memory.type || null,
    timestamp: memory.timestamp || null,
  };
}

/**
 * Structure raw Hindsight memories into dashboard sections.
 * Does not invent facts — only organizes recalled content.
 */
export function structureCustomerMemoryProfile(rawMemories = []) {
  const previousIssues = [];
  const previousSolutions = [];
  const preferences = [];
  const unresolvedIssues = [];
  const recentInteractions = [];

  for (const memory of rawMemories) {
    const item = toMemoryItem(memory);
    if (!item) continue;

    if (isRecentInteraction(memory)) {
      recentInteractions.push(item);
      continue;
    }

    const category = classifyMemoryCategory(item.content);

    if (category === CATEGORIES.PREFERENCE) {
      preferences.push(item);
    } else if (category === CATEGORIES.UNRESOLVED) {
      unresolvedIssues.push(item);
    } else if (category === CATEGORIES.PREVIOUS_SOLUTION) {
      previousSolutions.push(item);
    } else {
      previousIssues.push(item);
    }
  }

  const totalCount =
    previousIssues.length +
    previousSolutions.length +
    preferences.length +
    unresolvedIssues.length +
    recentInteractions.length;

  return {
    previousIssues,
    previousSolutions,
    preferences,
    unresolvedIssues,
    recentInteractions,
    totalCount,
  };
}
