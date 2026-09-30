// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://zcctzfueppsgfojxtlsi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjY3R6ZnVlcHBzZ2Zvanh0bHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NjM2NjYsImV4cCI6MjEwNjIzOTY2Nn0.knxNcD0JzrPPmVAFvuPzYEsF7DzSeLO8OZMR-OeX1-0';

// Inisialisasi Supabase dengan aman (supaya error tidak merusak seluruh game)
let supabaseClient = null;
try {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase berhasil diinisialisasi');
  } else {
    console.warn('Supabase library belum loaded');
  }
} catch (err) {
  console.error('Gagal init Supabase:', err);
  supabaseClient = null;
}

// --- SISTEM KEAMANAN & LOGIN MENGGUNAKAN SESSIONSTORAGE ---
let violations = 0;
let isLoggedIn = false;
let isBanned = sessionStorage.getItem('user_banned') === 'true';
let currentUsername = 'Hacker';

document.addEventListener('DOMContentLoaded', () => {
  if (isBanned) {
    showBannedScreen();
  }
});

function handleLogin(e) {
  e.preventDefault();
  if (isBanned) return;

  const userInput = document.getElementById('username-input');
  const user = userInput.value.trim();
  
  if (user === '') {
    userInput.focus();
    userInput.classList.add('border-red-500');
    setTimeout(() => userInput.classList.remove('border-red-500'), 1500);
    return;
  }

  // Password sengaja diabaikan (opsional / formalitas saja)
  isLoggedIn = true;
  currentUsername = user;
  playBGM('menu');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-content').classList.remove('hidden');
}

document.addEventListener('visibilitychange', () => {
  if (isLoggedIn && !isBanned && document.hidden) {
    registerViolation();
  }
});

window.addEventListener('blur', () => {
  if (isLoggedIn && !isBanned) {
    registerViolation();
  }
});

function registerViolation() {
  violations++;
  if (violations >= 3) {
    isBanned = true;
    sessionStorage.setItem('user_banned', 'true');
    showBannedScreen();
  } else {
    document.getElementById('violation-count-text').textContent = `${violations} / 3`;
    document.getElementById('warning-modal').classList.remove('hidden');
  }
}

function closeWarningModal() {
  document.getElementById('warning-modal').classList.add('hidden');
}

function showBannedScreen() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-content').classList.add('hidden');
  document.getElementById('warning-modal').classList.add('hidden');
  document.getElementById('banned-screen').classList.remove('hidden');
  stopBGM();
  clearMinigames();
}

// --- AUDIO SYNTHESIZER ---
let audioCtx = null;
let bgmInterval = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, duration, type='sine', gainVal=0.1) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch(e){}
}

function playBGM(type) {
  stopBGM();
  const ctx = getAudioContext();
  if (type === 'menu') {
    let notes = [261.63, 329.63, 392.00, 523.25];
    let step = 0;
    bgmInterval = setInterval(() => {
      playTone(notes[step % notes.length], 0.2, 'triangle', 0.03);
      step++;
    }, 300);
  } else if (type === 'boss') {
    let bossNotes = [110, 116.54, 123.47, 130.81];
    let step = 0;
    bgmInterval = setInterval(() => {
      playTone(bossNotes[step % bossNotes.length], 0.15, 'sawtooth', 0.05);
      step++;
    }, 150);
  }
}

function stopBGM() {
  if (bgmInterval) clearInterval(bgmInterval);
  bgmInterval = null;
}

function playCorrectSound() {
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.15, 'sine', 0.15), i * 60));
}

function playWrongSound() {
  playTone(150, 0.25, 'sawtooth', 0.2);
  setTimeout(() => playTone(110, 0.35, 'sawtooth', 0.2), 100);
}

function playSlashSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch(e){}
}

function playExplosionSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch(e){}
}

function playVictorySound() {
  stopBGM();
  const melody = [523.25, 659.25, 783.99, 1046.50, 880, 1046.50];
  melody.forEach((n, i) => setTimeout(() => playTone(n, 0.3, 'triangle', 0.2), i * 120));
}

function playGameOverSound() {
  stopBGM();
  const melody = [300, 280, 260, 220, 180];
  melody.forEach((n, i) => setTimeout(() => playTone(n, 0.3, 'sawtooth', 0.2), i * 150));
}

function triggerSlashVFX() {
  playSlashSound();
  const vfxContainer = document.getElementById('vfx-container');
  const slash = document.createElement('div');
  slash.className = 'absolute w-[120%] h-3 bg-gradient-to-r from-transparent via-cyan-300 to-transparent slash-effect shadow-[0_0_20px_#06b6d4]';
  slash.style.top = `${Math.floor(Math.random() * 60) + 20}%`;
  vfxContainer.appendChild(slash);
  setTimeout(() => slash.remove(), 250);
}

function triggerExplosionVFX(x, y) {
  playExplosionSound();
  const vfxContainer = document.getElementById('vfx-container');
  const explosion = document.createElement('div');
  explosion.className = 'absolute w-24 h-24 rounded-full bg-gradient-to-r from-amber-500 via-red-500 to-yellow-400 explosion-effect flex items-center justify-center text-3xl';
  explosion.innerHTML = '💥';
  
  if (x !== undefined && y !== undefined) {
    explosion.style.left = `${x - 48}px`;
    explosion.style.top = `${y - 48}px`;
  } else {
    explosion.style.left = '50%';
    explosion.style.top = '50%';
    explosion.style.transform = 'translate(-50%, -50%)';
  }

  vfxContainer.appendChild(explosion);
  setTimeout(() => explosion.remove(), 350);
}

// --- MULTIPLAYER (SUPABASE REALTIME) ---
let roomChannel = null;
let currentRoomCode = null;
let myPlayerId = null;
let isHost = false;
let remotePlayers = {};
let isMultiplayer = false;
let gameAlreadyStarted = false;

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'IT';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId() {
  return (currentUsername || 'Player') + '-' + Math.random().toString(36).slice(2, 8);
}

async function cleanupRoomChannel() {
  if (roomChannel && supabaseClient) {
    try {
      await roomChannel.unsubscribe();
      supabaseClient.removeChannel(roomChannel);
    } catch (e) {}
  }
  roomChannel = null;
}

function renderLobby() {
  const list = document.getElementById('player-list');
  if (!list) return;
  const pKeys = Object.keys(remotePlayers);
  if (pKeys.length === 0) {
    list.innerHTML = '<div class="text-center text-slate-400 text-xs">Menunggu pemain...</div>';
    return;
  }
  list.innerHTML = pKeys.map(k => `
    <div class="flex justify-between items-center bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-xs">
      <span class="font-bold text-slate-200">${remotePlayers[k].name}</span>
      <span class="text-emerald-400 font-mono">TERHUBUNG</span>
    </div>
  `).join('');
}

function handlePresenceSync() {
  if (!roomChannel) return;
  const state = roomChannel.presenceState();
  remotePlayers = {};
  Object.values(state).forEach((presences) => {
    (presences || []).forEach((p) => {
      const id = p.player_id || p.username;
      remotePlayers[id] = {
        name: p.is_host ? `${p.username} (HOST)` : p.username,
        score: 0
      };
    });
  });
  renderLobby();
}

function subscribeToRoom(code) {
  return new Promise((resolve, reject) => {
    if (!supabaseClient) {
      reject(new Error('Supabase belum siap'));
      return;
    }

    currentRoomCode = code;
    myPlayerId = generatePlayerId();
    gameAlreadyStarted = false;

    roomChannel = supabaseClient.channel('quiz-room-' + code, {
      config: {
        presence: { key: myPlayerId },
        broadcast: { self: true }
      }
    });

    const timeout = setTimeout(() => {
      reject(new Error('Timeout: gagal masuk room'));
    }, 12000);

    roomChannel
      .on('presence', { event: 'sync' }, handlePresenceSync)
      .on('broadcast', { event: 'START_GAME' }, () => {
        if (gameAlreadyStarted) return;
        gameAlreadyStarted = true;
        if (lobbyScreen) lobbyScreen.classList.add('hidden');
        initGame();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await roomChannel.track({
              player_id: myPlayerId,
              username: currentUsername,
              is_host: isHost
            });
            clearTimeout(timeout);
            resolve(true);
          } catch (e) {
            clearTimeout(timeout);
            reject(e);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          clearTimeout(timeout);
          reject(new Error(status));
        }
      });
  });
}

async function hostCreateRoom() {
  isMultiplayer = true;
  isHost = true;
  const roomCode = generateRoomCode();

  mabarScreen.classList.add('hidden');
  lobbyScreen.classList.remove('hidden');
  document.getElementById('display-room-code').textContent = 'MEMBUAT ROOM...';
  document.getElementById('start-mabar-btn').classList.add('hidden');
  document.getElementById('player-list').innerHTML = '<div class="text-center text-slate-400 text-xs">Menghubungkan ke server...</div>';

  try {
    await cleanupRoomChannel();

    if (supabaseClient) {
      try {
        await supabaseClient.from('rooms').insert({
          code: roomCode,
          host_name: currentUsername,
          status: 'lobby'
        });
      } catch (e) {
        console.warn('Tabel rooms belum ada / insert dilewati:', e);
      }
    }

    await subscribeToRoom(roomCode);
    document.getElementById('display-room-code').textContent = roomCode;
    document.getElementById('start-mabar-btn').classList.remove('hidden');
    handlePresenceSync();
  } catch (err) {
    console.error(err);
    document.getElementById('display-room-code').textContent = 'GAGAL';
    document.getElementById('player-list').innerHTML = `
      <div class="text-center text-red-400 text-xs p-2">
        Gagal membuat room.<br>
        <span class="text-slate-400">Cek koneksi internet, lalu coba lagi.</span>
        <br><button onclick="backToMainMenu()" class="mt-2 text-cyan-400 underline text-xs">Kembali</button>
      </div>`;
  }
}

async function joinRoom() {
  const code = document.getElementById('room-code-input').value.trim().toUpperCase();
  if (!code) {
    alert('Masukkan Kode Room!');
    return;
  }

  isMultiplayer = true;
  isHost = false;

  mabarScreen.classList.add('hidden');
  lobbyScreen.classList.remove('hidden');
  document.getElementById('display-room-code').textContent = code;
  document.getElementById('start-mabar-btn').classList.add('hidden');
  document.getElementById('player-list').innerHTML = '<div class="text-center text-slate-400 text-xs">Menghubungkan ke room...</div>';

  try {
    await cleanupRoomChannel();
    await subscribeToRoom(code);
    handlePresenceSync();
  } catch (err) {
    console.error(err);
    document.getElementById('player-list').innerHTML = `
      <div class="text-center text-red-400 text-xs p-2">
        Gagal join room.<br>
        Pastikan kode benar dan host masih di lobby.
        <br><button onclick="backToMainMenu()" class="mt-2 text-cyan-400 underline text-xs">Kembali</button>
      </div>`;
  }
}

async function startMabarMatch() {
  if (!isHost) return;
  if (roomChannel) {
    await roomChannel.send({
      type: 'broadcast',
      event: 'START_GAME',
      payload: { by: currentUsername }
    });
  } else {
    if (lobbyScreen) lobbyScreen.classList.add('hidden');
    initGame();
  }
}

// --- GAME NAVIGATION & DATA SOAL ---
let startScreen, mabarScreen, lobbyScreen, howToPlayScreen, bossChoiceScreen, quizScreen, endScreen;

function initScreenRefs() {
  startScreen = document.getElementById('start-screen');
  mabarScreen = document.getElementById('mabar-screen');
  lobbyScreen = document.getElementById('lobby-screen');
  howToPlayScreen = document.getElementById('how-to-play-screen');
  bossChoiceScreen = document.getElementById('boss-choice-screen');
  quizScreen = document.getElementById('quiz-screen');
  endScreen = document.getElementById('end-screen');
}
// Panggil setelah DOM siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScreenRefs);
} else {
  initScreenRefs();
}

function showMabarMenu() {
  startScreen.classList.add('hidden');
  mabarScreen.classList.remove('hidden');
}

function backToMainMenu() {
  cleanupRoomChannel();
  isMultiplayer = false;
  isHost = false;
  remotePlayers = {};
  if (lobbyScreen) lobbyScreen.classList.add('hidden');
  if (mabarScreen) mabarScreen.classList.add('hidden');
  if (startScreen) startScreen.classList.remove('hidden');
}

function showHowToPlay() {
  startScreen.classList.add('hidden');
  howToPlayScreen.classList.remove('hidden');
}

function hideHowToPlay() {
  howToPlayScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
}

const questionBank = {
  stage1: [
    { q: "Komponen fisik yang dapat disentuh pada sistem komputer disebut?", options: ["Software", "Hardware", "Brainware", "Firmware"], answer: 1 },
    { q: "Otak dari komputer yang berfungsi memproses instruksi data adalah?", options: ["RAM", "Harddisk", "CPU", "GPU"], answer: 2 },
    { q: "Memori utama yang bersifat sementara (volatile) pada komputer adalah?", options: ["ROM", "RAM", "SSD", "Flashdisk"], answer: 1 },
    { q: "Manakah yang termasuk ke dalam perangkat masukan (input device)?", options: ["Monitor", "Printer", "Keyboard", "Speaker"], answer: 2 },
    { q: "Perangkat keras yang berfungsi menyimpan data secara permanen adalah?", options: ["RAM", "Storage (HDD/SSD)", "Cache", "Register"], answer: 1 }
  ],
  stage2: [
    { q: "Perangkat lunak yang mengelola seluruh sumber daya sistem komputer disebut?", options: ["Sistem Operasi", "Aplikasi", "Utility", "Driver"], answer: 0 },
    { q: "Contoh dari Sistem Operasi sumber terbuka (Open Source) adalah?", options: ["Windows 11", "macOS", "Linux", "iOS"], answer: 2 },
    { q: "Berikut ini manakah yang merupakan bahasa pemrograman web tingkat dasar?", options: ["HTML", "Python", "C++", "Java"], answer: 0 },
    { q: "Singkatan dari HTTP dalam protokol web adalah?", options: ["HyperText Transfer Protocol", "HighText Transfer Text", "HyperText Terminal Protocol", "Hyper Transfer Protocol"], answer: 0 },
    { q: "Struktur data yang menggunakan prinsip LIFO (Last In First Out) adalah?", options: ["Queue", "Stack", "Array", "Tree"], answer: 1 }
  ],
  bossHeal: [
    { q: "Simbol yang digunakan untuk komentar baris tunggal di bahasa Python adalah?", options: ["//", "#", "/*", "<!--"], answer: 1 },
    { q: "Protokol keamanan web HTTPS menggunakan enkripsi standar pada port?", options: ["80", "21", "443", "22"], answer: 2 },
    { q: "Alamat IP v4 terdiri dari berapa bit?", options: ["16 Bit", "32 Bit", "64 Bit", "128 Bit"], answer: 1 },
    { q: "Topologi jaringan yang menggunakan satu kabel pusat sebagai backbone adalah?", options: ["Star", "Bus", "Ring", "Mesh"], answer: 1 },
    { q: "Perintah SQL untuk mengambil data dari tabel database adalah?", options: ["GET", "FETCH", "SELECT", "PULL"], answer: 2 }
  ],
  bossPower: [
    { q: "Apakah singkatan dari IT?", options: ["Information Technology", "Internet Tech", "Internal Team", "Intel Tool"], answer: 0 },
    { q: "Warna kabel LAN standar biasa menggunakan konektor jenis?", options: ["RJ-45", "USB-C", "HDMI", "VGA"], answer: 0 },
    { q: "Tombol keyboard untuk menyalin teks adalah?", options: ["Ctrl + C", "Ctrl + V", "Ctrl + X", "Ctrl + Z"], answer: 0 },
    { q: "Perangkat yang menghubungkan dua jaringan berbeda subnet adalah?", options: ["Switch", "Router", "Hub", "Repeater"], answer: 1 },
    { q: "Ukuran 1 Gigabyte (GB) sama dengan berapa Megabyte (MB)?", options: ["100 MB", "512 MB", "1024 MB", "2048 MB"], answer: 2 },
    { q: "Situs web menggunakan bahasa apa untuk merancang gaya dan tampilan?", options: ["CSS", "SQL", "Python", "PHP"], answer: 0 },
    { q: "Manakah yang merupakan peramban web (web browser)?", options: ["Google Chrome", "Photoshop", "Word", "Excel"], answer: 0 },
    { q: "Ekstensi file dokumen program Python biasanya berakhiran?", options: [".py", ".html", ".exe", ".cpp"], answer: 0 },
    { q: "Kombinasi angka biner hanya terdiri dari dua angka yaitu?", options: ["0 dan 1", "1 dan 2", "0 dan 2", "1 dan 10"], answer: 0 },
    { q: "Perangkat keras tempat menempelnya processor, RAM, dan VGA adalah?", options: ["Motherboard", "Power Supply", "Casing", "Heatsink"], answer: 0 }
  ]
};

// --- GAME ENGINE STATE & VARIABLES ---
let currentStage = 1;
let questionsList = [];
let currentQuestionIdx = 0;
let score = 0;
let playerLives = 5;
let streakCount = 0;
let currentEnemyHP = 100;
let maxEnemyHP = 100;

let swordCount = 0;
let targetSwordCount = 5;
let currentRequiredKey = 'A';
let swordTimer = null;
let swordTimeLeft = 15.0;

let cannonCount = 0;
let targetCannonCount = 3;
let cannonTimer = null;
let cannonTimeLeft = 15.0;

function startSoloGame() {
  isMultiplayer = false;
  startScreen.classList.add('hidden');
  initGame();
}

function initGame() {
  currentStage = 1;
  score = 0;
  playerLives = 5;
  streakCount = 0;
  updateHeaderDisplays();
  setupStage(1);
}

function updateHeaderDisplays() {
  document.getElementById('score-display').textContent = `${score} PTS`;
  document.getElementById('lives-display').textContent = '❤️'.repeat(Math.max(0, playerLives));
}

function setupStage(stageNum) {
  currentStage = stageNum;
  currentQuestionIdx = 0;

  if (stageNum === 1) {
    document.getElementById('stage-label').textContent = "Tahap 1: Hardware Komputer";
    questionsList = [...questionBank.stage1];
    setupEnemy("Bug Sentinel #1", 100, getEnemySVG('bug'));
  } else if (stageNum === 2) {
    document.getElementById('stage-label').textContent = "Tahap 2: Software & Jaringan";
    questionsList = [...questionBank.stage2];
    setupEnemy("Trojan Mech #2", 150, getEnemySVG('robot'));
  } else if (stageNum === 3) {
    bossChoiceScreen.classList.remove('hidden');
    quizScreen.classList.add('hidden');
    playBGM('boss');
    return;
  }

  quizScreen.classList.remove('hidden');
  renderQuestion();
}

function selectBossBuff(type) {
  bossChoiceScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
  document.getElementById('stage-label').textContent = "FINAL BOSS: Cyber Kraken";

  if (type === 'heal') {
    playerLives = 5;
    questionsList = [...questionBank.bossHeal];
  } else {
    playerLives = 3;
    questionsList = [...questionBank.bossPower];
  }

  updateHeaderDisplays();
  setupEnemy("FINAL BOSS CYBER KRAKEN", 300, getEnemySVG('kraken'));
  renderQuestion();
}

function setupEnemy(name, hp, svgContent) {
  maxEnemyHP = hp;
  currentEnemyHP = hp;
  document.getElementById('enemy-name').textContent = name;
  document.getElementById('enemy-avatar').innerHTML = svgContent;
  updateEnemyHPBar();
}

function updateEnemyHPBar() {
  const pct = Math.max(0, (currentEnemyHP / maxEnemyHP) * 100);
  document.getElementById('enemy-hp-bar').style.width = `${pct}%`;
  document.getElementById('enemy-hp-text').textContent = `HP: ${Math.max(0, currentEnemyHP)}/${maxEnemyHP}`;
}

function getEnemySVG(type) {
  if (type === 'bug') {
    return `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]"><circle cx="50" cy="50" r="35" fill="#06b6d4"/><circle cx="38" cy="40" r="6" fill="#fff"/><circle cx="62" cy="40" r="6" fill="#fff"/><circle cx="38" cy="40" r="3" fill="#000"/><circle cx="62" cy="40" r="3" fill="#000"/><path d="M 35 65 Q 50 75 65 65" stroke="#0f172a" stroke-width="4" fill="none"/></svg>`;
  } else if (type === 'robot') {
    return `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"><rect x="25" y="25" width="50" height="50" rx="8" fill="#a855f7"/><rect x="35" y="38" width="10" height="10" fill="#a855f7"/><rect x="55" y="38" width="10" height="10" fill="#a855f7"/><rect x="35" y="60" width="30" height="6" fill="#0f172a"/></svg>`;
  } else {
    return `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]"><path d="M 20 80 Q 30 40 50 20 Q 70 40 80 80 Q 50 60 20 80 Z" fill="#ef4444"/><circle cx="40" cy="45" r="7" fill="#fff"/><circle cx="60" cy="45" r="7" fill="#fff"/><circle cx="40" cy="45" r="3" fill="#000"/><circle cx="60" cy="45" r="3" fill="#000"/></svg>`;
  }
}

function renderQuestion() {
  clearMinigames();
  document.getElementById('quiz-phase').classList.remove('hidden');
  document.getElementById('battle-phase').classList.add('hidden');

  const qData = questionsList[currentQuestionIdx];
  document.getElementById('question-number').textContent = `Soal ${currentQuestionIdx + 1} / ${questionsList.length}`;
  document.getElementById('quizizz-streak').textContent = `🔥 Combo Streak: x${streakCount}`;
  document.getElementById('question-text').textContent = qData.q;

  const optsContainer = document.getElementById('options-container');
  optsContainer.innerHTML = '';

  qData.options.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.className = 'w-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white p-3 rounded-xl text-left text-sm font-semibold transition active:scale-[0.98] flex items-center justify-between';
    btn.innerHTML = `<span>${optText}</span><span class="text-xs text-slate-500 font-mono">[${idx + 1}]</span>`;
    btn.onclick = () => handleAnswerSelect(idx);
    optsContainer.appendChild(btn);
  });
}

function handleAnswerSelect(selectedIdx) {
  const qData = questionsList[currentQuestionIdx];
  const isCorrect = (selectedIdx === qData.answer);

  if (isCorrect) {
    playCorrectSound();
    streakCount++;
    score += 100 * streakCount;
    updateHeaderDisplays();
    
    // Pindah ke fase aksi pertarungan
    document.getElementById('quiz-phase').classList.add('hidden');
    document.getElementById('battle-phase').classList.remove('hidden');
    document.getElementById('attack-select-menu').classList.remove('hidden');
  } else {
    playWrongSound();
    streakCount = 0;
    playerLives--;
    updateHeaderDisplays();

    // Animasi musuh menyerang
    const enemyAvatar = document.getElementById('enemy-avatar');
    enemyAvatar.classList.add('enemy-attack');
    document.body.classList.add('damage-effect');

    setTimeout(() => {
      enemyAvatar.classList.remove('enemy-attack');
      document.body.classList.remove('damage-effect');
    }, 500);

    if (playerLives <= 0) {
      endGame(false);
    } else {
      nextQuestion();
    }
  }
}

function nextQuestion() {
  currentQuestionIdx++;
  if (currentQuestionIdx >= questionsList.length) {
    // Lanjut ke Stage Berikutnya
    if (currentStage === 1) {
      setupStage(2);
    } else if (currentStage === 2) {
      setupStage(3);
    } else {
      endGame(true);
    }
  } else {
    renderQuestion();
  }
}

function clearMinigames() {
  if (swordTimer) clearInterval(swordTimer);
  if (cannonTimer) clearInterval(cannonTimer);
  swordTimer = null;
  cannonTimer = null;

  document.getElementById('sword-game').classList.add('hidden');
  document.getElementById('cannon-game').classList.add('hidden');
}

function applyDamageToEnemy(dmg) {
  currentEnemyHP -= dmg;
  updateEnemyHPBar();

  const enemyAvatar = document.getElementById('enemy-avatar');
  enemyAvatar.classList.add('enemy-hit');
  setTimeout(() => enemyAvatar.classList.remove('enemy-hit'), 500);

  if (currentEnemyHP <= 0) {
    setTimeout(() => {
      if (currentStage < 3) {
        setupStage(currentStage + 1);
      } else {
        endGame(true);
      }
    }, 600);
  } else {
    setTimeout(() => nextQuestion(), 800);
  }
}

// --- GAME OVER & END GAME ---
function endGame(isVictory) {
  clearMinigames();
  quizScreen.classList.add('hidden');
  endScreen.classList.remove('hidden');

  const endTitle = document.getElementById('end-title');
  const endMsg = document.getElementById('end-message');

  if (isVictory) {
    playVictorySound();
    endTitle.textContent = "🎉 SELAMAT! KAMU MENANG!";
    endTitle.className = "text-2xl md:text-3xl font-extrabold mb-1 text-emerald-400";
    endMsg.textContent = `Luar biasa, ${currentUsername}! Kamu berhasil menguasai materi IT dan mengalahkan Cyber Kraken!`;
  } else {
    playGameOverSound();
    endTitle.textContent = "💀 GAME OVER!";
    endTitle.className = "text-2xl md:text-3xl font-extrabold mb-1 text-red-500";
    endMsg.textContent = `Jangan menyerah, ${currentUsername}! Pertahanan kamu jebol. Pelajari lagi materi IT dan coba lagi!`;
  }

  renderLeaderboard();
}

async function renderLeaderboard() {
  const lbContainer = document.getElementById('leaderboard-list');
  lbContainer.innerHTML = `<div class="text-center text-slate-400 text-xs py-2">Memuat leaderboard...</div>`;

  try {
    // Simpan skor baru ke Supabase (hanya jika client tersedia)
    if (supabaseClient && score > 0 && currentUsername) {
      await supabaseClient.from('leaderboard').insert({
        username: currentUsername,
        score: score
      });
    }

    // Ambil Top 10 dari Supabase
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('leaderboard')
        .select('username, score, created_at')
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        lbContainer.innerHTML = `<div class="text-center text-slate-500 text-xs py-2">Belum ada data leaderboard</div>`;
        return;
      }

      lbContainer.innerHTML = data.map((item, index) => `
        <div class="flex justify-between items-center bg-slate-900 border border-slate-800 p-2 rounded">
          <span class="font-bold text-slate-300">${index + 1}. ${item.username}</span>
          <span class="text-amber-400 font-mono font-bold">${item.score} PTS</span>
        </div>
      `).join('');
      return;
    }

    // Fallback kalau supabase null
    throw new Error('Supabase tidak tersedia');

  } catch (err) {
    console.error('Supabase leaderboard error:', err);
    // Fallback ke localStorage kalau gagal
    let lbData = JSON.parse(localStorage.getItem('it_quiz_lb') || '[]');
    lbData.push({ name: currentUsername, score: score });
    lbData.sort((a, b) => b.score - a.score);
    lbData = lbData.slice(0, 5);
    localStorage.setItem('it_quiz_lb', JSON.stringify(lbData));

    lbContainer.innerHTML = lbData.map((item, index) => `
      <div class="flex justify-between items-center bg-slate-900 border border-slate-800 p-2 rounded">
        <span class="font-bold text-slate-300">${index + 1}. ${item.name}</span>
        <span class="text-amber-400 font-mono font-bold">${item.score} PTS</span>
      </div>
    `).join('') + `<div class="text-[10px] text-red-400 mt-1 text-center">⚠️ Offline mode (local)</div>`;
  }
}

function restartGame() {
  endScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  playBGM('menu');
}

// =========================================================================
// --- INTEGRASI MINIGAME AKSI PERTARUNGAN (TEBASAN PEDANG & MERIAM) ---
// =========================================================================

const keysPool = ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'Z', 'X', 'C'];

// 1. DUKUNGAN INPUT KEYBOARD FISIK (LAPTOP/DESKTOP/HP KEYBOARD)
window.addEventListener('keydown', (e) => {
  // Abaikan jika user sedang mengetik di input form
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

  // Handle Aksi Tebasan Pedang lewat Keyboard
  const swordGameEl = document.getElementById('sword-game');
  if (swordGameEl && !swordGameEl.classList.contains('hidden')) {
    const pressedKey = e.key.toUpperCase();
    if (pressedKey === currentRequiredKey) {
      hitSwordRandomButton();
    }
  }
});

// 2. LOGIKA MINIGAME SWORD (TEBASAN PEDANG)
function startSwordAction() {
  document.getElementById('attack-select-menu').classList.add('hidden');
  const swordGameEl = document.getElementById('sword-game');
  swordGameEl.classList.remove('hidden');

  swordCount = 0;
  targetSwordCount = 5;
  swordTimeLeft = 15.0;

  document.getElementById('sword-progress-text').textContent = `Progress: 0 / ${targetSwordCount}`;
  document.getElementById('sword-timer-text').textContent = `Waktu Tersisa: 15.0s`;

  generateNewRandomSwordKey();

  if (swordTimer) clearInterval(swordTimer);
  swordTimer = setInterval(() => {
    swordTimeLeft -= 0.1;
    if (swordTimeLeft <= 0) {
      swordTimeLeft = 0;
      clearInterval(swordTimer);
      finishSwordAction(false);
    }
    document.getElementById('sword-timer-text').textContent = `Waktu Tersisa: ${swordTimeLeft.toFixed(1)}s`;
  }, 100);
}

function generateNewRandomSwordKey() {
  const randIdx = Math.floor(Math.random() * keysPool.length);
  currentRequiredKey = keysPool[randIdx];
  
  const keyBtn = document.getElementById('random-key-btn');
  keyBtn.textContent = currentRequiredKey;

  // Berikan fokus ke tombol agar mendukung pemicu tombol Spasi/Enter
  keyBtn.focus();
}

function hitSwordRandomButton() {
  if (swordTimeLeft <= 0) return;

  swordCount++;
  triggerSlashVFX();

  document.getElementById('sword-progress-text').textContent = `Progress: ${swordCount} / ${targetSwordCount}`;

  if (swordCount >= targetSwordCount) {
    clearInterval(swordTimer);
    finishSwordAction(true);
  } else {
    generateNewRandomSwordKey();
  }
}

function finishSwordAction(isSuccess) {
  document.getElementById('sword-game').classList.add('hidden');

  if (isSuccess) {
    const damage = 35 + (streakCount * 5);
    applyDamageToEnemy(damage);
  } else {
    // Gagal karena waktu habis
    playWrongSound();
    setTimeout(() => nextQuestion(), 800);
  }
}

// 3. LOGIKA MINIGAME CANNON (TEMBAKAN MERIAM)
function startCannonAction() {
  document.getElementById('attack-select-menu').classList.add('hidden');
  const cannonGameEl = document.getElementById('cannon-game');
  cannonGameEl.classList.remove('hidden');

  cannonCount = 0;
  targetCannonCount = 3;
  cannonTimeLeft = 15.0;

  document.getElementById('cannon-progress-text').textContent = `0 / ${targetCannonCount}`;
  document.getElementById('cannon-timer-text').textContent = `Waktu tersisa: 15.0s`;

  moveCannonTargetRandomly();

  if (cannonTimer) clearInterval(cannonTimer);
  cannonTimer = setInterval(() => {
    cannonTimeLeft -= 0.1;
    if (cannonTimeLeft <= 0) {
      cannonTimeLeft = 0;
      clearInterval(cannonTimer);
      finishCannonAction(false);
    }
    document.getElementById('cannon-timer-text').textContent = `Waktu tersisa: ${cannonTimeLeft.toFixed(1)}s`;
  }, 100);
}

function moveCannonTargetRandomly() {
  const aimArea = document.getElementById('aim-area');
  const target = document.getElementById('aim-target');

  if (!aimArea || !target) return;

  const areaWidth = aimArea.clientWidth || 300;
  const areaHeight = aimArea.clientHeight || 180;

  const maxX = areaWidth - 60;
  const maxY = areaHeight - 60;

  const randomX = Math.floor(Math.random() * Math.max(10, maxX));
  const randomY = Math.floor(Math.random() * Math.max(10, maxY));

  target.style.left = `${randomX}px`;
  target.style.top = `${randomY}px`;
}

function hitCannonTarget(e) {
  if (cannonTimeLeft <= 0) return;

  e.stopPropagation();
  cannonCount++;

  // Ledakan VFX tepat di lokasi klik
  triggerExplosionVFX(e.clientX, e.clientY);

  document.getElementById('cannon-progress-text').textContent = `${cannonCount} / ${targetCannonCount}`;

  if (cannonCount >= targetCannonCount) {
    clearInterval(cannonTimer);
    finishCannonAction(true);
  } else {
    moveCannonTargetRandomly();
  }
}

function finishCannonAction(isSuccess) {
  document.getElementById('cannon-game').classList.add('hidden');

  if (isSuccess) {
    const damage = 45 + (streakCount * 5);
    applyDamageToEnemy(damage);
  } else {
    // Gagal karena waktu habis
    playWrongSound();
    setTimeout(() => nextQuestion(), 800);
  }
}
