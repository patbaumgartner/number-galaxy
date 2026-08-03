# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **The app is now Number Galaxy — Zahlen-Galaxie.** It was named after one of
  its four games, which made the arcade sound like the whole product and left
  the other three reading as extras. The arcade keeps the name *Math Invaders*,
  because that is what it is; the galaxy is now the thing that holds all four.
  *Times Tables Galaxy* loses its galaxy for the same reason — two galaxies in
  one app named nothing.
  - The site address and the repository keep the old name, so every existing
    link and bookmark still works.
- **❓ How to play, inside each game.** The rules for all four games used to sit
  on the home page, where they were read once and then scrolled past forever —
  furthest from the moment anyone needs them. Each game now carries its own
  button, and the home page is a picker again.
- **"How did you do that?"** Whether an answer was recalled, counted or worked
  out with a trick is the most diagnostic thing about it, and it is invisible
  from the outside — a right answer looks identical either way. Now and then
  (about one correct answer in eight) the game simply asks, with three taps.
  Never scored, never required, and it never blocks: left alone it times out and
  carries on, so the fast correct-answer loop is untouched. The answer shows up
  on the progress page as "still counting" or "knows it by heart", which is
  something a teacher can act on.
- **📋 A progress page for parents and teachers.** The mastery data was all there
  and none of it was reachable: the README said outright that there was no
  report. There is one now, reached from Settings, and it answers the only
  question a grown-up actually has — *what should we practise next?* — in words
  rather than percentages: the habit worth naming ("you took the smaller digit
  from the bigger one") and a short list of sums to look at.
  - Per-operation accuracy, facts secure, stars in each of the four sections.
  - **Download as a file** and **Print**, with a print stylesheet that drops the
    chrome so a teacher can hand it over on paper.
  - It reads what is already on the device and records nothing of its own — a
    test holds that building it twice writes nothing at all. Nothing is sent
    anywhere, because there is still nowhere to send it.
- **📖 Word problems, off by default.** A child who can work out `24 ÷ 6`
  perfectly well may still not know that this is the sum a question about
  sharing apples is asking for — choosing the operation is a separate skill from
  carrying it out, and a page of bare equations never exercises it. Switch it on
  in Settings and sums arrive inside a short situation instead.
  - The types are the standard ones, and the distinction that matters most is
    inside division: *sharing* 24 apples between 6 children and *grouping* 24
    apples into bags of 6 have the same answer for entirely different reasons,
    and children who meet only one reliably come unstuck on the other. Both are
    asked.
  - A situation the numbers would make nonsense of is never told. Sharing 3
    apples between 12 children is arithmetic that works and a picture that does
    not, and picturing it is the whole point of asking this way.
  - Off by default on purpose: reading a situation is a second load on top of the
    arithmetic, and a child still working out the arithmetic should not carry
    both. When to add it is the teacher's or the parent's call.
- **👀 Number Sense: a fourth game, and the floor the other three stand on.** The
  arcade, the trainer and the beam all begin by assuming a child can already see
  a quantity, count on from a number, and say roughly where a number sits. Those
  are the strongest predictors of later arithmetic, they are all trainable, and
  none of them had anywhere to be practised. Six stations across two zones, for
  roughly ages 4–7.
  - **A pattern is shown for a glance, not for a count.** Dots appear for about a
    second and then go. Scattered dots can only be counted one at a time; a die
    face or two rows of five can be *seen*, and that seeing is what later becomes
    "7 is 5 and 2". 👁 Look again brings it back as often as wanted, and the
    glance can be switched off in Settings.
  - **Every arrangement is one a child meets elsewhere**: die faces, dominoes, a
    ten-frame in two rows of five, a bead rack grouped in fives, an empty number
    line with the jump drawn on, a dot array read as rows and columns.
  - **Placing a number allows a near miss** — 38 counts when the answer is 37,
    because the skill is a sense of size and marking that wrong would measure
    something else. Everywhere a quantity is exact, it must be exact.
  - Answered on the beam, as in Number Beam: nothing to eliminate, a number to
    commit to.
- **The arcade now remembers facts, not operations.** Its memory used to have
  five buckets, one per operation, so it could know a child was "bad at addition"
  and nothing more — never that `7 + 8` is hard and `2 + 2` is not. Every pair of
  numbers now carries its own review schedule, the same Leitner boxes the times
  tables use, and about half of each mission is drawn from whatever is due.
  - A fact is the *pair*, not the question written from it. `12 − 5` and `12 − 7`
    are one fact asked from two sides, as are `6 × 7` and `42 ÷ 6`, so answering
    either moves the schedule for both — which is the relationship the game is
    trying to teach in the first place. Which side gets asked is random, so
    owning a fact means owning it both ways round.
  - A fact is only offered when every number it would show fits inside the rank,
    and never twice within four questions, so review can never narrow to the same
    handful of sums — the run a struggling beginner would otherwise have got.
- **A gentle clock, between off and on.** The clock's problem was never the clock
  — it was that running out counted against you. Gentle shows the time going by
  and then simply stops: a pace guide rather than a threat.
- **🧠 More thinking time.** Stretches every clock, and the three-second line at
  which a fact counts as known by heart, by ×1.5 or ×2. That is the same standard
  measured with a fairer instrument, not a lower one — for a child working in a
  second language, with dyscalculia, or with a hand that does not do as it is told.
- **Times and divide asked back to back.** `6 × 7` and `42 ÷ 6` are one pair of
  numbers approached from opposite sides, and a child who has just worked out one
  is exactly the child for whom the other is a discovery rather than a fresh
  problem. A correct answer is now sometimes followed straight away by the same
  numbers the other way round — only when both operations were chosen, and never
  off the back of another link.
- **💡 Help now shows the idea this question needs.** It used to show one fixed
  example per operation — every addition question, however it was shaped, was
  answered with `7 + 5`. It now matches the *route*: a bridging-ten question is
  helped with a bridging-ten example, a near-double with a near-double, a
  division with the multiplication behind it. Always on different numbers, since
  help is asked for before answering and an example built from the live question
  would simply hand over the answer.
- **Settings names the mistake that keeps coming up.** One plain sentence — "you
  took the smaller digit from the bigger one" — drawn from the last forty misses,
  and only when one kind of error is clearly ahead. A parent can act on that; a
  percentage is not something anyone can act on.
- **Wrong answers now say what went wrong.** Distractors were near misses, which
  is right, but they were shaped only by arithmetic distance — a tempting wrong
  answer without being a *diagnostic* one. The tiles now carry the documented
  mistakes: taking the smaller digit from the larger (`51 − 26 → 35`), dropping a
  carry (`42 + 19 → 51`), losing or gaining one group, adding instead of
  multiplying. Reach for one and the game names it — "You took the smaller digit
  from the bigger one. Look again: which number is on top?" — before showing the
  route.
  - Mistakes too large to be plausible stay off the tiles. Adding column by
    column turns `74 + 26` into `910`, which is a real thing a child does and a
    useless thing to offer: nobody picks it, so the question quietly becomes a
    choice of three. It is still recognised if a child types it.
- **A fact you own is typed, not picked from four.** Recognising an answer among
  four tiles and producing one are not the same skill, and it is producing it
  that predicts being able to use the fact anywhere else. Once a fact reaches the
  box where it counts as owned, the arcade asks for it on the number pad instead.
  The tiles are how a child meets something; the pad is how they show they have
  it. Operators and remainders keep their tiles, having no number to type.
- **Worked solutions fade as a fact is learnt.** A full route is what a novice
  needs and what an expert stops reading. A child who owns a fact and slips now
  gets the opening move and no more; one still learning it gets the whole thing,
  and a second miss brings the whole thing back. It is never withdrawn entirely —
  whatever the schedule believes, a child looking at a wrong answer needs
  something.
- **The numbers tune themselves inside the rank.** A rank is a wide band, and a
  child at the wrong end of it is either bored or drowning. A rolling window of
  the last 20 answers now nudges a working ceiling up or down within the rank,
  aiming at roughly 80 % — the rate at which people learn fastest. It never
  leaves the rank that was chosen, never falls below the rank underneath, and is
  never announced: the point is to keep the practice fitting, not to grade it.
- **Question shapes adapt too.** `? + 5 = 12` — the shape that rehearses the
  inverse, and the one children find hardest — used to turn up exactly as often
  for the child who had it as for the child who did not. A rolling accuracy per
  shape now tilts the draw, capped so `direct` stays the backbone of every rank.
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
- **⚠️ Saved progress is reset by this release.** The stored data was namespaced
  `math-invaders-`, and the app is not called that any more. The namespace is now
  `number-galaxy-`, and nothing is carried across: every child starts again from
  stars, ranks, review schedules and best scores of zero. Profiles and names go
  with them.
  - The old keys are **deleted** on first launch rather than left behind.
    Orphaning them would be worse than the reset it avoids: *Delete all data*
    only ever clears the current namespace, so a child's name would have sat on
    the device permanently with nothing in the interface able to reach it.
  - The address and the repository are unchanged, so no link breaks.
- **Everything runs simplest first.** The home picker, the settings groups and
  the README now all run 👀 Number Sense → 📏 Number Beam → 🛸 Math Invaders →
  ✖️ Times Tables, which is the order a child actually grows through them.
  Previously each of the three disagreed with the other two, and the newest and
  gentlest game was listed last.
- **🎲 Surprise draws from all four games.** Number Sense was missing from the
  picker entirely, so the one game aimed at the youngest children could never be
  chosen for them — and interleaving, which is the whole point of the card, was
  running across three games instead of four. Its first zone is open from the
  start, so it is offered from the very first run.
- **The beam slider shows its number in the thumb.** The value sat off to one
  side of the control it belonged to, which is not where anyone was looking.
- **The pedagogy backlog is gone, and the README says what it said.** A list of
  thirty finished items is a work log, not documentation. What was worth keeping
  — why the countdown is off by default, why stars start at 65 %, why a near
  miss counts when placing a number, the Lehrplan 21 mapping and the sources —
  now lives in the README under *Why it is built this way*.
- **Big ranks add and subtract in round numbers.** Legend and Supernova were
  generating things like `195 + 87` and asking a child to tap one of four tiles,
  which is not mental arithmetic — it is elimination, or column arithmetic
  without the paper, and a four-option tap cannot tell either from a lucky guess.
  Past 100 the operands are multiples of ten (`340 + 200`), which is a real
  mental strategy and a real thing to get better at. Multiplication and division
  needed no change: their factors were already capped at the ×12 tables.
- **A mixed mission is now actually mixed.** Choosing two kinds of maths could
  still hand out nine additions in a row, which is a blocked practice set wearing
  an interleaved one's clothes. No operation may now run past three questions
  before another is forced in — what a mixed set trains is *choosing* the
  operation, not only carrying it out.
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
- **"Place it" asked the question and answered it in the same breath.** The
  heading showed the instruction rather than the numeral, and the question
  carried a number-line picture with the answer already marked on it — so the
  child was shown where the number went and then asked where it went. The
  numeral is now the prompt, the instruction is a hint, and the beam is the only
  line on screen.
- **The countdown and thinking-time controls stacked vertically.** Both are
  segmented controls of three short options and both were rendering as a column,
  because the row modifier never overrode the base rule that stacks them.
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
