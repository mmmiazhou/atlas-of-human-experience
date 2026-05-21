// ── Theme / research data ─────────────────────────────────────────────────────

const themes = [
  { id: "deceased",   label: "Deceased relatives",     color: [194, 82, 138] },
  { id: "chased",     label: "Being chased",            color: [224, 82, 82]  },
  { id: "flying",     label: "Flying",                  color: [112, 104, 204] },
  { id: "falling",    label: "Falling",                 color: [196, 146, 10] },
  { id: "teeth",      label: "Teeth falling out",       color: [42, 168, 130] },
  { id: "ancestors",  label: "Ancestor / spirit visit", color: [212, 120, 74] },
  { id: "exam",       label: "Exam / work failure",     color: [74, 142, 194] },
  { id: "divine",     label: "Divine / prophetic",      color: [122, 170, 48] },
  { id: "paralysis",  label: "Sleep paralysis",         color: [100, 60, 180] },
  { id: "lucid",      label: "Lucid dreaming",          color: [20, 180, 200] },
  { id: "apocalypse", label: "Apocalypse / disaster",   color: [200, 70, 30]  },
  { id: "celebrity",  label: "Celebrities",             color: [200, 160, 20] },
];

const researchContinents = [
  { name: "N. America",             color: [42, 168, 130],  deceased: 14, chased: 28, flying: 22, falling: 26, teeth: 22, ancestors: 8,  exam: 30, divine: 10, paralysis: 0, lucid: 0, apocalypse: 0, celebrity: 0, ids: new Set([124, 840, 484]) },
  { name: "Latin America",          color: [194, 82, 138],  deceased: 38, chased: 22, flying: 30, falling: 14, teeth: 10, ancestors: 20, exam: 12, divine: 16, paralysis: 0, lucid: 0, apocalypse: 0, celebrity: 0, ids: new Set([32, 68, 76, 152, 170, 218, 600, 604, 858, 862, 740, 328, 254, 630, 214, 192, 388, 320, 340, 558, 591, 222]) },
  { name: "W. Europe",              color: [112, 104, 204], deceased: 12, chased: 25, flying: 20, falling: 18, teeth: 20, ancestors: 6,  exam: 28, divine: 8,  paralysis: 0, lucid: 0, apocalypse: 0, celebrity: 0, ids: new Set([8, 20, 40, 56, 70, 191, 203, 208, 233, 246, 250, 276, 300, 336, 348, 352, 372, 380, 438, 442, 470, 492, 499, 528, 578, 616, 620, 642, 674, 703, 705, 724, 752, 756, 826]) },
  { name: "E. Europe & Russia",     color: [155, 111, 181], deceased: 10, chased: 22, flying: 14, falling: 16, teeth: 12, ancestors: 14, exam: 18, divine: 10, paralysis: 0, lucid: 0, apocalypse: 0, celebrity: 0, ids: new Set([112, 804, 643, 498, 807, 688, 100, 440, 428, 233, 51, 31, 268, 398, 417, 762, 795, 860]) },
  { name: "Middle East & N.Africa", color: [196, 146, 10],  deceased: 15, chased: 12, flying: 10, falling: 10, teeth: 12, ancestors: 18, exam: 14, divine: 36, paralysis: 0, lucid: 0, apocalypse: 0, celebrity: 0, ids: new Set([12, 368, 376, 400, 414, 422, 434, 504, 512, 275, 634, 682, 760, 784, 788, 818, 887]) },
  { name: "Sub-Saharan Africa",     color: [212, 120, 74],  deceased: 29, chased: 16, flying: 18, falling: 12, teeth: 8,  ancestors: 36, exam: 10, divine: 22, paralysis: 0, lucid: 0, apocalypse: 0, celebrity: 0, ids: new Set([24, 72, 108, 120, 132, 140, 174, 175, 178, 180, 204, 231, 232, 262, 266, 270, 288, 324, 384, 404, 426, 430, 450, 454, 466, 478, 508, 516, 562, 566, 638, 646, 686, 694, 706, 710, 716, 728, 729, 768, 800, 834, 854, 894]) },
  { name: "South Asia",             color: [122, 170, 48],  deceased: 18, chased: 14, flying: 26, falling: 16, teeth: 10, ancestors: 22, exam: 20, divine: 32, paralysis: 0, lucid: 0, apocalypse: 0, celebrity: 0, ids: new Set([50, 64, 356, 462, 524, 586, 144]) },
  { name: "East Asia",              color: [74, 142, 194],  deceased: 24, chased: 20, flying: 16, falling: 22, teeth: 14, ancestors: 30, exam: 38, divine: 12, paralysis: 0, lucid: 0, apocalypse: 0, celebrity: 0, ids: new Set([156, 392, 408, 410, 496, 158, 418, 116, 764, 704, 360, 458]) },
  { name: "Oceania",                color: [224, 82, 82],   deceased: 20, chased: 15, flying: 28, falling: 12, teeth: 10, ancestors: 24, exam: 14, divine: 14, paralysis: 0, lucid: 0, apocalypse: 0, celebrity: 0, ids: new Set([36, 554, 598, 242, 90, 548, 316, 184, 258, 574, 882, 776, 798, 520, 584, 583, 585]) },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function themeColor(ts) { return themes.find(t => t.id === ts?.[0])?.color ?? [160, 155, 150]; }
function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function lerpC(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
function pip(px, py, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

// ── Globe setup ───────────────────────────────────────────────────────────────

const canvas = document.getElementById('gc');
const wrap   = document.getElementById('globe-wrap');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setClearColor(0xf9f8f5, 1);
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.position.z = 3.1;
scene.add(new THREE.AmbientLight(0xffffff, 1));

const world = new THREE.Group();
scene.add(world);

function resize() {
  const rect = wrap.getBoundingClientRect();
  const w = rect.width, h = rect.height;
  if (!w || !h) return;
  const s = Math.max(100, Math.min(w, h, 760) - 32);
  canvas.width = s; canvas.height = s;
  renderer.setSize(s, s);
  camera.aspect = 1; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(wrap);

function ll2v(lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}

world.add(new THREE.Mesh(
  new THREE.SphereGeometry(1, 80, 80),
  new THREE.MeshBasicMaterial({ color: 0xf5f3ef, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
));
const gm = new THREE.LineBasicMaterial({ color: 0xc8c4bc, transparent: true, opacity: 0.22 });
const ge = new THREE.LineBasicMaterial({ color: 0x888480, transparent: true, opacity: 0.42 });
for (let lt = -75; lt <= 75; lt += 15) {
  const p = []; for (let i = 0; i <= 120; i++) p.push(ll2v(lt, (i/120)*360-180, 1.001));
  world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), lt===0?ge:gm));
}
for (let ln = -165; ln <= 180; ln += 15) {
  const p = []; for (let i = 0; i <= 80; i++) p.push(ll2v((i/80)*180-90, ln, 1.001));
  world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), ln===0?ge:gm));
}

// ── Globe layers ──────────────────────────────────────────────────────────────

const communityGroup  = new THREE.Group(); // community dream dots + arcs
const researchGroup   = new THREE.Group(); // research continent dots + outlines
const communityOutlineGroup = new THREE.Group(); // muted outlines (community)
world.add(communityOutlineGroup);
world.add(researchGroup);
world.add(communityGroup);

// ── Community mode ────────────────────────────────────────────────────────────

let dreamData    = {};
let arcData      = [];
const dreamMeshes = [];
const dotGroup   = new THREE.Group();
const arcGroup   = new THREE.Group();
communityGroup.add(arcGroup);
communityGroup.add(dotGroup);

function makeDot(dream) {
  const c = themeColor(dream.themes);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.009, 7, 7), new THREE.MeshBasicMaterial({ color: new THREE.Color(`rgb(${c.join(',')})`) }));
  mesh.position.copy(ll2v(dream.lat, dream.lon, 1.013));
  mesh.userData.dreamId = dream.id;
  return mesh;
}
function makeArc(a, b, color, opacity) {
  const p1 = ll2v(a.lat, a.lon, 1.013), p2 = ll2v(b.lat, b.lon, 1.013);
  const mid = new THREE.Vector3().addVectors(p1, p2).normalize().multiplyScalar(1.22);
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(p1, mid, p2).getPoints(64)),
    new THREE.LineBasicMaterial({ color: new THREE.Color(`rgb(${color.join(',')})`), transparent: true, opacity })
  );
}
function renderDreams(dreams, connections) {
  dotGroup.clear(); arcGroup.clear(); dreamMeshes.length = 0; arcData.length = 0; dreamData = {};
  dreams.forEach(d => { dreamData[d.id] = d; const m = makeDot(d); dotGroup.add(m); dreamMeshes.push(m); });
  connections.forEach(c => {
    const a = dreamData[c.dream_a], b = dreamData[c.dream_b]; if (!a || !b) return;
    const line = makeArc(a, b, themeColor(c.shared_themes), 0.15 * (c.strength ?? 0.6));
    arcGroup.add(line);
    arcData.push({ line, ...c });
  });
  document.getElementById('dream-count').textContent = `${dreams.length} dream${dreams.length===1?'':'s'}`;
}
async function loadDreams() {
  try {
    const [dr, summ] = await Promise.all([
      fetch('/api/dreams').then(r => r.json()),
      fetch('/api/summary').then(r => r.json()),
    ]);
    renderDreams(dr.dreams ?? [], dr.connections ?? []);
    const el = document.getElementById('summary-text');
    el.classList.remove('loading');
    el.textContent = summ?.content ?? 'No dreams shared yet. Be the first.';
  } catch {
    document.getElementById('summary-text').classList.remove('loading');
    document.getElementById('summary-text').textContent = 'Could not load dreams.';
    document.getElementById('dream-count').textContent = '0 dreams';
  }
}

// ── Research mode ─────────────────────────────────────────────────────────────

const researchHoverMeshes = [];
const researchDotStore    = [];
let   hovResearch         = null;

function buildDotColors(themeIds, contColor) {
  const cols = [];
  themeIds.forEach(tid => {
    const t = themes.find(x => x.id === tid) ?? { color: [160,155,150] };
    cols.push(...lerpC(contColor, t.color, 0.85).map(v => v/255));
  });
  return cols;
}

function buildResearchGlobe(features) {
  const countryMap = {};
  features.forEach(f => { countryMap[+f.id] = f; });

  researchContinents.forEach(cont => {
    const ts = themes.map(t => ({ ...t, count: cont[t.id]||0 })).sort((a,b) => b.count-a.count);
    const total = ts.reduce((s,t) => s+t.count, 0) || 1;
    const palette = [];
    ts.forEach(t => { const n = Math.round(t.count/total*100); for (let i=0;i<n;i++) palette.push(t.id); });
    if (!palette.length) palette.push(ts[0].id);

    const allRings = [];
    let latMin=90, latMax=-90, lonMin=180, lonMax=-180;

    cont.ids.forEach(id => {
      const f = countryMap[id]; if (!f) return;
      const polys = f.geometry.type==='Polygon' ? [f.geometry.coordinates] : f.geometry.type==='MultiPolygon' ? f.geometry.coordinates : [];
      polys.forEach(poly => {
        const ring = poly[0]; if (!ring||ring.length<3) return;
        allRings.push(ring);
        ring.forEach(([lo,la]) => { latMin=Math.min(latMin,la); latMax=Math.max(latMax,la); lonMin=Math.min(lonMin,lo); lonMax=Math.max(lonMax,lo); });
        const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(`rgb(${cont.color.join(',')})`), transparent: true, opacity: 0.55 });
        researchGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring.map(([lo,la]) => ll2v(la,lo,1.003))), mat));
      });
    });

    // Scatter dots
    const dotPos = [], dotThemeIds = [];
    const DOTS = 300, bb = { latMin:latMin-0.5, latMax:latMax+0.5, lonMin:lonMin-0.5, lonMax:lonMax+0.5 };
    let placed=0, tries=0;
    while (placed<DOTS && tries<DOTS*40) {
      tries++;
      const lat = bb.latMin + Math.random()*(bb.latMax-bb.latMin);
      const lon = bb.lonMin + Math.random()*(bb.lonMax-bb.lonMin);
      let inside = false;
      for (const ring of allRings) { if (pip(lon,lat,ring)) { inside=true; break; } }
      if (!inside) continue;
      dotPos.push(...ll2v(lat,lon,1.005).toArray());
      dotThemeIds.push(palette[Math.floor(Math.random()*palette.length)]);
      placed++;
    }
    if (dotPos.length) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(dotPos, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(buildDotColors(dotThemeIds, cont.color), 3));
      researchGroup.add(new THREE.Points(geo, new THREE.PointsMaterial({ size:2.8, vertexColors:true, sizeAttenuation:false, transparent:true, opacity:0.85, depthWrite:false })));
      researchDotStore.push({ geo, themeIds: dotThemeIds, cont });
    }

    // Hover mesh
    const hm = new THREE.Mesh(new THREE.SphereGeometry(0.22,12,12), new THREE.MeshBasicMaterial({ visible:false }));
    hm.position.copy(ll2v((latMin+latMax)/2, (lonMin+lonMax)/2, 1.0));
    hm.userData = { name: cont.name, lat:(latMin+latMax)/2, lon:(lonMin+lonMax)/2 };
    researchGroup.add(hm);
    researchHoverMeshes.push(hm);

    // Legend row
    const row = document.createElement('div');
    row.className = 'lrow'; row.dataset.name = cont.name;
    row.innerHTML = `<span class="ldot" style="background:rgb(${cont.color.join(',')})"></span><span>${cont.name}</span>`;
    row.addEventListener('mouseenter', () => setHoverResearch(cont.name));
    row.addEventListener('mouseleave', () => setHoverResearch(null));
    document.getElementById('research-legend').appendChild(row);
  });
}

function setHoverResearch(name) {
  if (name === hovResearch) return;
  hovResearch = name;
  document.querySelectorAll('.lrow').forEach(r => r.classList.toggle('active', r.dataset.name===name));
  if (!name) {
    document.getElementById('research-ph').style.display='block';
    document.getElementById('research-pc').style.display='none';
    return;
  }
  const cont = researchContinents.find(c => c.name===name);
  const ts = themes.map(t => ({...t, count:cont[t.id]||0})).sort((a,b) => b.count-a.count);
  const max = ts[0]?.count || 1;
  document.getElementById('research-ph').style.display='none';
  document.getElementById('research-pc').style.display='block';
  document.getElementById('research-region').textContent = name;
  document.getElementById('research-themes').innerHTML = ts.map(t =>
    `<div class="br"><div class="bl"><span>${t.label}</span><b>${t.count}</b></div>
     <div class="bb"><div class="bf" style="width:${Math.round(t.count/max*100)}%;background:rgb(${t.color.join(',')})"></div></div></div>`
  ).join('');
}

// ── Reddit bubble chart ───────────────────────────────────────────────────────

let bubbleRendered = false;
function renderBubbleChart() {
  const raw = window.redditGlobal; if (!raw) return;
  const wrap2 = document.getElementById('bubble-chart');
  wrap2.innerHTML = '';
  const W = wrap2.clientWidth || wrap.clientWidth;
  const H = wrap2.clientHeight || wrap.clientHeight;
  if (!W || !H) { requestAnimationFrame(renderBubbleChart); return; }
  const maxScore = Math.max(...Object.values(raw));
  const bubbles = themes.map((t,idx) => ({
    label:t.label, score:raw[t.id]||0, color:t.color, idx,
    r: 22 + 66*Math.sqrt((raw[t.id]||0)/maxScore),
    x:W/2+(Math.random()-.5)*60, y:H/2+(Math.random()-.5)*60, vx:0, vy:0,
  }));
  for (let iter=0;iter<700;iter++) {
    bubbles.forEach(b => { b.vx+=(W/2-b.x)*0.01; b.vy+=(H/2-b.y)*0.01; });
    for (let i=0;i<bubbles.length;i++) for (let j=i+1;j<bubbles.length;j++) {
      const dx=bubbles[j].x-bubbles[i].x, dy=bubbles[j].y-bubbles[i].y;
      const d=Math.sqrt(dx*dx+dy*dy)||0.01, min=bubbles[i].r+bubbles[j].r+4;
      if (d<min) { const f=(min-d)/d*.5; bubbles[i].vx-=dx*f; bubbles[i].vy-=dy*f; bubbles[j].vx+=dx*f; bubbles[j].vy+=dy*f; }
    }
    bubbles.forEach(b => { b.x+=b.vx; b.y+=b.vy; b.vx*=.8; b.vy*=.8; b.x=Math.max(b.r+2,Math.min(W-b.r-2,b.x)); b.y=Math.max(b.r+2,Math.min(H-b.r-2,b.y)); });
  }
  const ns='http://www.w3.org/2000/svg', svg=document.createElementNS(ns,'svg');
  svg.setAttribute('width',W); svg.setAttribute('height',H); svg.style.display='block';
  bubbles.forEach(b => {
    const [r,g,bl]=b.color;
    const c=document.createElementNS(ns,'circle');
    c.setAttribute('cx',b.x.toFixed(1)); c.setAttribute('cy',b.y.toFixed(1)); c.setAttribute('r',b.r.toFixed(1));
    c.setAttribute('fill',`rgb(${r},${g},${bl})`); svg.appendChild(c);
    if (b.r>28) {
      const fs=Math.max(9,Math.min(12,b.r*.19));
      const t1=document.createElementNS(ns,'text');
      t1.setAttribute('x',b.x.toFixed(1)); t1.setAttribute('y',(b.y-(b.r>40?fs*.6:0)).toFixed(1));
      t1.setAttribute('text-anchor','middle'); t1.setAttribute('dominant-baseline','middle');
      t1.setAttribute('font-size',fs); t1.setAttribute('font-weight','500');
      t1.setAttribute('fill','rgba(255,255,255,0.95)');
      t1.setAttribute('font-family','-apple-system,BlinkMacSystemFont,sans-serif');
      t1.setAttribute('pointer-events','none'); t1.textContent=b.label; svg.appendChild(t1);
      if (b.r>40) {
        const t2=document.createElementNS(ns,'text');
        t2.setAttribute('x',b.x.toFixed(1)); t2.setAttribute('y',(b.y+fs+2).toFixed(1));
        t2.setAttribute('text-anchor','middle'); t2.setAttribute('dominant-baseline','middle');
        t2.setAttribute('font-size',(fs*.78).toFixed(1)); t2.setAttribute('fill','rgba(255,255,255,0.55)');
        t2.setAttribute('font-family','-apple-system,BlinkMacSystemFont,sans-serif');
        t2.setAttribute('pointer-events','none'); t2.textContent=b.score.toLocaleString(); svg.appendChild(t2);
      }
    }
  });
  wrap2.appendChild(svg);
  bubbleRendered = true;
}

// ── Mode switching ────────────────────────────────────────────────────────────

let currentMode = 'community';

window.switchMode = function(mode) {
  if (mode === currentMode) return;
  currentMode = mode;

  communityGroup.visible        = mode === 'community';
  researchGroup.visible         = mode === 'research';
  communityOutlineGroup.visible = mode === 'community';
  canvas.style.visibility       = mode === 'reddit' ? 'hidden' : 'visible';

  const bc = document.getElementById('bubble-chart');
  bc.style.display = mode === 'reddit' ? 'block' : 'none';
  if (mode === 'reddit' && !bubbleRendered) requestAnimationFrame(renderBubbleChart);

  document.getElementById('community-sidebar').style.display = mode === 'community' ? 'contents' : 'none';
  document.getElementById('research-sidebar').style.display  = mode === 'research'  ? 'flex'     : 'none';
  document.getElementById('reddit-sidebar').style.display    = mode === 'reddit'    ? 'flex'     : 'none';

  document.querySelectorAll('.dt-btn[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
};

// ── Globe init ────────────────────────────────────────────────────────────────

async function initGlobe() {
  const topo = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json());
  const features = topojson.feature(topo, topo.objects.countries).features;

  // Community outlines (muted)
  const muted = new THREE.LineBasicMaterial({ color: 0xbbb7b0, transparent: true, opacity: 0.5 });
  features.forEach(f => {
    const polys = f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[];
    polys.forEach(poly => {
      const ring = poly[0]; if (!ring||ring.length<3) return;
      communityOutlineGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring.map(([lo,la]) => ll2v(la,lo,1.003))), muted));
    });
  });

  // Research mode layers
  buildResearchGlobe(features);
  researchGroup.visible = false;

  document.getElementById('globe-loading').style.display = 'none';
  loadDreams();
}

// ── Dream detail panel ────────────────────────────────────────────────────────

let activeDreamId = null;

function showSidebarState(id) {
  ['placeholder','dream-detail','submit-form','submit-result'].forEach(s => {
    document.getElementById(s).style.display = s===id ? 'block' : 'none';
  });
  document.getElementById('open-submit').textContent = id==='submit-form' ? '← Cancel' : 'Add your dream →';
  document.getElementById('add-cta').style.display = id==='submit-result' ? 'none' : 'block';
  if (id==='submit-form') document.getElementById('dream-text').focus();
}

function selectDream(id) {
  activeDreamId = id;
  arcData.forEach(a => { a.line.material.opacity = 0.04; });
  if (id) {
    arcData.filter(a => a.dream_a===id||a.dream_b===id).forEach(a => { a.line.material.opacity = Math.min(0.9,(a.strength??0.6)*1.1); });
  } else {
    arcData.forEach(a => { a.line.material.opacity = 0.15*(a.strength??0.6); });
  }
  if (!id) { showSidebarState('placeholder'); return; }
  const dream = dreamData[id]; if (!dream) return;
  showSidebarState('dream-detail');
  document.getElementById('d-region').textContent = dream.region;
  document.getElementById('d-date').textContent   = timeAgo(dream.created_at);
  document.getElementById('d-text').textContent   = dream.text;
  document.getElementById('d-themes').innerHTML = (dream.themes??[]).map(t => {
    const c = themes.find(x=>x.id===t)?.color??[160,155,150];
    return `<span class="theme-chip" style="background:rgb(${c.join(',')});">${t}</span>`;
  }).join('');
  const ppEl = document.getElementById('d-penpal');
  ppEl.innerHTML = dream.contact ? `<div class="penpal-row"><span class="penpal-icon">✉</span><div><div class="penpal-label">Open to pen pals</div><div class="penpal-contact">${dream.contact}</div></div></div>` : '';
  const connected = arcData.filter(a => a.dream_a===id||a.dream_b===id);
  const connLabel = document.getElementById('conn-label'), connEl = document.getElementById('d-connections');
  if (!connected.length) { connLabel.textContent=''; connEl.innerHTML='<p style="font-size:11px;color:#b0aca6;padding:4px 0">No connections yet.</p>'; }
  else {
    connLabel.textContent = `${connected.length} connected dream${connected.length===1?'':'s'}`;
    connEl.innerHTML = connected.map(c => {
      const otherId = c.dream_a===id?c.dream_b:c.dream_a, other=dreamData[otherId];
      return `<div class="conn-card" data-id="${otherId}"><div class="conn-reason-text">${c.reason}</div>${other?`<div class="conn-essence">"${other.essence}"</div><div class="conn-region-tag">${other.region}</div>`:''}</div>`;
    }).join('');
    connEl.querySelectorAll('.conn-card').forEach(card => card.addEventListener('click', () => selectDream(card.dataset.id)));
  }
}

// ── Raycasting + interaction ──────────────────────────────────────────────────

const ray = new THREE.Raycaster();
let rotX=0.25, rotY=0.4, drag=false, lx=0, ly=0, velX=0, velY=0;
let mouseDownX=0, mouseDownY=0;
world.rotation.x=rotX; world.rotation.y=rotY;

canvas.addEventListener('mousedown', e => { drag=true; lx=e.clientX; ly=e.clientY; mouseDownX=e.clientX; mouseDownY=e.clientY; velX=0; velY=0; canvas.style.cursor='grabbing'; });
window.addEventListener('mouseup', () => { drag=false; canvas.style.cursor='grab'; });
canvas.addEventListener('click', e => {
  if (Math.abs(e.clientX-mouseDownX)+Math.abs(e.clientY-mouseDownY)>6) return;
  const rect=canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1), camera);
  if (currentMode==='community') {
    const hits=ray.intersectObjects(dreamMeshes);
    selectDream(hits.length?hits[0].object.userData.dreamId:null);
  } else if (currentMode==='research') {
    const hits=ray.intersectObjects(researchHoverMeshes);
    setHoverResearch(hits.length?hits[0].object.userData.name:null);
  }
});
window.addEventListener('mousemove', e => {
  if (drag) {
    velX=(e.clientY-ly)*0.005; velY=(e.clientX-lx)*0.005;
    rotX=Math.max(-1.4,Math.min(1.4,rotX+velX)); rotY+=velY;
    lx=e.clientX; ly=e.clientY; world.rotation.x=rotX; world.rotation.y=rotY; return;
  }
  const rect=canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1), camera);
  if (currentMode==='community') {
    const hits=ray.intersectObjects(dreamMeshes);
    canvas.style.cursor=hits.length?'pointer':'grab';
  } else if (currentMode==='research') {
    const hits=ray.intersectObjects(researchHoverMeshes);
    canvas.style.cursor=hits.length?'pointer':'grab';
    setHoverResearch(hits.length?hits[0].object.userData.name:null);
  } else {
    canvas.style.cursor='default';
  }
});
canvas.addEventListener('mouseleave', () => { if (currentMode==='research') setHoverResearch(null); });
window.addEventListener('resize', resize);

// ── Submission ────────────────────────────────────────────────────────────────

document.getElementById('open-submit').addEventListener('click', () => {
  const isForm = document.getElementById('submit-form').style.display === 'block';
  if (isForm) {
    showSidebarState(activeDreamId ? 'dream-detail' : 'placeholder');
  } else {
    document.getElementById('dream-text').value = '';
    document.getElementById('dream-contact').value = '';
    document.getElementById('submit-error').textContent = '';
    document.getElementById('submit-btn').disabled = false;
    document.getElementById('submit-btn').textContent = 'Share dream →';
    showSidebarState('submit-form');
  }
});

document.getElementById('submit-btn').addEventListener('click', async () => {
  const text=document.getElementById('dream-text').value.trim();
  const region=document.getElementById('dream-region').value;
  const contact=document.getElementById('dream-contact').value.trim();
  const errEl=document.getElementById('submit-error'), btn=document.getElementById('submit-btn');
  if (text.length<20) { errEl.textContent='Please describe your dream in more detail.'; return; }
  errEl.textContent=''; btn.disabled=true; btn.textContent='Sharing…';
  document.getElementById('submit-status').textContent='Analyzing your dream…';
  try {
    const res=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,region,contact:contact||null})});
    if (!res.ok) throw new Error();
    const {dream,matched}=await res.json();
    dreamData[dream.id]=dream;
    const mesh=makeDot(dream); dotGroup.add(mesh); dreamMeshes.push(mesh);
    matched.forEach(c => {
      const other=dreamData[c.dream_b]; if (!other) return;
      const line=makeArc(dream,other,themeColor(c.shared_themes),0.7*(c.strength??0.6));
      arcGroup.add(line); arcData.push({line,dream_a:dream.id,dream_b:c.dream_b,shared_themes:c.shared_themes,reason:c.reason,strength:c.strength});
    });
    document.getElementById('dream-count').textContent=`${Object.keys(dreamData).length} dreams`;
    document.getElementById('r-essence').textContent=`"${dream.essence}"`;
    const mLabel=document.getElementById('r-matches-label'), mEl=document.getElementById('r-matches');
    if (!matched.length) { mLabel.textContent=''; mEl.innerHTML='<p style="font-size:11px;color:#b0aca6">No close matches yet.</p>'; }
    else {
      mLabel.textContent=`${matched.length} resonant dream${matched.length===1?'':'s'}`;
      mEl.innerHTML=matched.map(c=>`<div class="conn-card" data-id="${c.dream_b}"><div class="conn-reason-text">${c.reason}</div>${c.dream?`<div class="conn-essence">"${c.dream.essence}"</div><div class="conn-region-tag">${c.dream.region}</div>`:''}</div>`).join('');
      mEl.querySelectorAll('.conn-card').forEach(card=>card.addEventListener('click',()=>selectDream(card.dataset.id)));
    }
    showSidebarState('submit-result');
    document.getElementById('sidebar-body').scrollTo({top:0,behavior:'smooth'});
    selectDream(dream.id);
  } catch {
    document.getElementById('submit-error').textContent='Something went wrong. Please try again.';
    btn.disabled=false; btn.textContent='Share dream →'; document.getElementById('submit-status').textContent='';
  }
});

document.getElementById('another-btn').addEventListener('click', () => {
  document.getElementById('dream-text').value = '';
  document.getElementById('dream-contact').value = '';
  document.getElementById('submit-error').textContent = '';
  document.getElementById('submit-status').textContent = '';
  document.getElementById('submit-btn').disabled = false;
  document.getElementById('submit-btn').textContent = 'Share dream →';
  showSidebarState('submit-form');
});

// ── Animate ───────────────────────────────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);
  if (!drag) {
    velX*=0.88; velY*=0.88;
    rotX=Math.max(-1.4,Math.min(1.4,rotX+velX)); rotY+=velY;
    world.rotation.x=rotX; world.rotation.y=rotY;
  }
  renderer.render(scene,camera);
}

initGlobe().then(() => animate());
