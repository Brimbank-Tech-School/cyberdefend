// ══════════════════════════════════════════════════════════
//  CyberDefend — Challenge UI Renderers
//  Each function returns an HTML string and binds events
//  via window.challengeState shared with game.js
// ══════════════════════════════════════════════════════════

window.challengeState = {
  selected: null,         // for single-select challenges
  selectedMulti: [],      // for multi-select challenges
  submitted: false,
  roomId: null,
  role: null,
  data: null,
  type: null,
};

const CHALLENGE_LABELS = {
  password_crack:     '🔑 Password Security',
  phishing:           '📧 Phishing Detection',
  firewall:           '🛡️ Firewall Configuration',
  encryption:         '🔐 Encryption Challenge',
  malware_detect:     '🦠 Malware Detection',
  network_analysis:   '📡 Network Traffic Analysis',
  social_engineering: '🎭 Social Engineering',
  usb_drop:           '💾 USB Drop Attack',
};

function getChallengeLabel(type) {
  return CHALLENGE_LABELS[type] || type;
}

// ── Main renderer dispatcher ─────────────────────────────
function renderChallenge(type, data, role, roomId, roomStatus, usbPlanted) {
  const cs = window.challengeState;
  cs.selected = null;
  cs.selectedMulti = [];
  cs.submitted = false;
  cs.roomId = roomId;
  cs.role = role;
  cs.data = data;
  cs.type = type;

  const area = document.getElementById('challenge-area');
  if (!area) return;

  // Show status bar
  const statusBar = document.getElementById('room-panel-status-bar');
  if (statusBar) {
    const labels = { neutral: 'NEUTRAL — Unclaimed', red: '⚠ HACKED — Room Compromised', green: '✓ SECURED — Room Protected' };
    statusBar.textContent = labels[roomStatus] || roomStatus.toUpperCase();
    statusBar.className = `status-bar-${roomStatus}`;
  }

  switch (type) {
    case 'password_crack':     renderPasswordChallenge(area, data, role); break;
    case 'phishing':           renderPhishingChallenge(area, data, role); break;
    case 'firewall':           renderFirewallChallenge(area, data, role); break;
    case 'encryption':         renderEncryptionChallenge(area, data, role); break;
    case 'malware_detect':     renderMalwareChallenge(area, data, role); break;
    case 'network_analysis':   renderNetworkChallenge(area, data, role); break;
    case 'social_engineering': renderSocialChallenge(area, data, role); break;
    case 'usb_drop':           renderUsbChallenge(area, data, role, usbPlanted); break;
    default:                   area.innerHTML = '<p class="challenge-instructions">Unknown challenge type.</p>';
  }
}

// ── Password Crack ───────────────────────────────────────
function renderPasswordChallenge(area, data, role) {
  const inst = role === 'hacker'
    ? 'Select the <strong style="color:var(--red)">WEAKEST</strong> password to crack it and compromise this room.'
    : 'Select the <strong style="color:var(--green)">STRONGEST</strong> password to demonstrate secure practices and protect this room.';

  area.innerHTML = `
    <div class="challenge-title">${getChallengeLabel('password_crack')}</div>
    <div class="challenge-instructions ${role}-inst">${inst}</div>
    <div class="password-grid" id="pw-grid"></div>
    <button class="btn btn-submit" id="submit-btn" disabled onclick="submitPasswordChallenge()">SUBMIT</button>
    <div id="challenge-feedback"></div>
  `;

  const grid = document.getElementById('pw-grid');
  data.passwords.forEach(pw => {
    const el = document.createElement('button');
    el.className = 'password-option';
    el.textContent = pw;
    el.onclick = () => {
      document.querySelectorAll('.password-option').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      window.challengeState.selected = pw;
      document.getElementById('submit-btn').disabled = false;
    };
    grid.appendChild(el);
  });
}

function submitPasswordChallenge() {
  if (window.challengeState.submitted) return;
  const cs = window.challengeState;
  if (!cs.selected) return;
  cs.submitted = true;
  document.getElementById('submit-btn').disabled = true;
  window.submitChallengeAnswer({ selected: cs.selected });
}

// ── Phishing ─────────────────────────────────────────────
function renderPhishingChallenge(area, data, role) {
  const isHacker = role === 'hacker';
  const inst = isHacker
    ? 'Select the <strong style="color:var(--red)">best phishing hook</strong> — the element most likely to trick the victim.'
    : 'Select <strong style="color:var(--green)">ALL suspicious elements</strong> to report this phishing email.';

  const elemIcons = { sender: '📧', link: '🔗', attachment: '📎' };

  area.innerHTML = `
    <div class="challenge-title">${getChallengeLabel('phishing')}</div>
    <div class="challenge-instructions ${role}-inst">${inst}</div>
    <div class="email-card">
      <div class="email-header">
        <div class="email-from">From: <strong>${data.from}</strong></div>
        <div class="email-subject">Subject: ${data.subject}</div>
      </div>
      <div class="email-body">${data.body}</div>
      <div class="email-elements" id="email-elements"></div>
    </div>
    <button class="btn btn-submit" id="submit-btn" disabled onclick="submitPhishingChallenge()">SUBMIT</button>
    <div id="challenge-feedback"></div>
  `;

  const container = document.getElementById('email-elements');
  window.challengeState.selectedMulti = [];

  data.elements.forEach(el => {
    const div = document.createElement('div');
    div.className = 'email-element';
    div.dataset.id = el.id;
    div.innerHTML = `<span class="email-element-icon">${elemIcons[el.type] || '📄'}</span><span>${el.label}</span>`;
    div.onclick = () => {
      if (isHacker) {
        // Single select for hacker
        document.querySelectorAll('.email-element').forEach(e => e.classList.remove('selected'));
        div.classList.add('selected');
        window.challengeState.selected = el.id;
      } else {
        // Multi-select for controller
        div.classList.toggle('selected');
        const sm = window.challengeState.selectedMulti;
        const idx = sm.indexOf(el.id);
        if (idx === -1) sm.push(el.id); else sm.splice(idx, 1);
      }
      const hasSelection = isHacker ? !!window.challengeState.selected : window.challengeState.selectedMulti.length > 0;
      document.getElementById('submit-btn').disabled = !hasSelection;
    };
    container.appendChild(div);
  });
}

function submitPhishingChallenge() {
  if (window.challengeState.submitted) return;
  const cs = window.challengeState;
  cs.submitted = true;
  document.getElementById('submit-btn').disabled = true;
  const answer = cs.role === 'hacker'
    ? { selected: cs.selected }
    : { selected: cs.selectedMulti };
  window.submitChallengeAnswer(answer);
}

// ── Firewall ─────────────────────────────────────────────
function renderFirewallChallenge(area, data, role) {
  const inst = role === 'hacker'
    ? 'Select any <strong style="color:var(--red)">vulnerable port</strong> to exploit as a backdoor entry point.'
    : 'Select <strong style="color:var(--green)">ALL misconfigured ports</strong> to close the vulnerabilities.';

  area.innerHTML = `
    <div class="challenge-title">${getChallengeLabel('firewall')}</div>
    <div class="challenge-instructions ${role}-inst">${inst}</div>
    <div class="firewall-grid" id="fw-grid"></div>
    <button class="btn btn-submit" id="submit-btn" disabled onclick="submitFirewallChallenge()">APPLY CONFIGURATION</button>
    <div id="challenge-feedback"></div>
  `;

  window.challengeState.selectedMulti = [];
  const grid = document.getElementById('fw-grid');

  data.rules.forEach(rule => {
    const div = document.createElement('div');
    div.className = 'firewall-rule';
    div.dataset.id = rule.id;
    const isVuln = !rule.safe;
    div.innerHTML = `<span>${rule.label}</span><div class="rule-toggle ${isVuln ? 'on' : ''}"></div>`;
    div.onclick = () => {
      div.classList.toggle('selected');
      const sm = window.challengeState.selectedMulti;
      const idx = sm.indexOf(rule.id);
      if (idx === -1) sm.push(rule.id); else sm.splice(idx, 1);
      document.getElementById('submit-btn').disabled = sm.length === 0;
    };
    grid.appendChild(div);
  });
}

function submitFirewallChallenge() {
  if (window.challengeState.submitted) return;
  const cs = window.challengeState;
  cs.submitted = true;
  document.getElementById('submit-btn').disabled = true;
  const answer = cs.role === 'hacker'
    ? { selected: cs.selectedMulti }
    : { selected: cs.selectedMulti };
  window.submitChallengeAnswer(answer);
}

// ── Encryption ───────────────────────────────────────────
function renderEncryptionChallenge(area, data, role) {
  const inst = role === 'hacker'
    ? `The word <strong style="color:var(--cyan)">${data.word}</strong> has been encrypted. Find the <strong style="color:var(--red)">shift value</strong> used to crack the cipher.`
    : `Re-encrypt the stolen data. Find the <strong style="color:var(--green)">correct shift value</strong> to lock it down.`;

  area.innerHTML = `
    <div class="challenge-title">${getChallengeLabel('encryption')}</div>
    <div class="challenge-instructions ${role}-inst">${inst}</div>
    <div class="cipher-display">
      <div class="cipher-label">ENCRYPTED TEXT</div>
      <div class="cipher-word">${data.encrypted}</div>
    </div>
    <div class="cipher-display" style="margin-top:0">
      <div class="cipher-label">Select Caesar Cipher Shift Value</div>
      <div class="shift-options" id="shift-grid"></div>
    </div>
    <button class="btn btn-submit" id="submit-btn" disabled onclick="submitEncryptionChallenge()">SUBMIT</button>
    <div id="challenge-feedback"></div>
  `;

  const grid = document.getElementById('shift-grid');
  data.options.forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'shift-option';
    btn.textContent = `+${n}`;
    btn.onclick = () => {
      document.querySelectorAll('.shift-option').forEach(e => e.classList.remove('selected'));
      btn.classList.add('selected');
      window.challengeState.selected = n;
      document.getElementById('submit-btn').disabled = false;
    };
    grid.appendChild(btn);
  });
}

function submitEncryptionChallenge() {
  if (window.challengeState.submitted) return;
  const cs = window.challengeState;
  cs.submitted = true;
  document.getElementById('submit-btn').disabled = true;
  window.submitChallengeAnswer({ selected: cs.selected });
}

// ── Malware Detection ────────────────────────────────────
function renderMalwareChallenge(area, data, role) {
  const isHacker = role === 'hacker';
  const inst = isHacker
    ? 'Select the files you want to <strong style="color:var(--red)">inject with malware</strong>. Choose carefully — pick suspicious-looking files.'
    : 'Select <strong style="color:var(--green)">ALL malicious files</strong> to quarantine them. Do not select clean files.';

  const typeIcons = { doc: '📄', img: '🖼️', txt: '📝', pdf: '📋', xls: '📊', exe: '⚠️', bat: '⚠️', vbs: '⚠️', scr: '⚠️' };

  area.innerHTML = `
    <div class="challenge-title">${getChallengeLabel('malware_detect')}</div>
    <div class="challenge-instructions ${role}-inst">${inst}</div>
    <div class="file-list" id="file-list"></div>
    <button class="btn btn-submit" id="submit-btn" disabled onclick="submitMalwareChallenge()">SUBMIT SELECTION</button>
    <div id="challenge-feedback"></div>
  `;

  window.challengeState.selectedMulti = [];
  const list = document.getElementById('file-list');

  data.files.forEach(file => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.dataset.name = file.name;
    div.innerHTML = `
      <span class="file-icon">${typeIcons[file.type] || '📄'}</span>
      <span class="file-name">${file.name}</span>
      <span class="file-size">${file.size}</span>
    `;
    div.onclick = () => {
      div.classList.toggle('selected');
      const sm = window.challengeState.selectedMulti;
      const idx = sm.indexOf(file.name);
      if (idx === -1) sm.push(file.name); else sm.splice(idx, 1);
      document.getElementById('submit-btn').disabled = sm.length === 0;
    };
    list.appendChild(div);
  });
}

function submitMalwareChallenge() {
  if (window.challengeState.submitted) return;
  const cs = window.challengeState;
  cs.submitted = true;
  document.getElementById('submit-btn').disabled = true;
  window.submitChallengeAnswer({ selected: cs.selectedMulti });
}

// ── Network Analysis ─────────────────────────────────────
function renderNetworkChallenge(area, data, role) {
  const inst = role === 'hacker'
    ? 'Select the <strong style="color:var(--red)">attack source IP</strong> to amplify the DDoS flood.'
    : 'Identify and <strong style="color:var(--green)">block the attacker\'s IP</strong> before the network collapses.';

  const maxRequests = Math.max(...data.logs.map(l => l.requests));

  area.innerHTML = `
    <div class="challenge-title">${getChallengeLabel('network_analysis')}</div>
    <div class="challenge-instructions ${role}-inst">${inst}</div>
    <div class="network-log" id="net-log"></div>
    <button class="btn btn-submit" id="submit-btn" disabled onclick="submitNetworkChallenge()">SUBMIT</button>
    <div id="challenge-feedback"></div>
  `;

  const log = document.getElementById('net-log');

  data.logs.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.dataset.ip = entry.ip;
    const barWidth = Math.max(4, Math.round((entry.requests / maxRequests) * 80));
    div.innerHTML = `
      <span class="log-ip">${entry.ip}</span>
      <div class="log-bar" style="width:${barWidth}px"></div>
      <span class="log-requests">${entry.requests} req/s</span>
    `;
    div.onclick = () => {
      document.querySelectorAll('.log-entry').forEach(e => e.classList.remove('selected'));
      div.classList.add('selected');
      window.challengeState.selected = entry.ip;
      document.getElementById('submit-btn').disabled = false;
    };
    log.appendChild(div);
  });
}

function submitNetworkChallenge() {
  if (window.challengeState.submitted) return;
  const cs = window.challengeState;
  cs.submitted = true;
  document.getElementById('submit-btn').disabled = true;
  window.submitChallengeAnswer({ selected: cs.selected });
}

// ── Social Engineering ───────────────────────────────────
function renderSocialChallenge(area, data, role) {
  const inst = role === 'hacker'
    ? 'Choose the response that <strong style="color:var(--red)">manipulates</strong> the target into giving up access.'
    : 'Choose the response that <strong style="color:var(--green)">educates and protects</strong> against this social engineering attempt.';

  area.innerHTML = `
    <div class="challenge-title">${getChallengeLabel('social_engineering')}</div>
    <div class="challenge-instructions ${role}-inst">${inst}</div>
    <div class="scenario-card">
      <div class="scenario-avatar">${data.avatar}</div>
      <div class="scenario-text">${data.scenario}</div>
    </div>
    <div class="scenario-options" id="scenario-opts"></div>
    <div id="challenge-feedback"></div>
  `;

  const opts = document.getElementById('scenario-opts');
  data.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'scenario-option';
    btn.textContent = opt.text;
    btn.dataset.id = opt.id;
    btn.onclick = () => {
      if (window.challengeState.submitted) return;
      document.querySelectorAll('.scenario-option').forEach(e => e.classList.remove('selected'));
      btn.classList.add('selected');
      window.challengeState.selected = opt.id;
      window.challengeState.submitted = true;
      // Auto-submit on click
      window.submitChallengeAnswer({ selected: opt.id });
    };
    opts.appendChild(btn);
  });
}

// ── USB Drop ─────────────────────────────────────────────
function renderUsbChallenge(area, data, role, usbPlanted) {
  const isHacker = role === 'hacker';
  area.innerHTML = '';

  if (isHacker) {
    if (usbPlanted) {
      area.innerHTML = `
        <div class="challenge-title">${getChallengeLabel('usb_drop')}</div>
        <div class="usb-display">
          <div class="usb-icon-large">💾</div>
          <div class="usb-status planted">⚠ USB already planted in this room</div>
          <p style="font-size:0.78rem;color:var(--text-dim)">The Cyber Controller must remove this USB to secure the room.</p>
        </div>
      `;
    } else {
      area.innerHTML = `
        <div class="challenge-title">${getChallengeLabel('usb_drop')}</div>
        <div class="challenge-instructions hacker-inst">Drop a <strong style="color:var(--red)">malicious USB drive</strong> to compromise this room instantly.</div>
        <div class="usb-display">
          <div class="usb-icon-large">💾</div>
          <div class="usb-status">Room is clear — plant a USB to hack it</div>
          <button class="btn btn-usb-plant" onclick="submitUsbAction('plant')">💾 PLANT USB DRIVE</button>
        </div>
        <div id="challenge-feedback"></div>
      `;
    }
  } else {
    if (usbPlanted) {
      area.innerHTML = `
        <div class="challenge-title">${getChallengeLabel('usb_drop')}</div>
        <div class="challenge-instructions controller-inst">A <strong style="color:var(--red)">malicious USB drive</strong> has been found. Remove it immediately to secure this room!</div>
        <div class="usb-display">
          <div class="usb-icon-large">🚨</div>
          <div class="usb-status planted">⚠ MALICIOUS USB DETECTED</div>
          <button class="btn btn-usb-remove" onclick="submitUsbAction('remove')">🛡️ REMOVE USB DRIVE</button>
        </div>
        <div id="challenge-feedback"></div>
      `;
    } else {
      area.innerHTML = `
        <div class="challenge-title">${getChallengeLabel('usb_drop')}</div>
        <div class="usb-display">
          <div class="usb-icon-large">✅</div>
          <div class="usb-status">No USB threat detected in this room</div>
          <p style="font-size:0.78rem;color:var(--text-dim)">Watch out — the Hacker might plant one!</p>
        </div>
      `;
    }
  }
}

function submitUsbAction(action) {
  if (window.challengeState.submitted) return;
  window.challengeState.submitted = true;
  window.submitChallengeAnswer({ action });
}

// ── Show challenge result feedback ───────────────────────
function showChallengeResult(success, message) {
  const fb = document.getElementById('challenge-feedback');
  if (!fb) return;
  fb.className = `result-feedback ${success ? 'result-success' : 'result-fail'}`;
  fb.textContent = success
    ? (window.challengeState.role === 'hacker' ? `✓ HACKED — ${message}` : `✓ SECURED — ${message}`)
    : `✗ FAILED — ${message}`;
}

// ── Update USB state in challenge area after server event ─
function updateUsbInChallenge(usbPlanted) {
  const cs = window.challengeState;
  if (cs.type === 'usb_drop' && !cs.submitted) {
    renderUsbChallenge(document.getElementById('challenge-area'), cs.data, cs.role, usbPlanted);
  }
}
