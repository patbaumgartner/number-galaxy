# Contributing to Number Galaxy

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
- [Style Guide](#style-guide)
- [Commit Convention](#commit-convention)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/number-galaxy.git`
3. **Install** dependencies: `cd web && npm install`
4. **Run** locally: `npm run dev`
5. Open [http://localhost:5173/number-galaxy](http://localhost:5173/number-galaxy)
6. **Test on a phone:** open DevTools → toggle the device toolbar (or use a real device)
   and check both the one-tap answer grid and the trainer number pad
---

## How to Contribute

### Reporting Bugs

Before filing a bug, check if it's already [reported](https://github.com/patbaumgartner/number-galaxy/issues?q=label%3Abug).

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
7. Write for every child. Where your language inflects a role — *Pilot/Pilotin*,
   *débutant/débutante*, *bambino/bambina* — do not let the masculine stand for
   both. Use a form your language already treats as neutral (French *novice*,
   Italian *pilota*), or step around the role entirely, which is what the German
   rank ladder does. `translations.test.ts` refuses the masculine generic, and
   names the key when it finds one
8. Run `npm test` — `i18n/translations.test.ts` also checks key parity, array
   lengths and `{placeholder}` parity across every language, so a missing key
   fails the build
9. Check every screen in the new language, including Settings and all four games
10. Submit a PR titled `feat: add [language] translation`

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

Everything you need — requirements, commands, architecture and the project tree — is in
the **[Development guide](docs/DEVELOPMENT.md)**. The short version:

```bash
cd web && npm install && npm run dev
```

Before opening a pull request:

```bash
npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e
```

**Requirements:** Node.js 22 or newer.

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
- **Domain logic stays out of components** — `game/`, `beam/`, `sense/`, `timesTable/`
  and `store/` contain no React, which is what makes them cheap to test exhaustively
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
| `ci:` | Workflows, automation, the release pipeline |
| `chore:` | Build, deps, tooling |

**Examples:**
```
feat: add Portuguese translation
fix: prevent score save when lives reach zero
docs: update gameplay screenshots
```

---

Thank you for making Number Galaxy better! 🚀
