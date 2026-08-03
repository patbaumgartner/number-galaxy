# 🛸 Math Invaders

[![Deploy to GitHub Pages](https://github.com/patbaumgartner/math-invaders/actions/workflows/deploy.yml/badge.svg)](https://github.com/patbaumgartner/math-invaders/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

> Three free maths games for children, in one page. No account, no ads, no tracking, and
> it keeps working when the wifi does not.

**[🎮 Play now](https://patbaumgartner.github.io/math-invaders)** ·
**[👩‍🏫 For teachers](#-for-teachers-and-parents)** ·
**[🛸 The arcade](#-math-invaders--the-arcade-game)** ·
**[✖️ Times tables](#️-times-tables-galaxy--the-multiplication-trainer)** ·
**[📏 Number Beam](#-number-beam--doubling-halving-and-bar-models)** ·
**[🛠 Development](docs/DEVELOPMENT.md)**

![The home page, with the three games and the Surprise card](./docs/math-invaders-home.png)

---

## 👩‍🏫 For teachers and parents

### What each game practises

| Game | Maths it covers | Roughly |
|------|-----------------|---------|
| 🛸 **Math Invaders** | Addition, subtraction, multiplication, division and remainders — in five different question shapes, with numbers from ≤ 10 up to ≤ 1000 | ages 6–11 |
| ✖️ **Times Tables Galaxy** | Recall of the tables: 1–12, squares to 25², the 15/20/25 shortcuts, and 13–19 | ages 7–11 |
| 📏 **Number Beam** | Doubling, halving, quarters, fractions of an amount, ×10 ÷10, number bonds and partitioning — all drawn as bar models | ages 5–9 |

The ages are an indication, not a gate, and no curriculum is assumed. Each game sets its
own difficulty from what the child has already done, so two children of different ages
can share a device without either being handed the other's numbers.

### What a session looks like

A child presses Play and is answering a question within a second — there is no menu to
learn and no account to make. A run is short and finite by design: **25 questions** in
the arcade, **10** in a beam drill, one planet's worth of facts in the trainer. A wrong
answer never ends a run early, so a hard day means *more* practice, not less.

If you would rather not choose, **🎲 Surprise me** picks for them — see
[below](#-surprise-me).

### How you can see progress

- **⭐ Stars** on every planet and station, and at the end of every arcade mission.
- **A mastery map** in Times Tables Galaxy that colours each of the 144 facts as unseen,
  learning, due for review, or mastered — the fastest way to see what is actually stuck.
- **Skill badges** in Settings, one per arcade operation, from a rolling 30-answer
  accuracy history.
- **Worked solutions** after every miss, so a wrong answer teaches something.

There is no dashboard and no report to log into: progress lives on the device the child
plays on, and that is the whole privacy model.

### What it never does

No account. No advertising. No analytics, telemetry or third-party scripts. Nothing
leaves the device — there is no server to send it to. After the first visit it works
offline. See [Your data](#your-data).

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
over.

### Scoring and stars

- **Correct answer:** 10 points × the current combo
- **Combo:** ×2 after 3 in a row, ×3 after 6, ×4 after 10
- **Wrong answer or time out:** the combo resets — the points and the mission both stay

Stars come from accuracy over the whole mission: ⭐⭐⭐ at ≥ 90 %, ⭐⭐ at ≥ 70 %, ⭐ at ≥ 50 %.

### How it adapts

- **Spaced repetition.** Each operation carries a review interval (SM-2 inspired). One
  the child gets wrong comes back almost immediately; one they have mastered appears
  less often.
- **Weakness weighting.** Repeated misses on an operation raise its odds of being drawn
  next, so practice drifts toward what is not working.
- **Worked solutions.** Every question carries its own step-by-step working — the inverse
  operation for a missing number, both steps for a chain. It appears automatically after
  a miss, and on demand from 💡 Help, which pauses the clock while it is open.
- **Skill badges.** A rolling 30-answer accuracy history per operation, shown in
  Settings: 🥉 ≥ 45 %, 🥈 ≥ 65 %, 🥇 ≥ 80 %, 💎 ≥ 95 %.
- **Personal bests.** The fastest correct answer per operation is kept and celebrated on
  the summary screen.

### Controls

- **Touch or mouse:** tap the answer.
- **Keyboard:** `1`–`4` answer directly; arrow keys move focus, Enter or Space fires.

**The countdown is off by default** — a first-time player should meet the maths, not a
clock. Switch it on in Settings; it pauses when Help is open or the tab is hidden.

### 🏆 Hall of Fame

Reached from the Math Invaders section of the home page — the leaderboard belongs to this
game, so the other two do not link to it.

- **One best entry per rank and per clock setting**, so a relaxed run never overwrites a
  timed one.
- Scores stay in the browser. There is no backend and no global leaderboard.
- Scores from before the 2.0 rework are kept read-only under "Earlier"; combo scoring and
  the fixed 25-question mission make the old numbers incomparable.

---

## ✖️ Times Tables Galaxy — the multiplication trainer

A focused trainer for *recall*, not calculation: the goal is knowing `7 × 8` rather than
working it out. Answers are typed on a number pad, because recognising an answer among
four is not the same skill as producing it.

| The galaxy map | Practising a table |
|----------------|--------------------|
| ![Times Tables Galaxy](./docs/math-invaders-times-tables.png) | ![Trainer practice](./docs/math-invaders-trainer-practice.png) |

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

## 📏 Number Beam — doubling, halving and bar models

The other two games ask a child to *produce a number*. This one shows them what a number
is made of.

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

## 🎲 Surprise me

A fourth card in the picker that chooses a game — the game whose subject is "whatever you
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
between the arcade, the tables and the bar is exactly that mix. A surprise run ends with
**Another surprise** and **Home** rather than "play again", because variety was the point.

---

## Across all three games

### Languages

**German · Italian · English · French.** The interface is fully translated and
`<html lang>` follows the choice, so a screen reader uses the right voice. Worked
solutions are written in pure maths notation (`12 − 7 = 5`) and read identically in every
language.

### Settings

![Settings page](./docs/math-invaders-settings.png)

Settings are grouped by the game each control affects, because all three share one page.

| Setting | Applies to | Options | Default |
|---------|-----------|---------|---------|
| Practise | 🛸 Arcade | ➕ ➖ ✖️ ➗ 🔢, several at once | ➕ Addition |
| Rank | 🛸 Arcade | Rookie → Supernova | 🌱 Rookie |
| ⏱ Countdown | 🛸 Arcade | On / Off | Off |
| 💡 Worked solutions | 🛸 Arcade | On / Off | On |
| Strategy cards | ✖️ Trainer | On / Off | On |
| Trainer progress | ✖️ Trainer | Reset | — |
| 📏 Always show the bar | 📏 Beam | On / Off | On |
| Beam progress | 📏 Beam | Reset | — |
| Language | ⚙️ All games | German · Italian · English · French | German |
| 🔊 Sound | ⚙️ All games | On / Off | On |
| Delete all data | ⚙️ All games | — | — |

Each game's reset clears only its own progress, so wiping the trainer never touches
arcade scores.

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

Because progress is per-device and per-browser, a child who plays on both a tablet and a
laptop will have separate progress on each.

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
They will share one profile and one set of progress. Separate browser profiles, or
separate devices, keep them apart.

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
