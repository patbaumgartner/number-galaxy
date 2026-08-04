# Game Review and Improvement Plan — Number Galaxy (Zahlen-Galaxie)

**Reviewed:** August 2026 · **Commit:** `222fcc9` · **Scope:** running application, source, README
**Target group under review:** children aged 6–12 · **README audience:** teachers and parents

> **Status: fully implemented.** Phases 1–3 in full, and every Phase 4 item — with 4.4
> deliberately folded into 4.6 rather than shipped as specified. See
> [Implementation record](#implementation-record) at the end for exactly what shipped, what
> was softened and why, and the two places where checking the source changed the plan. The
> findings below are kept as written at review time so the reasoning stays readable.

---

## 0. How this review was produced

Everything below is grounded in one of four evidence sources. Where a claim rests on
something weaker, it says so.

| Source | What was done |
|---|---|
| **Hands-on use** | The app was built and played in a real browser at 1280×900 and 360×740: home → picker → arcade mission → deliberate wrong answer → feedback → Number Sense drill → Number Beam map. Contrast ratios, touch-target sizes and text clipping were measured in-page, not eyeballed. |
| **Source reading** | `web/src/` read directly for scoring, question generation, worked-solution routes, i18n and storage. |
| **Citation audit** | All 25 README sources checked against Crossref, DOI resolution, publisher sites and Google Scholar. |
| **Curriculum** | LP21 text taken from the official **Kanton Zürich Fachbereichslehrplan Mathematik (13.03.2017)** and cross-checked against zh.lehrplan.ch. Every German string below is verbatim from that document. |

**Verdict in one line:** the pedagogy and accessibility are genuinely strong and mostly
better than the commercial competition; the **evidence base printed in the README is not
trustworthy as written**, the LP21 mapping is too thin to be usable by a teacher, and there
are four concrete UI defects — one of which is a dead button in the most prominent position
on the home screen.

---

## PART A — Critical: the README's evidence base does not hold up

This is the most serious finding. The README lists 25 sources and asserts research backing.
**Two of those sources could not be found to exist. Three are misattributed. One claim is
contradicted by the paper cited for it. One key statistic is wrong and uncited.**

For a document written for teachers, a fabricated citation is worse than no citation.

### A.1 Sources that could not be located — remove

| Cited as | Search result |
|---|---|
| **Chen et al. 2024, _Labour Economics_** | No mathematics-education or pedagogy paper matching this found in that journal for 2024. |
| **Ebner et al. 2025, _Remedial and Special Education_** | Not found in the journal archive. Other 2025 papers in the journal were located, so the archive was reachable. |

**Action:** delete both from the Sources list, and delete any claim that rests only on them.

### A.2 Misattributed — correct or remove

| Cited as | Problem | Note |
|---|---|---|
| **Carmosino 2024, _IJSG_** | The 2024 IJSG paper located on this topic is by **Karimov, Saarela & Kärkkäinen**, DOI `10.17083/ijsg.v11i4.765`. No Carmosino authorship found. | Verify which paper was actually meant before substituting. |
| **Frykholm 2010** | No 2010 paper located. A 2004 Frykholm paper (*Teachers' Tolerance for Discomfort*) exists but is about teacher discomfort, not children's arithmetic. | Do not silently swap in the 2004 paper — it may not be the intended source at all. Identify the real source or drop the reference. |
| **Lau et al. 2018, _Nature Neuroscience_** | Not verified as cited. A 2018 paper in **_Neuroscience_** (different journal) by different authors was found on a related topic. | Same caution: a near-match is not the same paper. Confirm or remove. |

> **Do not "fix" A.2 by pasting in the near-matches.** Substituting a paper you have not read
> for one you cannot find reproduces the original problem with better spelling. Either
> confirm the intended source or delete the line.

### A.3 A claim its own citation does not support

README, *Why it is built this way*:

> "The countdown is **off by default** — Framing, not the clock, is the documented anxiety vector (Maki et al. 2024)."

**Maki et al. 2024** (*Journal of School Psychology*, Vol. 106, DOI `10.1016/j.jsp.2024.101316`)
is titled *Math anxiety in elementary students: Examining the role of timing and task
complexity*. It is about **timing and task complexity**, not about framing. It does not
establish framing as "the documented anxiety vector".

Worse for the README's argument: the timed-maths literature does **not** cleanly support
"timers are bad". It is genuinely mixed:

- Timed testing raises state anxiety in Grades 3–4 (Orbach et al., N=311).
- Test anxiety mediates roughly a third of the gender gap in maths in a nationally
  representative Italian Grade-5 sample (Caviola et al., N=146,227).
- **But** a visible countdown *reduced* anticipatory anxiety and off-task behaviour in
  7–9 year-olds, especially those at ADHD risk (Hallez & Vallier, 2025) — with no accuracy
  change either way.
- And children with *higher* maths anxiety and maths difficulty performed **better** under
  overt timing in the Maki work.

The honest position — which is also a stronger position — is: *the clock is off by default
because the evidence is mixed and the downside is asymmetric; the Gentle setting exists
because what harms is failing on the clock, not seeing it.* That is defensible and it is
what the code already does. Say that instead.

**Also flag:** two different DOIs are circulating for "Maki et al. 2024" (`10.1016/j.jsp.2024.101316`
and `10.1080/2372966x.2024.2370232`). Pin down which paper is meant before citing it.

### A.4 The 80 % figure is wrong and uncited

README, *Difficulty*:

> "aiming to keep a child somewhere around 80 % — the rate at which people learn fastest."

No source is given. The result being alluded to is **Wilson, Shenhav, Straccia & Cohen (2019),
_The Eighty Five Percent Rule for optimal learning_, Nature Communications**,
DOI `10.1038/s41467-019-12874-3` — and the figure is **85 %**, not 80 %.

Note also that this result is derived for gradient-descent learners on binary classification
tasks, not for children doing arithmetic. Either cite it properly and describe the tuning
target as an engineering choice informed by it, or drop the appeal to research and simply
say what the code does.

### A.5 Verified and safe to keep (16)

Barbieri et al. 2023 (`10.1007/s10648-023-09745-1`) · Bjork & Bjork 2011 ·
Booth & Siegler 2006 · Brunmair & Richter 2019 · Cezarotto & Battaiola 2021 ·
Hopkins et al. 2020 · Leuenberger et al. 2024 · Murray et al. 2025 (`10.1007/s10648-025-10035-1`) ·
NCTM 2020 · Reed et al. 2014 (`10.1080/14794802.2014.962074`) · Rohrer & Taylor 2007 ·
Ryan & Deci 2020 · Shute 2008 (`10.3102/0034654307313795`) · Siegler & Opfer 2003 ·
Töllner et al. 2026 (`10.1016/j.learninstruc.2026.102413`) · Yorulmaz & Önal 2017

**Two cannot be verified yet and should not be cited until they can:** Baroody et al. 2025
(*Mathematical Thinking and Learning*) appears to be in press rather than published;
**Kuo et al. 2026, IDC** refers to a conference held June 2026 whose proceedings could not be
retrieved. Citing an unpublished paper as settled evidence is the same failure mode as A.1.

### A.6 The NCTM claim is fine

> "Fluency is flexibility, accuracy and strategy before it is pace (NCTM 2020)"

NCTM's position statement defines procedural fluency as the "ability to apply procedures
efficiently, flexibly, and accurately". The README's paraphrase is fair. Optionally quote it
directly for precision. **No change required.**

---

## PART B — Lehrplan 21 mapping

### B.1 What is wrong today

The entire curriculum section is **one paragraph naming three codes**, and it has three
accuracy problems:

1. **`MA.1.A.2.b` is quoted as _"Anzahlen bis 5 ohne Zählen erfassen"_.** That is a fragment
   — the last clause of a four-part descriptor. The complete verbatim descriptor is:

   > "können im Zahlenraum bis 20 von beliebigen Zahlen aus vorwärts und rückwärts zählen. können in 2er-Schritten vorwärts zählen, von 2 bis 20. können Fingerbilder von 1 bis 10 spontan zeigen sowie Anzahlen bis 5 ohne Zählen erfassen."

   Presenting a clause as though it were the descriptor is exactly the kind of thing a Swiss
   teacher will check.

2. **Word problems are attributed to `MA.1.C.1`.** `MA.1.C.1` is *Rechenwege darstellen* —
   worked routes, which the app genuinely does serve. But **"Rechengeschichten"** — LP21's
   own word for word problems — appears in **`MA.1.C.2.b`** and **`MA.1.C.2.d`**, not in
   `MA.1.C.1`. The two claims have been merged onto one code.

3. **The `Automatisieren` quote is truncated in a way that changes it.** The README prints:

   > "Ein zu frühes, nicht vorstellungs- und verständnisorientiertes Automatisieren… behindert weiterführende Lernprozesse."

   The official sentence, from **Didaktische Hinweise → Automatisieren**, is:

   > "Ein zu frühes, nicht vorstellungs- und verständnisorientiertes Automatisieren kann zwar zu kurzfristigen Lernerfolgen führen, behindert jedoch weiterführende Lernprozesse."

   The elision removes the concession ("kann zwar zu kurzfristigen Lernerfolgen führen") which
   is the part that makes the sentence a *warning about trade-offs* rather than a flat
   prohibition. Quote it in full.

### B.2 The mapping table to add

All German below is **verbatim** from the Kanton Zürich Fachbereichslehrplan Mathematik
(13.03.2017), cross-checked against zh.lehrplan.ch. Zyklus 1 ≈ KG + 1./2. Klasse;
Zyklus 2 ≈ 3.–6. Klasse.

#### 👀 Number Sense (Zahlenblick)

| Station | LP21 | Zyklus | Verbatim descriptor |
|---|---|---|---|
| At a glance, Ten-frame, Bead rack | `MA.1.A.2.b` | 1 | "können im Zahlenraum bis 20 von beliebigen Zahlen aus vorwärts und rückwärts zählen. können in 2er-Schritten vorwärts zählen, von 2 bis 20. können Fingerbilder von 1 bis 10 spontan zeigen sowie Anzahlen bis 5 ohne Zählen erfassen." |
| Dot patterns, various arrangements | `MA.1.C.2.a` | 1 | "können Anzahlen verschieden darstellen (z.B. mit Punkten oder Strichen) und verschieden anordnen (z.B. auf einer Linie und in der Fläche verteilt)." |
| Ten-frame and bead rack, grouped in fives | `MA.1.C.2.b` | 1 | "können Anzahlen bis 20 strukturiert darstellen (z.B. an 5ern und 10ern orientiert: 9 = 5 + 4; 12 = 10 + 2). können Additionen und Subtraktionen mit Handlungen, Rechengeschichten und Bildern konkretisieren." |
| Place it (number line) | `MA.1.C.1.b` | 1 | "können Summen darstellen und Darstellungen nachvollziehen (z.B. auf dem 20er-Feld oder auf dem Zahlenstrahl)." |
| Place it / ordering, larger ranges | `MA.1.A.2.c` | 1 | "können im Zahlenraum bis 100 in 1er-, 2er-, 5er- und 10er-Schritten vorwärts zählen. können im 100er-Raum Zahlen ordnen (z.B. auf dem Zahlenstrahl und auf der 100er-Tafel)." |
| Count on | `MA.1.A.2.a` | 1 | "können bis zu 20 Elemente auszählen und im Zahlenraum bis 10 von jeder möglichen Zahl aus vor- und rückwärts zählen." |
| Dot array | `MA.1.C.1.d` | 1 | "erkennen in grafischen Modellen multiplikative Beziehungen, insbesondere Verdoppelungen und 1 · mehr bzw. 1 · weniger (z.B. 3 · 4 und 6 · 4 in einem Punktefeld als Verdoppelung)." |

#### 📏 Number Beam (Zahlenbalken)

| Station | LP21 | Zyklus | Verbatim descriptor |
|---|---|---|---|
| Double, Halve, Double twice — on the bar | `MA.1.C.1.d` | 1 | "erkennen in grafischen Modellen multiplikative Beziehungen, insbesondere Verdoppelungen und 1 · mehr bzw. 1 · weniger (z.B. 3 · 4 und 6 · 4 in einem Punktefeld als Verdoppelung)." |
| Double / Halve as arithmetic | `MA.1.A.3.a` | 1 | "können im Zahlenraum bis 20 ohne Zählen verdoppeln, halbieren, addieren und subtrahieren." |
| Number bonds, Split (partitioning) | `MA.1.A.3.b` | 1 | "können bis 100 ohne 10er-Überträge addieren und subtrahieren ohne Zählen (z.B. 35 + 13) können auf den nächsten 10er ergänzen. können bis 100 verdoppeln (5er- und 10er-Zahlen) und halbieren (10er-Zahlen). können zweistellige Zahlen in 10er und 1er zerlegen (z.B. 25 in zwei 10er und fünf 1er)." |
| Quarters, Fraction of — the bar as a model | `MA.1.C.1.g` | 2 | "können Summen, Differenzen und Produkte von Brüchen und von Dezimalzahlen mit geeigneten Modellen darstellen und beschreiben (z.B. Produkt: ⅓ von ¾ mit dem Rechteckmodell; Summe: ½ + ¼ mit dem Kreismodell)." |
| Fractions read off the bar | `MA.1.C.2.g` | 2 | "können Gesetzmässigkeiten im Bereich der natürlichen Zahlen mit Beispielen konkretisieren (z.B. Quadratzahlen haben eine ungerade Anzahl Teiler → 16: 1, 2, 4, 8, 16). können Brüche mit den Nennern 2, 3, 4, 5, 6, 8, 10 darstellen und vergleichen sowie Darstellungen interpretieren (z.B. Kreis-, Rechteckmodell, Zahlenstrahl). können Zahlenfolgen mit positiven rationalen Zahlen beschreiben (z.B. ½, ¼, ⅛, ...; 0.7, 0.77, 0.777, ...)." |

#### 🛸 Math Invaders

| Feature | LP21 | Zyklus | Verbatim descriptor |
|---|---|---|---|
| + and − within 20 | `MA.1.A.3.a` | 1 | "können im Zahlenraum bis 20 ohne Zählen verdoppeln, halbieren, addieren und subtrahieren." |
| + and − within 100 | `MA.1.A.3.b` | 1 | "können bis 100 ohne 10er-Überträge addieren und subtrahieren ohne Zählen (z.B. 35 + 13) können auf den nächsten 10er ergänzen. können bis 100 verdoppeln (5er- und 10er-Zahlen) und halbieren (10er-Zahlen). können zweistellige Zahlen in 10er und 1er zerlegen (z.B. 25 in zwei 10er und fünf 1er)." |
| ×, ÷, and the ×2/×5/×10 tables | `MA.1.A.3.c` | 2 | "können im Zahlenraum bis 100 verdoppeln, halbieren, addieren und subtrahieren. kennen Produkte aus dem kleinen Einmaleins mit den Faktoren 2, 5 und 10. können Produkte aus dem kleinen Einmaleins in Faktoren zerlegen (z.B. 36 = 6 · 6 = 4 · 9)." |
| Symbols `+ − · < >`, terminology | `MA.1.A.1.c` | 1 | "verstehen und verwenden die Begriffe mal, grösser als, kleiner als, gerade, ungerade, ergänzen, halbieren, verdoppeln, Zehner, Einer und die Symbole ·, <, >. können natürliche Zahlen bis 100 lesen und schreiben." |
| `÷` symbol (Legend / Supernova ranks) | `MA.1.A.1.d` | 2 | "verstehen und verwenden den Begriff durch und das Symbol :." |
| Division **with remainder** | `MA.1.B.2.e` | 2 | "können Divisionen mit Rest mit der Umkehroperation begründen (z.B. 32 : 6 gibt Rest, weil 32 keine Zahl aus der 6er-Reihe ist)." |
| Worked solutions (the "route") | `MA.1.C.1.c` | 1 | "können Rechenwege zu Additionen und Subtraktionen darstellen und nachvollziehen (z.B. 18 + 14 mit Hilfe des Rechenstrichs)." |
| Worked solutions, all four operations | `MA.1.C.1.e` | 2 | "können Rechenwege zu den Grundoperationen darstellen, austauschen und nachvollziehen (z.B. 80 + 5 + 5 + 5 + 5 = 80 + 4 · 5; 347 - 160 → 160 + 40 + 147 = 347)." |
| **Word problems** (Sachaufgaben) | `MA.1.C.2.d` | 1 | "können Grundoperationen mit Handlungen, Sachbildern, Rechengeschichten und grafischen Strukturen veranschaulichen und Veranschaulichungen interpretieren. können Beziehungen in und zwischen Grundoperationen zeigen und beschreiben (z.B. die Veränderung der Produkte 1 · 3, 2 · 4, 3 · 5, 4 · 6, ...)." |
| Missing-operator / missing-addend shapes | `MA.1.B.1.b` | 1 | "können Additionen bis 20 systematisch variieren, Auswirkungen beschreiben bzw. mit Anschauungsmaterial aufzeigen (z.B. 8 + 8 = 16, 8 + 9 = 17; die Summe erhöht sich um 1, weil der zweite Summand um 1 zunimmt). können Zahlenfolgen (figurierte Zahlen) bilden, weiterführen und verändern (z.B. 1, 2, 3 / 2, 3, 4 / 3, 4, 5 / 4, 5, 6)." |
| Checking by inverse (subtraction) | `MA.1.B.2.c` | 1 | "können Produkte mit einer Summe überprüfen (z.B. 3 · 4 = 4 + 4 + 4). können Differenzen mit der Umkehroperation überprüfen (z.B. 27 - 6 = 21 → 21 + 6 = 27)." |
| Checking by inverse (division) | `MA.1.B.2.d` | 2 | "können Quotienten mit der Umkehroperation überprüfen (z.B. 21 : 3 = 7 → 7 · 3 = 21)." |

#### ✖️ Times Tables (Einmaleins)

| Feature | LP21 | Zyklus | Verbatim descriptor |
|---|---|---|---|
| ×2, ×5, ×10 planets | `MA.1.A.3.c` | 2 | "können im Zahlenraum bis 100 verdoppeln, halbieren, addieren und subtrahieren. kennen Produkte aus dem kleinen Einmaleins mit den Faktoren 2, 5 und 10. können Produkte aus dem kleinen Einmaleins in Faktoren zerlegen (z.B. 36 = 6 · 6 = 4 · 9)." |
| **Full 1–12 recall — the core goal** | `MA.1.A.3.d` | 2 | "können beim Addieren und Subtrahieren Rechenwege notieren und Ergebnisse überprüfen. können schriftlich addieren und subtrahieren. kennen die Produkte des kleinen Einmaleins." |
| Squares Nebula (dot-grid strategy card) | `MA.1.C.2.f` | 2 | "können Zahlenfolgen und Produkte veranschaulichen (z.B. 14 · 14 mit dem Malkreuz; die Zahlenfolge 1, 3, 6, 10, ... mit Punkten)." |
| Deep Space 13–19 (split off the 10) | `MA.1.A.3.e` | 2 | "können bis 4 Wertziffern im Kopf addieren und subtrahieren (z.B. 320'000 + 38'000; 402 + 90). können bis 4 Wertziffern multiplizieren (im Kopf oder mit Notieren eigener Rechenwege, z.B. 45 · 240). können natürliche Zahlen durch einstellige Divisoren dividieren (im Kopf oder mit Notieren eigener Rechenwege, z.B. 231 : 7)." |
| Strategy cards (×9 = ×10 − 1 group) | `MA.1.B.1.d` | 2 | "können Produkte systematisch variieren und Auswirkungen beschreiben bzw. mit Anschauungsmaterial zeigen (z.B. 3 · 3, 6 · 3; 3 · 4, 6 · 4; 3 · 5, 6 · 5). suchen eigene Lösungswege und tauschen sie aus." |

#### What the app does **not** cover — say so plainly

A teacher needs to know the boundary as much as the coverage. The app serves **`MA.1` Zahl
und Variable only**. It covers **nothing** in:

| Area | LP21 | Verbatim competency statement |
|---|---|---|
| **Form und Raum** (geometry, shape, space) | `MA.2.A.2` | "Die Schülerinnen und Schüler können Figuren und Körper abbilden, zerlegen und zusammensetzen." |
| Length, area, volume | `MA.2.A.3` | "Die Schülerinnen und Schüler können Längen, Flächen und Volumen bestimmen und berechnen." |
| Mental geometry | `MA.2.C.3` | "Die Schülerinnen und Schüler können sich Figuren und Körper in verschiedenen Lagen vorstellen, Veränderungen darstellen und beschreiben (Kopfgeometrie)." |
| **Grössen / measurement** | `MA.3.A.2` | "Die Schülerinnen und Schüler können Grössen schätzen, messen, umwandeln, runden und mit ihnen rechnen." |
| **Daten und Zufall** | `MA.3.B.2` | "Die Schülerinnen und Schüler können Sachsituationen zur Statistik, Kombinatorik und Wahrscheinlichkeit erforschen, Vermutungen formulieren und überprüfen." |
| Handling data | `MA.3.C.1` | "Die Schülerinnen und Schüler können Daten zu Statistik, Kombinatorik und Wahrscheinlichkeit erheben, ordnen, darstellen, auswerten und interpretieren." |
| Functional relationships | `MA.3.A.3` | "Die Schülerinnen und Schüler können funktionale Zusammenhänge beschreiben und Funktionswerte bestimmen." |

Stating this is a feature, not an admission. "This is an arithmetic trainer, it does not
teach geometry or data" lets a teacher slot it in correctly instead of over-trusting it.

---

## PART C — Fit to 6–12 year-olds

### C.1 What the evidence supports about the current design

| Design choice | Evidence status |
|---|---|
| **Number Sense as a game in its own right** | **Strongly supported.** Early numeracy predicts later maths achievement, r ≈ .49 across 54 longitudinal studies (Liu et al., 2022, N > 58,000); the "Numbering" strand — subitizing, counting, numeral ID — is r ≈ .44. Dot-enumeration speed in Kindergarten predicts Grade-4 achievement (Liu et al., 2019). Building the floor is the single best-evidenced decision in the app. |
| **Symbolic over non-symbolic emphasis** | **Supported.** Symbolic number skills (counting, numeral recognition, ordering) predict later achievement more reliably than approximate/non-symbolic number sense. Sight Bay's ten-frame and bead rack are *structured symbolic* representations, which is the right side of that line. |
| **Interleaving via Surprise me** | **Well supported and large.** Rohrer et al. (2020), cluster RCT, 54 Grade-7 classes: interleaved 61 % vs blocked 38 % on a delayed test, **d = 0.83**. Nemeth et al. (2019), N=236 Grade-3, found the same direction for subtraction strategies. |
| **Spacing / Leitner** | **Supported for spacing; not directly validated for Leitner in children.** Murray et al. (2025) meta-analysis: spaced vs massed in maths, **g = 0.282** isolated, **g = 0.24** course-embedded. Note the same meta-analysis found the *testing effect* itself was **not** robust (g = 0.184, CI crosses zero). No RCT compares Leitner against other schedules in 6–12s — say "spacing is evidenced; the specific box schedule is a reasonable implementation" rather than implying the schedule itself is proven. |
| **Elaborated feedback that waits for "Verstanden"** | **Supported.** Elaborated feedback beats correct/incorrect only, but *only when actually processed* (Gal & Hershkovitz, 2023, N > 26,000 on Khan Academy; feedback latency d = 0.11–0.44). Requiring a dismissal press is precisely the mechanism that makes it work. This is a genuinely good design decision. |
| **Distractors from real misconceptions** | **Supported.** Good distractors are diagnostic; they should attract low achievers and be ignored by high achievers. Verified in code (`misconceptions.ts`) and in play — a wrong tap produced *"Ganz knapp daneben"* with the actual working. |
| **Typed answers in Times Tables, tiles in the arcade** | **Supported, with a caveat.** Constructed response beats multiple choice on transfer (Gurung et al., 2024, N=6,768, Grades 6–8) — **but the effect held only for higher-prior-knowledge students**. Using tiles at the easy end and typing at the recall end is the right way round. |
| **Stars from accuracy, not speed; speed shown only ≥ 80 %** | **Supported.** Consistent with NCTM's fluency definition and with avoiding the anxiety pathway. |
| **No leaderboard, personal-best only** | **Supported.** Social comparison and public leaderboards can depress motivation in lower achievers. Gamification meta-analyses show relatedness g = 1.776 and autonomy g = 0.638, but **competence only g = 0.277** (Landers et al., 2024) — points and badges alone do not build felt competence. |

### C.2 Where the design is out of step with the age band

**C.2.1 — "Ages 6–12" is too wide for one interface.**
NN/g's position is explicit: children reject material pitched at a younger band, and
capabilities differ sharply across 3–5 / 6–8 / 9–12. The app already *has* the machinery to
handle this (ranks, tiers, star gates) but the **shell is identical for a 6-year-old and a
12-year-old** — same dark space theme, same alien emoji, same density. A 12-year-old on
Supernova rank sees the same 👾 tiles as a 6-year-old on Rookie.

**C.2.2 — Session length is not grounded.**
25 questions per mission is asserted, not evidenced. The relevant findings:
- Pre-primary A/B/C test (Sun et al., 2024, N=94,813): **5–7 minute sessions beat 9-minute
  sessions** on numeracy.
- Codding et al. (2025), Grades 1–2 RCT: with total time held constant, **two or three short
  sessions beat one long one** for simple computation (g = 0.15–0.36) — but one longer block
  was better for *complex* computation.
- Duhon et al. (2020), Grade 4: **~40 cumulative minutes minimum** before effects appear.

The implication is not "25 is wrong" — it is that **one 25-question run is not the unit that
matters; repetition across days is**, and the app currently gives a child no reason to come
back tomorrow other than intrinsic interest. A shorter default for the youngest rank is also
worth testing.

**C.2.3 — Maths carries higher cognitive load than text, and one screen ignores this.**
The arcade screen simultaneously shows: score, combo multiplier, question counter, a timer
dial, a 25-step progress trail, the equation, a hint line, and four tiles. That is eight
information zones. For Rookie rank — a 6-year-old — score and combo are noise. Related:
Skau et al. (2026), N=81 nine-year-olds with fNIRS, found visual aids *increased* error rate
(35 % vs 21 %) and prefrontal load when not tightly integrated with the task.

**C.2.4 — The worked "route" degrades to a restatement exactly where it is needed most.**
README: *"it is a route rather than the answer restated"*. In `working.ts`:

```
export function strategyWorking(equation, maxValue) {
    return fittingCandidate(equation, maxValue)?.text ?? `${left} ${symbol} ${right} = ${result}`
}
```

`fittingCandidate` only returns a strategy whose intermediate values all fall within
`maxValue`. At **Rookie** (`maxValue = 10`) almost nothing fits, so the fallback fires. Played
live: `7 + 3 = ?` answered wrongly produced the working **`7 + 3 = 10`** — the answer restated.
The code comment is honest about this ("an honest restatement beats a working that names
numbers the child has never been shown"); **the README is not.** The youngest, most
struggling children get the weakest explanations.

**C.2.5 — The miss message teaches counting.**
The off-by-one miss reason reads *"Ganz knapp daneben — zähl noch einmal genau nach."*
("count again carefully"). The app's entire stated pedagogy — and LP21's `MA.1.A.3.a`, "ohne
Zählen" — is about moving children *past* counting. Hopkins et al. (2020), already cited in
the README, is framed around counting hindering learning. For a small-number addition miss,
"mach zuerst zehn" (make ten first) is the strategy-consistent message.

---

## PART D — UI, UX and placement

Findings below were reproduced in a live browser; measurements are from the running DOM.

### D.1 Defects — ordered by severity

**D.1.1 🔴 The largest button on the home screen does nothing.**
After a profile exists, the hero button reads **"Weiterspielen"** (Continue playing). Clicking
it produces **no navigation and no DOM change** — verified by comparing URL and rendered text
before and after the click (both identical). In [`HomePage.tsx`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/HomePage.tsx#L38-L41), `play()` only calls `store.ensurePlayer(...)`,
which is a no-op once the player is present.

This is the brightest, largest, highest-contrast element on the page, labelled with an
action verb, and it is inert. A 6-year-old will press it first and press it repeatedly.
**Fix:** either navigate to the last-played game (which is what "Weiterspielen" promises) or
scroll/focus the picker. If neither, it should not be the hero.

**D.1.2 🔴 First-time visitors cannot see that there are four games.**
On a fresh profile the home screen shows only the title, tagline, "Spielen", "Name ändern"
and "Einstellungen". The picker is gated behind `{player && …}`. The README's own screenshot
shows the four cards — a teacher or parent evaluating the app for the first time sees none of
them. The tagline claims "Vier Mathe-Spiele" while displaying zero.
**Fix:** render the picker unconditionally; create the profile lazily on first game entry.

**D.1.3 🟠 The game title is clipped on a 1280 px desktop.**
Measured on the arcade play screen:

| Element | Rendered width | Needed width | Result |
|---|---|---|---|
| `.game-bar__title` | **61 px** | 155 px | clipped to **"🛸 M…"** |
| `.game-bar` (whole header) | 620 px | — | inside a 1280 px page |

The header is constrained to 620 px while ~330 px of empty space sits on each side, and the
one element that tells you which game you are in is the element that gets sacrificed. The
label is present for screen readers, so this is visual only — but it is visible on a
standard laptop.

**Root cause — two rules combining:**

| Where | Rule | Effect |
|---|---|---|
| [`motion.css:123-127`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/styles/motion.css#L123-L127) | `.game-bar { max-width: 620px }` inside `@media (min-width: 720px)` | Caps the bar at 620 px no matter how wide the viewport is |
| [`chrome.css:76-77`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/styles/chrome.css#L76-L77) | `.game-bar__title { flex: 1 1 auto; min-width: 0 }` | Title is allowed to shrink to zero |
| [`chrome.css:85-87`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/styles/chrome.css#L85-L87) | `.game-bar > .btn, .game-bar__actions { flex: 0 0 auto }` | Buttons **never** shrink |

The title is the only shrinkable item in the row, so it absorbs 100 % of the overflow. Raise
the `max-width` at a desktop breakpoint, or give the title a `min-width` floor.

**D.1.4 🟠 The answer control jumps ~60 px down mid-question in Number Sense.**
The glance shows the dot pattern, then hides it and inserts the **"👁 Nochmal ansehen"**
button *above* the slider panel. Captured at the same 360×740 viewport: during the glance the
slider sits at y ≈ 505 with the −/+ row at y ≈ 594; after it expires they are at y ≈ 565 and
y ≈ 654. The child watches the pattern, then reaches for a control that has just moved.
**Fix:** reserve the button's space from the start (render it disabled/invisible but
occupying layout).

**D.1.5 🟡 Swiss orthography is inconsistent.** For a Swiss-targeted app this is a
credibility detail. Six strings use `ß`, which Swiss Standard German does not use, while the
rest of the app correctly uses `ss` (`heisst`, `grösser`, `gross`):

| File | Line | String |
|---|---|---|
| `timesTable/strategies.ts` | 41 | `Mal 2 heißt: die Zahl verdoppeln.` |
| `timesTable/strategies.ts` | 53 | `Mal 4 heißt: zweimal verdoppeln.` |
| `timesTable/strategies.ts` | 77 | `Mal 8 heißt: dreimal verdoppeln.` |
| `timesTable/strategies.ts` | 126 | `Große Quadrate bauen` |
| `timesTable/strategies.ts` | 127 | `Bei großen Quadraten hilft die Formel n².` |
| `i18n/de.ts` | 226 | `Die großen Reihen 13 bis 19` |

**D.1.6 🟡 Desktop layout wastes 50–60 % of the viewport.** At 1280×900 the home screen's
content stops around y ≈ 480 and the arcade front door around y ≈ 410; the rest is empty
background. Everything is locked to a narrow mobile column. Mobile-first is right; mobile-only
is not. Classrooms and homes use laptops.

**Root cause:** [`layout.css:16-19`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/styles/layout.css#L16-L19) — `.shell { max-width: 600px; margin: 0 auto }` with **no
desktop breakpoint anywhere in the stylesheet**. A single `@media (min-width: 1024px)` block
raising `--shell-max` (and letting `.game-picker__cards` run 3-up) fixes the whole app at once.

**D.1.7 🟡 The most legible button in the mobile header is "Beenden" (Quit).** At 360 px the
header collapses to icon-only buttons (🛸 🚀 ❓ 💡) plus one fully-labelled text button —
**Beenden**. The clearest affordance during a lesson is the one that abandons it. The
mechanism is [`arcade.css:30-44`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/styles/arcade.css#L30-L44): `.game-bar__hide-sm` visually hides every label below 560 px
(correctly keeping it in the accessibility tree). Every other control wraps its label in that
span — back arrow [`TopBar.tsx:25`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/components/TopBar.tsx#L25), title [`:338`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/GamePage.tsx#L338), player [`:342`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/GamePage.tsx#L342), ❓ [`:345`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/GamePage.tsx#L345), 💡 [`:354`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/GamePage.tsx#L354) — but
[`GamePage.tsx:363`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/GamePage.tsx#L363) renders `{t.game.quit}` **bare**, so it alone keeps its text. Also, two
undifferentiated help icons (❓ "how to play" vs 💡 "help with this question") sit side by
side with no text at that width.

**D.1.8 🟡 Cryptic mission chip.** The arcade front door summarises the mission as
**`➕ Plus · 🌱 Neuling · bis 10 · ∞ 25`**. "∞ 25" has to be decoded as "no timer, 25
questions". Emitted at [`ArcadePage.tsx:57`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/ArcadePage.tsx#L57).
**Note for whoever fixes it:** [`ArcadePage.test.tsx:25`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/ArcadePage.test.tsx#L25) asserts `/∞ 25/` and must be updated in
the same change, or the fix will fail CI.

**D.1.9 🟢 Number Sense slider defaults to 0, and the commit button reads "Landen auf 0".**
Zero is never the answer to "Wie viele?" in a subitizing task, so the default is a guaranteed
wrong answer that a child can nonetheless submit with one tap. Consider starting mid-range,
or disabling the commit button until the slider is moved.

### D.2 What is genuinely good — keep it

Verified by measurement, not assumed:

- **Contrast:** every text node checked against its computed background passed WCAG AA
  (4.5:1 body / 3:1 large). **Zero failures.**
- **Touch targets:** every button, link and input measured — **zero** below 44 × 44 px.
- **Console:** clean, no errors or warnings across navigation and play.
- **Mobile layout:** the 360 × 740 arcade view is well-proportioned, the 2×2 tile grid is
  large and thumb-friendly, and nothing overflows.
- **The slider is not drag-only.** NN/g's finding that dragging is hard under 9 is real, but
  the beam ships `−` / `+` buttons *and* arrow-key support *and* a native `<input type=range>`
  (verified: `min=0 max=5 step=1`, 310 × 40 px, `aria-label="Alien auf dem Balken bewegen"`).
  That is the correct mitigation and it should be stated in the README as a deliberate choice.
- **Miss feedback** is the app's best screen: names the misconception, shows the working,
  highlights both the chosen and the correct tile, and waits for "Verstanden".
- **Visible difficulty:** the "Stufe 1" chip and the rank ladder give the learner agency that
  DreamBox is criticised for hiding.

---

## PART E — Comparable products, and the real blind spots

### E.1 What to borrow

| Product | Cost / DE | The one idea worth taking |
|---|---|---|
| **ST Math (JiJi)**, MIND Research | Paid, US, no German | **Explore before you are questioned.** Visual puzzles with no words and no timer; the child manipulates first and meets symbols later. Wrong answers are shown as *animated consequences*, not verdicts. Directly applicable to Number Sense. |
| **Blitzrechnen** (Klett, ships with *Schweizer Zahlenbuch*) | Paid, Swiss, LP21-aligned | **A teacher view with restraint** — meinklett.ch shows only milestone results, not every attempt. Closest direct competitor in Swiss classrooms; worth knowing well. |
| **Anton.app** | Free tier, DACH, very widely used | **Let the adult switch the rewards off.** Its school licence can disable the reward system entirely, acknowledging that extrinsic motivators help some children and derail others. |
| **Math Learning Center apps** (Number Rack, Number Frames, Number Pieces) | **Free, open** | **Manipulatives with no question attached.** The same bead rack and ten-frame the app already renders, offered as a toy. Very low effort to add given the components exist. |
| **NRICH** (Cambridge) | Free | **Low floor, high ceiling.** One task that a 6-year-old and a 12-year-old can both work on, at different depths — the antidote to the "6–12 is too wide" problem in C.2.1. |
| **DreamBox** | Paid | Rated **ESSA Level III (Promising)** and WWC "potentially positive" (+4 percentile, small extent). Note how *modest* the effect sizes are on a well-funded adaptive engine — a useful calibration against over-claiming. |
| **Prodigy Math** | Freemium | **A cautionary tale, not a model.** Subject of a 2021 FTC complaint by Fairplay for Kids documenting 16 membership ads against 4 maths problems in 19 minutes. Number Galaxy's no-monetisation stance is a real differentiator and should be said out loud. |

### E.2 Blind spots — corrected against the actual code

An external survey flagged 12 gaps. **Four of those are wrong** — the app already does them,
and it should get credit rather than a work item:

| Alleged gap | Reality |
|---|---|
| ~~No error analysis~~ | **False.** Misconception-named feedback + worked route + "Wie hast du das gemacht?" strategy self-report. Better than most competitors. |
| ~~No accessibility work~~ | **False.** WCAG 2.1 AA axe-audited on two viewports with the suite failing on one violation; verified clean on contrast and target size. |
| ~~No transparent difficulty~~ | **False.** Rank ladder and station tiers are learner-visible. |
| ~~No teacher-facing output~~ | **Partly false.** Settings → Progress is written for adults and can be printed or exported. |

**The genuine gaps, ranked by value for this app:**

1. **No sandbox / free play.** Every representation is inside a question. The ten-frame, bead
   rack and number line already exist as components — exposing them as toys is cheap and is
   the single biggest pedagogical addition available.
2. **No estimation.** The number line supports "close enough" scoring already, but there is no
   activity whose *goal* is approximation. This is core number sense.
   **Correction, found while implementing:** the claim that LP21 names it in `MA.1.A.2.g`
   ("überschlagen") and `MA.3.A.2` ("schätzen") does not survive reading them. *überschlagen*
   is only ever about estimating **calculations** and *schätzen* only ever about **Grössen** —
   lengths, weights, money, time. No competency covers estimating how many objects are in
   front of you. The station was still worth building, but on the research rather than on the
   curriculum, and it claims no code.
3. **Nothing beyond `MA.1`.** No geometry, measurement, or data — see B.2. Not necessarily a
   defect, but currently undeclared.
4. **No cross-day loop.** Given C.2.2, the absence of any reason to return tomorrow limits
   effectiveness more than anything on-screen. The Daily Mission exists in Times Tables but is
   invisible from the home screen.
5. **No multi-step problems.** Chain questions (`(7+5)−3`) are two-step arithmetic, not
   multi-step reasoning.
6. **No printable material.** The progress *report* prints; there are no dot cards or
   ten-frames to print. Low effort, genuinely useful in a Swiss classroom.
7. **No dyscalculia-specific affordances** beyond generic WCAG — no text-to-speech, no
   dyslexia-friendly font option. Anton and Blitzrechnen both advertise Dyskalkulie support;
   this is a competitive gap in the DACH market.
8. **No two-player / partner mode.**

### E.3 One mechanic to keep rejecting: the daily-login streak

The README already refuses this, and the refusal is correct — but **recommendation 4.3 below
asks for a cross-day return loop, and the two must not be confused.** Anyone implementing 4.3
will be tempted to reach for a streak counter, because that is the industry default. Do not.

**Why the current position is right:**

- A daily streak works by manufacturing **loss aversion** — the value is not in the reward but
  in the dread of breaking a number. That is an extrinsic, controlling contingency, and SDT
  predicts exactly this class of reward undermines intrinsic motivation. The gamification
  meta-analytic picture backs it: relatedness g = 1.776 and autonomy g = 0.638, but
  **competence only g = 0.277** (Landers et al., 2024). Streaks buy compliance, not competence
  — and competence is the whole point of a maths trainer.
- The effect is **weakest precisely in this age band**: gamification g = 0.309 in primary
  versus g = 1.015 in secondary (Al-Malki, 2025). A 6-year-old absorbs the anxiety of a broken
  streak without the self-regulation to contextualise it.
- It punishes the wrong child. A streak penalises illness, holidays, a chaotic household, or
  a shared device — none of which are the learner's doing. The app is explicitly built for
  several children sharing one device.
- It contradicts the app's own best instinct. The README's line — *"A wrong answer never ends
  a run"* — exists so that a bad day yields *more* practice, not less. A streak reverses that:
  a missed day yields a visible punishment.

**The distinction to hold on to.** The combo multiplier is fine because it lives **inside one
mission and resets every run** — nothing accumulates across days, so there is nothing to
dread losing. The Daily Mission is fine for the same reason: it is a **statement about the
material** ("these facts are due today"), not a statement about the child's attendance record.

**Therefore 4.3 must surface *what is due*, never *how many days in a row*.** Concretely:

| Acceptable | Not acceptable |
|---|---|
| "7 Aufgaben sind heute dran" | "🔥 5 Tage in Folge!" |
| A badge on the Times Tables card when facts are due | A counter that resets to zero on a missed day |
| Nothing shown at all when nothing is due | Anything that makes *not playing* visible |

If nothing is due, show nothing. Silence is the feature.

---

## PART F — The plan

Ordered so that nothing shipped later invalidates something shipped earlier. Phase 1 is
non-negotiable before any further promotion of the README's research claims.

### Phase 1 — Stop asserting things that are not true (do first)

| # | Task | File | Done when |
|---|---|---|---|
| 1.1 | Delete `Chen et al. 2024, Labour Economics` and `Ebner et al. 2025, Remedial and Special Education` from Sources; delete any claim resting solely on them | `README.md` ~L489 | Neither string appears in the repo |
| 1.2 | Resolve `Carmosino 2024`, `Frykholm 2010`, `Lau et al. 2018` — confirm the intended paper or remove the entry. **Do not substitute an unread near-match** | `README.md` ~L488–491 | Each is either a verified full citation with DOI, or gone |
| 1.3 | Rewrite the countdown rationale. Drop "Framing, not the clock, is the documented anxiety vector". Replace with the mixed-evidence framing in A.3, citing Maki et al. 2024 for what it actually studied | `README.md` ~L459 | Claim matches the cited paper |
| 1.4 | Change `80 %` → `85 %` and cite Wilson et al. 2019, *Nature Communications*, `10.1038/s41467-019-12874-3`; note it is an engineering target, not a finding about children | `README.md` ~L222 | Figure and citation agree |
| 1.5 | Remove `Baroody et al. 2025` and `Kuo et al. 2026` until they can be verified as published | `README.md` ~L486, L491 | Only verifiable sources remain |
| 1.6 | Convert the flat Sources list into a table with **year, journal, DOI/URL** per entry, and attach each to the specific claim it supports | `README.md` §Sources | A reader can check any claim in one click |
| 1.7 | Soften the Leitner claim: spacing is evidenced (Murray et al. 2025, g ≈ 0.24–0.28); the specific box schedule is not validated in children | `README.md` §How it adapts | No unearned certainty |

### Phase 2 — Fix the four UI defects (small, high value)

| # | Task | File | Done when |
|---|---|---|---|
| 2.1 | Make "Weiterspielen" navigate to the last-played game (persist `last-game` in the profile namespace); if none, focus the picker | [`HomePage.tsx`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/HomePage.tsx#L38-L41) | Clicking it changes the URL; covered by a test |
| 2.2 | Render the game picker unconditionally; create the profile lazily on first game entry | [`HomePage.tsx`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/HomePage.tsx#L117-L144) | A fresh browser shows four cards |
| 2.3 | Stop clipping the game title: raise `.game-bar { max-width }` at a desktop breakpoint **and** give `.game-bar__title` a `min-width` floor so it is no longer the only shrinkable item | [`motion.css:123-127`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/styles/motion.css#L123-L127), [`chrome.css:76-87`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/styles/chrome.css#L76-L87) | Title renders in full at 1280 px; still ellipsised at 360 px |
| 2.4 | Reserve layout space for "Nochmal ansehen" so the slider does not shift when the glance ends | [`SenseDrillPage.tsx`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/SenseDrillPage.tsx) | Slider y-offset identical before and after |
| 2.5 | Replace the six `ß` strings with `ss` forms (see D.1.5) and add a lint rule or test asserting no `ß` in `de` strings | [`strategies.ts`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/timesTable/strategies.ts), [`i18n/de.ts`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/i18n/de.ts#L226) | `grep -r "ß" web/src` returns nothing; test guards it |
| 2.6 | Expand "∞ 25" to readable text ("Ohne Zeitdruck · 25 Aufgaben") — **and update the test that asserts the old string** | [`ArcadePage.tsx:57`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/ArcadePage.tsx#L57) + [`ArcadePage.test.tsx:25`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/pages/ArcadePage.test.tsx#L25) | No symbol-only summary; suite green |
| 2.7 | De-emphasise "Beenden" in the mobile header (give it a `game-bar__hide-sm` span like its siblings, or demote it visually); give ❓ and 💡 distinct labels or merge them | [`arcade.css:30-44`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/styles/arcade.css#L30-L44), [`TopBar.tsx`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/components/TopBar.tsx) | Quit is not the most prominent control at 360 px |
| 2.8 | Add the app's first desktop breakpoint: `@media (min-width: 1024px)` raising `.shell` beyond 600 px and running the game picker 3-up | [`layout.css:16-19`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/styles/layout.css#L16-L19) | No 50 % dead space at 1280×900 |

### Phase 3 — Curriculum and pedagogy substance

| # | Task | File | Done when |
|---|---|---|---|
| 3.1 | Replace the one-paragraph curriculum section with the **four mapping tables** from B.2, verbatim German, each row carrying code + Zyklus | `README.md` §Curriculum | A teacher can find any station's code |
| 3.2 | Quote `MA.1.A.2.b` in full, not the "Anzahlen bis 5" fragment | `README.md` ~L474 | Full descriptor present |
| 3.3 | Move word problems from `MA.1.C.1` to `MA.1.C.2.d` (the code that actually says "Rechengeschichten") | `README.md` ~L475 | Attribution correct |
| 3.4 | Quote the `Automatisieren` sentence in full, cited to **Didaktische Hinweise → Automatisieren** | `README.md` ~L479 | Concession clause restored |
| 3.5 | Add the **"what this does not cover"** table (MA.2, MA.3) | `README.md` §Curriculum | Boundary stated |
| 3.6 | Make the Rookie-rank worked solution a real route (e.g. `7 + 3` explained as "mach zehn"), or correct the README to admit the fallback | [`working.ts`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/game/working.ts#L215-L221) | Claim and behaviour agree |
| 3.7 | Rewrite the `offByOne` miss reason away from "zähl noch einmal nach" toward a make-ten strategy | [`i18n/de.ts`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/i18n/de.ts#L87) + 3 languages | No miss message instructs counting for small sums |
| 3.8 | Add a short **session-length note** for teachers: 25 questions ≈ one sitting, but the evidence favours short repeated sessions (cite Sun et al. 2024; Codding et al. 2025; Duhon et al. 2020) | `README.md` §For teachers | Guidance is dosage-aware |

### Phase 4 — The gaps worth closing

| # | Task | Effort | Why |
|---|---|---|---|
| 4.1 | **Free-play sandbox** for ten-frame, bead rack and number line — no question, no scoring, no timer | M — components exist | Biggest pedagogical gain available; ST Math / MLC model |
| 4.2 | **Estimation station** in Number Sense ("nearer 40 or 50?", "about how many?") with banded scoring | M | Closes a real LP21 gap (`MA.1.A.2.g`, `MA.3.A.2`) |
| 4.3 | **Surface the Daily Mission on the home screen** when facts are due — **read E.3 first: show what is due, never a day counter** | S | Creates the cross-day loop the evidence says matters more than any single run, without importing loss aversion |
| 4.4 | **Rookie shell**: fewer HUD zones (hide score and combo below Cadet), larger type | S | Addresses C.2.3 cognitive load and C.2.1 age spread |
| 4.5 | **Printable pack** — dot cards, ten-frames, number lines as PDF/print CSS | S | Requested by Swiss classroom practice; Blitzrechnen parity |
| 4.6 | **Adult toggle to hide points/combo entirely** | S | Anton's best idea; SDT-consistent, and competence is the dimension gamification does *not* deliver |
| 4.7 | Optional **text-to-speech** for prompts and dyslexia-friendly font option | M | Closes the DACH accessibility gap vs Anton/Blitzrechnen |

### Phase 5 — Verification gates

- [ ] `npm run lint && npm run typecheck && npm run test && npm run test:e2e` all green
- [ ] axe audit still clean on both viewports after every layout change in Phase 2
- [ ] A test asserts "Weiterspielen" changes the route (guards 2.1 against regression)
- [ ] A test asserts no `ß` in German strings (guards 2.5)
- [ ] Every LP21 code in the README is re-checked against zh.lehrplan.ch before release
- [ ] Every remaining citation resolves to a working DOI or URL
- [ ] **No day-counter / login-streak mechanic was introduced while implementing 4.3** (see E.3)

---

## Appendix — Evidence used in Part C

Only sources actually located and checked are listed. Where a finding comes from adults or
undergraduates rather than children, it is marked — that overgeneralisation is the single
commonest error in this literature.

| Theme | Source | Key number | Population |
|---|---|---|---|
| Early numeracy predicts later maths | Liu et al., 2022, meta-analysis, 54 studies | r = .49 overall; .44 numbering | K–12, N > 58,000 |
| Dot enumeration predicts achievement | Liu et al., 2019, *BJEP* | Level and growth both predictive | K → Grade 4 |
| Interleaving | Rohrer et al., 2020, cluster RCT | 61 % vs 38 %, **d = 0.83** | Grade 7, 54 classes |
| Interleaving, younger | Nemeth et al., 2019 | Higher adaptive strategy use | Grade 3, N=236 |
| Spacing in maths | Murray et al., 2025, meta-analysis | g = 0.282 / 0.24; testing effect **not** robust | K–12 |
| Distributed vs massed dosage | Codding et al., 2025, RCT | g = 0.15–0.36 for 2–3 short sessions | Grades 1–2 |
| Session length | Sun et al., 2024, A/B/C | 5–7 min > 9 min | Pre-primary, N=94,813 |
| Minimum dose | Duhon et al., 2020 | ~40 cumulative minutes | Grade 4, N=105 |
| Elaborated feedback | Gal & Hershkovitz, 2023 | latency d = 0.11–0.44; better re-attempt | N > 26,000, mixed age |
| Verification cues harm persistence | Merrick & Fyfe, 2024, *JECP* | Reduced strategy variability, worse for low prior knowledge | M age 7.61, N=130 |
| Constructed vs multiple choice | Gurung et al., 2024 | Fill-in better, **only** for higher prior knowledge | Grades 6–8, N=6,768 |
| MC overestimates inverse skill | Sangwin & Jones, 2017 | 75.7 % MC vs 64.7 % CR | **Undergraduates** |
| Timed testing and anxiety | Orbach et al.; Caviola et al. | Anxiety mediates ~⅓ of gender gap | Grades 3–5; N=146,227 |
| Visible timer reduces anxiety | Hallez & Vallier, 2025 | Less anticipatory anxiety, no accuracy change | Ages 7–9, N=44 |
| Timing × complexity | Maki et al., 2024, *JSP* 106 | Anxious/low achievers did **better** when overtly timed | Grades 4–5 |
| Gamification overall | Al-Malki 2025; Sofroniou et al. 2025 | g ≈ 0.65; **primary g = 0.309 vs secondary 1.015** | K–12 |
| Gamification and SDT | Landers et al., 2024 | Relatedness 1.776, autonomy 0.638, **competence 0.277** | Mixed age |
| Visual aids can raise load | Skau et al., 2026, fNIRS | 35 % vs 21 % errors with visual aids | N=81, age 9 |
| Optimal error rate | Wilson et al., 2019, *Nat Commun* | **85 %**, not 80 % | Model / not children |
| Children's UX | NN/g (touch targets, cognition, physical development) | ≥ 1 cm targets; 3 age bands; dragging hard < 9 | Ages 3–12 |

> Every entry in this appendix must be re-verified against its DOI before any of it is copied
> into the README. The whole point of Part A is that a plausible-looking citation is not a
> citation.

**Curriculum source:** D-EDK / Kanton Zürich, *Lehrplan 21 — Fachbereichslehrplan Mathematik*,
version 13.03.2017; competency text cross-checked at <https://zh.lehrplan.ch>.

---

## Implementation record

Implemented August 2026. Gates at the end of the work: **lint clean · typecheck clean ·
641 unit tests · 219 e2e (axe included) · build green**, and every UI change confirmed by
using the app rather than by reading the diff.

**Responsive sweep.** Home, Settings, Number Beam, Times Tables and Number Sense were checked
at **360 / 768 / 1024 / 1280 px**: no horizontal overflow and no touch target under 44 × 44 px
anywhere. The only elements reporting clipped text are `game-bar__hide-sm` spans
(`clip-path: inset(50%)`, width 1px — the deliberate visually-hidden-but-screen-readable
pattern) and one `aria-hidden` decorative emoji, both pre-existing and by design.

**Curriculum accuracy.** All **29 German descriptors now in the README** were machine-checked
against the Kanton Zürich *Fachbereichslehrplan Mathematik* (13.03.2017): **29/29 verbatim,
zero mismatches.**

### Shipped

| Ref | Change | Evidence it works |
|---|---|---|
| 1.1 | Removed `Chen et al. 2024` and `Ebner et al. 2025` | Neither string remains in the repo |
| 1.2 | Removed `Carmosino 2024`, `Frykholm 2010`, `Lau et al. 2018` rather than substituting the unread near-matches | Sources list contains only verified entries |
| 1.3 | Countdown rationale rewritten; new **Why the clock is off** section presents the evidence as genuinely mixed and cites Maki et al. 2024 for what it actually studied | README §Why the clock is off |
| 1.4 | `80 %` → the **70–90 % band the code actually implements**, bracketing Wilson et al. 2019's 85 %, cited with DOI and flagged as model-derived | Matches `EASE_BELOW`/`PUSH_ABOVE` in [`tuning.ts`](file:///home/patbaumgartner/Repositories/math-invaders/web/src/game/tuning.ts#L28-L29) |
| 1.5 | Removed unpublished `Baroody et al. 2025` and `Kuo et al. 2026` | — |
| 1.6 | Sources rebuilt as a table: every row is *claim → source → DOI/URL* | README §Sources |
| 1.7 | Leitner claim softened to what the evidence supports (spacing, not the box schedule) | README §Choices |
| 2.1 | **"Weiterspielen" now resumes the last-played game** and names it on the button; new per-profile `last-game` store, validated on read | Live: `/` → `/number-sense`; unit + e2e regression tests |
| 2.2 | **Game picker always visible**; the profile is created on the way *into* a game | Live on cleared `localStorage`: four cards + Surprise |
| 2.3 | Game title no longer clipped | Measured **293px rendered / 293px needed, clipped: false** (was 61/155) |
| 2.4 | Number Sense answer control no longer jumps when the glance ends | Measured **shift 0px** (was ~60px) |
| 2.5 | Six `ß` strings → Swiss `ss`, guarded by a test | `grep -r "ß" web/src` returns nothing |
| 2.6 | `∞ 25` → `∞ Ohne Zeitdruck` + `25 Aufgaben`, in all four languages | Test updated in the same change |
| 2.7 | Quit given an icon so it is no longer the only labelled button on mobile; **📖 (rules) vs 💡 (hint)** now visually distinct everywhere | Mobile header is icon-only; labels still in the a11y tree |
| 2.8 | First desktop breakpoint (`≥1024px`, shell 880px) — the picker runs 3-up | Home fills a 1280×900 viewport |
| 3.1–3.5 | Curriculum section replaced with **four verbatim LP21 mapping tables**, a *what this does not cover* table (MA.2/MA.3), the full `MA.1.A.2.b` descriptor, word problems re-attributed to `MA.1.C.2.d`, and the `Automatisieren` sentence quoted in full | README §Curriculum |
| 3.6 | **Rookie additions now get a real route.** New *gegensinniges Verändern* candidate: `7 + 3` explains as `5 + 5 = 10` instead of restating the answer | Live: `4 + 5` → `4 + 4 = 8 → 8 + 1 = 9`; regression tests added |
| 3.7 | `offByOne` miss message no longer tells the child to count — in all four languages | Live in the miss panel |
| 4.3 | Due-facts badge on the Times Tables card | Live: *"2 Aufgaben sind heute dran"* — a count of facts, **no day counter** |
| 4.6 | **Adult toggle to hide points and combo** during play; the summary still reports them | Live: HUD reduces to the question counter; setting persists |

### Deliberately softened

**4.4 — "Rookie shell: hide score and combo below Cadet".** Implemented as an *adult setting*
(4.6) rather than a forced rank override. Forcing it would silently change the default
experience for everyone who never leaves Rookie, contradict the combo mechanic the README
documents, and override a user's explicit choice. The Settings hint now recommends turning it
off for younger children instead. The cognitive-load concern in C.2.3 is addressed; the
agency is left with the adult.

### One regression caught and fixed during QA

Widening the desktop column, I also grew the answer tiles to `min-height: 148px`. On a 900px
viewport that pushed the stage past the fold, so once a miss expanded the equation the HUD
scrolled up **underneath the transparent game bar**. Caught by using the app, not by the test
suite. The tile bump was reverted — it was a nice-to-have, not part of the defect — and the
absence of overlap is now measured (`barBottom 65 / hudTop 66`).

### Phase 4, shipped in a second pass

| Ref | Change | Evidence it works |
|---|---|---|
| 4.1 | **🧩 Explore numbers** — the only screen that asks nothing. One number shown as a die-face pattern, a ten-frame, a bead rack and a place on the line at once, moved by −/+ 1/5/10. Ungated, unscored, untimed. Serves `MA.1.C.2.a` | Used live at 360px; 4 unit tests, 1 e2e, WCAG audited |
| 4.2 | **🍇 Roughly** — far too many dots to take in at a glance, answered inside a band of a fifth either way | Played live: 19 dots, `≈ ?`, beam 0–20; tolerance tests added |
| 4.5 | **🖨 To print** — dot cards 3–9, empty ten-frames, empty number lines, each on its own page, outline on white | Verified under `emulateMedia('print')`: chrome hidden, sheets render |
| 4.7 | **🔤 Easier reading** (spacing, not a font file) and **🔊 Read aloud** for word problems | Live: Verdana + 0.8px tracking + 1.7 leading, **survives navigation**; speaks in `de-CH` at rate 0.85 |

### Two places where checking changed the plan

**Estimation claims no curriculum code.** The plan asserted it would close `MA.1.A.2.g` and
`MA.3.A.2`. Reading them showed *überschlagen* is only about estimating calculations and
*schätzen* only about Grössen. Nothing in LP21 covers estimating a quantity of objects, so
the README says that plainly instead of stretching a code to fit — which is the whole
argument of Part A applied to my own work.

**4.4 became a setting rather than a rank rule** — see above.

### Three defects found by using the features, not by testing them

- `patternFor(0)` returns `undefined` and crashed Explore at zero. The drills never ask for
  none, so nothing had caught it.
- The dot grid was three rows tall because no drill asks for more than twelve; Explore goes
  to twenty and silently cut the fourth row off.
- The number line drew its start marker at zero, printing a second `0` on top of the one
  already at the end of the rail.

All three lived in code shared with the drills, and none could surface there.

### Phase 6 — Two players, one device

| Ref | Change | Evidence it works |
|---|---|---|
| 6.1 | **👥 Two players** — 16 questions, eight each, alternating strictly by questions answered, reached from the Math Invaders screen | `duel.ts` is a pure state machine with its own unit tests; an e2e test plays a full round |
| 6.2 | **A handover screen before every question**, the first included — without the pause the quicker child answers both turns | The e2e round asserts eight handovers naming each child; played live at 360 and 1280 |
| 6.3 | **🤝 Together is the default; ⚔️ Head to head is opt-in.** A draw reports nobody winning rather than a tie | `duelWinner` returns `null` both for `together` and for equal scores |
| 6.4 | **The round records nothing at all** | The e2e test snapshots `localStorage` before and after and asserts it is byte-identical |

**Head to head had to stop sharing the combo.** The multiplier climbs with a run of right
answers, so a shared streak handed whoever went first a different rung of the ladder from
whoever went second — two children answering *everything* correctly finished 250 to 230
purely on turn order. Each child now scores on their own streak. Together keeps the shared
combo deliberately: building one streak between them is the collaboration.

**Why it records nothing.** Every adaptive signal in this app describes one child — the
review schedule, the weak-fact weighting, the working ceiling inside a rank. Two children
answering into one profile would describe a composite child who does not exist, and the next
solo session would be tuned for that invented person. The two names are typed on the setup
screen rather than taken from the device's profiles for the same reason: a visiting cousin
should not inherit somebody else's rank, nor leave anything behind in it.

### The migrations came out

`adoptLegacyProfile`, `purgeRetiredStorage`, `fromLegacy` and `loadLegacyScores` are gone,
along with the Hall of Fame's read-only "Earlier" section — and with them `listKeys`,
`moveKey`, `storageName` and `SHARED_KEYS`, which nothing else used.

This falsified two README claims: that pre-2.0 scores are kept under "Earlier", and that an
install from before profiles existed is adopted by the first child automatically. Neither
was true any more. Both have been removed, which is Part A's argument applied once again to
this document's own output.

### Four more defects found by using it, not by testing it

The Phase 4 pattern held. None of these were caught by 683 unit tests, 235 e2e tests or a
WCAG audit on two viewports — every one needed somebody to look at the screen.

- **The game title was clipped to "🛸 Math Inva…" from 561px to 1023px.** The action labels
  appeared at 561px, but the bar stayed capped at 620px until 1024px, so across a 463px-wide
  band the title — the only item allowed to shrink — absorbed the entire squeeze. Every
  landscape phone and small tablet sat inside it, and an earlier fix at `min-width: 1024px`
  had left the band open. The labels now wait until the bar is wide enough to carry them.
- **The 🚀 is pinned to the bottom of the stage, which on a sideways phone is exactly where
  the answer tiles are.** It now stands down below 500px of height.
- **The handover read `🚀Du bist dran`.** JSX drops the newline between the avatar span and
  the name, so they rendered touching.
- **The two-player e2e test was flaky under load.** It branched on `count()`, which reads
  whatever the DOM holds at that instant rather than waiting for it; when the re-render had
  not landed the loop skipped the handover, then spent its whole 60-second timeout waiting
  for an answer tile that the handover had already replaced. Each step now waits for the
  screen it is about to act on — which also made the round assert that the handover gates
  every one of its sixteen questions.

### Phase 7 — what a second pass over the same screens turned up

| Ref | Change | Evidence it works |
|---|---|---|
| 7.1 | Every source file back under the 250-line ceiling: `GamePage` 436 → 201 behind a `useMissionRun` hook, `SettingsPage` 376 → 227, `HomePage` 297 → 174, `questions.ts` 255 → 110, `strategies.ts` 278 → 90 beside its card data | 708 unit and 235 e2e tests unchanged either side of the move |
| 7.2 | One drill summary for the beam and the sense stations, on the `.summary` shell the arcade already used | The sense summary had declared `role="dialog" aria-modal` and managed no focus at all; a test now asserts focus lands inside |
| 7.3 | Two-player feedback says what happened — "Richtig!", "Daneben! Richtig wäre 10" — and stops asking a child to confirm a right answer | Was colour-only, so a screen reader got nothing; `playWrong` had never been wired up either |
| 7.4 | Head to head decided on right answers rather than hidden points | Five in a row used to beat six with a miss in the middle, 80 to 60, while the screen showed 5 against 6 |
| 7.5 | No child addressed as a boy: the rank ladders, the French and Italian handover buttons, and Italian's "Bambino 1" | A test refuses the masculine generic and names the key; proved by putting `Pilot` back |

### The tests that could not have caught these

Three of the five were invisible to a green suite, and each for its own reason.

**Head to head.** Every existing test handed one player all sixteen questions, so points and
right answers always agreed and the two rules were indistinguishable. The new test sets
them against each other on purpose.

**The strategy self-report.** Whether a right answer is asked "how did you do that?" is a
12 % coin flip, and the suite pinned the coin away with a note saying "unless a test wants
it". None ever did, so a shipped feature had no coverage and its handlers were covered only
when the flip happened to land that way elsewhere — which is what left the function-coverage
gate one function from its threshold, failing at random.

**Playwright was reusing a four-hour-stale preview server.** `reuseExistingServer` meant a
build from before the refactor kept serving, so several runs reported green against code
that no longer existed. It surfaced only because a failure snapshot showed markup from a
component that had been deleted. Worth knowing the next time a suite looks too calm.

