'use strict';
// ════════════════════════════════════════════════════════════════
//  CyberDefend — Room Explorer
//  Top-down Zelda-style room navigation engine
// ════════════════════════════════════════════════════════════════

const EW = 900, EH = 540, EWALL = 72, ESPEED = 220;
const EINTERACT = 74, ECW = 22, ECH = 30;
const ECOL = 10; // collision radius — smaller than drawn character for easier navigation
const EDEPTH = 6;

// ── Colour helpers ───────────────────────────────────────────
function eDark(hex, n = 35) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgb(${Math.max(0,r-n)},${Math.max(0,g-n)},${Math.max(0,b-n)})`;
}
function eRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Generic 2.5D box (centre-based) ─────────────────────────
function eCBox(ctx, cx, cy, w, h, top, side, d) {
  d = (d === undefined) ? EDEPTH : d;
  const x = cx - w/2, y = cy - h/2;
  ctx.save(); ctx.globalAlpha = 0.13; ctx.fillStyle = '#000';
  ctx.fillRect(x+4, y+4, w, h+d); ctx.restore();
  if (d > 0) { ctx.fillStyle = side; ctx.fillRect(x, y+h, w, d); }
  ctx.fillStyle = top; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
}

// ── Floor / walls ────────────────────────────────────────────
function drawFloor(ctx, t) {
  ctx.fillStyle = t.wall; ctx.fillRect(0, 0, EW, EH);
  ctx.fillStyle = t.trim;
  ctx.fillRect(0,0,EW,EWALL); ctx.fillRect(0,EH-EWALL,EW,EWALL);
  ctx.fillRect(0,0,EWALL,EH); ctx.fillRect(EW-EWALL,0,EWALL,EH);
  const fw = EW-EWALL*2, fh = EH-EWALL*2;
  ctx.fillStyle = t.floor; ctx.fillRect(EWALL,EWALL,fw,fh);
  const tw = t.tileW || 64;
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
  for (let x = EWALL; x <= EWALL+fw; x += tw) { ctx.beginPath(); ctx.moveTo(x,EWALL); ctx.lineTo(x,EWALL+fh); ctx.stroke(); }
  for (let y = EWALL; y <= EWALL+fh; y += tw) { ctx.beginPath(); ctx.moveTo(EWALL,y); ctx.lineTo(EWALL+fw,y); ctx.stroke(); }
  ctx.strokeStyle = t.trim; ctx.lineWidth = 2; ctx.strokeRect(EWALL+1,EWALL+1,fw-2,fh-2);
  // door cutout bottom centre
  ctx.fillStyle = eDark(t.trim, 20); ctx.fillRect(EW/2-28, EH-EWALL, 56, EWALL);
  ctx.fillStyle = '#131320'; ctx.fillRect(EW/2-24, EH-EWALL+2, 48, EWALL-4);
  if (t.decor) t.decor(ctx);
}

// ── Object drawers ───────────────────────────────────────────
function drawDesk(ctx, cx, cy, w, h, col) {
  w = w||80; h = h||50; col = col||'#A0784E';
  eCBox(ctx, cx, cy, w, h, col, eDark(col));
  const cw=26, ch=24;
  eCBox(ctx, cx, cy+h/2+ch/2+4, cw, ch, eDark(col,10), eDark(col,40), 3);
}

function drawComputer(ctx, cx, cy, w, h) {
  w = w||54; h = h||40;
  ctx.fillStyle = '#c0c0c0'; ctx.fillRect(cx-w/2, cy+h/2-12, w, 12);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; ctx.strokeRect(cx-w/2, cy+h/2-12, w, 12);
  const mw=w*0.72, mh=h-14, mx=cx-mw/2, my=cy-h/2;
  eCBox(ctx, cx, cy-h/2+mh/2, mw, mh, '#1a1a2e', '#0d0d1a', 3);
  ctx.fillStyle = '#003a70'; ctx.fillRect(mx+3, my+3, mw-6, mh-8);
  ctx.fillStyle = '#00ccff'; ctx.globalAlpha = 0.65;
  for (let i=0; i<3; i++) ctx.fillRect(mx+4, my+5+i*4, (mw-10)*(0.4+Math.random()*0.4), 2);
  ctx.globalAlpha = 1;
}

function drawShelf(ctx, cx, cy, w, h, col) {
  w=w||44; h=h||130; col=col||'#6B4C11';
  eCBox(ctx, cx, cy, w, h, col, eDark(col), 5);
  const cols=['#cc2244','#2255cc','#22aa44','#cc8822','#884499','#227799','#cc4422'];
  const bw=(w-8)/cols.length;
  cols.forEach((c,i) => { ctx.fillStyle=c; ctx.fillRect(cx-w/2+4+i*bw, cy-h/2+4, bw-2, h-8); });
}

function drawServerShelf(ctx, cx, cy, w, h) {
  w=w||52; h=h||130;
  eCBox(ctx, cx, cy, w, h, '#1e2030', '#0d0d1a', 6);
  for (let i=0; i<6; i++) {
    ctx.strokeStyle='#2a3050'; ctx.lineWidth=1; ctx.strokeRect(cx-w/2+2, cy-h/2+3+i*20, w-4, 17);
    const lc = i===2?'#ff4400':i===4?'#ffaa00':'#00ff44';
    ctx.fillStyle=lc; ctx.beginPath(); ctx.arc(cx+w/2-8, cy-h/2+12+i*20, 2.5, 0, Math.PI*2); ctx.fill();
  }
}

function drawBoard(ctx, cx, cy, w, h, isNotice) {
  w=w||44; h=h||150;
  const top = isNotice ? '#d4a55a' : '#f0f0f0';
  eCBox(ctx, cx, cy, w, h, top, eDark(top,20), 4);
  ctx.strokeStyle = isNotice?'#8B5E3C':'#aaa'; ctx.lineWidth=3; ctx.strokeRect(cx-w/2+2, cy-h/2+2, w-4, h-4);
  if (isNotice) {
    [[cx-w/2+4,cy-h/2+5,w-8,18,'#fff'],[cx-w/2+4,cy-h/2+27,w-8,16,'#fffde7'],
     [cx-w/2+4,cy-h/2+47,w-8,18,'#ccffcc'],[cx-w/2+4,cy-h/2+69,w-8,16,'#ffcccc']].forEach(([px,py,pw,ph,pc])=>{
      ctx.fillStyle=pc; ctx.fillRect(px,py,pw,ph); ctx.strokeStyle='#ccc'; ctx.lineWidth=0.5; ctx.strokeRect(px,py,pw,ph);
    });
  } else {
    ctx.strokeStyle='#88aaff'; ctx.lineWidth=1;
    for(let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(cx-w/2+5,cy-h/2+18+i*22); ctx.lineTo(cx+w/2-5,cy-h/2+18+i*22); ctx.stroke(); }
  }
}

function drawCabinet(ctx, cx, cy, w, h, col) {
  w=w||48; h=h||70; col=col||'#7a8a8a';
  eCBox(ctx, cx, cy, w, h, col, eDark(col), 5);
  const dh=(h-8)/3;
  for(let i=0;i<3;i++){
    ctx.strokeStyle=eDark(col,40); ctx.lineWidth=1; ctx.strokeRect(cx-w/2+4, cy-h/2+4+i*dh, w-8, dh-2);
    ctx.fillStyle='#ccc'; ctx.fillRect(cx-6, cy-h/2+6+i*dh+dh/2-2, 12, 4);
  }
}

function drawPlant(ctx, cx, cy) {
  ctx.fillStyle='#c05020'; ctx.beginPath(); ctx.ellipse(cx,cy+14,13,8,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3d1a08'; ctx.beginPath(); ctx.ellipse(cx,cy+10,10,5,0,0,Math.PI*2); ctx.fill();
  [['#228B22',0,-20,17,13],['#2d9e2d',-11,-15,13,11],['#1a6e1a',11,-15,13,11],['#33aa33',0,-10,15,12]].forEach(([c,ox,oy,rx,ry])=>{
    ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(cx+ox,cy+oy,rx,ry,ox/40,0,Math.PI*2); ctx.fill();
  });
}

function drawSink(ctx, cx, cy) {
  eCBox(ctx, cx, cy, 48, 36, '#d8e4e8', '#a0b4b8', 4);
  ctx.fillStyle='#b8ccd0'; ctx.fillRect(cx-16,cy-8,32,24);
  ctx.fillStyle='#777'; ctx.beginPath(); ctx.arc(cx,cy+6,4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#aaa'; ctx.fillRect(cx-3,cy-14,6,8);
}

function drawPiano(ctx, cx, cy, w) {
  w=w||130; const h=46;
  eCBox(ctx, cx, cy, w, h, '#111', '#000', 7);
  const kw=(w-8)/15;
  for(let i=0;i<15;i++){ ctx.fillStyle='#f8f8f8'; ctx.fillRect(cx-w/2+4+i*kw,cy-h/2+10,kw-1,h-16); ctx.strokeStyle='#bbb'; ctx.lineWidth=0.5; ctx.strokeRect(cx-w/2+4+i*kw,cy-h/2+10,kw-1,h-16); }
  [1,2,4,5,6,8,9,11,12,13].forEach(p=>{ ctx.fillStyle='#111'; ctx.fillRect(cx-w/2+4+p*kw-kw/4,cy-h/2+10,kw/2,(h-16)*0.6); });
}

function drawDrums(ctx, cx, cy) {
  ctx.fillStyle='#cc3311'; ctx.beginPath(); ctx.ellipse(cx,cy+4,22,14,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#aa2200'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='#e8d090'; ctx.beginPath(); ctx.ellipse(cx,cy-2,17,10,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ccaa44'; ctx.beginPath(); ctx.ellipse(cx-30,cy-14,13,4,0.3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ddbb55'; ctx.beginPath(); ctx.ellipse(cx+26,cy-18,12,3,-0.3,0,Math.PI*2); ctx.fill();
}

function drawMusicStand(ctx, cx, cy) {
  ctx.fillStyle='#888'; ctx.fillRect(cx-2,cy-26,4,36);
  ctx.strokeStyle='#777'; ctx.lineWidth=2;
  [[-14,14],[0,18],[14,14]].forEach(([ox,oy])=>{ ctx.beginPath(); ctx.moveTo(cx,cy+10); ctx.lineTo(cx+ox,cy+oy); ctx.stroke(); });
  ctx.fillStyle='#555'; ctx.fillRect(cx-18,cy-28,36,4);
  ctx.fillStyle='#fffde7'; ctx.fillRect(cx-15,cy-44,30,20);
  ctx.strokeStyle='#ccc'; ctx.lineWidth=0.5;
  for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(cx-13,cy-42+i*4); ctx.lineTo(cx+13,cy-42+i*4); ctx.stroke(); }
}

function drawGuitar(ctx, cx, cy) {
  ctx.fillStyle='#b86020'; ctx.beginPath(); ctx.ellipse(cx,cy-14,13,17,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#8a4010'; ctx.fillRect(cx-4,cy+2,8,4);
  ctx.fillStyle='#7a5020'; ctx.fillRect(cx-3,cy-46,7,36);
  ctx.fillStyle='#444'; ctx.fillRect(cx-5,cy-50,10,6);
  ctx.strokeStyle='#ccc'; ctx.lineWidth=0.5;
  [-2.5,-1,0.5,2].forEach(i=>{ ctx.beginPath(); ctx.moveTo(cx+i,cy-48); ctx.lineTo(cx+i,cy+6); ctx.stroke(); });
}

function drawEasel(ctx, cx, cy) {
  ctx.strokeStyle='#8B5E3C'; ctx.lineWidth=3;
  [[-16,18],[0,22],[16,18]].forEach(([ox,oy])=>{ ctx.beginPath(); ctx.moveTo(cx,cy-28); ctx.lineTo(cx+ox,cy+oy); ctx.stroke(); });
  ctx.fillStyle='#fffde7'; ctx.fillRect(cx-19,cy-52,38,28); ctx.strokeStyle='#8B5E3C'; ctx.lineWidth=2; ctx.strokeRect(cx-19,cy-52,38,28);
  ['#ff6644','#4488ff','#44cc44','#ffcc22'].forEach((c,i)=>{ ctx.fillStyle=c; ctx.fillRect(cx-17+i*8,cy-50,7,10); });
}

function drawPottery(ctx, cx, cy) {
  eCBox(ctx, cx, cy+12, 30, 16, '#5a3a1a', '#3a1a00', 3);
  ctx.fillStyle='#7a5a3a'; ctx.beginPath(); ctx.ellipse(cx,cy+4,20,12,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#5a3a1a'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle='#c07840'; ctx.beginPath(); ctx.ellipse(cx,cy-2,12,7,0,0,Math.PI*2); ctx.fill();
}

function drawStage(ctx, cx, cy, w, h) {
  w=w||210; h=h||88;
  eCBox(ctx, cx, cy, w, h, '#8B5E3C', '#5c3a20', 10);
  ctx.fillStyle='#a06830'; ctx.fillRect(cx-w/2+2,cy-h/2+2,w-4,8);
  ctx.fillStyle='#8B0000'; ctx.fillRect(cx-w/2,cy-h/2,20,h); ctx.fillRect(cx+w/2-20,cy-h/2,20,h);
  ctx.save(); ctx.globalAlpha=0.12; ctx.fillStyle='#ffffaa';
  ctx.beginPath(); ctx.ellipse(cx-40,cy+10,30,20,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+40,cy+10,30,20,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawCostumeRail(ctx, cx, cy, w) {
  w=w||110;
  ctx.fillStyle='#888'; ctx.fillRect(cx-w/2,cy-6,w,8);
  ctx.fillStyle='#666'; ctx.fillRect(cx-w/2+4,cy+2,8,22); ctx.fillRect(cx+w/2-12,cy+2,8,22);
  ctx.fillRect(cx-w/2,cy+20,22,4); ctx.fillRect(cx+w/2-22,cy+20,22,4);
  const cols=['#cc2244','#2255cc','#228844','#cc8822','#884499'];
  for(let i=0;i<5;i++){
    const hx=cx-w/2+14+i*(w-20)/5;
    ctx.strokeStyle='#aaa'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(hx+5,cy-6,5,0,Math.PI); ctx.stroke();
    ctx.fillStyle=cols[i]; ctx.fillRect(hx,cy-2,11,18);
  }
}

function drawIntercom(ctx, cx, cy) {
  eCBox(ctx, cx, cy, 32, 50, '#1e2030', '#0d0d1a', 3);
  ctx.strokeStyle='#333'; ctx.lineWidth=1;
  for(let i=0;i<6;i++) ctx.strokeRect(cx-12,cy-18+i*5,24,4);
  ctx.fillStyle='#00cc44'; ctx.beginPath(); ctx.arc(cx,cy+16,6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#ff4400'; ctx.beginPath(); ctx.arc(cx+10,cy-20,3,0,Math.PI*2); ctx.fill();
}

function drawWorkbench(ctx, cx, cy, w, h) {
  w=w||150; h=h||52;
  eCBox(ctx, cx, cy, w, h, '#8B7355', eDark('#8B7355'), 6);
  ctx.fillStyle='#666'; ctx.fillRect(cx+w/2-26,cy-h/2+4,20,16);
  ctx.fillStyle='#555'; ctx.fillRect(cx-w/2+8,cy-h/2+8,4,28); ctx.fillRect(cx-w/2+16,cy-h/2+6,22,6);
}

function drawPrinter3D(ctx, cx, cy) {
  eCBox(ctx, cx, cy, 60, 70, '#1a2030', '#0d0d1a', 5);
  ctx.fillStyle='#334455'; ctx.fillRect(cx-22,cy-2,44,30);
  ctx.fillStyle='#555'; ctx.fillRect(cx-20,cy-24,40,5);
  ctx.fillStyle='#ff6622'; ctx.fillRect(cx-8,cy-24,16,8);
  ctx.fillStyle='#22aaff'; ctx.fillRect(cx-10,cy+6,20,12);
}

function drawVending(ctx, cx, cy, col) {
  col=col||'#cc2244';
  eCBox(ctx, cx, cy, 52, 88, col, eDark(col,40), 6);
  ctx.fillStyle='#1a1a2e'; ctx.fillRect(cx-22,cy-36,44,30);
  ctx.font='10px Arial'; ctx.textAlign='center';
  ['🥤','🍫','🥤','🍫'].forEach((e,i)=>ctx.fillText(e,cx-12+(i%2)*24,cy-26+Math.floor(i/2)*14));
  ctx.fillStyle='#888'; ctx.fillRect(cx-22,cy-4,44,6);
  ctx.fillStyle='#333'; ctx.fillRect(cx-22,cy+4,44,20);
  [[cx-12,cy+10],[cx+2,cy+10],[cx-12,cy+18],[cx+2,cy+18]].forEach(([bx,by])=>{
    ctx.fillStyle='#cc4422'; ctx.beginPath(); ctx.arc(bx,by,3,0,Math.PI*2); ctx.fill();
  });
}

function drawTreadmill(ctx, cx, cy) {
  eCBox(ctx, cx, cy, 82, 44, '#2a2a4a', '#1a1a2e', 5);
  ctx.fillStyle='#444'; ctx.fillRect(cx-32,cy-6,64,22);
  ctx.strokeStyle='#666'; ctx.lineWidth=1;
  for(let i=0;i<5;i++) ctx.strokeRect(cx-32,cy-6+i*4,64,3);
  ctx.fillStyle='#1a1a2e'; ctx.fillRect(cx-28,cy-20,56,12);
  ctx.fillStyle='#00cc44'; ctx.fillRect(cx-24,cy-18,30,8);
}

function drawWeights(ctx, cx, cy) {
  ctx.fillStyle='#888'; ctx.fillRect(cx-36,cy-4,72,8);
  ctx.fillStyle='#222'; ctx.beginPath(); ctx.ellipse(cx-28,cy,12,18,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+28,cy,12,18,0,0,Math.PI*2); ctx.fill();
}

function drawBike(ctx, cx, cy) {
  ctx.strokeStyle='#666'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.moveTo(cx-20,cy+10); ctx.lineTo(cx+5,cy-12); ctx.lineTo(cx+20,cy+10); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx-16,cy+16,16,0,Math.PI*2); ctx.strokeStyle='#555'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='#777'; ctx.fillRect(cx-4,cy-18,10,4); ctx.fillRect(cx-14,cy-18,6,12); ctx.fillRect(cx+8,cy-18,6,12);
  ctx.fillStyle='#333'; ctx.fillRect(cx-4,cy-8,8,4);
}

function drawCounter(ctx, cx, cy, w, h, col) {
  w=w||180; h=h||50; col=col||'#c8a050';
  eCBox(ctx, cx, cy, w, h, col, eDark(col,25), 8);
  const lc = `rgb(${Math.min(255,parseInt(col.slice(1,3),16)+30)},${Math.min(255,parseInt(col.slice(3,5),16)+20)},${Math.min(255,parseInt(col.slice(5,7),16)+10)})`;
  ctx.fillStyle=lc; ctx.fillRect(cx-w/2-3,cy-h/2-7,w+6,13);
  ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=1; ctx.strokeRect(cx-w/2-3,cy-h/2-7,w+6,13);
}

function drawTrophy(ctx, cx, cy) {
  eCBox(ctx, cx, cy, 54, 68, '#c8a824', '#9a7a10', 5);
  ctx.fillStyle='#ffe080'; ctx.beginPath();
  ctx.moveTo(cx-13,cy-22); ctx.bezierCurveTo(cx-19,cy-2,cx-15,cy+6,cx,cy+8);
  ctx.bezierCurveTo(cx+15,cy+6,cx+19,cy-2,cx+13,cy-22); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#ccaa40'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(cx-15,cy-10,5,Math.PI/2,-Math.PI/2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx+15,cy-10,5,-Math.PI/2,Math.PI/2); ctx.stroke();
}

function drawAirCon(ctx, cx, cy, w) {
  w=w||110;
  eCBox(ctx, cx, cy, w, 36, '#ddd', '#bbb', 4);
  ctx.strokeStyle='#999'; ctx.lineWidth=1;
  for(let i=0;i<8;i++) ctx.strokeRect(cx-w/2+4,cy-10+i*3,w-8,2);
  ctx.fillStyle='#00cc44'; ctx.beginPath(); ctx.arc(cx+w/2-10,cy-8,3,0,Math.PI*2); ctx.fill();
}

function drawWaterCooler(ctx, cx, cy) {
  eCBox(ctx, cx, cy+4, 26, 44, '#c8d4dc', '#88a4ac', 4);
  ctx.fillStyle='rgba(100,180,220,0.6)'; ctx.fillRect(cx-8,cy-28,16,36);
  ctx.strokeStyle='rgba(80,160,200,0.5)'; ctx.lineWidth=1; ctx.strokeRect(cx-8,cy-28,16,36);
  ctx.fillStyle='#eee'; ctx.beginPath(); ctx.ellipse(cx,cy-30,10,6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#2255cc'; ctx.fillRect(cx-8,cy+20,7,6);
  ctx.fillStyle='#cc2222'; ctx.fillRect(cx+1,cy+20,7,6);
}

function drawBin(ctx, cx, cy) {
  eCBox(ctx, cx, cy, 32, 38, '#444', eDark('#444'), 4);
  ctx.fillStyle='#555'; ctx.fillRect(cx-14,cy-20,28,6);
  ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1; ctx.strokeRect(cx-14,cy-20,28,6);
}

function drawUSB(ctx, cx, cy) {
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(Math.PI/6);
  ctx.fillStyle='#2266cc'; ctx.fillRect(-16,-4,24,8);
  ctx.strokeStyle='#1144aa'; ctx.lineWidth=1; ctx.strokeRect(-16,-4,24,8);
  ctx.fillStyle='#ccc'; ctx.fillRect(8,-3,8,6);
  ctx.fillStyle='#00ff88'; ctx.beginPath(); ctx.arc(-8,0,2,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawMicroscope(ctx, cx, cy) {
  eCBox(ctx, cx, cy+14, 28, 12, '#888', '#555', 3);
  ctx.fillStyle='#777'; ctx.fillRect(cx-5,cy-10,10,28);
  ctx.fillStyle='#555'; ctx.beginPath(); ctx.ellipse(cx,cy-10,12,8,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(cx,cy-18,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#99ccff'; ctx.beginPath(); ctx.arc(cx,cy+12,6,0,Math.PI*2); ctx.fill();
}

function drawScienceBench(ctx, cx, cy, w, h) {
  w=w||160; h=h||52;
  eCBox(ctx, cx, cy, w, h, '#c8d4c0', eDark('#c8d4c0'), 5);
  ctx.fillStyle='#666'; ctx.fillRect(cx-60,cy-8,10,20); ctx.fillRect(cx-64,cy+10,18,5);
  ctx.fillStyle='rgba(100,200,255,0.5)'; ctx.beginPath(); ctx.ellipse(cx-55,cy-12,5,9,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(100,200,255,0.4)';
  ctx.beginPath(); ctx.moveTo(cx+20,cy-14); ctx.lineTo(cx+14,cy+8); ctx.lineTo(cx+30,cy+8); ctx.lineTo(cx+24,cy-14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,100,200,0.5)'; ctx.lineWidth=1; ctx.stroke();
  [cx+44, cx+54].forEach(tx=>{
    ctx.fillStyle='rgba(200,100,255,0.5)'; ctx.fillRect(tx-3,cy-10,6,20);
    ctx.strokeStyle='rgba(150,50,200,0.5)'; ctx.lineWidth=1; ctx.strokeRect(tx-3,cy-10,6,20);
  });
}

function drawSafetyShower(ctx, cx, cy) {
  ctx.fillStyle='#dddd00'; ctx.fillRect(cx-4,cy-40,8,52); ctx.fillRect(cx-22,cy-42,44,6);
  ctx.strokeStyle='#dddd00'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy-30,8,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.font='bold 7px sans-serif'; ctx.textAlign='center';
  ctx.fillText('SAFETY',cx,cy+20); ctx.fillText('SHOWER',cx,cy+30);
}

function drawMagazineRack(ctx, cx, cy) {
  eCBox(ctx, cx, cy, 32, 50, '#8B5E3C', '#5c3a20', 4);
  ['#cc2244','#2255cc','#22aa44','#cc8822'].forEach((c,i)=>{ ctx.fillStyle=c; ctx.fillRect(cx-12,cy-20+i*10,24,9); });
}

function drawSignIn(ctx, cx, cy) {
  eCBox(ctx, cx, cy, 42, 30, '#fffde7', '#e8d8a0', 3);
  ctx.strokeStyle='#ccc'; ctx.lineWidth=0.5;
  for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(cx-16,cy-10+i*6); ctx.lineTo(cx+16,cy-10+i*6); ctx.stroke(); }
  ctx.strokeStyle='#333'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx+8,cy-14); ctx.lineTo(cx+18,cy-4); ctx.stroke();
}

function drawLockerPanel(ctx, cx, cy) {
  eCBox(ctx, cx, cy, 54, 80, '#4a5a6a', '#2a3a4a', 5);
  ctx.fillStyle='#1a1a2e'; ctx.fillRect(cx-18,cy-26,36,44);
  for(let r=0;r<3;r++) for(let c=0;c<3;c++){
    ctx.fillStyle='#2a3a5a'; ctx.fillRect(cx-14+c*12,cy-22+r*12,10,10);
    ctx.fillStyle='#4a6a9a'; ctx.beginPath(); ctx.arc(cx-9+c*12,cy-17+r*12,3,0,Math.PI*2); ctx.fill();
  }
  ctx.fillStyle='#00ff44'; ctx.fillRect(cx-14,cy+22,28,8);
}

function drawReceptionDesk(ctx, cx, cy, w, h) {
  w=w||180; h=h||56;
  eCBox(ctx, cx, cy, w, h, '#8B6914', eDark('#8B6914'), 8);
  ctx.fillStyle='#c8a050'; ctx.fillRect(cx-w/2-4,cy-h/2-7,w+8,13);
  ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=1; ctx.strokeRect(cx-w/2-4,cy-h/2-7,w+8,13);
}

function drawLostProperty(ctx, cx, cy) {
  eCBox(ctx, cx, cy, 54, 40, '#8B5E3C', '#5c3a20', 4);
  ctx.fillStyle='#fff'; ctx.font='bold 7px sans-serif'; ctx.textAlign='center';
  ctx.fillText('LOST',cx,cy-4); ctx.fillText('PROPERTY',cx,cy+6);
}

function drawLockerRow(ctx, cx, cy, w, h, col) {
  w=w||44; h=h||200; col=col||'#5588aa';
  const n=4, lh=h/n;
  for(let i=0;i<n;i++){
    const lcy=cy-h/2+i*lh+lh/2;
    eCBox(ctx, cx, lcy, w, lh-2, col, eDark(col), 5);
    ctx.strokeStyle=eDark(col,20); ctx.lineWidth=1;
    for(let j=0;j<3;j++){ ctx.beginPath(); ctx.moveTo(cx-w/2+4,lcy-lh/2+8+j*8); ctx.lineTo(cx+w/2-4,lcy-lh/2+8+j*8); ctx.stroke(); }
    ctx.fillStyle='#ccc'; ctx.fillRect(cx+w/2-12,lcy-4,4,8);
  }
}

// ── Text wrap ────────────────────────────────────────────────
function eWrap(text, maxW, ctx) {
  ctx.font='12px "Share Tech Mono",monospace';
  const words=text.split(' '), lines=[];
  let line='';
  for(const w of words){
    const test=line?line+' '+w:w;
    if(ctx.measureText(test).width>maxW){ lines.push(line); line=w; }
    else line=test;
  }
  if(line) lines.push(line);
  return lines;
}

// ── Object dispatcher ────────────────────────────────────────
function drawObject(ctx, obj) {
  const x=obj.x, y=obj.y, w=obj.w||60, h=obj.h||60;
  switch(obj.type) {
    case 'desk':         drawDesk(ctx,x,y,w,h,obj.col); break;
    case 'computer':     drawComputer(ctx,x,y,w,h); break;
    case 'shelf':        drawShelf(ctx,x,y,w,h,obj.col); break;
    case 'server_shelf': drawServerShelf(ctx,x,y,w,h); break;
    case 'board':        drawBoard(ctx,x,y,w,h,false); break;
    case 'noticeboard':  drawBoard(ctx,x,y,w,h,true); break;
    case 'cabinet':      drawCabinet(ctx,x,y,w,h,obj.col); break;
    case 'plant':        drawPlant(ctx,x,y); break;
    case 'sink':         drawSink(ctx,x,y); break;
    case 'piano':        drawPiano(ctx,x,y,w); break;
    case 'drums':        drawDrums(ctx,x,y); break;
    case 'music_stand':  drawMusicStand(ctx,x,y); break;
    case 'guitar':       drawGuitar(ctx,x,y); break;
    case 'easel':        drawEasel(ctx,x,y); break;
    case 'pottery':      drawPottery(ctx,x,y); break;
    case 'stage':        drawStage(ctx,x,y,w,h); break;
    case 'costume_rail': drawCostumeRail(ctx,x,y,w); break;
    case 'intercom':     drawIntercom(ctx,x,y); break;
    case 'workbench':    drawWorkbench(ctx,x,y,w,h); break;
    case 'printer3d':    drawPrinter3D(ctx,x,y); break;
    case 'vending':      drawVending(ctx,x,y,obj.col); break;
    case 'treadmill':    drawTreadmill(ctx,x,y); break;
    case 'weights':      drawWeights(ctx,x,y); break;
    case 'bike':         drawBike(ctx,x,y); break;
    case 'counter':      drawCounter(ctx,x,y,w,h,obj.col); break;
    case 'trophy':       drawTrophy(ctx,x,y); break;
    case 'usb':          drawUSB(ctx,x,y); break;
    case 'microscope':   drawMicroscope(ctx,x,y); break;
    case 'sciencebench': drawScienceBench(ctx,x,y,w,h); break;
    case 'shower':       drawSafetyShower(ctx,x,y); break;
    case 'magazine':     drawMagazineRack(ctx,x,y); break;
    case 'signin':       drawSignIn(ctx,x,y); break;
    case 'lockerpanel':  drawLockerPanel(ctx,x,y); break;
    case 'reception':    drawReceptionDesk(ctx,x,y,w,h); break;
    case 'bin':          drawBin(ctx,x,y); break;
    case 'cooler':       drawWaterCooler(ctx,x,y); break;
    case 'aircon':       drawAirCon(ctx,x,y,w); break;
    case 'lostprop':     drawLostProperty(ctx,x,y); break;
    case 'locker_row':   drawLockerRow(ctx,x,y,w,h,obj.col); break;
    default:             eCBox(ctx,x,y,w,h,obj.col||'#6a6a6a',eDark(obj.col||'#6a6a6a')); break;
  }
}

// ── Character (top-down Zelda style) ────────────────────────
function drawChar(ctx, cx, cy, facing, frame, moving, role) {
  const isH = role === 'hacker';
  const SKIN='#F5C5A3', HAIR=isH?'#111111':'#5a3a1a';
  const BODY=isH?'#1e2030':'#1e4a8a', PANTS=isH?'#111118':'#3a3a5a', HOOD='#2a2a3e';
  const bob = moving ? Math.sin(frame*Math.PI)*2 : 0;
  const y = cy + bob;
  const leg = moving ? Math.sin(frame*Math.PI)*5 : 0;

  // shadow
  ctx.save(); ctx.globalAlpha=0.2; ctx.fillStyle='#000';
  ctx.beginPath(); ctx.ellipse(cx,cy+24,14,5,0,0,Math.PI*2); ctx.fill(); ctx.restore();

  if (facing === 'down') {
    ctx.fillStyle=PANTS; ctx.fillRect(cx-9,y+8,8,13+leg); ctx.fillRect(cx+1,y+8,8,13-leg);
    ctx.fillStyle='#222'; ctx.fillRect(cx-10,y+19+leg,9,5); ctx.fillRect(cx+1,y+19-leg,9,5);
    ctx.fillStyle=BODY; ctx.beginPath(); ctx.roundRect(cx-13,y-7,26,17,4); ctx.fill();
    if(isH){ ctx.fillStyle=HOOD; ctx.beginPath(); ctx.ellipse(cx,y-14,13,9,0,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle=SKIN; ctx.beginPath(); ctx.ellipse(cx,y-14,8,10,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=HAIR; ctx.beginPath(); ctx.ellipse(cx,y-(isH?20:21),isH?10:9,isH?6:5,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#2a1a1a'; ctx.beginPath(); ctx.ellipse(cx-3,y-14,2,2.5,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+3,y-14,2,2.5,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#c09080'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx-3,y-9); ctx.lineTo(cx+3,y-9); ctx.stroke();
  } else if (facing === 'up') {
    ctx.fillStyle=PANTS; ctx.fillRect(cx-9,y+8,8,13+leg); ctx.fillRect(cx+1,y+8,8,13-leg);
    ctx.fillStyle='#222'; ctx.fillRect(cx-10,y+19+leg,9,5); ctx.fillRect(cx+1,y+19-leg,9,5);
    ctx.fillStyle=eDark(BODY,10); ctx.beginPath(); ctx.roundRect(cx-13,y-7,26,17,4); ctx.fill();
    if(isH){ ctx.fillStyle=HOOD; ctx.beginPath(); ctx.ellipse(cx,y-18,13,9,0,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle=HAIR; ctx.beginPath(); ctx.ellipse(cx,y-14,9,11,0,0,Math.PI*2); ctx.fill();
  } else {
    const d=facing==='right'?1:-1;
    ctx.fillStyle=PANTS; ctx.fillRect(cx-5,y+8,10,13+leg); ctx.fillStyle='#222'; ctx.fillRect(cx-5+d*2,y+19,10,5);
    ctx.fillStyle=BODY; ctx.beginPath(); ctx.roundRect(cx-10,y-7,20,17,4); ctx.fill();
    if(isH){ ctx.fillStyle=HOOD; ctx.beginPath(); ctx.ellipse(cx+d*2,y-13,12,9,0,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle=SKIN; ctx.beginPath(); ctx.ellipse(cx+d*2,y-14,8,10,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=HAIR; ctx.beginPath(); ctx.ellipse(cx+d*1,y-20,9,6,0.2*d,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#2a1a1a'; ctx.beginPath(); ctx.ellipse(cx+d*7,y-14,2,2.5,0,0,Math.PI*2); ctx.fill();
  }
}

// ── Room definitions (all 16) ────────────────────────────────
const ROOM_DEFS = {
  classroom_a: {
    theme:{ floor:'#D4C4A0', wall:'#7A6248', trim:'#5C4A35', tileW:64 },
    objects:[
      {id:'sd1',type:'desk',x:230,y:230,w:78,h:48,name:'Student Desk',flavor:'An open exercise book. Someone drew a cartoon instead of taking notes.'},
      {id:'sd2',type:'desk',x:370,y:230,w:78,h:48,name:'Student Desk',flavor:'A half-eaten lunch and a forgotten pencil case.'},
      {id:'sd3',type:'desk',x:510,y:230,w:78,h:48,name:'Student Desk',flavor:'A maths worksheet. Most of the answers are wrong.'},
      {id:'sd4',type:'desk',x:230,y:340,w:78,h:48,name:'Student Desk',flavor:'Nothing unusual — just a pile of textbooks.'},
      {id:'sd5',type:'desk',x:370,y:340,w:78,h:48,name:'Student Desk',flavor:'A crumpled test paper. The grade has been scribbled out.'},
      {id:'sd6',type:'desk',x:510,y:340,w:78,h:48,name:'Student Desk',flavor:'An empty water bottle and some coloured pens.'},
      {id:'bs1',type:'shelf',x:100,y:250,w:44,h:130,name:'Bookshelf',flavor:'GCSE textbooks — maths, English, science. Nothing unusual.'},
      {id:'pl1',type:'plant',x:840,y:118,name:'Plant',flavor:'A wilting fiddleleaf fig. It really needs watering.'},
      {id:'wb1',type:'board',x:840,y:295,w:44,h:155,name:'Whiteboard',flavor:'"Monday: Network Security Basics — homework due Friday."'},
      {id:'td',type:'desk',x:680,y:155,w:100,h:60,col:'#8B6914',name:"Teacher\'s Desk",flavor:"The teacher\'s desk — covered in red-pen marking."},
      {id:'tc',type:'computer',x:680,y:144,w:52,h:38,name:"Teacher\'s Computer",isChallenge:true},
    ]
  },
  classroom_b: {
    theme:{ floor:'#CEC0A2', wall:'#7A6248', trim:'#5C4A35', tileW:64 },
    objects:[
      {id:'sd1',type:'desk',x:200,y:240,w:78,h:48,name:'Student Desk',flavor:'A history essay about the Tudors. It needs more detail.'},
      {id:'sd2',type:'desk',x:360,y:240,w:78,h:48,name:'Student Desk',flavor:'A geography map with crayon marks all over it.'},
      {id:'sd3',type:'desk',x:200,y:360,w:78,h:48,name:'Student Desk',flavor:'A science project on volcanoes. Papier mâché bits everywhere.'},
      {id:'sd4',type:'desk',x:360,y:360,w:78,h:48,name:'Student Desk',flavor:'Completely empty. Whoever sits here is very tidy.'},
      {id:'td',type:'desk',x:590,y:155,w:100,h:60,col:'#8B6914',name:"Teacher\'s Desk",flavor:'Lesson plans and a mug of cold tea.'},
      {id:'tc',type:'computer',x:590,y:148,w:52,h:38,name:'Classroom Computer',flavor:'A login screen. You do not have access.'},
      {id:'fc',type:'cabinet',x:840,y:210,w:48,h:68,col:'#7a8a8a',name:'Filing Cabinet',flavor:'Locked. Label reads "STUDENT RECORDS — CONFIDENTIAL".'},
      {id:'pr',type:'cabinet',x:840,y:340,w:50,h:40,col:'#cccccc',name:'Printer',flavor:'The paper tray is empty. An error light is flashing.'},
      {id:'pl1',type:'plant',x:100,y:120,name:'Plant',flavor:'A healthy spider plant. Someone has been watering it.'},
      {id:'nb',type:'noticeboard',x:450,y:95,w:170,h:44,name:'Noticeboard',isChallenge:true},
    ]
  },
  computer_lab: {
    theme:{ floor:'#C0C8D2', wall:'#3a4a5a', trim:'#2a3a4a', tileW:60,
      decor(ctx){ ctx.fillStyle='rgba(0,200,255,0.03)'; ctx.fillRect(EWALL,EWALL,EW-EWALL*2,EH-EWALL*2); }
    },
    objects:[
      {id:'pc1',type:'computer',x:210,y:215,w:52,h:38,name:'Workstation 1',flavor:'A student\'s Python homework — lots of syntax errors.'},
      {id:'pc2',type:'computer',x:370,y:215,w:52,h:38,name:'Workstation 2',flavor:'A browser left open on a social media page.'},
      {id:'pc3',type:'computer',x:530,y:215,w:52,h:38,name:'Workstation 3',flavor:'A game is minimised in the taskbar. Cheeky.'},
      {id:'pc4',type:'computer',x:210,y:355,w:52,h:38,name:'Workstation 4',flavor:'Half-finished spreadsheet assignment.'},
      {id:'pc5',type:'computer',x:370,y:355,w:52,h:38,name:'Workstation 5',flavor:'The screensaver is a fish tank. Very peaceful.'},
      {id:'pc6',type:'computer',x:530,y:355,w:52,h:38,name:'Workstation 6',flavor:'A dark-theme IDE with a half-written function.'},
      {id:'wb1',type:'board',x:840,y:280,w:44,h:160,name:'Whiteboard',flavor:'"Today: Understanding Firewalls & Network Ports"'},
      {id:'cab',type:'cabinet',x:700,y:120,w:54,h:40,col:'#4a5a6a',name:'Equipment Cabinet',flavor:'Spare cables, USB hubs, and replacement keyboards.'},
      {id:'sr',type:'server_shelf',x:100,y:215,w:52,h:120,name:'Network Server Rack',isChallenge:true},
    ]
  },
  library: {
    theme:{ floor:'#D4BEA0', wall:'#8B6914', trim:'#6B5010', tileW:64 },
    objects:[
      {id:'bs1',type:'shelf',x:100,y:185,w:44,h:130,name:'Fiction Shelf (A–F)',flavor:'Fiction A–F. A book on hacking is suspiciously missing.'},
      {id:'bs2',type:'shelf',x:100,y:330,w:44,h:130,name:'Non-Fiction Shelf',flavor:'Encyclopaedias, atlases, a battered Python textbook.'},
      {id:'bs3',type:'shelf',x:240,y:108,w:160,h:44,name:'Reference Shelf',flavor:'"Network Security for Beginners" has been checked out.'},
      {id:'rt',type:'desk',x:510,y:310,w:130,h:70,col:'#A0784E',name:'Reading Table',flavor:'Two open books and a half-finished crossword puzzle.'},
      {id:'ch1',type:'desk',x:420,y:390,w:34,h:34,col:'#7a5a30',name:'Reading Chair',flavor:'A well-worn armchair. Very comfortable looking.',passable:true},
      {id:'ch2',type:'desk',x:600,y:390,w:34,h:34,col:'#7a5a30',name:'Reading Chair',flavor:'Someone left a bookmark in this chair. Page 247.',passable:true},
      {id:'gl',type:'desk',x:700,y:415,w:40,h:40,col:'#4a8a5a',name:'Globe',flavor:'A dusty globe. Someone has drawn a small star on Great Britain.'},
      {id:'ld',type:'desk',x:720,y:150,w:100,h:58,col:'#8B6914',name:"Librarian\'s Desk",flavor:'A stack of returned books waiting to be re-shelved.'},
      {id:'lc',type:'computer',x:720,y:140,w:52,h:38,name:'Library Terminal',isChallenge:true},
    ]
  },
  science_lab: {
    theme:{ floor:'#C2D4C8', wall:'#3a6a4a', trim:'#2a5a3a', tileW:60 },
    objects:[
      {id:'sb1',type:'sciencebench',x:360,y:215,w:160,h:52,name:'Lab Bench A',flavor:'Half-completed electrolysis experiment. The solution is bright blue.'},
      {id:'sb2',type:'sciencebench',x:360,y:370,w:160,h:52,name:'Lab Bench B',flavor:'A titration setup. The burette is dripping slowly.'},
      {id:'ms1',type:'microscope',x:195,y:215,name:'Microscope A',flavor:'A powerful microscope. A slide of onion cells is loaded.'},
      {id:'ms2',type:'microscope',x:195,y:370,name:'Microscope B',flavor:'Pond water sample on this one. Something is moving in it.'},
      {id:'si',type:'sink',x:840,y:400,name:'Lab Sink',flavor:'A stainless steel sink. A safety notice says to wash hands.'},
      {id:'sh',type:'shower',x:100,y:165,name:'Safety Shower',flavor:'Emergency shower — yellow handle. For chemical spills.'},
      {id:'cc',type:'cabinet',x:100,y:385,w:54,h:70,col:'#5a7a5a',name:'Chemical Cabinet',flavor:'Locked chemical storage. Biohazard symbol on the door.'},
      {id:'sc',type:'computer',x:760,y:130,w:52,h:38,name:'Lab Computer',isChallenge:true},
    ]
  },
  art_room: {
    theme:{ floor:'#D4C0B2', wall:'#8B5E3C', trim:'#6B3E2C', tileW:64 },
    objects:[
      {id:'ea1',type:'easel',x:210,y:210,name:'Easel A',flavor:'A half-finished watercolour landscape. Actually quite good.'},
      {id:'ea2',type:'easel',x:385,y:200,name:'Easel B',flavor:'An abstract piece in bold primary colours. Interpretation unclear.'},
      {id:'ea3',type:'easel',x:555,y:210,name:'Easel C',flavor:"A portrait of a teacher. It's not very flattering."},
      {id:'pw',type:'pottery',x:200,y:390,name:'Pottery Wheel',flavor:'A lopsided clay bowl drying on the wheel.',passable:true},
      {id:'ab',type:'workbench',x:520,y:405,w:160,h:50,name:'Art Bench',flavor:'Covered in dried paint, brushes, and a palette of mixed colours.',passable:true},
      {id:'sc',type:'cabinet',x:840,y:200,w:50,h:70,col:'#8B5E3C',name:'Supply Cabinet',flavor:'Paints, brushes, clay, pastels. Very disorganised.'},
      {id:'si',type:'sink',x:840,y:365,name:'Art Sink',flavor:'The sink is stained with every colour of the rainbow.'},
      {id:'ac',type:'computer',x:760,y:130,w:52,h:38,name:'Art Department Computer',isChallenge:true},
    ]
  },
  music_room: {
    theme:{ floor:'#C8C0D4', wall:'#4a3a6a', trim:'#3a2a5a', tileW:64 },
    objects:[
      {id:'pi',type:'piano',x:420,y:118,w:150,name:'Upright Piano',flavor:'An upright piano. The middle C key sticks slightly.'},
      {id:'dr',type:'drums',x:200,y:390,name:'Drum Kit',flavor:'A full drum kit. Some sticks are missing from the snare.'},
      {id:'gu',type:'guitar',x:780,y:400,name:'Guitar on Stand',flavor:"An acoustic guitar. It's out of tune."},
      {id:'ms1',type:'music_stand',x:320,y:290,name:'Music Stand',flavor:'"Für Elise" sheet music. Several fingerings are marked wrong in red.'},
      {id:'ms2',type:'music_stand',x:500,y:290,name:'Music Stand',flavor:'Orchestra practice sheets. Lots of red corrections.'},
      {id:'mc',type:'shelf',x:100,y:285,w:44,h:110,col:'#4a3a5a',name:'Sheet Music Cabinet',flavor:'Hundreds of pieces of sheet music, mostly unsorted.'},
      {id:'md',type:'desk',x:785,y:155,w:100,h:60,col:'#1a1a2e',name:'Mixing Desk',flavor:'An audio mixing desk with lots of sliders and knobs.'},
      {id:'mc2',type:'computer',x:785,y:144,w:52,h:38,name:'Studio Computer',isChallenge:true},
    ]
  },
  drama_room: {
    theme:{ floor:'#C8B8A2', wall:'#6a3a1a', trim:'#4a2a0a', tileW:64 },
    objects:[
      {id:'st',type:'stage',x:320,y:185,w:240,h:90,name:'Stage',flavor:"A raised wooden stage. The boards creak when you walk on it."},
      {id:'cr',type:'costume_rail',x:790,y:215,w:110,name:'Costume Rail',flavor:'Costumes for the upcoming school production of "Grease".'},
      {id:'pc',type:'cabinet',x:840,y:395,w:52,h:64,col:'#4a2a0a',name:'Props Cabinet',flavor:'Stage props — a rubber sword, a fake skull, a stack of hats.'},
      {id:'ch1',type:'desk',x:500,y:425,w:32,h:32,col:'#5a3a1a',name:'Audience Chair',flavor:'A plastic chair from the audience area.',passable:true},
      {id:'ch2',type:'desk',x:580,y:425,w:32,h:32,col:'#5a3a1a',name:'Audience Chair',flavor:"There's some chewing gum stuck underneath this one.",passable:true},
      {id:'ch3',type:'desk',x:660,y:425,w:32,h:32,col:'#5a3a1a',name:'Audience Chair',flavor:'A coat draped over it and a water bottle on the floor beside it.',passable:true},
      {id:'mi',type:'cabinet',x:100,y:190,w:42,h:80,col:'#2a2a2a',name:'Full-Length Mirror',flavor:'A large mirror. You can see yourself — and the whole room behind you.'},
      {id:'ic',type:'intercom',x:840,y:335,name:'Wall Intercom',isChallenge:true},
    ]
  },
  sports_hall: {
    theme:{ floor:'#C4D0B8', wall:'#5a7a3a', trim:'#4a6a2a', tileW:70,
      decor(ctx){
        ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=2;
        ctx.strokeRect(200,180,500,250);
        ctx.beginPath(); ctx.arc(450,305,65,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(450,180); ctx.lineTo(450,430); ctx.stroke();
      }
    },
    objects:[
      {id:'bh',type:'desk',x:450,y:96,w:80,h:44,col:'#ff8800',name:'Basketball Hoop',flavor:'A basketball hoop high on the wall. The net is frayed.'},
      {id:'er',type:'cabinet',x:100,y:260,w:54,h:160,col:'#4a5a6a',name:'Equipment Rack',flavor:'Sports equipment — bibs, cones, a deflated football.'},
      {id:'bn',type:'desk',x:450,y:455,w:300,h:36,col:'#8B7355',name:'Spectator Bench',flavor:'Wooden benches along the wall for spectators.',passable:true},
      {id:'fa',type:'cabinet',x:840,y:155,w:52,h:64,col:'#cc2222',name:'First Aid Station',flavor:'A first aid cabinet. Fully stocked. Nothing suspicious here.'},
      {id:'sb',type:'desk',x:840,y:315,w:60,h:44,col:'#2a2a3a',name:'Scoreboard',flavor:'Electronic scoreboard. HOME: 3 — AWAY: 3.'},
      {id:'et',type:'workbench',x:190,y:148,w:120,h:48,col:'#5a6a4a',name:'Equipment Table',flavor:'A table used by the PE teacher for setting up activities.'},
      {id:'tab',type:'computer',x:190,y:136,w:44,h:32,name:'PE Tablet',isChallenge:true},
    ]
  },
  gymnasium: {
    theme:{ floor:'#C4BCAC', wall:'#5a4a3a', trim:'#4a3a2a', tileW:64 },
    objects:[
      {id:'tr',type:'treadmill',x:210,y:190,name:'Treadmill',flavor:'The display shows someone ran 5km today.'},
      {id:'wt',type:'weights',x:490,y:185,name:'Weight Rack',flavor:'A barbell with 20kg plates loaded on each side.'},
      {id:'bi',type:'bike',x:760,y:185,name:'Exercise Bike',flavor:'A stationary bike. The resistance is set to maximum.'},
      {id:'bn',type:'desk',x:360,y:420,w:180,h:36,col:'#6a5a4a',name:'Gym Bench',flavor:'A padded gym bench. There\'s a towel left on it.',passable:true},
      {id:'wc',type:'cooler',x:840,y:420,name:'Water Cooler',flavor:'Cold water cooler. No cups left.'},
      {id:'mir',type:'cabinet',x:840,y:275,w:44,h:100,col:'#8a8a8a',name:'Mirror Wall',flavor:'A floor-to-ceiling mirror. You look like you should exercise more.'},
      {id:'lr',type:'locker_row',x:100,y:290,w:44,h:200,col:'#5588aa',name:'PE Lockers',flavor:'A row of lockers. Most have standard padlocks — except one which has a digital panel.'},
      {id:'lok',type:'lockerpanel',x:100,y:425,name:'Locker Access Panel',isChallenge:true},
    ]
  },
  cafeteria: {
    theme:{ floor:'#D4C8B2', wall:'#8B6430', trim:'#6B4420', tileW:64 },
    objects:[
      {id:'t1',type:'desk',x:260,y:305,w:130,h:58,col:'#A0784E',name:'Dining Table 1',flavor:'Leftover lunch trays. Someone spilled their orange juice.',passable:true},
      {id:'t2',type:'desk',x:450,y:325,w:130,h:58,col:'#A0784E',name:'Dining Table 2',flavor:'Neatly cleared. A forgotten water bottle is the only thing left.',passable:true},
      {id:'t3',type:'desk',x:640,y:305,w:130,h:58,col:'#A0784E',name:'Dining Table 3',flavor:'A copy of the school newsletter and some crumbs.',passable:true},
      {id:'vc',type:'vending',x:840,y:315,col:'#1a4a8a',name:'Vending Machine',flavor:"A cold drinks vending machine. You don't have any change."},
      {id:'nb',type:'noticeboard',x:100,y:162,w:80,h:60,name:'Notice Board',flavor:'Lunch menu, trip notices, and a missing cat poster.'},
      {id:'bi',type:'bin',x:840,y:430,name:'Recycling Bin',flavor:'Someone has put a sandwich wrapper in the paper recycling.'},
      {id:'co',type:'counter',x:500,y:140,w:230,h:48,name:'Serving Counter',flavor:'The serving counter. The hotplate is still warm from lunch.'},
      {id:'cr',type:'computer',x:690,y:128,w:46,h:34,name:'Cash Register Terminal',isChallenge:true},
    ]
  },
  office: {
    theme:{ floor:'#CCCCD8', wall:'#4a5a6a', trim:'#3a4a5a', tileW:60 },
    objects:[
      {id:'fc1',type:'cabinet',x:100,y:190,w:48,h:70,col:'#7a8a8a',name:'Filing Cabinet A',flavor:'Staff records and invoices. Locked.'},
      {id:'fc2',type:'cabinet',x:100,y:320,w:48,h:70,col:'#7a8a8a',name:'Filing Cabinet B',flavor:'Slightly ajar. Contains budget spreadsheets.'},
      {id:'fc3',type:'cabinet',x:840,y:295,w:48,h:70,col:'#7a8a8a',name:'Filing Cabinet C',flavor:'"IT EQUIPMENT — DO NOT DISCARD". Locked with a key.'},
      {id:'vc1',type:'desk',x:310,y:400,w:34,h:34,col:'#5a5a6a',name:'Visitor Chair',flavor:'A waiting area chair. A magazine from 2019 on the armrest.',passable:true},
      {id:'vc2',type:'desk',x:590,y:400,w:34,h:34,col:'#5a5a6a',name:'Visitor Chair',flavor:"A coat has been left draped over it.",passable:true},
      {id:'pl1',type:'plant',x:840,y:145,name:'Office Plant',flavor:'A neat fern. The admin staff clearly look after it well.'},
      {id:'nb1',type:'noticeboard',x:840,y:365,w:44,h:80,name:'Notice Board',flavor:'Fire escape routes, IT security policies, birthday card for "Dave".'},
      {id:'pr',type:'cabinet',x:100,y:430,w:64,h:44,col:'#cccccc',name:'Printer/Scanner',flavor:'A multifunction printer. The scan history is locked.'},
      {id:'rd',type:'reception',x:490,y:162,w:200,h:52,name:'Reception Desk',flavor:'The main reception desk. Nameplate: "Mrs. T. Clarke — Admin".'},
      {id:'rc',type:'computer',x:640,y:148,w:52,h:38,name:'Admin Computer',isChallenge:true},
    ]
  },
  server_room: {
    theme:{ floor:'#181828', wall:'#0a0a18', trim:'#1a2030', tileW:48,
      decor(ctx){
        ctx.fillStyle='rgba(0,50,100,0.06)'; ctx.fillRect(EWALL,EWALL,EW-EWALL*2,EH-EWALL*2);
        for(let i=0;i<6;i++){ ctx.fillStyle=`rgba(0,${80+i*18},255,0.04)`; ctx.fillRect(EWALL+i*126, EWALL, 1, EH-EWALL*2); }
      }
    },
    objects:[
      {id:'sr1',type:'server_shelf',x:185,y:200,w:54,h:130,name:'Server Rack A — Primary',isChallenge:true},
      {id:'sr2',type:'server_shelf',x:370,y:200,w:54,h:130,name:'Server Rack B',flavor:'Secondary storage. Status lights all green — nominal.'},
      {id:'sr3',type:'server_shelf',x:555,y:200,w:54,h:130,name:'Server Rack C',flavor:'Backup server. A sticky note reads "DO NOT REBOOT".'},
      {id:'sr4',type:'server_shelf',x:740,y:200,w:54,h:130,name:'Server Rack D',flavor:'This rack hums loudly. The cooling fan is working overtime.'},
      {id:'ns',type:'computer',x:840,y:385,w:52,h:38,name:'Network Switch Panel',flavor:'A managed switch. All port lights are flashing rapidly.'},
      {id:'ups',type:'cabinet',x:100,y:420,w:58,h:48,col:'#2a3a2a',name:'UPS Battery Backup',flavor:'Provides 20 minutes of emergency power.'},
      {id:'md',type:'desk',x:500,y:425,w:110,h:50,col:'#1e2030',name:'Admin Desk',flavor:'Network diagrams are pinned above a small monitor.',passable:true},
      {id:'ac',type:'aircon',x:450,y:96,w:180,name:'Industrial Air Con',flavor:'Critical for keeping servers cool. Running at full capacity.'},
    ]
  },
  reception: {
    theme:{ floor:'#D0CCBC', wall:'#6B5A3E', trim:'#5B4A2E', tileW:64 },
    objects:[
      {id:'rd',type:'reception',x:490,y:195,w:220,h:56,name:'Reception Counter',flavor:'The main front desk. A sign says "PLEASE SIGN IN".'},
      {id:'rc',type:'computer',x:615,y:178,w:52,h:38,name:'Reception Computer',isChallenge:true},
      {id:'si',type:'signin',x:360,y:188,name:'Sign-In Book',flavor:'Today\'s log. A visitor signed in at 7:30am — before school opened.'},
      {id:'vc1',type:'desk',x:195,y:390,w:34,h:34,col:'#5a5a6a',name:'Visitor Chair',flavor:'A leaflet about the school open day is on the seat.',passable:true},
      {id:'vc2',type:'desk',x:450,y:400,w:34,h:34,col:'#5a5a6a',name:'Visitor Chair',flavor:"A visitor's lanyard has been left behind.",passable:true},
      {id:'vc3',type:'desk',x:705,y:390,w:34,h:34,col:'#5a5a6a',name:'Visitor Chair',flavor:'A school achievements brochure is on this one.',passable:true},
      {id:'mr',type:'magazine',x:840,y:310,name:'Magazine Rack',flavor:'School newsletters and prospectuses from 2018.'},
      {id:'pl1',type:'plant',x:100,y:145,name:'Tall Plant',flavor:'A large cheese plant in a terracotta pot. Very welcoming.'},
      {id:'pl2',type:'plant',x:840,y:145,name:'Plant',flavor:'Someone has drawn a smiley face in the soil.'},
      {id:'tr',type:'trophy',x:100,y:395,name:'Trophy Cabinet',flavor:'"Regional Chess Champions 2022" and "Best Attendance 2023".'},
    ]
  },
  workshop: {
    theme:{ floor:'#B8B8A8', wall:'#4a4a3a', trim:'#3a3a2a', tileW:56 },
    objects:[
      {id:'wb1',type:'workbench',x:340,y:200,w:200,h:52,name:'Main Workbench',flavor:'A heavy workbench covered in sawdust and metal shavings.'},
      {id:'wb2',type:'workbench',x:340,y:385,w:200,h:52,name:'Electronics Bench',flavor:'A soldering station and half-built circuit boards.'},
      {id:'tc',type:'cabinet',x:100,y:280,w:52,h:80,col:'#5a4a3a',name:'Tool Cabinet',flavor:'A red metal tool cabinet. All tools present — mostly.'},
      {id:'pd',type:'desk',x:720,y:240,w:90,h:56,col:'#2a2a3a',name:'3D Print Station',flavor:'The 3D print station desk. A part is mid-print.'},
      {id:'p3',type:'printer3d',x:760,y:250,name:'3D Printer',flavor:'A FDM 3D printer whirring away on a complex object.'},
      {id:'cb1',type:'cabinet',x:760,y:395,w:44,h:40,col:'#3355aa',name:'Component Bin A',flavor:'Resistors, capacitors, Arduino boards.'},
      {id:'cb2',type:'cabinet',x:820,y:395,w:44,h:40,col:'#3355aa',name:'Component Bin B',flavor:'LEDs, transistors, and a tangle of jumper wires.'},
      {id:'sp',type:'cabinet',x:840,y:205,w:32,h:70,col:'#ffffaa',name:'Safety Poster',flavor:'"ALWAYS WEAR PROTECTIVE EQUIPMENT." — the goggles are all missing.'},
      {id:'uh',type:'computer',x:450,y:183,w:46,h:34,name:'USB Charging Hub',isChallenge:true},
    ]
  },
  corridor: {
    theme:{ floor:'#C8C4B8', wall:'#7a7060', trim:'#6a6050', tileW:64 },
    objects:[
      {id:'lr',type:'locker_row',x:100,y:270,w:44,h:260,col:'#5588aa',name:'Student Lockers',flavor:'A row of student lockers. Most have personalised padlocks. One is slightly open.'},
      {id:'nb',type:'noticeboard',x:840,y:195,w:60,h:100,name:'Corridor Board',flavor:'"Year 10 Trip — Monday", "Lost: Black PE Bag", fire drill rota.'},
      {id:'wf',type:'sink',x:840,y:380,name:'Water Fountain',flavor:'The button sticks and dribbles water everywhere.'},
      {id:'lp',type:'lostprop',x:840,y:450,name:'Lost Property Box',flavor:'A cardboard box — water bottles, a single shoe, someone\'s homework.'},
      {id:'bi',type:'bin',x:840,y:285,name:'Recycling Bin',flavor:'Someone put a banana skin in the paper recycling.'},
      {id:'bn',type:'desk',x:430,y:455,w:200,h:36,col:'#6a6050',name:'Corridor Bench',flavor:'A bench for waiting outside classrooms. Well worn.',passable:true},
      {id:'us',type:'usb',x:465,y:330,w:36,h:16,name:'USB Stick (on floor)',isChallenge:true,passable:true},
    ]
  },
};

// ── RoomExplorer class ───────────────────────────────────────
class RoomExplorer {
  constructor({ canvas, roomId, role, onChallenge, onLeave }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.roomId = roomId;
    this.role = role;
    this.onChallenge = onChallenge;
    this.onLeave = onLeave;
    this.frozen = false;
    this.running = true;

    const def = ROOM_DEFS[roomId] || ROOM_DEFS.classroom_a;
    this.theme = def.theme;
    this.objects = def.objects;

    this.char = { x: EW/2, y: 410, facing:'up', moving:false, frame:0, ft:0 };
    this.keys = {};
    this.nearObj = null;
    this.msgBox = null;
    this.lastTime = performance.now();

    this._kd = e => {
      this.keys[e.code] = true;
      if (e.code === 'KeyE') this.interact();
      if (e.code === 'Escape') this.onLeave();
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','KeyE'].includes(e.code)) e.preventDefault();
    };
    this._ku = e => { this.keys[e.code] = false; };
    this._cl = e => this.handleClick(e);

    window.addEventListener('keydown', this._kd);
    window.addEventListener('keyup', this._ku);
    canvas.addEventListener('click', this._cl);

    requestAnimationFrame(t => this.loop(t));
  }

  loop(ts) {
    if (!this.running) return;
    const dt = Math.min((ts - this.lastTime)/1000, 0.05);
    this.lastTime = ts;
    if (!this.frozen) this.update(dt);
    this.render();
    requestAnimationFrame(t => this.loop(t));
  }

  update(dt) {
    const c = this.char;
    let dx=0, dy=0;
    if (this.keys['ArrowLeft']||this.keys['KeyA'])  { dx=-1; c.facing='left'; }
    if (this.keys['ArrowRight']||this.keys['KeyD']) { dx= 1; c.facing='right'; }
    if (this.keys['ArrowUp']||this.keys['KeyW'])    { dy=-1; c.facing='up'; }
    if (this.keys['ArrowDown']||this.keys['KeyS'])  { dy= 1; c.facing='down'; }
    if (dx && dy) { dx*=0.707; dy*=0.707; }

    c.moving = (dx!==0||dy!==0);
    if (c.moving) { c.ft+=dt; if(c.ft>0.14){c.frame=(c.frame+1)%4; c.ft=0;} }
    else { c.frame=0; c.ft=0; }

    let nx=c.x+dx*ESPEED*dt, ny=c.y+dy*ESPEED*dt;
    nx = Math.max(EWALL+ECOL, Math.min(EW-EWALL-ECOL, nx));
    ny = Math.max(EWALL+ECOL, Math.min(EH-EWALL-ECOL, ny));

    let bx=false, by=false;
    for (const obj of this.objects) {
      if (obj.passable) continue;
      const ow=(obj.w||60)/2, oh=(obj.h||60)/2;
      if (nx+ECOL>obj.x-ow && nx-ECOL<obj.x+ow && c.y+ECOL>obj.y-oh && c.y-ECOL<obj.y+oh) bx=true;
      if (c.x+ECOL>obj.x-ow && c.x-ECOL<obj.x+ow && ny+ECOL>obj.y-oh && ny-ECOL<obj.y+oh) by=true;
    }
    if (!bx) c.x = nx;
    if (!by) c.y = ny;

    let best=null, bd=EINTERACT;
    for (const obj of this.objects) {
      const d=Math.hypot(obj.x-c.x, obj.y-c.y);
      if (d<bd) { best=obj; bd=d; }
    }
    this.nearObj = best;

    if (this.msgBox) { this.msgBox.ttl -= dt; if (this.msgBox.ttl<=0) this.msgBox=null; }
  }

  interact() {
    if (this.frozen || !this.nearObj) return;
    const obj = this.nearObj;
    if (obj.isChallenge) {
      this.frozen = true;
      this.onChallenge();
    } else if (obj.flavor) {
      const lines = eWrap(obj.flavor, 230, this.ctx);
      this.msgBox = { lines, ox:obj.x, oy:obj.y-(obj.h||60)/2-10, ttl:4 };
    }
  }

  handleClick(e) {
    if (this.frozen) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX-rect.left)/rect.width * EW;
    const my = (e.clientY-rect.top)/rect.height * EH;
    for (const obj of this.objects) {
      const ow=(obj.w||60)/2+12, oh=(obj.h||60)/2+12;
      if (mx>obj.x-ow && mx<obj.x+ow && my>obj.y-oh && my<obj.y+oh) {
        this.nearObj = obj;
        this.interact();
        return;
      }
    }
  }

  render() {
    const ctx=this.ctx, c=this.char;
    ctx.clearRect(0,0,EW,EH);
    drawFloor(ctx, this.theme);

    // Painter's algorithm — sort by y
    const sorted = [...this.objects].sort((a,b) => a.y - b.y);

    for (const obj of sorted) {
      const near = (obj === this.nearObj);
      if (near) {
        const pulse = 0.22 + Math.sin(Date.now()/280)*0.16;
        ctx.save(); ctx.globalAlpha=pulse;
        ctx.shadowBlur=24; ctx.shadowColor = obj.isChallenge ? '#ff4466' : '#00ffff';
        drawObject(ctx, obj);
        ctx.restore();
      }
      drawObject(ctx, obj);
    }

    // Character rendered in y-sorted order with objects
    // Simple approach: always draw on top
    drawChar(ctx, c.x, c.y, c.facing, c.frame, c.moving, this.role);

    // Interaction prompt (bottom centre)
    if (this.nearObj && !this.frozen) {
      const label = `[ E ]  ${this.nearObj.name}`;
      ctx.font = '13px "Share Tech Mono",monospace';
      const tw = ctx.measureText(label).width;
      const bx=EW/2-tw/2-14, by=EH-54, bw=tw+28, bh=30;
      ctx.fillStyle = 'rgba(8,10,20,0.85)';
      ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,6); ctx.fill();
      ctx.strokeStyle = this.nearObj.isChallenge ? 'rgba(255,68,102,0.6)' : 'rgba(0,212,255,0.5)';
      ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,6); ctx.stroke();
      ctx.fillStyle = this.nearObj.isChallenge ? '#ff4466' : '#00ffff';
      ctx.textAlign='center'; ctx.fillText(label, EW/2, by+21);
    }

    // Speech bubble
    if (this.msgBox) {
      const m=this.msgBox, lh=17, pad=12;
      const bw=Math.min(260,EW-40), bh=m.lines.length*lh+pad*2;
      let bx=m.ox-bw/2, by=m.oy-bh-8;
      bx = Math.max(8, Math.min(EW-bw-8, bx));
      by = Math.max(76, by);
      const alpha = m.ttl<0.5 ? m.ttl/0.5 : 1;
      ctx.save(); ctx.globalAlpha=alpha;
      ctx.fillStyle='rgba(6,10,22,0.93)';
      ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,8); ctx.fill();
      ctx.strokeStyle='rgba(200,220,255,0.2)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,8); ctx.stroke();
      ctx.fillStyle='#d0e8ff'; ctx.font='12px "Share Tech Mono",monospace'; ctx.textAlign='left';
      m.lines.forEach((l,i) => ctx.fillText(l, bx+pad, by+pad+13+i*lh));
      // pointer triangle
      const px=Math.min(bx+bw-10, Math.max(bx+10, m.ox));
      ctx.fillStyle='rgba(6,10,22,0.93)';
      ctx.beginPath(); ctx.moveTo(px-7,by+bh); ctx.lineTo(px+7,by+bh); ctx.lineTo(px,by+bh+10); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // Controls hint
    ctx.save(); ctx.globalAlpha=0.3; ctx.fillStyle='#fff';
    ctx.font='11px "Share Tech Mono",monospace'; ctx.textAlign='left';
    ctx.fillText('Arrow keys / WASD — move  ·  [E] or click — interact  ·  [ESC] — leave room', EWALL+6, EH-8);
    ctx.restore();
  }

  destroy() {
    this.running = false;
    window.removeEventListener('keydown', this._kd);
    window.removeEventListener('keyup', this._ku);
    this.canvas.removeEventListener('click', this._cl);
  }
}

window.RoomExplorer = RoomExplorer;
