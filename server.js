const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// ─── Room Definitions ────────────────────────────────────────────────────────
const ROOM_DEFINITIONS = [
  { id: 'classroom_a',  name: 'Classroom A',   icon: '🏫', challenge: 'password_crack',      row: 0, col: 0 },
  { id: 'classroom_b',  name: 'Classroom B',   icon: '📚', challenge: 'phishing',             row: 0, col: 1 },
  { id: 'computer_lab', name: 'Computer Lab',  icon: '💻', challenge: 'firewall',             row: 0, col: 2 },
  { id: 'library',      name: 'Library',       icon: '📖', challenge: 'encryption',           row: 0, col: 3 },
  { id: 'science_lab',  name: 'Science Lab',   icon: '🔬', challenge: 'malware_detect',       row: 1, col: 0 },
  { id: 'art_room',     name: 'Art Room',      icon: '🎨', challenge: 'malware_detect',       row: 1, col: 1 },
  { id: 'music_room',   name: 'Music Room',    icon: '🎵', challenge: 'password_crack',       row: 1, col: 2 },
  { id: 'drama_room',   name: 'Drama Room',    icon: '🎭', challenge: 'social_engineering',   row: 1, col: 3 },
  { id: 'sports_hall',  name: 'Sports Hall',   icon: '⚽', challenge: 'network_analysis',     row: 2, col: 0 },
  { id: 'gymnasium',    name: 'Gymnasium',     icon: '🏋️', challenge: 'password_crack',       row: 2, col: 1 },
  { id: 'cafeteria',    name: 'Cafeteria',     icon: '🍽️', challenge: 'social_engineering',   row: 2, col: 2 },
  { id: 'office',       name: 'Office',        icon: '🖥️', challenge: 'encryption',           row: 2, col: 3 },
  { id: 'server_room',  name: 'Server Room',   icon: '🖧',  challenge: 'firewall',             row: 3, col: 0 },
  { id: 'reception',    name: 'Reception',     icon: '🏢', challenge: 'phishing',             row: 3, col: 1 },
  { id: 'workshop',     name: 'Workshop',      icon: '🔧', challenge: 'usb_drop',             row: 3, col: 2 },
  { id: 'corridor',     name: 'Corridor',      icon: '🚪', challenge: 'usb_drop',             row: 3, col: 3 },
];

// ─── Challenge Data Generators ───────────────────────────────────────────────
function generateChallengeData(challengeType, variant) {
  const v = (variant || 0);
  switch (challengeType) {
    case 'password_crack': return generatePasswordChallenge(v);
    case 'phishing':       return generatePhishingChallenge(v);
    case 'firewall':       return generateFirewallChallenge(v);
    case 'encryption':     return generateEncryptionChallenge(v);
    case 'malware_detect': return generateMalwareChallenge(v);
    case 'network_analysis': return generateNetworkChallenge();
    case 'social_engineering': return generateSocialChallenge(v);
    case 'usb_drop':       return generateUsbChallenge();
    default:               return {};
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePasswordChallenge(variant) {
  const pools = [
    [
      { text: 'abc123', score: 1 },
      { text: 'qwerty', score: 1 },
      { text: 'pass', score: 0 },
      { text: 'P@ssw0rd!', score: 7 },
      { text: 'hunter2', score: 2 },
      { text: 'X#9kL!mQ2$', score: 10 },
      { text: 'football', score: 1 },
      { text: 'Tr0ub4dor&3', score: 9 },
    ],
    [
      { text: '123456', score: 0 },
      { text: 'iloveyou', score: 1 },
      { text: 'nM8#vK2@pL!', score: 10 },
      { text: 'monkey', score: 1 },
      { text: 'Sunshine99', score: 5 },
      { text: 'dragon', score: 1 },
      { text: 'Zx$9!wQp#2Lr', score: 10 },
      { text: 'password1', score: 2 },
    ],
    [
      { text: 'letmein', score: 1 },
      { text: 'admin', score: 0 },
      { text: 'B7#mK!vX9@qL', score: 10 },
      { text: 'welcome', score: 1 },
      { text: 'Summer2024!', score: 6 },
      { text: 'shadow', score: 1 },
      { text: 'R#4nD0m!$3cur3', score: 10 },
      { text: 'test123', score: 1 },
    ],
    [
      { text: 'princess', score: 1 },
      { text: 'sunshine', score: 1 },
      { text: 'K9$pLw#mQ2!x', score: 10 },
      { text: 'chocolate', score: 1 },
      { text: 'Secure#2026', score: 7 },
      { text: 'batman', score: 1 },
      { text: 'Wq!8rN#vZ3$k', score: 10 },
      { text: 'cheese123', score: 2 },
    ],
    [
      { text: 'london123', score: 2 },
      { text: 'password!', score: 1 },
      { text: 'Mx7$kP!nW4#z', score: 10 },
      { text: 'starwars', score: 1 },
      { text: 'Winter2025!', score: 6 },
      { text: 'superman', score: 1 },
      { text: 'Jq#9vL!rX5$m', score: 10 },
      { text: 'biscuit99', score: 2 },
    ],
  ];
  // Use variant to cycle through pools so consecutive entrants see different passwords
  const pool = shuffle(pools[variant % pools.length]);
  const weakest = pool.reduce((min, p) => p.score < min.score ? p : min);
  const strongest = pool.reduce((max, p) => p.score > max.score ? p : max);
  return { passwords: pool.map(p => p.text), weakest: weakest.text, strongest: strongest.text };
}

function generatePhishingChallenge(variant) {
  const templates = [
    {
      from: 'IT-Support@sch00l-helpdesk.net',
      subject: 'URGENT: Your account will be suspended',
      body: 'Dear Student, Your school account will be suspended in 24 hours unless you verify your details immediately. Click the link below to avoid losing access.',
      elements: [
        { id: 'e1', label: 'Sender address', isMalicious: true },
        { id: 'e2', label: 'Verify Account link', isMalicious: true },
        { id: 'e3', label: 'Attachment: AccountForm.exe', isMalicious: true },
        { id: 'e4', label: 'IT Help Centre link', isMalicious: false },
      ],
    },
    {
      from: 'prize-winner@freegifts.co',
      subject: "Congratulations! You've won a laptop",
      body: "You've been selected as a lucky winner! Claim your free laptop by entering your school login details on our secure portal.",
      elements: [
        { id: 'e1', label: 'Sender address', isMalicious: true },
        { id: 'e2', label: 'Claim Prize link', isMalicious: true },
        { id: 'e3', label: 'Survey attachment', isMalicious: true },
        { id: 'e4', label: 'Unsubscribe link', isMalicious: false },
      ],
    },
    {
      from: 'principal@school-admin.info',
      subject: 'Important: Update your password now',
      body: 'As part of our security upgrade, all students must update their password using the link below. Failure to do so will result in account lockout.',
      elements: [
        { id: 'e1', label: 'Sender domain', isMalicious: true },
        { id: 'e2', label: 'Update Password link', isMalicious: true },
        { id: 'e3', label: 'Attached: NewPolicy.pdf.exe', isMalicious: true },
        { id: 'e4', label: 'Contact IT Support link', isMalicious: false },
      ],
    },
    {
      from: 'noreply@sch00l-rewards.com',
      subject: 'You have earned a £50 Amazon voucher!',
      body: 'As a top student you have been selected for a reward. Log in with your school account to claim your voucher before it expires tonight.',
      elements: [
        { id: 'e1', label: 'Sender domain (sch00l-rewards.com)', isMalicious: true },
        { id: 'e2', label: 'Claim Voucher link', isMalicious: true },
        { id: 'e3', label: 'Attachment: voucher_claim.exe', isMalicious: true },
        { id: 'e4', label: 'Unsubscribe link', isMalicious: false },
      ],
    },
    {
      from: 'it-helpdesk@schoolit-support.net',
      subject: 'Action required: Malware detected on your device',
      body: 'Our systems have detected suspicious activity on your school device. Please install the security patch attached immediately to protect your data.',
      elements: [
        { id: 'e1', label: 'Sender address (schoolit-support.net)', isMalicious: true },
        { id: 'e2', label: 'Attachment: SecurityPatch.exe', isMalicious: true },
        { id: 'e3', label: 'Download patch link', isMalicious: true },
        { id: 'e4', label: 'Official IT contact number', isMalicious: false },
      ],
    },
  ];
  // Use variant to cycle templates — each entry to the room shows a different email
  const t = templates[variant % templates.length];
  const malicious = t.elements.filter(e => e.isMalicious).map(e => e.id);
  return {
    from: t.from,
    subject: t.subject,
    body: t.body,
    elements: shuffle(t.elements),
    hackerTarget: malicious[Math.floor(Math.random() * malicious.length)],
    controllerTargets: malicious,
  };
}

function generateFirewallChallenge(variant) {
  const allRules = [
    { id: 'r1', label: 'Block Port 22 (SSH)', safe: true },
    { id: 'r2', label: 'Allow Port 80 (HTTP)', safe: true },
    { id: 'r3', label: 'Block Port 23 (Telnet)', safe: true },
    { id: 'r4', label: 'Allow Port 4444 (Backdoor)', safe: false },
    { id: 'r5', label: 'Block Port 443 (HTTPS)', safe: true },
    { id: 'r6', label: 'Allow Port 31337 (Malware)', safe: false },
    { id: 'r7', label: 'Block Port 8080 (Proxy)', safe: true },
    { id: 'r8', label: 'Allow Port 666 (Trojan)', safe: false },
    { id: 'r9', label: 'Block Port 21 (FTP)', safe: true },
  ];
  const unsafe = allRules.filter(r => !r.safe);
  const safe = shuffle(allRules.filter(r => r.safe)).slice(0, 6);
  const rules = shuffle([...safe, ...unsafe]);
  return {
    rules,
    vulnerableIds: unsafe.map(r => r.id),
  };
}

function generateEncryptionChallenge(variant) {
  const words = ['DATA', 'FILE', 'CODE', 'HACK', 'SAFE', 'LOCK', 'KEYS', 'BITS', 'BYTE', 'PING', 'ROOT', 'SEND'];
  // Use variant to cycle words so repeated room entries show a different word
  const word = words[variant % words.length];
  const shifts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const shift = shifts[Math.floor(Math.random() * 6) + 1];
  const encrypted = word.split('').map(c => {
    const code = c.charCodeAt(0) - 65;
    return String.fromCharCode(((code + shift) % 26) + 65);
  }).join('');
  const options = shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 6);
  if (!options.includes(shift)) { options[0] = shift; }
  return { word, encrypted, shift, options: shuffle(options) };
}

function generateMalwareChallenge(variant) {
  const allSafe = [
    { name: 'homework_essay.docx', size: '44 KB', type: 'doc' },
    { name: 'holiday_photo.jpg', size: '3.2 MB', type: 'img' },
    { name: 'readme.txt', size: '1 KB', type: 'txt' },
    { name: 'report_final.pdf', size: '220 KB', type: 'pdf' },
    { name: 'project_notes.docx', size: '88 KB', type: 'doc' },
    { name: 'class_photo.png', size: '1.8 MB', type: 'img' },
    { name: 'timetable.xlsx', size: '32 KB', type: 'xls' },
    { name: 'music_playlist.txt', size: '2 KB', type: 'txt' },
    { name: 'science_project.pptx', size: '1.1 MB', type: 'doc' },
  ];
  const allMalware = [
    { name: 'system32update.exe', size: '2 KB', type: 'exe' },
    { name: 'invoice_2026.pdf.exe', size: '18 KB', type: 'exe' },
    { name: 'network_scan.bat', size: '4 KB', type: 'bat' },
    { name: 'freegame_setup.exe', size: '3 KB', type: 'exe' },
    { name: 'school_virus.vbs', size: '1 KB', type: 'vbs' },
    { name: 'update_now.scr', size: '6 KB', type: 'scr' },
    { name: 'patch_install.bat', size: '5 KB', type: 'bat' },
    { name: 'crack_wifi.exe', size: '9 KB', type: 'exe' },
  ];
  // Rotate which files appear based on variant so each entry shows a fresh set
  const safeOffset = variant % (allSafe.length - 4);
  const malOffset  = variant % (allMalware.length - 2);
  const safeFiles    = allSafe.slice(safeOffset, safeOffset + 5);
  const malwareFiles = allMalware.slice(malOffset, malOffset + 3);
  const allFiles = shuffle([...safeFiles, ...malwareFiles]);
  return {
    files: allFiles,
    malwareNames: malwareFiles.map(f => f.name),
  };
}

function generateNetworkChallenge() {
  const scenarios = [
    { label: 'requests', threshold: 300 },
    { label: 'failed_logins', threshold: 50 },
    { label: 'data_sent_mb', threshold: 200 },
  ];
  const sc = scenarios[Math.floor(Math.random() * scenarios.length)];
  const normalIPs = Array.from({ length: 7 }, () => {
    const a = Math.floor(Math.random() * 200) + 10;
    const b = Math.floor(Math.random() * 255);
    const c = Math.floor(Math.random() * 255);
    const d = Math.floor(Math.random() * 255);
    return { ip: `${a}.${b}.${c}.${d}`, requests: Math.floor(Math.random() * 20) + 2 };
  });
  const attackerIP = `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  const attackerEntry = { ip: attackerIP, requests: Math.floor(Math.random() * 200) + sc.threshold };
  const logs = shuffle([...normalIPs, attackerEntry]);
  return { logs, attackerIP, scenarioLabel: sc.label };
}

function generateSocialChallenge(variant) {
  const scenarios = [
    {
      scenario: 'A stranger in the corridor claims to be a new IT technician and asks for your school login to "run a test".',
      avatar: '👨‍💼',
      options: [
        { id: 'a', text: 'Give them your login details — they look official', hackerWin: true, controllerWin: false },
        { id: 'b', text: 'Refuse and report them to a teacher', hackerWin: false, controllerWin: true },
        { id: 'c', text: 'Ignore them completely', hackerWin: false, controllerWin: false },
        { id: 'd', text: 'Ask them to send you a verification email first', hackerWin: false, controllerWin: true },
      ],
    },
    {
      scenario: 'Someone calls the school office pretending to be a parent, asking for a student\'s timetable and home address.',
      avatar: '📞',
      options: [
        { id: 'a', text: 'Provide the information — they sound genuine', hackerWin: true, controllerWin: false },
        { id: 'b', text: 'Ask them to come in person with ID', hackerWin: false, controllerWin: true },
        { id: 'c', text: 'Transfer the call without answering', hackerWin: false, controllerWin: false },
        { id: 'd', text: 'Refuse and note the call for safeguarding', hackerWin: false, controllerWin: true },
      ],
    },
    {
      scenario: 'A student receives a message from a "friend" on social media asking them to share their school password to help with a project.',
      avatar: '📱',
      options: [
        { id: 'a', text: 'Share it — your friend wouldn\'t do anything bad', hackerWin: true, controllerWin: false },
        { id: 'b', text: 'Verify with your friend in person first', hackerWin: false, controllerWin: true },
        { id: 'c', text: 'Change your password then share the old one', hackerWin: false, controllerWin: false },
        { id: 'd', text: 'Report the message to a teacher as a possible scam', hackerWin: false, controllerWin: true },
      ],
    },
    {
      scenario: 'An email arrives offering free lunch vouchers to anyone who clicks a link and enters their school account details.',
      avatar: '🍕',
      options: [
        { id: 'a', text: 'Click the link — free food sounds great!', hackerWin: true, controllerWin: false },
        { id: 'b', text: 'Forward the email to the IT department as suspicious', hackerWin: false, controllerWin: true },
        { id: 'c', text: 'Delete the email without clicking', hackerWin: false, controllerWin: false },
        { id: 'd', text: 'Check with the school office if the vouchers are real', hackerWin: false, controllerWin: true },
      ],
    },
    {
      scenario: 'Someone tailgates through a secure door behind a member of staff, claiming they forgot their access card.',
      avatar: '🚪',
      options: [
        { id: 'a', text: 'Hold the door — they look like staff', hackerWin: true, controllerWin: false },
        { id: 'b', text: 'Ask them to use the intercom to verify identity', hackerWin: false, controllerWin: true },
        { id: 'c', text: 'Ignore it — not your problem', hackerWin: false, controllerWin: false },
        { id: 'd', text: 'Report the incident to the front office', hackerWin: false, controllerWin: true },
      ],
    },
    {
      scenario: 'A "student" you don\'t recognise asks to borrow your logged-in laptop for "just two minutes" to print something.',
      avatar: '💻',
      options: [
        { id: 'a', text: 'Hand it over — it\'ll only take a moment', hackerWin: true, controllerWin: false },
        { id: 'b', text: 'Log out first, then let them use the guest account', hackerWin: false, controllerWin: true },
        { id: 'c', text: 'Walk away with your laptop', hackerWin: false, controllerWin: false },
        { id: 'd', text: 'Offer to print it for them while watching', hackerWin: false, controllerWin: true },
      ],
    },
    {
      scenario: 'A pop-up appears on the school computer saying "Your device is infected! Call this number immediately!"',
      avatar: '⚠️',
      options: [
        { id: 'a', text: 'Call the number straight away', hackerWin: true, controllerWin: false },
        { id: 'b', text: 'Close the browser and report it to IT', hackerWin: false, controllerWin: true },
        { id: 'c', text: 'Click the pop-up to find out more', hackerWin: true, controllerWin: false },
        { id: 'd', text: 'Take a photo and show your teacher', hackerWin: false, controllerWin: true },
      ],
    },
  ];
  // Cycle scenarios by variant so each room entry shows a fresh scenario
  return scenarios[variant % scenarios.length];
}

function generateUsbChallenge() {
  return { type: 'usb_drop', planted: false };
}

// ─── Server-side Answer Validation ───────────────────────────────────────────
function validateAnswer(room, role, answer) {
  const data = room.challengeData;
  const type = room.challengeType;

  if (type === 'usb_drop') {
    if (role === 'hacker') return answer.action === 'plant';
    if (role === 'controller') return answer.action === 'remove' && room.usbPlanted;
    return false;
  }

  if (type === 'password_crack') {
    if (role === 'hacker') return answer.selected === data.weakest;
    if (role === 'controller') return answer.selected === data.strongest;
  }

  if (type === 'phishing') {
    if (role === 'hacker') return answer.selected === data.hackerTarget;
    if (role === 'controller') {
      const targets = data.controllerTargets;
      const selected = answer.selected || [];
      return targets.every(t => selected.includes(t)) && !selected.some(s => !targets.includes(s));
    }
  }

  if (type === 'firewall') {
    if (role === 'hacker') {
      const vuln = data.vulnerableIds;
      const selected = answer.selected || [];
      return vuln.some(v => selected.includes(v));
    }
    if (role === 'controller') {
      const vuln = data.vulnerableIds;
      const selected = answer.selected || [];
      return vuln.every(v => selected.includes(v)) && selected.length === vuln.length;
    }
  }

  if (type === 'encryption') {
    if (role === 'hacker') return parseInt(answer.selected) === data.shift;
    if (role === 'controller') return parseInt(answer.selected) === data.shift;
  }

  if (type === 'malware_detect') {
    const malware = data.malwareNames;
    const selected = answer.selected || [];
    if (role === 'hacker') return malware.some(m => selected.includes(m));
    if (role === 'controller') {
      return malware.every(m => selected.includes(m)) && !selected.some(s => !malware.includes(s));
    }
  }

  if (type === 'network_analysis') {
    if (role === 'hacker') return answer.selected === data.attackerIP;
    if (role === 'controller') return answer.selected === data.attackerIP;
  }

  if (type === 'social_engineering') {
    const option = data.options.find(o => o.id === answer.selected);
    if (!option) return false;
    if (role === 'hacker') return option.hackerWin;
    if (role === 'controller') return option.controllerWin;
  }

  return false;
}

// ─── AI Player ────────────────────────────────────────────────────────────────
const AI_DIFFICULTY = {
  easy:   { successRate: 0.55, minDelay: 10000, maxDelay: 15000 },
  medium: { successRate: 0.75, minDelay: 6000,  maxDelay: 9000  },
  hard:   { successRate: 0.90, minDelay: 3000,  maxDelay: 5000  },
};

function getCorrectAnswer(room, role) {
  const data = room.challengeData;
  switch (room.challengeType) {
    case 'password_crack':
      return { selected: role === 'hacker' ? data.weakest : data.strongest };
    case 'phishing':
      return role === 'hacker'
        ? { selected: data.hackerTarget }
        : { selected: data.controllerTargets };
    case 'firewall':
      return role === 'hacker'
        ? { selected: [data.vulnerableIds[0]] }
        : { selected: data.vulnerableIds };
    case 'encryption':
      return { selected: data.shift };
    case 'malware_detect':
      return role === 'hacker'
        ? { selected: [data.malwareNames[0]] }
        : { selected: data.malwareNames };
    case 'network_analysis':
      return { selected: data.attackerIP };
    case 'social_engineering': {
      const win = data.options.find(o => role === 'hacker' ? o.hackerWin : o.controllerWin);
      return { selected: win ? win.id : data.options[0].id };
    }
    case 'usb_drop':
      return { action: role === 'hacker' ? 'plant' : 'remove' };
    default:
      return {};
  }
}

function getWrongAnswer(room, role) {
  const data = room.challengeData;
  switch (room.challengeType) {
    case 'password_crack': {
      const wrong = data.passwords.find(p => p !== data.weakest && p !== data.strongest);
      return { selected: wrong || data.passwords[0] };
    }
    case 'phishing':
      return role === 'hacker'
        ? { selected: 'e4' }
        : { selected: ['e4'] };
    case 'firewall':
      return { selected: [] };
    case 'encryption':
      return { selected: data.options.find(o => o !== data.shift) || 1 };
    case 'malware_detect':
      return { selected: [data.files[0].name] };
    case 'network_analysis':
      return { selected: data.logs[0].ip };
    case 'social_engineering': {
      const lose = data.options.find(o => role === 'hacker' ? !o.hackerWin : !o.controllerWin);
      return { selected: lose ? lose.id : data.options[0].id };
    }
    case 'usb_drop':
      return { action: 'none' };
    default:
      return {};
  }
}

function pickAiTargetRoom(aiRole) {
  if (!gameState) return null;
  const rooms = Object.values(gameState.rooms);
  const now = Date.now();

  // Filter out rooms on cooldown and rooms already owned by AI
  const available = rooms.filter(r => {
    if (r.cooldownUntil && now < r.cooldownUntil) return false;
    if (aiRole === 'hacker' && r.status === 'red') return false;
    if (aiRole === 'controller' && r.status === 'green') return false;
    // USB rooms: hacker can only plant if not planted; controller only if planted
    if (r.challengeType === 'usb_drop') {
      if (aiRole === 'hacker' && r.usbPlanted) return false;
      if (aiRole === 'controller' && !r.usbPlanted && r.status !== 'red') return false;
    }
    return true;
  });

  if (available.length === 0) return null;

  // Priority: contest opponent's rooms first, then neutral
  const contested = available.filter(r =>
    aiRole === 'hacker' ? r.status === 'green' : r.status === 'red'
  );
  const neutral = available.filter(r => r.status === 'neutral');
  const pool = contested.length > 0 ? contested : neutral.length > 0 ? neutral : available;

  return pool[Math.floor(Math.random() * pool.length)];
}

function scheduleAiTurn(difficulty) {
  if (!gameState || !gameState.ai) return;
  const cfg = AI_DIFFICULTY[difficulty] || AI_DIFFICULTY.medium;
  const delay = cfg.minDelay + Math.random() * (cfg.maxDelay - cfg.minDelay);

  gameState.ai.turnTimeout = setTimeout(() => {
    if (!gameState || !gameState.ai) return;
    const aiRole = gameState.ai.role;
    const room = pickAiTargetRoom(aiRole);
    if (!room) {
      scheduleAiTurn(difficulty);
      return;
    }

    // Move AI into room
    const prevRoomId = gameState.players[aiRole].currentRoomId;
    if (prevRoomId && gameState.rooms[prevRoomId]) {
      gameState.rooms[prevRoomId].occupant = null;
    }
    gameState.players[aiRole].currentRoomId = room.id;
    room.occupant = aiRole;
    if (room.challengeType !== 'usb_drop') {
      room.challengeVariantIndex = (room.challengeVariantIndex || 0) + 1;
      room.challengeData = generateChallengeData(room.challengeType, room.challengeVariantIndex);
    }

    // Broadcast AI movement
    io.emit('room_occupancy_update', { roomId: room.id, occupant: aiRole, prevRoomId });
    // Tell human the AI is in a room
    io.emit('ai_activity', { roomId: room.id, aiRole, action: 'entered' });

    // Simulate "thinking" then submit answer
    const thinkTime = 1500 + Math.random() * 2000;
    setTimeout(() => {
      if (!gameState || !gameState.ai) return;
      const success = Math.random() < cfg.successRate;
      const answer = success ? getCorrectAnswer(room, aiRole) : getWrongAnswer(room, aiRole);
      const valid = validateAnswer(room, aiRole, answer);

      if (valid) {
        const prevStatus = room.status;
        if (aiRole === 'hacker') {
          room.status = 'red';
          if (room.challengeType === 'usb_drop') room.usbPlanted = true;
        } else {
          room.status = 'green';
          if (room.challengeType === 'usb_drop') room.usbPlanted = false;
        }
        if (prevStatus !== room.status) room.cooldownUntil = Date.now() + 30000;
        gameState.scores = recalcScores(gameState.rooms);
        io.emit('room_state_update', {
          roomId: room.id,
          status: room.status,
          usbPlanted: room.usbPlanted,
          scores: gameState.scores,
        });
        io.emit('ai_activity', { roomId: room.id, aiRole, action: 'success' });
      } else {
        io.emit('ai_activity', { roomId: room.id, aiRole, action: 'failed' });
      }

      // Leave room
      room.occupant = null;
      gameState.players[aiRole].currentRoomId = null;
      io.emit('room_occupancy_update', { roomId: room.id, occupant: null, prevRoomId: null });

      scheduleAiTurn(difficulty);
    }, thinkTime);
  }, delay);
}

// ─── Game State ───────────────────────────────────────────────────────────────
let gameState = null;

function createInitialGameState(hackerSocket, hackerName, controllerSocket, controllerName) {
  const rooms = {};
  ROOM_DEFINITIONS.forEach(def => {
    // Start each room at a random variant offset so the very first challenge
    // shown is already different across rooms and game sessions
    const startVariant = Math.floor(Math.random() * 50);
    const challengeData = generateChallengeData(def.challenge, startVariant);
    rooms[def.id] = {
      id: def.id,
      name: def.name,
      icon: def.icon,
      challengeType: def.challenge,
      row: def.row,
      col: def.col,
      status: 'neutral',
      occupant: null,
      usbPlanted: false,
      cooldownUntil: null,
      challengeVariantIndex: startVariant,
      challengeData,
    };
  });

  return {
    phase: 'in_game',
    players: {
      hacker:     { socketId: hackerSocket, name: hackerName, currentRoomId: null },
      controller: { socketId: controllerSocket, name: controllerName, currentRoomId: null },
    },
    rooms,
    scores: { hacker: 0, controller: 0 },
    secondsRemaining: 600,
    timerInterval: null,
  };
}

function getPublicRooms(rooms) {
  const pub = {};
  Object.values(rooms).forEach(r => {
    pub[r.id] = {
      id: r.id,
      name: r.name,
      icon: r.icon,
      challengeType: r.challengeType,
      row: r.row,
      col: r.col,
      status: r.status,
      occupant: r.occupant,
      usbPlanted: r.usbPlanted,
    };
  });
  return pub;
}

function recalcScores(rooms) {
  let hacker = 0, controller = 0;
  Object.values(rooms).forEach(r => {
    if (r.status === 'red') hacker++;
    else if (r.status === 'green') controller++;
  });
  return { hacker, controller };
}

function endGame() {
  if (!gameState) return;
  clearInterval(gameState.timerInterval);
  gameState.timerInterval = null;
  if (gameState.ai && gameState.ai.turnTimeout) {
    clearTimeout(gameState.ai.turnTimeout);
  }
  const scores = recalcScores(gameState.rooms);
  let winner = 'draw';
  if (scores.hacker > scores.controller) winner = 'hacker';
  else if (scores.controller > scores.hacker) winner = 'controller';

  io.emit('game_over', {
    winner,
    scores,
    rooms: getPublicRooms(gameState.rooms),
    hackerName: gameState.players.hacker.name,
    controllerName: gameState.players.controller.name,
  });
  gameState = null;
  lobby = { players: {}, phase: 'waiting' };
}

// ─── Lobby State ──────────────────────────────────────────────────────────────
let lobby = {
  players: {},
  phase: 'waiting',
};

function getLobbyUpdate() {
  return {
    players: Object.values(lobby.players).map(p => ({
      name: p.name,
      role: p.role,
      ready: p.ready,
    })),
    phase: lobby.phase,
    hackerTaken: Object.values(lobby.players).some(p => p.role === 'hacker'),
    controllerTaken: Object.values(lobby.players).some(p => p.role === 'controller'),
  };
}

function tryStartGame() {
  const players = Object.values(lobby.players);
  if (players.length !== 2) return;
  const hacker = players.find(p => p.role === 'hacker' && p.ready);
  const controller = players.find(p => p.role === 'controller' && p.ready);
  if (!hacker || !controller) return;

  lobby.phase = 'in_game';
  gameState = createInitialGameState(hacker.socketId, hacker.name, controller.socketId, controller.name);

  const publicRooms = getPublicRooms(gameState.rooms);

  io.to(hacker.socketId).emit('game_start', {
    yourRole: 'hacker',
    rooms: publicRooms,
    players: { hacker: hacker.name, controller: controller.name },
    secondsRemaining: 600,
  });
  io.to(controller.socketId).emit('game_start', {
    yourRole: 'controller',
    rooms: publicRooms,
    players: { hacker: hacker.name, controller: controller.name },
    secondsRemaining: 600,
  });

  gameState.timerInterval = setInterval(() => {
    if (!gameState) return;
    gameState.secondsRemaining--;
    io.emit('tick', { secondsRemaining: gameState.secondsRemaining });
    if (gameState.secondsRemaining <= 0) endGame();
  }, 1000);
}

// ─── Socket.io Events ─────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  socket.on('join_lobby', ({ playerName }) => {
    if (lobby.phase === 'in_game') {
      socket.emit('error_msg', { message: 'A game is already in progress. Please wait.' });
      return;
    }
    const existing = Object.values(lobby.players);
    if (existing.length >= 2) {
      socket.emit('error_msg', { message: 'Lobby is full. Please wait for the current game to finish.' });
      return;
    }
    lobby.players[socket.id] = {
      socketId: socket.id,
      name: playerName || `Player ${existing.length + 1}`,
      role: null,
      ready: false,
    };
    io.emit('lobby_update', getLobbyUpdate());
  });

  socket.on('select_role', ({ role }) => {
    if (!lobby.players[socket.id]) return;
    const taken = Object.values(lobby.players).some(p => p.role === role && p.socketId !== socket.id);
    if (taken) {
      socket.emit('role_taken', { role });
      return;
    }
    lobby.players[socket.id].role = role;
    lobby.players[socket.id].ready = false;
    io.emit('lobby_update', getLobbyUpdate());
  });

  socket.on('start_practice', ({ playerName, playerRole, difficulty }) => {
    if (lobby.phase === 'in_game') {
      socket.emit('error_msg', { message: 'A game is already in progress. Please wait.' });
      return;
    }
    const aiRole = playerRole === 'hacker' ? 'controller' : 'hacker';
    const aiName = difficulty === 'easy' ? 'CPU (Easy)' : difficulty === 'hard' ? 'CPU (Hard)' : 'CPU (Medium)';

    const hackerSocket  = playerRole === 'hacker' ? socket.id : 'AI';
    const hackerName    = playerRole === 'hacker' ? playerName : aiName;
    const controllerSocket = playerRole === 'controller' ? socket.id : 'AI';
    const controllerName   = playerRole === 'controller' ? playerName : aiName;

    lobby.phase = 'in_game';
    gameState = createInitialGameState(hackerSocket, hackerName, controllerSocket, controllerName);
    gameState.isPractice = true;
    gameState.ai = { role: aiRole, difficulty, turnTimeout: null };

    const publicRooms = getPublicRooms(gameState.rooms);
    socket.emit('game_start', {
      yourRole: playerRole,
      rooms: publicRooms,
      players: { hacker: hackerName, controller: controllerName },
      secondsRemaining: 600,
      isPractice: true,
      aiRole,
      difficulty,
    });

    gameState.timerInterval = setInterval(() => {
      if (!gameState) return;
      gameState.secondsRemaining--;
      io.emit('tick', { secondsRemaining: gameState.secondsRemaining });
      if (gameState.secondsRemaining <= 0) endGame();
    }, 1000);

    scheduleAiTurn(difficulty);
    console.log(`[PRACTICE] ${playerName} (${playerRole}) vs ${aiName} — difficulty: ${difficulty}`);
  });

  socket.on('set_ready', () => {
    if (!lobby.players[socket.id]) return;
    if (!lobby.players[socket.id].role) return;
    lobby.players[socket.id].ready = true;
    io.emit('lobby_update', getLobbyUpdate());
    tryStartGame();
  });

  socket.on('enter_room', ({ roomId }) => {
    if (!gameState) return;
    const role = gameState.players.hacker.socketId === socket.id ? 'hacker'
               : gameState.players.controller.socketId === socket.id ? 'controller' : null;
    if (!role) return;
    const room = gameState.rooms[roomId];
    if (!room) return;

    // Leave current room if in one
    const currentRoomId = gameState.players[role].currentRoomId;
    if (currentRoomId && gameState.rooms[currentRoomId]) {
      gameState.rooms[currentRoomId].occupant = null;
    }

    gameState.players[role].currentRoomId = roomId;
    room.occupant = role;

    // Refresh challenge data each entry with an incremented variant so the
    // controller always sees a different question from the hacker who just left
    if (room.challengeType !== 'usb_drop') {
      room.challengeVariantIndex = (room.challengeVariantIndex || 0) + 1;
      room.challengeData = generateChallengeData(room.challengeType, room.challengeVariantIndex);
    }

    const challengeData = { ...room.challengeData };
    // Strip server-only answer keys for client
    const stripped = { ...challengeData };

    socket.emit('room_entered', {
      roomId,
      challengeType: room.challengeType,
      challengeData: stripped,
      roomStatus: room.status,
      usbPlanted: room.usbPlanted,
    });

    io.emit('room_occupancy_update', {
      roomId,
      occupant: role,
      prevRoomId: currentRoomId,
    });
  });

  socket.on('leave_room', () => {
    if (!gameState) return;
    const role = gameState.players.hacker.socketId === socket.id ? 'hacker'
               : gameState.players.controller.socketId === socket.id ? 'controller' : null;
    if (!role) return;
    const currentRoomId = gameState.players[role].currentRoomId;
    if (!currentRoomId) return;
    gameState.rooms[currentRoomId].occupant = null;
    gameState.players[role].currentRoomId = null;
    io.emit('room_occupancy_update', { roomId: currentRoomId, occupant: null, prevRoomId: null });
    socket.emit('room_left', {});
  });

  socket.on('challenge_attempt', ({ roomId, answer }) => {
    if (!gameState) return;
    const role = gameState.players.hacker.socketId === socket.id ? 'hacker'
               : gameState.players.controller.socketId === socket.id ? 'controller' : null;
    if (!role) return;
    const room = gameState.rooms[roomId];
    if (!room) return;

    // Check cooldown
    if (room.cooldownUntil && Date.now() < room.cooldownUntil) {
      socket.emit('challenge_result', { success: false, roomId, message: 'Room is in cooldown!', newStatus: room.status });
      return;
    }

    const success = validateAnswer(room, role, answer);

    if (success) {
      const prevStatus = room.status;
      if (role === 'hacker') {
        room.status = 'red';
        if (room.challengeType === 'usb_drop') room.usbPlanted = true;
      } else {
        room.status = 'green';
        if (room.challengeType === 'usb_drop') room.usbPlanted = false;
      }
      // Only set cooldown if status actually changed
      if (prevStatus !== room.status) {
        room.cooldownUntil = Date.now() + 30000; // 30s cooldown
      }
      gameState.scores = recalcScores(gameState.rooms);
      io.emit('room_state_update', {
        roomId,
        status: room.status,
        usbPlanted: room.usbPlanted,
        scores: gameState.scores,
      });
    }

    socket.emit('challenge_result', {
      success,
      roomId,
      newStatus: room.status,
      message: success ? 'Success!' : 'Incorrect — try again!',
    });
  });

  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    const wasInLobby = !!lobby.players[socket.id];
    delete lobby.players[socket.id];

    if (gameState) {
      const role = gameState.players.hacker.socketId === socket.id ? 'hacker'
                 : gameState.players.controller.socketId === socket.id ? 'controller' : null;
      if (role) {
        if (gameState.ai && gameState.ai.turnTimeout) clearTimeout(gameState.ai.turnTimeout);
        clearInterval(gameState.timerInterval);
        if (!gameState.isPractice) io.emit('opponent_disconnected', { role });
        gameState = null;
        lobby.phase = 'waiting';
        lobby.players = {};
      }
    } else if (wasInLobby) {
      io.emit('lobby_update', getLobbyUpdate());
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`CyberDefend server running on http://localhost:${PORT}`);
});
