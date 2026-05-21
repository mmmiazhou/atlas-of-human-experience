import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const THEME_LABELS = {
  deceased: 'deceased loved ones', chased: 'being chased', flying: 'flying',
  falling: 'falling', teeth: 'teeth falling out', ancestors: 'spirit visitations',
  exam: 'exam anxiety', divine: 'divine experiences', paralysis: 'sleep paralysis',
  lucid: 'lucid dreaming', apocalypse: 'apocalyptic scenarios', celebrity: 'celebrity encounters',
};

function generateSummary(dreams) {
  if (!dreams.length) return null;

  const counts = {};
  dreams.forEach(d => (d.themes ?? []).forEach(t => { counts[t] = (counts[t] ?? 0) + 1; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (!top.length) return null;

  const regions = [...new Set(dreams.map(d => d.region))];
  const topLabel = THEME_LABELS[top[0][0]] ?? top[0][0];
  const regionStr = regions.length > 3 ? `${regions.length} regions` : regions.join(', ');

  let summary = `Right now, dreamers from ${regionStr} have shared ${dreams.length} dream${dreams.length === 1 ? '' : 's'}. `;
  summary += `The most recurring theme is ${topLabel} (${top[0][1]} dream${top[0][1] === 1 ? '' : 's'})`;
  if (top[1]) summary += `, followed by ${THEME_LABELS[top[1][0]] ?? top[1][0]}`;
  if (top[2]) summary += ` and ${THEME_LABELS[top[2][0]] ?? top[2][0]}`;
  summary += '.';
  return summary;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    const { data: dreams } = await supabase
      .from('dreams')
      .select('themes, region')
      .order('created_at', { ascending: false })
      .limit(100);

    const content = generateSummary(dreams ?? []);
    return res.status(200).json({ content });
  }

  return res.status(405).end();
}
