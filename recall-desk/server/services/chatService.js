import {
  recallCustomerMemories,
  retainConversation,
} from './hindsight.service.js';
import { generateSupportResponse } from './llm.service.js';
import { buildMemoryTransparency } from './memoryTransparency.service.js';
import { buildMemoryAction } from './memoryAction.service.js';

function toLlmMemories(memories) {
  return (memories || [])
    .map((memory) => ({
      text: memory.text || memory.content || '',
      type: memory.type || null,
    }))
    .filter((memory) => memory.text.trim().length > 0);
}

function sanitizeClientError(error) {
  const raw = error?.message || String(error);
  return raw
    .replace(/gsk_[A-Za-z0-9]+/gi, '[REDACTED]')
    .replace(/hsk_[A-Za-z0-9_]+/gi, '[REDACTED]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .slice(0, 400);
}

/**
 * Build activity labels from real recall/retain outcomes (never fake retain success).
 */
function buildActivity({
  recallAttempted,
  recallSuccess,
  memoryCount,
  retainAttempted,
  retainSuccess,
  responseGenerated,
}) {
  const activity = ['Message received'];

  if (recallAttempted) {
    activity.push('Searching Hindsight');
    if (recallSuccess) {
      activity.push(`${memoryCount} relevant memories found`);
      if (memoryCount > 0) {
        activity.push('Memory used');
      }
    } else {
      activity.push('Memory retrieval failed');
    }
  }

  if (responseGenerated) {
    activity.push('Personalized response generated');
  }

  if (retainAttempted) {
    activity.push(
      retainSuccess
        ? 'Conversation saved to Hindsight'
        : 'Conversation not saved to Hindsight'
    );
  }

  return activity;
}

/**
 * Complete chat workflow with explicit recall vs retain status.
 */
export async function handleChatTurn({ customerId, customerName, message }) {
  const recallStatus = {
    attempted: false,
    success: false,
    count: 0,
    memories: [],
    error: null,
  };

  const retainStatus = {
    attempted: false,
    success: false,
    error: null,
  };

  let rawMemories = [];

  recallStatus.attempted = true;
  console.log('[CHAT] Recalling memories from Hindsight...');

  try {
    rawMemories = await recallCustomerMemories(customerId, message);
    recallStatus.success = true;
    recallStatus.count = rawMemories.length;
    console.log(`[CHAT] Memories retrieved: ${rawMemories.length}`);
  } catch (error) {
    rawMemories = [];
    recallStatus.success = false;
    recallStatus.error = 'Memory retrieval failed';
    console.error('[CHAT] Hindsight recall failed:', sanitizeClientError(error));
  }

  const memories = buildMemoryTransparency(message, rawMemories);
  recallStatus.memories = memories;
  recallStatus.count = memories.length;

  const memoryAction = buildMemoryAction(message, memories);

  const llmMemories = toLlmMemories(rawMemories);

  console.log('[CHAT] Generating reply with Groq (openai/gpt-oss-20b)...');

  let response;
  try {
    response = await generateSupportResponse({
      customerName,
      currentMessage: message,
      memories: llmMemories,
    });
  } catch (error) {
    console.error('[CHAT] Groq failed:', sanitizeClientError(error));
    const err = new Error(
      'Unable to generate a support response right now. Please try again in a moment.'
    );
    err.code = 'GROQ_FAILED';
    err.safeDetail = sanitizeClientError(error);
    throw err;
  }

  retainStatus.attempted = true;
  console.log('[CHAT] Storing conversation in Hindsight...');

  try {
    await retainConversation(
      customerId,
      customerName,
      message,
      response
    );
    retainStatus.success = true;
  } catch (error) {
    retainStatus.success = false;
    retainStatus.error = 'Conversation could not be saved to Hindsight';
    console.error(
      '[CHAT] Failed to store conversation:',
      sanitizeClientError(error)
    );
  }

  const activity = buildActivity({
    recallAttempted: recallStatus.attempted,
    recallSuccess: recallStatus.success,
    memoryCount: recallStatus.count,
    retainAttempted: retainStatus.attempted,
    retainSuccess: retainStatus.success,
    responseGenerated: true,
  });

  return {
    success: true,
    response,
    memories,
    memoryCount: memories.length,
    memoryAction,
    activity,
    memory: {
      recall: {
        attempted: recallStatus.attempted,
        success: recallStatus.success,
        count: recallStatus.count,
        memories: recallStatus.memories,
        ...(recallStatus.error ? { error: recallStatus.error } : {}),
      },
      retain: {
        attempted: retainStatus.attempted,
        success: retainStatus.success,
        ...(retainStatus.error ? { error: retainStatus.error } : {}),
      },
    },
    // Back-compat fields used by the dashboard
    memoryRetrievalFailed: recallStatus.attempted && !recallStatus.success,
    memoryStored: retainStatus.success,
  };
}
