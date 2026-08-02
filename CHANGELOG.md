# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Times Tables Galaxy trainer:** planet map, Learn, Practice, Speed Run and Daily
  Mission phases for tables, squares, shortcuts and advanced facts.
- Leitner-style review, persistent stars and best times, strategy cards, a mastery
  heatmap and independent trainer-progress reset in Settings.
- **Three-layer test suite, 355 tests.** Domain logic in Node, React components and
  pages in jsdom via Testing Library, and the built bundle driven through desktop and
  mobile Chromium with Playwright. Coverage is gated at 95 % statements / 92 % branches
  and the end-to-end suite runs in CI. See [docs/TESTING.md](docs/TESTING.md).
- End-to-end coverage for accessibility, responsive layout and the PWA app shell, so
  console errors, horizontal overflow and undersized touch targets fail the build.
- `useModalDialog` hook giving every modal Escape-to-close, a focus trap and focus
  restoration to the control that opened it.

### Changed
- **Settings and navigation are now split by game.** Both games shared one page with
  no indication of which control changed what; settings are grouped under 🛸 Math
  Invaders, ✖️ Times Tables Galaxy and ⚙️ Both games. The trainer's top bar no longer
  links to the arcade leaderboard, and the shared settings page no longer sends you
  into the arcade game when you leave it.
- **The home page explains each game separately** — the how-to section only ever
  described Math Invaders — and each game picker card now carries a one-line summary.
- **One navigation bar for every game screen, in both games.** The arcade had its
  own bar, the trainer stacked two, and the arcade's Hall of Fame had none at all —
  three patterns for the same job. A shared `TopBar` now puts the exit in the same
  corner everywhere, and each screen has exactly one `h1` (the arcade game screen
  previously had none).
- **Every Times Tables planet has its own icon.** Twenty-one of the twenty-three
  rendered an identical ✖️, so the galaxy map was a wall of grey crosses.
- **Language flags are drawn as SVG** instead of 🇩🇪-style regional-indicator emoji,
  which render as bare "DE"/"GB" letters on Windows and most Linux desktops.

### Added
- **💫 Supernova rank** — numbers up to 1000, above Legend.

### Fixed
- **The sound setting only worked in Math Invaders.** All four trainer phases play
  sounds but none applied the preference, so switching sound off and going straight
  to the times tables still made noise.
- The trainer progress reset button sat directly against the divider above it.
- The Squares Nebula unlock hint said "5 home planets" while the galaxy it refers to
  is called the Home Galaxy.
- **The Learn phase was unstyled.** It wrapped its content in a `container` class that
  had no CSS rule, so text sat flush against the viewport edge and buttons stretched the
  full window width. Its cards, skip-count sequence, fact table and answer hints had no
  styling at all.
- **Wrong-answer shake did nothing in the trainer.** The `shake` keyframes existed and
  the phases applied a `shake` class, but no rule connected the two.
- **The trainer session summary rendered as bare text** — its button used `btn-primary`
  where the design system defines `btn--primary`.
- **Trainer navigation ran off the screen between 376 px and roughly 500 px**, hiding
  Hall of Fame and Settings on the most common phone widths (iPhone 12–15, Pixel 7).
  The bar now wraps instead of relying on a fixed breakpoint.
- Trainer navigation links had 21 px hit areas; they now meet the 44 px minimum.
- The trainer navigation showed its multiplication glyph twice.
- Hall of Fame ran the best streak and the score together, so "Serie 18" beside "640"
  read as "18640"; the player's name also ellipsed while the secondary stats held twice
  its width.
- Modal dialogs did not trap focus, and neither the profile editor nor the in-game help
  overlay closed on Escape.

## [2.0.0] - 2026-07-30

Gameplay rework: simpler to play, more fun, and many more equations.

### Changed
- **One tap to answer.** The steer-the-rocket-then-shoot mechanic is gone. Tapping an
  alien fires at it, cutting a question from ~3 actions down to 1. Keyboard `1`–`4`
  fire directly; arrow keys move focus within the 2×2 grid.
- **Missions always run the full 25 questions.** Wrong answers cost combo and accuracy
  but no longer end the run, so a struggling child now practises *more*, not less.
  Replaces the old 3-lives sudden-death rule and the fixed 20-question run.
- **One difficulty ladder.** The `Level` (7) × `Difficulty` (3) × `mode` (2) matrix is
  replaced by five ranks — Rookie, Cadet, Pilot, Ace, Legend — plus an independent
  countdown switch. Each rank sets the number range, the time, and which question
  forms are unlocked.
- **Settings cut from nine sections to three** (what to practise, how hard, language),
  with everything else behind "More settings".
- **Play starts in one tap.** A profile is created automatically; naming and avatar are
  optional and editable inline instead of gating the Play button.
- **Modern, token-driven layout.** `App.css` rewritten around CSS custom properties,
  fluid `clamp()` type, `100dvh` and safe-area insets. The game screen fits a single
  viewport with no scrolling.
- Countdown is off by default so a first-time player meets the maths, not a clock.

### Added
- **Five equation forms** instead of one, unlocked progressively by rank:
  `7 + 5 = ?`, `7 + ? = 12`, `? + 5 = 12`, `7 ? 5 = 12`, and `(7 + 5) − 3 = ?`.
  Missing-operator prompts are rejection-sampled so exactly one operator ever fits.
- Combo multiplier (×2 at 3 correct in a row, ×3 at 6, ×4 at 10) with escalating
  visuals and sound.
- End-of-mission summary with 1–3 stars by accuracy, confetti, and Play Again.
- Per-question worked solutions in pure maths notation, shown after a miss and from
  an on-demand help button that pauses the clock.
- Sound on/off setting.
- Vitest suite covering the question generators and the storage migration, wired into CI.

### Fixed
- Answers can no longer be double-counted when a tap races the expiring countdown.
- Remainder distractors now always satisfy `0 ≤ remainder < divisor`.
- Division questions are built from the answer outwards, so they are always exact.
- The countdown pauses when the tab is hidden or the help panel is open.
- The service worker no longer registers in development, where it served stale assets.
- Manifest icon now declares intrinsic dimensions and drops the `maskable` purpose it
  could not satisfy (the rocket has no safe-zone padding, so Android cropped it).
- Replaced the deprecated `apple-mobile-web-app-capable` meta tag with the standard
  `mobile-web-app-capable`.
- `<html lang>` now follows the selected UI language.
- Settings page no longer contains hardcoded English strings.

### Removed
- Confidence check ("Not sure / Got it!") prompt after every answer.
- Lives, and the wave-based mid-run difficulty ramp.
- Swipe gestures, which the one-tap grid makes redundant.
- Dead `saveGameState` writes that ran on every question but were never read back.

### Migration
- Old settings convert once: `starter→Rookie`, `beginner→Cadet`, `elementary→Pilot`,
  `intermediate→Ace`, `advanced`/`expert`/`master→Legend`; `explore→countdown off`.
- Pre-rework scores are preserved read-only under "Earlier" in the Hall of Fame. They
  are not converted, because combo scoring and the fixed 25-question mission make the
  numbers incomparable.

## [1.0.0] - 2026-05-17

### Added
- Complete rewrite to a static architecture using React 19 and React Router 7.
- Full neon aesthetic theme (cyan/magenta/yellow on black).
- In-browser `localStorage` database (zero tracking, privacy-first).
- GitHub Pages automatic deployment pipeline using OIDC authorization.
- Comprehensive English, German, French, and Italian translations.
- Per-language localized Hall of Fame system.
- 24 selectable emoji avatars for user profiles.
- 5 Math Operations: Addition, Subtraction, Multiplication, Division, and Division with Remainders.
- 3 Difficulties (Easy, Normal, Hard) and 3 Number Ranges (Starter, Advanced, Challenge).
- Health system (3 lives) and streak bonus mechanism.
- Comprehensive documentation: README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.
- Github Issue and PR templates for open-source participation.

### Removed
- Legacy Next.js backend API and SQLite database.
- Docker and Nginx containerization setup (no longer needed for static hosting).

### Fixed
- CI pipeline fixed to use Node.js 22 required for Vite 8.
- OIDC permissions for GitHub Actions to deploy to GitHub Pages without branch switching.
