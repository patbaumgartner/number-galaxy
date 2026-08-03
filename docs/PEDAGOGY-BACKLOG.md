# Pedagogy backlog

A review of all three games against current research on how children learn number, counting
and mental arithmetic, turned into 30 changes to pick from.

Every item carries the evidence it rests on and a **Lehrplan 21** competency tag, so a Swiss
teacher can see which part of the curriculum it serves. LP21 codes and the German descriptor
text are quoted from [zh.lehrplan.ch](https://zh.lehrplan.ch) — verbatim, not paraphrased.

**Tier 0 is done and shipped.** Tiers 1–5 are open.

---

## What the review found

### Already research-aligned — do not "simplify" these away

| Design choice | Why it is right |
|---|---|
| No accounts, no ads, no analytics, no network calls, offline-first | The architecture *is* the privacy policy. ICO Children's Code standards 5 and 7–13 are satisfied structurally rather than by policy text. |
| Countdown **off by default** | Framing, not the clock, is the documented anxiety vector (Maki et al. 2024). |
| A wrong answer never ends a run | A hard day yields *more* practice, not less. |
| Local Hall of Fame, one entry per rank × clock, one profile per device | This is a **personal-best board**, not a leaderboard. The social-comparison harms (Carmosino 2024; Chen et al. 2024) need visible peers; there are none. |
| No daily-login streak | The combo streak is within-mission and resets each run. No cross-day loss aversion — the mechanic Kuo et al. (2026) found causes goal drift and exit friction in children simply is not here. |
| Leitner scheduling per fact, commutativity-canonical (`7×8 ≡ 8×7`) | Real spaced repetition (Murray et al. 2025), and half as many facts to carry. |
| Derived-fact strategy cards in the trainer | `×5 is half of ×10`, `×9 is ×10 minus one group`, `×4 is double twice` — genuine LP21 `Rechenvorteile`. |
| Number Beam: bar models on a shared scale, answered on a number line | Directly serves the log→linear shift (Siegler & Opfer 2003), and is production rather than recognition. |
| Distractors built from real near-misses | Not absurd fillers. |
| `hasUniqueOperator`, division built from the answer outwards | Mathematically careful generation. |
| WCAG 2.1 AA axe-audited on two viewports, `prefers-reduced-motion`, 44 px targets | The test suite fails on a single violation. |

### Dark-pattern audit: clean

No notifications, no network, no accounts, no monetisation, no daily streak, no social
comparison. Residual items were small and are addressed in Tier 0: the summary armed
"Play again" as the default action, and celebrated speed and "New record" regardless of how
the run had gone.

### The five real gaps

1. **Arcade adaptivity has five buckets.** `weakness` and `sr` key on `'addition'`,
   `'subtraction'`… It can know a child is "bad at addition"; it cannot know that `7+8` is
   hard and `2+2` is trivial. The trainer solves this properly. The arcade does not.
2. **The most common question type had the least useful feedback.** `direct` is weighted 3×
   every other form, and its working was `left symbol right = result` — the question
   restated. *(Fixed in Tier 0.)*
3. **That feedback vanished after 2000 ms**, and the missed question was never asked again.
   *(Fixed in Tier 0.)*
4. **There is no floor.** Nothing addresses subitizing, cardinality, counting-on or
   number-line estimation. Number Beam starts at "double a number up to 10".
5. **Difficulty is a manual global setting**, and the first star sat at 50 % accuracy — on
   four tiles, chance is 25 %. *(Star thresholds fixed in Tier 0; adaptation is item 9.)*

---

## Tier 0 — Repair the learning loop ✅ done

| # | Change | Evidence | LP21 |
|---|---|---|---|
| 1 | **Miss feedback waits to be dismissed.** Correct answers still auto-advance after 650 ms; a miss holds until *Verstanden / Got it*, which takes focus. | Elaborated feedback only works if it is read (Töllner et al. 2026; Shute 2008). 2 s is below reading time for a two-step working. | `MA.1.C.1` |
| 2 | **`direct` questions explain a route.** `55 + 6` → `55 + 5 = 60 → 60 + 1 = 61`; `9 × 7` → `10 × 7 − 7 = 70 − 7 = 63`; `14 ÷ 2` → `7 + 7 = 14`. Pure notation, so still no translation. Rejects any route naming a value above the rank ceiling. | Worked-example effect (Barbieri et al. 2023). LP21: *"Geschicktes Rechnen beruht auf Beziehungen."* | `MA.1.C.1.e`, `MA.1.B.1` |
| 3 | **A missed question comes back** three questions later, at most once, mission still 25 long. | Retrieval after correction is what turns a miss into learning. | `MA.1.A.3` |
| 4 | **The chosen wrong answer is recorded** (last 200, on-device). | The distractor reached for is the only signal separating "does not know it" from a nameable mistake. Unblocks items 15, 16, 19, 29. | — |
| 5 | **Stars re-based to 65 / 80 / 92 %.** Below 65 %, no verdict — the game offers smaller numbers and drops a rank on one tap. | Chance is 25 % on four tiles; 50 % praised a coin toss. 80–85 % is the learning band (Lau et al. 2018). | — |
| 6 | **Speed shown only at ≥ 80 % accuracy**, and "New record" withheld from a run that struggled. | Fluency is flexibility + efficiency + accuracy + strategy (NCTM 2020). Automaticity stays a goal; the *framing* changes. | — |
| 7 | **A stopping point.** "Play again" no longer pre-armed; after two runs back to back the summary says stopping here is good. | AAP dropped hour limits for balance and non-engagement-based design. | — |

Verified by 395 unit tests, 169 e2e tests including axe on phone and desktop, and by playing
the built game in a browser.

---

## Tier 1 — Make the arcade adaptive

**8. Fact-level memory in the arcade.** ✅ **done** — `game/facts.ts` keys a fact by its pair
of operands, canonical across commutativity *and* across inverse (`12 − 5` ≡ `12 − 7`,
`6 × 7` ≡ `42 ÷ 6`). Scheduling reuses the Leitner boxes, moved to `review/leitner.ts` so the
arcade and the trainer share one algorithm. Half of each mission is drawn from what is due,
bounded to 400 tracked facts, filtered to the rank's ceiling, with a four-question cooldown
so review cannot narrow to the same few sums.
· Murray et al. 2025 · `MA.1.A.3`

**9. Auto-tune the number range to 80–85 % accuracy.** Keep `rank` as the ceiling the child
chose; add an internal `workingMax` that walks within it from a rolling 20-answer window.
Never announce a demotion.
· Lau et al. 2018; Bjork & Bjork 2011 · `MA.1.A.2`

**10. Split mental from written ranges.** Legend/Supernova generate 3-digit addition answered
by tapping one of four tiles — that is elimination, not mental arithmetic. Observed live:
`195 + 87 = ?`. Cap the arcade at 100–200, or restrict large numbers to round-number work
(`340 + 200`), which *is* a mental strategy. `maxFactorFor` already does this for
multiplication.
· LP21 Zyklus 2 expects `Rechenwege notieren` for large numbers · `MA.1.A.3.d`

**11. Typed answers, auto-switching on mastery.** Start on tiles; move a fact to the
`NumberPad` once it reaches Leitner box 3+. Recognition ≠ production.
· Reed et al. 2014 — recall practice produces greater fluency gains than choosing · `MA.1.A.3.d`

**12. Guarantee interleaving inside a mission.** ✅ **done** — no operation may run past three
questions before another is forced in.
· Rohrer & Taylor 2007; Brunmair & Richter 2019 · `MA.1.B.1`

**13. Adaptive form selection.** ✅ **done** — rolling accuracy per shape tilts the draw, with
the boost expressed against `DIRECT_FORM_WEIGHT` so a struggling shape can never overtake
`direct` and turn a mission into a run of the hardest thing the child has met.
· `MA.1.B.1`

**14. Fade the worked examples.** Keyed off item 8's box: box 1–2 full working, box 3 first
step only, box 4–5 answer alone.
· Expertise reversal (Barbieri et al. 2023) · `MA.1.C.1`

## Tier 2 — Teach strategy, not just answers

**15. Misconception-shaped distractors.** Tag each with a `reason`: `smallerFromLarger`,
`placeValueSplit` (`42 + 19 → 511`), `forgotCarry`, `offByOneGroup`, `addedInsteadOfMultiplied`.
· Ashlock; Yorulmaz & Önal 2017 · `MA.1.A.1`

**16. Error-specific feedback from those tags.** When the chosen tile carries a `reason`, show
the matching line instead of the generic working. ~8 new strings × 4 languages.
· Töllner et al. 2026 · `MA.1.C.1`

**17. Strategy hints in the arcade.** 💡 Help currently shows one static example per operation
(always `7 + 5` for addition). Make it a hint for *this* question, in the voice of the
existing `STRATEGY_CARDS`.
· Hopkins et al. 2020; Leuenberger et al. 2024 · `MA.1.B.1.b`

**18. "How did you work it out?"** After ~1 in 8 correct answers: 🧠 *I just knew it* / ➕ *I
counted* / 💡 *I used a trick*. Never required, never scored. Feed "I counted" into hint
frequency.
· Cognitively Guided Instruction · `MA.1.C.1`

**19. Show the child their own pattern, kindly.** From item 4's buffer: *"Subtraction across
ten is the one to practise next."* No percentages, no red.
· `MA.1.B.1`

**20. Make commutativity and inverse explicit.** After a correct `6 × 7`, sometimes follow with
`42 ÷ 6` and name the link.
· `MA.1.B.1.b`

## Tier 3 — Build the missing floor (new 4th game)

A "Number Sense" game beside the existing three, roughly ages 4–7, LP21 Zyklus 1.

**21. Subitizing and ten-frames.** Briefly-shown structured dot patterns, answered on the
existing `BeamSlider`. Ten-frames, dice and domino arrangements — structured, not random.
· Baroody et al. 2025; Ebner et al. 2025
· `MA.1.A.2.b` — *"können Fingerbilder von 1 bis 10 spontan zeigen sowie Anzahlen bis 5 ohne Zählen erfassen"*

**22. A rekenrek.** Sibling component to `BarModel`: two rows of ten beads, 5 red / 5 white.
Attach to `nearDouble` and a new `makeTen` station. Pure SVG.
· Frykholm 2010 · `MA.1.A.1.c` (*Zehner, Einer*), `MA.1.A.3.a`

**23. Number-line estimation.** Reuse `BeamSlider` with labels removed: "Put 37 where it
belongs on 0–100." Score by distance, not exactness. **Highest research value per line of
code on this list — the UI already exists.**
· Siegler & Opfer 2003; Booth & Siegler 2006
· `MA.1.A.2.c` — *"können im 100er-Raum Zahlen ordnen (z.B. auf dem Zahlenstrahl…)"*

**24. Counting-on with number-line jumps.** Animate `8 + 5` as 8, then +2 to reach 10, then +3.
· LP21 names the `Rechenstrich` explicitly · `MA.1.C.1.c`, `MA.1.A.2.a`

**25. Arrays for multiplication.** The `sq-core` card *describes* a dot grid but nothing draws
it. Show `6 × 7` split as `5 × 7 + 1 × 7`.
· Ebner et al. 2025 (CRA)
· `MA.1.C.1.d` — *"erkennen in grafischen Modellen multiplikative Beziehungen… in einem Punktefeld"*

**26. Word problems with context.** The app is 100 % symbolic. Children who compute fine still
fail to *choose* an operation, and sharing-vs-grouping division is a documented split. A CGI-typed
bank (join / separate / part-part-whole / compare). **The one item needing real translation work
in four languages.**
· `MA.1.C.1`

## Tier 4 — Fluency without fear

**27. Timer as a pace guide.** Expiry currently scores a miss; make it reveal the working and
requeue instead. Three settings: **Off / Gentle (guide bar, no expiry) / Timed**.
· Maki et al. 2024 · `MA.1.A.3`

**28. Adjustable mastery threshold.** `isMastered` requires `ms < 3000`. **Keep it** — it is a
standard automaticity criterion. But add Settings → *More thinking time* (×1.5 / ×2) for
dyscalculia, motor differences, or a second language. Never shown as failure.
· Cezarotto & Battaiola 2021
· LP21: *"Ein zu frühes, nicht vorstellungs- und verständnisorientiertes Automatisieren… behindert weiterführende Lernprozesse."*

## Tier 5 — School, parents, inclusion

**29. Parent and teacher view.** A `/progress` route over data already stored: facts mastered,
accuracy trend, "practise next", per game. JSON export + print stylesheet. No account, no
server. Pairs with a printable sheet generated from the child's own weak facts.
· ICO EdTech audit 2024 — data portability is the most-missed standard even in privacy-conscious products

**30. Multiple profiles on one device.** ✅ **done** — shipped ahead of Tier 1, because it
reshapes storage and every adaptive feature added later writes per-child data. Every
per-child key is namespaced by profile id; a pre-profile install is adopted on next launch.
Deriving a key is pure, so a blocked `localStorage` can no longer hand out a fresh, empty
namespace on every call.

---

## Suggested order

`9, 23` are the highest-value changes remaining. `4` and `30` (both shipped)
unblock Tier 2 and Tier 1 respectively.

## Sources

Barbieri et al. 2023, *Educational Psychology Review* · Baroody et al. 2025,
*Mathematical Thinking and Learning* · Bjork & Bjork 2011 · Booth & Siegler 2006 ·
Brunmair & Richter 2019 · Carmosino 2024, *IJSG* · Cezarotto & Battaiola 2021 ·
Chen et al. 2024, *Labour Economics* · Ebner et al. 2025, *Remedial and Special Education* ·
Frykholm 2010 · Hopkins et al. 2020 · ICO, *Age Appropriate Design Code* and *EdTech Examined*
2024 · Kuo et al. 2026, IDC · Lau et al. 2018, *Nature Neuroscience* · Leuenberger et al. 2024 ·
Maki et al. 2024, *Journal of School Psychology* · Murray et al. 2025,
*Educational Psychology Review* · NCTM 2020, *Procedural Fluency in Mathematics* ·
Reed et al. 2014 · Rohrer & Taylor 2007 · Ryan & Deci 2020 · Shute 2008 ·
Siegler & Opfer 2003, *Psychological Science* · Töllner et al. 2026, *Learning and Instruction* ·
Yorulmaz & Önal 2017 · D-EDK, *Lehrplan 21 Mathematik* (zh.lehrplan.ch)
