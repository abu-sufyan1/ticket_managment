import Anthropic from '@anthropic-ai/sdk';

// Lazily initialise the client so tests can mock it before it's instantiated
let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

const MODEL = 'claude-sonnet-4-20250514';

// ─── Shared helper ────────────────────────────────────────────────────────────

async function ask(prompt: string): Promise<string> {
  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }
  return block.text.trim();
}

// ─── Feature A — Reply Polisher ───────────────────────────────────────────────

export async function polishReply(ticketSubject: string, draft: string): Promise<string> {
  const prompt = `You are a professional customer support agent. Rewrite the following draft reply to be polite, clear, and professional while keeping the original intent. Do not add new information. Return only the rewritten reply text, nothing else.

Ticket subject: ${ticketSubject}

Draft reply:
${draft}`;

  return ask(prompt);
}

// ─── Feature B — Ticket Summarization ────────────────────────────────────────

export async function summarizeTicket(
  subject: string,
  messages: { authorRole: string; body: string }[]
): Promise<string> {
  const conversation = messages
    .map((m) => `[${m.authorRole}]: ${m.body}`)
    .join('\n\n');

  const prompt = `Summarize the following customer support conversation in 3-5 concise sentences. Focus on the issue, what was tried, and the current status.

Ticket subject: ${subject}

Conversation:
${conversation}`;

  return ask(prompt);
}

// ─── Feature C — Auto-Classification ─────────────────────────────────────────

export interface ClassificationResult {
  category: string;
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export async function classifyTicket(
  subject: string,
  description: string
): Promise<ClassificationResult> {
  const prompt = `Classify the following support ticket. Respond with ONLY a JSON object (no markdown, no explanation) with these two fields:
- "category": one of "billing", "technical", "account", "general"
- "suggestedPriority": one of "LOW", "MEDIUM", "HIGH", "URGENT"

Subject: ${subject}
Description: ${description}`;

  const raw = await ask(prompt);

  // Strip any accidental markdown code fences
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned) as ClassificationResult;
  return parsed;
}

// ─── Feature D — Auto-Resolve ─────────────────────────────────────────────────

export async function tryAutoResolve(
  subject: string,
  description: string,
  knowledgeBase: { title: string; content: string }[]
): Promise<string | null> {
  if (knowledgeBase.length === 0) return null;

  const kbText = knowledgeBase
    .map((entry, i) => `[${i + 1}] ${entry.title}\n${entry.content}`)
    .join('\n\n');

  const prompt = `You are a customer support AI. Using ONLY the knowledge base below, try to resolve the customer's issue.
If you can fully resolve it, respond with a professional reply to the customer.
If you cannot resolve it with the knowledge base, respond with exactly the word: ESCALATE

Knowledge Base:
${kbText}

Customer Issue:
Subject: ${subject}
Description: ${description}`;

  const response = await ask(prompt);

  if (response.trim().toUpperCase() === 'ESCALATE') {
    return null;
  }
  return response;
}
