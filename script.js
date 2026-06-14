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
  activeTheme: 'plain-white', // Tambahkan ini untuk melacak tema aktif
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

// ==========================================================================
// 4. FUNGSI AKSES KAMERA
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
    videoFeed.play().catch(e => console.log("Video play interrupted"));
  } catch (err) {
    console.warn("Kamera asli tidak dapat diakses, beralih ke Mode Simulasi:", err);
    state.isSimulation = true;
    state.currentStream = "simulated";
    videoFeed.srcObject = null;
    videoFeed.poster = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800";
    videoFeed.style.objectFit = "cover";
  }
}

// ==========================================================================
// 5. ALUR NAVIGASI & EVENT LISTENERS
// ==========================================================================
// Ganti handler warna frame lama dengan pendeteksi tema bermotif baru
// HANDLER PILIHAN BINGKAI: OTOMATIS UBAH WARNA, MOTIF, DAN JUMLAH SLOT FOTO
document.querySelectorAll('.theme-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    // 1. Ganti class active pada tombol bingkai
    document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    
    // 2. Simpan warna dan tema aktif ke dalam state aplikasi
    state.frameBgColor = dot.dataset.color;
    state.activeTheme = dot.dataset.theme;
    
    // 3. LOGIKA OTOMATIS: Sesuaikan jumlah slot foto berdasarkan tema yang dipilih
    if (state.activeTheme === 'retro-burgundy') {
      state.selectedSlots = 6; // Tema Burgundy otomatis pakai 6 foto (seperti image_55c05a)
    } else if (state.activeTheme === 'soft-lilac') {
      state.selectedSlots = 2; // Tema Lilac otomatis pakai 2 foto agar estetik
    } else {
      state.selectedSlots = 4; // Default untuk White, Dark, dan Y2K Lime pakai 4 foto (seperti image_54e69e)
    }

    // 4. Update tampilan tombol grid/slot foto agar sinkron di UI sidebar
    document.querySelectorAll('.slot-btn').forEach(btn => {
      if (parseInt(btn.dataset.slots) === state.selectedSlots) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // 5. Reset ulang container foto dan jalankan ulang kamera agar layout barunya merender dengan benar
    resetCapture();
    if (photostripContainer) {
      photostripContainer.style.backgroundColor = state.frameBgColor;
      photostripContainer.setAttribute('data-active-theme', state.activeTheme);
    }
  });
});

// Tombol Mulai Sesi Foto
document.getElementById('btnStartCapture').addEventListener('click', async () => {
  stepSelection.classList.remove('active');
  stepBooth.classList.add('active');
  
  state.capturedImages = [];
  state.currentSlotIndex = 0;
  document.getElementById('totalSlotCount').textContent = state.selectedSlots;
  
  updateProgressBar();
  await startCamera();
});

// Switch Kamera Depan / Belakang
document.getElementById('btnSwitchCam').addEventListener('click', async () => {
  if (state.isSimulation) {
    alert("Anda sedang dalam mode simulasi (kamera asli diblokir/tidak support HTTPS).");
    return;
  }
  state.facingMode = (state.facingMode === 'user') ? 'environment' : 'user';
  videoFeed.style.transform = (state.facingMode === 'user') ? 'scaleX(-1)' : 'none';
  await startCamera();
});

// Ganti Filter Kamera
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    videoFeed.className = ''; 
    state.activeFilter = btn.dataset.filter;
    videoFeed.classList.add(state.activeFilter);
  });
});

// Ganti Warna Background Frame
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

function updateProgressBar() {
  const pct = (state.currentSlotIndex / state.selectedSlots) * 100;
  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('currentSlotIdx').textContent = state.currentSlotIndex;
}

// ==========================================================================
// 6. LOGIKA COUNTDOWN & SHUTTER JEPRET FOTO (FIXED)
// ==========================================================================
btnTriggerPhoto.addEventListener('click', () => {
  if (state.currentSlotIndex >= state.selectedSlots) return;
  btnTriggerPhoto.disabled = true;
  runSessionCountdown();
});

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
    const colors = [['#a370f7', '#3a86ff'], ['#ff0055', '#ffe3ec'], ['#00f2fe', '#4facfe'], ['#ff0844', '#ffb199']];
    const setChoice = colors[state.currentSlotIndex % colors.length];
    
    gradient.addColorStop(0, setChoice[0]);
    gradient.addColorStop(1, setChoice[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`✨ Hasil Foto Ke-${state.currentSlotIndex + 1} ✨`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("[ Mode Simulasi Aktif ]", canvas.width / 2, canvas.height / 2 + 20);
  } else {
    ctx.save();
    ctx.filter = getComputedStyle(videoFeed).filter;

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
      sh = videoH;
      sw = videoH * targetRatio;
      sx = (videoW - sw) / 2;
      sy = 0;
    } else {
      sw = videoW;
      sh = videoW / targetRatio;
      sx = 0;
      sy = (videoH - sh) / 2;
    }

    ctx.drawImage(videoFeed, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  state.capturedImages.push(canvas.toDataURL('image/jpeg', 0.9));
  state.currentSlotIndex++;
  updateProgressBar();

  flashOverlay.classList.add('active');
  setTimeout(() => flashOverlay.classList.remove('active'), 300);

  if (state.currentSlotIndex < state.selectedSlots) {
    setTimeout(() => { runSessionCountdown(); }, 1500);
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

  photostripContainer.style.backgroundColor = state.frameBgColor;
  renderMockupStrip();
}

function renderMockupStrip() {
  photostripContainer.innerHTML = '';
  state.capturedImages.forEach(imgSrc => {
    const imgEl = document.createElement('img');
    imgEl.src = imgSrc;
    imgEl.className = 'strip-img-item';
    photostripContainer.appendChild(imgEl);
  });

  const watermark = document.createElement('div');
  watermark.className = 'watermark';
  const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  watermark.innerHTML = `✨ SNAPGLOW ✨<br>${today}`;
  photostripContainer.appendChild(watermark);
}

// ==========================================================================
// 7. INTERAKSI STIKER
// ==========================================================================
document.querySelectorAll('.sticker-item').forEach(item => {
  item.addEventListener('click', () => {
    const sticker = document.createElement('div');
    sticker.className = 'draggable-sticker';
    
    if (item.dataset.type === 'emoji') {
      sticker.textContent = item.textContent;
    } else {
      const customTxt = prompt("Masukkan teks kustom Anda:");
      if (!customTxt) return;
      sticker.textContent = customTxt;
      sticker.style.fontSize = '12px';
      sticker.style.fontWeight = 'bold';
      sticker.style.color = '#fff';
      sticker.style.background = 'rgba(0,0,0,0.6)';
      sticker.style.padding = '3px 8px';
      sticker.style.borderRadius = '4px';
      sticker.style.whiteSpace = 'nowrap';
    }

    sticker.style.left = '30px';
    sticker.style.top = '60px';
    
    setupDragEvents(sticker);
    photostripContainer.appendChild(sticker);
  });
});

function setupDragEvents(el) {
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  el.addEventListener('pointerdown', (e) => {
    isDragging = true;
    el.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = el.offsetLeft;
    initialTop = el.offsetTop;
    e.stopPropagation();
  });

  el.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.left = `${initialLeft + dx}px`;
    el.style.top = `${initialTop + dy}px`;
  });

  el.addEventListener('pointerup', (e) => {
    isDragging = false;
    el.releasePointerCapture(e.pointerId);
  });
}

// ==========================================================================
// 8. GENERATE & DOWNLOAD PHOTOSTRIP
// ==========================================================================
const rangeBright = document.getElementById('rangeBright');
const rangeContrast = document.getElementById('rangeContrast');

[rangeBright, rangeContrast].forEach(slider => {
  slider.addEventListener('input', () => {
    document.querySelectorAll('.strip-img-item').forEach(img => {
      img.style.filter = `brightness(${rangeBright.value}%) contrast(${rangeContrast.value}%)`;
    });
  });
});

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

  // Background Frame Warna Terpilih
  ctx.fillStyle = state.frameBgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // --- INJEKSI MOTIF GRAFIS TEMA BIAR GAK FLAT PAS DI-DOWNLOAD ---
  if (state.activeTheme === 'y2k-lime') {
    // Gambar stiker teks atas
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${22 * scale}px sans-serif`;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4 * scale;
    ctx.strokeText("⚝ COOL ⚝", canvas.width - (140 * scale), 45 * scale);
    ctx.fillText("⚝ COOL ⚝", canvas.width - (140 * scale), 45 * scale);

    // Gambar stiker teks bawah HBD !!
    ctx.fillStyle = '#ffff00';
    ctx.font = `900 ${28 * scale}px sans-serif`;
    ctx.strokeText("HBD !!", 50 * scale, canvas.height - (bottomSpace + 10 * scale));
    ctx.fillText("HBD !!", 50 * scale, canvas.height - (bottomSpace + 10 * scale));
  } 
  else if (state.activeTheme === 'retro-burgundy') {
    // Buat pola titik-titik polka retro
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let x = 0; x < canvas.width; x += 25 * scale) {
      for (let y = 0; y < canvas.height; y += 25 * scale) {
        ctx.beginPath();
        ctx.arc(x, y, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  else if (state.activeTheme === 'soft-lilac') {
    // Tambah dekorasi tulisan imut di bagian bawah strip
    ctx.fillStyle = '#6b21a8';
    ctx.font = `italic ${20 * scale}px sans-serif`;
    ctx.fillText("💖 cloud 💖", canvas.width - (130 * scale), canvas.height - (bottomSpace + 15 * scale));
  }

  let currentY = padding;

  images.forEach(img => {
    ctx.save();
    ctx.filter = `brightness(${rangeBright.value}%) contrast(${rangeContrast.value}%)`;
    ctx.drawImage(img, padding, currentY, targetImgW, targetImgH);
    ctx.restore();
    currentY += targetImgH + gap;
  });

  const containerRect = photostripContainer.getBoundingClientRect();
  const stickers = document.querySelectorAll('.draggable-sticker');
  
  stickers.forEach(stk => {
    const stkRect = stk.getBoundingClientRect();
    const relX = (stkRect.left - containerRect.left) / containerRect.width;
    const relY = (stkRect.top - containerRect.top) / containerRect.height;

    ctx.save();
    if (stk.textContent.length > 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(relX * canvas.width, relY * canvas.height - (30 * scale), stk.textContent.length * 20 * scale, 46 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${32 * scale}px sans-serif`;
      ctx.fillText(stk.textContent, relX * canvas.width + 10, relY * canvas.height + 5);
    } else {
      ctx.font = `${50 * scale}px serif`;
      ctx.fillText(stk.textContent, relX * canvas.width, relY * canvas.height + (40 * scale));
    }
    ctx.restore();
  });

  ctx.fillStyle = (state.frameBgColor === '#ffffff' || state.frameBgColor === '#ffe3ec' || state.frameBgColor === '#d8f3dc') ? '#111111' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = `bold ${24 * scale}px sans-serif`;
  ctx.fillText("✨ SNAPGLOW AESTHETIC ✨", canvas.width / 2, canvas.height - (60 * scale));
  
  const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  ctx.font = `${18 * scale}px sans-serif`;
  ctx.fillText(today, canvas.width / 2, canvas.height - (25 * scale));

  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const fileExt = format === 'png' ? 'png' : 'jpg';
  
  const dataUrl = canvas.toDataURL(mimeType, 1.0);
  const link = document.createElement('a');
  link.download = `snapglow-${Date.now()}.${fileExt}`;
  link.href = dataUrl;
  link.click();
}

document.getElementById('btnDownloadJpg').addEventListener('click', () => generateFinalCanvas('jpg'));
document.getElementById('btnDownloadPng').addEventListener('click', () => generateFinalCanvas('png'));

document.getElementById('btnResetAll').addEventListener('click', () => {
  stepResult.classList.remove('active');
  stepSelection.classList.add('active');
  state.capturedImages = [];
  state.currentSlotIndex = 0;
});