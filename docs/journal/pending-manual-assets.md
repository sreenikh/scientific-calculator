# Pending manual assets — GraphN² devlog

Two media assets need a human, not Claude Code, to produce. Tracked here
so they don't get lost once the automated-media PR is merged and
everything else looks "done."

---

## 1. Physical calculator photo

- [ ] Photograph the real fx-991ES, ideally next to a laptop/phone showing
      GraphN² open, so the "old vs. new" comparison is visible in one
      frame rather than two images stitched together
- [ ] Natural light, calculator screen actually showing something (not
      blank/off) if possible, more evocative than an off calculator

**Goes in:** the closing image in Section 11 ("What's Next"), which
appears in both the main devlog and **Part 3**.

**Save as:** `docs/journal/media/fx991es-and-graphn2.jpg`

---

## 2. First mockup vs. finished app

- [ ] Locate the earliest saved HTML mockup file (the very first
      `calculator-mockup.html`, not the v2/v3 iterations with the
      CONST/CONV/SOLVE overlays)
- [ ] Open it in a browser, screenshot it
- [ ] Screenshot the finished real app in the same pose/mode if possible,
      for a fair visual comparison
- [ ] Combine into one side-by-side image (any basic image tool works,
      doesn't need to be fancy)

**Goes in:** Section 5 ("How This Actually Got Built") before/after
placeholder, which appears in both the main devlog and **Part 1**.

**Save as:** `docs/journal/media/mockup-vs-finished.png`

---

## Once both exist

- [ ] Drop them in `docs/journal/media/`
- [ ] Replace the two remaining 🖼️ placeholder blocks in all affected
      files (main devlog + Part 1 + Part 3) with real
      `![...](media/...)` embeds
- [ ] If Claude Code's automated-media PR is still open, easiest to hand
      it the two files and say "wire these into the remaining
      placeholders", it already knows exactly which blocks they belong
      to. Otherwise a quick manual edit works fine too.
