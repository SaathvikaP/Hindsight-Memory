/**
 * Independent Hindsight smoke test (does not start Express).
 *
 * Usage:
 *   node scripts/test-hindsight.js
 *
 * Requires HINDSIGHT_API_KEY and HINDSIGHT_BANK_ID in server/.env
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getCustomerMemory,
  recallCustomerMemories,
  retainConversation,
} from '../services/hindsight.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const customerId = process.argv[2] || 'sarah-wilson';
const apiKey = process.env.HINDSIGHT_API_KEY || '';
const bankId = process.env.HINDSIGHT_BANK_ID || '';

function assertHindsightEnvReady() {
  const problems = [];
  if (
    !apiKey ||
    apiKey === 'your_hindsight_api_key_here' ||
    apiKey.includes('your_hindsight')
  ) {
    problems.push(
      '- HINDSIGHT_API_KEY is still a placeholder. Get a key: ui.hindsight.vectorize.io → Connect → Create API Key'
    );
  }
  if (
    !bankId ||
    bankId === 'your_hindsight_bank_id_here' ||
    bankId.includes('your_hindsight')
  ) {
    problems.push(
      '- HINDSIGHT_BANK_ID is still a placeholder. Create/open a Memory Bank in the Hindsight dashboard and paste its ID'
    );
  }
  if (problems.length) {
    const message = [
      'Hindsight is not configured yet. Edit server/.env and replace the placeholders:',
      ...problems,
      '',
      `Env file loaded from: ${envPath}`,
      'The RecallDesk website still works with mock data at http://localhost:5173',
    ].join('\n');
    throw new Error(message);
  }
}

async function main() {
  console.log('--- Hindsight independent test ---');
  console.log(`Customer: ${customerId}`);
  console.log(`Env file: ${envPath}`);
  console.log('');

  assertHindsightEnvReady();
  console.log(`Bank configured: yes (${bankId.length} chars)`);
  console.log('');

  const sampleMessage =
    'My last invoice was charged twice and my package is still delayed.';

  const recalled = await recallCustomerMemories(customerId, sampleMessage);
  console.log('Recall sample:', recalled.slice(0, 3));
  console.log('');

  await retainConversation(
    customerId,
    sampleMessage,
    'I found your previous billing and shipping history and will prioritize both issues.'
  );
  console.log('');

  const snapshot = await getCustomerMemory(customerId);
  console.log(`Customer memory count: ${snapshot.count}`);
  console.log('--- Done ---');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
