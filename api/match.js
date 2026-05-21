import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const corpus = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../corpus.json'), 'utf8')
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).end();

  const { text } = req.body ?? {};
  if (!text?.trim()) return res.status(400).json({ error: 'text required' });

  // ── 1. Classify the user's dream ──────────────────────────────────────────
  const classifyResp = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: 'Return only valid JSON, no markdown.',
    messages: [{ role: 'user', content:
      `Analyze this dream. Return JSON: { "themes": [1-3 from: deceased,chased,flying,falling,teeth,ancestors,exam,divine,paralysis,lucid,apocalypse,celebrity], "keywords": [5-7 short keywords] }
Dream: "${text.slice(0, 1500)}"` }],
  });

  let classification;
  try { classification = JSON.parse(classifyResp.content[0].text); }
  catch { classification = { themes: [], keywords: [] }; }

  const { themes = [], keywords = [] } = classification;

  // ── 2. Pre-filter by theme overlap ────────────────────────────────────────
  const themeSet = new Set(themes);
  const keywordStr = keywords.join(' ').toLowerCase();

  const scored = corpus.map(dream => {
    const sharedThemes = dream.themes.filter(t => themeSet.has(t)).length;
    const keywordHits  = keywords.filter(k => dream.text.toLowerCase().includes(k)).length;
    return { ...dream, score: sharedThemes * 3 + keywordHits };
  });

  const candidates = scored
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  if (!candidates.length) {
    return res.status(200).json({ matches: [], themes, keywords });
  }

  // ── 3. Deep match with Claude ─────────────────────────────────────────────
  const matchResp = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: 'You are a perceptive dream analyst. Respond only with valid JSON, no markdown.',
    messages: [{ role: 'user', content:
      `Someone described this dream:
"${text.slice(0, 1000)}"

Here are candidate dreams from others. Find the 3 most resonant matches — look for shared symbols, emotions, or narrative arcs, not just surface themes.

${candidates.map((d, i) => `[${i}] ${d.text}`).join('\n\n')}

Return JSON array of exactly 3 (or fewer if fewer qualify):
[{ "index": 0, "resonance": "1-2 sentence explanation of why these dreams connect — be specific and evocative" }]` }],
  });

  let picks;
  try { picks = JSON.parse(matchResp.content[0].text); }
  catch { picks = []; }

  const matches = picks
    .filter(p => p.index >= 0 && p.index < candidates.length)
    .map(p => ({
      text:      candidates[p.index].text,
      themes:    candidates[p.index].themes,
      sub:       candidates[p.index].sub,
      resonance: p.resonance,
    }));

  return res.status(200).json({ matches, themes, keywords });
}
