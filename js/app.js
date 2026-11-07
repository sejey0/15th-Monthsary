// =====================================================
// 1. SECURE VAULT LOCK SCREEN (6-DIGIT PASSCODE)
// =====================================================
const _K = [90, 165, 60, 195, 126, 231];
const _V = [106, 146, 13, 246, 76, 210];
let currentPin = "";
let isVerifying = false;

const vaultOverlay = document.getElementById("vault-overlay");
const mainExperience = document.getElementById("main-experience");
const pinDots = document.querySelectorAll(".pin-dot");
const vaultStatus = document.getElementById("vault-status");
const pinDisplay = document.getElementById("pin-display");
const bgAudio = document.getElementById("bg-audio");

// =====================================================
// 2. 3-TILE LOGIN BACKGROUND SLIDESHOW (assets/images/*)
// =====================================================
const loginSlides = [
  "assets/images/1st Image Together/1000019984.jpg",
  "assets/images/Edits/us.png",
  "assets/images/Edits/1.png",
  "assets/images/Edits/2.png",
  "assets/images/Bataan/2025/IMG_20251015_164306_427 (1) (1).jpg",
  "assets/images/Bataan/2025/IMG_20251015_165640_604 (1) (1).jpg",
  "assets/images/Bataan/2026/pm_1768128388305_cmp.jpg",
  "assets/images/Bataan/2026/pm_1768128397417_cmp.jpg",
  "assets/images/Manaoag/2025/pm_1768128416038_cmp.jpg",
  "assets/images/Manaoag/2025/pm_1768128422150_cmp.jpg",
  "assets/images/Tarlac/2025/IMG_20250811_171107_439.jpg",
  "assets/images/Tarlac/2026/images/IMG_20260405_133631_155.jpg",
  "assets/images/Tarlac/2026/images/July 2026/IMG20260704112812.jpg",
  "assets/images/Tarlac/2026/images/July 2026/IMG20260704201645.jpg",
  "assets/images/Video Call/IMG_20260615_201136.jpg",
  "assets/images/Watch Together/22218c9a-a844-4294-89c5-6bbe7e80f12e.jpg"
];

const tiles = [
  {
    a: document.getElementById("tile-0-a"),
    b: document.getElementById("tile-0-b"),
    showingA: true
  },
  {
    a: document.getElementById("tile-1-a"),
    b: document.getElementById("tile-1-b"),
    showingA: true
  },
  {
    a: document.getElementById("tile-2-a"),
    b: document.getElementById("tile-2-b"),
    showingA: true
  }
];

let slideCursor = 0;

function nextSlideUrl() {
  const url = encodeURI(loginSlides[slideCursor % loginSlides.length]);
  slideCursor++;
  return url;
}

if (tiles[0].a && loginSlides.length >= 3) {
  tiles.forEach((tile) => {
    tile.a.src = nextSlideUrl();
  });

  let activeTileToSwap = 0;
  setInterval(() => {
    const tile = tiles[activeTileToSwap];
    const nextSrc = nextSlideUrl();

    if (tile.showingA) {
      tile.b.src = nextSrc;
      tile.b.onload = () => {
        tile.b.classList.add("active");
        tile.a.classList.remove("active");
        tile.showingA = false;
      };
    } else {
      tile.a.src = nextSrc;
      tile.a.onload = () => {
        tile.a.classList.add("active");
        tile.b.classList.remove("active");
        tile.showingA = true;
      };
    }

    activeTileToSwap = (activeTileToSwap + 1) % tiles.length;
  }, 2200);
}

// =====================================================
// 3. PASSCODE VERIFICATION & LOCK/UNLOCK
// =====================================================
function verifyLocal(pin) {
  if (pin.length !== _V.length) return false;
  let diff = 0;
  for (let i = 0; i < _V.length; i++) {
    diff |= (pin.charCodeAt(i) ^ _K[i]) ^ _V[i];
  }
  return diff === 0;
}

async function verifyPasscode(pin) {
  try {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin })
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.valid);
    }
  } catch (_) {}
  return verifyLocal(pin);
}

function updatePinUI() {
  pinDots.forEach((dot, idx) => {
    if (idx < currentPin.length) {
      dot.className =
        "pin-dot w-3 h-3 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-emerald-400 border-transparent scale-110 transition-all duration-200";
    } else {
      dot.className =
        "pin-dot w-3 h-3 rounded-full border border-zinc-400 transition-all duration-200";
    }
  });
}

function unlockVault() {
  vaultStatus.textContent = "UNLOCKED";
  vaultStatus.className =
    "text-center font-mono text-[11px] tracking-widest h-4 mb-4 text-emerald-400 relative z-10";
  setTimeout(() => {
    vaultOverlay.classList.add("vault-unlocked");
    mainExperience.classList.add("active");
    if (bgAudio) {
      bgAudio.loop = true;
      bgAudio
        .play()
        .then(syncAudioUI)
        .catch(() => {});
    }
  }, 250);
}

async function handlePinInput(digit) {
  if (currentPin.length >= 6 || isVerifying) return;
  currentPin += digit;
  updatePinUI();

  if (currentPin.length === 6) {
    isVerifying = true;
    const ok = await verifyPasscode(currentPin);
    isVerifying = false;

    if (ok) {
      unlockVault();
    } else {
      vaultStatus.textContent = "INVALID PASSCODE";
      vaultStatus.className =
        "text-center font-mono text-[11px] tracking-widest h-4 mb-4 text-pink-400 relative z-10";
      pinDisplay.classList.add("animate-shake");
      setTimeout(() => {
        pinDisplay.classList.remove("animate-shake");
        currentPin = "";
        vaultStatus.textContent = "ENTER PASSCODE";
        vaultStatus.className =
          "text-center font-mono text-[11px] tracking-widest h-4 mb-4 text-zinc-400 relative z-10";
        updatePinUI();
      }, 450);
    }
  }
}

document.querySelectorAll("[data-key]").forEach((btn) => {
  btn.addEventListener("click", () => handlePinInput(btn.dataset.key));
});

const bypassEnterBtn = document.getElementById("bypass-enter-btn");
if (bypassEnterBtn) {
  bypassEnterBtn.addEventListener("click", unlockVault);
}

document.getElementById("pin-clear").addEventListener("click", () => {
  currentPin = "";
  vaultStatus.textContent = "ENTER PASSCODE";
  vaultStatus.className =
    "text-center font-mono text-[11px] tracking-widest h-4 mb-4 text-zinc-400 relative z-10";
  updatePinUI();
});

document.getElementById("pin-back").addEventListener("click", () => {
  currentPin = currentPin.slice(0, -1);
  updatePinUI();
});

document.getElementById("relock-btn").addEventListener("click", () => {
  currentPin = "";
  updatePinUI();
  if (bgAudio && !bgAudio.paused) {
    bgAudio.pause();
    syncAudioUI();
  }
  vaultStatus.textContent = "ENTER PASSCODE";
  vaultStatus.className =
    "text-center font-mono text-[11px] tracking-widest h-4 mb-4 text-zinc-400 relative z-10";
  vaultOverlay.classList.remove("vault-unlocked");
  mainExperience.classList.remove("active");
});

window.addEventListener("keydown", (e) => {
  if (vaultOverlay.classList.contains("vault-unlocked")) return;
  if (e.key === "Enter") {
    unlockVault();
    return;
  }
  if (e.key >= "0" && e.key <= "9") handlePinInput(e.key);
  if (e.key === "Backspace") {
    currentPin = currentPin.slice(0, -1);
    updatePinUI();
  }
});

// =====================================================
// 4. MUSIC PLAYER CONTROLLER (Play/Pause, Rewind, FF, Volume)
// =====================================================
const playerPlayBtn = document.getElementById("player-play-btn");
const playerRwBtn = document.getElementById("player-rw-btn");
const playerFfBtn = document.getElementById("player-ff-btn");
const iconPlay = document.getElementById("icon-play");
const iconPause = document.getElementById("icon-pause");
const eqBars = document.getElementById("eq-bars");
const playerSeek = document.getElementById("player-seek");
const playerCurrent = document.getElementById("player-current");
const playerDuration = document.getElementById("player-duration");
const playerMuteBtn = document.getElementById("player-mute-btn");
const playerVolume = document.getElementById("player-volume");
const iconVolOn = document.getElementById("icon-vol-on");
const iconVolOff = document.getElementById("icon-vol-off");

if (bgAudio && playerVolume) {
  bgAudio.volume = Number(playerVolume.value);
}

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function syncAudioUI() {
  if (!bgAudio) return;
  const isPlaying = !bgAudio.paused;
  if (iconPlay && iconPause) {
    iconPlay.classList.toggle("hidden", isPlaying);
    iconPause.classList.toggle("hidden", !isPlaying);
  }
  if (eqBars) {
    eqBars.classList.toggle("playing", isPlaying);
  }
  if (iconVolOn && iconVolOff) {
    const isMuted = bgAudio.muted || bgAudio.volume === 0;
    iconVolOn.classList.toggle("hidden", isMuted);
    iconVolOff.classList.toggle("hidden", !isMuted);
  }
}

function togglePlayPause() {
  if (!bgAudio) return;
  if (bgAudio.paused) {
    bgAudio
      .play()
      .then(syncAudioUI)
      .catch(() => {});
  } else {
    bgAudio.pause();
    syncAudioUI();
  }
}

if (playerPlayBtn) {
  playerPlayBtn.addEventListener("click", togglePlayPause);
}

if (playerRwBtn && bgAudio) {
  playerRwBtn.addEventListener("click", () => {
    bgAudio.currentTime = Math.max(0, bgAudio.currentTime - 10);
  });
}

if (playerFfBtn && bgAudio) {
  playerFfBtn.addEventListener("click", () => {
    if (Number.isFinite(bgAudio.duration)) {
      bgAudio.currentTime = Math.min(bgAudio.duration, bgAudio.currentTime + 10);
    } else {
      bgAudio.currentTime += 10;
    }
  });
}

if (playerMuteBtn && bgAudio) {
  playerMuteBtn.addEventListener("click", () => {
    bgAudio.muted = !bgAudio.muted;
    syncAudioUI();
  });
}

if (playerVolume && bgAudio) {
  playerVolume.addEventListener("input", () => {
    bgAudio.volume = Number(playerVolume.value);
    if (bgAudio.volume > 0 && bgAudio.muted) {
      bgAudio.muted = false;
    }
    syncAudioUI();
  });
}

if (bgAudio) {
  bgAudio.addEventListener("loadedmetadata", () => {
    if (playerDuration) {
      playerDuration.textContent = formatTime(bgAudio.duration);
    }
  });

  bgAudio.addEventListener("timeupdate", () => {
    if (playerCurrent) {
      playerCurrent.textContent = formatTime(bgAudio.currentTime);
    }
    if (playerSeek && bgAudio.duration) {
      playerSeek.value = String((bgAudio.currentTime / bgAudio.duration) * 100);
    }
  });

  bgAudio.addEventListener("play", syncAudioUI);
  bgAudio.addEventListener("pause", syncAudioUI);
}

if (playerSeek && bgAudio) {
  playerSeek.addEventListener("input", () => {
    if (bgAudio.duration) {
      bgAudio.currentTime = (Number(playerSeek.value) / 100) * bgAudio.duration;
    }
  });
}
