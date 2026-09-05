# the MLX-QUANT · hw-ultra seam

The engine's seed line is the only input the GPU lane needs. A brief
becomes trits; trits become a b1.58 tensor; the tensor is a command
queue's payload. No sampling drift, no weight files to ship — the seed
line IS the weight file.

## the tensor wire

```
node gen.ts tensor "<brief>" --rows R --cols C
```

emits a manifest with:

- `rows` / `cols` — the tensor shape
- `density` = `gamma` — `mean|W|` over the ternary weights: exactly the
  symmetric scaling factor of the MLX-QUANT quantizer
  (`W_quant = clip(round(W/gamma), -1, +1)`)
- `int8_hex` — the `{-1, 0, +1}` tensor as an int8 buffer, ready to bind
  as a Metal kernel buffer (the `ternary_matmul_kernel` shape: int8
  weights × half activations × float gamma)
- `wire` — the 108-trit seed line, the ledger entry of the tensor

## the seam, three notes

1. **8x**: int8 ternary against FP16 — the 1.58-bit lane's memory
   reduction holds for generated weights too, on the same Metal buffers.

2. **Determinism is the admissibility argument**: the same brief →
   same density → same spectral norm → same tensor, every machine, every
   time. The ESD of `W Wᵀ` stays Marchenko–Pastur-shaped with `γ = m/n`
   and scale `p = density`, so the ledger's rule ("admissible iff
   replayable") extends to model weights. No collapse: density is pinned
   by the seed, not by training luck.

3. **hw-ultra owns the queue**: the bare-metal command queue of the
   ayeOS mesh takes the int8 buffer and the half gamma as payloads; the
   engine never touches memory — it only writes the seed line.

## alignment

- `8b-is/MLX-QUANT` — the kernels that execute the tensor (BitNet b1.58,
  Metal, 12.80x compression)
- `8b-is/hw-ultra` — the command queue that submits it (Apple Silicon +
  AMD MI300X)
- `8b/centerfugeq` — the engine that generates it, replayably

the constellation · 0 + 1 · fine touch from within · vaked.dev