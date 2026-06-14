/**
 * SnapGlow - Photobooth Core Script
 * Version: 2.15 (Synced Live Frame & Image Capture Edition)
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
  activeTheme: 'plain-white',
  facingMode: 'user',
  isSimulation: false
};

const safeGet = (id) => document.getElementById(id) || { addEventListener: () => {}, style: {}, classList: { remove:()=>{}, add:()=>{} } };

// ==========================================================================
// INITIALIZE & MOCKUP STRIP
// ==========================================================================
function initPhotostrip() {
  const container = document.getElementById('photostripContainer');
  if (!container) return;
  container.innerHTML = '';
  container.style.backgroundColor = state.frameBgColor;
  container.setAttribute('data-active-theme', state.activeTheme);
  
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

function renderMockupStrip() {
  const container = document.getElementById('photostripContainer');
  if (!container) return;
  container.innerHTML = '';
  container.style.backgroundColor = state.frameBgColor;
  container.setAttribute('data-active-theme', state.activeTheme);

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
// SYSTEM SELECTION EVENTS (WARNA, BINGKAI TEMPLATE, FILTER)
// ==========================================================================
function bindCustomControls() {
  // 1. Pilihan Warna Lingkaran Polos (.color-dot)
  const colorDots = document.querySelectorAll('.color-dot');
  colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      colorDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      
      state.frameBgColor = dot.dataset.color || '#ffffff';
      const container = document.getElementById('photostripContainer');
      if (container) container.style.backgroundColor = state.frameBgColor;
    });
  });

  // 2. FIX PILIHAN BINGKAI TEMPLATE (.theme-btn)
  const themeBtns = document.querySelectorAll('.theme-btn');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      state.activeTheme = btn.dataset.theme || 'plain-white';
      
      // Sinkronkan overlay bingkai kamera pas lagi di booth
      const liveOverlay = document.getElementById('liveFrameOverlay');
      if (liveOverlay) {
        liveOverlay.setAttribute('data-active-theme', state.activeTheme);
      }
      
      // Sinkronkan container mockup final
      const container = document.getElementById('photostripContainer');
      if (container) {
        container.setAttribute('data-active-theme', state.activeTheme);
      }
    });
  });

  // 3. Pilihan Filter Kamera (.filter-btn)
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      state.activeFilter = btn.dataset.filter || 'filter-normal';
      const video = document.getElementById('videoFeed');
      if (video) {
        video.className = ''; 
        video.classList.add(state.activeFilter);
      }
    });
  });

  // 4. Pilihan Slot Grid Layout Awal
  document.querySelectorAll('.frame-card.option').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.frame-card.option').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.selectedSlots = parseInt(card.dataset.slots) || 4;
      initPhotostrip();
    });
  });
}

// ==========================================================================
// ENGINE ENGINES WEBCAM
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

// ==========================================================================
// SHUTTER INTERACTION CONTROLLER
// ==========================================================================
function initShutterEngine() {
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
    cdDisplay.style.display = 'flex';
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
    const colors = [['#a370f7', '#3a86ff'], ['#ff0055', '#ffe3ec'], ['#7cd93a', '#ffffff'], ['#bd3a2b', '#eae1d4']];
    const setChoice = colors[state.currentSlotIndex % colors.length];
    gradient.addColorStop(0, setChoice[0]);
    gradient.addColorStop(1, setChoice[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (video) {
    ctx.save();
    
    // Inject filter render kustomisasi canvas
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
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
  if (state.currentStream && state.currentStream !== "simulated") {
    state.currentStream.getTracks().forEach(track => track.stop());
  }
  safeGet('stepBooth').classList.remove('active');
  safeGet('stepResult').classList.add('active');
  renderMockupStrip();
}

// ==========================================================================
// EXPORT DATA DOWNLOAD EXPORT
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
  const bottomSpace = 140 * scale;

  const canvas = document.createElement('canvas');
  canvas.width = targetImgW + (padding * 2);
  canvas.height = (targetImgH * images.length) + (gap * (images.length - 1)) + padding + bottomSpace;
  const ctx = canvas.getContext('2d');

  // Skema Render Background Motif Frame di Canvas Unduhan
  if (state.activeTheme === 'y2k-lime') {
    ctx.fillStyle = '#7cd93a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (state.activeTheme === 'retro-stripes') {
    ctx.fillStyle = '#eae1d4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#bd3a2b';
    for (let i = -canvas.height; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 20, 0);
      ctx.lineTo(i + 20 + canvas.height, canvas.height);
      ctx.lineTo(i + canvas.height, canvas.height);
      ctx.fill();
    }
  } else if (state.activeTheme === 'cyber-glam') {
    ctx.fillStyle = '#ffe3ec';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = state.frameBgColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  let loadedCount = 0;
  images.forEach((img, index) => {
    const currentY = padding + (index * (targetImgH + gap));
    ctx.save();
    
    // Penyesuaian editor kecerahan
    const rangeBright = document.getElementById('rangeBright');
    const rangeContrast = document.getElementById('rangeContrast');
    const bVal = rangeBright ? rangeBright.value : 100;
    const cVal = rangeContrast ? rangeContrast.value : 100;
    ctx.filter = `brightness(${bVal}%) contrast(${cVal}%)`;
    
    ctx.drawImage(img, padding, currentY, targetImgW, targetImgH);
    ctx.restore();
    
    loadedCount++;
    if (loadedCount === images.length) {
      ctx.fillStyle = (state.activeTheme === 'y2k-lime' || state.activeTheme === 'retro-stripes') ? '#000000' : '#111111';
      ctx.textAlign = 'center';
      ctx.font = `bold ${24 * scale}px sans-serif`;
      ctx.fillText("✨ SNAPGLOW PHOTOMOCK ✨", canvas.width / 2, canvas.height - (65 * scale));
      
      const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
      ctx.font = `${18 * scale}px sans-serif`;
      ctx.fillText(today, canvas.width / 2, canvas.height - (30 * scale));

      const dataUrl = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 1.0);
      const link = document.createElement('a');
      link.download = `snapglow-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    }
  });
}

// BIND INITIAL ONLOAD
window.addEventListener('DOMContentLoaded', () => { 
  initPhotostrip(); 
  bindCustomControls();
  initShutterEngine();

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
});