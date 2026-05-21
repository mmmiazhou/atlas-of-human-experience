const THEME_COLORS = {
  deceased:   [194, 82, 138], chased:    [224, 82, 82],
  flying:     [112, 104, 204], falling:  [196, 146, 10],
  teeth:      [42, 168, 130],  ancestors:[212, 120, 74],
  exam:       [74, 142, 194],  divine:   [122, 170, 48],
  paralysis:  [100, 60, 180],  lucid:    [20, 180, 200],
  apocalypse: [200, 70, 30],   celebrity:[200, 160, 20],
};

function themeColor(themes) {
  return THEME_COLORS[themes?.[0]] ?? [160, 155, 150];
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400)return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

// ── Globe ─────────────────────────────────────────────────────────────────────

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
  const w = wrap.clientWidth, h = wrap.clientHeight;
  if (!w || !h) { requestAnimationFrame(resize); return; }
  const s = Math.max(100, Math.min(w, h, 760) - 24);
  canvas.width = s; canvas.height = s;
  renderer.setSize(s, s);
  camera.aspect = 1; camera.updateProjectionMatrix();
}

function ll2v(lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const th  = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(th),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(th));
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

const outlineMat = new THREE.LineBasicMaterial({ color: 0xbbb7b0, transparent: true, opacity: 0.5 });

async function initGlobe() {
  const topo = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json());
  topojson.feature(topo, topo.objects.countries).features.forEach(f => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates]
                : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
    polys.forEach(poly => {
      const ring = poly[0]; if (!ring || ring.length < 3) return;
      world.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(ring.map(([lo, la]) => ll2v(la, lo, 1.003))),
        outlineMat
      ));
    });
  });
  document.getElementById('globe-loading').style.display = 'none';
  loadData();
}

// ── Dream dots + arcs ─────────────────────────────────────────────────────────

let dreamData    = {};   // id → dream object
let arcData      = [];   // { line, dream_a, dream_b, shared_themes, reason, strength }
const dreamMeshes = [];
const dotGroup   = new THREE.Group();
const arcGroup   = new THREE.Group();
world.add(arcGroup); world.add(dotGroup);

function makeDot(dream) {
  const c   = themeColor(dream.themes);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(`rgb(${c.join(',')})`) });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.009, 7, 7), mat);
  mesh.position.copy(ll2v(dream.lat, dream.lon, 1.013));
  mesh.userData.dreamId = dream.id;
  return mesh;
}

function makeArc(a, b, color, opacity) {
  const p1  = ll2v(a.lat, a.lon, 1.013);
  const p2  = ll2v(b.lat, b.lon, 1.013);
  const mid = new THREE.Vector3().addVectors(p1, p2).normalize().multiplyScalar(1.22);
  const mat = new THREE.LineBasicMaterial({
    color: new THREE.Color(`rgb(${color.join(',')})`), transparent: true, opacity,
  });
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(p1, mid, p2).getPoints(64)),
    mat
  );
}

function renderData(dreams, connections) {
  dotGroup.clear(); arcGroup.clear();
  dreamMeshes.length = 0; arcData.length = 0;
  dreamData = {};

  dreams.forEach(d => {
    dreamData[d.id] = d;
    const mesh = makeDot(d);
    dotGroup.add(mesh);
    dreamMeshes.push(mesh);
  });

  connections.forEach(c => {
    const a = dreamData[c.dream_a], b = dreamData[c.dream_b];
    if (!a || !b) return;
    const color = themeColor(c.shared_themes);
    const line  = makeArc(a, b, color, 0.15 * (c.strength ?? 0.6));
    arcGroup.add(line);
    arcData.push({ line, ...c });
  });

  document.getElementById('dream-count').textContent =
    `${dreams.length} dream${dreams.length === 1 ? '' : 's'}`;
}

async function loadData() {
  try {
    const [dr, summ] = await Promise.all([
      fetch('/api/dreams').then(r => r.json()),
      fetch('/api/summary').then(r => r.json()),
    ]);
    renderData(dr.dreams ?? [], dr.connections ?? []);
    setSummary(summ?.content ?? null);
  } catch (e) {
    console.warn('Load error:', e.message);
    setSummary(null);
    document.getElementById('dream-count').textContent = '0 dreams';
  }
}

function setSummary(text) {
  const el = document.getElementById('summary-text');
  el.classList.remove('loading');
  el.textContent = text ?? 'No dreams shared yet. Be the first.';
}

// ── Dream detail panel ────────────────────────────────────────────────────────

let activeDreamId = null;

function selectDream(id) {
  activeDreamId = id;

  // Dim all arcs, highlight connected ones
  arcData.forEach(a => { a.line.material.opacity = 0.04; });
  if (id) {
    arcData
      .filter(a => a.dream_a === id || a.dream_b === id)
      .forEach(a => { a.line.material.opacity = Math.min(0.9, (a.strength ?? 0.6) * 1.1); });
  } else {
    arcData.forEach(a => { a.line.material.opacity = 0.15 * (a.strength ?? 0.6); });
  }

  if (!id) { showSidebarState('placeholder'); return; }

  const dream = dreamData[id];
  if (!dream) return;

  showSidebarState('dream-detail');

  document.getElementById('d-region').textContent = dream.region;
  document.getElementById('d-date').textContent   = timeAgo(dream.created_at);
  document.getElementById('d-text').textContent   = dream.text;

  document.getElementById('d-themes').innerHTML = (dream.themes ?? []).map(t => {
    const c = THEME_COLORS[t] ?? [160, 155, 150];
    return `<span class="theme-chip" style="background:rgb(${c.join(',')})">${t}</span>`;
  }).join('');

  // Pen pal
  const ppEl = document.getElementById('d-penpal');
  ppEl.innerHTML = dream.contact
    ? `<div class="penpal-row">
        <span class="penpal-icon">✉</span>
        <div>
          <div class="penpal-label">Open to pen pals</div>
          <div class="penpal-contact">${dream.contact}</div>
        </div>
      </div>`
    : '';

  // Connections
  const connected = arcData.filter(a => a.dream_a === id || a.dream_b === id);
  const connLabel = document.getElementById('conn-label');
  const connEl    = document.getElementById('d-connections');

  if (!connected.length) {
    connLabel.textContent = '';
    connEl.innerHTML = '<p style="font-size:11px;color:#b0aca6;padding:4px 0">No connections yet.</p>';
  } else {
    connLabel.textContent = `${connected.length} connected dream${connected.length === 1 ? '' : 's'}`;
    connEl.innerHTML = connected.map(c => {
      const otherId = c.dream_a === id ? c.dream_b : c.dream_a;
      const other   = dreamData[otherId];
      return `<div class="conn-card" data-id="${otherId}">
        <div class="conn-reason-text">${c.reason}</div>
        ${other ? `<div class="conn-essence">"${other.essence}"</div>
        <div class="conn-region-tag">${other.region}</div>` : ''}
      </div>`;
    }).join('');

    connEl.querySelectorAll('.conn-card').forEach(card => {
      card.addEventListener('click', () => selectDream(card.dataset.id));
    });
  }
}

// ── Raycasting + interaction ──────────────────────────────────────────────────

const ray = new THREE.Raycaster();
let rotX = 0.25, rotY = 0.4, drag = false, lx = 0, ly = 0, velX = 0, velY = 0;
let mouseDownX = 0, mouseDownY = 0;
world.rotation.x = rotX; world.rotation.y = rotY;

canvas.addEventListener('mousedown', e => {
  drag = true; lx = e.clientX; ly = e.clientY;
  mouseDownX = e.clientX; mouseDownY = e.clientY;
  velX = 0; velY = 0; canvas.style.cursor = 'grabbing';
});
window.addEventListener('mouseup', () => { drag = false; canvas.style.cursor = 'grab'; });
canvas.addEventListener('click', e => {
  if (Math.abs(e.clientX-mouseDownX)+Math.abs(e.clientY-mouseDownY) > 6) return;
  const rect = canvas.getBoundingClientRect();
  ray.setFromCamera(
    new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1, -((e.clientY-rect.top)/rect.height)*2+1),
    camera
  );
  const hits = ray.intersectObjects(dreamMeshes);
  selectDream(hits.length ? hits[0].object.userData.dreamId : null);
});
window.addEventListener('mousemove', e => {
  if (drag) {
    velX = (e.clientY-ly)*0.005; velY = (e.clientX-lx)*0.005;
    rotX = Math.max(-1.4, Math.min(1.4, rotX+velX));
    rotY += velY; lx = e.clientX; ly = e.clientY;
    world.rotation.x = rotX; world.rotation.y = rotY; return;
  }
  const rect = canvas.getBoundingClientRect();
  ray.setFromCamera(
    new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1, -((e.clientY-rect.top)/rect.height)*2+1),
    camera
  );
  canvas.style.cursor = ray.intersectObjects(dreamMeshes).length ? 'pointer' : 'grab';
});
window.addEventListener('resize', resize);

function animate() {
  requestAnimationFrame(animate);
  if (!drag) {
    velX *= 0.88; velY *= 0.88;
    rotX = Math.max(-1.4, Math.min(1.4, rotX+velX));
    rotY += velY;
    world.rotation.x = rotX; world.rotation.y = rotY;
  }
  renderer.render(scene, camera);
}

// ── Submission ────────────────────────────────────────────────────────────────

function showSidebarState(id) {
  ['placeholder','dream-detail','submit-form','submit-result'].forEach(s => {
    document.getElementById(s).style.display = s === id ? 'block' : 'none';
  });
  const isForm = id === 'submit-form';
  document.getElementById('open-submit').textContent = isForm ? '← Cancel' : 'Add your dream →';
  if (isForm) document.getElementById('dream-text').focus();
}

document.getElementById('open-submit').addEventListener('click', () => {
  const isForm = document.getElementById('submit-form').style.display === 'block';
  if (isForm) {
    showSidebarState(activeDreamId ? 'dream-detail' : 'placeholder');
  } else {
    showSidebarState('submit-form');
  }
});

document.getElementById('submit-btn').addEventListener('click', async () => {
  const text    = document.getElementById('dream-text').value.trim();
  const region  = document.getElementById('dream-region').value;
  const contact = document.getElementById('dream-contact').value.trim();
  const errEl   = document.getElementById('submit-error');
  const statusEl= document.getElementById('submit-status');
  const btn     = document.getElementById('submit-btn');

  if (text.length < 20) { errEl.textContent = 'Please describe your dream in a bit more detail.'; return; }
  errEl.textContent = '';
  btn.disabled = true; btn.textContent = 'Sharing…';
  statusEl.textContent = 'Classifying your dream…';

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, region, contact: contact || null }),
    });
    if (!res.ok) throw new Error(await res.text());
    const { dream, matched } = await res.json();

    // Add to globe
    dreamData[dream.id] = dream;
    const mesh = makeDot(dream);
    dotGroup.add(mesh);
    dreamMeshes.push(mesh);

    matched.forEach(c => {
      const other = dreamData[c.dream_b];
      if (!other) return;
      const color = themeColor(c.shared_themes);
      const line  = makeArc(dream, other, color, 0.7 * (c.strength ?? 0.6));
      arcGroup.add(line);
      arcData.push({ line, dream_a: dream.id, dream_b: c.dream_b,
                     shared_themes: c.shared_themes, reason: c.reason, strength: c.strength });
    });

    document.getElementById('dream-count').textContent =
      `${Object.keys(dreamData).length} dreams`;

    // Show result in sidebar
    document.getElementById('r-essence').textContent = `"${dream.essence}"`;
    const mLabel = document.getElementById('r-matches-label');
    const mEl    = document.getElementById('r-matches');
    if (!matched.length) {
      mLabel.textContent = '';
      mEl.innerHTML = '<p style="font-size:11px;color:#b0aca6">No close matches yet — your dream may be rare.</p>';
    } else {
      mLabel.textContent = `${matched.length} resonant dream${matched.length === 1 ? '' : 's'}`;
      mEl.innerHTML = matched.map(c => `
        <div class="conn-card" data-id="${c.dream_b}">
          <div class="conn-reason-text">${c.reason}</div>
          ${c.dream ? `<div class="conn-essence">"${c.dream.essence}"</div>
          <div class="conn-region-tag">${c.dream.region}</div>` : ''}
        </div>`).join('');
      mEl.querySelectorAll('.conn-card').forEach(card => {
        card.addEventListener('click', () => selectDream(card.dataset.id));
      });
    }
    showSidebarState('submit-result');
    document.getElementById('open-submit').textContent = 'Add your dream →';
    document.getElementById('sidebar-body').scrollTo({ top: 0, behavior: 'smooth' });
    selectDream(dream.id);
  } catch (e) {
    document.getElementById('submit-error').textContent = 'Something went wrong. Please try again.';
    btn.disabled = false; btn.textContent = 'Share dream →';
    document.getElementById('submit-status').textContent = '';
  }
});

resize();
initGlobe().then(() => animate());
