# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **One profile per child on a shared device.** Tap the name on the home screen
  for **Who is playing?**, and add a profile for each child. Every key a child
  owns — rank, settings, stars, the review schedule, weak facts and best scores —
  is namespaced by them, so what one child practises never changes what another
  is given. Before this, siblings sharing a tablet were one composite child that
  the adaptive schedule described accurately for nobody.
  - The score board is per child too, on purpose: shared, it would stop being a
    private record of personal bests and become a leaderboard with visible peers.
  - Language and sound carry over to a new child, because they describe the
    household rather than the child; rank and progress start fresh.
  - An install from before profiles existed is adopted by the first child on next
    launch, with nothing lost — including one where nobody ever entered a name.
  - Removing a child removes exactly their things. The last profile always stays.
- **A missed question comes back.** Every miss is queued and asked again three
  questions later — near enough to still be the same idea, far enough that the
  answer has to be recalled rather than remembered. Each question returns at most
  once, so a mission is still exactly 25 long, and the repeat scores at base
  points rather than at the combo: it is there to repair understanding, not to
  rebuild a streak.
- **A run that struggled is offered smaller numbers rather than a verdict.** Below
  65 % the summary asks "those numbers were pretty big — want to try smaller
  ones?" and drops one rank on a single tap, instead of showing three empty stars.
- **A place to stop.** After two missions back to back the summary says, warmly,
  that this is a good place to stop. "Play again" is no longer the pre-armed
  default action.
- **Missed answers are remembered, not just counted.** Which of the four tiles a
  child reached for is kept on the device (the last 200), because that is what
  separates "does not know it" from a nameable mistake such as taking the smaller
  digit from the larger. Nothing is sent anywhere; it clears with every other
  reset.

### Changed
- **A wrong answer now waits for the child.** The worked solution used to be swept
  off the screen by a two-second timer, which is under the time it takes a
  seven-year-old to read a two-step working. It now stays until they press
  **Verstanden / Got it**, which takes keyboard focus. A correct answer still
  advances on its own after a beat.
- **Worked solutions show a route, not the answer restated.** `7 + 5 = ?` used to
  be explained as `7 + 5 = 12` — the question with the answer filled in, which is
  the one thing a child who just missed it already knows. Direct questions are now
  explained the way they are taught: `55 + 6` as `55 + 5 = 60 → 60 + 1 = 61`
  (Zehnerübergang), `7 + 8` as `7 + 7 = 14 → 14 + 1 = 15` (Nachbaraufgabe), `9 × 7`
  as `10 × 7 − 7 = 70 − 7 = 63`, `14 ÷ 2` as `7 + 7 = 14`. Still pure maths
  notation, so it needs no translation, and a route is never shown if one of its
  steps would name a number above the rank's ceiling.
- **The first star moved from 50 % to 65 %.** With four tiles on screen, guessing
  alone scores 25 %, so a star at 50 % was praising a coin toss and hiding a
  mission whose numbers were simply too big. Stars are now ⭐ at 65 %, ⭐⭐ at 80 %
  and ⭐⭐⭐ at 92 %.
- **Speed is shown only once the maths is solid.** The fastest-answer stat and the
  ⚡ badge appear at 80 % accuracy or better, and 🏆 New record is withheld from a
  run that struggled. Automaticity is still the goal and the times are still
  kept — a fast run full of misses simply is not a faster child.

- **One status strip for every game.** The arcade, the trainer and the beam each
  showed progress differently — a rich stat row, a bare "1 / 12" tucked inside a
  card, a plain line — so moving between them felt like moving between three
  apps. A shared `PlayHud` now fixes where progress sits and how it reads, while
  each game still chooses what to show in it. Every play screen starts at the
  same height, carries the same progress trail, and keeps its 💡 Help in the top
  bar rather than floating inside a card.
- **🎲 Surprise me** on the home picker: one button that chooses a game for you.
  It only ever offers content you have unlocked, never changes the rank or tier you
  have earned, and sends you to the Daily Mission first when trainer facts are due.
  A run the picker chose ends with "Another surprise" and "Home" rather than "play
  again"; a run you chose yourself is unchanged. The marker rides in the query
  string, so it survives a reload and the GitHub Pages redirect.
- **📏 Number Beam:** a third section for doubling, halving and the number sense that
  grows out of them. Nine stations across three zones — Doubling Deck (double, halve,
  near doubles), Parts Bay (double twice, quarters, fraction of) and Tens Belt
  (×10 ÷10, number bonds, split) — each with three tiers that widen as stars are
  earned, and a ten-question drill per run.
- **Every Number Beam question is drawn as a bar model.** The whole sits on top, the
  parts that make it sit underneath, and both rows are measured against one shared
  scale, so a doubled bar really is twice as long. Unknown parts stay behind a `?`
  and fill in once the answer is given. Aliens ride the segments.
- **Every question is answered by moving an alien along the beam.** There are no
  answer tiles in this section: drag the alien, nudge it with −/+, or use the arrow
  keys, then land it on the answer. It is a native range input underneath, so it is
  keyboard-operable and screen-reader-announced, and the bar carries a maths-notation
  description as its accessible name. Each station declares the granularity its
  answers have, so the beam can use a thumb-friendly step and still always have a
  stop exactly on the answer.
- Number Beam settings: the bar can be hidden until a miss, for children ready to work
  in their head, and beam progress can be reset on its own.
- **Times Tables Galaxy trainer:** planet map, Learn, Practice, Speed Run and Daily
  Mission phases for tables, squares, shortcuts and advanced facts.
- Leitner-style review, persistent stars and best times, strategy cards, a mastery
  heatmap and independent trainer-progress reset in Settings.
- **Three-layer test suite, 545 tests.** Domain logic in Node, React components and
  pages in jsdom via Testing Library, and the built bundle driven through desktop and
  mobile Chromium with Playwright. Coverage is gated at 95 % statements / 92 % branches
  and the end-to-end suite runs in CI. See [docs/TESTING.md](docs/TESTING.md).
- End-to-end coverage for accessibility, responsive layout and the PWA app shell, so
  console errors, horizontal overflow and undersized touch targets fail the build.
- `useModalDialog` hook giving every modal Escape-to-close, a focus trap and focus
  restoration to the control that opened it.

### Fixed
- **Top-bar buttons had no room around their labels.** `.btn--icon` zeroed the
  horizontal padding, so above 560px the background ended exactly where the text
  did and the button read as too small for its own contents. Covered now by a
  responsive test that fails when a label sits flush against its button.
- **Two real WCAG violations on the times-tables map**, found by adding an axe
  audit: the heatmap tabs used `aria-pressed`, which is prohibited on
  `role="tab"` and meant the selected tab was never announced; and all 144
  heatmap cells were bare spans, which take no accessible name, so every one of
  their `aria-label`s was silently discarded. The tabs are a proper tablist with
  `aria-selected` and a labelled panel, and the cells are `role="img"`.

### Changed
- **Settings and navigation are now split by game.** Every game shared one page with
  no indication of which control changed what; settings are grouped under 🛸 Math
  Invaders, ✖️ Times Tables Galaxy, 📏 Number Beam and ⚙️ All games. The trainer's top bar no longer
  links to the arcade leaderboard, and the shared settings page no longer sends you
  into the arcade game when you leave it.
- **The home page explains each game separately** — the how-to section only ever
  described Math Invaders — and each game picker card now carries a one-line summary.
- **One navigation bar for every game screen, in every game.** The arcade had its
  own bar, the trainer stacked two, and the arcade's Hall of Fame had none at all —
  three patterns for the same job. A shared `TopBar` now puts the exit in the same
  corner everywhere, and each screen has exactly one `h1` (the arcade game screen
  previously had none).
- **The equation type no longer breaks mid-formula.** At Legend and Supernova, four
  of seven realistic prompts wrapped on a phone, splitting sums like
  `37 ? 496 = 533` across two lines. The fluid size now fits all but the two-step
  chains, which wrap evenly.
- **Every Times Tables planet has its own icon.** Twenty-one of the twenty-three
  rendered an identical ✖️, so the galaxy map was a wall of grey crosses.
- **Language flags are drawn as SVG** instead of 🇩🇪-style regional-indicator emoji,
  which render as bare "DE"/"GB" letters on Windows and most Linux desktops.

### Added
- **💫 Supernova rank** — numbers up to 1000, above Legend.

### Fixed
- **The Hall of Fame lost player names on phones.** Below 460px the stats column was
  sized `auto`, and the longer French and Italian strings consumed the whole name
  column — names vanished and the stars overlapped the stats. German happened to fit,
  which is why it went unnoticed.
- **Button labels disappeared from the accessibility tree on phones.** They were
  hidden with `display: none`, so the back and help buttons were announced as "←" and
  "💡". They are now visually hidden but still read aloud.
- **Trainer screens pinned their card to the top**, leaving a large void beneath it on
  a tall phone.
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
