/**
 * SnapGlow - Photobooth Core Script
 * Version: 2.11 (Anti-Crash & Safe Element Protection Edition)
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(err => console.log(err));
  });
}

// ==========================================================================
// GLOBAL STATE MANAGEMENT
// ==========================================================================
const state = {
  selectedSlots: 4,
  currentStream: null,
  capturedImages: [],
  currentSlotIndex: 0,
  activeFilter: 'filter-normal',
  frameBgColor: '#ffffff',
  facingMode: 'user',
  isSimulation: false
};

// ==========================================================================
// SAFE DOM SELECTOR FUNCTION (Biar ga crash pas ada ID yang beda/hilang)
// ==========================================================================
const safeGet = (id) => document.getElementById(id) || { addEventListener: () => {}, style: {}, classList: { remove:()=>{}, add:()=>{} } };

const stepSelection = safeGet('stepSelection');
const stepBooth = safeGet('stepBooth');
const stepResult = safeGet('stepResult');
const videoFeed = safeGet('videoFeed');
const photostripContainer = safeGet('photostripContainer');
const flashOverlay = safeGet('flashOverlay');
const countdownDisplay = safeGet('countdownDisplay');
const btnTriggerPhoto = safeGet('btnTriggerPhoto');
const selectTimer = safeGet('selectTimer');
const btnStartCapture = safeGet('btnStartCapture');

// ==========================================================================
// RENDER INITIAL EMPTY STRIP
// ==========================================================================
function initPhotostrip() {
  const container = document.getElementById('photostripContainer');
  if (!container) return;
  container.innerHTML = '';
  container.style.backgroundColor = state.frameBgColor;
  
  for (let i = 0; i < state.selectedSlots; i++) {
    const slot = document.createElement('div');
    slot.className = 'strip-photo-slot empty';
    slot.style.width = '100%';
    slot.style.aspectRatio = '4/3';
    slot.style.backgroundColor = 'rgba(0,0,0,0.05)';
    slot.style.marginBottom = '15px';
    slot.style.display = 'flex';
    slot.style.alignItems = 'center';
    slot.style.justifyContent = 'center';
    slot.innerHTML = `<span style="color: rgba(0,0,0,0.2); font-weight: bold;">${i + 1}</span>`;
    container.appendChild(slot);
  }
}

// ==========================================================================
// RENDER FINAL CAPTURED STRIP
// ==========================================================================
function renderMockupStrip() {
  const container = document.getElementById('photostripContainer');
  if (!container) return;
  container.innerHTML = '';
  container.style.backgroundColor = state.frameBgColor;

  state.capturedImages.forEach(imgSrc => {
    const imgEl = document.createElement('img');
    if (imgSrc) imgEl.src = imgSrc;
    imgEl.className = 'strip-img-item';
    imgEl.style.width = '100%';
    imgEl.style.aspectRatio = '4/3';
    imgEl.style.objectFit = 'cover';
    imgEl.style.marginBottom = '15px';
    imgEl.style.display = 'block';
    container.appendChild(imgEl);
  });

  const watermark = document.createElement('div');
  watermark.className = 'watermark';
  const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  watermark.innerHTML = `✨ SNAPGLOW ✨<br>${today}`;
  container.appendChild(watermark);
}

// ==========================================================================
// BIND EVENT LISTENERS (DIPASTIKAN BISA DIKLIK DAN AKTIF)
// ==========================================================================

// Pilihan Warna Bingkai (.color-dot)
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    
    state.frameBgColor = dot.dataset.color || '#ffffff';
    const container = document.getElementById('photostripContainer');
    if (container) {
      container.style.backgroundColor = state.frameBgColor;
    }
  });
});

// Pilihan Jumlah Slot Layout
document.querySelectorAll('.frame-card.option').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.frame-card.option').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    state.selectedSlots = parseInt(card.dataset.slots) || 4;
    initPhotostrip();
  });
});

// Pilihan Filter Instagram
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    state.activeFilter = btn.dataset.filter || 'filter-normal';
    const video = document.getElementById('videoFeed');
    if (video) {
      video.className = ''; 
      video.classList.add(state.activeFilter);
    }
  });
});

// ==========================================================================
// WEBCAM ENGINE ENGINE
// ==========================================================================
async function startCamera() {
  const video = document.getElementById('videoFeed');
  if (state.currentStream && state.currentStream !== "simulated") {
    state.currentStream.getTracks().forEach(track => track.stop());
  }
  const constraints = {
    video: { facingMode: state.facingMode, width: { ideal: 1280 }, height: { ideal: 960 }, aspectRatio: 4/3 },
    audio: false
  };
  try {
    state.isSimulation = false;
    state.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (video) {
      video.srcObject = state.currentStream;
      video.play().catch(e => console.log(e));
    }
  } catch (err) {
    state.isSimulation = true;
    state.currentStream = "simulated";
    if (video) {
      video.srcObject = null;
      video.poster = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800";
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
    
    const totCount = document.getElementById('totalSlotCount');
    const curIdx = document.getElementById('currentSlotIdx');
    const prog = document.getElementById('progressFill');
    
    if (totCount) totCount.textContent = state.selectedSlots;
    if (curIdx) curIdx.textContent = '0';
    if (prog) prog.style.width = '0%';
    
    initPhotostrip();
    await startCamera();
  });
}

const switchBtn = document.getElementById('btnSwitchCam');
if (switchBtn) {
  switchBtn.addEventListener('click', async () => {
    if (state.isSimulation) return;
    const video = document.getElementById('videoFeed');
    state.facingMode = (state.facingMode === 'user') ? 'environment' : 'user';
    if (video) {
      video.style.transform = (state.facingMode === 'user') ? 'scaleX(-1)' : 'none';
    }
    await startCamera();
  });
}

// ==========================================================================
// LOGIKA SHUTTER JEPRET & COUNTDOWN
// ==========================================================================
const shutterBtn = document.getElementById('btnTriggerPhoto');
if (shutterBtn) {
  shutterBtn.addEventListener('click', () => {
    if (state.currentSlotIndex >= state.selectedSlots) return;
    shutterBtn.disabled = true;
    runSessionCountdown();
  });
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

  if (state.isSimulation) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    const colors = [['#a370f7', '#3a86ff'], ['#ff0055', '#ffe3ec']];
    const setChoice = colors[state.currentSlotIndex % colors.length];
    gradient.addColorStop(0, setChoice[0]);
    gradient.addColorStop(1, setChoice[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (video) {
    ctx.save();
    
    if (state.activeFilter === 'filter-paris') ctx.filter = 'brightness(1.12) contrast(0.92) saturate(1.05)';
    else if (state.activeFilter === 'filter-jakarta') ctx.filter = 'sepia(0.25) saturate(1.3) brightness(1.02) hue-rotate(-5deg)';
    else if (state.activeFilter === 'filter-losangeles') ctx.filter = 'contrast(1.25) saturate(1.35) brightness(0.98)';
    else if (state.activeFilter === 'filter-vintage-grain') ctx.filter = 'contrast(1.15) saturate(0.85) brightness(0.95) sepia(0.1)';
    else if (state.activeFilter === 'filter-cyber-glitch') ctx.filter = 'hue-rotate(130deg) saturate(1.7) contrast(1.2)';
    else if (state.activeFilter === 'filter-dreamy-cream') ctx.filter = 'brightness(1.06) saturate(0.9) contrast(0.95)';

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

  state.capturedImages.push(canvas.toDataURL('image/jpeg', 0.9));
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
  const video = document.getElementById('videoFeed');
  if (state.currentStream && state.currentStream !== "simulated") {
    state.currentStream.getTracks().forEach(track => track.stop());
  }
  safeGet('stepBooth').classList.remove('active');
  safeGet('stepResult').classList.add('active');
  renderMockupStrip();
}

// ==========================================================================
// ADJUSTMENT ADJUST SLIDER
// ==========================================================================
const rangeBright = document.getElementById('rangeBright');
const rangeContrast = document.getElementById('rangeContrast');
[rangeBright, rangeContrast].forEach(slider => {
  if (slider) {
    slider.addEventListener('input', () => {
      document.querySelectorAll('.strip-img-item').forEach(img => {
        const bVal = rangeBright ? rangeBright.value : 100;
        const cVal = rangeContrast ? rangeContrast.value : 100;
        img.style.filter = `brightness(${bVal}%) contrast(${cVal}%)`;
      });
    });
  }
});

// ==========================================================================
// EXPORT DATA CANVAS DOWNLOAD
// ==========================================================================
function generateFinalCanvas(format) {
  const images = document.querySelectorAll('.strip-img-item');
  if (images.length === 0) return;

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

  ctx.fillStyle = state.frameBgColor || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let loadedCount = 0;
  images.forEach((img, index) => {
    const currentY = padding + (index * (targetImgH + gap));
    ctx.save();
    const bVal = rangeBright ? rangeBright.value : 100;
    const cVal = rangeContrast ? rangeContrast.value : 100;
    ctx.filter = `brightness(${bVal}%) contrast(${cVal}%)`;
    ctx.drawImage(img, padding, currentY, targetImgW, targetImgH);
    ctx.restore();
    
    loadedCount++;
    if (loadedCount === images.length) {
      const warnaTerang = ['#ffffff', '#ffe3ec', '#d8f3dc', '#e0aaff', '#f0f0f0'];
      ctx.fillStyle = warnaTerang.includes(state.frameBgColor.toLowerCase()) ? '#111111' : '#ffffff';
      
      ctx.textAlign = 'center';
      ctx.font = `bold ${24 * scale}px sans-serif`;
      ctx.fillText("✨ SNAPGLOW AESTHETIC ✨", canvas.width / 2, canvas.height - (60 * scale));
      
      const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
      ctx.font = `${18 * scale}px sans-serif`;
      ctx.fillText(today, canvas.width / 2, canvas.height - (25 * scale));

      const dataUrl = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 1.0);
      const link = document.createElement('a');
      link.download = `snapglow-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    }
  });
}

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
  });
}

window.addEventListener('DOMContentLoaded', () => { initPhotostrip(); });