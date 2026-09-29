import { HindsightClient, HindsightError } from '@vectorize-io/hindsight-client';
import {
  DEMO_SEED_VERSION,
  buildDemoSeedContent,
  demoCustomers,
  demoSeedDocumentId,
} from '../data/demoCustomers.js';

let client = null;

function isUnsetOrPlaceholder(value, placeholder) {
  if (!value || !String(value).trim()) return true;
  const normalized = String(value).trim();
  return (
    normalized === placeholder ||
    normalized.startsWith('your_') ||
    normalized.includes('your_hindsight') ||
    normalized.includes('your_groq')
  );
}

/**
 * Lazily create a shared Hindsight Cloud client.
 * API key stays on the server — never send it to the frontend.
 */
function getClient() {
  const apiKey = process.env.HINDSIGHT_API_KEY;

  if (isUnsetOrPlaceholder(apiKey, 'your_hindsight_api_key_here')) {
    throw new Error(
      'HINDSIGHT_API_KEY is missing or still set to the placeholder in server/.env. ' +
        'Replace it with a real key from https://ui.hindsight.vectorize.io → Connect → Create API Key. ' +
        'Never put this key in the React app.'
    );
  }

  if (!client) {
    client = new HindsightClient({
      baseUrl:
        process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io',
      apiKey: apiKey.trim(),
    });
  }

  return client;
}

function getBankId() {
  const bankId = process.env.HINDSIGHT_BANK_ID;

  if (isUnsetOrPlaceholder(bankId, 'your_hindsight_bank_id_here')) {
    throw new Error(
      'HINDSIGHT_BANK_ID is missing or still set to the placeholder in server/.env. ' +
        'Replace it with your Memory Bank ID from https://ui.hindsight.vectorize.io.'
    );
  }

  return bankId.trim();
}

function customerTag(customerId) {
  return `customer:${customerId}`;
}

/**
 * Strip common sensitive patterns before sending text to Hindsight.
 */
function sanitizeForMemory(text) {
  if (typeof text !== 'string') return '';

  return text
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_CARD]')
    .replace(
      /\b(?:password|passwd|pwd)\s*[:=]\s*\S+/gi,
      'password: [REDACTED]'
    )
    .replace(
      /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|bearer|secret)\s*[:=]\s*\S+/gi,
      '[REDACTED_SECRET]'
    )
    .replace(/\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
    .replace(
      /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
      '[REDACTED_JWT]'
    )
    .replace(/gsk_[A-Za-z0-9]+/gi, '[REDACTED]')
    .replace(/hsk_[A-Za-z0-9_]+/gi, '[REDACTED]');
}

function normalizeMemories(recallResponse) {
  const results = recallResponse?.results ?? [];

  return results.map((memory) => ({
    id: memory.id ?? null,
    text: memory.text ?? '',
    type: memory.type ?? null,
    context: memory.context ?? null,
    metadata: memory.metadata ?? {},
    tags: memory.tags ?? [],
    entities: memory.entities ?? [],
    timestamp:
      memory.occurred_start ||
      memory.mentioned_at ||
      memory.occurred_end ||
      null,
  }));
}

function formatHindsightError(operation, error) {
  if (error instanceof HindsightError) {
    return new Error(
      `[HINDSIGHT] ${operation} failed (status ${error.statusCode ?? 'unknown'}): ${error.message}`
    );
  }

  return new Error(
    `[HINDSIGHT] ${operation} failed: ${error.message || String(error)}`
  );
}

/**
 * Recall memories relevant to the customer's current message.
 */
export async function recallCustomerMemories(customerId, message) {
  if (!customerId) {
    throw new Error('recallCustomerMemories requires a customerId');
  }
  if (!message || typeof message !== 'string') {
    throw new Error('recallCustomerMemories requires a message string');
  }

  const safeMessage = sanitizeForMemory(message);
  const query = [
    `Customer support recall for customer ${customerId}.`,
    `Current problem: ${safeMessage}`,
    'Also find: previous solutions, customer preferences, payment methods, and unresolved issues.',
  ].join(' ');

  console.log('[HINDSIGHT] Recall started');

  try {
    const hindsight = getClient();
    const bankId = getBankId();

    const response = await hindsight.recall(bankId, query, {
      budget: 'mid',
      types: ['world', 'experience', 'observation'],
      preferObservations: true,
      includeEntities: true,
      tags: [customerTag(customerId)],
      tagsMatch: 'any_strict',
      maxTokens: 2048,
    });

    const memories = normalizeMemories(response);
    console.log(`[HINDSIGHT] Recall succeeded: ${memories.length} memories`);
    return memories;
  } catch (error) {
    console.error('[HINDSIGHT] Recall FAILED:', error.message || error);
    throw formatHindsightError('recall', error);
  }
}

/**
 * Store a customer ↔ assistant turn in Hindsight after Groq responds.
 *
 * @param {string} customerId
 * @param {string} customerName
 * @param {string} customerMessage
 * @param {string} assistantResponse
 */
export async function retainConversation(
  customerId,
  customerName,
  customerMessage,
  assistantResponse
) {
  if (!customerId) {
    throw new Error('retainConversation requires a customerId');
  }
  if (!customerMessage || !assistantResponse) {
    throw new Error(
      'retainConversation requires both customerMessage and assistantResponse'
    );
  }

  const timestamp = new Date();
  const safeCustomerMessage = sanitizeForMemory(customerMessage);
  const safeAssistantResponse = sanitizeForMemory(assistantResponse);
  const safeName = sanitizeForMemory(customerName || customerId);

  const content = [
    `Customer ID: ${customerId}`,
    `Customer name: ${safeName}`,
    '',
    'Customer message:',
    `"${safeCustomerMessage}"`,
    '',
    'Assistant response:',
    `"${safeAssistantResponse}"`,
    '',
    'Context:',
    '"RecallDesk customer support interaction."',
    '',
    `Timestamp: ${timestamp.toISOString()}`,
  ].join('\n');

  console.log('[HINDSIGHT] Retain started');

  try {
    const hindsight = getClient();
    const bankId = getBankId();

    // Official SDK: client.retain(bankId, content, options?)
    const response = await hindsight.retain(bankId, content, {
      timestamp,
      context: 'RecallDesk customer support interaction.',
      documentId: `conversation-${customerId}-${timestamp.getTime()}`,
      tags: [customerTag(customerId), 'conversation', 'support'],
      metadata: {
        customerId: String(customerId),
        customerName: String(safeName).slice(0, 120),
        source: 'recalldesk',
        kind: 'conversation',
      },
    });

    console.log('[HINDSIGHT] Retain succeeded');
    return response;
  } catch (error) {
    const safe =
      String(error.message || error)
        .replace(/gsk_[A-Za-z0-9]+/gi, '[REDACTED]')
        .replace(/hsk_[A-Za-z0-9_]+/gi, '[REDACTED]')
        .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]');
    console.error(`[HINDSIGHT] Retain FAILED: ${safe}`);
    throw formatHindsightError('retain', error);
  }
}

/**
 * Idempotently seed synthetic demo conversations into Hindsight.
 * Uses stable document IDs — existing seeds are skipped, not duplicated.
 */
export async function seedDemoCustomers() {
  const hindsight = getClient();
  const bankId = getBankId();
  const results = [];

  console.log(`[HINDSIGHT] Demo seed started (${DEMO_SEED_VERSION})`);

  for (const customer of demoCustomers) {
    const documentId = demoSeedDocumentId(customer.id);

    try {
      const existing = await hindsight.getDocument(bankId, documentId);

      if (existing) {
        console.log(
          `[HINDSIGHT] Demo seed skipped (already present): ${documentId}`
        );
        results.push({
          customerId: customer.id,
          customerName: customer.name,
          documentId,
          status: 'skipped',
          reason: 'already_seeded',
        });
        continue;
      }

      const content = buildDemoSeedContent(customer);
      const timestamp = new Date('2026-09-01T12:00:00.000Z');

      await hindsight.retain(bankId, content, {
        timestamp,
        context: 'RecallDesk synthetic demo seed conversation.',
        documentId,
        updateMode: 'replace',
        tags: [
          customerTag(customer.id),
          'conversation',
          'support',
          'demo-seed',
          DEMO_SEED_VERSION,
        ],
        metadata: {
          customerId: String(customer.id),
          customerName: String(customer.name).slice(0, 120),
          source: 'recalldesk-demo-seed',
          kind: 'demo_seed',
          seedVersion: DEMO_SEED_VERSION,
          scenario: String(customer.scenario).slice(0, 120),
        },
      });

      console.log(`[HINDSIGHT] Demo seed retained: ${documentId}`);
      results.push({
        customerId: customer.id,
        customerName: customer.name,
        documentId,
        status: 'seeded',
      });
    } catch (error) {
      console.error(
        `[HINDSIGHT] Demo seed FAILED for ${customer.id}:`,
        error.message || error
      );
      results.push({
        customerId: customer.id,
        customerName: customer.name,
        documentId,
        status: 'failed',
        error: error.message || String(error),
      });
    }
  }

  const seeded = results.filter((r) => r.status === 'seeded').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  console.log(
    `[HINDSIGHT] Demo seed finished: seeded=${seeded} skipped=${skipped} failed=${failed}`
  );

  return {
    version: DEMO_SEED_VERSION,
    customers: results,
    summary: { seeded, skipped, failed, total: results.length },
  };
}

/**
 * Fetch a broader memory snapshot for a customer (profile-style recall).
 */
export async function getCustomerMemory(customerId) {
  if (!customerId) {
    throw new Error('getCustomerMemory requires a customerId');
  }

  const query = [
    `What do we know about customer ${customerId}?`,
    'Include previous issues, previous solutions, preferences, unresolved issues,',
    'and recent customer support interactions or conversations.',
  ].join(' ');

  console.log('[HINDSIGHT] Recall started');

  try {
    const hindsight = getClient();
    const bankId = getBankId();

    const response = await hindsight.recall(bankId, query, {
      budget: 'mid',
      types: ['world', 'experience', 'observation'],
      preferObservations: true,
      includeEntities: true,
      tags: [customerTag(customerId)],
      tagsMatch: 'any_strict',
      maxTokens: 3072,
    });

    const memories = normalizeMemories(response);
    console.log(`[HINDSIGHT] Recall succeeded: ${memories.length} memories`);

    return {
      customerId,
      memories,
      count: memories.length,
    };
  } catch (error) {
    console.error('[HINDSIGHT] Recall FAILED:', error.message || error);
    throw formatHindsightError('getCustomerMemory', error);
  }
}
