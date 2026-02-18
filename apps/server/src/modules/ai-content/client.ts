/**
 * AI Client — wraps OpenAI/Anthropic calls.
 * All errors are caught and return null so the game is never blocked by AI failures.
 *
 * Feature flags (set in .env):
 *   AI_CAMPAIGNS=true
 *   AI_NARRATIVE=true
 *   AI_EVENTS=true
 *   AI_OFFICERS=true
 *   AI_GENERALS=true
 *   OPENAI_API_KEY=sk-...      (preferred)
 *   ANTHROPIC_API_KEY=sk-ant-...
 *   AI_MODEL=gpt-4o-mini       (default)
 */

export type AiFeatureFlag =
  | 'AI_CAMPAIGNS'
  | 'AI_NARRATIVE'
  | 'AI_EVENTS'
  | 'AI_OFFICERS'
  | 'AI_GENERALS';

export function isAiEnabled(flag: AiFeatureFlag): boolean {
  return process.env[flag] === 'true';
}

export interface AiClientOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * callAi — sends a prompt and returns the raw text response, or null on failure.
 */
export async function callAi(
  prompt: string,
  options: AiClientOptions = {},
): Promise<string | null> {
  const { maxTokens = 500, temperature = 0.7 } = options;

  // OpenAI path
  if (process.env.OPENAI_API_KEY) {
    try {
      const model = process.env.AI_MODEL ?? 'gpt-4o-mini';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as any;
      return data?.choices?.[0]?.message?.content ?? null;
    } catch {
      return null;
    }
  }

  // Anthropic path
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const model = process.env.AI_MODEL ?? 'claude-3-haiku-20240307';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as any;
      return data?.content?.[0]?.text ?? null;
    } catch {
      return null;
    }
  }

  // No AI key configured
  return null;
}
