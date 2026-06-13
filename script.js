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
  facingMode: 'user',
  isSimulation: false // Penanda jika kamera asli gagal/diblokir
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
// 4. FUNGSI AKSES KAMERA (DENGAN FALLBACK SIMULASI)
// ==========================================================================
async function startCamera() {
  // Matikan stream kamera sebelumnya jika ada
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
    // Jalankan video
    videoFeed.play().catch(e => console.log("Video play interrupted"));
  } catch (err) {
    console.warn("Kamera asli tidak dapat diakses, beralih ke Mode Simulasi:", err);
    
    // Aktifkan Mode Simulasi agar aplikasi tidak macet/freeze
    state.isSimulation = true;
    state.currentStream = "simulated";
    
    // Pasang gambar placeholder estetik pada elemen video
    videoFeed.srcObject = null;
    videoFeed.poster = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800";
    videoFeed.style.objectFit = "cover";
  }
}

// ==========================================================================
// 5. ALUR NAVIGASI & EVENT LISTENERS
// ==========================================================================

// Piliha Layout Frame
document.querySelectorAll('.frame-card.option').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.frame-card.option').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    state.selectedSlots = parseInt(card.dataset.slots);
  });
});

// Tombol Mulai Sesi Foto (Pindah Halaman Lebih Dulu, Baru Ambil Kamera)
document.getElementById('btnStartCapture').addEventListener('click', async () => {
  // Pindahkan halaman duluan agar UI tidak terasa delay/macet
  stepSelection.classList.remove('active');
  stepBooth.classList.add('active');
  
  // Reset Data Sesi
  state.capturedImages = [];
  state.currentSlotIndex = 0;
  document.getElementById('totalSlotCount').textContent = state.selectedSlots;
  
  updateProgressBar();
  
  // Panggil kamera setelah UI berpindah
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
// 6. LOGIKA COUNTDOWN & SHUTTER JEPRET FOTO
// ==========================================================================
btnTriggerPhoto.addEventListener('click', () => {
  if (state.currentSlotIndex >= state.selectedSlots) return;
  
  // Disable tombol sementara biar user tidak klik berulang-ulang saat countdown
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
    // RENDER GRADASI ESTETIK JIKA MASUK MODE SIMULASI
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
    // RENDER DARI KAMERA ASLI
    if (state.facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.filter = getComputedStyle(videoFeed).filter;
    ctx.drawImage(videoFeed, 0, 0, canvas.width, canvas.height);
  }

  state.capturedImages.push(canvas.toDataURL('image/jpeg', 0.9));
  state.currentSlotIndex++;
  updateProgressBar();

  // Efek Flash Layar
  flashOverlay.classList.add('active');
  setTimeout(() => flashOverlay.classList.remove('active'), 300);

  // Cek sisa slot foto
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
// 7. INTERAKSI STIKER (DRAG & DROP UNTUK PC & MOBILE)
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
// 8. GENERATE & DOWNLOAD PHOTOSTRIP KUALITAS TINGGI (CANVAS API)
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

  let currentY = padding;

  // Gambar semua foto ke canvas utama dengan filter slider aktif
  images.forEach(img => {
    ctx.save();
    ctx.filter = `brightness(${rangeBright.value}%) contrast(${rangeContrast.value}%)`;
    
    // Gunakan elemen gambar mockup yang sudah ada
    ctx.drawImage(img, padding, currentY, targetImgW, targetImgH);
    ctx.restore();
    currentY += targetImgH + gap;
  });

  // Gambar semua stiker dekorasi sesuai posisi koordinat relatifnya
  const containerRect = photostripContainer.getBoundingClientRect();
  const stickers = document.querySelectorAll('.draggable-sticker');
  
  stickers.forEach(stk => {
    const stkRect = stk.getBoundingClientRect();
    const relX = (stkRect.left - containerRect.left) / containerRect.width;
    const relY = (stkRect.top - containerRect.top) / containerRect.height;

    ctx.save();
    if (stk.textContent.length > 2) {
      // Style Teks Kustom
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(relX * canvas.width, relY * canvas.height - (30 * scale), stk.textContent.length * 20 * scale, 46 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${32 * scale}px sans-serif`;
      ctx.fillText(stk.textContent, relX * canvas.width + 10, relY * canvas.height + 5);
    } else {
      // Style Emoji
      ctx.font = `${50 * scale}px serif`;
      ctx.fillText(stk.textContent, relX * canvas.width, relY * canvas.height + (40 * scale));
    }
    ctx.restore();
  });

  // Teks Cetak Watermark Akhir
  ctx.fillStyle = (state.frameBgColor === '#ffffff' || state.frameBgColor === '#ffe3ec' || state.frameBgColor === '#d8f3dc') ? '#111111' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = `bold ${24 * scale}px sans-serif`;
  ctx.fillText("✨ SNAPGLOW AESTHETIC ✨", canvas.width / 2, canvas.height - (60 * scale));
  
  const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  ctx.font = `${18 * scale}px sans-serif`;
  ctx.fillText(today, canvas.width / 2, canvas.height - (25 * scale));

  // Trigger Aksi Download File Ke Perangkat
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