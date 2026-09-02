// ==========================================================================
// NEO TOKYO ARCADE // Client-Side Socket & Audio Controller
// ==========================================================================

const socket = io();

// Local State
let myUsername = null;
let mySymbol = null;
let isMyTurn = false;
let gameActive = false;
let currentBoard = Array(9).fill(null);
let playersList = [];
let soundEnabled = true;
let crtEnabled = true;

// DOM Elements
const connectionStatusEl = document.getElementById('connection-status');
const connectionTextEl = document.getElementById('connection-text');
const onlineCountEl = document.getElementById('online-count');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const soundIcon = document.getElementById('sound-icon');
const crtToggleBtn = document.getElementById('crt-toggle-btn');

// Login Elements
const loginSection = document.getElementById('login-section');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const loginErrorMsg = document.getElementById('login-error-msg');
const roomSlotsPreview = document.getElementById('room-slots-preview');

// Game Arena Elements
const gameSection = document.getElementById('game-section');
const cardPlayerX = document.getElementById('card-player-x');
const cardPlayerO = document.getElementById('card-player-o');
const namePlayerX = document.getElementById('name-player-x');
const namePlayerO = document.getElementById('name-player-o');
const turnBadgeX = document.getElementById('turn-badge-x');
const turnBadgeO = document.getElementById('turn-badge-o');
const gameStatusBanner = document.getElementById('game-status-banner');
const boardGrid = document.getElementById('tic-tac-toe-board');
const cells = document.querySelectorAll('.arcade-cell');
const resetBtn = document.getElementById('reset-btn');

// Winner Modal Elements
const winnerModal = document.getElementById('winner-modal');
const modalKoStamp = document.getElementById('modal-ko-stamp');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalBodyText = document.getElementById('modal-body-text');
const modalRank = document.getElementById('modal-rank');
const modalResetBtn = document.getElementById('modal-reset-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');

// History Table Elements
const historyTbody = document.getElementById('history-tbody');
const refreshHistoryBtn = document.getElementById('refresh-history-btn');

/* ==========================================================================
   Retro 8-Bit Web Audio Synthesizer (Zero External Assets)
   ========================================================================== */
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 8-bit coin insertion sound
function playCoinSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(987.77, now); // B5
  osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.35);
}

// Move placement sound (Laser/Chime)
function playMoveSound(symbol) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  if (symbol === 'X') {
    // Cyber Laser Slash
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
  } else {
    // Sakura Energy Pulse
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);
}

// Button click beep
function playBeepSound(freq = 520, duration = 0.05) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

// Victory Fanfare
function playVictorySound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, High C
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + i * 0.1;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.25);
  });
}

// Draw sound
function playDrawSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [400, 350, 300];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + i * 0.12;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.2);
  });
}

/* ==========================================================================
   Sound & CRT Toggles
   ========================================================================== */
soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundIcon.className = soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
  soundToggleBtn.querySelector('span').textContent = soundEnabled ? 'SFX: ON' : 'SFX: OFF';
  if (soundEnabled) playBeepSound(700);
});

crtToggleBtn.addEventListener('click', () => {
  crtEnabled = !crtEnabled;
  document.body.classList.toggle('scanlines-active', crtEnabled);
  crtToggleBtn.querySelector('span').textContent = crtEnabled ? 'CRT: ON' : 'CRT: OFF';
  playBeepSound(400);
});

/* ==========================================================================
   Socket.io Connection Status
   ========================================================================== */
socket.on('connect', () => {
  connectionStatusEl.classList.add('status-connected');
  connectionTextEl.textContent = 'NET: ONLINE';
});

socket.on('disconnect', () => {
  connectionStatusEl.classList.remove('status-connected');
  connectionTextEl.textContent = 'NET: OFFLINE';
});

socket.on('connect_error', () => {
  connectionStatusEl.classList.remove('status-connected');
  connectionTextEl.textContent = 'NET: ERROR';
});

socket.on('active-players-count', (count) => {
  onlineCountEl.textContent = count;
});

/* ==========================================================================
   User Login Handling
   ========================================================================== */
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (username) {
    playCoinSound();
    loginErrorMsg.style.display = 'none';
    socket.emit('user-login', { username });
  }
});

socket.on('login-error', (data) => {
  playBeepSound(220, 0.2);
  loginErrorMsg.textContent = `⚠️ ${data.message}`;
  loginErrorMsg.style.display = 'block';
});

socket.on('login-success', (data) => {
  myUsername = data.username;
  mySymbol = data.symbol;

  loginSection.style.display = 'none';
  gameSection.style.display = 'block';
  playCoinSound();
});

/* ==========================================================================
   Player Updates & Room State Sync
   ========================================================================== */
socket.on('players-update', (data) => {
  playersList = data.players || [];
  updateRoomPreview(playersList);
  updatePlayersBar(playersList, data.currentTurn);
});

function updateRoomPreview(players) {
  const pX = players.find(p => p.symbol === 'X');
  const pO = players.find(p => p.symbol === 'O');

  roomSlotsPreview.innerHTML = `
    <div class="slot-badge ${pX ? 'active' : 'empty'}">
      <span class="slot-symbol x-sym">1P [X]</span>
      <div class="slot-user"><i class="fa-solid fa-user-ninja"></i> ${pX ? `<strong>${escapeHtml(pX.username)}</strong>` : '<em>WAITING FOR PILOT...</em>'}</div>
    </div>
    <div class="slot-badge ${pO ? 'active' : 'empty'}">
      <span class="slot-symbol o-sym">2P [O]</span>
      <div class="slot-user"><i class="fa-solid fa-user-astronaut"></i> ${pO ? `<strong>${escapeHtml(pO.username)}</strong>` : '<em>WAITING FOR PILOT...</em>'}</div>
    </div>
  `;
}

function updatePlayersBar(players, turn) {
  const pX = players.find(p => p.symbol === 'X');
  const pO = players.find(p => p.symbol === 'O');

  namePlayerX.textContent = pX ? pX.username : 'WAITING...';
  namePlayerO.textContent = pO ? pO.username : 'WAITING...';

  if (!pX || !pO) {
    gameActive = false;
    gameStatusBanner.className = 'battle-announcer-banner';
    gameStatusBanner.innerHTML = `<span class="announcer-icon"><i class="fa-solid fa-satellite-dish fa-fade"></i></span> <span class="announcer-text">⚡ WAITING FOR 2P (PLAYER 2) TO JOIN... (Open another tab or window to start duel!)</span>`;
  }
}

/* ==========================================================================
   Game Start & Turns
   ========================================================================== */
socket.on('game-start', (data) => {
  gameActive = true;
  currentBoard = data.board;
  updateTurnDisplay(data.turn);
  renderBoard(currentBoard);
  playVictorySound();
});

function updateTurnDisplay(turn) {
  cardPlayerX.classList.remove('active-turn');
  cardPlayerO.classList.remove('active-turn');

  if (turn === 'X') {
    cardPlayerX.classList.add('active-turn');
  } else if (turn === 'O') {
    cardPlayerO.classList.add('active-turn');
  }

  isMyTurn = (mySymbol === turn);

  const currentTurnPlayer = playersList.find(p => p.symbol === turn);
  const turnPlayerName = currentTurnPlayer ? currentTurnPlayer.username : `PLAYER ${turn}`;

  if (isMyTurn) {
    gameStatusBanner.className = 'battle-announcer-banner active-turn-banner';
    gameStatusBanner.innerHTML = `<span class="announcer-icon"><i class="fa-solid fa-bolt fa-beat"></i></span> <span class="announcer-text">YOUR TURN (${mySymbol})! CLICK ANY EMPTY CELL TO MAKE YOUR MOVE!</span>`;
  } else {
    gameStatusBanner.className = 'battle-announcer-banner';
    gameStatusBanner.innerHTML = `<span class="announcer-icon"><i class="fa-solid fa-crosshairs"></i></span> <span class="announcer-text">STANDBY // OPPONENT <strong>${escapeHtml(turnPlayerName)} (${turn})</strong> IS CHOOSING MOVE...</span>`;
  }
}

/* ==========================================================================
   3x3 Grid Interactions
   ========================================================================== */
cells.forEach((cell) => {
  cell.addEventListener('click', () => {
    const index = parseInt(cell.getAttribute('data-index'));

    if (!myUsername) {
      alert('Please join the game arena first.');
      return;
    }

    if (!gameActive) {
      playBeepSound(220, 0.15);
      alert('⏳ Waiting for Player 2 to join! Please open a 2nd browser window/tab and join as Player 2 to begin the match.');
      return;
    }

    if (!isMyTurn) {
      playBeepSound(220, 0.1);
      alert(`✋ It is not your turn yet! Waiting for Player ${mySymbol === 'X' ? 'O' : 'X'} to make their move.`);
      return;
    }

    if (currentBoard[index] !== null) {
      playBeepSound(220, 0.05);
      return;
    }

    playBeepSound(650, 0.06);
    socket.emit('make-move', { index, symbol: mySymbol });
  });
});

socket.on('move-made', (data) => {
  currentBoard = data.board;
  if (data.nextTurn) {
    updateTurnDisplay(data.nextTurn);
  }
  renderBoard(currentBoard);
  playMoveSound(data.symbol);
});

socket.on('move-error', (data) => {
  playBeepSound(220, 0.2);
  alert(`⚠️ ${data.message}`);
});

function renderBoard(board) {
  cells.forEach((cell, index) => {
    const value = board[index];
    const contentEl = cell.querySelector('.cell-content');
    if (contentEl) {
      contentEl.textContent = value || '';
    } else {
      cell.textContent = value || '';
    }
    cell.className = 'arcade-cell';

    if (value === 'X') {
      cell.classList.add('x');
    } else if (value === 'O') {
      cell.classList.add('o');
    }
  });
}

/* ==========================================================================
   Game Over & K.O. Modal Handling
   ========================================================================== */
socket.on('game-over', (data) => {
  gameActive = false;
  renderBoard(data.board);

  // Highlight winning line if won
  if (data.winningLine && Array.isArray(data.winningLine)) {
    data.winningLine.forEach(idx => {
      cells[idx].classList.add('winning-cell');
    });
  }

  // Display Winner Modal
  if (data.result === 'win') {
    playVictorySound();
    modalKoStamp.textContent = 'K.O.!';
    modalKoStamp.style.color = '#ff0055';
    modalIcon.innerHTML = `<i class="fa-solid fa-trophy"></i>`;
    modalTitle.textContent = data.winner === myUsername ? '★ VICTORY ACHIEVED ★' : '★ MATCH FINISHED ★';
    modalBodyText.innerHTML = `PILOT <strong>${escapeHtml(data.winner)}</strong> [${data.symbol}] DOMINATED THE ARENA!`;
    modalRank.textContent = 'SSS';
  } else {
    playDrawSound();
    modalKoStamp.textContent = 'DRAW!';
    modalKoStamp.style.color = '#ffe600';
    modalIcon.innerHTML = `<i class="fa-solid fa-handshake"></i>`;
    modalTitle.textContent = '★ STALEMATE // 引き分け ★';
    modalBodyText.textContent = 'BOTH FIGHTERS TIED IN CYBER COMBAT!';
    modalRank.textContent = 'A';
  }

  winnerModal.style.display = 'flex';

  if (data.history) {
    renderHistoryTable(data.history);
  }
});

/* ==========================================================================
   Reset Game Logic
   ========================================================================== */
resetBtn.addEventListener('click', () => {
  playBeepSound(480);
  socket.emit('reset-game');
});

modalResetBtn.addEventListener('click', () => {
  playCoinSound();
  winnerModal.style.display = 'none';
  socket.emit('reset-game');
});

modalCloseBtn.addEventListener('click', () => {
  playBeepSound(300);
  winnerModal.style.display = 'none';
});

socket.on('game-reset', (data) => {
  winnerModal.style.display = 'none';
  gameActive = data.gameActive;
  currentBoard = data.board;

  cells.forEach(cell => {
    cell.className = 'arcade-cell';
    const contentEl = cell.querySelector('.cell-content');
    if (contentEl) contentEl.textContent = '';
  });

  if (data.turn) {
    updateTurnDisplay(data.turn);
  }
  renderBoard(currentBoard);
});

socket.on('player-left', (data) => {
  playBeepSound(220, 0.3);
  alert(data.message);
  gameActive = false;
  currentBoard = Array(9).fill(null);
  renderBoard(currentBoard);
  gameStatusBanner.className = 'battle-announcer-banner';
  gameStatusBanner.innerHTML = `<span class="announcer-icon"><i class="fa-solid fa-triangle-exclamation"></i></span> <span class="announcer-text">PILOT DISCONNECTED. WAITING FOR NEW CHALLENGER...</span>`;
});

/* ==========================================================================
   Game History Table Rendering (Supabase DB)
   ========================================================================== */
refreshHistoryBtn.addEventListener('click', () => {
  playBeepSound(550);
  socket.emit('fetch-history');
});

socket.on('history-update', (history) => {
  renderHistoryTable(history);
});

function renderHistoryTable(history) {
  if (!history || history.length === 0) {
    historyTbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">NO MATCH RECORDS RECORDED. COMMENCE DUEL!</td>
      </tr>
    `;
    return;
  }

  historyTbody.innerHTML = history.map((item, index) => {
    const formattedDate = item.created_at
      ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(item.created_at).toLocaleDateString()
      : 'RECENT';

    const isDraw = item.winner === 'Draw';
    const victorClass = isDraw ? 'victor-tag victor-draw' : 'victor-tag victor-win';

    let rankBadge = `<span class="rank-badge rank-other">#${index + 1}</span>`;
    if (index === 0) rankBadge = `<span class="rank-badge rank-1">1ST</span>`;
    else if (index === 1) rankBadge = `<span class="rank-badge rank-2">2ND</span>`;
    else if (index === 2) rankBadge = `<span class="rank-badge rank-3">3RD</span>`;

    return `
      <tr>
        <td>${rankBadge}</td>
        <td><strong style="color: var(--neon-cyan)">${escapeHtml(item.player_x)}</strong></td>
        <td><strong style="color: var(--neon-magenta)">${escapeHtml(item.player_o)}</strong></td>
        <td><span class="${victorClass}">${escapeHtml(item.winner)}</span></td>
        <td><strong style="color: var(--neon-yellow)">${item.total_moves}</strong></td>
        <td><small style="color: #7b88b3">${formattedDate}</small></td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
