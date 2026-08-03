# Contributing to Math Invaders

Thank you for taking the time to contribute! 🎮⚡

All types of contributions are welcome — bug reports, feature suggestions, translations, code, and documentation.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Adding Translations](#adding-translations)
  - [Submitting Code](#submitting-code)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Style Guide](#style-guide)
- [Commit Convention](#commit-convention)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/math-invaders.git`
3. **Install** dependencies: `cd web && npm install`
4. **Run** locally: `npm run dev`
5. Open [http://localhost:5173/math-invaders](http://localhost:5173/math-invaders)
6. **Test on a phone:** open DevTools → toggle the device toolbar (or use a real device)
   and check both the one-tap answer grid and the trainer number pad
---

## How to Contribute

### Reporting Bugs

Before filing a bug, check if it's already [reported](https://github.com/patbaumgartner/math-invaders/issues?q=label%3Abug).

When filing a bug, include:
- **Steps to reproduce** the issue
- **Expected** vs **actual** behavior
- **Browser** and **OS** version
- Screenshot if relevant

Use the [🐛 Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) template.

### Suggesting Features

Open a [💡 Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) with:
- A clear description of the feature
- Why it would be useful
- Any implementation ideas (optional)

### Adding Translations

The game supports German, Italian, English and French. To add another:

1. Open `web/src/game/types.ts` and add your code to the `Language` union
2. Copy `web/src/i18n/en.ts` to `web/src/i18n/<code>.ts` and translate the values —
   the `Translations` type means TypeScript lists every key you still owe. One
   language per file, so you never touch anyone else's translation
3. Register it in `web/src/i18n/index.ts`
4. Open `web/src/constants.ts` and add a `languageNames` entry, written in the
   language itself (e.g. `Français`, not `French`)
5. Draw the flag in `web/src/components/Flag.tsx` — flags are SVG, because emoji
   flags collapse to bare "DE"/"GB" letters on Windows and most Linux desktops
6. Add the remainder separator in `web/src/game/equations.ts` (`remainderSeparator`)
7. Run `npm test` — `i18n/translations.test.ts` checks key parity, array lengths and
   `{placeholder}` parity across every language, so a missing key fails the build
8. Check every screen in the new language, including Settings and all three games
9. Submit a PR titled `feat: add [language] translation`

### Submitting Code

1. Create a branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Add or update tests — see the [Testing Guide](docs/TESTING.md)
4. Lint: `npm run lint`
5. Test: `npm test` and `npm run test:e2e` (both must pass)
6. Build: `npm run build` (must succeed — it also type-checks)
7. Commit using [conventional commits](#commit-convention)
8. Push and open a Pull Request

---

## Development Setup

```bash
# Clone the repository
git clone https://github.com/patbaumgartner/math-invaders.git
cd math-invaders/web

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production (also type-checks)
npm run build

# Lint
npm run lint

# Unit tests (domain in Node, UI in jsdom)
npm test
npm run test:watch
npm run test:coverage

# End-to-end tests (builds and previews, then drives Chromium)
npx playwright install chromium   # first time only
npm run test:e2e
```

**Requirements:** Node.js 22+

---

## Project Structure

```
math-invaders/
├── web/                      # React application
│   ├── e2e/                  # Playwright end-to-end specs
│   ├── src/
│   │   ├── pages/            # Route-level pages, incl. trainer/ phases
│   │   ├── components/       # Reusable UI components
│   │   ├── game/             # Arcade domain: rng, equations, questions, mission
│   │   ├── beam/             # Number Beam domain: skills, bars, drill, stars
│   │   ├── timesTable/       # Trainer domain: facts, Leitner, sessions, stars
│   │   ├── store/            # localStorage: settings, scores, progress
│   │   ├── i18n/             # One file per language, plus the shared key type
│   │   ├── styles/           # Design tokens and per-area stylesheets
│   │   ├── test/             # Shared jsdom setup and render helpers
│   │   ├── App.tsx           # Router
│   │   ├── hooks.ts          # Countdown, page visibility, modal dialogs
│   │   └── constants.ts      # Avatars, language names
│   ├── vite.config.ts
│   ├── vitest.config.ts      # Two projects: domain (node), ui (jsdom)
│   ├── playwright.config.ts
│   └── package.json
├── .github/
│   ├── workflows/            # GitHub Actions CI/CD
│   └── ISSUE_TEMPLATE/       # Issue templates
├── docs/                     # Screenshots and the Testing Guide
├── LICENSE
└── README.md
```

Tests sit next to the code they cover. **The extension picks the environment:**
`*.test.ts` runs in Node for pure logic, `*.test.tsx` runs in jsdom for anything that
renders. See [docs/TESTING.md](docs/TESTING.md).

---

## Style Guide

- **Formatting is enforced, not described.** `npm run lint` owns indentation, quotes,
  semicolons and line length; `npm run lint:fix` applies them. Do not hand-format
- **TypeScript** strictly typed; never `any`, `@ts-ignore` or `@ts-expect-error`.
  `strict` plus `exactOptionalPropertyTypes`, `noImplicitReturns` and
  `noImplicitOverride` are on, and `e2e/` and the config files are type-checked too
- **React** functional components with hooks only
- **CSS** use the design tokens in `src/styles/tokens.css`; no class in the markup
  without a matching rule, and no static inline styles — `style` is for values only
  known at runtime, such as a bar's width or a slider's position
- **Domain logic stays out of components** — `game/`, `store/` and `timesTable/` contain
  no React, which is what makes them cheap to test exhaustively
- **Randomness is injected**, never called directly, so tests can replay a seed
- **Accessibility:** every interactive element needs an accessible name, a visible focus
  ring, and a touch target of at least 44×44 px; modal dialogs must trap focus and close
  on Escape (use `useModalDialog`)
- **No new dependencies** without discussion — keep the bundle small
- Keep files focused; split large components

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, no logic change |
| `refactor:` | Code change, no feature/fix |
| `test:` | Adding/updating tests |
| `chore:` | Build, deps, tooling |

**Examples:**
```
feat: add Portuguese translation
fix: prevent score save when lives reach zero
docs: update gameplay screenshots
```

---

Thank you for making Math Invaders better! 🚀
