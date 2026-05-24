// ═══════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════
let totalStars = 0;
let currentLevel = 'easy';
let gameScores = { g1: 0, g2: 0, g3: 0, g4: 0, g5: 0 };
let currentAudio = null;

// ─── ZVUK ───
let soundEnabled = localStorage.getItem('fokusaurus-sound') !== 'off';
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let voiceEnabled = localStorage.getItem('fokusaurus-voice') !== 'off';

function playSound(type) {
  if (!soundEnabled) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'correct') {
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    osc.frequency.setValueAtTime(520, audioCtx.currentTime);
    osc.frequency.setValueAtTime(660, audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.start(); osc.stop(audioCtx.currentTime + 0.4);
  } else if (type === 'wrong') {
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, audioCtx.currentTime);
    osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.start(); osc.stop(audioCtx.currentTime + 0.35);
  } else if (type === 'click') {
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    osc.start(); osc.stop(audioCtx.currentTime + 0.08);
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('fokusaurus-sound', soundEnabled ? 'on' : 'off');
  document.getElementById('sound-toggle').textContent = soundEnabled ? '🔊 Zvučni efekti: Uključeni' : '🔇 Zvučni efekti: Isključeni';
}

function toggleVoice() {
  voiceEnabled = !voiceEnabled;
  localStorage.setItem('fokusaurus-voice', voiceEnabled ? 'on' : 'off');
  document.getElementById('voice-toggle').textContent = voiceEnabled ? '🗣️ Glas: Uključen' : '🗣️ Glas: Isključen';
}

// Init sound state on load
document.addEventListener('DOMContentLoaded', () => {
  if (!soundEnabled) document.getElementById('sound-toggle').textContent = '🔇 Zvučni efekti: Isključeni';
});

// ─── SCREEN NAVIGATION ───
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}
function goHome() {
  stopGame4();
  if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
  document.getElementById('total-stars').textContent = totalStars;
  showScreen('home');
}

function resetAndGoHome() {
  totalStars = 0;
  gameScores = { g1: 0, g2: 0, g3: 0, g4: 0, g5: 0 };
  document.getElementById('total-stars').textContent = 0;
  ['g1','g2','g3','g4','g5'].forEach(id => {
    const el = document.getElementById(id + '-score');
    if (el) el.textContent = 0;
  });
  goHome();
}

function startGame(id) {
  showScreen(id);
  if (id === 'g1') initG1();
  if (id === 'g2') initG2();
  if (id === 'g3') initG3();
  if (id === 'g4') initG4();
  if (id === 'g5') initG5();
}

function setLevel(lvl) {
  currentLevel = lvl;
  document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('.level-btn.' + lvl).classList.add('selected');
}

// ─── AUDIO UPUTE ───
function playAudio(file) {
  if (!voiceEnabled) return;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = new Audio('glas/' + file);
  currentAudio.volume = 0.9;
  currentAudio.play().catch(() => {});
}

// ─── FEEDBACK ───
function showFeedback(correct) {
  const overlay = document.getElementById('feedback-overlay');
  const bubble = document.getElementById('feedback-bubble');
  bubble.textContent = correct ? '✅' : '❌';
  overlay.classList.add('show');
  playSound(correct ? 'correct' : 'wrong');
  setTimeout(() => overlay.classList.remove('show'), 1300);
}

// ─── STAR FLOAT ───
function spawnStar(x, y) {
  const s = document.createElement('div');
  s.className = 'star-float';
  s.textContent = '🥚';
  s.style.left = (x - 20) + 'px';
  s.style.top = (y - 20) + 'px';
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 1100);
}

// ─── STAR METER ───
function renderStarMeter(containerId, current, max) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  for (let i = 0; i < max; i++) {
    const sp = document.createElement('span');
    sp.textContent = '🥚';
    if (i < current) sp.classList.add('lit');
    el.appendChild(sp);
  }
}

// ─── AWARD STARS ───
function awardStars(n, gameId, ev) {
  n = currentLevel === 'hard' ? n * 2 : n;
  totalStars += n;
  gameScores[gameId] = (gameScores[gameId] || 0) + n;
  document.getElementById(gameId + '-score').textContent = gameScores[gameId];
  document.getElementById('total-stars').textContent = totalStars;
  if (ev) spawnStar(ev.clientX, ev.clientY);
}

// ─── CONFETTI ───
function launchConfetti() {
  const colors = ['#FF6B35','#4ECDC4','#FFE66D','#A855F7','#22C55E','#EF4444'];
  // Očisti stari confetti ako postoji
  document.querySelectorAll('.confetti-piece').forEach(c => c.remove());
  
  for (let i = 0; i < 120; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.top = '-20px';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDuration = (2.5 + Math.random() * 1.5) + 's';
    c.style.animationDelay = (Math.random() * 1.5) + 's';
    c.style.width = (8 + Math.random() * 10) + 'px';
    c.style.height = (8 + Math.random() * 10) + 'px';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5000);
  }
}

function goToEnd(fromHome = false) {
  if (!fromHome && totalStars === 0) { goHome(); return; }
  launchConfetti();
  const msgs = [
    'Super si se pokazao! Nastavi tako!',
    'Wow, pravi si prvak!',
    'Učiš jako dobro! 🌟',
    'Svaka čast, heroju abecede!'
  ];
  document.getElementById('end-title').textContent = totalStars > 10 ? '🏆 Nevjerojatno!' : '🎉 Bravo!';
  document.getElementById('end-stars').textContent = '🥚'.repeat(Math.min(totalStars, 10));
  document.getElementById('end-message').textContent = msgs[Math.floor(Math.random() * msgs.length)];

  const grid = document.getElementById('results-grid');
  grid.innerHTML = '';
  const labels = { g1: '🔤 Fontovi', g2: '🔡 Abeceda', g3: '🕵️ Nestalo', g4: '⚡ Klikni', g5: '🧩 Složi riječ' };
  Object.entries(gameScores).forEach(([k, v]) => {
    if (v > 0) {
      grid.innerHTML += `<div class="result-card"><div class="num">${v}🥚</div><div class="lbl">${labels[k]}</div></div>`;
    }
  });
  if (!grid.innerHTML) grid.innerHTML = '<div class="result-card"><div class="num">0🥚</div><div class="lbl">Igraj igre!</div></div>';
  showScreen('end');
}

function showGameEnd(emoji, title, msg, replayFn) {
  document.getElementById('game-end-emoji').innerHTML = emoji;
  document.getElementById('game-end-title').textContent = title;
  document.getElementById('game-end-msg').textContent = msg;
  document.getElementById('game-end-replay').onclick = () => { closeGameEnd(); replayFn(); };
  const overlay = document.getElementById('game-end-overlay');
  overlay.style.display = 'flex';
}

function closeGameEnd() {
  document.getElementById('game-end-overlay').style.display = 'none';
}

// ═══════════════════════════════════════════
// IGRA 1: PRONAĐI ISTO SLOVO (RAZLIČITI FONTOVI)
// ═══════════════════════════════════════════
const G1_FONTS = [
  "'Georgia', serif",
  "'Courier New', monospace",
  "'Impact', sans-serif",
  "'Trebuchet MS', sans-serif",
  "'Palatino Linotype', serif",
  "'Arial Black', sans-serif",
  "'Comic Sans MS', cursive",
  "'Verdana', sans-serif",
  "cursive",
  "'Times New Roman', serif"
];
const G1_LETTERS_EASY = ['A','B','C','D','E','F'];
const G1_LETTERS_HARD = ['G','H','I','J','K','L','M','N','O','P','R','S','T','U','V','Z'];
let g1Round = 0, g1MaxRounds = 5, g1RoundScore = 0;
let g1CurrentLetter = '';

function initG1() {
  g1Round = 0; g1RoundScore = 0;
  document.getElementById('g1-score').textContent = gameScores.g1;
  renderStarMeter('g1-stars', 0, g1MaxRounds);
  playAudio('elevenlabs_ig1.mp3');
  nextG1Round();
}

function nextG1Round() {
  if (g1Round >= g1MaxRounds) { endG1(); return; }
  const pool = currentLevel === 'easy' ? G1_LETTERS_EASY : G1_LETTERS_HARD;
  g1CurrentLetter = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById('g1-target').textContent = g1CurrentLetter;
  document.getElementById('g1-target').style.fontFamily = G1_FONTS[Math.floor(Math.random() * G1_FONTS.length)];
  document.getElementById('g1-progress').textContent = `Pitanje ${g1Round + 1} od ${g1MaxRounds}`;
  document.getElementById('g1-instr').textContent = `Pronađi slovo ${g1CurrentLetter} u drugom fontu!`;

  const options = document.getElementById('g1-options');
  options.innerHTML = '';
  const decoyLetters = pool.filter(l => l !== g1CurrentLetter);
  const numDecoys = currentLevel === 'easy' ? 3 : 5;
  const decoys = shuffle(decoyLetters).slice(0, numDecoys);
  const allOptions = shuffle([g1CurrentLetter, ...decoys]);

  allOptions.forEach((letter, i) => {
    const btn = document.createElement('div');
    btn.className = 'font-option';
    btn.textContent = letter;
    btn.style.fontFamily = G1_FONTS[(i * 2 + 3) % G1_FONTS.length];
    btn.onclick = (e) => selectG1(btn, letter === g1CurrentLetter, e);
    options.appendChild(btn);
  });
}

function selectG1(el, correct, ev) {
  document.querySelectorAll('.font-option').forEach(b => b.onclick = null);
  el.classList.add(correct ? 'correct' : 'wrong');
  showFeedback(correct);
  if (correct) {
    awardStars(1, 'g1', ev);
    g1RoundScore++;
    renderStarMeter('g1-stars', g1RoundScore, g1MaxRounds);
  } else {
    document.querySelectorAll('.font-option').forEach(b => {
      if (b.textContent === g1CurrentLetter) b.classList.add('correct');
    });
  }
  g1Round++;
  setTimeout(nextG1Round, 1200);
}

function endG1() {
  const msgs = ['Sjajan rad!', 'Prepoznaješ slova kao prvak!', 'Super! Fontovi su ti poznati!'];
showGameEnd('<img src="slike/dino-holding-letter-a.png" style="width:100px;">', msgs[Math.floor(Math.random() * msgs.length)], `Dino-jaja: ${g1RoundScore * (currentLevel === 'hard' ? 2 : 1)} / ${g1MaxRounds * (currentLevel === 'hard' ? 2 : 1)}`, () => startGame('g1'));
}

// ═══════════════════════════════════════════
// IGRA 2: POREDAJ SLOVA (A→E)
// ═══════════════════════════════════════════
const G2_SEQUENCES_EASY = [
  ['A','B','C','Č','Ć'],
  ['D','Dž','Đ','E','F'],
  ['G','H','I','J','K'],
  ['L','Lj','M','N','Nj'],
  ['O','P','R','S','Š'],
  ['T','U','V','Z','Ž'],
  ['B','C','Č','Ć','D'],
  ['F','G','H','I','J'],
  ['K','L','Lj','M','N'],
  ['S','Š','T','U','V'],
];
const G2_SEQUENCES_HARD = [
  ['A','B','C','Č','Ć','D','Dž'],
  ['Đ','E','F','G','H','I','J'],
  ['K','L','Lj','M','N','Nj','O'],
  ['P','R','S','Š','T','U','V'],
  ['C','Č','Ć','D','Dž','Đ','E'],
  ['G','H','I','J','K','L','Lj'],
  ['M','N','Nj','O','P','R','S'],
  ['S','Š','T','U','V','Z','Ž'],
];
let g2Round = 0, g2MaxRounds = 3;
let g2Sequence = [], g2SelectedTiles = [], g2TileElements = [];
let g2RoundScore = 0;

function initG2() {
  g2Round = 0; g2RoundScore = 0;
  document.getElementById('g2-score').textContent = gameScores.g2;
  renderStarMeter('g2-stars', 0, g2MaxRounds);
  playAudio('elevenlabs_ig2.mp3');
  nextG2Round();
}

function nextG2Round() {
  if (g2Round >= g2MaxRounds) { endG2(); return; }
  const seqs = currentLevel === 'easy' ? G2_SEQUENCES_EASY : G2_SEQUENCES_HARD;
  g2Sequence = seqs[Math.floor(Math.random() * seqs.length)];
  g2SelectedTiles = [];

  const shuffled = shuffle([...g2Sequence]);
  document.getElementById('g2-instr').textContent =
    `Poredaj slova abecedno od ${g2Sequence[0]} do ${g2Sequence[g2Sequence.length - 1]}!`;

  const pool = document.getElementById('g2-pool');
  pool.innerHTML = '';
  g2TileElements = [];
  shuffled.forEach(letter => {
    const tile = document.createElement('div');
    tile.className = 'sort-tile';
    tile.textContent = letter;
    tile.dataset.letter = letter;
    tile.onclick = () => selectSortTile(tile);
    pool.appendChild(tile);
    g2TileElements.push(tile);
  });

  const slots = document.getElementById('g2-slots');
  slots.innerHTML = '';
  for (let i = 0; i < g2Sequence.length; i++) {
    const slot = document.createElement('div');
    slot.className = 'sort-slot';
    slot.textContent = (i + 1);
    slots.appendChild(slot);
  }
}

function selectSortTile(tile) {
  if (tile.classList.contains('placed')) return;
  if (tile.classList.contains('selected')) {
    tile.classList.remove('selected');
    g2SelectedTiles = g2SelectedTiles.filter(t => t !== tile);
    updateSlots();
    return;
  }
  if (g2SelectedTiles.length >= g2Sequence.length) return;
  tile.classList.add('selected');
  g2SelectedTiles.push(tile);
  updateSlots();
}

function updateSlots() {
  const slots = document.querySelectorAll('.sort-slot');
  slots.forEach((slot, i) => {
    if (g2SelectedTiles[i]) {
      slot.textContent = g2SelectedTiles[i].dataset.letter;
      slot.classList.add('filled');
    } else {
      slot.textContent = (i + 1);
      slot.classList.remove('filled', 'correct-slot', 'wrong-slot');
    }
  });
}

function checkSort() {
  if (g2SelectedTiles.length < g2Sequence.length) {
    return;
  }
  const slots = document.querySelectorAll('.sort-slot');
  let allCorrect = true;
  g2SelectedTiles.forEach((tile, i) => {
    const correct = tile.dataset.letter === g2Sequence[i];
    slots[i].classList.add(correct ? 'correct-slot' : 'wrong-slot');
    if (!correct) allCorrect = false;
  });

  showFeedback(allCorrect);
  if (allCorrect) {
    awardStars(2, 'g2', { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    g2RoundScore++;
    renderStarMeter('g2-stars', g2RoundScore, g2MaxRounds);
  } else {
    setTimeout(() => {
      g2SelectedTiles.forEach(t => { t.classList.remove('selected', 'placed'); });
      g2SelectedTiles = [];
      updateSlots();
      slots.forEach(s => s.classList.remove('correct-slot', 'wrong-slot'));
    }, 1500);
    return;
  }
  g2Round++;
  setTimeout(nextG2Round, 1500);
}

function endG2() {
  showGameEnd('<img src="slike/dino-balancing-letters.png" style="width:100px;">', 'Abeceda ti je poznata!', `Dino-jaja: ${g2RoundScore * (currentLevel === 'hard' ? 4 : 2)} od ${g2MaxRounds * (currentLevel === 'hard' ? 4 : 2)}`, () => startGame('g2'));
}

// ═══════════════════════════════════════════
// IGRA 3: ŠTO JE NESTALO?
// ═══════════════════════════════════════════
const G3_SETS_EASY = [
  ['🐶','🐱','🐸','🐻','🦊','🐼'],
  ['🍎','🍌','🍓','🍇','🍊','🍋'],
  ['⚽','🏀','🎾','⚾','🏐','🏈'],
  ['🌸','🌻','🌹','🌷','🌼','💐'],
  ['🚗','🚕','✈️','🚢','🚂','🚁'],
  ['🎸','🎹','🎺','🥁','🎻','🪗'],
  ['🌍','🌙','⭐','☀️','🌈','❄️'],
  ['🎂','🍭','🍬','🍫','🧁','🍩'],
  ['👒','🎩','⛑️','🪖','👑','🎓'],
  ['✏️','📏','📐','📚','🖊️','📖'],
  ['🐝','🦋','🐛','🐞','🦗','🐜'],
];
const G3_SETS_HARD = [
  ['🦁','🐯','🦊','🐺','🐮','🐷','🐸','🐧','🦉'],
  ['🍕','🍔','🌮','🍜','🍣','🍦','🍰','🥪','🥗'],
  ['🍎','🍊','🍋','🍇','🍓','🍑','🥝','🍒','🍌'],
  ['⚽','🏀','🎾','⚾','🏐','🏈','🏉','🎱','🏸'],
  ['🐬','🦈','🐙','🦀','🐡','🦞','🐚','🦭','🐟'],
  ['🌍','🌎','🌏','🌙','⭐','☀️','🌈','❄️','🌊'],
  ['🎂','🍭','🍬','🍫','🧁','🍩','🍪','🍦','🍰'],
  ['👒','🎩','⛑️','🪖','👑','🎓','🧢','👔','🧣'],
  ['✏️','📏','📐','📚','🖊️','📖','📝','🖍️','📌'],
  ['🐝','🦋','🐛','🐞','🦗','🐜','🦟','🪲','🪳'],
  ['🌵','🌴','🌲','🌳','🍀','🌿','🍃','🌾','🪨'],
  ['🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤'],
];
let g3Round = 0, g3MaxRounds = 4;
let g3CurrentSet = [], g3MissingItem = '', g3Phase = 'memorize';
let g3RoundScore = 0, g3Timer = null;

function initG3() {
  g3Round = 0; g3RoundScore = 0;
  document.getElementById('g3-score').textContent = gameScores.g3;
  renderStarMeter('g3-stars', 0, g3MaxRounds);
  playAudio('elevenlabs_ig3_1.mp3');
  showG3ReadyState();
}

function showG3ReadyState() {
  const sets = currentLevel === 'easy' ? G3_SETS_EASY : G3_SETS_HARD;
  const rawSet = sets[Math.floor(Math.random() * sets.length)];
  const displayCount = currentLevel === 'easy' ? 6 : 9;
  g3CurrentSet = shuffle([...rawSet]).slice(0, displayCount);

  document.getElementById('g3-phase').textContent = '👀 Zapamti!';
  document.getElementById('g3-choices').style.display = 'none';
  document.getElementById('g3-progress').textContent = `Runda ${g3Round + 1} od ${g3MaxRounds}`;
  document.getElementById('g3-instr').textContent = 'Zapamti slike pa pritisni Spreman!';
  document.getElementById('g3-ready-btn').style.display = 'inline-block';

  renderG3Grid(g3CurrentSet, false);
}

function startG3Round() {
  document.getElementById('g3-ready-btn').style.display = 'none';

  const removeIdx = Math.floor(Math.random() * g3CurrentSet.length);
  g3MissingItem = g3CurrentSet[removeIdx];

  g3Phase = 'guess';
  document.getElementById('g3-phase').textContent = '🤔 Što je nestalo?';
  document.getElementById('g3-instr').textContent = 'Što je nestalo s ekrana?';
  playAudio('elevenlabs_ig3_2.mp3');

  renderG3Grid(g3CurrentSet, removeIdx);
  renderG3Choices();
}

function nextG3Round() {
  if (g3Round >= g3MaxRounds) { endG3(); return; }
  showG3ReadyState();
}

function renderG3Grid(items, hiddenIdx) {
  const grid = document.getElementById('g3-grid');
  grid.innerHTML = '';
  items.forEach((item, i) => {
    const cell = document.createElement('div');
    cell.className = 'item-cell' + (i === hiddenIdx ? ' hidden' : '');
    if (i !== hiddenIdx) cell.textContent = item;
    grid.appendChild(cell);
  });
}

function renderG3Choices() {
  const choices = document.getElementById('g3-choices');
  choices.style.display = 'flex';
  choices.innerHTML = '';

  const allEmojis = (currentLevel === 'easy' ? G3_SETS_EASY : G3_SETS_HARD).flat();
  const decoys = shuffle(allEmojis.filter(e => !g3CurrentSet.includes(e))).slice(0, currentLevel === 'easy' ? 2 : 3);
  const allChoices = shuffle([g3MissingItem, ...decoys]);

  allChoices.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = item;
    btn.onclick = (e) => selectG3(btn, item === g3MissingItem, e);
    choices.appendChild(btn);
  });
}

function selectG3(el, correct, ev) {
  document.querySelectorAll('.choice-btn').forEach(b => b.onclick = null);
  el.classList.add(correct ? 'correct' : 'wrong');
  if (!correct) {
    document.querySelectorAll('.choice-btn').forEach(b => {
      if (b.textContent === g3MissingItem) b.classList.add('correct');
    });
  }
  showFeedback(correct);
  if (correct) {
    awardStars(1, 'g3', ev);
    g3RoundScore++;
    renderStarMeter('g3-stars', g3RoundScore, g3MaxRounds);
  } else {
  }
  g3Round++;
  setTimeout(nextG3Round, 1400);
}

function endG3() {
  showGameEnd('<img src="slike/dino-detective.png" style="width:100px;">', 'Sjajan detektiv!', `Dino-jaja: ${g3RoundScore * (currentLevel === 'hard' ? 2 : 1)} od ${g3MaxRounds * (currentLevel === 'hard' ? 2 : 1)}`, () => startGame('g3'));
}

// ═══════════════════════════════════════════
// IGRA 4: KLIKNI OBJEKTE KOJI SE POJAVE
// ═══════════════════════════════════════════
const G4_TARGETS = ['⭐','🌟','✨','💫',];
const G4_DISTRACTORS = ['💧','🔴','🟦','⬛','🟫','💜'];
let g4Interval = null, g4TimerInterval = null;
let g4TimeLeft = 30, g4Hits = 0, g4Misses = 0;
let g4ActiveObjects = [];

function initG4() {
  g4Hits = 0; g4Misses = 0; g4TimeLeft = 30;
  document.getElementById('g4-score').textContent = gameScores.g4;
  document.getElementById('g4-hit').textContent = '0';
  document.getElementById('g4-miss').textContent = '0';
  document.getElementById('g4-time').textContent = '30s';
  document.getElementById('g4-timer-fill').style.width = '100%';
  document.getElementById('g4-arena').innerHTML = '';
  renderStarMeter('g4-stars', 0, 10);
  document.getElementById('g4-instr').textContent = 'Klikni zvjezdice što brže možeš! Izbjegavaj ostalo!';
  document.getElementById('g4-ready-btn').style.display = 'inline-block';
  playAudio('elevenlabs_ig4.mp3');
}

function startG4Game() {
  document.getElementById('g4-ready-btn').style.display = 'none';
  g4ActiveObjects = [];

  const spawnDelay = currentLevel === 'easy' ? 1200 : 800;
  g4Interval = setInterval(spawnG4Object, spawnDelay);
  g4TimerInterval = setInterval(tickG4Timer, 100);
}

function spawnG4Object() {
  const arena = document.getElementById('g4-arena');
  if (!arena) return;
  const isTarget = Math.random() < 0.6;
  const emoji = isTarget
    ? G4_TARGETS[Math.floor(Math.random() * G4_TARGETS.length)]
    : G4_DISTRACTORS[Math.floor(Math.random() * G4_DISTRACTORS.length)];

  const obj = document.createElement('div');
  obj.className = 'pop-object';
  obj.textContent = emoji;
  obj.dataset.target = isTarget ? '1' : '0';
  obj.style.background = isTarget ? '#FFF9C4' : '#F3F4F6';
  obj.style.left = (5 + Math.random() * 75) + '%';
  obj.style.top = (5 + Math.random() * 75) + '%';

  obj.onclick = (e) => clickG4Object(obj, isTarget, e);
  arena.appendChild(obj);
  g4ActiveObjects.push(obj);

  const lifespan = currentLevel === 'easy' ? 2500 : 1800;
  setTimeout(() => {
    if (obj.parentNode) {
      if (isTarget) { g4Misses++; updateG4Stats(); }
      obj.style.animation = 'popDisappear 0.3s forwards';
      setTimeout(() => obj.remove(), 300);
    }
  }, lifespan);
}

function clickG4Object(el, isTarget, ev) {
  if (!el.parentNode) return;
  el.onclick = null;
  if (isTarget) {
    g4Hits++;
    playSound('correct');
    spawnStar(ev.clientX, ev.clientY);
    el.style.animation = 'popDisappear 0.2s forwards';
    if (g4Hits % 3 === 0) {
      awardStars(1, 'g4', ev);
      renderStarMeter('g4-stars', Math.min(gameScores.g4, 10), 10);
    }
  } else {
    g4Misses++;
    playSound('wrong');
    el.style.background = '#FEE2E2';
    el.style.animation = 'popDisappear 0.3s forwards';
  }
  updateG4Stats();
  setTimeout(() => el.remove(), 300);
}

function updateG4Stats() {
  document.getElementById('g4-hit').textContent = g4Hits;
  document.getElementById('g4-miss').textContent = g4Misses;
}

function tickG4Timer() {
  g4TimeLeft -= 0.1;
  const pct = Math.max(0, (g4TimeLeft / 30) * 100);
  document.getElementById('g4-timer-fill').style.width = pct + '%';
  document.getElementById('g4-time').textContent = Math.ceil(g4TimeLeft) + 's';
  if (g4TimeLeft <= 0) {
    stopGame4();
    setTimeout(() => {
      showGameEnd('<img src="slike/dino-thunder.png" style="width:100px;">', 'Gotovo!', `Pogođeno: ${g4Hits} 🥚  Promašeno: ${g4Misses} ❌`, () => startGame('g4'));
    }, 300);
  }
}

function stopGame4() {
  clearInterval(g4Interval);
  clearInterval(g4TimerInterval);
  g4Interval = null; g4TimerInterval = null;
  const arena = document.getElementById('g4-arena');
  if (arena) arena.innerHTML = '';
}

// ═══════════════════════════════════════════
// IGRA 5: SLOŽI RIJEČ OD SLOVA
// ═══════════════════════════════════════════
let g5WordPool = [];
const G5_WORDS_EASY = [
  { word: 'MAČKA',  hint: '🐱 Životinja koja mijauče' },
  { word: 'KUĆA',   hint: '🏠 Tu stanujemo' },
  { word: 'DRVO',   hint: '🌳 Raste u šumi' },
  { word: 'RIBA',   hint: '🐟 Živi u vodi' },
  { word: 'AUTO',   hint: '🚗 Vozilo na 4 kotača' },
  { word: 'CVIJET', hint: '🌸 Lijepo miriši' },
  { word: 'LOPTA',  hint: '⚽ Igramo se njome' },
  { word: 'KRUH',   hint: '🍞 Jedemo ga svaki dan' },
  { word: 'MIŠ',    hint: '🐭 Mali glodavac' },
  { word: 'SUNCE',  hint: '☀️ Grije nas' },
  { word: 'KRAVA',  hint: '🐄 Daje mlijeko' },
  { word: 'VODA',   hint: '💧 Pijemo je' },
  { word: 'KONJ',   hint: '🐴 Jahamo ga' },
  { word: 'JABUKA', hint: '🍎 Crveno voće' },
  { word: 'GRAD',   hint: '🏙️ Veliko mjesto s puno ljudi' },
  { word: 'NOGA',   hint: '🦵 Hodamo njome' },
  { word: 'OKO',    hint: '👁️ Gledamo njime' },
  { word: 'KOSA',   hint: '💇 Raste na glavi' },
  { word: 'MRKVA',  hint: '🥕 Narančasto povrće' },
  { word: 'PATKA',  hint: '🦆 Pliva i kvakče' },
  { word: 'TORTA',  hint: '🎂 Jedemo za rođendan' },
  { word: 'LAMPA',  hint: '💡 Daje svjetlo' },
  { word: 'BROD',   hint: '🚢 Plovi morem' },
  { word: 'ZIMA',   hint: '❄️ Hladno godišnje doba' },
  { word: 'PILE',   hint: '🐥 Malo žuto ptičje' },
  { word: 'NEBO',   hint: '🌤️ Iznad nas, plavo' },
  { word: 'ŠKOLA',  hint: '🏫 Idemo učiti' },
  { word: 'PAS',    hint: '🐶 Čovjekov najbolji prijatelj' },
  { word: 'MEDO',   hint: '🐻 Veliki dlakavi medvjed' },
  { word: 'KRUŠKA', hint: '🍐 Žuto-zeleno voće' },
  { word: 'BANANA', hint: '🍌 Žuto tropsko voće' },
  { word: 'MIŠ',    hint: '🖱️ Koristimo uz računalo' },
  { word: 'KREVET', hint: '🛏️ Spavamo u njemu' },
  { word: 'VLAK',   hint: '🚂 Vozi po tračnicama' },
  { word: 'PAUK',   hint: '🕷️ Plete mrežu' },
];

const G5_WORDS_HARD = [
  { word: 'DINOSAUR',  hint: '🦕 Izumrla životinja' },
  { word: 'PRIJATELJ', hint: '👫 Netko tko ti je drag' },
  { word: 'ZVIJEZDA',  hint: '⭐ Sja na nebu noću' },
  { word: 'KNJIGA',    hint: '📚 Čitamo je' },
  { word: 'PTICA',     hint: '🐦 Leti po nebu' },
  { word: 'KAZALIŠTE', hint: '🎭 Gledamo predstave' },
  { word: 'PLANINA',   hint: '⛰️ Visoka i strma' },
  { word: 'RIJEKA',    hint: '🏞️ Teče prema moru' },
  { word: 'ABECEDA',   hint: '🔤 Sva slova zajedno' },
  { word: 'ŽIVOTINJA', hint: '🐾 Živo biće, nije biljka' },
  { word: 'ČOKOLADA',  hint: '🍫 Slatko i smeđe' },
  { word: 'SVEMIRAC',  hint: '👽 Živi negdje u svemiru' },
  { word: 'SLADOLED',  hint: '🍦 Hladan desert' },
  { word: 'VATROGASAC',hint: '🚒 Gasi požare' },
  { word: 'STOLICA',   hint: '🪑 Sjedimo na njoj' },
  { word: 'ZRAKOPLOV', hint: '✈️ Leti po nebu' },
  { word: 'MAĐIONIČAR',hint: '🪄 Izvodi trikove' },
  { word: 'LABRADOR',  hint: '🐕 Pasmina psa' },
  { word: 'KLAVIR',    hint: '🎹 Glazbeni instrument' },
  { word: 'PINGVIN',   hint: '🐧 Crno-bijela ptica' },
  { word: 'RAKETA',    hint: '🚀 Leti u svemir' },
  { word: 'TORNADO',   hint: '🌪️ Opasan vjetar' },
  { word: 'AVOKADO',   hint: '🥑 Zeleno voće' },
  { word: 'BALERINA',  hint: '🩰 Pleše na prstima' },
  { word: 'DUPIN',     hint: '🐬 Pametna morska životinja' },
  { word: 'GALAKSIJA', hint: '🌌 Ogromna zbirka zvijezda' },
  { word: 'HOBOTNICA', hint: '🐙 Živi u moru, 8 krakova' },
  { word: 'KOMPAS',    hint: '🧭 Pokazuje sjever' },
  { word: 'LEOPARD',   hint: '🐆 Veliki šareni mačak' },
  { word: 'TRAMVAJ',   hint: '🚋 Prijevoz u gradu' },
  { word: 'TENISICA',  hint: '👟 Nosimo na nogama' },
  { word: 'ASTRONOM',  hint: '🔭 Promatra zvijezde' },
  { word: 'KROKODIL',  hint: '🐊 Opasan reptil iz močvare' },
  { word: 'ČAROBNJAK', hint: '🧙 Baca čarolije' },
  { word: 'SUNCOKRET', hint: '🌻 Žuti cvijet koji prati sunce' },
  { word: 'SLONOVI',   hint: '🐘 Velike kopnene životinje' },
  { word: 'ZMAJEVI',   hint: '🐉 Mitska bića koja pušu vatru' },
  { word: 'VATROMET',  hint: '🎆 Šarene eksplozije na nebu' },
  { word: 'AKVARIJ',   hint: '🐠 Staklena posuda s ribama' },
];

let g5Round = 0, g5MaxRounds = 4, g5RoundScore = 0;
let g5CurrentWord = '', g5SelectedSlots = [];

function initG5() {
  g5Round = 0; g5RoundScore = 0;
  const words = currentLevel === 'easy' ? G5_WORDS_EASY : G5_WORDS_HARD;
  g5WordPool = shuffle([...words]).slice(0, g5MaxRounds);
  document.getElementById('g5-score').textContent = gameScores.g5;
  renderStarMeter('g5-stars', 0, g5MaxRounds);
  playAudio('elevenlabs_ig5.mp3');
  nextG5Round();
}

function nextG5Round() {
  if (g5Round >= g5MaxRounds) { endG5(); return; }
  const words = currentLevel === 'easy' ? G5_WORDS_EASY : G5_WORDS_HARD;
  const entry = g5WordPool[g5Round];
  g5CurrentWord = entry.word;
  g5SelectedSlots = new Array(g5CurrentWord.length).fill(null);

  const hintMatch = entry.hint.match(/^(\S+)\s(.+)$/);
  if (hintMatch) {
    document.getElementById('g5-hint').innerHTML = '<span style="font-size:2.8rem;line-height:1.2">' + hintMatch[1] + '</span><br>' + hintMatch[2];
  } else {
    document.getElementById('g5-hint').textContent = entry.hint;
  }
  document.getElementById('g5-instr').textContent = `Složi ${g5CurrentWord.length}-slovnu riječ!`;
  document.getElementById('g5-progress').textContent = `Runda ${g5Round + 1} od ${g5MaxRounds}`;

  renderG5Slots();
  renderG5Pool();
}

function renderG5Slots() {
  const container = document.getElementById('g5-slots');
  container.innerHTML = '';
  g5CurrentWord.split('').forEach((_, i) => {
    const slot = document.createElement('div');
    slot.className = 'g5-slot';
    slot.dataset.index = i;
    slot.onclick = () => removeFromSlot(i);
    container.appendChild(slot);
  });
}

function renderG5Pool() {
  const pool = document.getElementById('g5-pool');
  pool.innerHTML = '';
  // shuffle letters + add 2 decoys on hard
  const letters = g5CurrentWord.split('');
  const allDecoys = ['E','R','K','J','Z','F','H','V'];
  const decoys = currentLevel === 'hard' ? shuffle(allDecoys).slice(0, 2) : [];
  const allLetters = shuffle([...letters, ...decoys]);

  allLetters.forEach((letter, i) => {
    const tile = document.createElement('div');
    tile.className = 'g5-tile';
    tile.textContent = letter;
    tile.dataset.poolIndex = i;
    tile.onclick = () => placeInSlot(tile, letter);
    pool.appendChild(tile);
  });
}

function placeInSlot(tile, letter) {
  if (tile.classList.contains('selected')) return;
  const firstEmpty = g5SelectedSlots.indexOf(null);
  if (firstEmpty === -1) return;

  g5SelectedSlots[firstEmpty] = { letter, tile };
  tile.classList.add('selected');

  const slot = document.getElementById('g5-slots').children[firstEmpty];
  slot.textContent = letter;
  slot.classList.add('filled');
}

function removeFromSlot(index) {
  if (!g5SelectedSlots[index]) return;
  const { tile } = g5SelectedSlots[index];
  tile.classList.remove('selected');
  g5SelectedSlots[index] = null;

  const slot = document.getElementById('g5-slots').children[index];
  slot.textContent = '';
  slot.classList.remove('filled', 'correct-slot', 'wrong-slot');
}

function resetG5() {
  g5SelectedSlots = new Array(g5CurrentWord.length).fill(null);
  renderG5Slots();
  renderG5Pool();
}

function checkG5() {
  if (g5SelectedSlots.includes(null)) {
    return;
  }
  const slots = document.getElementById('g5-slots').children;
  let allCorrect = true;
  g5SelectedSlots.forEach(({ letter }, i) => {
    const correct = letter === g5CurrentWord[i];
    slots[i].classList.add(correct ? 'correct-slot' : 'wrong-slot');
    if (!correct) allCorrect = false;
  });

  showFeedback(allCorrect);
  if (allCorrect) {
    awardStars(2, 'g5', { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
    g5RoundScore++;
    renderStarMeter('g5-stars', g5RoundScore, g5MaxRounds);
    g5Round++;
    setTimeout(nextG5Round, 1500);
  } else {
    setTimeout(resetG5, 1500);
  }
}

function endG5() {
  showGameEnd('<img src="slike/dino-words-happy.png" style="width:100px;">', 'Pravi si jezični prvak!', `Dino-jaja: ${g5RoundScore * (currentLevel === 'hard' ? 4 : 2)} od ${g5MaxRounds * (currentLevel === 'hard' ? 4 : 2)}`, () => startGame('g5'));
}

// ─── UTIL ───
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── MASCOT MESSAGES ───
const mascotMsgs = ['Učiš super! 🌟', 'Daj sve od sebe! 💪', 'Sjajan si! ⭐', 'Naprijed, heroju! 🦕'];
setInterval(() => {
  document.getElementById('home-mascot').title = mascotMsgs[Math.floor(Math.random() * mascotMsgs.length)];
}, 3000);

// ─── THEME TOGGLE ───
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  const btn = document.getElementById('theme-toggle');
  btn.textContent = isDark ? '☀️ Svijetla tema' : '🌙 Tamna tema';
  localStorage.setItem('fokusaurus-theme', isDark ? 'dark' : 'light');
}

function toggleOptions() {
  const section = document.getElementById('options-section');
  const btn = document.getElementById('options-btn');
  const open = section.style.display === 'none';
  section.style.display = open ? 'flex' : 'none';
  btn.textContent = open ? '⚙️ Opcije ▲' : '⚙️ Opcije';
}

// Load saved theme on startup
(function() {
  const saved = localStorage.getItem('fokusaurus-theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = '☀️ Svijetla tema';
  }
})();
