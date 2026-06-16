/**
 * SnapGlow - Photobooth Core Script
 * Version: 3.0 (Aesthetic Frames + Instagram Filters Edition)
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

// ==========================================================================
// CONFIG: FILTERS ALA INSTAGRAM
// (id sama dipakai untuk preview kamera & hasil capture, biar konsisten)
// ==========================================================================
const FILTERS = [
  // — Dasar —
  { id: 'normal',      label: 'Original',      css: 'none' },

  // — Instagram Classics —
  { id: 'clarendon',   label: 'Clarendon',      css: 'contrast(1.2) saturate(1.35) brightness(1.05)' },
  { id: 'gingham',     label: 'Gingham',        css: 'sepia(0.2) saturate(0.9) brightness(1.05) contrast(0.92)' },
  { id: 'juno',        label: 'Juno',           css: 'saturate(1.4) contrast(1.1) brightness(1.06) sepia(0.1)' },
  { id: 'lark',        label: 'Lark',           css: 'brightness(1.12) contrast(0.9) saturate(1.15) hue-rotate(-8deg)' },
  { id: 'reyes',       label: 'Reyes',          css: 'sepia(0.4) contrast(0.9) brightness(1.1) saturate(0.75)' },
  { id: 'slumber',     label: 'Slumber',        css: 'saturate(0.66) brightness(1.05) sepia(0.3)' },
  { id: 'toaster',     label: 'Toaster',        css: 'contrast(1.5) saturate(1.1) brightness(0.88) sepia(0.18)' },
  { id: 'valencia',    label: 'Valencia',       css: 'sepia(0.25) saturate(1.3) brightness(1.08) contrast(1.05)' },
  { id: 'walden',      label: 'Walden',         css: 'brightness(1.1) hue-rotate(-10deg) saturate(1.6) sepia(0.15)' },
  { id: 'willow',      label: 'Willow',         css: 'grayscale(0.5) contrast(0.95) brightness(1.05) sepia(0.12)' },
  { id: 'moon',        label: 'Moon',           css: 'grayscale(1) brightness(1.1) contrast(1.1)' },

  // — Stylized / Creative —
  { id: 'noir',        label: 'B&W Noir',       css: 'grayscale(1) contrast(1.35) brightness(0.93)' },
  { id: 'cyberpop',    label: 'Cyber Neon',     css: 'hue-rotate(140deg) saturate(1.8) contrast(1.2)' },
  { id: 'dreamy',      label: 'Dreamy Glow',    css: 'brightness(1.1) saturate(0.85) contrast(0.92) blur(0.4px)' },
  { id: 'golden',      label: 'Golden Hour',    css: 'sepia(0.45) saturate(1.6) brightness(1.08) contrast(1.05) hue-rotate(-15deg)' },
  { id: 'rosegold',    label: 'Rose Gold',      css: 'sepia(0.3) saturate(1.2) brightness(1.1) contrast(1.02) hue-rotate(-20deg)' },
  { id: 'retrofilm',   label: 'Retro Film',     css: 'sepia(0.6) contrast(1.2) brightness(0.9) saturate(0.8)' },
  { id: 'aqua',        label: 'Aqua Cool',      css: 'hue-rotate(180deg) saturate(1.4) brightness(1.05) contrast(1.1)' },
  { id: 'purplehaze',  label: 'Purple Haze',    css: 'hue-rotate(260deg) saturate(1.5) brightness(1.0) contrast(1.1)' },
  { id: 'pinkie',      label: 'Pinkie Pop',     css: 'hue-rotate(300deg) saturate(1.6) brightness(1.08) contrast(1.05)' },
  { id: 'faded',       label: 'Faded Lo-Fi',    css: 'brightness(1.08) contrast(0.8) saturate(0.7) sepia(0.15)' },
  { id: 'deepblue',    label: 'Deep Blue',      css: 'hue-rotate(210deg) saturate(1.6) brightness(0.95) contrast(1.15)' },
  { id: 'minty',       label: 'Minty Fresh',    css: 'hue-rotate(120deg) saturate(1.3) brightness(1.08) contrast(1.0)' },
  { id: 'ember',       label: 'Ember',          css: 'hue-rotate(-30deg) saturate(1.7) brightness(0.97) contrast(1.15)' },
  { id: 'arctic',      label: 'Arctic',         css: 'brightness(1.15) saturate(0.6) contrast(1.05) hue-rotate(190deg)' },
  { id: 'lemonade',    label: 'Lemonade',       css: 'brightness(1.12) saturate(1.4) hue-rotate(40deg) contrast(0.95)' },
  { id: 'velvet',      label: 'Velvet',         css: 'brightness(0.85) contrast(1.3) saturate(1.4) hue-rotate(-25deg)' },
];

// ==========================================================================
// CONFIG: BINGKAI / FRAME TEMPLATES (CUTE + AESTHETIC)
// decorations: posisi dalam persen (x/y) relatif ke photostrip
// ==========================================================================
const FRAMES = [
  // ———— TERANG / SOFT ————
  {
    id: 'minimal-white', label: '🤍 Minimalist White',
    bg: '#ffffff', accent: '#ffffff', text: '#1a1a1a', pattern: null,
    decorations: []
  },
  {
    id: 'soft-pink', label: '🎀 Soft Pink Dream',
    bg: '#ffe3ec', accent: '#ff8fb1', text: '#7a3b56', pattern: 'dots',
    decorations: [
      { type: 'emoji', content: '💖', x: 12, y: 5,  size: 26, rotate: -12 },
      { type: 'emoji', content: '✨', x: 88, y: 6,  size: 22, rotate: 15 },
      { type: 'emoji', content: '🎀', x: 88, y: 93, size: 22, rotate: -10 },
    ]
  },
  {
    id: 'mint-cute', label: '🍃 Mint Cute',
    bg: '#d8f3dc', accent: '#74c69d', text: '#1f5c3b', pattern: 'dots',
    decorations: [
      { type: 'emoji', content: '🍀', x: 88, y: 5, size: 24, rotate: 10 },
      { type: 'text', content: 'cute day~', x: 50, y: 5, size: 13, rotate: -4, font: "'Space Grotesk', sans-serif", color: '#1f5c3b', align: 'center', weight: '700' },
    ]
  },
  {
    id: 'lavender-haze', label: '💜 Lavender Haze',
    bg: '#e0aaff', accent: '#9d4edd', text: '#3c096c', pattern: 'dots',
    decorations: [
      { type: 'emoji', content: '🌸', x: 12, y: 5,  size: 24, rotate: -10 },
      { type: 'emoji', content: '💜', x: 88, y: 5,  size: 22, rotate: 10 },
      { type: 'text', content: '✦ dreamy ✦', x: 50, y: 95, size: 12, rotate: 0, font: "'Space Grotesk', sans-serif", color: '#3c096c', align: 'center', weight: '700' },
    ]
  },
  {
    id: 'baby-blue', label: '🩵 Baby Blue Cloud',
    bg: '#c8e6ff', accent: '#4da6ff', text: '#1a4a6e', pattern: 'dots',
    decorations: [
      { type: 'emoji', content: '⛅', x: 12, y: 5,  size: 24, rotate: 0 },
      { type: 'emoji', content: '🌈', x: 88, y: 5,  size: 22, rotate: 10 },
      { type: 'text', content: '☁ cloud nine ☁', x: 50, y: 95, size: 11, rotate: 0, font: "'Space Grotesk', sans-serif", color: '#1a4a6e', align: 'center', weight: '700' },
    ]
  },
  {
    id: 'peach-fuzz', label: '🍑 Peach Fuzz',
    bg: '#ffddd2', accent: '#ff9a7b', text: '#7a3b2e', pattern: null,
    decorations: [
      { type: 'emoji', content: '🍑', x: 88, y: 5,  size: 24, rotate: 10 },
      { type: 'emoji', content: '🌻', x: 12, y: 93, size: 22, rotate: -8 },
      { type: 'text', content: 'warm & cozy', x: 50, y: 95, size: 11, rotate: 0, font: "'Space Grotesk', sans-serif", color: '#7a3b2e', align: 'center', weight: '700' },
    ]
  },

  // ———— BOLD / Y2K / RETRO ————
  {
    id: 'y2k-pop', label: '💚 Y2K Neon Pop',
    bg: '#caff4d', accent: '#ff66b2', text: '#111111', pattern: 'stripes-y2k',
    decorations: [
      { type: 'sticker', content: '★ COOL ★', x: 78, y: 6, size: 12, rotate: 6 },
      { type: 'sticker', content: 'HBD !!', x: 22, y: 93, size: 14, rotate: -8 },
    ]
  },
  {
    id: 'retro-film', label: '🧡 Retro Film Strip',
    bg: '#eae1d4', accent: '#bd3a2b', text: '#bd3a2b', pattern: 'stripes-retro',
    decorations: [
      { type: 'text', content: 'P H O T O B O O T H', x: 50, y: 4, size: 11, rotate: 0, font: "'Space Grotesk', sans-serif", color: '#bd3a2b', align: 'center', weight: '700' },
    ]
  },
  {
    id: 'disco-fever', label: '🪩 Disco Fever',
    bg: '#1a0533', accent: '#ff66ff', text: '#ff66ff', pattern: 'checkers',
    decorations: [
      { type: 'emoji', content: '🪩', x: 12, y: 5,  size: 24, rotate: 0 },
      { type: 'emoji', content: '⚡', x: 88, y: 5,  size: 22, rotate: 15 },
      { type: 'sticker', content: 'DISCO ✦', x: 50, y: 6, size: 11, rotate: -3 },
    ]
  },
  {
    id: 'bubblegum', label: '🍬 Bubblegum',
    bg: '#ff87c3', accent: '#fff', text: '#7a0040', pattern: 'checker-pink',
    decorations: [
      { type: 'emoji', content: '🍬', x: 12, y: 5,  size: 24, rotate: -10 },
      { type: 'emoji', content: '🌟', x: 88, y: 5,  size: 22, rotate: 10 },
      { type: 'sticker', content: 'SWEET!', x: 50, y: 94, size: 13, rotate: 2 },
    ]
  },
  {
    id: 'kodak-grain', label: '📷 Kodak Grain',
    bg: '#f5e6c8', accent: '#c8a04a', text: '#5c3d11', pattern: 'grain',
    decorations: [
      { type: 'sticker', content: 'KODAK 400', x: 50, y: 4, size: 11, rotate: 0 },
      { type: 'text', content: '✦ PHOTO ✦', x: 50, y: 96, size: 11, rotate: 0, font: "'Space Grotesk', sans-serif", color: '#5c3d11', align: 'center', weight: '700' },
    ]
  },

  // ———— DARK / NIGHT ————
  {
    id: 'midnight-neon', label: '🌌 Midnight Neon',
    bg: '#150f30', accent: '#e056fd', text: '#e056fd', pattern: 'stars',
    decorations: [
      { type: 'emoji', content: '✨', x: 12, y: 5,  size: 22, rotate: 0 },
      { type: 'emoji', content: '🌙', x: 88, y: 5,  size: 24, rotate: -10 },
      { type: 'emoji', content: '💫', x: 12, y: 93, size: 20, rotate: 8 },
    ]
  },
  {
    id: 'obsidian', label: '🖤 Obsidian',
    bg: '#0a0a0a', accent: '#e0e0e0', text: '#e0e0e0', pattern: null,
    decorations: [
      { type: 'text', content: '— SNAPGLOW —', x: 50, y: 4, size: 11, rotate: 0, font: "'Space Grotesk', sans-serif", color: '#555', align: 'center', weight: '700' },
    ]
  },
  {
    id: 'aurora', label: '🌌 Aurora Borealis',
    bg: '#021a1a', accent: '#00ffcc', text: '#00ffcc', pattern: 'aurora',
    decorations: [
      { type: 'emoji', content: '🌿', x: 12, y: 5,  size: 22, rotate: -8 },
      { type: 'emoji', content: '⭐', x: 88, y: 5,  size: 20, rotate: 10 },
      { type: 'text', content: '✦ northern lights ✦', x: 50, y: 95, size: 10, rotate: 0, font: "'Space Grotesk', sans-serif", color: '#00ffcc', align: 'center', weight: '700' },
    ]
  },
  {
    id: 'city-night', label: '🌃 City Night',
    bg: '#0b0c1e', accent: '#f9c74f', text: '#f9c74f', pattern: 'crosshatch',
    decorations: [
      { type: 'emoji', content: '🌃', x: 12, y: 5,  size: 22, rotate: 0 },
      { type: 'emoji', content: '✨', x: 88, y: 5,  size: 20, rotate: 15 },
      { type: 'sticker', content: 'NIGHT OUT', x: 50, y: 94, size: 12, rotate: -2 },
    ]
  },
];

const getFilter = (id) => FILTERS.find(f => f.id === id) || FILTERS[0];
const getFrame = (id) => FRAMES.find(f => f.id === id) || FRAMES[0];

// ==========================================================================
// GLOBAL STATE
// ==========================================================================
const state = {
  selectedSlots: 4,
  currentStream: null,
  capturedImages: [],
  currentSlotIndex: 0,
  activeFilter: 'normal',
  frameTheme: 'minimal-white',
  facingMode: 'user',
  isSimulation: false,
  stickers: [] // { id, content, x, y, rotate, isText }
};

const safeGet = (id) => document.getElementById(id) || { addEventListener: () => {}, style: {}, classList: { remove: () => {}, add: () => {} } };

// ==========================================================================
// BUILD UI: FILTER CHIPS & FRAME GALLERY (dibuat dari config, biar sinkron)
// ==========================================================================
function buildFilterChips() {
  const wrap = document.getElementById('filterScroll');
  if (!wrap) return;
  wrap.innerHTML = '';
  FILTERS.forEach(f => {
    const chip = document.createElement('div');
    chip.className = 'filter-chip' + (f.id === state.activeFilter ? ' active' : '');
    chip.dataset.filter = f.id;
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.background = 'linear-gradient(135deg, #ffd6e8 0%, #c7b6ff 45%, #a0e8ff 100%)';
    swatch.style.filter = f.css;
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = f.label;
    chip.appendChild(swatch);
    chip.appendChild(label);
    chip.addEventListener('click', () => {
      state.activeFilter = f.id;
      wrap.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const video = document.getElementById('videoFeed');
      if (video) video.style.filter = f.css;
    });
    wrap.appendChild(chip);
  });
}

function buildThemeGallery() {
  const wrap = document.getElementById('themeGallery');
  if (!wrap) return;
  wrap.innerHTML = '';
  FRAMES.forEach(fr => {
    const card = document.createElement('div');
    card.className = 'theme-card' + (fr.id === state.frameTheme ? ' active' : '');
    card.dataset.theme = fr.id;

    const swatch = document.createElement('div');
    swatch.className = 'theme-swatch';
    swatch.style.backgroundColor = fr.bg;
    if (fr.pattern === 'dots') swatch.classList.add('pattern-dots');
    if (fr.pattern === 'stripes-y2k') swatch.classList.add('pattern-stripes-y2k');
    if (fr.pattern === 'stripes-retro') swatch.classList.add('pattern-stripes-retro');
    if (fr.pattern === 'stars') swatch.classList.add('pattern-stars');

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = fr.label;

    card.appendChild(swatch);
    card.appendChild(label);
    card.addEventListener('click', () => {
      state.frameTheme = fr.id;
      wrap.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      applyFrameTheme(fr.id);
    });
    wrap.appendChild(card);
  });
}

// ==========================================================================
// FRAME THEME APPLICATION (live preview overlay + result mockup)
// ==========================================================================
function updateLiveFrameOverlay(frame) {
  const overlay = document.getElementById('liveFrameOverlay');
  if (!overlay) return;
  overlay.style.setProperty('--frame-accent', frame.accent);
  overlay.innerHTML = '';
  const emojiDecos = frame.decorations.filter(d => d.type === 'emoji').slice(0, 4);
  const positions = ['tl', 'tr', 'bl', 'br'];
  emojiDecos.forEach((d, i) => {
    const span = document.createElement('span');
    span.className = 'corner-deco ' + (positions[i] || 'tl');
    span.textContent = d.content;
    overlay.appendChild(span);
  });
}

function applyFrameTheme(themeId) {
  state.frameTheme = themeId;
  const frame = getFrame(themeId);
  updateLiveFrameOverlay(frame);
  const container = document.getElementById('photostripContainer');
  if (container) {
    container.dataset.theme = themeId;
    renderMockupStrip();
  }
}

function appendFramePatternClass(container, frame) {
  const ALL = ['pattern-dots','pattern-stripes-y2k','pattern-stripes-retro','pattern-stars',
               'pattern-checkers','pattern-checker-pink','pattern-grain','pattern-aurora','pattern-crosshatch'];
  ALL.forEach(c => container.classList.remove(c));
  if (frame.pattern) container.classList.add('pattern-' + frame.pattern);
}

function appendFrameDecorations(container, frame) {
  frame.decorations.forEach(d => {
    const el = document.createElement('div');
    el.className = 'frame-deco';
    el.style.left = d.x + '%';
    el.style.top = d.y + '%';
    el.style.transform = `translate(-50%, -50%) rotate(${d.rotate || 0}deg)`;
    if (d.type === 'emoji') {
      el.textContent = d.content;
      el.style.fontSize = d.size + 'px';
    } else if (d.type === 'text') {
      el.textContent = d.content;
      el.style.fontSize = d.size + 'px';
      el.style.fontFamily = d.font || "'Space Grotesk', sans-serif";
      el.style.color = d.color || '#000';
      el.style.fontWeight = d.weight || '600';
      el.style.letterSpacing = '1px';
    } else if (d.type === 'sticker') {
      el.textContent = d.content;
      el.style.fontSize = d.size + 'px';
      el.style.fontFamily = "'Space Grotesk', sans-serif";
      el.style.fontWeight = '700';
      el.style.background = '#ffffff';
      el.style.color = '#000';
      el.style.border = '2px solid #000';
      el.style.padding = '3px 8px';
      el.style.borderRadius = '6px';
      el.style.boxShadow = '2px 2px 0px rgba(0,0,0,0.2)';
    }
    container.appendChild(el);
  });
}

// ==========================================================================
// PHOTOSTRIP RENDERING
// ==========================================================================
function initPhotostrip() {
  const container = document.getElementById('photostripContainer');
  if (!container) return;
  container.innerHTML = '';
  const frame = getFrame(state.frameTheme);
  container.style.backgroundColor = frame.bg;
  appendFramePatternClass(container, frame);

  for (let i = 0; i < state.selectedSlots; i++) {
    const slot = document.createElement('div');
    slot.className = 'strip-photo-slot empty';
    slot.style.width = '100%';
    slot.style.aspectRatio = '4/3';
    slot.style.backgroundColor = 'rgba(0,0,0,0.05)';
    slot.style.borderRadius = '3px';
    slot.style.display = 'flex';
    slot.style.alignItems = 'center';
    slot.style.justifyContent = 'center';
    slot.innerHTML = `<span style="color: rgba(0,0,0,0.2); font-weight: bold;">${i + 1}</span>`;
    container.appendChild(slot);
  }
}

function getBrightContrastFilter() {
  const rangeBright = document.getElementById('rangeBright');
  const rangeContrast = document.getElementById('rangeContrast');
  const bVal = rangeBright ? rangeBright.value : 100;
  const cVal = rangeContrast ? rangeContrast.value : 100;
  return `brightness(${bVal}%) contrast(${cVal}%)`;
}

function renderMockupStrip() {
  const container = document.getElementById('photostripContainer');
  if (!container) return;
  container.innerHTML = '';

  const frame = getFrame(state.frameTheme);
  container.style.backgroundColor = frame.bg;
  appendFramePatternClass(container, frame);

  const bcFilter = getBrightContrastFilter();
  state.capturedImages.forEach(imgSrc => {
    const imgEl = document.createElement('img');
    if (imgSrc) imgEl.src = imgSrc;
    imgEl.className = 'strip-img-item';
    imgEl.style.filter = bcFilter;
    container.appendChild(imgEl);
  });

  // Hiasan bingkai sesuai tema
  appendFrameDecorations(container, frame);

  // Watermark, warna otomatis menyesuaikan tema bingkai
  const watermark = document.createElement('div');
  watermark.className = 'watermark';
  watermark.style.color = frame.text;
  const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  watermark.innerHTML = `✨ SNAPGLOW ✨<br>${today}`;
  container.appendChild(watermark);

  // Render ulang stiker yang sudah ditambahkan user
  state.stickers.forEach(s => renderStickerElement(container, s));
}

// ==========================================================================
// STICKER / TEXT (DRAGGABLE)
// ==========================================================================
function renderStickerElement(container, sticker) {
  const el = document.createElement('div');
  el.className = 'draggable-sticker' + (sticker.isText ? ' text-sticker' : '');
  el.dataset.id = sticker.id;
  el.style.left = sticker.x + '%';
  el.style.top = sticker.y + '%';
  el.style.transform = `translate(-50%, -50%) rotate(${sticker.rotate || 0}deg)`;
  el.textContent = sticker.content;

  const removeBtn = document.createElement('span');
  removeBtn.className = 'remove-x';
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.stickers = state.stickers.filter(s => s.id !== sticker.id);
    el.remove();
  });
  el.appendChild(removeBtn);

  makeDraggable(el, sticker, container);
  container.appendChild(el);
}

function addSticker(content, isText) {
  const container = document.getElementById('photostripContainer');
  if (!container) return;
  if (isText) {
    const txt = window.prompt('Tulis teks stiker kamu:', 'Hello!');
    if (!txt) return;
    content = txt;
  }
  const sticker = {
    id: 'stk_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    content,
    x: 50,
    y: 50,
    rotate: 0,
    isText: !!isText
  };
  state.stickers.push(sticker);
  renderStickerElement(container, sticker);
}

function makeDraggable(el, sticker, container) {
  let dragging = false;

  const onPointerDown = (e) => {
    dragging = true;
    el.setPointerCapture && el.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const rect = container.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    sticker.x = x;
    sticker.y = y;
    el.style.left = x + '%';
    el.style.top = y + '%';
  };

  const onPointerUp = (e) => {
    dragging = false;
    el.releasePointerCapture && el.releasePointerCapture(e.pointerId);
  };

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);
}

// ==========================================================================
// LAYOUT SELECTION (jumlah slot foto)
// ==========================================================================
document.querySelectorAll('.frame-card.option').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.frame-card.option').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    state.selectedSlots = parseInt(card.dataset.slots) || 4;
    initPhotostrip();
  });
});

// ==========================================================================
// CAMERA ENGINE
// ==========================================================================
async function startCamera() {
  const video = document.getElementById('videoFeed');
  if (state.currentStream && state.currentStream !== 'simulated') {
    state.currentStream.getTracks().forEach(track => track.stop());
  }
  const constraints = {
    video: { facingMode: state.facingMode, width: { ideal: 1280 }, height: { ideal: 960 }, aspectRatio: 4 / 3 },
    audio: false
  };
  try {
    state.isSimulation = false;
    state.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (video) {
      video.srcObject = state.currentStream;
      video.play().catch(() => {});
    }
  } catch (err) {
    state.isSimulation = true;
    state.currentStream = 'simulated';
    if (video) {
      video.srcObject = null;
      video.poster = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800';
    }
  }
}

const startBtn = document.getElementById('btnStartCapture');
if (startBtn) {
  startBtn.addEventListener('click', async () => {
    safeGet('stepSelection').classList.remove('active');
    safeGet('stepBooth').classList.add('active');
    state.capturedImages = [];
    state.currentSlotIndex = 0;
    state.stickers = [];

    const totCount = document.getElementById('totalSlotCount');
    const curIdx = document.getElementById('currentSlotIdx');
    const prog = document.getElementById('progressFill');

    if (totCount) totCount.textContent = state.selectedSlots;
    if (curIdx) curIdx.textContent = '0';
    if (prog) prog.style.width = '0%';

    const video = document.getElementById('videoFeed');
    if (video) video.style.filter = getFilter(state.activeFilter).css;

    updateLiveFrameOverlay(getFrame(state.frameTheme));
    await startCamera();
  });
}

// ==========================================================================
// SHUTTER & COUNTDOWN
// ==========================================================================
function initShutterButton() {
  const shutterBtn = document.getElementById('btnTriggerPhoto');
  if (shutterBtn) {
    shutterBtn.addEventListener('click', () => {
      if (state.currentSlotIndex >= state.selectedSlots) return;
      shutterBtn.disabled = true;
      runSessionCountdown();
    });
  }
}

function runSessionCountdown() {
  const cdDisplay = document.getElementById('countdownDisplay');
  const timerSel = document.getElementById('selectTimer');
  let count = timerSel ? (parseInt(timerSel.value) || 5) : 5;

  if (cdDisplay) {
    cdDisplay.style.display = 'block';
    cdDisplay.textContent = count;
  }

  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      if (cdDisplay) cdDisplay.textContent = count;
    } else {
      clearInterval(timer);
      if (cdDisplay) cdDisplay.style.display = 'none';
      captureFrame();
    }
  }, 1000);
}

function captureFrame() {
  const video = document.getElementById('videoFeed');
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  const filterCss = getFilter(state.activeFilter).css;

  if (state.isSimulation) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    const colors = [['#a370f7', '#3a86ff'], ['#ff0055', '#ffe3ec'], ['#caff4d', '#3a86ff']];
    const setChoice = colors[state.currentSlotIndex % colors.length];
    gradient.addColorStop(0, setChoice[0]);
    gradient.addColorStop(1, setChoice[1]);
    if (filterCss !== 'none') ctx.filter = filterCss;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (video) {
    ctx.save();
    if (filterCss !== 'none') ctx.filter = filterCss;

    if (state.facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    const videoW = video.videoWidth || 640;
    const videoH = video.videoHeight || 480;
    const targetRatio = canvas.width / canvas.height;
    const videoRatio = videoW / videoH;
    let sx, sy, sw, sh;
    if (videoRatio > targetRatio) {
      sh = videoH; sw = videoH * targetRatio; sx = (videoW - sw) / 2; sy = 0;
    } else {
      sw = videoW; sh = videoW / targetRatio; sx = 0; sy = (videoH - sh) / 2;
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  state.capturedImages.push(canvas.toDataURL('image/jpeg', 0.92));
  state.currentSlotIndex++;

  const pct = (state.currentSlotIndex / state.selectedSlots) * 100;
  const prog = document.getElementById('progressFill');
  const curIdx = document.getElementById('currentSlotIdx');
  if (prog) prog.style.width = `${pct}%`;
  if (curIdx) curIdx.textContent = state.currentSlotIndex;

  const flash = document.getElementById('flashOverlay');
  if (flash) {
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 300);
  }

  const shutBtn = document.getElementById('btnTriggerPhoto');
  if (state.currentSlotIndex < state.selectedSlots) {
    setTimeout(() => { if (shutBtn) shutBtn.disabled = false; runSessionCountdown(); }, 1500);
  } else {
    if (shutBtn) shutBtn.disabled = false;
    setTimeout(() => { finishPhotoSession(); }, 1000);
  }
}

function finishPhotoSession() {
  if (state.currentStream && state.currentStream !== 'simulated') {
    state.currentStream.getTracks().forEach(track => track.stop());
  }
  safeGet('stepBooth').classList.remove('active');
  safeGet('stepResult').classList.add('active');
  renderMockupStrip();
}

// ==========================================================================
// CANVAS PATTERN HELPERS (untuk export resolusi tinggi)
// ==========================================================================
function drawDots(ctx, w, h, spacing, radius, color) {
  ctx.fillStyle = color;
  for (let y = 0; y <= h + spacing; y += spacing) {
    for (let x = 0; x <= w + spacing; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawDiagonalStripes(ctx, w, h, color1, color2, stripeWidth) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  const diag = Math.sqrt(w * w + h * h) * 1.5;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.PI / 4);
  ctx.translate(-diag / 2, -diag / 2);
  let x = -diag * 0.5;
  let i = 0;
  while (x < diag * 1.5) {
    const c = (i % 2 === 0) ? color1 : color2;
    if (c !== 'transparent') {
      ctx.fillStyle = c;
      ctx.fillRect(x, -diag, stripeWidth, diag * 3);
    }
    x += stripeWidth;
    i++;
  }
  ctx.restore();
}

function drawStars(ctx, w, h) {
  let seed = 42;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < 60; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = rand() * 1.8 + 0.6;
    ctx.fillStyle = `rgba(255,255,255,${(0.25 + rand() * 0.5).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCheckerboard(ctx, w, h, size, color) {
  ctx.fillStyle = color;
  for (let row = 0; row * size < h; row++) {
    for (let col = 0; col * size < w; col++) {
      if ((row + col) % 2 === 0) ctx.fillRect(col * size, row * size, size, size);
    }
  }
}

function drawCrosshatch(ctx, w, h, spacing, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = 0; y <= h; y += spacing) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
  for (let x = 0; x <= w; x += spacing) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
  ctx.stroke();
}

function drawAurora(ctx, w, h) {
  const g1 = ctx.createLinearGradient(0, 0, 0, h);
  g1.addColorStop(0,    'rgba(0,255,150,0.12)');
  g1.addColorStop(0.4,  'rgba(0,200,255,0.08)');
  g1.addColorStop(0.7,  'rgba(0,0,0,0)');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h);

  const g2 = ctx.createRadialGradient(w*0.3, h*0.2, 0, w*0.3, h*0.2, w*0.55);
  g2.addColorStop(0,   'rgba(0,255,180,0.15)');
  g2.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);

  const g3 = ctx.createRadialGradient(w*0.7, h*0.6, 0, w*0.7, h*0.6, w*0.55);
  g3.addColorStop(0,   'rgba(80,0,255,0.12)');
  g3.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g3; ctx.fillRect(0, 0, w, h);
}

function drawGrain(ctx, w, h) {
  // Lightweight pseudo-noise grain on canvas
  const idata = ctx.createImageData(w, h);
  const data  = idata.data;
  let s = 1337;
  const rng = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967295; };
  for (let i = 0; i < data.length; i += 4) {
    const v = rng() < 0.5 ? 0 : 255;
    data[i] = data[i+1] = data[i+2] = v;
    data[i+3] = Math.floor(rng() * 28);
  }
  ctx.putImageData(idata, 0, 0);
}

function drawFramePattern(ctx, frame, w, h, scale) {
  ctx.fillStyle = frame.bg;
  ctx.fillRect(0, 0, w, h);

  switch (frame.pattern) {
    case 'dots':
      drawDots(ctx, w, h, 16 * scale, 1.6 * scale, 'rgba(0,0,0,0.18)');
      break;
    case 'stripes-y2k':
      drawDiagonalStripes(ctx, w, h, 'rgba(255,255,255,0.35)', 'transparent', 7 * scale);
      break;
    case 'stripes-retro':
      drawDiagonalStripes(ctx, w, h, '#bd3a2b', '#eae1d4', 9 * scale);
      break;
    case 'stars':
      drawStars(ctx, w, h);
      break;
    case 'checkers':
      drawCheckerboard(ctx, w, h, 18 * scale, 'rgba(255,102,255,0.18)');
      break;
    case 'checker-pink':
      drawCheckerboard(ctx, w, h, 14 * scale, 'rgba(255,255,255,0.25)');
      break;
    case 'grain':
      drawGrain(ctx, w, h);
      break;
    case 'aurora':
      drawAurora(ctx, w, h);
      break;
    case 'crosshatch':
      drawCrosshatch(ctx, w, h, 20 * scale, 'rgba(249,199,79,0.08)');
      break;
    default:
      break;
  }
}

function drawFrameDecorations(ctx, frame, w, h, scale) {
  frame.decorations.forEach(d => {
    const px = (d.x / 100) * w;
    const py = (d.y / 100) * h;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(((d.rotate || 0) * Math.PI) / 180);

    if (d.type === 'emoji') {
      ctx.font = `${d.size * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.content, 0, 0);
    } else if (d.type === 'text') {
      ctx.font = `${d.weight || 600} ${d.size * scale}px ${d.font || "'Space Grotesk', sans-serif"}`;
      ctx.fillStyle = d.color || '#000';
      ctx.textAlign = d.align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.content, 0, 0);
    } else if (d.type === 'sticker') {
      const fontSize = d.size * scale;
      ctx.font = `700 ${fontSize}px 'Space Grotesk', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textW = ctx.measureText(d.content).width;
      const padX = 10 * scale, padY = 6 * scale;
      const bw = textW + padX * 2, bh = fontSize + padY * 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.lineWidth = 2 * scale;
      ctx.strokeStyle = '#000';
      ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
      ctx.fillStyle = '#000';
      ctx.fillText(d.content, 0, 0);
    }
    ctx.restore();
  });
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStickers(ctx, stickers, w, h, scale) {
  stickers.forEach(s => {
    const px = (s.x / 100) * w;
    const py = (s.y / 100) * h;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(((s.rotate || 0) * Math.PI) / 180);

    if (s.isText) {
      const fontSize = 16 * scale;
      ctx.font = `700 ${fontSize}px 'Space Grotesk', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textW = ctx.measureText(s.content).width;
      const padX = 10 * scale, padY = 6 * scale;
      const bw = textW + padX * 2, bh = fontSize + padY * 2;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      const r = 10 * scale;
      roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, r);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.fillText(s.content, 0, 0);
    } else {
      ctx.font = `${36 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.content, 0, 0);
    }
    ctx.restore();
  });
}

// ==========================================================================
// EXPORT HIGH RESOLUTION IMAGE
// ==========================================================================
function generateFinalCanvas(format) {
  const images = document.querySelectorAll('.strip-img-item');
  if (images.length === 0) return;

  const frame = getFrame(state.frameTheme);

  const originalWidth = 800;
  const originalHeight = 600;
  const scale = 1.5;
  const targetImgW = originalWidth * scale;
  const targetImgH = originalHeight * scale;
  const padding = 40 * scale;
  const gap = 30 * scale;
  const bottomSpace = 130 * scale;

  const canvas = document.createElement('canvas');
  canvas.width = targetImgW + (padding * 2);
  canvas.height = (targetImgH * images.length) + (gap * (images.length - 1)) + padding + bottomSpace;
  const ctx = canvas.getContext('2d');

  // referensi: mockup preview di UI lebar 220px
  const refScale = canvas.width / 220;

  // 1. Background + pattern bingkai
  drawFramePattern(ctx, frame, canvas.width, canvas.height, refScale);

  // 2. Hiasan bingkai (emoji/teks sesuai tema)
  drawFrameDecorations(ctx, frame, canvas.width, canvas.height, refScale);

  // 3. Foto-foto dengan filter brightness/contrast
  const bVal = document.getElementById('rangeBright') ? document.getElementById('rangeBright').value : 100;
  const cVal = document.getElementById('rangeContrast') ? document.getElementById('rangeContrast').value : 100;

  images.forEach((img, index) => {
    const currentY = padding + (index * (targetImgH + gap));
    ctx.save();
    ctx.filter = `brightness(${bVal}%) contrast(${cVal}%)`;
    ctx.drawImage(img, padding, currentY, targetImgW, targetImgH);
    ctx.restore();
  });

  // 4. Stiker yang ditambahkan user
  drawStickers(ctx, state.stickers, canvas.width, canvas.height, refScale);

  // 5. Watermark
  ctx.fillStyle = frame.text;
  ctx.textAlign = 'center';
  ctx.font = `bold ${24 * scale}px sans-serif`;
  ctx.fillText('✨ SNAPGLOW AESTHETIC ✨', canvas.width / 2, canvas.height - (60 * scale));

  const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  ctx.font = `${18 * scale}px sans-serif`;
  ctx.fillText(today, canvas.width / 2, canvas.height - (25 * scale));

  // 6. Simpan
  const dataUrl = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 1.0);
  const link = document.createElement('a');
  link.download = `snapglow-${Date.now()}.${format}`;
  link.href = dataUrl;
  link.click();
}

// ==========================================================================
// IMAGE ADJUSTMENT SLIDERS (live preview)
// ==========================================================================
function bindAdjustmentSliders() {
  const rangeBright = document.getElementById('rangeBright');
  const rangeContrast = document.getElementById('rangeContrast');
  const valBright = document.getElementById('valBright');
  const valContrast = document.getElementById('valContrast');

  const applyFilter = () => {
    const f = getBrightContrastFilter();
    document.querySelectorAll('.strip-img-item').forEach(img => { img.style.filter = f; });
    if (valBright && rangeBright) valBright.textContent = rangeBright.value + '%';
    if (valContrast && rangeContrast) valContrast.textContent = rangeContrast.value + '%';
  };

  if (rangeBright) rangeBright.addEventListener('input', applyFilter);
  if (rangeContrast) rangeContrast.addEventListener('input', applyFilter);
}

// ==========================================================================
// BIND ON LOAD
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  buildFilterChips();
  buildThemeGallery();
  initPhotostrip();
  initShutterButton();
  bindAdjustmentSliders();

  const video = document.getElementById('videoFeed');
  if (video) video.style.filter = getFilter(state.activeFilter).css;
  updateLiveFrameOverlay(getFrame(state.frameTheme));

  document.querySelectorAll('.sticker-item').forEach(btn => {
    btn.addEventListener('click', () => {
      addSticker(btn.textContent.trim(), btn.dataset.type === 'text');
    });
  });

  const dJpg = document.getElementById('btnDownloadJpg');
  const dPng = document.getElementById('btnDownloadPng');
  if (dJpg) dJpg.addEventListener('click', () => generateFinalCanvas('jpg'));
  if (dPng) dPng.addEventListener('click', () => generateFinalCanvas('png'));

  const resetBtn = document.getElementById('btnResetAll');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      safeGet('stepResult').classList.remove('active');
      safeGet('stepSelection').classList.add('active');
      state.capturedImages = [];
      state.currentSlotIndex = 0;
      state.stickers = [];
    });
  }
});