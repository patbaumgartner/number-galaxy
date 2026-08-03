# 🌌 Number Galaxy

[![Deploy to GitHub Pages](https://github.com/patbaumgartner/math-invaders/actions/workflows/deploy.yml/badge.svg)](https://github.com/patbaumgartner/math-invaders/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

> Four free maths games for children, in one page — from seeing how many dots are on a die
> to knowing 7 × 8 by heart. No account, no ads, no tracking, and it keeps working when the
> wifi does not.

**[🎮 Play now](https://patbaumgartner.github.io/math-invaders)** ·
**[👩‍🏫 For teachers](#-for-teachers-and-parents)** ·
**[🧭 Why it is built this way](#-why-it-is-built-this-way)** ·
**[👀 Number Sense](#-number-sense--seeing-how-many)** ·
**[📏 Number Beam](#-number-beam--doubling-halving-and-bar-models)** ·
**[🛸 The arcade](#-math-invaders--the-arcade-game)** ·
**[✖️ Times tables](#️-times-tables--the-multiplication-trainer)** ·
**[🛠 Development](docs/DEVELOPMENT.md)**

![The home page, with the four games and the Surprise card](./docs/math-invaders-home.png)

---

## 👩‍🏫 For teachers and parents

### What each game practises

| Game | Maths it covers | Roughly |
|------|-----------------|---------|
| 👀 **Number Sense** | Seeing quantities without counting them: dot patterns, ten-frames, a bead rack, placing numbers on a line, counting on, and dot arrays | ages 4–7 |
| 📏 **Number Beam** | Doubling, halving, quarters, fractions of an amount, ×10 ÷10, number bonds and partitioning — all drawn as bar models | ages 5–9 |
| 🛸 **Math Invaders** | Addition, subtraction, multiplication, division and remainders — in five different question shapes, with numbers from ≤ 10 up to ≤ 1000 | ages 6–11 |
| ✖️ **Times Tables** | Recall of the tables: 1–12, squares to 25², the 15/20/25 shortcuts, and 13–19 | ages 7–11 |

The ages are an indication, not a gate, and no curriculum is assumed. Each game sets its
own difficulty from what the child has already done, so two children of different ages
can share a device without either being handed the other's numbers.

### What a session looks like

A child presses Play, picks one of four games, and is answering a question within a couple
of taps — there is no menu to learn and no account to make. Each game opens on its own
screen: a map of stations or planets, or for Math Invaders the mission it is about to
serve, with its best scores beside it. A run is short and finite by design: **25 questions** in
the arcade, **10** in a beam drill, one planet's worth of facts in the trainer. A wrong
answer never ends a run early, so a hard day means *more* practice, not less.

If you would rather not choose, **🎲 Surprise me** picks for them — see
[below](#-surprise-me).

### How you can see progress

- **⭐ Stars** on every planet and station, and at the end of every arcade mission.
- **A mastery map** in Times Tables that colours each of the 144 facts as unseen,
  learning, due for review, or mastered — the fastest way to see what is actually stuck.
- **Skill badges** in Settings, one per arcade operation, from a rolling 30-answer
  accuracy history.
- **Worked solutions** after every miss, so a wrong answer teaches something.
- **📋 A progress page** — Settings → Progress — written for you rather than for the child.
  It names the mistake that keeps coming up in plain language, lists the sums to look at
  next, and shows accuracy and stars per game — including whether a child is still counting
  an operation out or knows it by heart. It can be **printed** or **saved as a file**.

There is no account and nothing to log into: the progress page reads what is already on the
device, records nothing of its own, and sends nothing anywhere. That is the whole privacy
model.

### What it never does

No account. No advertising. No analytics, telemetry or third-party scripts. Nothing
leaves the device — there is no server to send it to. After the first visit it works
offline. See [Your data](#your-data).

---

## 👀 Number Sense — seeing how many

The other three games all begin by assuming a child can already see a quantity, count on
from a number, and say roughly where a number sits. Those are not safe assumptions — they
are the strongest predictors of later arithmetic, and every one of them is trainable. This
is where a child who is not yet ready for `2 × 7` has somewhere to be.

### Six stations in two zones

| Zone | Stations | What it asks |
|------|----------|--------------|
| 👀 **Sight Bay** | At a glance · Ten-frame · Bead rack | How many — without counting them |
| 📍 **Number Line** | Place it · Count on · Dot array | Where the number goes, and where a jump lands |

**Patterns are shown for a glance, not for a count.** A dot pattern appears for about a
second and then goes. Scattered dots can only be counted one at a time, which trains
counting and little else; a die face or two rows of five can be *seen*, and it is that
seeing which later becomes "7 is 5 and 2". 👁 **Look again** brings it back as often as a
child wants, and the glance can be switched off entirely in Settings.

**Every arrangement is one a child meets elsewhere** — a die face, a ten-frame in two rows
of five, a bead rack grouped in fives, an empty number line with the jump drawn on it, a dot
array read as rows and columns.

**Placing a number allows a near miss.** Landing on 38 when the answer was 37 counts. The
skill being built is a sense of how big a number is, and marking that wrong would be
measuring something else. Everywhere a quantity is exact, it has to be exact.

Answers are given on the same beam Number Beam uses — nothing to eliminate, and a number to
commit to.

---

## 📏 Number Beam — doubling, halving and bar models

The arcade and the trainer ask a child to *produce a number*. This one shows them what a
number is made of.

| The station map | A question on the bar |
|-----------------|-----------------------|
| ![Number Beam stations](./docs/math-invaders-number-beam.png) | ![Number Beam drill](./docs/math-invaders-beam-drill.png) |

### Every question is a bar

The whole sits on top, the parts that make it underneath, and **both rows are measured
against one shared scale** — so a doubled bar really is drawn twice as long. Unknown
parts stay behind a `?` until the answer is given, then fill in with their numbers.

That picture is the Singapore-style bar model, and it is the same one whether the
question is doubling, a quarter, a fraction of an amount or a number bond.

### Every answer is given by moving an alien along the beam

There are no answer tiles in this game at all. The child drags the alien, nudges it with
−/+, or walks it with the arrow keys, and lands it on the answer. Underneath is a native
range slider, so it works with a finger, a mouse, a keyboard and a screen reader alike.

This is deliberately harder than multiple choice: there is nothing to eliminate, and the
child has to place the number on a line. Every beam has between 10 and 70 stops, the
answer always sits exactly on one, and it never sits at a predictable fraction of the
bar.

### What it practises

Nine stations in three zones. A zone opens once two stations in the one before it have a
star:

| Zone | Stations | Examples |
|------|----------|----------|
| 🔁 Doubling Deck | Double · Halve · Near doubles | `2 × 7 = ?` · `14 ÷ 2 = ?` · `7 + 8 = ?` |
| 🧩 Parts Bay | Double twice · Quarters · Fraction of | `4 × 6 = ?` · `20 ÷ 4 = ?` · `¾ × 20 = ?` |
| 🔟 Tens Belt | Ten times · Number bonds · Split | `10 × 7 = ?` · `? + 7 = 10` · `24 = 20 + ?` |

Prompts are written in pure maths notation, so they read identically in all four
languages — the station name carries the concept and the bar carries the meaning.

### Difficulty and progress

Each station has **three tiers, and the tier is simply how many stars the child already
holds** — numbers widen as they improve, so a mastered station never goes stale. Number
ranges are bounded by what a bar can actually show; a bar of 900 units is not a picture
anyone can read.

A drill is ten questions: ⭐ at 70 % accuracy, ⭐⭐ at 90 % once one star is held, and ⭐⭐⭐ for
a clean sweep once two are. Stars never fall.

---

## 🛸 Math Invaders — the arcade game

Aliens hold four possible answers; the child taps the one that is right. One tap, no
aiming, no dexterity requirement.

| Playing a mission | Best scores |
|-------------------|-------------|
| ![Arcade game](./docs/math-invaders-game.png) | ![Hall of Fame](./docs/math-invaders-hall-of-fame.png) |

### What it practises

| Operation | Example | Notes |
|-----------|---------|-------|
| ➕ Addition | `7 + 3 = ?` | |
| ➖ Subtraction | `10 − 4 = ?` | Never goes below zero |
| ✖️ Multiplication | `6 × 7 = ?` | Factors stay inside the ×12 tables |
| ➗ Division | `20 ÷ 4 = ?` | Built from the answer outwards, so always exact |
| 🔢 Division with remainder | `23 ÷ 5 = 4 r3` | Every option obeys `0 ≤ remainder < divisor` |

Several can be switched on at once. The same operations then appear in **five different
question shapes**, which is where most of the variety comes from:

| Shape | Example | Asks for |
|-------|---------|----------|
| Direct | `7 + 5 = ?` | the result |
| Missing right | `7 + ? = 12` | the second number |
| Missing left | `? + 5 = 12` | the first number |
| Missing operator | `7 ? 5 = 12` | which of `+ − × ÷` fits |
| Chain | `(7 + 5) − 3 = ?` | a two-step result |

A missing-operator question is only ever shown when **exactly one** operator fits, so
genuinely ambiguous prompts such as `4 ? 2 = 2` (both `−` and `÷`) never appear.

### Difficulty: the rank ladder

One setting controls how big the numbers get, how much time there is, and which question
shapes are unlocked:

| Rank | Numbers | Time per question | Shapes |
|------|---------|-------------------|--------|
| 🌱 Rookie | ≤ 10 | 20 s | Direct |
| ⭐ Cadet | ≤ 20 | 18 s | + Missing right |
| 🚀 Pilot | ≤ 50 | 16 s | + Missing left |
| 🔥 Ace | ≤ 100 | 15 s | + Missing operator |
| 👑 Legend | ≤ 500 | 14 s | + Chain |
| 💫 Supernova | ≤ 1000 | 13 s | All five |

Harder shapes add a few seconds of thinking time. Direct questions stay the most common
shape at every rank, so unlocking something new seasons a mission rather than taking it
over. A shape a child keeps missing comes round a little more often than one they have.

**Past 100, adding and subtracting use round numbers** — `340 + 200`, not `195 + 87`.
Tapping one of four tiles cannot honestly tell a three-digit column sum from a lucky guess,
whereas round-number arithmetic is a real mental strategy and a real thing to get better at.
Multiplication and division need no such rule: their factors never leave the ×12 tables.

**Inside the rank, the numbers tune themselves.** A rolling window of the last 20 answers
nudges a working ceiling up or down within the rank, aiming to keep a child somewhere around
80 % — the rate at which people learn fastest. It never leaves the rank that was chosen, and
never says anything about it: the point is to keep the practice fitting, not to grade it.

### Scoring and stars

- **Correct answer:** 10 points × the current combo
- **Combo:** ×2 after 3 in a row, ×3 after 6, ×4 after 10
- **Wrong answer or time out:** the combo resets — the points and the mission both stay

Stars come from accuracy over the whole mission: ⭐⭐⭐ at ≥ 92 %, ⭐⭐ at ≥ 80 %, ⭐ at ≥ 65 %.
The first star sits above 65 % on purpose: with four tiles, guessing alone scores 25 %, so a
lower run says more about the numbers than about the child — and is offered smaller numbers
rather than a verdict.

Speed is only ever shown once accuracy is at least 80 %. A fast run full of misses is not a
faster child, and fluency is flexibility and accuracy before it is pace.

### Word problems

**Off by default.** Switched on in Settings, a sum arrives inside a short situation rather
than as bare numbers — because choosing the operation is a separate skill from carrying it
out, and bare equations never exercise it.

The distinction that matters most is inside division: *sharing* 24 apples between 6 children
and *grouping* 24 apples into bags of 6 give the same answer for entirely different reasons,
and a child who meets only one of them reliably comes unstuck on the other. Both are asked.
A situation the numbers would make nonsense of — sharing 3 apples between 12 children — is
never told at all.

Reading a situation is a second load on top of the arithmetic, which is why it is the
teacher's or parent's call when to add it.

### How it adapts

- **Spaced repetition.** Each operation carries a review interval (SM-2 inspired). One
  the child gets wrong comes back almost immediately; one they have mastered appears
  less often.
- **Weakness weighting.** Repeated misses on an operation raise its odds of being drawn
  next, so practice drifts toward what is not working.
- **A miss comes back.** Every missed question is queued and asked again a few questions
  later — near enough to be the same idea, far enough that the answer has to be recalled
  rather than remembered. Each one returns at most once, so a mission is still 25 long.
- **Worked solutions.** Every question carries its own working, and it is a *route* rather
  than the answer restated: `55 + 6` is explained as `55 + 5 = 60 → 60 + 1 = 61`, `9 × 7` as
  `10 × 7 − 7 = 70 − 7 = 63`. It appears after a miss and **waits there until the child
  presses Verstanden / Got it** — nothing takes it off the screen mid-read. It is also
  available on demand from 💡 Help, which pauses the clock while it is open.
- **Skill badges.** A rolling 30-answer accuracy history per operation, shown in
  Settings: 🥉 ≥ 45 %, 🥈 ≥ 65 %, 🥇 ≥ 80 %, 💎 ≥ 95 %.
- **Personal bests.** The fastest correct answer per operation is kept, and shown on the
  summary screen only when that run was at least 80 % accurate — see
  [Scoring and stars](#scoring-and-stars).

### Controls

- **Touch or mouse:** tap the answer.
- **Keyboard:** `1`–`4` answer directly; arrow keys move focus, Enter or Space fires.

**The countdown is off by default** — a first-time player should meet the maths, not a
clock. Settings offers three settings rather than two:

| Clock | What it does |
|-------|--------------|
| **Off** | No clock at all. |
| **Gentle** | The bar shows the time going by, then simply stops. Nothing counts as a miss. |
| **On** | Running out ends the question. |

The clock's problem was never the clock; it was that running out counted against you. It
pauses when Help is open or the tab is hidden.

### 🏆 Hall of Fame

Reached from the Math Invaders screen and from the end of a mission — the leaderboard
belongs to this game, so the other three do not link to it.

- **One best entry per rank and per clock setting**, so a relaxed run never overwrites a
  timed one.
- Scores stay in the browser. There is no backend and no global leaderboard.
- Scores from before the 2.0 rework are kept read-only under "Earlier"; combo scoring and
  the fixed 25-question mission make the old numbers incomparable.

---

## ✖️ Times Tables — the multiplication trainer

A focused trainer for *recall*, not calculation: the goal is knowing `7 × 8` rather than
working it out. Answers are typed on a number pad, because recognising an answer among
four is not the same skill as producing it.

| The galaxy map | Practising a table |
|----------------|--------------------|
| ![Times Tables](./docs/math-invaders-times-tables.png) | ![Trainer practice](./docs/math-invaders-trainer-practice.png) |

### What it practises

A planet map of 23 planets across four galaxies:

| Galaxy | Covers |
|--------|--------|
| 🌟 Home Galaxy | Tables 1–12 |
| ✨ Squares Nebula | Squares up to 25² |
| 🪐 Shortcuts Belt | The 15, 20 and 25 tables |
| 🌌 Deep Space | The larger tables, 13–19 |

Later galaxies unlock with stars, so a child cannot wander into 17× before the basics
are solid.

### The four phases

| Phase | What happens |
|-------|--------------|
| **Learn** | Skip-counting, the whole table laid out, and a strategy card — *why* `9 ×` works the way it does |
| **Practice** | Adapts to the facts that are due or weak; a wrong answer is explained and re-queued |
| **Speed Run** | Unlocks after the first star; the same facts against the clock |
| **Daily Mission** | Whatever is due for review today, across every planet |

### How it adapts

Every fact is scheduled with a **Leitner system**: get it right and it moves to a slower
box, get it wrong and it drops back to be seen again soon. The Daily Mission is simply
whatever those boxes say is due today.

### Progress

⭐ for a good Practice run, ⭐⭐ for a fast and accurate Speed Run, ⭐⭐⭐ for mastering every
fact on the planet. Stars never fall.

The **mastery map** colours all 144 facts by state — unseen, learning, due, mastered — so
a gap is visible at a glance rather than inferred from a score.

---

## 🎲 Surprise me

A fifth card in the picker that chooses a game — the game whose subject is "whatever you
need next".

It is deliberately **not** a random roll:

- **Never anything locked.** A planet or station that has not been opened is never
  offered.
- **Never a difficulty that was not earned.** Rank stays where it was set, and a station
  runs at the tier its stars allow. Rolling a difficulty would hand Supernova numbers to
  a beginner.
- **Review first.** If facts are due in the trainer today, Surprise sends the child to
  the Daily Mission rather than somewhere new.
- **Never Learn.** That phase is a lesson, not a run.

The point is *interleaving*: mixing topics beats practising one in a block, and switching
between the dots, the bar, the arcade and the tables is exactly that mix — all four games
are drawn from, including Number Sense, whose first zone is open from the start. A surprise
run ends with **Another surprise** and **Home** rather than "play again", because variety
was the point.

---

## Across all four games

### Languages

**German · Italian · English · French.** The interface is fully translated and
`<html lang>` follows the choice, so a screen reader uses the right voice. Worked
solutions are written in pure maths notation (`12 − 7 = 5`) and read identically in every
language.

### Settings

![Settings page](./docs/math-invaders-settings.png)

Settings are grouped by the game each control affects, because all four share one page, and
they run simplest first — the same order as the home screen.

| Setting | Applies to | Options | Default |
|---------|-----------|---------|---------|
| 👁 Brief glance | 👀 Sense | On / Off | On |
| Sense progress | 👀 Sense | Reset | — |
| 📏 Always show the bar | 📏 Beam | On / Off | On |
| Beam progress | 📏 Beam | Reset | — |
| Practise | 🛸 Arcade | ➕ ➖ ✖️ ➗ 🔢, several at once | ➕ Addition |
| Rank | 🛸 Arcade | Rookie → Supernova | 🌱 Rookie |
| ⏱ Countdown | 🛸 Arcade | Off · Gentle · On | Off |
| 💡 Worked solutions | 🛸 Arcade | On / Off | On |
| 📖 Word problems | 🛸 Arcade | On / Off | Off |
| Strategy cards | ✖️ Trainer | On / Off | On |
| Trainer progress | ✖️ Trainer | Reset | — |
| 🧠 Thinking time | ⚙️ All games | Normal · More · Most | Normal |
| 📋 Progress | ⚙️ All games | — | — |
| Language | ⚙️ All games | German · Italian · English · French | German |
| 🔊 Sound | ⚙️ All games | On / Off | On |
| Delete all data | ⚙️ All games | — | — |

Each game's reset clears only its own progress, so wiping the trainer never touches
arcade scores.

### Thinking time

**🧠 More thinking time** stretches every clock, and the three-second line at which a fact
counts as known by heart, by ×1.5 or ×2. It reaches the arcade and the tables trainer
alike, which is why it sits with the settings that apply everywhere.

That is the same standard measured with a fairer instrument — for a child working in a
second language, with dyscalculia, or with a hand that does not do as it is told.

### Accessibility

Native buttons, visible focus rings, a 44 px minimum touch target, `prefers-reduced-motion`
support, dialogs that trap focus and close on Escape, and labels that stay in the
accessibility tree even when a phone hides the text.

Every route is audited against **WCAG 2.1 A/AA with axe**, on both a phone and a desktop
viewport, and the test suite fails on a single violation.

### Your data

Everything is stored in the browser's `localStorage` on the device being used. There is
no account, no server, no cloud and no analytics — nothing to send anywhere. Clearing the
browser's data, or **Settings → ⚙️ All games → Delete all data**, removes it permanently.

Each child on the device gets their own namespace, so removing one child removes only their
things. An install from before profiles existed is adopted by the first child automatically,
with nothing lost.

Because progress is per-device and per-browser, a child who plays on both a tablet and a
laptop will have separate progress on each.

---

## 🧭 Why it is built this way

Every game here was checked against current research on how children learn number, counting
and mental arithmetic. Where a design choice looks unusual, it is usually deliberate.

### Choices that are easy to mistake for oversights

| Design choice | Why it is right |
|---|---|
| No accounts, no ads, no analytics, no network calls, offline-first | The architecture *is* the privacy policy — satisfied structurally rather than by policy text. |
| The countdown is **off by default** | Framing, not the clock, is the documented anxiety vector (Maki et al. 2024). |
| A wrong answer never ends a run | A hard day yields *more* practice, not less. |
| A local Hall of Fame, one entry per rank × clock | This is a **personal-best board**, not a leaderboard. The social-comparison harms need visible peers; there are none. |
| No daily-login streak | The combo streak is within-mission and resets each run, so there is no cross-day loss aversion to exploit. |
| Stars start at 65 %, not 50 % | With four tiles, guessing alone scores 25 %. Below 65 % the game offers smaller numbers instead of a verdict. |
| Speed shown only at ≥ 80 % accuracy | Fluency is flexibility, accuracy and strategy before it is pace (NCTM 2020). |
| A miss waits for *Got it* rather than a timer | Elaborated feedback only works if it is read; two seconds is under the time it takes to read a two-step working. |
| Distractors are built from real near-misses | Documented arithmetic bugs, not absurd fillers — which is what lets a wrong answer be named. |
| Leitner scheduling, commutativity-canonical (`7×8 ≡ 8×7`) | Real spaced repetition, and half as many facts to carry. |
| Number Sense allows a near miss when placing a number | The skill is a sense of magnitude; marking 38-for-37 wrong would measure something else. Everywhere a quantity is exact, it has to be exact. |
| WCAG 2.1 AA axe-audited on two viewports | The test suite fails on a single violation. |

### Curriculum

The games are mapped to **Lehrplan 21**, the Swiss curriculum, so a teacher can see which
competency each station serves — from `MA.1.A.2.b` (*"Anzahlen bis 5 ohne Zählen erfassen"*,
which is Number Sense's Sight Bay) through `MA.1.C.1` (worked routes and word problems) to
`MA.1.A.3.d` (typed recall in the trainer). Codes and descriptor text are quoted verbatim
from [zh.lehrplan.ch](https://zh.lehrplan.ch).

Lehrplan 21 is also the source of the caution the whole design follows: *"Ein zu frühes,
nicht vorstellungs- und verständnisorientiertes Automatisieren… behindert weiterführende
Lernprozesse."* Automaticity stays a goal; it is never the starting point. That is why the
floor — seeing, placing and counting on — is a game in its own right rather than a warm-up.

### Sources

Barbieri et al. 2023, *Educational Psychology Review* · Baroody et al. 2025,
*Mathematical Thinking and Learning* · Bjork & Bjork 2011 · Booth & Siegler 2006 ·
Brunmair & Richter 2019 · Carmosino 2024, *IJSG* · Cezarotto & Battaiola 2021 ·
Chen et al. 2024, *Labour Economics* · Ebner et al. 2025, *Remedial and Special Education* ·
Frykholm 2010 · Hopkins et al. 2020 · ICO, [*Age Appropriate Design Code*](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/)
and *EdTech Examined* 2024 · Kuo et al. 2026, IDC · Lau et al. 2018, *Nature Neuroscience* ·
Leuenberger et al. 2024 · Maki et al. 2024, *Journal of School Psychology* ·
Murray et al. 2025, *Educational Psychology Review* ·
NCTM 2020, [*Procedural Fluency in Mathematics*](https://www.nctm.org/standards-and-positions/Position-Statements/Procedural-Fluency-in-Mathematics/) ·
Reed et al. 2014 · Rohrer & Taylor 2007 · Ryan & Deci 2020 · Shute 2008 ·
Siegler & Opfer 2003, *Psychological Science* · Töllner et al. 2026, *Learning and Instruction* ·
Yorulmaz & Önal 2017 · D-EDK, [*Lehrplan 21 Mathematik*](https://zh.lehrplan.ch)

---

## ❓ FAQ

**Do I need to install anything?**
No. It runs in a browser. You can add it to a home screen if you want it to open like an
app.

**Does it work offline?**
Yes, after the first visit.

**Is it really free, with no ads?**
Yes. There is no monetisation of any kind, and no third-party scripts.

**How do I reset progress?**
Settings → ⚙️ All games → Delete all data, or one of the per-game resets to clear only
that game.

**Can several children share a device?**
Yes. Tap the name on the home screen to open **Who is playing?**, and add one profile per
child. Each keeps their own rank, stars, review schedule and best scores, so what one child
practises never changes what another is given — and nobody sees anybody else's scores.
Language and sound are shared, because those belong to the household rather than the child.

**Can I use it on a phone?**
Yes — it is built mobile-first and every game fits a portrait screen.

---

## 🛠 For developers

- **[Development guide](docs/DEVELOPMENT.md)** — architecture, project structure, how to
  run, build, check and deploy it
- **[Testing guide](docs/TESTING.md)** — the three test layers and how to add to them
- **[Contributing](CONTRIBUTING.md)** — workflow, style, adding a language
- **[Code of Conduct](CODE_OF_CONDUCT.md)** · **[Security Policy](SECURITY.md)** ·
  **[Changelog](CHANGELOG.md)**

Contributions are very welcome — bug reports, translations, code and documentation alike.

## 📄 License

MIT — see [LICENSE](LICENSE).

---

Enjoy! 🎮⚡
