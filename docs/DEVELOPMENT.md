# Development

Everything a contributor needs to run, build and ship the app. For *what the games
teach and how they play*, see the [README](../README.md); for the test strategy, see
the [Testing Guide](TESTING.md).

---

## Architecture

**A static React app on GitHub Pages.** There is no backend, no database and no API:
every question is generated in the browser and every scrap of progress lives in that
browser's `localStorage`. That is a deliberate constraint — it is what lets the app be
free, private and offline-capable at the same time.

```
┌─ React 19 + TypeScript
├─ Four games, one shell — simplest first
│  ├─ 👀 Number Sense  — seeing, placing and counting on
│  ├─ 📏 Number Beam   — doubling and halving on a bar model
│  ├─ 🛸 Math Invaders — the one-tap arcade game
│  └─ ✖️ Times Tables  — the multiplication trainer
├─ Pages
│  ├─ Home: profile, the game picker and 🎲 Surprise
│  ├─ Number Sense: zone map and the drill
│  ├─ Number Beam: station map and the ten-question drill
│  ├─ Math Invaders: the mission on offer, best scores, then the mission loop
│  ├─ Times Tables: galaxy map and the four trainer phases
│  ├─ Hall of Fame: arcade leaderboards
│  ├─ Progress: the parent and teacher view
│  └─ Settings: grouped by which game each control affects, in the same order
├─ Storage
│  └─ localStorage: profile, settings, progress, scores
└─ Deploy
   └─ GitHub Actions → GitHub Pages
```

### The one rule worth knowing

**`game/`, `beam/`, `sense/`, `timesTable/` and `store/` contain no React.** They are pure
TypeScript: given a seeded random number generator they produce the same questions
every time. That is what makes it cheap to assert the maths across hundreds of seeds
instead of hoping a lucky example passes. Anything that renders lives in `components/`
or `pages/`.

### Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19.2, React Router 8.3, TypeScript 7.0 |
| Build | Vite 8 |
| Styling | Token-driven CSS, no framework — see `src/styles/tokens.css` |
| Storage | Browser `localStorage`, zero tracking |
| Unit tests | Vitest — domain in Node, UI in jsdom + Testing Library |
| End-to-end | Playwright, desktop + mobile Chromium, against the production build |
| Accessibility | axe (WCAG 2.1 A/AA) on every route, in the Playwright suite |
| Deploy | GitHub Pages via GitHub Actions |

---

## Project structure

```
web/
├── public/
│   ├── 404.html        # SPA redirect for GitHub Pages
│   ├── manifest.json   # PWA manifest
│   ├── sw.js           # Offline app-shell cache
│   └── favicon.svg     # App icon
├── e2e/                # Playwright specs, one per feature area
├── src/
│   ├── pages/                      # One per route
│   │   ├── HomePage.tsx            # Profile, game picker, 🎲 Surprise
│   │   ├── GamePage.tsx            # Arcade mission loop (phase machine)
│   │   ├── HallOfFamePage.tsx      # Arcade scores by rank
│   │   ├── SettingsPage.tsx        # Grouped by which game each control affects
│   │   ├── TimesTablesPage.tsx     # Galaxy map
│   │   ├── NumberBeamPage.tsx      # Station map
│   │   ├── BeamDrillPage.tsx       # Beam drill loop
│   │   └── trainer/                # Learn, Practice, Speed Run, Daily Mission
│   ├── components/                 # Shared at the top, feature-owned in folders
│   │   ├── TopBar.tsx              # The one navigation bar, used by every game
│   │   ├── PlayHud.tsx             # The status strip every game shows while playing
│   │   ├── WorkedExampleDialog.tsx # The 💡 Help dialog, shared by two games
│   │   ├── Flag.tsx                # Drawn language flags
│   │   ├── ErrorBoundary.tsx       # Crash fallback
│   │   ├── arcade/                 # AnswerGrid, MissionSummary
│   │   ├── trainer/                # NumberPad, FactHeatmap, SessionSummary, TrainerFrame
│   │   ├── beam/                   # BarModel, BeamSlider
│   │   ├── sense/                  # SenseVisual — dice, ten-frames, rekenrek, arrays
│   │   └── HowToPlayDialog.tsx     # The ❓ rules dialog, one per game
│   ├── game/                       # Arcade domain — no React, fully tested
│   │   ├── types.ts                # Ranks, forms, scoring
│   │   ├── rng.ts                  # Seedable PRNG (deterministic tests)
│   │   ├── equations.ts            # Per-operation arithmetic + operator rules
│   │   ├── options.ts              # Distractor generation
│   │   ├── questions.ts            # Assembles forms into questions
│   │   ├── mission.ts              # Mission state reducer
│   │   └── examples.ts             # Worked examples
│   ├── beam/                       # Number Beam domain — no React, fully tested
│   │   ├── types.ts                # Skills, bar model, tiers and stars
│   │   ├── stations.ts             # Zones, stations, caps and unlocking
│   │   ├── questions.ts            # One generator per skill
│   │   ├── bars.ts                 # Bar geometry and beam sizing
│   │   ├── session.ts              # Drill reducer
│   │   └── beamStore.ts            # Stars, bests and beam settings
│   ├── sense/                      # Number Sense domain — no React, fully tested
│   │   ├── types.ts                # Skills, visuals, tiers and stars
│   │   ├── stations.ts             # Zones, stations and unlocking
│   │   ├── patterns.ts             # Die faces, ten-frames, bead rows, dot arrays
│   │   ├── questions.ts            # One generator per skill
│   │   ├── session.ts              # Drill reducer
│   │   └── senseStore.ts           # Stars and sense settings
│   ├── timesTable/                 # Trainer domain — facts, Leitner, sessions, stars
│   ├── store/                      # localStorage — no React
│   │   ├── storage.ts              # Safe JSON read/write, shared by every store
│   │   ├── settings.ts             # Settings + v1 migration
│   │   ├── scores.ts               # Scores v2 + legacy records
│   │   └── progress.ts             # Player, weakness, spaced repetition, badges
│   ├── i18n/                       # One file per language + the shared key type
│   │   ├── types.ts                # The `Translations` contract every language owes
│   │   ├── de.ts it.ts en.ts fr.ts
│   │   └── index.ts                # Lookup by language + `fill` for placeholders
│   ├── styles/                     # Design tokens and one sheet per area
│   │   ├── tokens.css              # Colours, spacing, type, radii, shadows
│   │   ├── layout.css home.css arcade.css settings.css hall-of-fame.css
│   │   ├── trainer.css beam.css sense.css motion.css chrome.css backdrop.css
│   │   └── index.css               # The cascade order, imported once by App.tsx
│   ├── test/                       # Shared jsdom setup and render helpers
│   ├── App.tsx                     # Router
│   ├── surprise.ts                 # Cross-game picker for the 🎲 card
│   ├── hooks.ts                    # Countdown, page visibility, dialogs, surprise runs
│   ├── sound.ts                    # Web Audio effects
│   └── constants.ts                # Avatars, language names
├── index.html
├── vite.config.ts
├── vitest.config.ts                # Two projects: domain (node) and ui (jsdom)
├── playwright.config.ts            # Runs against the production build
├── tsconfig.json
├── eslint.config.js
└── package.json
```

Tests live beside the code they cover. **The file extension picks the environment:**
`*.test.ts` runs in Node for pure logic, `*.test.tsx` in jsdom for anything that
renders.

---

## Running it

**Requirements:** Node.js 22 or newer. Everything below runs from `web/`.

```bash
npm install
npm run dev          # http://localhost:5173/number-galaxy
```

```bash
npm run build        # production bundle into web/dist/, also type-checks
npm run preview      # serve that bundle exactly as GitHub Pages will
```

## Checking it

```bash
npm run lint          # ESLint, and it owns formatting too
npm run lint:fix      # apply the formatting rules
npm run typecheck     # tsc over src/, e2e/ and the config files
npm test              # unit tests, both Vitest projects
npm run test:coverage # unit tests with coverage, gated
npm run test:e2e      # Playwright; builds and previews first
npm run test:all      # unit + end-to-end
```

`npm run lint`, `npm run test:coverage`, `npm run build` and `npm run test:e2e` all run
in CI on every push and pull request.

### Style is enforced, not described

Indentation, quotes, semicolons, trailing commas and line length are ESLint rules, and
`npm run lint:fix` applies them. Do not hand-format, and do not argue with the linter in
review — change the rule if it is wrong.

TypeScript runs with `strict`, plus `exactOptionalPropertyTypes`, `noImplicitReturns`
and `noImplicitOverride`. `any`, `@ts-ignore` and `@ts-expect-error` are not acceptable.

---

## Deployment

**Automatic on every push to `main`**, as the last job of
[`ci.yml`](../.github/workflows/ci.yml):

1. `static` installs, lints, runs the coverage-gated unit tests and builds
2. `e2e` runs the Playwright suite against that build
3. `deploy` needs both, so a red commit never reaches the site — and it publishes
   the artifact `static` produced rather than a second, unchecked build
4. Live at [galaxy.patbaumgartner.com](https://galaxy.patbaumgartner.com)

Only the `deploy` job holds `pages: write` and `id-token: write`. The jobs that
run `npm ci`, the test suites and the build have `contents: read` and nothing
else, so a compromised dependency has no token to publish with.

Two details that are easy to trip over:

- **`base` is `/`** (the app lives at the root of galaxy.patbaumgartner.com, declared once
  in `web/base.ts`). Asset URLs in `index.html` must be root-absolute (`/manifest.json`)
  so Vite can rewrite them with that base. A relative `manifest.json` resolves against
  the *current route* and 404s on any nested URL.
- **GitHub Pages has no SPA rewrite.** `public/404.html` bounces deep links back through
  `index.html`, which is why a direct link to a drill works at all.
