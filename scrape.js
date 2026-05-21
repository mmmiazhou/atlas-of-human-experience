// node scrape.js  — fetches r/Dreams top posts and classifies by theme + region
import { writeFileSync } from 'fs';

const THEMES = [
  { id: 'deceased',    keywords: ['dead', 'died', 'death', 'passed away', 'deceased', 'grandmother', 'grandfather', 'grandparent', 'mom died', 'dad died', 'funeral', 'grave', 'lost someone', 'she passed', 'he passed'] },
  { id: 'chased',      keywords: ['chased', 'chase', 'running from', 'following me', 'being followed', 'pursued', 'escape from', 'running away', 'being chased', 'ran away', 'someone after me'] },
  { id: 'flying',      keywords: ['flying', 'i was flying', 'flew', 'float', 'soar', 'levitate', 'levitation', 'hovering', 'airborne', 'in the air'] },
  { id: 'falling',     keywords: ['falling', 'i was falling', 'fell', 'fall off', 'plunging', 'dropped', 'falling down', 'fell off a'] },
  { id: 'teeth',       keywords: ['teeth', 'tooth', 'dental', 'braces', 'losing teeth', 'teeth falling', 'tooth falling', 'teeth fell', 'teeth crumbling'] },
  { id: 'ancestors',   keywords: ['ancestor', 'spirit visit', 'ghost of', 'deceased relative', 'visitation', 'came to me in a dream', 'visited me in', 'dead relative'] },
  { id: 'exam',        keywords: ['exam', 'test', 'school', 'forgot', 'late to class', 'unprepared', 'failed class', 'work presentation', 'job interview', 'college', 'didn\'t study', 'homework'] },
  { id: 'divine',      keywords: ['god', 'angel', 'divine', 'prophet', 'religious', 'heaven', 'hell', 'demon', 'devil', 'satan', 'jesus', 'allah', 'spiritual experience', 'deity'] },
  { id: 'paralysis',   keywords: ['sleep paralysis', 'paralysis', "couldn't move", "couldn't scream", 'frozen in place', 'shadow figure', 'old hag', 'pinned down', 'couldn\'t wake up', 'felt like something on me'] },
  { id: 'lucid',       keywords: ['lucid', 'lucid dream', 'aware i was dreaming', 'realized i was dreaming', 'took control', 'became aware', 'conscious in', 'control the dream', 'wake up inside'] },
  { id: 'apocalypse',  keywords: ['zombie', 'apocalypse', 'end of world', 'end of the world', 'disaster', 'nuclear', 'invasion', 'survival', 'post-apocalyptic', 'world ending', 'mass destruction'] },
  { id: 'celebrity',   keywords: ['celebrity', 'famous person', 'actor', 'singer', 'musician', 'athlete', 'youtuber', 'met a famous', 'dated a celebrity', 'celebrity dream'] },
];

const REGIONS = [
  { name: 'N. America',             re: /\b(usa|u\.s\.a|united states|america\b|american|canada|canadian|new york|california|texas|chicago|toronto|vancouver|los angeles|washington|florida)\b/i },
  { name: 'Latin America',          re: /\b(brazil|brazilian|argentina|argentinian|colombia|colombian|chile|chilean|peru|peruvian|venezuela|mexican|mexico|latin america|south america|puerto rico|cuba|ecuador)\b/i },
  { name: 'W. Europe',              re: /\b(uk|england|english|british|france|french|germany|german|europe\b|european|spain|spanish|italy|italian|netherlands|dutch|sweden|swedish|norway|norwegian|denmark|danish|portugal|portuguese|belgium|swiss|switzerland|ireland|irish|scotland|scottish)\b/i },
  { name: 'E. Europe & Russia',     re: /\b(russia|russian|ukraine|ukrainian|poland|polish|romania|romanian|hungary|hungarian|czech|serbia|serbian|slovakia|croatia|bulgaria|belarus|baltics|eastern europe)\b/i },
  { name: 'Middle East & N.Africa', re: /\b(arab|arabic|muslim|islam|islamic|egypt|egyptian|saudi|turkey|turkish|iran|iranian|iraq|iraqi|morocco|moroccan|jordan|jordanian|lebanon|lebanese|palestine|algeria|tunisia|qatar|dubai|uae)\b/i },
  { name: 'Sub-Saharan Africa',     re: /\b(africa\b|african|nigeria|nigerian|kenya|kenyan|south africa|south african|ghana|ghanaian|ethiopia|ethiopian|tanzania|tanzania|uganda|zimbabwe|cameroon|ivory coast)\b/i },
  { name: 'South Asia',             re: /\b(india\b|indian|pakistan|pakistani|bangladesh|bengali|sri lanka|nepali|nepal|hindi|mumbai|delhi|bangalore|karachi|dhaka)\b/i },
  { name: 'East Asia',              re: /\b(japan|japanese|china|chinese|korea|korean|taiwan|taiwanese|beijing|tokyo|shanghai|seoul|hong kong|anime|manga|singaporean|singapore|vietnamese|vietnam|philippines|filipino)\b/i },
  { name: 'Oceania',                re: /\b(australia|australian|new zealand|kiwi\b|pacific island|fiji|sydney|melbourne|auckland)\b/i },
];

async function fetchPosts(subreddit, pages = 6) {
  const posts = [];
  let after = '';
  for (let p = 0; p < pages; p++) {
    const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=100&t=year${after ? `&after=${after}` : ''}`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'DreamAtlasResearch/1.0' } });
      if (!res.ok) { console.warn(`  HTTP ${res.status} on page ${p + 1}`); break; }
      const json = await res.json();
      const children = json?.data?.children ?? [];
      posts.push(...children.map(c => c.data));
      after = json?.data?.after ?? '';
      console.log(`  page ${p + 1}: +${children.length} posts (total ${posts.length})`);
      if (!after) break;
    } catch (e) {
      console.warn(`  error page ${p + 1}:`, e.message);
      break;
    }
    await new Promise(r => setTimeout(r, 1200));
  }
  return posts;
}

function scorePost(post) {
  const text = `${post.title} ${post.selftext ?? ''}`.toLowerCase();
  const scores = {};
  for (const t of THEMES) {
    scores[t.id] = t.keywords.filter(k => text.includes(k)).length;
  }
  return scores;
}

function detectRegion(post) {
  const text = `${post.title} ${post.selftext ?? ''} ${post.author_flair_text ?? ''}`.toLowerCase();
  for (const r of REGIONS) {
    if (r.re.test(text)) return r.name;
  }
  return null;
}

async function main() {
  const subreddits = ['Dreams', 'LucidDreaming', 'Nightmares'];
  let allPosts = [];

  for (const sub of subreddits) {
    console.log(`\nFetching r/${sub}...`);
    const posts = await fetchPosts(sub, sub === 'Dreams' ? 8 : 4);
    allPosts.push(...posts);
  }

  // Deduplicate by post ID
  const seen = new Set();
  allPosts = allPosts.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  console.log(`\nTotal unique posts: ${allPosts.length}`);

  // Aggregate
  const regionNames = REGIONS.map(r => r.name);
  const counts = {};
  for (const rn of [...regionNames, 'Unknown']) {
    counts[rn] = {};
    for (const t of THEMES) counts[rn][t.id] = 0;
  }

  let matched = 0;
  for (const post of allPosts) {
    const scores = scorePost(post);
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    if (total === 0) continue;
    matched++;
    const region = detectRegion(post) ?? 'Unknown';
    for (const [tid, score] of Object.entries(scores)) {
      counts[region][tid] += score;
    }
  }

  console.log(`Matched ${matched}/${allPosts.length} posts to at least one theme`);

  // Distribute Unknown proportionally across regions weighted by post count
  const regionTotals = regionNames.map(rn => Object.values(counts[rn]).reduce((a, b) => a + b, 0));
  const totalKnown = regionTotals.reduce((a, b) => a + b, 0) || 1;
  for (const [tid, unkScore] of Object.entries(counts['Unknown'])) {
    regionNames.forEach((rn, i) => {
      counts[rn][tid] += Math.round(unkScore * (regionTotals[i] / totalKnown));
    });
  }

  // Normalize per-region: scale max to 100
  const normalized = {};
  for (const rn of regionNames) {
    const vals = Object.values(counts[rn]);
    const max = Math.max(...vals, 1);
    normalized[rn] = {};
    for (const [tid, v] of Object.entries(counts[rn])) {
      normalized[rn][tid] = Math.max(1, Math.round(v / max * 100));
    }
  }

  // Global totals (raw, no distribution of unknowns)
  const globalRaw = {};
  for (const t of THEMES) globalRaw[t.id] = 0;
  for (const rn of [...regionNames, 'Unknown']) {
    for (const [tid, v] of Object.entries(counts[rn])) globalRaw[tid] += v;
  }

  console.log('\nGlobal theme totals (raw scores):');
  Object.entries(globalRaw).sort((a, b) => b[1] - a[1]).forEach(([id, v]) => {
    console.log(`  ${id.padEnd(14)} ${v}`);
  });

  // Save individual posts as corpus for dream matching
  const corpus = allPosts
    .filter(p => {
      const scores = scorePost(p);
      return Object.values(scores).some(s => s > 0);
    })
    .map(p => {
      const scores = scorePost(p);
      const themes = Object.entries(scores)
        .filter(([, s]) => s > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([id]) => id);
      const text = (p.title + (p.selftext ? ' — ' + p.selftext : '')).slice(0, 500).trim();
      return { id: p.id, text, themes, sub: p.subreddit };
    });

  writeFileSync(new URL('./corpus.json', import.meta.url), JSON.stringify(corpus, null, 2));
  console.log(`\nWrote corpus.json (${corpus.length} dreams) ✓`);

  // Write output
  const globalFields = THEMES.map(t => `${t.id}: ${globalRaw[t.id]}`).join(', ');

  const output = `// Auto-generated by scrape.js — ${new Date().toISOString()}
// Sources: r/Dreams, r/LucidDreaming, r/Nightmares (top posts, past year)
// Posts analyzed: ${allPosts.length} | Posts matched: ${matched}

// Raw global theme scores (used for bubble chart)
var redditGlobal = { ${globalFields} };
`;

  writeFileSync(new URL('./data-reddit.js', import.meta.url), output);
  console.log('\nWrote data-reddit.js ✓');
}

main().catch(e => { console.error(e); process.exit(1); });
