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

let continents = researchContinents;
let currentDataset = 'research';

const canvas = document.getElementById('gc');
const wrap = document.getElementById('globe-wrap');

function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  if (!w || !h) { requestAnimationFrame(resize); return; }
  const s = Math.max(100, Math.min(w, h, 760) - 24);
  canvas.width = s; canvas.height = s;
  renderer.setSize(s, s);
  camera.aspect = 1; camera.updateProjectionMatrix();
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setClearColor(0xf9f8f5, 1);
renderer.sortObjects = true;
window.globeRenderer = renderer;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.position.z = 3.1;

const world = new THREE.Group();
scene.add(world);

function ll2v(lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const th = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(th),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(th)
  );
}

// Hollow globe shell
const shellMat = new THREE.MeshBasicMaterial({ color: 0xf5f3ef, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false });
window.globeShellMat = shellMat;
world.add(new THREE.Mesh(new THREE.SphereGeometry(1, 80, 80), shellMat));

// Grid lines
const gMinor   = new THREE.LineBasicMaterial({ color: 0xc8c4bc, transparent: true, opacity: 0.28 });
const gMajor   = new THREE.LineBasicMaterial({ color: 0xa8a49c, transparent: true, opacity: 0.42 });
const gEquator = new THREE.LineBasicMaterial({ color: 0x888480, transparent: true, opacity: 0.52 });

for (let lt = -75; lt <= 75; lt += 15) {
  const p = [];
  for (let i = 0; i <= 120; i++) p.push(ll2v(lt, (i / 120) * 360 - 180, 1.001));
  world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), lt === 0 ? gEquator : gMinor));
}
for (let ln = -165; ln <= 180; ln += 15) {
  const p = [];
  for (let i = 0; i <= 80; i++) p.push(ll2v((i / 80) * 180 - 90, ln, 1.001));
  world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), ln === 0 ? gMajor : gMinor));
}

scene.add(new THREE.AmbientLight(0xffffff, 1));

function lerpC(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function pip(px, py, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

const dotGroups = [], outlineGroups = [], hoverMeshes = [], dotDataStore = [];
let hovCont = null;

function setHover(name) {
  if (name === hovCont) return;
  hovCont = name;

  dotGroups.forEach(({ mat, cont }) => {
    mat.opacity = !name ? 0.82 : cont.name === name ? 1.0 : 0.07;
    mat.size    = !name ? 2.8  : cont.name === name ? 4.2 : 2.2;
  });
  outlineGroups.forEach(({ lines, cont }) => {
    lines.forEach(l => {
      l.material.opacity = !name ? 0.48 : cont.name === name ? 0.92 : 0.05;
    });
  });

  if (name) {
    const cont = continents.find(c => c.name === name);
    const ts = themes.map(t => ({ ...t, count: cont[t.id] })).sort((a, b) => b.count - a.count);
    const max = ts[0].count;
    document.getElementById('ph').style.display = 'none';
    document.getElementById('pc').style.display = 'block';
    document.getElementById('region-name').textContent = name;
    document.getElementById('region-themes').innerHTML = ts.map(t =>
      `<div class="br">
        <div class="bl"><span>${t.label}</span><b>${t.count}</b></div>
        <div class="bb"><div class="bf" style="width:${Math.round(t.count / max * 100)}%;background:rgb(${t.color.join(',')})"></div></div>
      </div>`
    ).join('');
    document.querySelectorAll('.lrow').forEach(r => r.classList.toggle('active', r.dataset.name === name));
  } else {
    document.getElementById('ph').style.display = 'block';
    document.getElementById('pc').style.display = 'none';
    document.querySelectorAll('.lrow').forEach(r => r.classList.remove('active'));
  }
}

function buildDotColors(themeIds, contColor) {
  const cols = [];
  themeIds.forEach(tid => {
    const t = themes.find(x => x.id === tid);
    const blended = lerpC(contColor, t.color, 0.85);
    cols.push(blended[0] / 255, blended[1] / 255, blended[2] / 255);
  });
  return cols;
}

window.recolorDots = function() {
  dotDataStore.forEach(({ geo, themeIds, cont }) => {
    const cols = buildDotColors(themeIds, cont.color);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.attributes.color.needsUpdate = true;
  });
};

window.switchDataset = function(name) {
  if (name === currentDataset) return;
  const newConts = name === 'reddit' ? window.redditContinents : researchContinents;
  if (!newConts) return;
  continents = newConts;
  currentDataset = name;

  dotDataStore.forEach(entry => {
    const contData = newConts.find(c => c.name === entry.cont.name);
    if (!contData) return;
    const ts = themes.map(t => ({ id: t.id, count: contData[t.id] || 0 })).sort((a, b) => b.count - a.count);
    const total = ts.reduce((s, t) => s + t.count, 0) || 1;
    const palette = [];
    ts.forEach(t => {
      const n = Math.max(0, Math.round((t.count / total) * entry.themeIds.length));
      for (let i = 0; i < n; i++) palette.push(t.id);
    });
    while (palette.length < 1) palette.push(ts[0].id);
    entry.themeIds = entry.themeIds.map(() => palette[Math.floor(Math.random() * palette.length)]);
    const cols = buildDotColors(entry.themeIds, entry.cont.color);
    entry.geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    entry.geo.attributes.color.needsUpdate = true;
  });

  if (hovCont) setHover(hovCont);
};

async function init() {
  const topo = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json());
  document.getElementById('globe-loading').style.display = 'none';

  const features = topojson.feature(topo, topo.objects.countries).features;
  const countryMap = {};
  features.forEach(f => { countryMap[+f.id] = f; });

  const legEl = document.getElementById('globe-legend');

  continents.forEach(cont => {
    const ts = themes.map(t => ({ ...t, count: cont[t.id] })).sort((a, b) => b.count - a.count);
    const total = ts.reduce((s, t) => s + t.count, 0);
    const paletteThemeIds = [];
    ts.forEach(t => {
      const n = Math.round(t.count / total * 100);
      for (let i = 0; i < n; i++) paletteThemeIds.push(t.id);
    });

    const allRings = [];
    let latMin = 90, latMax = -90, lonMin = 180, lonMax = -180;
    const lines = [];

    cont.ids.forEach(id => {
      const f = countryMap[id];
      if (!f) return;
      const polys = f.geometry.type === 'Polygon'
        ? [f.geometry.coordinates]
        : f.geometry.type === 'MultiPolygon'
          ? f.geometry.coordinates : [];

      polys.forEach(poly => {
        const ring = poly[0];
        if (!ring || ring.length < 3) return;
        allRings.push(ring);
        ring.forEach(([lo, la]) => {
          latMin = Math.min(latMin, la); latMax = Math.max(latMax, la);
          lonMin = Math.min(lonMin, lo); lonMax = Math.max(lonMax, lo);
        });
        const pts = ring.map(([lo, la]) => ll2v(la, lo, 1.003));
        const mat = new THREE.LineBasicMaterial({
          color: new THREE.Color(`rgb(${cont.color.join(',')})`),
          transparent: true, opacity: 0.48
        });
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
        world.add(line);
        lines.push(line);
      });
    });

    outlineGroups.push({ lines, cont });

    // Scatter dots inside real country polygons
    const dotPos = [], dotThemeIds = [];
    const DOTS = 320;
    let placed = 0, tries = 0;
    const bb = { latMin: latMin - 0.5, latMax: latMax + 0.5, lonMin: lonMin - 0.5, lonMax: lonMax + 0.5 };

    while (placed < DOTS && tries < DOTS * 40) {
      tries++;
      const lat = bb.latMin + Math.random() * (bb.latMax - bb.latMin);
      const lon = bb.lonMin + Math.random() * (bb.lonMax - bb.lonMin);
      let inside = false;
      for (const ring of allRings) { if (pip(lon, lat, ring)) { inside = true; break; } }
      if (!inside) continue;
      const pos = ll2v(lat, lon, 1.005);
      dotPos.push(pos.x, pos.y, pos.z);
      const themeId = paletteThemeIds[Math.floor(Math.random() * paletteThemeIds.length)];
      dotThemeIds.push(themeId);
      placed++;
    }

    if (dotPos.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(dotPos, 3));
      const initCols = buildDotColors(dotThemeIds, cont.color);
      geo.setAttribute('color', new THREE.Float32BufferAttribute(initCols, 3));
      const mat = new THREE.PointsMaterial({
        size: 2.8, vertexColors: true, sizeAttenuation: false,
        transparent: true, opacity: 0.82, depthWrite: false,
      });
      const pts = new THREE.Points(geo, mat);
      world.add(pts);
      dotGroups.push({ pts, mat, cont });
      dotDataStore.push({ geo, themeIds: dotThemeIds, cont });
    }

    // Invisible hover zone at centroid
    const centLat = (latMin + latMax) / 2, centLon = (lonMin + lonMax) / 2;
    const hm = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hm.position.copy(ll2v(centLat, centLon, 1.0));
    hm.userData.name = cont.name;
    hm.userData.lat = centLat;
    hm.userData.lon = centLon;
    world.add(hm);
    hoverMeshes.push(hm);

    // Legend row
    const row = document.createElement('div');
    row.className = 'lrow';
    row.dataset.name = cont.name;
    row.innerHTML = `<span class="ldot" style="background:rgb(${cont.color.join(',')})"></span><span>${cont.name}</span>`;
    row.addEventListener('mouseenter', () => setHover(cont.name));
    row.addEventListener('mouseleave', () => setHover(null));
    row.addEventListener('click', () => {
      if (isZoomed && currentZoomedCont === cont.name) { flyHome(); }
      else { flyTo(centLat, centLon); currentZoomedCont = cont.name; }
    });
    legEl.appendChild(row);
  });

  resize();
  animate();
}

let rotX = 0.25, rotY = 0.4, drag = false, lx = 0, ly = 0, velX = 0, velY = 0;
let mouseDownX = 0, mouseDownY = 0;
let flyTargetX = null, flyTargetY = null, zoomTarget = 3.1, isZoomed = false, currentZoomedCont = null;
world.rotation.x = rotX;
world.rotation.y = rotY;

const ray = new THREE.Raycaster();

function flyTo(lat, lon) {
  const p = ll2v(lat, lon, 1);
  const rx = Math.atan2(p.y, p.z);
  const pzr = Math.sqrt(p.y * p.y + p.z * p.z);
  const ry = Math.atan2(-p.x, pzr);
  flyTargetX = Math.max(-1.4, Math.min(1.4, rx));
  const diff = ry - rotY;
  flyTargetY = rotY + diff - Math.round(diff / (2 * Math.PI)) * (2 * Math.PI);
  zoomTarget = 2.1;
  isZoomed = true;
  velX = 0; velY = 0;
}

function flyHome() {
  flyTargetX = null; flyTargetY = null;
  zoomTarget = 3.1;
  isZoomed = false;
  currentZoomedCont = null;
}

function handleCanvasClick(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(hoverMeshes);
  if (hits.length) {
    const name = hits[0].object.userData.name;
    if (isZoomed && name === currentZoomedCont) {
      flyHome();
    } else {
      flyTo(hits[0].object.userData.lat, hits[0].object.userData.lon);
      currentZoomedCont = name;
    }
  } else if (isZoomed) {
    flyHome();
  }
}

canvas.addEventListener('mousedown', e => {
  drag = true; lx = e.clientX; ly = e.clientY;
  mouseDownX = e.clientX; mouseDownY = e.clientY;
  velX = 0; velY = 0; canvas.style.cursor = 'grabbing';
});
window.addEventListener('mouseup', () => { drag = false; canvas.style.cursor = 'grab'; });
canvas.addEventListener('click', e => {
  const moved = Math.abs(e.clientX - mouseDownX) + Math.abs(e.clientY - mouseDownY);
  if (moved < 8) handleCanvasClick(e.clientX, e.clientY);
});
window.addEventListener('mousemove', e => {
  if (drag) {
    velX = (e.clientY - ly) * 0.005;
    velY = (e.clientX - lx) * 0.005;
    rotX += velX; rotY += velY;
    rotX = Math.max(-1.4, Math.min(1.4, rotX));
    lx = e.clientX; ly = e.clientY;
    world.rotation.x = rotX; world.rotation.y = rotY;
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(hoverMeshes);
  setHover(hits.length ? hits[0].object.userData.name : null);
  canvas.style.cursor = hits.length ? 'pointer' : 'grab';
});
canvas.addEventListener('mouseleave', () => setHover(null));
canvas.addEventListener('touchstart', e => {
  drag = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY;
  mouseDownX = e.touches[0].clientX; mouseDownY = e.touches[0].clientY;
  velX = 0; velY = 0; e.preventDefault();
}, { passive: false });
window.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  const moved = Math.abs(t.clientX - mouseDownX) + Math.abs(t.clientY - mouseDownY);
  if (moved < 10) handleCanvasClick(t.clientX, t.clientY);
  drag = false;
});
window.addEventListener('touchmove', e => {
  if (!drag) return;
  velX = (e.touches[0].clientY - ly) * 0.005;
  velY = (e.touches[0].clientX - lx) * 0.005;
  rotX += velX; rotY += velY;
  rotX = Math.max(-1.4, Math.min(1.4, rotX));
  lx = e.touches[0].clientX; ly = e.touches[0].clientY;
  world.rotation.x = rotX; world.rotation.y = rotY;
});

window.addEventListener('resize', resize);

function animate() {
  requestAnimationFrame(animate);
  if (!drag) {
    if (flyTargetX !== null) {
      const dx = flyTargetX - rotX, dy = flyTargetY - rotY;
      rotX += dx * 0.07;
      rotY += dy * 0.07;
      velX = 0; velY = 0;
      if (Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) {
        rotX = flyTargetX; rotY = flyTargetY;
        flyTargetX = null; flyTargetY = null;
      }
    } else {
      velX *= 0.88; velY *= 0.88;
      rotX += velX; rotY += velY;
      rotX = Math.max(-1.4, Math.min(1.4, rotX));
    }
    world.rotation.x = rotX;
    world.rotation.y = rotY;
  }
  camera.position.z += (zoomTarget - camera.position.z) * 0.07;
  renderer.render(scene, camera);
}

init();
