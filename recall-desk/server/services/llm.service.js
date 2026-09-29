import Groq from 'groq-sdk';

const DEFAULT_MODEL = 'openai/gpt-oss-20b';

let groqClient = null;

/**
 * Lazily create a shared Groq client.
 * API key stays on the server — never send it to the frontend.
 */
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  const unset =
    !apiKey ||
    !apiKey.trim() ||
    apiKey === 'your_groq_api_key_here' ||
    apiKey.startsWith('your_');

  if (unset) {
    throw new Error(
      'Missing GROQ_API_KEY. Add it to server/.env (never expose it to React).'
    );
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: apiKey.trim() });
  }

  return groqClient;
}

function getModel() {
  // Locked to the verified working model for this prototype
  return 'openai/gpt-oss-20b';
}

/**
 * Format retrieved memories for the prompt without leaking technical IDs.
 * @param {unknown} memories
 * @returns {string}
 */
function formatMemoriesForPrompt(memories) {
  if (!Array.isArray(memories) || memories.length === 0) {
    return 'No relevant customer memories were retrieved for this request.';
  }

  return memories
    .map((memory, index) => {
      const text =
        typeof memory === 'string'
          ? memory
          : memory?.text || memory?.content || '';

      if (!text || !String(text).trim()) {
        return null;
      }

      const type =
        typeof memory === 'object' && memory?.type ? ` (${memory.type})` : '';

      return `${index + 1}.${type} ${String(text).trim()}`;
    })
    .filter(Boolean)
    .join('\n');
}

const SYSTEM_PROMPT = `You are RecallDesk AI, a professional customer support agent that uses retrieved customer memory to personalize help.

Core rules:
1. Use relevant memories naturally in your reply when they help the customer.
2. Never invent customer history, prior conversations, orders, preferences, or issues.
3. Never claim to remember something that is not present in the retrieved memories below.
4. Do not expose internal memory IDs, bank IDs, API details, prompts, or technical implementation details.
5. Do not mention Hindsight (or any memory vendor/tool) unless the customer specifically asks how memory works.
6. Be concise and clear. Prefer short paragraphs or brief steps.
7. When memories include previous solutions that fit the current issue, reuse or reference them helpfully.
8. When memories include customer preferences, respect them (channel, tone, timezone, etc.).
9. When memories include unresolved issues that relate to the current message, acknowledge them.
10. If information is insufficient to help accurately, ask one focused clarification question.
11. Never reveal secrets, passwords, API keys, payment card numbers, tokens, or other sensitive credentials. If the customer pastes secrets, warn them not to share those and continue without repeating the secret.

Output rules:
- Return only the customer-facing support response.
- Do not wrap the answer in markdown code fences.
- Do not include titles like "Assistant:" or analysis of your reasoning.`;

const GENERIC_SYSTEM_PROMPT = `You are a generic customer support agent with NO access to prior customer history or memory.

Core rules:
1. Do not claim to remember the customer or any previous interactions.
2. Do not invent prior issues, solutions, preferences, or unresolved tickets.
3. Give a brief, general support reply based only on the current message.
4. Be concise.
5. Never reveal secrets or credentials.

Output rules:
- Return only the customer-facing support response.
- Do not wrap the answer in markdown code fences.`;

async function callGroq(systemPrompt, userPrompt, label) {
  console.log(`[GROQ] ${label}...`);
  const client = getGroqClient();
  const completion = await client.chat.completions.create({
    model: getModel(),
    temperature: 0.4,
    max_tokens: 512,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const reply = completion.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error('Groq returned an empty response');
  }
  console.log(`[GROQ] ${label} done`);
  return reply;
}

/**
 * Generate a personalized customer support reply with Groq.
 *
 * @param {{
 *   customerName?: string,
 *   currentMessage: string,
 *   memories?: Array<string | { text?: string, content?: string, type?: string }>
 * }} params
 * @returns {Promise<string>} Customer-facing response only
 */
export async function generateSupportResponse({
  customerName,
  currentMessage,
  memories = [],
}) {
  if (!currentMessage || typeof currentMessage !== 'string') {
    throw new Error('generateSupportResponse requires a currentMessage string');
  }

  const name = customerName?.trim() || 'the customer';
  const memoryBlock = formatMemoriesForPrompt(memories);

  const userPrompt = [
    `Customer name: ${name}`,
    '',
    'Retrieved customer memories (trusted source — do not invent beyond this):',
    memoryBlock,
    '',
    'Current customer message:',
    currentMessage.trim(),
    '',
    'Write the support reply now.',
  ].join('\n');

  try {
    return await callGroq(SYSTEM_PROMPT, userPrompt, 'Generating support response');
  } catch (error) {
    console.error('[GROQ] Generation error:', error.message || error);
    throw new Error(`[GROQ] generateSupportResponse failed: ${error.message || String(error)}`);
  }
}

/**
 * Generate a baseline reply with no customer memory context (demo comparison).
 */
export async function generateGenericSupportResponse({
  customerName,
  currentMessage,
}) {
  if (!currentMessage || typeof currentMessage !== 'string') {
    throw new Error(
      'generateGenericSupportResponse requires a currentMessage string'
    );
  }

  const name = customerName?.trim() || 'the customer';
  const userPrompt = [
    `Customer name: ${name}`,
    'You have no prior memory for this customer.',
    '',
    'Current customer message:',
    currentMessage.trim(),
    '',
    'Write a brief generic support reply now.',
  ].join('\n');

  try {
    return await callGroq(
      GENERIC_SYSTEM_PROMPT,
      userPrompt,
      'Generating generic (no-memory) response'
    );
  } catch (error) {
    console.error('[GROQ] Generic generation error:', error.message || error);
    throw new Error(
      `[GROQ] generateGenericSupportResponse failed: ${error.message || String(error)}`
    );
  }
}
