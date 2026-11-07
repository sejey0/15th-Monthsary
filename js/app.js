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
const audioToggleBtn = document.getElementById("audio-toggle-btn");
const audioLabel = document.getElementById("audio-label");

// =====================================================
// LOGIN BACKGROUND SLIDESHOW (assets/images/*)
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
    if (vaultOverlay.classList.contains("vault-unlocked")) return;
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
        "pin-dot w-3 h-3 rounded-full border border-zinc-500 transition-all duration-200";
    }
  });
}

function unlockVault() {
  vaultStatus.textContent = "UNLOCKED";
  vaultStatus.className =
    "text-center font-mono text-[11px] tracking-widest h-4 mb-4 text-emerald-400";
  setTimeout(() => {
    vaultOverlay.classList.add("vault-unlocked");
    mainExperience.classList.add("active");
    if (bgAudio && bgAudio.paused) {
      bgAudio
        .play()
        .then(() => {
          audioLabel.textContent = "Audio: Playing";
        })
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
        "text-center font-mono text-[11px] tracking-widest h-4 mb-4 text-pink-400";
      pinDisplay.classList.add("animate-shake");
      setTimeout(() => {
        pinDisplay.classList.remove("animate-shake");
        currentPin = "";
        vaultStatus.textContent = "ENTER PASSCODE";
        vaultStatus.className =
          "text-center font-mono text-[11px] tracking-widest h-4 mb-4 text-zinc-500";
        updatePinUI();
      }, 450);
    }
  }
}

document.querySelectorAll("[data-key]").forEach((btn) => {
  btn.addEventListener("click", () => handlePinInput(btn.dataset.key));
});

document.getElementById("pin-clear").addEventListener("click", () => {
  currentPin = "";
  vaultStatus.textContent = "ENTER PASSCODE";
  vaultStatus.className =
    "text-center font-mono text-[11px] tracking-widest h-4 mb-4 text-zinc-500";
  updatePinUI();
});

document.getElementById("pin-back").addEventListener("click", () => {
  currentPin = currentPin.slice(0, -1);
  updatePinUI();
});

document.getElementById("relock-btn").addEventListener("click", () => {
  currentPin = "";
  updatePinUI();
  vaultStatus.textContent = "ENTER PASSCODE";
  vaultStatus.className =
    "text-center font-mono text-[11px] tracking-widest h-4 mb-4 text-zinc-500";
  vaultOverlay.classList.remove("vault-unlocked");
  mainExperience.classList.remove("active");
});

window.addEventListener("keydown", (e) => {
  if (vaultOverlay.classList.contains("vault-unlocked")) return;
  if (e.key >= "0" && e.key <= "9") handlePinInput(e.key);
  if (e.key === "Backspace") {
    currentPin = currentPin.slice(0, -1);
    updatePinUI();
  }
});

// =====================================================
// AMBIENT AUDIO CONTROLLER (assets/audio/theme.mp3)
// =====================================================
if (audioToggleBtn && bgAudio) {
  audioToggleBtn.addEventListener("click", () => {
    if (bgAudio.paused) {
      bgAudio
        .play()
        .then(() => {
          audioLabel.textContent = "Audio: Playing";
        })
        .catch(() => {
          audioLabel.textContent = "No Audio File";
        });
    } else {
      bgAudio.pause();
      audioLabel.textContent = "Audio: Paused";
    }
  });
}

// =====================================================
// 2. LIVE MILESTONE COUNTER (ORIGIN & OCT 15, 2026)
// =====================================================
const ORIGIN_DATE = new Date("2025-07-15T00:00:00");
const MONTHSARY_15_DATE = new Date("2026-10-15T00:00:00");
let counterMode = "origin";

const cntDays = document.getElementById("cnt-days");
const cntHours = document.getElementById("cnt-hours");
const cntMinutes = document.getElementById("cnt-minutes");
const cntSeconds = document.getElementById("cnt-seconds");
const counterModeTitle = document.getElementById("counter-mode-title");
const counterDirectionBadge = document.getElementById("counter-direction-badge");
const totalHoursReadout = document.getElementById("total-hours-readout");

function updateCounter() {
  const now = new Date();
  const target = counterMode === "origin" ? ORIGIN_DATE : MONTHSARY_15_DATE;
  const diffMs = now - target;
  const isPast = diffMs >= 0;
  const absMs = Math.abs(diffMs);

  const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((absMs / (1000 * 60)) % 60);
  const seconds = Math.floor((absMs / 1000) % 60);
  const totalHours = Math.floor(absMs / (1000 * 60 * 60)).toLocaleString();

  cntDays.textContent = String(days).padStart(3, "0");
  cntHours.textContent = String(hours).padStart(2, "0");
  cntMinutes.textContent = String(minutes).padStart(2, "0");
  cntSeconds.textContent = String(seconds).padStart(2, "0");
  totalHoursReadout.textContent = `TOTAL HOURS: ${totalHours} HRS`;

  if (counterMode === "origin") {
    counterModeTitle.textContent = "Total Time Together (Since July 15, 2025)";
    counterDirectionBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span> CONTINUOUS TIME TOGETHER`;
  } else {
    counterModeTitle.textContent = isPast
      ? "Time Elapsed Since 15th Monthsary (Oct 15, 2026)"
      : "Countdown to 15th Monthsary (Oct 15, 2026)";
    counterDirectionBadge.innerHTML = isPast
      ? `<span class="w-2 h-2 rounded-full bg-pink-400"></span> BEYOND OCTOBER 15, 2026 MILESTONE`
      : `<span class="w-2 h-2 rounded-full bg-purple-400"></span> APPROACHING OCTOBER 15, 2026`;
  }
}

document.querySelectorAll(".counter-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    counterMode = tab.dataset.counterMode;
    document.querySelectorAll(".counter-tab").forEach((t) => {
      t.className =
        "counter-tab px-3.5 py-1.5 rounded-lg text-xs font-mono transition text-zinc-400 hover:text-white";
    });
    tab.className =
      "counter-tab px-3.5 py-1.5 rounded-lg text-xs font-mono transition bg-white/10 text-white";
    updateCounter();
  });
});

setInterval(updateCounter, 1000);
updateCounter();

// =====================================================
// 3. COPY HEARTFELT LETTER TO CLIPBOARD
// =====================================================
const copyBtn = document.getElementById("copy-letter-btn");
const copyLabel = document.getElementById("copy-label");
const letterBody = document.getElementById("letter-body");

copyBtn.addEventListener("click", async () => {
  const text = letterBody.innerText.trim();
  try {
    await navigator.clipboard.writeText(text);
    copyLabel.textContent = "Copied to Clipboard";
    setTimeout(() => {
      copyLabel.textContent = "Copy Letter Text";
    }, 2200);
  } catch {
    copyLabel.textContent = "Copied";
  }
});

// =====================================================
// 4. INTERACTIVE TIMELINE DATA & RENDERING
// =====================================================
const milestones = [
  {
    tag: "MONTH 01",
    date: "JULY 15, 2025",
    title: "Where the Orbit Began",
    desc: "The day everything aligned. A simple beginning that quietly rewrote every plan and routine into something shared.",
    coord: "COORDINATE // CHAPTER I"
  },
  {
    tag: "MONTH 05",
    date: "NOVEMBER 15, 2025",
    title: "Midnight Coffee & Unspoken Fluency",
    desc: "By month five, we had built our own language—knowing what the other was thinking across a crowded room with a single glance.",
    coord: "COORDINATE // CHAPTER V"
  },
  {
    tag: "MONTH 10",
    date: "APRIL 15, 2026",
    title: "Double Digits & New Horizons",
    desc: "Ten months of building trust, navigating busy seasons side by side, and proving that home is wherever we happen to be standing together.",
    coord: "COORDINATE // CHAPTER X"
  },
  {
    tag: "MONTH 12",
    date: "JULY 15, 2026",
    title: "First Full Revolution Around the Sun",
    desc: "365 days complete. Looking back at a full year of growth, inside jokes, and unwavering devotion.",
    coord: "COORDINATE // CHAPTER XII"
  },
  {
    tag: "MONTH 15",
    date: "OCTOBER 15, 2026",
    title: "The Fifteenth Monthsary Vault",
    desc: "457 days of choosing each other. Deeper, calmer, and brighter than day one—celebrating fifteen months of us.",
    coord: "COORDINATE // CHAPTER XV"
  }
];

const timelineList = document.getElementById("timeline-list");
const tlDetailTag = document.getElementById("tl-detail-tag");
const tlDetailDate = document.getElementById("tl-detail-date");
const tlDetailTitle = document.getElementById("tl-detail-title");
const tlDetailDesc = document.getElementById("tl-detail-desc");
const tlDetailCoord = document.getElementById("tl-detail-coord");

function selectMilestone(index) {
  const m = milestones[index];
  tlDetailTag.textContent = m.tag;
  tlDetailDate.textContent = m.date;
  tlDetailTitle.textContent = m.title;
  tlDetailDesc.textContent = m.desc;
  tlDetailCoord.textContent = m.coord;

  document.querySelectorAll(".timeline-item").forEach((el, idx) => {
    if (idx === index) {
      el.classList.add("bg-white/[0.06]", "border-purple-400/50");
      el.classList.remove("bg-white/[0.02]", "border-white/10");
    } else {
      el.classList.remove("bg-white/[0.06]", "border-purple-400/50");
      el.classList.add("bg-white/[0.02]", "border-white/10");
    }
  });
}

milestones.forEach((m, idx) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "timeline-item w-full text-left pl-12 pr-5 py-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition relative group";
  btn.innerHTML = `
    <span class="w-3.5 h-3.5 rounded-full bg-[#060608] border-2 border-pink-400 group-hover:scale-125 transition-transform absolute left-[14px] top-6"></span>
    <div class="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1">
      <span class="text-pink-300">${m.tag}</span>
      <span>${m.date}</span>
    </div>
    <div class="font-display font-semibold text-white text-base sm:text-lg">${m.title}</div>
  `;
  btn.addEventListener("click", () => selectMilestone(idx));
  timelineList.appendChild(btn);
});

selectMilestone(milestones.length - 1);

// =====================================================
// 5. MEMORY GALLERY GRID & LIGHTBOX (assets/images/*)
// =====================================================
const galleryItems = [
  {
    id: "FRAME 01",
    category: "pink",
    date: "JUL 2025",
    title: "First Frame Together",
    caption:
      "Where the story started—captured in a single frame we will always come back to.",
    image: encodeURI("assets/images/1st Image Together/1000019984.jpg"),
    gradient: "from-pink-500/40 via-purple-600/20 to-black"
  },
  {
    id: "FRAME 02",
    category: "purple",
    date: "AUG 2025",
    title: "Tarlac Memories",
    caption:
      "Exploring side by side, turning every trip into our favorite shared routine.",
    image: encodeURI("assets/images/Tarlac/2025/IMG_20250811_171107_439.jpg"),
    gradient: "from-purple-500/40 via-pink-500/20 to-black"
  },
  {
    id: "FRAME 03",
    category: "green",
    date: "OCT 2025",
    title: "Bataan Getaway",
    caption:
      "Golden skies, coastal breeze, and quiet moments away from everything else.",
    image: encodeURI("assets/images/Bataan/2025/IMG_20251015_164306_427 (1) (1).jpg"),
    gradient: "from-emerald-400/40 via-purple-500/20 to-black"
  },
  {
    id: "FRAME 04",
    category: "pink",
    date: "2025",
    title: "Manaoag Sanctuary",
    caption:
      "Grateful hearts and peaceful walks together.",
    image: encodeURI("assets/images/Manaoag/2025/pm_1768128416038_cmp.jpg"),
    gradient: "from-pink-400/40 via-emerald-400/20 to-black"
  },
  {
    id: "FRAME 05",
    category: "purple",
    date: "JUN 2026",
    title: "Late Night Video Calls",
    caption:
      "No distance matters when every night ends with your smile on the screen.",
    image: encodeURI("assets/images/Video Call/IMG_20260615_201136.jpg"),
    gradient: "from-purple-500/40 via-emerald-400/25 to-black"
  },
  {
    id: "FRAME 06",
    category: "green",
    date: "OCT 15, 2026",
    title: "Chapter Fifteen Collage",
    caption:
      "Fifteen months strong—still my favorite notification, conversation, and home.",
    image: encodeURI("assets/images/Edits/us.png"),
    gradient: "from-emerald-400/40 via-pink-500/30 to-black"
  }
];

const galleryGrid = document.getElementById("gallery-grid");
const lightboxModal = document.getElementById("lightbox-modal");
const lightboxArt = document.getElementById("lightbox-art");
const lightboxMeta = document.getElementById("lightbox-meta");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxCaption = document.getElementById("lightbox-caption");

function renderGallery(filter = "all") {
  galleryGrid.innerHTML = "";
  const filtered =
    filter === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.category === filter);

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className =
      "group cursor-pointer rounded-3xl border border-white/10 bg-white/[0.02] hover:border-pink-400/40 transition-all duration-300 overflow-hidden flex flex-col";
    card.innerHTML = `
      <div class="h-64 w-full bg-gradient-to-br ${item.gradient} relative flex items-center justify-center overflow-hidden">
        <img
          src="${item.image}"
          alt=""
          class="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110"
          onerror="this.style.display='none'"
        />
        <img
          src="${item.image}"
          alt="${item.title}"
          class="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          onerror="this.style.display='none'"
        />
        <svg class="w-16 h-16 text-white/30 group-hover:scale-110 group-hover:text-white/60 transition-all duration-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="12" cy="12" r="9"></circle>
          <circle cx="12" cy="12" r="4"></circle>
          <line x1="12" y1="3" x2="12" y2="5"></line>
          <line x1="12" y1="19" x2="12" y2="21"></line>
          <line x1="3" y1="12" x2="5" y2="12"></line>
          <line x1="19" y1="12" x2="21" y2="12"></line>
        </svg>
        <span class="absolute top-3.5 left-4 text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/60 text-zinc-200 border border-white/10">
          ${item.id}
        </span>
        <span class="absolute bottom-3.5 right-4 text-[11px] font-mono text-zinc-300 bg-black/40 px-2 py-0.5 rounded">
          ${item.date}
        </span>
      </div>
      <div class="p-6 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 class="font-display text-lg font-semibold text-white group-hover:text-pink-300 transition">${item.title}</h3>
          <p class="text-sm text-zinc-400 mt-1 line-clamp-2">${item.caption}</p>
        </div>
        <div class="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>INSPECT MEMORY</span>
          <svg class="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      </div>
    `;
    card.addEventListener("click", () => {
      lightboxArt.className = `w-full h-80 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10 bg-gradient-to-br ${item.gradient} relative`;
      lightboxArt.innerHTML = `
        <img
          src="${item.image}"
          alt=""
          class="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110"
          onerror="this.style.display='none'"
        />
        <img
          src="${item.image}"
          alt="${item.title}"
          class="relative z-10 w-full h-full object-contain"
          onerror="this.style.display='none'"
        />
        <svg class="w-20 h-20 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      `;
      lightboxMeta.textContent = `${item.id} // ${item.date}`;
      lightboxTitle.textContent = item.title;
      lightboxCaption.textContent = item.caption;
      lightboxModal.classList.remove("hidden");
      lightboxModal.classList.add("flex");
    });
    galleryGrid.appendChild(card);
  });
}

document.querySelectorAll(".gallery-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".gallery-filter").forEach((b) => {
      b.className =
        "gallery-filter px-3.5 py-1.5 rounded-full text-xs font-mono bg-white/[0.04] text-zinc-300 border border-white/10 hover:border-pink-400 transition";
    });
    btn.className =
      "gallery-filter px-3.5 py-1.5 rounded-full text-xs font-mono bg-white text-black font-medium transition";
    renderGallery(btn.dataset.filter);
  });
});

document.getElementById("lightbox-close").addEventListener("click", () => {
  lightboxModal.classList.add("hidden");
  lightboxModal.classList.remove("flex");
});

lightboxModal.addEventListener("click", (e) => {
  if (e.target === lightboxModal) {
    lightboxModal.classList.add("hidden");
    lightboxModal.classList.remove("flex");
  }
});

renderGallery();

