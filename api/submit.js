import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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

const THEMES = [
  { id: 'deceased',   keywords: ['dead', 'died', 'death', 'passed away', 'deceased', 'grandmother', 'grandfather', 'grandparent', 'funeral', 'grave', 'mom died', 'dad died'], desc: 'encountering a deceased loved one' },
  { id: 'chased',     keywords: ['chased', 'chase', 'running from', 'following me', 'being followed', 'pursued', 'escape from', 'running away', 'someone after me'], desc: 'being chased or pursued' },
  { id: 'flying',     keywords: ['flying', 'i was flying', 'flew', 'float', 'soar', 'levitate', 'hovering', 'airborne', 'in the air'], desc: 'flying or floating freely' },
  { id: 'falling',    keywords: ['falling', 'i was falling', 'fell', 'fall off', 'plunging', 'dropped', 'falling down'], desc: 'falling or losing footing' },
  { id: 'teeth',      keywords: ['teeth', 'tooth', 'dental', 'losing teeth', 'teeth falling', 'teeth crumbling', 'teeth fell'], desc: 'teeth falling out' },
  { id: 'ancestors',  keywords: ['ancestor', 'spirit visit', 'ghost of', 'deceased relative', 'visitation', 'came to me in a dream', 'visited me in', 'dead relative'], desc: 'an ancestral or spirit visitation' },
  { id: 'exam',       keywords: ['exam', 'test', 'school', 'forgot', 'late to class', 'unprepared', 'failed class', 'job interview', 'homework', "didn't study"], desc: 'exam anxiety or failure' },
  { id: 'divine',     keywords: ['god', 'angel', 'divine', 'prophet', 'religious', 'heaven', 'hell', 'demon', 'devil', 'jesus', 'allah', 'spiritual'], desc: 'a divine or prophetic experience' },
  { id: 'paralysis',  keywords: ['sleep paralysis', 'paralysis', "couldn't move", "couldn't scream", 'frozen in place', 'shadow figure', 'pinned down'], desc: 'sleep paralysis' },
  { id: 'lucid',      keywords: ['lucid', 'lucid dream', 'aware i was dreaming', 'realized i was dreaming', 'took control', 'conscious in', 'control the dream'], desc: 'a lucid dream' },
  { id: 'apocalypse', keywords: ['zombie', 'apocalypse', 'end of world', 'end of the world', 'disaster', 'nuclear', 'invasion', 'survival', 'post-apocalyptic'], desc: 'an apocalyptic scenario' },
  { id: 'celebrity',  keywords: ['celebrity', 'famous person', 'actor', 'singer', 'musician', 'athlete', 'famous', 'celebrity dream'], desc: 'an encounter with a celebrity' },
];

function classify(text) {
  const lower = text.toLowerCase();
  const scores = THEMES.map(t => ({ id: t.id, score: t.keywords.filter(k => lower.includes(k)).length }));
  return scores.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.id);
}

function extractKeywords(text) {
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) ?? [];
  const stopWords = new Set(['that', 'this', 'with', 'from', 'they', 'were', 'when', 'then', 'there', 'just', 'like', 'some', 'been', 'have', 'could', 'would', 'about', 'into', 'dream', 'dreamed', 'dreaming']);
  const freq = {};
  words.filter(w => !stopWords.has(w)).forEach(w => { freq[w] = (freq[w] ?? 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([w]) => w);
}

function generateEssence(themes) {
  if (!themes.length) return 'A vivid but unclassified dream.';
  const t = THEMES.find(x => x.id === themes[0]);
  const t2 = themes[1] ? THEMES.find(x => x.id === themes[1]) : null;
  if (t2) return `A dream about ${t.desc} and ${t2.desc}.`;
  return `A dream about ${t.desc}.`;
}

function jitter(val, range) { return val + (Math.random() * 2 - 1) * range; }

function findConnections(dreamThemes, dreamKeywords, others) {
  return others
    .map(o => {
      const shared = (o.themes ?? []).filter(t => dreamThemes.includes(t));
      const keywordOverlap = (o.keywords ?? []).filter(k => dreamKeywords.includes(k)).length;
      const strength = shared.length * 0.3 + keywordOverlap * 0.1;
      return { dream_b: o.id, shared_themes: shared, strength: Math.min(strength, 1.0), reason: sharedReason(shared), dream: o };
    })
    .filter(c => c.strength >= 0.3 && c.shared_themes.length > 0)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);
}

function sharedReason(sharedThemes) {
  if (!sharedThemes.length) return 'Similar dream patterns.';
  const descs = sharedThemes.map(id => THEMES.find(t => t.id === id)?.desc ?? id);
  if (descs.length === 1) return `Both dreams involve ${descs[0]}.`;
  return `Both dreams involve ${descs.slice(0, -1).join(', ')} and ${descs.at(-1)}.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { text, region, contact } = req.body ?? {};
  if (!text?.trim() || !region) return res.status(400).json({ error: 'text and region required' });

  const centroid = REGION_CENTROIDS[region];
  if (!centroid) return res.status(400).json({ error: 'unknown region' });

  const themes   = classify(text);
  const keywords = extractKeywords(text);
  const essence  = generateEssence(themes);

  const { data: dream, error: insertErr } = await supabase
    .from('dreams')
    .insert({ text, region, contact: contact?.trim() || null,
      lat: jitter(centroid[0], 8), lon: jitter(centroid[1], 14),
      themes, keywords, essence })
    .select()
    .single();

  if (insertErr) return res.status(500).json({ error: insertErr.message });

  const { data: others } = await supabase
    .from('dreams')
    .select('id, essence, themes, keywords, region')
    .neq('id', dream.id)
    .order('created_at', { ascending: false })
    .limit(60);

  const connections = findConnections(themes, keywords, others ?? []);

  if (connections.length) {
    await supabase.from('dream_connections').upsert(
      connections.map(c => ({ dream_a: dream.id, dream_b: c.dream_b, shared_themes: c.shared_themes, reason: c.reason, strength: c.strength })),
      { onConflict: 'dream_a,dream_b' }
    );
  }

  return res.status(200).json({ dream, matched: connections });
}
