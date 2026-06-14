/**
 * SnapGlow - Photobooth Core Script
 * Version: 2.10 (Rollback to Solid Stable Edition)
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(err => console.log(err));
  });
}

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

const stepSelection = document.getElementById('stepSelection');
const stepBooth = document.getElementById('stepBooth');
const stepResult = document.getElementById('stepResult');
const videoFeed = document.getElementById('videoFeed');
const photostripContainer = document.getElementById('photostripContainer');
const flashOverlay = document.getElementById('flashOverlay');
const countdownDisplay = document.getElementById('countdownDisplay');
const btnTriggerPhoto = document.getElementById('btnTriggerPhoto');
const selectTimer = document.getElementById('selectTimer');
const btnStartCapture = document.getElementById('btnStartCapture');

function initPhotostrip() {
  if (!photostripContainer) return;
  photostripContainer.innerHTML = '';
  photostripContainer.style.backgroundColor = state.frameBgColor;
  
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
    photostripContainer.appendChild(slot);
  }
}

function renderMockupStrip() {
  if (!photostripContainer) return;
  photostripContainer.innerHTML = '';
  photostripContainer.style.backgroundColor = state.frameBgColor;

  state.capturedImages.forEach(imgSrc => {
    const imgEl = document.createElement('img');
    if (imgSrc) imgEl.src = imgSrc;
    imgEl.className = 'strip-img-item';
    photostripContainer.appendChild(imgEl);
  });

  const watermark = document.createElement('div');
  watermark.className = 'watermark';
  const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  watermark.innerHTML = `✨ SNAPGLOW ✨<br>${today}`;
  photostripContainer.appendChild(watermark);
}

// Handler Klik Pilihan Lingkaran Warna (.color-dot) - Mengubah instan tanpa ngerusak foto
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    
    state.frameBgColor = dot.dataset.color;
    
    if (photostripContainer) {
      photostripContainer.style.backgroundColor = state.frameBgColor;
    }
  });
});

document.querySelectorAll('.frame-card.option').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.frame-card.option').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    state.selectedSlots = parseInt(card.dataset.slots);
    initPhotostrip();
  });
});

async function startCamera() {
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
    videoFeed.srcObject = state.currentStream;
    videoFeed.play().catch(e => console.log(e));
  } catch (err) {
    state.isSimulation = true;
    state.currentStream = "simulated";
    videoFeed.srcObject = null;
    videoFeed.poster = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800";
  }
}

if (btnStartCapture) {
  btnStartCapture.addEventListener('click', async () => {
    stepSelection.classList.remove('active');
    stepBooth.classList.add('active');
    state.capturedImages = [];
    state.currentSlotIndex = 0;
    
    document.getElementById('totalSlotCount').textContent = state.selectedSlots;
    document.getElementById('currentSlotIdx').textContent = '0';
    document.getElementById('progressFill').style.width = '0%';
    
    initPhotostrip();
    await startCamera();
  });
}

document.getElementById('btnSwitchCam').addEventListener('click', async () => {
  if (state.isSimulation) return;
  state.facingMode = (state.facingMode === 'user') ? 'environment' : 'user';
  videoFeed.style.transform = (state.facingMode === 'user') ? 'scaleX(-1)' : 'none';
  await startCamera();
});

// Event Listener Filter Instagram Live Preview
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    state.activeFilter = btn.dataset.filter;
    videoFeed.className = ''; 
    videoFeed.classList.add(state.activeFilter);
  });
});

if (btnTriggerPhoto) {
  btnTriggerPhoto.addEventListener('click', () => {
    if (state.currentSlotIndex >= state.selectedSlots) return;
    btnTriggerPhoto.disabled = true;
    runSessionCountdown();
  });
}

function runSessionCountdown() {
  let count = parseInt(selectTimer.value) || 5;
  countdownDisplay.style.display = 'block';
  countdownDisplay.textContent = count;
  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      countdownDisplay.textContent = count;
    } else {
      clearInterval(timer);
      countdownDisplay.style.display = 'none';
      captureFrame();
    }
  }, 1000);
}

function captureFrame() {
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
  } else {
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
    const videoW = videoFeed.videoWidth;
    const videoH = videoFeed.videoHeight;
    const targetRatio = canvas.width / canvas.height;
    const videoRatio = videoW / videoH;
    let sx, sy, sw, sh;
    if (videoRatio > targetRatio) {
      sh = videoH; sw = videoH * targetRatio; sx = (videoW - sw) / 2; sy = 0;
    } else {
      sw = videoW; sh = videoW / targetRatio; sx = 0; sy = (videoH - sh) / 2;
    }
    ctx.drawImage(videoFeed, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  state.capturedImages.push(canvas.toDataURL('image/jpeg', 0.9));
  state.currentSlotIndex++;
  
  const pct = (state.currentSlotIndex / state.selectedSlots) * 100;
  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('currentSlotIdx').textContent = state.currentSlotIndex;

  flashOverlay.classList.add('active');
  setTimeout(() => flashOverlay.classList.remove('active'), 300);

  if (state.currentSlotIndex < state.selectedSlots) {
    setTimeout(() => { btnTriggerPhoto.disabled = false; runSessionCountdown(); }, 1500);
  } else {
    btnTriggerPhoto.disabled = false;
    setTimeout(() => { finishPhotoSession(); }, 1000);
  }
}

function finishPhotoSession() {
  if (state.currentStream && state.currentStream !== "simulated") {
    state.currentStream.getTracks().forEach(track => track.stop());
  }
  stepBooth.classList.remove('active');
  stepResult.classList.add('active');
  renderMockupStrip();
}

const rangeBright = document.getElementById('rangeBright');
const rangeContrast = document.getElementById('rangeContrast');
[rangeBright, rangeContrast].forEach(slider => {
  if (slider) {
    slider.addEventListener('input', () => {
      document.querySelectorAll('.strip-img-item').forEach(img => {
        img.style.filter = `brightness(${rangeBright.value}%) contrast(${rangeContrast.value}%)`;
      });
    });
  }
});

// LOGIKA EKSPOR CANVAS STABIL (ANTI BLANK/HITAM)
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

  // Isi warna latar belakang bingkai polos solid
  ctx.fillStyle = state.frameBgColor || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let loadedCount = 0;
  images.forEach((img, index) => {
    const currentY = padding + (index * (targetImgH + gap));
    ctx.save();
    ctx.filter = `brightness(${rangeBright.value}%) contrast(${rangeContrast.value}%)`;
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
      link.download = `snapglow-solid-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    }
  });
}

document.getElementById('btnDownloadJpg').addEventListener('click', () => generateFinalCanvas('jpg'));
document.getElementById('btnDownloadPng').addEventListener('click', () => generateFinalCanvas('png'));
document.getElementById('btnResetAll').addEventListener('click', () => {
  stepResult.classList.remove('active'); stepSelection.classList.add('active');
  state.capturedImages = []; state.currentSlotIndex = 0;
});
window.addEventListener('DOMContentLoaded', () => { initPhotostrip(); });