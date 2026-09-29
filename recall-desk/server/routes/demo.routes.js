import { Router } from 'express';
import {
  recallCustomerMemories,
  seedDemoCustomers,
} from '../services/hindsight.service.js';
import {
  generateGenericSupportResponse,
  generateSupportResponse,
} from '../services/llm.service.js';
import { buildMemoryTransparency } from '../services/memoryTransparency.service.js';
import { demoCustomers } from '../data/demoCustomers.js';

const router = Router();

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    return `Please send a non-empty "${fieldName}" string.`;
  }
  return null;
}

/**
 * POST /api/demo/seed
 * Idempotently insert synthetic demo conversations into Hindsight.
 */
router.post('/demo/seed', async (_req, res) => {
  try {
    const result = await seedDemoCustomers();
    const ok = result.summary.failed === 0;

    return res.status(ok ? 200 : 207).json({
      success: ok,
      ...result,
      profiles: demoCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        scenario: c.scenario,
        previousSolution: c.previousSolution,
        preference: c.preference,
        unresolvedIssue: c.unresolvedIssue,
      })),
      message: ok
        ? result.summary.seeded === 0
          ? 'Demo data already loaded — no duplicates created.'
          : `Loaded demo data for ${result.summary.seeded} customer(s).`
        : 'Some demo customers could not be seeded.',
    });
  } catch (error) {
    console.error('[DEMO] seed failed:', error.message || error);
    return res.status(502).json({
      success: false,
      error: 'Unable to load demo data into Hindsight right now.',
    });
  }
});

/**
 * POST /api/demo/memory-impact
 * Compare a generic reply vs a Hindsight-informed reply for the same message.
 */
router.post('/demo/memory-impact', async (req, res) => {
  const { customerId, customerName, message } = req.body ?? {};

  const validationError =
    requireNonEmptyString(customerId, 'customerId') ||
    requireNonEmptyString(customerName, 'customerName') ||
    requireNonEmptyString(message, 'message');

  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  try {
    let rawMemories = [];
    let recallFailed = false;

    try {
      rawMemories = await recallCustomerMemories(
        customerId.trim(),
        message.trim()
      );
    } catch (error) {
      recallFailed = true;
      rawMemories = [];
      console.error(
        '[DEMO] Hindsight recall failed for memory-impact:',
        error.message || error
      );
    }

    const memories = buildMemoryTransparency(message.trim(), rawMemories);

    const [withoutMemory, withHindsight] = await Promise.all([
      generateGenericSupportResponse({
        customerName: customerName.trim(),
        currentMessage: message.trim(),
      }),
      generateSupportResponse({
        customerName: customerName.trim(),
        currentMessage: message.trim(),
        memories: rawMemories,
      }),
    ]);

    return res.json({
      success: true,
      customerId: customerId.trim(),
      customerName: customerName.trim(),
      message: message.trim(),
      withoutMemory,
      withHindsight,
      memories,
      memoryCount: memories.length,
      recallFailed,
      note: 'This comparison shows how available memory context changes the reply. It does not claim one answer is objectively better.',
    });
  } catch (error) {
    console.error('[DEMO] memory-impact failed:', error.message || error);
    return res.status(502).json({
      success: false,
      error: 'Unable to generate the memory impact comparison right now.',
    });
  }
});

export default router;
