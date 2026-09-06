#!/usr/bin/env node
// gameforge.ts — the gameforge: a brief becomes a baked, deterministic game.
//
// The whole simulation stack pipes into one playable artifact:
//   brief → seed
//    · ising (pixel/tilemap)  → the level, relaxed to criticality
//    · doombible              → the bestiary + engine notes
//    · tern composeImage      → the palette (hue from the wire)
//    · spherepop              → confederate NPC count, T shared
//    → one self-contained HTML, byte-deterministic per brief.
//
//   node quantGame/gameforge.ts "the keeper of the 108 gates" --out out/games

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { seedFromText, composeImage, balancedTrits } from '../quantTernEngine/tern.ts'
import { tilemap } from '../pixel/tilemap.ts'
import { doombible } from '../retro/doombible.ts'
import { spherepopInit } from './spherepop.ts'

// talentTreeOf — the PoE/Diablo-style passive tree, baked from the seed:
// a 6x4 grid of nodes, edges to down/right neighbours chosen by the wire,
// stats assigned by trit chunks. Order === counting, recursively.
const STATS = [
  { stat: 'dash', amt: 1, max: 3 },
  { stat: 'jump', amt: 0.25, max: 2 },
  { stat: 'air', amt: 0.06, max: 0.3 },
  { stat: 'run', amt: 14, max: 120 },
  { stat: 'magnet', amt: 12, max: 120 },
  { stat: 'lotus', amt: 3, max: 20 },
  { stat: 'reach', amt: 60, max: 999 },
]
function talentTreeOf(seed: bigint): { nodes: { i: number; gx: number; gy: number; stat: string; amt: number; max: number }[]; edges: [number, number][] } {
  const trits = balancedTrits(seed, 72)
  const nodes = []
  let k = 0
  for (let gy = 0; gy < 4; gy++) {
    for (let gx = 0; gx < 6; gx++) {
      const s = STATS[(Math.abs(trits[k % 72]) + k) % STATS.length]
      nodes.push({ i: k, gx, gy, stat: s.stat, amt: s.amt, max: s.max })
      k++
    }
  }
  const edges: [number, number][] = []
  for (const n of nodes) {
    const right = nodes.find((m) => m.gx === n.gx + 1 && m.gy === n.gy)
    const down = nodes.find((m) => m.gx === n.gx && m.gy === n.gy + 1)
    if (right && trits[(n.i * 3) % 72] >= 0) edges.push([n.i, right.i])
    if (down && trits[(n.i * 3 + 1) % 72] <= 0) edges.push([n.i, down.i])
  }
  return { nodes, edges }
}

// powerupsOf — the seeded shrines
function powerupsOf(seed: bigint): { type: string; x: number; y: number }[] {
  const types = ['lotus', 'dash', 'shield', 'tempest']
  const out = []
  for (let i = 0; i < 8; i++) {
    out.push({ type: types[(Number((seed + BigInt(i * 7)) % 4n))], x: 8 + i * 11, y: LH_Y(i) })
  }
  return out
}
function LH_Y(i: number): number { return 3 + (i % 3) }

const GAME_TEMPLATE = String.raw`<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SUPER PADME BROS — the gameforge build</title><style>
body{margin:0;background:#0d0512;color:#e8d8f0;font-family:ui-monospace,monospace;display:flex;flex-direction:column;align-items:center;padding:18px 12px}
h1{background:linear-gradient(135deg,#ff6ec7,#b48bff,#ffd36e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:clamp(1.3rem,3.5vw,2rem);letter-spacing:3px;margin:0 0 4px;text-align:center}
.sub{color:#b48bc0;font-size:.7rem;letter-spacing:2px;margin-bottom:10px;text-align:center;text-transform:uppercase}
canvas{width:min(960px,96vw);border:1px solid rgba(255,110,199,.35);border-radius:10px;background:#160a1e;display:block;cursor:pointer}
.hud{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:.7rem;color:#b48bc0;width:min(960px,96vw);margin:8px 2px;letter-spacing:1px}
.hud b{color:#ffd36e}
.seedline{color:#ff9ad5;font-size:.66rem;width:min(960px,96vw);word-break:break-all;margin-top:6px}
.keys{color:#7a5a8a;font-size:.66rem;margin-top:6px;text-align:center}
</style></head><body>
<h1>SUPER PADME BROS.</h1>
<div class="sub">the gameforge build · celeste physics · powerups · the talent tree</div>
<canvas id="c" width="960" height="540"></canvas>
<div class="hud"><span>lives <b id="lv">3</b> · malas <b id="m">0</b>/27 · karma <b id="k">0</b> · talent <b id="tp">0</b> · dash <b id="d">1</b> · mode <b id="mod">0/1</b></span><span>T <b id="tt">0.000</b> · confederates <b id="conf">21</b> · <span id="tip">T = tree · R restart · N new run</span></span></div>
<div class="seedline" id="sl">⟦ … ⟧</div>
<div class="keys">WASD / arrows move · SPACE jump (hold = higher · release = cut) · X / K dash (8-dir) · ESC / ENTER menu · T talent tree</div>
<script>
const M = __MANIFEST__;
const C = document.getElementById('c'), X = C.getContext('2d');
const W = C.width, H = C.height, TILE = 46, TAU = 6.2832;
// ── the level — the ising field unrolled
const LW = 96, LH = 11, MN = M.level;
const heights = new Array(LW);
for (let c = 0; c < LW; c++) { const v = MN.tiles[c % MN.width]; heights[c] = v === 1 ? LH - 4 - (c % 3) : LH - 3; if (v === 2 && c % 6 === 0 && c > 4 && c < LW - 8) heights[c] = -1; }
// ── the talent tree — PoE/Diablo style, baked from the seed
const TREE = M.tree;
const stats = { dash: 1, jump: 1, air: 0, run: 0, magnet: 34, lotus: 8, reach: 40 };
const alloc = new Array(TREE.nodes.length).fill(0);
alloc[0] = 1;
let tp = 0;
function applyNode(i) { const n = TREE.nodes[i]; stats[n.stat] = Math.min(n.max, stats[n.stat] + n.amt); }
// ── powerups — the seeded shrines
const PU = M.powerups;
const puGot = new Array(PU.length).fill(0);
// ── bestiary + malas + gate
const BEST = M.bestiary; const BE = [];
for (let i = 0; i < 6; i++) BE.push({ x: 14 + i * 15, dir: 1, t: i % 3 });
const malas = []; for (let i = 0; i < 27; i++) malas.push({ x: 4 + i * 4, y: LH - 3 - (i % 3), got: 0 });
const GX = LW - 2;
// ── the player — celeste discipline
let spawnC = 0; for (let c = 0; c < LW; c++) { if (heights[c] > 0) { spawnC = c; break; } }
let px = spawnC * TILE + 40, py = (LH - heights[spawnC]) * TILE - 46, vx = 0, vy = 0, onGround = false, coyote = 0, jbuf = 0, jheld = false;
let dashes = stats.dash, dashT = 0, dashX = 0, dashY = 0, cdash = 0, wallDir = 0;
let dead = false, won = false, collected = 0, karma = 0, modeT = 0, treeOpen = false;
let t = 0, last = performance.now(), menuOpen = false;
// ── lives · checkpoints · save ──
let lives = 3, gameOver = false, lampLit = [0, 0, 0], CP = [22, 44, 66];
let toast = '', toastT = 0, saveKey = 'spb:' + M.seed;
const bus = { h: {}, on(e, f) { (this.h[e] = this.h[e] || []).push(f); }, emit(e, d) { (this.h[e] || []).forEach((f) => f(d || {})); } };
function msg(text) { toast = text; toastT = 1.8; bus.emit('message', { text }); }
function saveGame() { try { localStorage.setItem(saveKey, JSON.stringify({ seed: M.seed, collected, karma, tp, alloc, lives, lampLit, stats })); msg('⟦ autosaved — the stream remembers ⟧'); } catch (e) {} }
function loadGame() { try { const raw = localStorage.getItem(saveKey); if (!raw) return false; const d = JSON.parse(raw); if (d.seed !== M.seed) return false; collected = d.collected || 0; karma = d.karma || 0; tp = d.tp || 0; lives = d.lives ?? 3; lampLit = d.lampLit || [0, 0, 0]; for (let i = 0; i < alloc.length; i++) alloc[i] = (d.alloc && d.alloc[i]) ? 1 : 0; if (d.stats) Object.assign(stats, d.stats); return true; } catch (e) { return false; } }
function newRun() { try { localStorage.removeItem(saveKey); } catch (e) {} collected = 0; karma = 0; tp = 0; lives = 3; lampLit = [0, 0, 0]; alloc.fill(0); alloc[0] = 1; Object.assign(stats, { dash: 1, jump: 1, air: 0, run: 0, magnet: 34, lotus: 8, reach: 40 }); gameOver = false; dead = false; respawn(); msg('a new run — the stream begins'); }
function respawn() { let c = 0; for (let i = 0; i < CP.length; i++) if (lampLit[i]) c = CP[i]; if (heights[c] <= 0) { for (let k = c; k < LW; k++) if (heights[k] > 0) { c = k; break; } } px = c * TILE + 40; py = (LH - heights[c]) * TILE - 46; vx = 0; vy = 0; dashes = stats.dash; cdash = 0; dashT = 0; }
function die() { dead = true; lives--; bus.emit('death', { lives }); if (lives <= 0) { gameOver = true; msg('GAME OVER — the stream continues · R restart · N new run'); } else { msg('the stream continues — ' + lives + ' lives left'); respawn(); } }
const KEYS = {};
document.addEventListener('keydown', e => {
  KEYS[e.key] = 1;
  if (e.key === 'Escape' || e.key === 'Enter') { if (treeOpen) treeOpen = false; else menuOpen = !menuOpen; }
  if ((e.key === 'r' || e.key === 'R') && gameOver) { lives = 3; gameOver = false; dead = false; collected = 0; karma = 0; tp = 0; lampLit = [0, 0, 0]; respawn(); msg('restart — the stream continues'); }
  if ((e.key === 'n' || e.key === 'N') && gameOver) { newRun(); }
  if (e.key === 't' || e.key === 'T') { if (menuOpen) { menuOpen = false; treeOpen = true; } else treeOpen = !treeOpen; }
  if ((e.key === 'x' || e.key === 'k' || e.key === 'X' || e.key === 'K') && !treeOpen && !menuOpen && cdash <= 0 && dashes > 0 && dashT <= 0) startDash();
  if ('wasd arrowup arrowdown arrowleft arrowright xk '.includes(e.key.toLowerCase() + ' ')) e.preventDefault();
});
document.addEventListener('keyup', e => {
  if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') { if (vy < 0) vy *= 0.45; jheld = false; }
  KEYS[e.key] = 0;
});
function tileAt(a, b) { const c = Math.floor(a / TILE), r = Math.floor(b / TILE); if (c < 0 || c >= LW || r < 0 || r >= LH) return -1; const h = heights[c]; if (h < 0) return -2; return r >= LH - h ? 1 : 0; }
function groundedAt(a, b) { return tileAt(a, b + 44) === 1 && tileAt(a + 34, b + 44) === 1; }
function startDash() {
  let dx = (KEYS['d'] || KEYS['ArrowRight'] ? 1 : 0) - (KEYS['a'] || KEYS['ArrowLeft'] ? 1 : 0);
  let dy = (KEYS['s'] || KEYS['ArrowDown'] ? 1 : 0) - (KEYS['w'] || KEYS['ArrowUp'] || KEYS[' '] ? 1 : 0);
  if (dx === 0 && dy === 0) dx = vx >= 0 ? 1 : -1;
  const l = Math.hypot(dx, dy) || 1;
  dashX = dx / l; dashY = dy / l; dashT = 0.14; cdash = 0.28; dashes--;
}
function update(dt) {
  if (dead || won || treeOpen || menuOpen || gameOver) return;
  if (modeT > 0) modeT -= dt;
  if (dashT > 0) {
    dashT -= dt;
    px += dashX * 500 * dt; py += dashY * 500 * dt;
    vx = dashX * 500; vy = dashY * 500;
    if (tileAt(px + 6, py + 44) === 1 || tileAt(px + 34, py + 44) === 1) { py = Math.floor((py + 44) / TILE) * TILE - 44; dashT = 0; }
    if (tileAt(px, py + 6) === 1 || tileAt(px + 38, py + 6) === 1) { py = Math.floor(py / TILE) * TILE + TILE; }
  } else {
    const acc = 2300, maxSpd = 250 + stats.run;
    const want = ((KEYS['d'] || KEYS['ArrowRight'] ? 1 : 0) - (KEYS['a'] || KEYS['ArrowLeft'] ? 1 : 0)) * maxSpd;
    vx = Math.abs(want - vx) < acc * dt ? want : vx + Math.sign(want - vx) * acc * dt;
    if (wallDir && !onGround) { vy = Math.min(vy, 70); if ((KEYS['w'] || KEYS[' ']) && jbuf > 0) { vy = -820 * stats.jump; vx = -wallDir * 340; dashes = stats.dash; coyote = 0.1; jbuf = 0; } }
    else if (jbuf > 0) { if (onGround || coyote > 0 || stats.air > 0) { vy = -760 * stats.jump; onGround = false; coyote = 0; jbuf = 0; } }
    vy = Math.min(vy + 2100 * dt, 940);
    px += (vx + (stats.air > 0 ? (KEYS['d'] === KEYS['a'] ? 0 : 0) : 0)) * dt;
    py += vy * dt;
    if ((KEYS['w'] || KEYS[' ']) && onGround && jbuf <= 0) jbuf = 0.12;
    jbuf -= dt;
    if (onGround) { coyote = 0.1; dashes = stats.dash; } else coyote -= dt;
    if (cdash > 0) cdash -= dt;
  }
  if (py > LH * TILE) { die(); return; }
  if (tileAt(px + 6, py + 44) === 1 || tileAt(px + 34, py + 44) === 1) { if (vy > 0) { py = Math.floor((py + 44) / TILE) * TILE - 44; vy = 0; onGround = true; } }
  if (tileAt(px, py + 6) === 1 || tileAt(px + 38, py + 6) === 1) { py = Math.floor(py / TILE) * TILE + TILE; onGround = false; }
  onGround = groundedAt(px, py);
  wallDir = 0;
  if (tileAt(px, py + 20) === 1) { px = Math.floor(px / TILE) * TILE + TILE; wallDir = -1; }
  if (tileAt(px + 38, py + 20) === 1) { px = Math.floor((px + 38) / TILE) * TILE - TILE - 1; wallDir = 1; }
  // checkpoints — the butter lamps
  for (let i = 0; i < CP.length; i++) { const lx = CP[i] * TILE + 24; const gy = (LH - heights[CP[i]]) * TILE; if (!lampLit[i] && px > lx - 30 && px < lx + 40 && py > gy - 80 && py < gy + 10) { lampLit[i] = 1; msg('butter lamp lit — the watch does not end'); bus.emit('checkpoint', { i }); } }
  // malas + magnet (tree)
  for (const m of malas) { const mx = m.x * TILE + TILE / 2, my = (LH - m.y) * TILE - TILE / 2; if (!m.got && Math.hypot(px + 19 - mx, py + 22 - my) < stats.magnet) { m.got = 1; collected++; if (collected % 3 === 0) tp++; bus.emit('mala', { n: collected }); if (collected % 5 === 0) saveGame(); } }
  // powerups
  for (let i = 0; i < PU.length; i++) { if (puGot[i]) continue; const p = PU[i], px2 = p.x * TILE + TILE / 2, py2 = (LH - p.y) * TILE; if (Math.hypot(px + 19 - px2, py + 22 - py2) < 42) { puGot[i] = 1; grantPower(p.type); } }
  // bestiary — stomp to liberate
  for (const b of BE) {
    const hcol = heights[Math.max(0, Math.min(LW - 1, Math.floor(b.x)))];
    const by = (LH - (hcol < 0 ? 1 : hcol)) * TILE;
    if (b.dir !== 0) { b.x += b.dir * 55 * dt; if (b.x < 10 || b.x > LW - 6) b.dir *= -1; }
    const ex = b.x * TILE + 8;
    if (px + 38 > ex && px < ex + 32 && py + 44 > by - 32 && py < by) {
      if (vy > 260 && py + 40 < by - 8) { b.dir = 0; karma++; tp++; vy = -430; bus.emit('liberation', { name: b.name }); msg('liberated ' + (BEST[b.t % BEST.length] || 'a poison')); }
      else if (b.dir !== 0) { die(); }
    }
  }
  if (px > GX * TILE) { won = true; msg('THE TENT — the gate opens · 27 malas'); bus.emit('win', { collected }); saveGame(); }
  document.getElementById('lv').textContent = lives;
  document.getElementById('m').textContent = collected;
  document.getElementById('k').textContent = karma;
  document.getElementById('tp').textContent = tp;
  document.getElementById('d').textContent = dashes;
  document.getElementById('mod').textContent = modeT > 0 ? 'lotus 🌸' : '0/1';
  document.getElementById('tt').textContent = (t / 45).toFixed(3);
}
function grantPower(type) {
  if (type === 'lotus') { modeT = stats.lotus; }
  else if (type === 'dash') { stats.dash = Math.min(3, stats.dash + 1); dashes = stats.dash; }
  else if (type === 'shield') { stats.reach = 999; }
  else if (type === 'tempest') { stats.run = 140; }
}
function render() {
  X.fillStyle = '#160a1e'; X.fillRect(0, 0, W, H);
  const cam = Math.max(0, Math.min(px - 200, (LW - 20) * TILE));
  X.save(); X.translate(-cam, 0);
  for (let c = 0; c < LW; c++) { const h = heights[c]; if (h < 0) continue; for (let r = 0; r < h; r++) { const y = (LH - 1 - r) * TILE; X.fillStyle = r === 0 ? 'rgba(180,139,255,.3)' : 'rgba(58,33,80,.7)'; X.fillRect(c * TILE + 1, y + 1, TILE - 2, TILE - 2); } }
  for (const m of malas) { if (m.got) continue; const mx = m.x * TILE + TILE / 2, my = (LH - m.y) * TILE; X.fillStyle = '#ffd36e'; X.beginPath(); X.arc(mx, my, 6, 0, TAU); X.fill(); X.fillStyle = '#ff9ad5'; X.beginPath(); X.arc(mx, my - 3, 2.4, 0, TAU); X.fill(); }
  for (let i = 0; i < PU.length; i++) { if (puGot[i]) continue; const p = PU[i], px2 = p.x * TILE + TILE / 2, py2 = (LH - p.y) * TILE; X.fillStyle = p.type === 'lotus' ? '#ff6ec7' : p.type === 'dash' ? '#62e6c9' : p.type === 'shield' ? '#ffd36e' : '#ff9ad5'; X.beginPath(); X.arc(px2, py2, 9 + 2 * Math.sin(t * 4 + i), 0, TAU); X.fill(); X.fillStyle = '#0d0512'; X.font = '9px ui-monospace'; X.fillText(p.type[0].toUpperCase(), px2 - 3, py2 + 3); }
  for (const b of BE) { const hcol = heights[Math.max(0, Math.min(LW - 1, Math.floor(b.x)))]; const by = (LH - (hcol < 0 ? 1 : hcol)) * TILE; if (b.dir === 0) continue; X.fillStyle = ['#ff6ec7', '#5b9dff', '#2b2b45'][b.t]; X.beginPath(); X.arc(b.x * TILE + 24, by - 14, 11, 0, TAU); X.fill(); X.fillStyle = '#0d0512'; X.font = '9px ui-monospace'; X.fillText(BEST[b.t % BEST.length].slice(0, 7), b.x * TILE + 4, by - 22); }
  const gx = GX * TILE; X.fillStyle = '#ff6ec7'; X.fillRect(gx, (LH - 3) * TILE, 14, TILE * 3); X.fillStyle = '#ff9ad5'; X.beginPath(); X.moveTo(gx - 20, (LH - 3) * TILE); X.lineTo(gx + 34, (LH - 3) * TILE); X.lineTo(gx + 7, (LH - 5) * TILE); X.closePath(); X.fill();
  X.fillStyle = modeT > 0 ? '#ff9ad5' : '#e8d8f0'; X.beginPath(); X.arc(px + 19, py - 4, 10, 0, TAU); X.fill(); X.fillStyle = modeT > 0 ? '#ffd36e' : '#b48bff'; X.fillRect(px + 8, py + 8, 22, 26);
  for (let i = 0; i < 21; i++) { const wx = ((i * 97 + Math.floor(t * 8)) % (LW * TILE)); const wy = (LH - 2) * TILE - (i % 3) * TILE; X.fillStyle = 'rgba(98,230,201,.6)'; X.beginPath(); X.arc(wx, wy, 2.4, 0, TAU); X.fill(); if (Math.abs(wx - px) < 60) { X.fillStyle = 'rgba(5,2,8,.8)'; X.fillRect(wx - 34, wy - 30, 68, 16); X.fillStyle = '#62e6c9'; X.font = '8px ui-monospace'; X.fillText('mem8·' + i + ' ∿', wx - 30, wy - 18); } }
  // the butter lamps
  for (let i = 0; i < CP.length; i++) { const lx = CP[i] * TILE + 24, ly = (LH - heights[CP[i]]) * TILE - 26; X.fillStyle = lampLit[i] ? '#ffd36e' : '#5a4a6a'; X.beginPath(); X.arc(lx, ly, 8, 0, TAU); X.fill(); if (lampLit[i]) { X.fillStyle = 'rgba(255,211,110,.35)'; X.beginPath(); X.arc(lx, ly, 16 + 4 * Math.sin(t * 3 + i), 0, TAU); X.fill(); } }
  X.restore();
  // the toast — game messages ride the bus
  if (toastT > 0) { toastT -= 1 / 60; X.fillStyle = 'rgba(5,2,8,.85)'; X.strokeStyle = 'rgba(255,211,110,.5)'; X.fillRect(W / 2 - 170, H - 74, 340, 26); X.strokeRect(W / 2 - 170, H - 74, 340, 26); X.fillStyle = '#ffd36e'; X.font = '10px ui-monospace'; X.textAlign = 'center'; X.fillText(toast.slice(0, 52), W / 2, H - 56); X.textAlign = 'left'; }
  // the menu overlay — ESC/ENTER
  if (menuOpen) {
    X.fillStyle = 'rgba(4,2,10,.94)'; X.fillRect(0, 0, W, H);
    X.strokeStyle = 'rgba(255,211,110,.5)'; X.lineWidth = 1; X.strokeRect(W / 2 - 200, H / 2 - 120, 400, 240);
    X.fillStyle = '#ffd36e'; X.font = '18px ui-monospace'; X.textAlign = 'center';
    X.fillText('SUPER PADME BROS — the menu', W / 2, H / 2 - 84); X.textAlign = 'left';
    X.fillStyle = '#e8d8f0'; X.font = '11px ui-monospace';
    const lines = [
      'WASD / arrows — move',
      'SPACE / W / ↑ — jump (hold = higher, release = cut)',
      'X / K — dash, 8 directions',
      'T — the talent tree',
      'ESC / ENTER — close this menu',
      'stomp a poison to liberate it · 27 malas open the gate',
    ];
    lines.forEach((l, i) => X.fillText(l, W / 2 - 180, H / 2 - 60 + i * 22));
    X.fillStyle = '#62e6c9'; X.font = '10px ui-monospace';
    X.fillText('the stream continues — return', W / 2 - 180, H / 2 + 84);
  }
  // the talent tree overlay
  if (treeOpen) { X.fillStyle = 'rgba(4,2,10,.92)'; X.fillRect(0, 0, W, H); X.strokeStyle = 'rgba(180,139,255,.6)'; X.lineWidth = 1; for (const e of TREE.edges) { const a = TREE.nodes[e[0]], b = TREE.nodes[e[1]]; const ax = 120 + a.gx * 104, ay = 80 + a.gy * 84, bx2 = 120 + b.gx * 104, by2 = 80 + b.gy * 84; X.strokeStyle = alloc[a.i] && alloc[b.i] ? 'rgba(255,211,110,.9)' : alloc[a.i] ? 'rgba(255,211,110,.4)' : 'rgba(90,70,120,.5)'; X.beginPath(); X.moveTo(ax, ay); X.lineTo(bx2, by2); X.stroke(); }
    for (const n of TREE.nodes) { const ax = 120 + n.gx * 104, ay = 80 + n.gy * 84; X.fillStyle = alloc[n.i] ? '#ffd36e' : tp > 0 && cannotalloc(n) ? '#5b9dff' : '#3a2150'; X.beginPath(); X.arc(ax, ay, alloc[n.i] ? 12 : 9, 0, TAU); X.fill(); X.strokeStyle = '#ff9ad5'; X.lineWidth = 1; X.stroke(); X.fillStyle = '#e8d8f0'; X.font = '8px ui-monospace'; X.fillText(n.stat[0].toUpperCase(), ax - 3, ay + 3); X.fillStyle = '#8a6aa0'; X.font = '8px ui-monospace'; X.fillText('+' + n.amt + ' ' + n.stat, ax - 16, ay + 26); }
    X.fillStyle = '#ffd36e'; X.font = '12px ui-monospace'; X.fillText('the talent tree — ' + tp + ' points · click to allocate', 60, 40);
  }
}
function cannotalloc(n) { for (const e of TREE.edges) { if (e[1] === n.i && !alloc[e[0]]) return true; if (e[0] === n.i && !alloc[e[1]] && TREE.nodes[e[1]].i === 0) return true; } return false; }
C.addEventListener('click', (ev) => {
  if (!treeOpen || tp <= 0) return;
  const r = C.getBoundingClientRect(), mx = (ev.clientX - r.left) / r.width * W, my = (ev.clientY - r.top) / r.height * H;
  for (const n of TREE.nodes) { const ax = 120 + n.gx * 104, ay = 80 + n.gy * 84; if (Math.hypot(mx - ax, my - ay) < 24 && !alloc[n.i] && !cannotalloc(n)) { alloc[n.i] = 1; applyNode(n.i); tp--; break; } }
});
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
  if (won) { X.fillStyle = 'rgba(5,2,8,.9)'; X.fillRect(0, 0, W, H); X.fillStyle = '#ffd36e'; X.font = '22px ui-monospace'; X.textAlign = 'center'; X.fillText(collected >= 27 ? 'THE TENT — the gate opens · ' + M.brief : 'the gate waits — 27 malas', W / 2, H / 2); X.textAlign = 'left'; }
  else if (!dead) update(dt);
  else if (gameOver) { X.fillStyle = 'rgba(5,2,8,.94)'; X.fillRect(0, 0, W, H); X.fillStyle = '#ff6b63'; X.font = '26px ui-monospace'; X.textAlign = 'center'; X.fillText('GAME OVER', W / 2, H / 2 - 40); X.fillStyle = '#ff9ad5'; X.font = '13px ui-monospace'; X.fillText('the stream continues — R restart · N new run', W / 2, H / 2 + 4); X.textAlign = 'left'; }
  else { X.fillStyle = 'rgba(5,2,8,.9)'; X.fillRect(0, 0, W, H); X.fillStyle = '#ff9ad5'; X.font = '18px ui-monospace'; X.textAlign = 'center'; X.fillText('the stream continues — return', W / 2, H / 2); X.textAlign = 'left'; }
  render();
  requestAnimationFrame(loop);
}
document.getElementById('sl').textContent = '⟦ seed 0x' + M.seed + ' · ' + M.brief + ' · ' + M.digest + ' ⟧';
document.getElementById('conf').textContent = M.confederates;
if (loadGame()) { msg('⟦ autosaved run loaded — N for a new run ⟧'); } else { saveGame(); }
requestAnimationFrame(loop);
</script></body></html>`;

function bake(brief: string): string {
  const seed = seedFromText(brief)
  const map = tilemap(seed, 12, 220)          // the ising level (12x12 field)
  const bible = doombible(seed, brief)        // the bestiary + engine notes
  const pal = composeImage(seed)              // the palette
  const sp = spherepopInit(seed ^ 0x51f7n, 4, 12, 5)
  const digest = createHash('sha256').update(brief).digest('hex').slice(0, 16)
  const manifest = {
    seed: seed.toString(16).slice(0, 16),
    brief,
    digest,
    level: {
      width: map.width,
      height: map.height,
      tiles: Array.from(map.tiles),
      glyphs: map.glyphs,
    },
    bestiary: bible.filter((b) => b.kind === 'bestiary').map((b) => b.title),
    notes: bible.filter((b) => b.kind === 'engine_note').slice(0, 3).map((b) => b.text),
    palette: { hue: pal.hue, sat: pal.sat, ink: pal.ink, pink: pal.pink },
    confederates: sp.nodes.length + sp.witnesses.length,
    tree: talentTreeOf(seed),
    powerups: powerupsOf(seed),
    ts: 42,
  }
  return GAME_TEMPLATE.replace('__MANIFEST__', JSON.stringify(manifest))
}

function main(): void {
  const args = process.argv.slice(2)
  let brief = args[0]
  let outDir = ''
  for (let i = 0; i < args.length; i++) { if (args[i] === '--out') outDir = args[i + 1] }
  const text = brief || 'the keeper of the 108 gates'
  const html = bake(text)
  outDir = outDir || join(dirname(fileURLToPath(import.meta.url)), '..', 'out', 'games')
  mkdirSync(outDir, { recursive: true })
  const file = join(outDir, 'super-padme-bros-' + seedFromText(text).toString(16).slice(0, 12) + '.html')
  writeFileSync(file, html)
  console.log(`⟦ gameforge · ${text} ⟧`)
  console.log(`baked: ${file} (${html.length} bytes)`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main()
}
