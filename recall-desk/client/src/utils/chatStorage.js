const SELECTED_CUSTOMER_KEY = 'recalldesk_selected_customer';

function chatKey(customerId) {
  return `recalldesk_chat_${customerId}`;
}

function isValidMessage(message) {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.id === 'string' &&
    message.id.trim() &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string'
  );
}

/**
 * Load chat history for a customer from localStorage.
 * Returns [] for missing/malformed data. Never touches API keys.
 */
export function loadChatHistory(customerId) {
  if (!customerId || typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(chatKey(customerId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set();
    const messages = [];

    for (const item of parsed) {
      if (!isValidMessage(item)) continue;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      messages.push({
        id: item.id,
        role: item.role,
        content: item.content,
        time: typeof item.time === 'string' ? item.time : undefined,
        timestamp:
          typeof item.timestamp === 'string'
            ? item.timestamp
            : new Date().toISOString(),
      });
    }

    return messages;
  } catch {
    return [];
  }
}

/**
 * Persist chat history for a customer. Deduplicates by message id.
 */
export function saveChatHistory(customerId, messages) {
  if (!customerId || typeof window === 'undefined') return;

  try {
    const seen = new Set();
    const safe = [];

    for (const message of messages || []) {
      if (!isValidMessage(message)) continue;
      if (seen.has(message.id)) continue;
      seen.add(message.id);
      safe.push({
        id: message.id,
        role: message.role,
        content: message.content,
        time: message.time,
        timestamp: message.timestamp || new Date().toISOString(),
      });
    }

    window.localStorage.setItem(chatKey(customerId), JSON.stringify(safe));
  } catch (error) {
    console.error('[CHAT_STORAGE] Failed to save history:', error.message || error);
  }
}

export function loadSelectedCustomerId(fallbackId) {
  if (typeof window === 'undefined') return fallbackId;
  try {
    return window.localStorage.getItem(SELECTED_CUSTOMER_KEY) || fallbackId;
  } catch {
    return fallbackId;
  }
}

export function saveSelectedCustomerId(customerId) {
  if (!customerId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SELECTED_CUSTOMER_KEY, customerId);
  } catch {
    /* ignore quota errors */
  }
}

export function createMessageId(role) {
  return `${role === 'user' ? 'u' : 'a'}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
