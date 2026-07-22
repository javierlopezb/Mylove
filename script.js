/* ==========================================================================
   PARA TI ♡ - SCRIPT.JS
   Lógica interactiva del reproductor de música y carta personalizada
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- ELEMENT REFERENCES ---
  const audioPlayer = document.getElementById('audioPlayer');
  const playBtn = document.getElementById('playBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const progressRange = document.getElementById('progressRange');
  const progressFill = document.getElementById('progressFill');
  const progressThumb = document.getElementById('progressThumb');
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');
  const heartBtn = document.getElementById('heartBtn');
  const openLetterBtn = document.getElementById('openLetterBtn');
  const closeLetterBtn = document.getElementById('closeLetterBtn');
  const saveLetterBtn = document.getElementById('saveLetterBtn');
  const letterModal = document.getElementById('letterModal');
  const letterContent = document.getElementById('letterContent');

  // SVG Icons for Play & Pause States
  const pauseSVG = `
    <svg class="play-icon" id="playIcon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1"></rect>
      <rect x="14" y="4" width="4" height="16" rx="1"></rect>
    </svg>
  `;

  const playSVG = `
    <svg class="play-icon" id="playIcon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="7 4 19 12 7 20 7 4"></polygon>
    </svg>
  `;

  // Default initial duration matching reference screenshot (0:45 / 3:35)
  let fallbackDuration = 215; // 3:35 in seconds
  let isPlaying = false;
  let synthInterval = null;
  let simulatedCurrentTime = 45; // Start at 0:45 like in reference image

  // Load saved letter from localStorage if available
  const savedLetter = localStorage.getItem('para_ti_letter_content');
  if (savedLetter && letterContent) {
    letterContent.innerHTML = savedLetter;
  }

  // --- HELPER: FORMAT SECONDS TO MM:SS ---
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // --- UPDATE PROGRESS UI ---
  function updateProgressUI(current, total) {
    if (!total || total <= 0) total = fallbackDuration;
    const percentage = Math.min(100, Math.max(0, (current / total) * 100));

    progressRange.value = percentage;
    progressFill.style.width = `${percentage}%`;
    progressThumb.style.left = `${percentage}%`;

    currentTimeEl.textContent = formatTime(current);
    totalTimeEl.textContent = formatTime(total);
  }

  // Initial set to match 0:45 / 3:35 from reference
  updateProgressUI(simulatedCurrentTime, fallbackDuration);

  // --- AUDIO LOGIC & FALLBACK SYNTH ---
  // Optional Web Audio API gentle synth melody fallback if audio file isn't loaded
  let audioCtx = null;

  function playGentleSynthTone() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      // Simple warm chord tone (C major 7th ambient pad)
      const frequencies = [261.63, 329.63, 392.00, 493.88]; 
      frequencies.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.03, audioCtx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.5);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 2.6);
      });
    } catch (e) {
      // AudioContext fallback ignored if blocked
    }
  }

  function togglePlay() {
    isPlaying = !isPlaying;

    if (isPlaying) {
      playBtn.classList.remove('paused');
      playBtn.innerHTML = pauseSVG;

      // Try playing HTML5 Audio element
      const playPromise = audioPlayer.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Audio file played successfully
        }).catch(() => {
          // Fallback to simulated audio timer + synth melody if audio file missing/empty
          playGentleSynthTone();
          startSimulatedPlayback();
        });
      }
    } else {
      playBtn.classList.add('paused');
      playBtn.innerHTML = playSVG;
      audioPlayer.pause();
      stopSimulatedPlayback();
    }
  }

  function startSimulatedPlayback() {
    stopSimulatedPlayback();
    synthInterval = setInterval(() => {
      simulatedCurrentTime += 1;
      if (simulatedCurrentTime >= fallbackDuration) {
        simulatedCurrentTime = 0;
      }
      updateProgressUI(simulatedCurrentTime, fallbackDuration);
    }, 1000);
  }

  function stopSimulatedPlayback() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
  }

  // --- AUDIO EVENT LISTENERS ---
  audioPlayer.addEventListener('loadedmetadata', () => {
    if (audioPlayer.duration && !isNaN(audioPlayer.duration) && audioPlayer.duration > 0) {
      fallbackDuration = audioPlayer.duration;
      updateProgressUI(audioPlayer.currentTime, fallbackDuration);
    }
  });

  audioPlayer.addEventListener('timeupdate', () => {
    if (isPlaying && audioPlayer.duration) {
      updateProgressUI(audioPlayer.currentTime, audioPlayer.duration);
    }
  });

  audioPlayer.addEventListener('ended', () => {
    isPlaying = false;
    playBtn.classList.add('paused');
    playBtn.innerHTML = playSVG;
    updateProgressUI(0, fallbackDuration);
  });

  // --- EVENT LISTENERS FOR BUTTONS ---

  // Play / Pause Button
  playBtn.addEventListener('click', togglePlay);

  // Range Slider Dragging / Seeking
  progressRange.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const total = audioPlayer.duration || fallbackDuration;
    const seekTime = (val / 100) * total;

    simulatedCurrentTime = seekTime;
    if (audioPlayer.duration) {
      audioPlayer.currentTime = seekTime;
    }

    updateProgressUI(seekTime, total);
  });

  // Prev / Next Track Buttons
  prevBtn.addEventListener('click', () => {
    simulatedCurrentTime = 0;
    if (audioPlayer.duration) {
      audioPlayer.currentTime = 0;
    }
    updateProgressUI(0, audioPlayer.duration || fallbackDuration);
  });

  nextBtn.addEventListener('click', () => {
    // Restart or advance
    simulatedCurrentTime = 0;
    if (audioPlayer.duration) {
      audioPlayer.currentTime = 0;
    }
    updateProgressUI(0, audioPlayer.duration || fallbackDuration);
  });

  // Heart Button Micro-interaction
  heartBtn.addEventListener('click', () => {
    heartBtn.classList.toggle('active');
  });

  // --- "MI CARTA" MODAL LOGIC ---
  function openModal() {
    letterModal.classList.add('open');
    letterModal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    letterModal.classList.remove('open');
    letterModal.setAttribute('aria-hidden', 'true');
  }

  openLetterBtn.addEventListener('click', openModal);
  closeLetterBtn.addEventListener('click', closeModal);
  
  saveLetterBtn.addEventListener('click', () => {
    if (letterContent) {
      localStorage.setItem('para_ti_letter_content', letterContent.innerHTML);
    }
    closeModal();
  });

  // Close modal when clicking dark overlay
  letterModal.addEventListener('click', (e) => {
    if (e.target === letterModal) {
      closeModal();
    }
  });

  // Keyboard shortcut: Escape key closes modal, Space toggles play
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && letterModal.classList.contains('open')) {
      closeModal();
    } else if (e.code === 'Space' && document.activeElement !== letterContent && !letterModal.classList.contains('open')) {
      e.preventDefault();
      togglePlay();
    }
  });
});
