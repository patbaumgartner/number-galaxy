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
5. Open [http://localhost:5173/math-invaders](http://localhost:5173/math-invaders)5. **Test touch controls:** open DevTools → toggle device toolbar (or use a real mobile device) and verify swipe gestures and tap-to-shoot work
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

The game supports multiple languages. To add a new one:

1. Open `web/src/constants.ts`
2. Add your language code to the `Language` type
3. Add translated labels for all operations/levels/difficulties
4. Open `web/src/components/LanguageSwitcher.tsx` and add the flag/button
5. Test all screens in the new language
6. Submit a PR with the title `feat: add [language] translation`

### Submitting Code

1. Create a branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Lint: `npm run lint`
4. Build: `npm run build` (must succeed)
5. Commit using [conventional commits](#commit-convention)
6. Push and open a Pull Request

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

# Build for production
npm run build

# Lint
npm run lint
```

**Requirements:** Node.js 22+

---

## Project Structure

```
math-invaders/
├── web/                  # React application
│   ├── src/
│   │   ├── pages/        # Route-level page components
│   │   ├── components/   # Reusable UI components
│   │   ├── App.tsx       # Router setup
│   │   ├── App.css       # Global neon theme
│   │   ├── store.ts      # localStorage persistence
│   │   ├── game.ts       # Core game logic
│   │   └── constants.ts  # Avatars, labels, config
│   ├── vite.config.ts
│   └── package.json
├── .github/
│   ├── workflows/        # GitHub Actions CI/CD
│   └── ISSUE_TEMPLATE/   # Issue templates
├── docs/                 # Screenshots
├── LICENSE
└── README.md
```

---

## Style Guide

- **TypeScript** strictly typed; avoid `any`
- **React** functional components with hooks only
- **CSS** use existing CSS variables from `App.css`; no inline styles
- **Touch support:** all interactive elements must have `touch-action: manipulation` and a minimum touch target of 44×44 px
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
