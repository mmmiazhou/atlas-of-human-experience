import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const corpus = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../corpus.json'), 'utf8')
);

const THEMES = [
  { id: 'deceased',   keywords: ['dead', 'died', 'death', 'passed away', 'deceased', 'grandmother', 'grandfather', 'funeral', 'grave'], desc: 'encountering a deceased loved one' },
  { id: 'chased',     keywords: ['chased', 'chase', 'running from', 'following me', 'pursued', 'escape from', 'running away'], desc: 'being chased or pursued' },
  { id: 'flying',     keywords: ['flying', 'flew', 'float', 'soar', 'levitate', 'hovering', 'airborne'], desc: 'flying or floating' },
  { id: 'falling',    keywords: ['falling', 'fell', 'fall off', 'plunging', 'dropped', 'falling down'], desc: 'falling' },
  { id: 'teeth',      keywords: ['teeth', 'tooth', 'dental', 'losing teeth', 'teeth falling', 'teeth crumbling'], desc: 'teeth falling out' },
  { id: 'ancestors',  keywords: ['ancestor', 'spirit visit', 'ghost of', 'deceased relative', 'visitation'], desc: 'a spirit visitation' },
  { id: 'exam',       keywords: ['exam', 'test', 'school', 'forgot', 'unprepared', 'failed class', 'job interview'], desc: 'exam or work anxiety' },
  { id: 'divine',     keywords: ['god', 'angel', 'divine', 'heaven', 'hell', 'demon', 'spiritual'], desc: 'a divine experience' },
  { id: 'paralysis',  keywords: ['sleep paralysis', 'paralysis', "couldn't move", 'frozen in place', 'shadow figure'], desc: 'sleep paralysis' },
  { id: 'lucid',      keywords: ['lucid', 'lucid dream', 'aware i was dreaming', 'realized i was dreaming', 'control the dream'], desc: 'lucid dreaming' },
  { id: 'apocalypse', keywords: ['zombie', 'apocalypse', 'end of world', 'disaster', 'nuclear', 'invasion'], desc: 'an apocalyptic scenario' },
  { id: 'celebrity',  keywords: ['celebrity', 'famous person', 'actor', 'singer', 'famous'], desc: 'a celebrity encounter' },
];

function classify(text) {
  const lower = text.toLowerCase();
  const scores = THEMES.map(t => ({ id: t.id, score: t.keywords.filter(k => lower.includes(k)).length }));
  return scores.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.id);
}

function extractKeywords(text) {
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) ?? [];
  const stop = new Set(['that', 'this', 'with', 'from', 'they', 'were', 'when', 'then', 'there', 'just', 'like', 'some', 'been', 'have', 'could', 'would', 'about', 'into', 'dream', 'dreamed']);
  const freq = {};
  words.filter(w => !stop.has(w)).forEach(w => { freq[w] = (freq[w] ?? 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
}

function sharedReason(sharedThemes) {
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

  const { text } = req.body ?? {};
  if (!text?.trim()) return res.status(400).json({ error: 'text required' });

  const themes   = classify(text);
  const keywords = extractKeywords(text);
  const themeSet = new Set(themes);

  const scored = corpus.map(dream => {
    const sharedThemes  = dream.themes.filter(t => themeSet.has(t));
    const keywordHits   = keywords.filter(k => dream.text.toLowerCase().includes(k)).length;
    const score         = sharedThemes.length * 3 + keywordHits;
    return { ...dream, score, sharedThemes };
  });

  const matches = scored
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(d => ({
      text:      d.text,
      themes:    d.themes,
      sub:       d.sub,
      resonance: sharedReason(d.sharedThemes),
    }));

  return res.status(200).json({ matches, themes, keywords });
}
