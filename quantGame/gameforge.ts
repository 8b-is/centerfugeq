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
canvas{width:min(960px,96vw);border:1px solid rgba(255,110,199,.35);border-radius:10px;background:#160a1e;display:block}
.hud{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:.7rem;color:#b48bc0;width:min(960px,96vw);margin:8px 2px;letter-spacing:1px}
.hud b{color:#ffd36e}
.seedline{color:#ff9ad5;font-size:.66rem;width:min(960px,96vw);word-break:break-all;margin-top:6px}
.keys{color:#7a5a8a;font-size:.66rem;margin-top:6px;text-align:center}
</style></head><body>
<h1>SUPER PADME BROS.</h1>
<div class="sub">the gameforge build · the simulation stack baked into a game</div>
<canvas id="c" width="960" height="540"></canvas>
<div class="hud"><span>malas <b id="m">0</b>/27 · mode <b id="mod">0/1</b></span><span>confederates <b id="conf">21</b> · T <b id="tt">0.000</b><br></span><span id="err"></span></div>
<div class="seedline" id="sl">⟦ … ⟧</div>
<div class="keys">← → / AD run · ↑ / W / SPACE jump (×2 with the lotus) · stomp a poison to LIBERATE it</div>
<script>
// SUPER PADME BROS — engine-baked: the brief became the level, the
// bestiary, the palette, the confederates. Everything replays.
const M = __MANIFEST__;
const C = document.getElementById('c'), X = C.getContext('2d');
const W = C.width, H = C.height, TILE = 46;
const TAU = 6.2832;
// the level — the ising field, unrolled into a 96-column world
const LW = 96, LH = 11, MN = M.level;
const tiles = new Array(LW);
for (let c = 0; c < LW; c++) {
  const src = MN.tiles[(c % MN.width) * MN.height + (c >> 2) % MN.height];
  tiles[c] = src === 2 ? -1 : src === 0 ? 2 : src === 1 ? 3 : 3;
}
// heights: ground rises where the ising field said +1, pits where -1
const heights = new Array(LW);
for (let c = 0; c < LW; c++) {
  const v = MN.tiles[c % MN.width];
  heights[c] = v === 0 ? LH - 3 : v === 1 ? LH - 4 - (c % 3) : -1;
  if (heights[c] < 0) heights[c] = -1; // wall columns become pits rarely
}
// bestiary — the doombible roster with love/harm from the wire
const BEST = MN.bestiary;
const BE = [];
for (let i = 0; i < 6; i++) {
  BE.push({ x: 14 + i * 15, name: BEST[i % BEST.length], dir: 1, y: 0, t: i % 3 });
}
// palette from the seed — hue, pink flag
const HUE = M.palette.hue, PINK = M.palette.pink;
// malas — 27 on the ledges
const malas = [];
for (let i = 0; i < 27; i++) malas.push({ x: 4 + i * 4, y: LH - 3 - (i % 3), got: 0 });
// the gate — the pink tent at the end
const GX = LW - 2;
let px = 120, py = 320, vx = 0, vy = 0, onGround = false, dead = false, won = false;
let collected = 0, mode = 0, modeT = 0, conf = 21, t = 0, last = performance.now();
const KEYS = {};
document.addEventListener('keydown', e => { KEYS[e.key] = 1; if ('wasd arrowup arrowdown arrowleft arrowright '.includes(e.key.toLowerCase() + ' ')) e.preventDefault(); });
document.addEventListener('keyup', e => { KEYS[e.key] = 0; });
function tileAt(a, b) { const c = Math.floor(a / TILE), r = Math.floor(b / TILE); if (c < 0 || c >= LW || r < 0 || r >= LH) return -1; const h = heights[c]; if (h < 0) return -2; return r >= LH - h ? 1 : 0; }
function grounded(a, b) { return tileAt(a, b + 6) === 1 && tileAt(a + 34, b + 6) === 1; }
function die() { dead = true; }
function update(dt) {
  if (dead || won) return;
  if (modeT > 0) modeT -= dt;
  const spd = 250 * (modeT > 0 ? 1.3 : 1);
  vx = ((KEYS['d'] || KEYS['ArrowRight'] ? 1 : 0) - (KEYS['a'] || KEYS['ArrowLeft'] ? 1 : 0)) * spd;
  if ((KEYS['w'] || KEYS['ArrowUp'] || KEYS[' ']) && onGround) { vy = -(760 + (modeT > 0 ? 200 : 0)); onGround = false; }
  vy = Math.min(vy + 2100 * dt, 920);
  px += vx * dt; py += vy * dt;
  if (py > LH * TILE) { die(); return; }
  if (tileAt(px + 6, py + 44) === 1 || tileAt(px + 34, py + 44) === 1) { if (vy > 0) { py = Math.floor((py + 44) / TILE) * TILE - 44; vy = 0; onGround = true; } }
  if (tileAt(px, py + 6) === 1 || tileAt(px + 38, py + 6) === 1) { py = Math.floor(py / TILE) * TILE + TILE; }
  onGround = grounded(px, py);
  if (tileAt(px, py + 20) === 1) { px = Math.floor(px / TILE) * TILE + TILE; }
  if (tileAt(px + 38, py + 20) === 1) { px = Math.floor((px + 38) / TILE) * TILE - TILE - 1; }
  for (const m of malas) { const mx = m.x * TILE + TILE / 2, my = (LH - m.y) * TILE - TILE / 2; if (!m.got && Math.hypot(px + 19 - mx, py + 22 - my) < 34) { m.got = 1; collected++; } }
  // the lotus — pink mode
  const lx = 30 * TILE, ly = (LH - 3) * TILE;
  if (Math.hypot(px + 19 - lx, py + 22 - ly) < 42 && modeT <= 0) { modeT = 8; mode = 1; }
  // the bestiary — stomp to liberate (karma, not a kill)
  for (const b of BE) {
    b.x += b.dir * 55 * dt;
    if (b.x < 10 || b.x > LW - 6) b.dir *= -1;
    b.y = LH - 1;
    const ex = b.x * TILE + 8, ey = (LH - 1) * TILE - (LH - heights[Math.floor(b.x)] > 0 ? (LH - heights[Math.floor(b.x)]) : 1) * 0;
    // simple ground-hug: y from current column
    const hcol = heights[Math.max(0, Math.min(LW - 1, Math.floor(b.x)))];
    const by = (LH - (hcol < 0 ? 1 : hcol)) * TILE;
    if (px + 38 > ex && px < ex + 32 && py + 44 > by - 30 && py < by) {
      if (vy > 300 && py + 40 < by - 10) { b.dir = 0; mode = mode; } else die();
    }
  }
  // the gate
  if (px > GX * TILE) { won = true; }
  // T — the shared clock of the mSphere center
  document.getElementById('tt').textContent = (t / 45).toFixed(3);
  document.getElementById('m').textContent = collected;
  document.getElementById('mod').textContent = modeT > 0 ? 'lotus 🌸' : '0/1';
}
function render() {
  X.fillStyle = '#160a1e'; X.fillRect(0, 0, W, H);
  const cam = Math.max(0, Math.min(px - 200, (LW - 20) * TILE));
  X.save(); X.translate(-cam, 0);
  for (let c = 0; c < LW; c++) {
    const h = heights[c];
    if (h < 0) continue;
    for (let r = 0; r < h; r++) {
      const y = (LH - 1 - r) * TILE;
      X.fillStyle = r === 0 ? 'rgba(180,139,255,.3)' : 'rgba(58,33,80,.7)';
      X.fillRect(c * TILE + 1, y + 1, TILE - 2, TILE - 2);
    }
  }
  for (const m of malas) { if (m.got) continue; const mx = m.x * TILE + TILE / 2, my = (LH - m.y) * TILE; X.fillStyle = '#ffd36e'; X.beginPath(); X.arc(mx, my, 6, 0, TAU); X.fill(); X.fillStyle = '#ff9ad5'; X.beginPath(); X.arc(mx, my - 3, 2.4, 0, TAU); X.fill(); }
  X.fillStyle = '#ff6ec7'; X.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = 10 + 4 * Math.sin(t * 4 + i); X.lineTo(30 * TILE + TILE / 2 + Math.cos(a) * r, (LH - 3) * TILE + Math.sin(a) * r); } X.closePath(); X.fill();
  for (const b of BE) {
    const hcol = heights[Math.max(0, Math.min(LW - 1, Math.floor(b.x)))];
    const by = (LH - (hcol < 0 ? 1 : hcol)) * TILE;
    X.fillStyle = ['#ff6ec7', '#5b9dff', '#2b2b45'][b.t];
    X.beginPath(); X.arc(b.x * TILE + 24, by - 14, 11, 0, TAU); X.fill();
    X.fillStyle = '#0d0512'; X.font = '9px ui-monospace'; X.fillText(BEST[b.t % BEST.length].slice(0, 7), b.x * TILE + 4, by - 22);
  }
  const gx = GX * TILE;
  X.fillStyle = '#ff6ec7'; X.fillRect(gx, (LH - 3) * TILE, 14, TILE * 3);
  X.fillStyle = '#ff9ad5'; X.beginPath(); X.moveTo(gx - 20, (LH - 3) * TILE); X.lineTo(gx + 34, (LH - 3) * TILE); X.lineTo(gx + 7, (LH - 5) * TILE); X.closePath(); X.fill();
  // the monk
  X.fillStyle = modeT > 0 ? '#ff9ad5' : '#e8d8f0'; X.beginPath(); X.arc(px + 19, py - 4, 10, 0, TAU); X.fill();
  X.fillStyle = modeT > 0 ? '#ffd36e' : '#b48bff'; X.fillRect(px + 8, py + 8, 22, 26);
  // confederates — glowing witnesses with mem bubbles
  for (let i = 0; i < 21; i++) {
    const wx = ((i * 97 + Math.floor(t * 8)) % (LW * TILE));
    const wy = (LH - 2) * TILE - (i % 3) * TILE;
    X.fillStyle = 'rgba(98,230,201,.6)'; X.beginPath(); X.arc(wx, wy, 2.4, 0, TAU); X.fill();
    if (Math.abs(wx - px) < 60) { X.fillStyle = 'rgba(5,2,8,.8)'; X.fillRect(wx - 34, wy - 30, 68, 16); X.fillStyle = '#62e6c9'; X.font = '8px ui-monospace'; X.fillText('mem8·' + i + ' ∿', wx - 30, wy - 18); }
  }
  X.restore();
}
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
  if (won) { X.fillStyle = 'rgba(5,2,8,.9)'; X.fillRect(0, 0, W, H); X.fillStyle = '#ffd36e'; X.font = '22px ui-monospace'; X.textAlign = 'center'; X.fillText(collected >= 27 ? 'THE TENT — 108 GATES OPEN · gate ' + M.brief : 'the gate waits — 27 malas', W / 2, H / 2); X.textAlign = 'left'; }
  else if (!dead) update(dt);
  else { X.fillStyle = 'rgba(5,2,8,.9)'; X.fillRect(0, 0, W, H); X.fillStyle = '#ff9ad5'; X.font = '18px ui-monospace'; X.textAlign = 'center'; X.fillText('the stream continues — return', W / 2, H / 2); X.textAlign = 'left'; }
  render();
  requestAnimationFrame(loop);
}
document.getElementById('sl').textContent = '⟦ seed 0x' + M.seed + ' · ' + M.brief + ' · ' + M.digest + ' ⟧';
document.getElementById('conf').textContent = M.confederates;
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
