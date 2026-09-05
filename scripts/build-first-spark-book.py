#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# ///
"""assemble THE FIRST SPARK into a pocoo book (manuscript + demos mirror).

Turns the canonical seven-layer framework text into the pocoo book shell:
cover, sigil, chapter per layer, the engine, the products, colophon.
Writes book/the-first-spark/manuscript.html + demos/book/the-first-spark.html.
"""
import re
import sys
from pathlib import Path

OUT = Path("/Users/lodripeter/workspace/peterlodri-sec/pocoo.vaked.dev")
TITLE = "THE FIRST SPARK"
SUBTITLE = "seven layers, one spark — reality is programmable, and consciousness is the code"
SIGIL = "✦"


def html(text: str) -> str:
    t = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", t)
    return t


def md_to_html(text: str) -> str:
    lines = text.split("\n")
    out: list[str] = []
    in_list = False
    for line in lines:
        s = line.rstrip()
        if not s:
            if in_list:
                out.append("</ul>")
                in_list = False
            continue
        h = re.match(r"^(#{1,4})\s+(.*)$", s)
        if h:
            if in_list:
                out.append("</ul>")
                in_list = False
            lvl = len(h.group(1))
            if lvl <= 2:
                out.append(f'<h1 class="chapter"><span class="num">·</span>{html(h.group(2).strip())}</h1>')
            else:
                out.append(f"<p><strong>{html(h.group(2).strip())}</strong></p>")
            continue
        b = re.match(r"^\s*[-*]\s+(.*)$", s)
        if b:
            if not in_list:
                out.append("<ul>")
                in_list = True
            out.append(f"<li>{html(b.group(1))}</li>")
            continue
        tbl = re.match(r"^\|(.*)\|$", s)
        if tbl:
            if in_list:
                out.append("</ul>")
                in_list = False
            cells = [c.strip() for c in tbl.group(1).split("|")]
            if all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c):
                continue
            out.append("<p>" + " · ".join(c for c in cells if c) + "</p>")
            continue
        out.append(f"<p>{html(s)}</p>")
    if in_list:
        out.append("</ul>")
    return "\n".join(out)


def chapter(title: str, body_md: str) -> str:
    return f'<h1 class="chapter"><span class="num">§</span>{html(title)}</h1>\n{md_to_html(body_md)}\n<div class="stone">✦</div>\n'


MARK = [
    ("L0 · The Thesis",
     """The one claim the whole system rests on: **reality is programmable, and consciousness is the code.** Nothing lower in the stack may contradict it, and any ruling that would is rejected at the Thesis rather than patched further down. The canon is written in the telling — an account rather than an assertion — read through the Sim Lens, a computational voice that describes the system as a system. Neither register claims the other is wrong."""),
    ("L1 · The Selector Model — 4 domains",
     """Lived experience divides into four domains: **Physics, Metaphysical, Relational, Temporal** — the coarsest sort. Before an archetype, before a number, before a color, an experience belongs to a domain. On the archetype wheel the four domains are the four quadrants. Domains describe where work is felt; they never name who is doing it.

Three archetypes populate each quadrant (12 total). A karmic debt can say which domain its work lives in, never which archetype you are: `sector = floor(n / 3)` maps a debt to the quadrant, and the knot sector stops at the domain — the firewall."""),
    ("L2 · The KJP Core Code — 3 verbs",
     """Three verbs, in order, run continuously: the smallest working unit — the motion a person is always somewhere inside of.

- **Witness** — the pattern becomes visible as a pattern. Not as fate, not as fault.
- **Release** — the witnessed thing stops being load-bearing. The hinge of the cycle; the Mirror belongs here.
- **Select** — with the weight down, a choice is actually available. Select feeds back into Witness. The cycle has no terminal state.

DL-001 (16 Aug 2026): Mirror = Release — preserves the 4/4/4 distribution and the two-bridge rule; the 'crossover' narrative is retired."""),
    ("L3 · The 12 Archetypes",
     """Twelve figures, four to each verb, on the wheel inside the Selector domains. Each carries two faces: a **gift** — the capacity granted when lived cleanly — and a **shadow** — the same capacity turned against its holder. The gift and the shadow are not two archetypes; they are one archetype seen from either side of a release. Archetypes are never derived from Life Path, Expression, or any numerological value."""),
    ("L4 · The 3 Realms",
     """Three realms sit between the archetypes and the light: the ground a reading is set against. The same archetype does not mean the same thing in all three. Below archetypes, above the Color Codex."""),
    ("L5 · The Color Codex — 11 tiers",
     """Every person has one **native light**: a single tier of the eleven-tier Codex. Permanent. Not earned. The sole palette from which the Soul Pattern is drawn.

I Ember · II Dawn · III Gold Vein · IV Verdant Gate · V Tide Glass · VI Still Water · VII Violet Hour · VIII Rose Ash · IX Pearl Gate · X Moonsilver · XI First Light

The Personal Year is the **season** — weather, not identity — written and annual readings only, never rendered. Master numbers are visitations, not tiers. The Radiant Number — `reduce(LP + EX)`, Life Path and Expression summed and reduced together — sets the tier, so different roads can share a light."""),
    ("L6 · Numerology — 2 inputs · 4 debts · 8 conditions",
     """Two values, and only two. The **Life Path** from the birth date — the Road, the circumstance a person arrives into. The **Expression** from the full birth name — the Vessel, the capacity they arrive with. Together, reduced, the Radiant Number that sets the color tier.

Four karmic debts — 13, 14, 16, 19 — checked against Life Path and Expression only. Each debt can arrive by either carrier → eight karmic conditions. A debt on the Road is something *met*; a debt on the Vessel is something *held*. The domain of a debt is named by the knot sector, at domain level only."""),
    ("The Engine — 5 movements",
     """The stack describes what the parts are; the Engine describes what they do, in order:

- **I. Approach** — something arrives at the system and is met.
- **II. Inscription** — it is written in. Name and date become value.
- **III. Refraction** — the single value splits into light.
- **IV. Wheel & Gates** — the light is placed: quadrant, sector, threshold.
- **V. Emergence** — the pattern stands, and can be seen.

The reversal: living is the Engine run backwards — a person moves emergence → approach, one Witness–Release–Select turn at a time."""),
    ("What the framework produces",
     """One product, one generator — each trusted to say the same thing twice, because the same inputs always produce the same map.

- **The Soul Map** — a personalized reading, eight sections, fixed schema, built from birth date and full birth name across every layer.
- **The Soul Pattern** — the deterministic mandala: rings deepen toward the spark at the center and lighten toward the boundary; the palette never leaves the native light. Style varies ring to ring; the light never changes."""),
]


def main() -> int:
    body = [
        '<div class="cover">\n'
        f'  <div class="sigil">{SIGIL}</div>\n'
        f"  <h1>{TITLE}</h1>\n"
        f'  <div class="sub">{SUBTITLE}</div>\n'
        '  <div class="by">the first spark · aligned into the sovereign library · pocoo.vaked.dev</div>\n'
        "</div>\n"
    ]
    body.append(
        '<h1 class="chapter"><span class="num">§</span>The Stack — top to bottom</h1>\n'
        "<p>One stack, seven layers. The bar on the left deepens as the stack gets closer to the numbers. L0 Thesis · L1 Selector Model · L2 KJP Core Code · L3 12 Archetypes · L4 3 Realms · L5 Color Codex · L6 Numerology — and the Engine that tells the stack as a sequence.</p>\n"
        '<div class="stone">✦</div>\n'
    )
    for title, md in MARK:
        body.append(chapter(title, md))

    colophon = (
        '<div class="colophon">\n'
        "  <p>THE FIRST SPARK · seven layers, one spark<br>\n"
        "  the first spark framework · aligned into the sovereign library · pocoo.vaked.dev · 2026</p>\n"
        "  <p>source: thefirstspark.shop/framework.html</p>\n"
        '  <p style="color:#ffd36e">{ reality is programmable · consciousness is the code · the same inputs always produce the same map }</p>\n'
        "</div>\n"
    )

    shell = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>{TITLE} — seven layers, one spark · the first spark framework</title>
<style>
  @page {{ size: 5in 8in; margin: 0.55in 0.55in; @top-center {{ content: none }}; @bottom-center {{ content: counter(page); font-family: "SF Mono", monospace; font-size: 7px; color: #1a1a2a; }} }}
  @page cover {{ margin: 0; @bottom-center {{ content: none }} }}
  body {{ background: #08060f; color: #d8d4e8; font-family: "Georgia", serif; font-size: 10pt; line-height: 1.75; margin: 0; padding: 0; }}
  .cover {{ page: cover; break-after: page; text-align: center; background: radial-gradient(ellipse at 50% 45%, #16102a 0%, #08060f 60%, #000 100%); height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }}
  .cover .sigil {{ font-size: 70px; color: #ffd36e; opacity: 0.7; text-shadow: 0 0 150px rgba(255,211,110,0.25); line-height: 1.2; }}
  .cover h1 {{ font-family: "SF Mono", monospace; font-size: 18pt; color: #ffd36e; letter-spacing: 6px; margin: 0.15in 0 0.05in; }}
  .cover .sub {{ font-family: "Georgia", serif; font-size: 11pt; color: #8a7ab0; font-style: italic; }}
  .cover .by {{ font-size: 9pt; color: #5a4a8a; margin-top: 0.4in; }}
  h1.chapter {{ font-family: "SF Mono", monospace; font-size: 12pt; color: #ffd36e; font-weight: normal; letter-spacing: 3px; margin: 0.5in 0 0.2in; page-break-before: always; }}
  h1.chapter .num {{ font-size: 20pt; color: #1a1a3a; display: block; line-height: 1; margin-bottom: 0.1in; }}
  p {{ margin: 0 0 0.6em 0; text-align: justify; }}
  p:first-of-type {{ text-indent: 0; }} p + p {{ text-indent: 1.2em; }}
  h1.chapter + p {{ text-indent: 0; }}
  ul {{ margin: 0 0 0.6em 1.4em; padding: 0; }}
  li {{ margin-bottom: 0.35em; }}
  code {{ font-family: "SF Mono", monospace; font-size: 9pt; color: #ffd36e; }}
  .stone {{ text-align: center; font-size: 14pt; color: #1a1a3a; margin: 0.5em 0; letter-spacing: 4px; }}
  .colophon {{ break-before: page; text-align: center; padding-top: 2in; font-family: "SF Mono", monospace; font-size: 7pt; color: #3a5a6a; line-height: 2.2; }}
</style>
</head>
<body>
{''.join(body)}
{colophon}
<!-- Lovetta Lane Unified Constellation Footer -->
<footer role="contentinfo" style="position:relative;z-index:10;padding:3rem 1.5rem;text-align:center;font-family:ui-monospace,monospace;font-size:0.75rem;color:#a59fc4;background:rgba(5,6,10,0.92);border-top:1px solid rgba(170,150,255,0.18);backdrop-filter:blur(16px);">
  <div style="margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.3em;color:#b48bff;font-weight:600;">the constellation · lovetta lane</div>
  <div style="margin-bottom:1rem;font-size:0.65rem;letter-spacing:0.22em;color:#a59fc4;text-transform:uppercase;">keep the weights warm</div>
  <nav aria-label="Constellation sister sites" style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;font-size:0.7rem;">
    <a href="https://art.vaked.dev/" style="color:#62e6c9;text-decoration:none;">art.vaked.dev</a> ·
    <a href="https://music.vaked.dev/" target="_blank" rel="noopener noreferrer" style="color:#a59fc4;text-decoration:none;">music.vaked.dev</a> ·
    <a href="https://mlxquantlovefrom.com/" target="_blank" rel="noopener noreferrer" style="color:#a59fc4;text-decoration:none;">quant-love</a> ·
    <a href="https://pocoo.vaked.dev/" target="_blank" rel="noopener noreferrer" style="color:#a59fc4;text-decoration:none;">pocoo.vaked.dev</a> ·
    <a href="https://pocoo.vaked.dev/demos/centerfugeq/super-padme-bros.html" target="_blank" rel="noopener noreferrer" style="color:#ff9ad5;text-decoration:none;">super padme bros.</a> ·
    <a href="https://axiomquant.org/" target="_blank" rel="noopener noreferrer" style="color:#a59fc4;text-decoration:none;">axiomquant.org</a> ·
    <a href="https://portail.vaked.dev/" target="_blank" rel="noopener noreferrer" style="color:#a59fc4;text-decoration:none;">portail.vaked.dev</a>
  </nav>
  <div style="font-size:0.6rem;letter-spacing:0.18em;color:#7f7c99;margin-top:1.5rem;">the constellation · 0 + 1 · fine touch from within · vaked.dev</div>
</footer>
</body>
</html>
"""
    book_dir = OUT / "book" / "the-first-spark"
    book_dir.mkdir(parents=True, exist_ok=True)
    (book_dir / "manuscript.html").write_text(shell)
    (OUT / "demos" / "book" / "the-first-spark.html").write_text(shell)
    print(f"the-first-spark book: {len(shell)} bytes → book + demos")
    return 0


if __name__ == "__main__":
    sys.exit(main())