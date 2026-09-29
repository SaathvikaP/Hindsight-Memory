import { Router } from 'express';
import { handleChatTurn } from '../services/chatService.js';

const router = Router();

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    return `Please send a non-empty "${fieldName}" string in the request body.`;
  }
  return null;
}

/**
 * POST /api/chat
 * Body: { customerId, customerName, message }
 */
router.post('/chat', async (req, res) => {
  const body = req.body ?? {};
  const { customerId, customerName, message } = body;

  const validationError =
    requireNonEmptyString(customerId, 'customerId') ||
    requireNonEmptyString(customerName, 'customerName') ||
    requireNonEmptyString(message, 'message');

  if (validationError) {
    return res.status(400).json({
      success: false,
      error: validationError,
    });
  }

  try {
    const result = await handleChatTurn({
      customerId: customerId.trim(),
      customerName: customerName.trim(),
      message: message.trim(),
    });

    return res.json({
      success: true,
      response: result.response,
      memories: result.memories,
      memoryCount: result.memoryCount,
      memoryAction: result.memoryAction,
      activity: result.activity,
      memory: result.memory,
      memoryRetrievalFailed: result.memoryRetrievalFailed,
      memoryStored: result.memoryStored,
    });
  } catch (error) {
    console.error('[CHAT] Error:', error?.code || error?.message || error);

    if (error?.code === 'GROQ_FAILED') {
      return res.status(502).json({
        success: false,
        error: error.message,
        activity: [
          'Message received',
          'Searching Hindsight',
          'Response generation failed',
        ],
        memory: {
          recall: { attempted: true, success: false, count: 0, memories: [] },
          retain: { attempted: false, success: false },
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to process chat request.',
    });
  }
});

export default router;
