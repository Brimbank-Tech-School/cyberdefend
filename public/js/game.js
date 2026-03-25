// ══════════════════════════════════════════════════════════
//  CyberDefend — Game Client
//  Handles socket events, lobby UI, map rendering, and
//  wiring challenge submissions back to the server.
// ══════════════════════════════════════════════════════════

const socket = io();

// ── Client State ─────────────────────────────────────────
const client = {
  myRole: null,
  myName: null,
  rooms: {},
  scores: { hacker: 0, controller: 0 },
  secondsRemaining: 600,
  currentRoomId: null,
  players: { hacker: '', controller: '' },
  inRoom: false,
  isPractice: false,
  aiRole: null,
  pendingChallenge: null,
};

// ── Practice Mode State ───────────────────────────────────
const practice = {
  role: 'hacker',
  difficulty: 'easy',
  tab: 'pvp',
};

// ── Utility ───────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = $(`${name}-view`);
  if (el) el.classList.add('active');
}

function showEl(id)  { const e = $(id); if (e) e.classList.remove('hidden'); }
function hideEl(id)  { const e = $(id); if (e) e.classList.add('hidden'); }

// ── Lobby Logic ───────────────────────────────────────────
// ── Tab switching ─────────────────────────────────────────
function switchTab(tab) {
  practice.tab = tab;
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  $(`tab-${tab}`).classList.add('active');
  if (tab === 'pvp') {
    showEl('pvp-section');
    hideEl('practice-section');
  } else {
    hideEl('pvp-section');
    showEl('practice-section');
  }
}

function setPracticeRole(role) {
  practice.role = role;
  $('practice-hacker').classList.toggle('active', role === 'hacker');
  $('practice-controller').classList.toggle('active', role === 'controller');
}

function setDifficulty(diff) {
  practice.difficulty = diff;
  ['easy', 'medium', 'hard'].forEach(d => {
    $(`diff-${d}`).classList.toggle('active', d === diff);
  });
}

function startPractice() {
  const name = $('player-name-input').value.trim();
  if (!name) { showLobbyError('Please enter your name.'); return; }
  client.myName = name;
  socket.emit('start_practice', {
    playerName: name,
    playerRole: practice.role,
    difficulty: practice.difficulty,
  });
}

$('join-btn').addEventListener('click', () => {
  const name = $('player-name-input').value.trim();
  if (!name) {
    showLobbyError('Please enter your name.');
    return;
  }
  client.myName = name;
  socket.emit('join_lobby', { playerName: name });
});

$('player-name-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    if (practice.tab === 'practice') startPractice();
    else $('join-btn').click();
  }
});

function showLobbyError(msg) {
  const el = $('lobby-error');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

function selectRole(role) {
  socket.emit('select_role', { role });
}

function setReady() {
  socket.emit('set_ready');
}

socket.on('lobby_update', (data) => {
  hideEl('name-section');
  showEl('lobby-players-section');

  // Update slots
  data.players.forEach((p, i) => {
    const slot = $(`slot-${i}`);
    if (!slot) return;
    slot.querySelector('.slot-name').textContent = p.name || 'Waiting...';
    const roleEl = slot.querySelector('.slot-role');
    roleEl.textContent = p.role
      ? (p.role === 'hacker' ? '💀 Hacker' : '🛡️ Cyber Controller')
      : (p.ready ? '⏳ Ready' : '');
    roleEl.className = 'slot-role ' + (p.role || '');
  });

  // Show/hide role selection for me
  const myEntry = data.players.find(p => {
    // We identify ourselves by name (simplification)
    return p.name === client.myName;
  });

  if (myEntry !== undefined) {
    showEl('role-section');
  }

  // Update role card availability
  const hackerCard = $('hacker-card');
  const controllerCard = $('controller-card');
  const hackerBadge = $('hacker-badge');
  const controllerBadge = $('controller-badge');

  // Reset classes first
  hackerCard.classList.remove('disabled', 'selected-hacker');
  controllerCard.classList.remove('disabled', 'selected-controller');

  const myPlayer = data.players.find(p => p.name === client.myName);
  const otherPlayer = data.players.find(p => p.name !== client.myName);

  if (myPlayer && myPlayer.role === 'hacker') {
    hackerCard.classList.add('selected-hacker');
    hackerBadge.textContent = '✓ YOUR ROLE';
  } else {
    hackerBadge.textContent = '';
  }
  if (myPlayer && myPlayer.role === 'controller') {
    controllerCard.classList.add('selected-controller');
    controllerBadge.textContent = '✓ YOUR ROLE';
  } else {
    controllerBadge.textContent = '';
  }

  // Disable taken roles (by other player)
  if (otherPlayer) {
    if (otherPlayer.role === 'hacker' && (!myPlayer || myPlayer.role !== 'hacker')) {
      hackerCard.classList.add('disabled');
      hackerBadge.textContent = 'TAKEN';
    }
    if (otherPlayer.role === 'controller' && (!myPlayer || myPlayer.role !== 'controller')) {
      controllerCard.classList.add('disabled');
      controllerBadge.textContent = 'TAKEN';
    }
  }

  // Ready button
  if (myPlayer && myPlayer.role) {
    showEl('ready-btn');
  } else {
    hideEl('ready-btn');
  }

  // Ready state messages
  const allReady = data.players.length === 2 && data.players.every(p => p.ready && p.role);
  const readyMsg = $('ready-msg');
  if (data.players.length < 2) {
    readyMsg.textContent = 'Waiting for second player to join...';
  } else if (!data.players.every(p => p.role)) {
    readyMsg.textContent = 'Both players need to select a role.';
  } else if (!myPlayer || !myPlayer.ready) {
    readyMsg.textContent = 'Click READY when you\'re set!';
  } else if (allReady) {
    readyMsg.textContent = '✓ Both players ready — starting game!';
  } else {
    readyMsg.textContent = 'Waiting for opponent to ready up...';
  }
});

socket.on('role_taken', ({ role }) => {
  showLobbyError(`The ${role} role has already been taken!`);
});

socket.on('error_msg', ({ message }) => {
  showLobbyError(message);
});

// ── Game Start ────────────────────────────────────────────
socket.on('game_start', (data) => {
  client.myRole = data.yourRole;
  client.rooms = data.rooms;
  client.scores = { hacker: 0, controller: 0 };
  client.secondsRemaining = data.secondsRemaining;
  client.players = data.players;
  client.currentRoomId = null;
  client.inRoom = false;
  client.isPractice = data.isPractice || false;
  client.aiRole = data.aiRole || null;

  showView('game');
  setupHUD();
  buildMap();

  if (client.isPractice) {
    const feed = $('ai-feed');
    feed.classList.remove('hidden');
    feed.classList.toggle('controller-ai', client.aiRole === 'controller');
    feed.innerHTML = `<span class="ai-tag">🤖 CPU</span><span class="ai-msg">AI is ready — game starting!</span>`;
  }
});

function setupHUD() {
  const isHacker = client.myRole === 'hacker';

  // Role banner
  const banner = $('role-banner');
  banner.className = client.myRole;
  $('role-banner-icon').textContent = isHacker ? '💀' : '🛡️';
  $('role-banner-text').textContent = isHacker
    ? 'YOU ARE THE HACKER — Turn rooms RED'
    : 'YOU ARE THE CYBER CONTROLLER — Turn rooms GREEN';

  // Scores
  $('hacker-name-hud').textContent = client.players.hacker;
  $('controller-name-hud').textContent = client.players.controller;
  updateScores();
  updateTimer();
}

function updateScores() {
  $('hacker-score').textContent = client.scores.hacker;
  $('controller-score').textContent = client.scores.controller;
}

function updateTimer() {
  const s = client.secondsRemaining;
  const mins = Math.floor(s / 60).toString().padStart(2, '0');
  const secs = (s % 60).toString().padStart(2, '0');
  const timerEl = $('timer-display');
  timerEl.textContent = `${mins}:${secs}`;
  timerEl.className = 'timer';
  if (s <= 30) timerEl.classList.add('critical');
  else if (s <= 60) timerEl.classList.add('warning');
}

// ── Map Rendering ─────────────────────────────────────────
function buildMap() {
  const grid = $('room-grid');
  grid.innerHTML = '';

  Object.values(client.rooms).forEach(room => {
    const cell = document.createElement('div');
    cell.className = `room-cell status-${room.status}`;
    cell.id = `room-${room.id}`;
    cell.style.gridColumn = room.col + 1;
    cell.style.gridRow = room.row + 1;

    cell.innerHTML = `
      <div class="room-icon">${room.icon}</div>
      <div class="room-name">${room.name}</div>
      <div class="room-status-dot"></div>
      <div class="room-occupants" id="occ-${room.id}"></div>
      ${room.usbPlanted ? '<div class="room-usb">💾</div>' : ''}
    `;

    cell.addEventListener('click', () => enterRoom(room.id));
    grid.appendChild(cell);
  });
}

function updateRoomCell(roomId) {
  const room = client.rooms[roomId];
  if (!room) return;
  const cell = $(`room-${roomId}`);
  if (!cell) return;

  cell.className = `room-cell status-${room.status}`;
  if (roomId === client.currentRoomId) cell.classList.add('active-room');

  // Update USB icon
  const existingUsb = cell.querySelector('.room-usb');
  if (existingUsb) existingUsb.remove();
  if (room.usbPlanted) {
    const usbEl = document.createElement('div');
    usbEl.className = 'room-usb';
    usbEl.textContent = '💾';
    cell.appendChild(usbEl);
  }
}

// ── Room Interaction ──────────────────────────────────────
function enterRoom(roomId) {
  if (client.currentRoomId === roomId) return;
  socket.emit('enter_room', { roomId });
}

function leaveRoom() {
  socket.emit('leave_room');
}

socket.on('room_entered', ({ roomId, challengeType, challengeData, roomStatus, usbPlanted }) => {
  if (client.currentRoomId) {
    const prev = $(`room-${client.currentRoomId}`);
    if (prev) prev.classList.remove('active-room');
  }
  client.currentRoomId = roomId;
  client.inRoom = true;
  client.pendingChallenge = { challengeType, challengeData, roomStatus, usbPlanted };

  const cell = $(`room-${roomId}`);
  if (cell) cell.classList.add('active-room');

  const room = client.rooms[roomId];
  hideEl('panel-idle');
  showEl('panel-room');
  $('room-panel-icon').textContent = room ? room.icon : '🏫';
  $('room-panel-name').textContent = room ? room.name : roomId;
  $('room-panel-challenge-label').textContent = '🔍 Explore the room...';
  $('challenge-area').innerHTML = '<p class="explore-hint">Navigate with <strong>Arrow keys</strong> or <strong>WASD</strong>.<br>Press <strong>[E]</strong> or click objects to interact.<br>Find the cyber challenge hidden in the room!</p>';

  openExplorer(roomId);
});

function openExplorer(roomId) {
  $('room-grid').style.display = 'none';
  showEl('explorer-wrap');
  $('game-body').classList.add('explorer-mode');
  const canvas = $('explorer-canvas');
  canvas.width = 900; canvas.height = 540;
  canvas.style.width = ''; canvas.style.height = '';
  // Use window dimensions — wrap.clientHeight unreliable with flex height:100%
  function sizeExplorerCanvas() {
    const aiFeedEl = $('ai-feed');
    const aiFeedH  = (aiFeedEl && !aiFeedEl.classList.contains('hidden')) ? (aiFeedEl.offsetHeight || 30) : 0;
    const hudH     = $('hud')         ? $('hud').offsetHeight         : 64;
    const bannerH  = $('role-banner') ? $('role-banner').offsetHeight : 40;
    const panelH   = 280;
    const W = Math.max(200, window.innerWidth  - 8);
    const H = Math.max(100, window.innerHeight - hudH - bannerH - aiFeedH - panelH - 12);
    const ratio = 900 / 540;
    if (W / H > ratio) {
      canvas.style.height = H + 'px';
      canvas.style.width  = Math.floor(H * ratio) + 'px';
    } else {
      canvas.style.width  = W + 'px';
      canvas.style.height = Math.floor(W / ratio) + 'px';
    }
  }
  requestAnimationFrame(() => requestAnimationFrame(sizeExplorerCanvas));
  if (window._explorerResizer) window.removeEventListener('resize', window._explorerResizer);
  window._explorerResizer = sizeExplorerCanvas;
  window.addEventListener('resize', sizeExplorerCanvas);
  if (window._roomExplorer) { window._roomExplorer.destroy(); window._roomExplorer = null; }
  window._roomExplorer = new RoomExplorer({
    canvas, roomId, role: client.myRole,
    onChallenge: () => {
      const pc = client.pendingChallenge;
      if (!pc) return;
      // Hide the explorer overlay so the challenge side panel is visible
      hideEl('explorer-wrap');
      $('room-panel-challenge-label').textContent = getChallengeLabel(pc.challengeType);
      renderChallenge(pc.challengeType, pc.challengeData, client.myRole, client.currentRoomId, pc.roomStatus, pc.usbPlanted);
    },
    onLeave: () => { leaveRoom(); },
  });
}

function closeExplorer() {
  if (window._explorerResizer) { window.removeEventListener('resize', window._explorerResizer); window._explorerResizer = null; }
  if (window._roomExplorer) { window._roomExplorer.destroy(); window._roomExplorer = null; }
  hideEl('explorer-wrap');
  $('game-body').classList.remove('explorer-mode');
  $('room-grid').style.display = '';
}

socket.on('room_left', () => {
  if (client.currentRoomId) {
    const cell = $(`room-${client.currentRoomId}`);
    if (cell) cell.classList.remove('active-room');
  }
  client.currentRoomId = null;
  client.inRoom = false;
  client.pendingChallenge = null;
  closeExplorer();
  showEl('panel-idle');
  hideEl('panel-room');
});

socket.on('room_occupancy_update', ({ roomId, occupant, prevRoomId }) => {
  // Update occupant display
  if (prevRoomId) {
    const prevOcc = $(`occ-${prevRoomId}`);
    if (prevOcc) {
      // Remove this role's indicator
      const existing = prevOcc.querySelector(`.occ-${occupant === 'hacker' ? 'hacker' : 'controller'}`);
      // Actually we need to track what's in there; simpler: rebuild from rooms
    }
  }
  if (client.rooms[roomId]) {
    client.rooms[roomId].occupant = occupant;
  }
  if (prevRoomId && client.rooms[prevRoomId]) {
    // Clear occupant from prev room only if it matches
    if (client.rooms[prevRoomId].occupant === (occupant || 'unknown')) {
      // We don't know which role left, leave it as is - server state is authoritative
    }
  }
  updateOccupants(roomId);
  if (prevRoomId) updateOccupants(prevRoomId);
});

function updateOccupants(roomId) {
  const room = client.rooms[roomId];
  if (!room) return;
  const occ = $(`occ-${roomId}`);
  if (!occ) return;
  occ.innerHTML = '';
  if (room.occupant) {
    const dot = document.createElement('span');
    dot.title = room.occupant === 'hacker' ? 'Hacker is here' : 'Controller is here';
    dot.textContent = room.occupant === 'hacker' ? '💀' : '🛡️';
    dot.style.fontSize = '0.7rem';
    occ.appendChild(dot);
  }
}

// ── Challenge Submission ──────────────────────────────────
window.submitChallengeAnswer = function(answer) {
  const cs = window.challengeState;
  socket.emit('challenge_attempt', { roomId: cs.roomId, answer });
};

socket.on('challenge_result', ({ success, roomId, newStatus, message }) => {
  showChallengeResult(success, message);
  if (success) {
    if (client.rooms[roomId]) {
      client.rooms[roomId].status = newStatus;
      updateRoomCell(roomId);
    }
    // Auto-leave room after brief delay so player can see the result
    setTimeout(() => leaveRoom(), 1600);
  } else {
    // Show explorer again and unfreeze so player can try again or explore more
    if (window._roomExplorer) {
      showEl('explorer-wrap');
      window._roomExplorer.frozen = false;
    }
  }
});

socket.on('room_state_update', ({ roomId, status, usbPlanted, scores }) => {
  if (client.rooms[roomId]) {
    client.rooms[roomId].status = status;
    client.rooms[roomId].usbPlanted = usbPlanted;
  }
  client.scores = scores;
  updateRoomCell(roomId);
  updateScores();

  // If we're in this room, update the status bar and USB in challenge
  if (client.currentRoomId === roomId) {
    const statusBar = $('room-panel-status-bar');
    if (statusBar) {
      const labels = { neutral: 'NEUTRAL — Unclaimed', red: '⚠ HACKED — Room Compromised', green: '✓ SECURED — Room Protected' };
      statusBar.textContent = labels[status] || status.toUpperCase();
      statusBar.className = `status-bar-${status}`;
    }
    updateUsbInChallenge(usbPlanted);
  }
});

// ── Timer ─────────────────────────────────────────────────
socket.on('tick', ({ secondsRemaining }) => {
  client.secondsRemaining = secondsRemaining;
  updateTimer();
});

// ── Game Over ─────────────────────────────────────────────
socket.on('game_over', ({ winner, scores, rooms, hackerName, controllerName }) => {
  client.rooms = rooms;
  client.scores = scores;

  // Update all room cells
  Object.values(rooms).forEach(r => updateRoomCell(r.id));
  updateScores();

  const overlay = $('game-over-overlay');
  const icon = $('gameover-icon');
  const title = $('gameover-title');
  const subtitle = $('gameover-subtitle');

  $('go-hacker-name').textContent = hackerName;
  $('go-controller-name').textContent = controllerName;
  $('go-hacker-score').textContent = scores.hacker;
  $('go-controller-score').textContent = scores.controller;

  if (winner === 'draw') {
    icon.textContent = '🤝';
    title.textContent = "IT'S A DRAW!";
    title.style.color = 'var(--cyan)';
    subtitle.textContent = 'Both players captured the same number of rooms.';
  } else if (winner === 'hacker') {
    icon.textContent = '💀';
    title.textContent = 'HACKER WINS!';
    title.style.color = 'var(--red)';
    subtitle.textContent = `${hackerName} successfully compromised the school network.`;
    if (client.myRole === 'hacker') {
      subtitle.textContent += ' You WIN! 🎉';
    } else {
      subtitle.textContent += ' Better luck next time.';
    }
  } else {
    icon.textContent = '🛡️';
    title.textContent = 'DEFENDER WINS!';
    title.style.color = 'var(--green)';
    subtitle.textContent = `${controllerName} successfully defended the school network.`;
    if (client.myRole === 'controller') {
      subtitle.textContent += ' You WIN! 🎉';
    } else {
      subtitle.textContent += ' Better luck next time.';
    }
  }

  overlay.classList.remove('hidden');
});

// ── AI Activity Feed ──────────────────────────────────────
socket.on('ai_activity', ({ roomId, aiRole, action }) => {
  if (!client.isPractice) return;
  const feed = $('ai-feed');
  if (!feed) return;
  const room = client.rooms[roomId];
  const roomName = room ? room.name : roomId;
  const roleIcon = aiRole === 'hacker' ? '💀' : '🛡️';

  let msg = '';
  if (action === 'entered') {
    msg = `<span class="ai-msg">${roleIcon} CPU moved to <strong>${roomName}</strong> — solving challenge...</span>`;
  } else if (action === 'success') {
    const verb = aiRole === 'hacker' ? 'hacked' : 'secured';
    msg = `<span class="ai-msg ai-success">${roleIcon} CPU ${verb} <strong>${roomName}</strong>!</span>`;
  } else if (action === 'failed') {
    msg = `<span class="ai-msg ai-fail">${roleIcon} CPU failed challenge in <strong>${roomName}</strong></span>`;
  }

  feed.innerHTML = `<span class="ai-tag">🤖 CPU</span>${msg}`;
});

// ── Disconnect ────────────────────────────────────────────
socket.on('opponent_disconnected', () => {
  $('disconnect-overlay').classList.remove('hidden');
});

socket.on('disconnect', () => {
  if ($('game-view').classList.contains('active')) {
    $('disconnect-msg').textContent = 'Lost connection to server.';
    $('disconnect-overlay').classList.remove('hidden');
  }
});
