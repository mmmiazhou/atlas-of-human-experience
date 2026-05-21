import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // GET — return latest cached summary
  if (req.method === 'GET') {
    const { data } = await supabase
      .from('summaries')
      .select('content, dream_count, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return res.status(200).json(data ?? { content: null });
  }

  // POST — generate and store a fresh summary (internal only)
  if (req.method === 'POST') {
    const auth = req.headers['x-internal'];
    if (auth !== process.env.SUPABASE_SERVICE_KEY) return res.status(401).end();

    const { data: dreams } = await supabase
      .from('dreams')
      .select('essence, themes, region')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!dreams?.length) return res.status(200).json({ content: null });

    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: 'You write evocative, warm summaries of collective dream activity. Be concise and specific.',
      messages: [{ role: 'user', content:
        `Summarize what this community is collectively dreaming about right now.

Recent dreams (region — essence — themes):
${dreams.map(d => `${d.region}: "${d.essence}" [${d.themes?.join(', ')}]`).join('\n')}

Write 3–4 sentences. Note any surprising patterns, geographic clusters, or recurring symbols.
Start with "Right now, dreamers around the world..." Use a warm, curious tone. Under 100 words.` }],
    });

    const content = resp.content[0].text.trim();
    await supabase.from('summaries').insert({ content, dream_count: dreams.length });

    return res.status(200).json({ content });
  }

  return res.status(405).end();
}
