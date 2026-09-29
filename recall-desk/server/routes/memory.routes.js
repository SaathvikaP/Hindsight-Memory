import { Router } from 'express';
import { getCustomerMemory } from '../services/hindsight.service.js';
import { structureCustomerMemoryProfile } from '../services/memoryProfile.service.js';

const router = Router();

function sanitizeClientError(error) {
  const raw = error?.message || String(error);
  return raw
    .replace(/gsk_[A-Za-z0-9]+/gi, '[REDACTED]')
    .replace(/hsk_[A-Za-z0-9_]+/gi, '[REDACTED]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .slice(0, 400);
}

/**
 * GET /api/memory/:customerId
 * Recalls and structures Hindsight memories for the "What I Remember" modal.
 */
router.get('/memory/:customerId', async (req, res) => {
  const customerId = String(req.params.customerId || '').trim();

  if (!customerId) {
    return res.status(400).json({
      success: false,
      error: 'Missing customerId in the request path.',
    });
  }

  try {
    const recalled = await getCustomerMemory(customerId);
    const profile = structureCustomerMemoryProfile(recalled.memories || []);

    return res.json({
      success: true,
      customerId,
      ...profile,
      empty: profile.totalCount === 0,
    });
  } catch (error) {
    console.error('[MEMORY] Profile recall failed:', sanitizeClientError(error));
    return res.status(502).json({
      success: false,
      customerId,
      error: 'Unable to retrieve customer memories right now.',
    });
  }
});

export default router;
