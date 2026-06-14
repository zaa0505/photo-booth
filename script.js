/**
 * SnapGlow - Photobooth Core Script
 * Version: 2.1 (Updated with Aesthetic Themes & Dynamic Slots)
 */

// 1. DOM Elements
const video = document.getElementById('webcam');
const startBtn = document.getElementById('start-btn');
const captureBtn = document.getElementById('capture-btn');
const downloadBtn = document.getElementById('download-btn');
const filterButtons = document.querySelectorAll('.filter-btn');
const themeButtons = document.querySelectorAll('.theme-dot');
const slotButtons = document.querySelectorAll('.slot-btn');
const photostripContainer = document.getElementById('photostrip');
const flashOverlay = document.getElementById('flash');
const shutterSound = document.getElementById('shutter-sound');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');

// 2. Application State
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

// 3. Initialize Photostrip Grid Layout
function initPhotostrip() {
  if (!photostripContainer) return;
  
  photostripContainer.innerHTML = '';
  photostripContainer.className = 'photostrip-canvas-mockup';
  photostripContainer.setAttribute('data-active-theme', state.activeTheme);
  photostripContainer.style.backgroundColor = state.frameBgColor;
  
  // Create photo slot elements dynamically
  for (let i = 0; i < state.selectedSlots; i++) {
    const slot = document.createElement('div');
    slot.className = `photo-slot slot-${state.selectedSlots} empty`;
    slot.dataset.index = i;
    
    const inner = document.createElement('div');
    inner.className = 'slot-inner';
    
    // Placeholder text/icon
    const placeholder = document.createElement('span');
    placeholder.innerText = i + 1;
    inner.appendChild(placeholder);
    
    slot.appendChild(inner);
    photostripContainer.appendChild(slot);
  }
  
  // Re-append branding watermark text at the bottom
  const branding = document.createElement('div');
  branding.className = 'photostrip-branding';
  branding.innerHTML = `<h4>SNAPGLOW</h4><p>${new Date().getFullYear()} • Memories</p>`;
  photostripContainer.appendChild(branding);
}

// 4. Update Grid Images with Captured Content
function updateGridImages() {
  const slots = document.querySelectorAll('.photo-slot');
  slots.forEach((slot, index) => {
    const inner = slot.querySelector('.slot-inner');
    if (!inner) return;
    
    if (state.capturedImages[index]) {
      slot.classList.remove('empty');
      inner.innerHTML = `<img src="${state.capturedImages[index].img}" class="${state.capturedImages[index].filter}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
      slot.classList.add('empty');
      inner.innerHTML = `<span>${index + 1}</span>`;
      if (index === state.currentSlotIndex && state.currentStream) {
        slot.classList.add('highlight-active');
      } else {
        slot.classList.remove('highlight-active');
      }
    }
  });
}

// 5. Layout Slot Selection Event Listeners
slotButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.capturedImages.length > 0) {
      if (!confirm("Mengubah layout akan menghapus foto yang sudah diambil. Lanjutkan?")) return;
    }
    
    slotButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    state.selectedSlots = parseInt(btn.dataset.slots);
    state.capturedImages = [];
    state.currentSlotIndex = 0;
    
    initPhotostrip();
  });
});

// 6. Aesthetic Theme Selection & Auto-Layout Adjustment
themeButtons.forEach(dot => {
  dot.addEventListener('click', () => {
    if (state.capturedImages.length > 0) {
      if (!confirm("Mengubah tema akan mereset sesi foto berjalan. Lanjutkan?")) return;
    }

    themeButtons.forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    
    state.frameBgColor = dot.dataset.color;
    state.activeTheme = dot.dataset.theme;
    
    // --- Logika otomatis menyesuaikan jumlah slot foto agar tidak flat ---
    if (state.activeTheme === 'retro-burgundy') {
      state.selectedSlots = 6; 
    } else if (state.activeTheme === 'soft-lilac') {
      state.selectedSlots = 2; 
    } else if (state.activeTheme === 'y2k-lime') {
      state.selectedSlots = 4; 
    }
    
    // Sinkronkan status tombol angka layout di UI
    slotButtons.forEach(btn => {
      if (parseInt(btn.dataset.slots) === state.selectedSlots) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Reset status pengambilan foto
    state.capturedImages = [];
    state.currentSlotIndex = 0;
    
    // Gambar ulang kerangka grid
    initPhotostrip();
  });
});

// 7. Real-Time Camera Filter Controller
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    state.activeFilter = btn.dataset.filter;
    
    // Apply filter classes to preview screen
    if (video) {
      video.className = ''; 
      video.classList.add(state.activeFilter);
    }
  });
});

// 8. Webcam Core Controls
if (startBtn) {
  startBtn.addEventListener('click', async () => {
    try {
      if (state.currentStream) {
        // Toggle Off Camera
        state.currentStream.getTracks().forEach(track => track.stop());
        state.currentStream = null;
        video.srcObject = null;
        startBtn.innerHTML = '🎥 Start Camera';
        startBtn.className = 'action-btn start-camera';
        if (captureBtn) captureBtn.disabled = true;
        return;
      }
      
      const constraints = {
        video: { 
          facingMode: state.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      state.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = state.currentStream;
      
      startBtn.innerHTML = '🛑 Stop Camera';
      startBtn.className = 'action-btn stop-camera';
      if (captureBtn) captureBtn.disabled = false;
      
      state.capturedImages = [];
      state.currentSlotIndex = 0;
      initPhotostrip();
      
    } catch (err) {
      console.error("Error accessing webcam: ", err);
      alert("Tidak dapat mengakses kamera. Mengaktifkan mode simulasi otomatis.");
      state.isSimulation = true;
      if (captureBtn) captureBtn.disabled = false;
    }
  });
}

// 9. Photo Capture Sequence & Trigger
if (captureBtn) {
  captureBtn.addEventListener('click', () => {
    if (state.currentSlotIndex >= state.selectedSlots) {
      alert("Semua slot sudah terisi! Silakan unduh atau reset kamera.");
      return;
    }
    
    captureBtn.disabled = true;
    if (countdownOverlay) countdownOverlay.classList.remove('hidden');
    
    let count = 3;
    if (countdownNumber) countdownNumber.innerText = count;
    
    const counter = setInterval(() => {
      count--;
      if (count > 0) {
        if (countdownNumber) countdownNumber.innerText = count;
      } else {
        clearInterval(counter);
        if (countdownOverlay) countdownOverlay.classList.add('hidden');
        executeShutterAction();
      }
    }, 1000);
  });
}

function executeShutterAction() {
  // Trigger Audio & Visual Flash
  if (shutterSound) {
    shutterSound.currentTime = 0;
    shutterSound.play().catch(e => console.log("Sound play error:", e));
  }
  
  if (flashOverlay) {
    flashOverlay.style.opacity = '1';
    setTimeout(() => { flashOverlay.style.opacity = '0'; }, 150);
  }
  
  let imageDataURL = '';
  
  if (state.isSimulation) {
    // Canvas simulation placeholder if hardware camera fails
    const simCanvas = document.createElement('canvas');
    simCanvas.width = 640; simCanvas.height = 480;
    const sCtx = simCanvas.getContext('2d');
    sCtx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
    sCtx.fillRect(0, 0, simCanvas.width, simCanvas.height);
    sCtx.fillStyle = '#ffffff'; sCtx.font = '30px Arial';
    sCtx.fillText(`Photo ${state.currentSlotIndex + 1}`, 240, 240);
    imageDataURL = simCanvas.toDataURL('image/png');
  } else {
    // Snapshot drawing logic from real track video element
    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.width = video.videoWidth || 640;
    hiddenCanvas.height = video.videoHeight || 480;
    const hCtx = hiddenCanvas.getContext('2d');
    
    // Handle mirror inversion if user front facing mode
    if (state.facingMode === 'user') {
      hCtx.translate(hiddenCanvas.width, 0);
      hCtx.scale(-1, 1);
    }
    hCtx.drawImage(video, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
    imageDataURL = hiddenCanvas.toDataURL('image/png');
  }
  
  // Store picture state bundle
  state.capturedImages.push({
    img: imageDataURL,
    filter: state.activeFilter
  });
  
  state.currentSlotIndex++;
  updateGridImages();
  
  // Re-enable click actions
  if (state.currentSlotIndex < state.selectedSlots) {
    if (captureBtn) captureBtn.disabled = false;
  } else {
    if (captureBtn) captureBtn.disabled = true;
    if (downloadBtn) downloadBtn.removeAttribute('disabled');
    alert("Hore! Sesi photobooth selesai. Klik tombol download untuk menyimpan hasil!");
  }
}

// 10. High-Quality Export Compilation (Canvas Generator)
function generateFinalCanvas(format = 'vertical') {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Scale modifier multiplier for crystal-clear output resolution
    const scale = 2;
    
    const slotWidth = 320 * scale;
    const slotHeight = 240 * scale;
    const padding = 16 * scale;
    const topSpace = 20 * scale;
    const bottomSpace = 80 * scale;
    
    canvas.width = slotWidth + (padding * 2);
    canvas.height = topSpace + bottomSpace + (state.selectedSlots * slotHeight) + ((state.selectedSlots - 1) * padding);
    
    // Draw Base Theme Background Color
    ctx.fillStyle = state.frameBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // --- INJEKSI MOTIF GRAFIS TEMA BIAR GAK FLAT PAS DI-DOWNLOAD ---
    if (state.activeTheme === 'y2k-lime') {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${22 * scale}px sans-serif`;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4 * scale;
      ctx.strokeText("⚝ COOL ⚝", canvas.width - (140 * scale), 45 * scale);
      ctx.fillText("⚝ COOL ⚝", canvas.width - (140 * scale), 45 * scale);

      ctx.fillStyle = '#ffff00';
      ctx.font = `900 ${28 * scale}px sans-serif`;
      ctx.strokeText("HBD !!", 50 * scale, canvas.height - (bottomSpace + 10 * scale));
      ctx.fillText("HBD !!", 50 * scale, canvas.height - (bottomSpace + 10 * scale));
    } 
    else if (state.activeTheme === 'retro-burgundy') {
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
      ctx.fillStyle = '#6b21a8';
      ctx.font = `italic ${20 * scale}px sans-serif`;
      ctx.fillText("💖 cloud 💖", canvas.width - (130 * scale), canvas.height - (bottomSpace + 15 * scale));
    }
    
    // Draw each picture entry into canvas sequence block
    let loadedImagesCount = 0;
    
    state.capturedImages.forEach((imgObj, i) => {
      const img = new Image();
      img.src = imgObj.img;
      img.onload = () => {
        const x = padding;
        const y = topSpace + (i * (slotHeight + padding));
        
        ctx.save();
        
        // Match CSS filters configuration in Canvas 2D Core
        if (imgObj.filter === 'filter-vintage') {
          ctx.filter = 'sepia(0.3) contrast(1.1) brightness(0.95) saturate(1.1)';
        } else if (imgObj.filter === 'filter-bw') {
          ctx.filter = 'grayscale(1) contrast(1.3) brightness(0.95)';
        } else if (imgObj.filter === 'filter-retro') {
          ctx.filter = 'contrast(1.1) saturate(1.4) hue-rotate(-10deg) brightness(1.02)';
        } else if (imgObj.filter === 'filter-cyber') {
          ctx.filter = 'hue-rotate(140deg) saturate(1.8) contrast(1.2)';
        } else if (imgObj.filter === 'filter-soft') {
          ctx.filter = 'brightness(1.08) saturate(0.9) contrast(0.95) blur(0.3px)';
        }
        
        ctx.drawImage(img, x, y, slotWidth, slotHeight);
        ctx.restore();
        
        loadedImagesCount++;
        if (loadedImagesCount === state.capturedImages.length) {
          // Render global branding text element
          const warnaTerang = ['#ffffff', '#ffe3ec', '#d8f3dc', '#e0f2fe', '#fef3c7', '#f3e8ff'];
          ctx.fillStyle = warnaTerang.includes(state.frameBgColor) ? '#111111' : '#ffffff';
          
          ctx.textAlign = 'center';
          ctx.font = `bold ${20 * scale}px sans-serif`;
          ctx.fillText("SNAPGLOW", canvas.width / 2, canvas.height - (35 * scale));
          
          ctx.font = `${11 * scale}px sans-serif`;
          ctx.fillText(`${new Date().getFullYear()} • Memories`, canvas.width / 2, canvas.height - (18 * scale));
          
          resolve(canvas.toDataURL('image/png'));
        }
      };
    });
  });
}

// 11. Download Handler Trigger Action
if (downloadBtn) {
  downloadBtn.addEventListener('click', async () => {
    if (state.capturedImages.length < state.selectedSlots) {
      alert("Ambil semua foto terlebih dahulu sebelum mengunduh!");
      return;
    }
    
    downloadBtn.innerText = '⏳ Processing...';
    downloadBtn.disabled = true;
    
    const dataURL = await generateFinalCanvas('vertical');
    
    const link = document.createElement('a');
    link.download = `snapglow-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    
    downloadBtn.innerText = '📥 Download Photostrip';
    downloadBtn.disabled = false;
  });
}

// 12. App Initialization Core Boot
window.addEventListener('DOMContentLoaded', () => {
  initPhotostrip();
});