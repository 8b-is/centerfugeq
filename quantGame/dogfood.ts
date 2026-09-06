#!/usr/bin/env node
// dogfood.ts — the dogfood lane: the loop eats its own output.
//
// Ultrawhale's silver-label Q&A corpus (PeetPedro/ultrawhale-dogfood,
// the self-hosted dogfeed loop) becomes the engine's aliment: every
// row is a seed, every seed a wire, every wire an ingredient for the
// universe's stream. The HF dataset is gated (auto) — this lane works
// from the local corpus (ultrawhale/data/*.jsonl) and the embedded
// sample, and can re-ingest the public mirror once a token exists.
//
//   node quantGame/dogfood.ts --cache ../ultrawhale/data/c3_qwen_labeled.jsonl --rows 40

import { readFileSync } from 'node:fs'
import { writeFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { seedFromText, balancedTrits, wire } from '../quantTernEngine/tern.ts'

export interface DogRow {
  i: number
  label: string // the first ~90 chars — the sample of the sample
  seed: string
  wire: string
  digest: string
}

// the embedded sample — real rows from the local silver-label corpus
export const DOGFOOD_SAMPLE = [
  'Tool execution failed: code_exec Args: --timeout /opt/service/run.sh  Traceback (most recent call last):   Fil',
  'Tool execution failed: grep_tool Args: --host /var/log/app.log  Traceback (most recent call last):   File "/va',
  'Cancun is divided into two areas. Downtown, also known as Ciudad Cancun — and Cancun Island, also known as The',
  '{ "status": "RETRY", "code": 422, "error_type": "ResourceNotFoundError", "module": "storage.backend", "',
  '{ "status": "FAILURE", "code": 408, "error_type": "DatabaseTimeoutError", "module": "metrics.collector"',
  '{ "status": "SUCCESS", "code": 201, "error_type": null, "module": "event.emitter", "path": "/usr/loc',
  'Tool execution failed: web_fetch Args: --dry-run /usr/local/bin/app  Traceback (most recent call last):   File',
  'the whale breathes: 4 in, 4 out — the loop is its own aliment',
]

export function dogfoodRow(text: string, i: number): DogRow {
  const seed = seedFromText(text.trim())
  return {
    i,
    label: text.trim().slice(0, 90),
    seed: seed.toString(16).slice(0, 16),
    wire: wire(balancedTrits(seed, 36), 9),
    digest: createHash('sha256').update(text).digest('hex').slice(0, 16),
  }
}

// rowsFromFiles: ingest any JSONL cache ({text} rows) — the local corpus
export function rowsFromFiles(paths: string[], max = 50): DogRow[] {
  const out: DogRow[] = []
  for (const p of paths) {
    try {
      const lines = readFileSync(p, 'utf8').split('\n')
      for (const ln of lines) {
        if (!ln.trim()) continue
        try {
          const r = JSON.parse(ln) as Record<string, unknown>
          const t = typeof r.text === 'string' ? r.text
            : typeof r.question === 'string' ? `${r.question} → ${r.answer ?? ''}`
            : JSON.stringify(r)
          if (t.trim().length > 40) out.push(dogfoodRow(t, out.length))
        } catch {
          /* not json — skip */
        }
        if (out.length >= max) return out
      }
    } catch {
      /* missing file — skip */
    }
  }
  return out
}

// dogfoodWires: the corpus as a seed field — every row becomes a wire
export function dogfoodWires(rows: DogRow[]): string[] {
  return rows.map((r) => r.wire)
}

import { execFileSync } from 'node:child_process'

function fetchData(): void {
  const token = process.env.HF_TOKEN
  if (!token) { console.error('HF_TOKEN not set — run with export HF_TOKEN=hf_…'); process.exit(1) }
  const script = `
import https from 'node:https';import fs from 'node:fs';
const TOKEN = process.env.HF_TOKEN;
https.get('https://huggingface.co/datasets/PeetPedro/ultrawhale-dogfood/resolve/main/data/latest.jsonl',{headers:{Authorization:'Bearer '+TOKEN}},(res)=>{if(res.statusCode!==200){console.error('status',res.statusCode);process.exit(1)}
const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{const buf=Buffer.concat(chunks);const lines=buf.toString('utf8').split('
').filter(l=>l.trim());const parsed=[];for(const l of lines){try{parsed.push(JSON.parse(l))}catch{}}
fs.writeFileSync(process.cwd()+'/out/dogfood-real.jsonl',parsed.map(r=>JSON.stringify(r)).join('
'));console.log('pulled',parsed.length,'rows → out/dogfood-real.jsonl')})}).on('error',e=>{console.error(e.message);process.exit(1)})`
  const tmp = '/tmp/hf-pull-dogfood.mjs'
  require('node:fs').writeFileSync(tmp, script)
  execFileSync(process.execPath, [tmp], { env: { ...process.env, HF_TOKEN: token }, stdio: 'inherit' })
}

function main(): void {
  const args = process.argv.slice(2)
  let cache: string[] = []
  let rows = 40
  let doFetch = false
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--cache') {
      while (i + 1 < args.length && !args[i + 1].startsWith('--')) { cache.push(args[++i]) }
    }
    if (args[i] === '--rows') rows = Number(args[++i])
    if (args[i] === '--fetch') doFetch = true
  }
  if (doFetch) fetchData()
  const corpus = cache.length ? rowsFromFiles(cache, rows) : DOGFOOD_SAMPLE.map((t, i) => dogfoodRow(t, i))
  const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'out')
  mkdirSync(outDir, { recursive: true })
  const file = join(outDir, 'dogfood.jsonl')
  writeFileSync(file, corpus.map((r) => JSON.stringify(r)).join('\n') + '\n')
  console.log(`⟦ the whale eats its own loop: ${corpus.length} rows ⟧`)
  for (const r of corpus.slice(0, 3)) {
    console.log(`row ${r.i} :: ${r.seed} ⟦${r.wire}⟧ :: ${r.label.slice(0, 42)}…`)
  }
  console.log(`manifest: ${file}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main()
}