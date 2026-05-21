import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const REGION_CENTROIDS = {
  'N. America':             [38,  -97],
  'Latin America':          [-10, -60],
  'W. Europe':              [50,   10],
  'E. Europe & Russia':     [55,   45],
  'Middle East & N.Africa': [25,   35],
  'Sub-Saharan Africa':     [-5,   25],
  'South Asia':             [22,   78],
  'East Asia':              [30,  115],
  'Oceania':                [-25, 140],
};

const THEMES = ['deceased','chased','flying','falling','teeth','ancestors',
                'exam','divine','paralysis','lucid','apocalypse','celebrity'];

function jitter(val, range) { return val + (Math.random() * 2 - 1) * range; }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).end();

  const { text, region, contact } = req.body ?? {};
  if (!text?.trim() || !region)  return res.status(400).json({ error: 'text and region required' });

  const centroid = REGION_CENTROIDS[region];
  if (!centroid) return res.status(400).json({ error: 'unknown region' });

  // ── 1. Classify ────────────────────────────────────────────────────────────
  const classify = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: 'You are a dream analyst. Respond only with valid JSON, no markdown.',
    messages: [{ role: 'user', content:
      `Analyze this dream and return a JSON object with:
- themes: 1–4 IDs from [${THEMES.join(', ')}]
- keywords: 5–8 keywords (images, emotions, symbols)
- essence: one evocative sentence capturing the emotional and symbolic core

Dream: "${text.slice(0, 2000)}"` }],
  });

  let analysis;
  try { analysis = JSON.parse(classify.content[0].text); }
  catch { return res.status(500).json({ error: 'classification failed' }); }

  // ── 2. Store dream ─────────────────────────────────────────────────────────
  const { data: dream, error: insertErr } = await supabase
    .from('dreams')
    .insert({
      text, region, contact: contact?.trim() || null,
      lat: jitter(centroid[0], 8), lon: jitter(centroid[1], 14),
      themes:   analysis.themes   ?? [],
      keywords: analysis.keywords ?? [],
      essence:  analysis.essence  ?? '',
    })
    .select()
    .single();

  if (insertErr) return res.status(500).json({ error: insertErr.message });

  // ── 3. Find connections ────────────────────────────────────────────────────
  const { data: others } = await supabase
    .from('dreams')
    .select('id, essence, themes, keywords, region')
    .neq('id', dream.id)
    .order('created_at', { ascending: false })
    .limit(60);

  let connections = [];
  if (others?.length) {
    const matchResp = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: 'You are a dream analyst. Respond only with a valid JSON array, no markdown.',
      messages: [{ role: 'user', content:
        `Find dreams with deep resonance to this new dream — shared symbols, emotions, or narrative arcs, not just matching labels.

NEW DREAM
Essence: "${analysis.essence}"
Themes: ${analysis.themes?.join(', ')}
Keywords: ${analysis.keywords?.join(', ')}

EXISTING DREAMS
${others.map(d => `[${d.id}] ${d.essence} (themes: ${d.themes?.join(', ')})`).join('\n')}

Return JSON array, max 5, strength ≥ 0.55:
[{"dream_b":"uuid","shared_themes":["theme"],"reason":"1 sentence explaining the resonance","strength":0.0-1.0}]
Return [] if no strong connections.` }],
    });

    try { connections = JSON.parse(matchResp.content[0].text.trim()); }
    catch { connections = []; }

    if (connections.length) {
      await supabase.from('dream_connections').upsert(
        connections.map(c => ({
          dream_a: dream.id, dream_b: c.dream_b,
          shared_themes: c.shared_themes ?? [],
          reason:   c.reason   ?? '',
          strength: c.strength ?? 0.6,
        })),
        { onConflict: 'dream_a,dream_b' }
      );
    }
  }

  // ── 4. Maybe refresh summary ───────────────────────────────────────────────
  const { count } = await supabase.from('dreams').select('*', { count: 'exact', head: true });
  if (count && count % 10 === 0) {
    // Trigger summary refresh every 10 dreams (fire and forget)
    fetch(`${process.env.VERCEL_URL ? 'https://'+process.env.VERCEL_URL : 'http://localhost:3000'}/api/summary`, {
      method: 'POST',
      headers: { 'x-internal': process.env.SUPABASE_SERVICE_KEY ?? '' },
    }).catch(() => {});
  }

  // Return matched dream details
  const matchedIds = connections.map(c => c.dream_b);
  const { data: matchedDreams } = matchedIds.length
    ? await supabase.from('dreams').select('id, essence, themes, region, contact').in('id', matchedIds)
    : { data: [] };

  const matched = connections.map(c => ({
    ...c, dream: matchedDreams?.find(d => d.id === c.dream_b),
  }));

  return res.status(200).json({ dream, matched });
}
