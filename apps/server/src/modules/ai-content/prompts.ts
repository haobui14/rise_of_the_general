/** Prompt templates for AI content generation — all Three Kingdoms themed. */

export function campaignPromptTemplate(context: string): string {
  return `You are a Three Kingdoms military strategist. Generate a campaign mission for a player's army.

Player context: ${context || 'The player commands a growing army during the Three Kingdoms era.'}

Respond with a JSON object using this exact structure (no markdown, no extra text):
{
  "name": "Short campaign name (5-8 words)",
  "description": "2-3 sentence narrative description",
  "suggestedObjectives": ["objective 1", "objective 2", "objective 3"],
  "estimatedDifficulty": 3
}

estimatedDifficulty must be an integer 1-5.`;
}

export function narrativePromptTemplate(event: string, context: string): string {
  return `You are a Three Kingdoms war chronicler. Write a brief narrative passage (2-3 sentences) about this event.

Event: ${event}
Context: ${context || 'The Three Kingdoms era.'}

Respond with only the narrative text — no JSON, no labels, no quotes.`;
}

export function officerPromptTemplate(role: string): string {
  return `You are a Three Kingdoms general's advisor. Create a new military officer character.

Role: ${role || 'officer'}

Respond with a JSON object using this exact structure (no markdown, no extra text):
{
  "name": "Chinese historical name",
  "backstory": "1-2 sentences of background",
  "suggestedStats": {
    "strength": 5,
    "defense": 5,
    "strategy": 5,
    "speed": 5,
    "leadership": 5
  },
  "suggestedRole": "officer"
}

All stat values must be integers between 1 and 15. suggestedRole must be one of: main, heir, officer, advisor.`;
}

export function enemyGeneralPromptTemplate(
  faction: string,
  level: number,
  territoryName: string,
): string {
  return `You are a Three Kingdoms lore master. Create an enemy general for the player to face in battle.

Faction: ${faction || 'Wei'}
Level: ${level}
Territory: ${territoryName || 'a contested region'}

Respond with a JSON object using this exact structure (no markdown, no extra text):
{
  "name": "Romanized name only — no Chinese characters (e.g. Guan Yu, Lu Bu, Zhang Fei, Xiahou Dun)",
  "title": "Military title (e.g. General of the East, Tiger of the North)",
  "lore": "1-2 sentences of background / personality"
}

IMPORTANT: The name field must contain only ASCII romanized pinyin — absolutely no Chinese characters or kanji.`;
}

export function eventPromptTemplate(playerContext: string): string {
  return `You are a Three Kingdoms event generator. Create a random political or military event.

Player context: ${playerContext || 'A general ruling territories during the Three Kingdoms era.'}

Respond with a JSON object using this exact structure (no markdown, no extra text):
{
  "title": "Event title (4-6 words)",
  "description": "Event description (2-3 sentences)",
  "effect": "Brief description of the mechanical effect"
}`;
}
