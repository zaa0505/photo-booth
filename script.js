/**
 * SnapGlow - Photobooth Core Script
 * Version: 2.7 (Perfect Frame Theme Sync & Instagram Filters)
 */

// ==========================================================================
// 1. REGISTRASI SERVICE WORKER (PWA)
// ==========================================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .catch(err => console.log('Service Worker gagal dikonfigurasi:', err));
  });
}

// ==========================================================================
// 2. GLOBAL STATE MANAGEMENT
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

// ==========================================================================
// 3. DOM ELEMENTS TARGET
// ==========================================================================
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

// ==========================================================================
// 4. INITIALIZE MOCKUP GRID LAYOUT (UNTUK HALAMAN BOOTH / FOTO)
// ==========================================================================
function initPhotostrip() {
  if (!photostripContainer) return;
  
  photostripContainer.innerHTML = '';
  photostripContainer.style.backgroundColor = state.frameBgColor;
  photostripContainer.setAttribute('data-active-theme', state.activeTheme);
  
  // Hanya membuat kotak kosong awal saat mau mulai foto di stepBooth
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

// Menggambar Hasil Foto Asli Berurutan ke Frame Halaman Akhir (Hasil)
function renderMockupStrip() {
  if (!photostripContainer) return;
  photostripContainer.innerHTML = '';
  photostripContainer.style.backgroundColor = state.frameBgColor;
  photostripContainer.setAttribute('data-active-theme', state.activeTheme);

  state.capturedImages.forEach(imgSrc => {
    const imgEl = document.createElement('img');
    if (imgSrc) imgEl.src = imgSrc;
    imgEl.className = 'strip-img-item';
    imgEl.style.width = '100%';
    imgEl.style.aspectRatio = '4/3';
    imgEl.style.objectFit = 'cover';
    imgEl.style.marginBottom = '15px';
    imgEl.style.display = 'block';
    photostripContainer.appendChild(imgEl);
  });

  const watermark = document.createElement('div');
  watermark.className = 'watermark';
  const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  watermark.innerHTML = `✨ SNAPGLOW ✨<br>${today}`;
  photostripContainer.appendChild(watermark);
}

// ==========================================================================
// 5. EVENT LISTENERS: PILIHAN LAYOUT SLOT FOTO
// ==========================================================================
document.querySelectorAll('.frame-card.option').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.frame-card.option').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    
    state.selectedSlots = parseInt(card.dataset.slots);
    initPhotostrip(); // Ubah kerangka kotak kosong secara real-time
  });
});

// ==========================================================================
// 6. EVENT LISTENERS: GANTI WARNA & TEMA BINGKAI SECARA INSTAN (FIXED!)
// ==========================================================================
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    
    state.frameBgColor = dot.dataset.color;
    
    // Penentuan tema motif berdasarkan warna yang diklik
    if (state.frameBgColor === '#ffe3ec') {
      state.activeTheme = 'y2k-lime';
    } else if (state.frameBgColor === '#111111') {
      state.activeTheme = 'retro-burgundy';
    } else if (state.frameBgColor === '#e0aaff') {
      state.activeTheme = 'soft-lilac';
    } else {
      state.activeTheme = 'plain-white';
    }
    
    // PERBAIKAN: Langsung ubah style container pratinjau tanpa merender ulang kotak kosong!
    if (photostripContainer) {
      photostripContainer.style.backgroundColor = state.frameBgColor;
      photostripContainer.setAttribute('data-active-theme', state.activeTheme);
    }
  });
});

// ==========================================================================
// 7. NAVIGASI AWAL & MANAJEMEN AKSES WEBCAM
// ==========================================================================
async function startCamera() {
  if (state.currentStream && state.currentStream !== "simulated") {
    state.currentStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: {
      facingMode: state.facingMode,
      width: { ideal: 1280 },
      height: { ideal: 960 },
      aspectRatio: 4/3
    },
    audio: false
  };

  try {
    state.isSimulation = false;
    state.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoFeed.srcObject = state.currentStream;
    videoFeed.play().catch(e => console.log("Gagal memutar video feed"));
  } catch (err) {
    console.warn("Kamera beralih ke mode simulasi:", err);
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
    
    initPhotostrip(); // Jalankan sekali saja di sini untuk menyiapkan wadah kotak
    await startCamera();
  });
}

document.getElementById('btnSwitchCam').addEventListener('click', async () => {
  if (state.isSimulation) return;
  state.facingMode = (state.facingMode === 'user') ? 'environment' : 'user';
  videoFeed.style.transform = (state.facingMode === 'user') ? 'scaleX(-1)' : 'none';
  await startCamera();
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    videoFeed.className = ''; 
    state.activeFilter = btn.dataset.filter;
    videoFeed.classList.add(state.activeFilter);
  });
});

// ==========================================================================
// 8. LOGIKA TIMEOUT HITUNG MUNDUR & ACTION SHUTTER JEPRET
// ==========================================================================
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
    const colors = [['#a370f7', '#3a86ff'], ['#ff0055', '#ffe3ec'], ['#00f2fe', '#4facfe']];
    const setChoice = colors[state.currentSlotIndex % colors.length];
    gradient.addColorStop(0, setChoice[0]);
    gradient.addColorStop(1, setChoice[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.save();
    
    // Terapkan Filter Instagram Baru ke Engine Export Canvas
    if (state.activeFilter === 'filter-paris') {
      ctx.filter = 'brightness(1.12) contrast(0.92) saturate(1.05)';
    } else if (state.activeFilter === 'filter-jakarta') {
      ctx.filter = 'sepia(0.25) saturate(1.3) brightness(1.02) hue-rotate(-5deg)';
    } else if (state.activeFilter === 'filter-losangeles') {
      ctx.filter = 'contrast(1.25) saturate(1.35) brightness(0.98)';
    } else if (state.activeFilter === 'filter-vintage-grain') {
      ctx.filter = 'contrast(1.15) saturate(0.85) brightness(0.95) sepia(0.1)';
    } else if (state.activeFilter === 'filter-cyber-glitch') {
      ctx.filter = 'hue-rotate(130deg) saturate(1.7) contrast(1.2)';
    } else if (state.activeFilter === 'filter-dreamy-cream') {
      ctx.filter = 'brightness(1.06) saturate(0.9) contrast(0.95)';
    }

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
      sh = videoH; sw = videoH * targetRatio;
      sx = (videoW - sw) / 2; sy = 0;
    } else {
      sw = videoW; sh = videoW / targetRatio;
      sx = 0; sy = (videoH - sh) / 2;
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
  renderMockupStrip(); // Gambar foto-foto asli di frame halaman download akhir
}

// ==========================================================================
// 9. ADJUSTMENT SLIDER KECERAHAN & KONTRAS
// ==========================================================================
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

// ==========================================================================
// 10. GENERATE & EXPORT CANVAS (HIGH-RESOLUTION DOWNLOAD)
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

  ctx.fillStyle = state.frameBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Rendring motif ornamen bingkai pada file hasil unduhan
  if (state.activeTheme === 'y2k-lime') {
    ctx.fillStyle = '#ffffff'; ctx.font = `bold ${22 * scale}px sans-serif`;
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 4 * scale;
    ctx.strokeText("⚝ COOL ⚝", canvas.width - (140 * scale), 45 * scale);
    ctx.fillText("⚝ COOL ⚝", canvas.width - (140 * scale), 45 * scale);
  } else if (state.activeTheme === 'retro-burgundy') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let x = 0; x < canvas.width; x += 25 * scale) {
      for (let y = 0; y < canvas.height; y += 25 * scale) {
        ctx.beginPath(); ctx.arc(x, y, 3 * scale, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (state.activeTheme === 'soft-lilac') {
    ctx.fillStyle = '#6b21a8'; ctx.font = `italic ${20 * scale}px sans-serif`;
    ctx.fillText("💖 cloud 💖", canvas.width - (130 * scale), canvas.height - 40 * scale);
  }

  let loadedCount = 0;
  images.forEach((img, index) => {
    const currentY = padding + (index * (targetImgH + gap));
    ctx.save();
    ctx.filter = `brightness(${rangeBright.value}%) contrast(${rangeContrast.value}%)`;
    ctx.drawImage(img, padding, currentY, targetImgW, targetImgH);
    ctx.restore();
    
    loadedCount++;
    if (loadedCount === images.length) {
      const warnaTerang = ['#ffffff', '#ffe3ec', '#d8f3dc', '#e0aaff'];
      ctx.fillStyle = warnaTerang.includes(state.frameBgColor) ? '#111