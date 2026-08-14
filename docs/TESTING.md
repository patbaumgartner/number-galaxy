# Testing

Number Galaxy is tested in three layers, each answering a different question.

| Layer | Question it answers | Runner | Size |
|-------|--------------------|--------|------|
| **Domain** | Is the maths correct? | Vitest (`node`) | 39 files |
| **UI** | Does the interface behave? | Vitest (`jsdom`) + Testing Library | 43 files |
| **End-to-end** | Does the shipped bundle work? | Playwright (Chromium desktop + mobile) | 12 files, both viewports |

**82 unit-test files**, run as two Vitest projects. Everything below runs from `web/`.

```bash
npm test              # both Vitest projects
npm run test:watch    # Vitest in watch mode
npm run test:coverage # Vitest + v8 coverage, enforces the thresholds below
npm run test:e2e      # Playwright, builds and previews the app first
npm run test:e2e:ui   # Playwright interactive mode
npm run test:all      # unit + end-to-end
```

---

## The one rule you need to remember

**The file extension picks the environment.**

| Pattern | Environment | Use it for |
|---------|-------------|------------|
| `src/**/*.test.ts` | `node` | Pure logic — `game/`, `beam/`, `sense/`, `store/`, `timesTable/`, `translations`, `sound` |
| `src/**/*.test.tsx` | `jsdom` | Anything that renders React |

This is configured as two Vitest projects in [`vitest.config.ts`](../web/vitest.config.ts). Keeping
the domain suites in `node` is deliberate: they install their own `window` stub to test
storage fallbacks, and a shared jsdom `window` would fight them for it.

Run one project at a time with `npx vitest run --project domain` or `--project ui`.

---

## Domain tests (`*.test.ts`)

No DOM, no React, no mocking framework — just functions and invariants.

Randomness is the interesting part. Every generator takes an `Rng`, so tests pass
`createRng(seed)` from [`src/game/rng.ts`](../web/src/game/rng.ts) and replay an exact
sequence. Invariants are then asserted across hundreds of seeds rather than one lucky case:

```ts
for (let seed = 0; seed < 200; seed += 1) {
    const question = createQuestion({ language: 'en', operation: 'division', rank: 'ace', rng: createRng(seed) })
    expect(question.options).toHaveLength(4)
    expect(question.options[question.correctIndex]).toBe(question.answer)
}
```

What each area locks down:

- **`game/rng`** — mulberry32 determinism, `randomInt` bounds, weighted picking, unbiased Fisher–Yates.
- **`game/equations`** — every operation across every rank ceiling: no negative results, exact division, factors within the ×12 tables, `0 ≤ remainder < divisor`.
- **`game/options`** — always exactly four distinct options, one of which is the answer; every remainder distractor is itself legal.
- **`game/questions`** — structural validity for every rank × operation × form, and that missing-operator prompts are only kept when exactly one operator fits.
- **`game/mission`** — the mission reducer: streaks, combo scoring, phase transitions, and the guarantee that a run always reaches 25 questions.
- **`surprise`** — the cross-game picker: a locked planet, station or zone is never chosen for any star state, all four games are reachable once unlocked, Number Sense is offered from the very first run, review wins while facts are due, and every route it produces carries the marker and never points at Learn.
- **`beam/`** — every station × tier across 200 seeds: a beam stop always exactly on the answer and never at either end, a beam long enough to be a number line and short enough to aim at, an answer that does not sit at a fixed fraction of the beam, both bar rows measured against one scale, a fraction's wanted parts summing to the answer, numbers that grow tier to tier, zone unlocking and the star ladder.
- **`store/`** — the v1→v2 settings migration, score keying per rank and clock, badge tiers, and that tampered or corrupt localStorage degrades to defaults instead of throwing.
- **`sense/`** — every station × tier across many seeds: the quantity asked for is the quantity drawn, a placing question marks a near miss correct while an exact one does not, arrangements stay ones a child meets elsewhere, and zone unlocking and the star ladder hold.
- **`timesTable/`** — Leitner scheduling, session building, planet unlocking, star awards and strategy cards.
- **`translations`** — full key parity across `de`/`it`/`en`/`fr`, equal array lengths, and matching `{placeholder}` sets.
- **`docs`** — that this page still describes the suite it documents: the file counts above, a row for every end-to-end spec, and coverage floors matching the ones the config enforces.
- **`dependencies`** — that `dependabot.yml` still matches `package.json`: no group pattern that matches nothing, and no two packages pinning each other while updating in separate pull requests.

---

## UI tests (`*.test.tsx`)

Rendered with React Testing Library against real components. Queries are accessible
first — `getByRole`, `getByLabelText`, `getByText` — so a test that passes is also
evidence the control is reachable by assistive technology. `container.querySelector`
appears only for purely presentational state (a CSS modifier class, an SVG attribute).

### Shared helpers

[`src/test/setup.ts`](../web/src/test/setup.ts) runs before every UI suite. It stubs
`AudioContext`, `matchMedia` and `scrollTo` — none of which jsdom ships — clears
`localStorage`, and unmounts between tests.

[`src/test/utils.tsx`](../web/src/test/utils.tsx) lets a test state its premise in one line:

```tsx
seedLanguage('en')
seedStars({ t3: 1 })
renderWithRouter(<PracticePhase planetId="t3" />)

await user.click(screen.getByRole('button', { name: 'Submit' }))
expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent('/times-tables')
```

- `renderWithRouter(ui, { route, path })` — mounts inside a `MemoryRouter` so `useNavigate`
  and `NavLink` work, alongside a `LocationProbe` that reports the current route.
- `seedSettings` / `seedLanguage` / `seedOperations` / `seedRank` / `seedPlayer` —
  write state *before* first render, because components read the store during render.
- `seedStars` / `seedFactProgress` / `masteredFact` — trainer progress.
- `seedBeamStars` / `seedBeamSettings` — Number Beam stars and whether the bar is always shown.

### Deriving expectations, never hard-coding them

Questions are generated, so a test must not assume a particular one. Read what is on
screen and compute the answer from it:

```tsx
const prompt = screen.getByText(/× .* = \?/).textContent ?? ''
const [, a, b] = prompt.match(/(\d+) × (\d+)/) ?? []
await submit(user, Number(a) * Number(b))
```

The same applies to trainer sessions: call `buildPracticeSession` with the same seeded
progress rather than pasting a fact list into the test.

### Timers

`useCountdown` and the feedback delays need `vi.useFakeTimers()`. When fake timers and
`userEvent` meet, build the user with `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`
and always restore real timers in `afterEach` — otherwise `userEvent`'s internal delay
waits on a clock that never moves and the test hangs until it times out.

Suites that only click (no timers) use `userEvent.setup({ delay: null })`, which removes
the inter-event wait and cuts the UI suite runtime roughly in half.

---

## End-to-end tests (`e2e/`)

Playwright runs against the **production bundle**, not the dev server:
`playwright.config.ts` builds the app and serves it with `vite preview` on port 4173,
so every spec exercises the same `/number-galaxy/` base path GitHub Pages serves.

Two projects run each spec: `chromium-desktop` (1280×800) and `chromium-mobile` (Pixel 7).

| Spec | Covers |
|------|--------|
| `smoke.spec.ts` | Every route loads, correct `<html lang>`, zero console errors, SPA deep-link redirect |
| `game.spec.ts` | A full 25-question mission, wrong answers, combo growth, Help overlay, Quit, Play Again, keyboard-only play |
| `settings.spec.ts` | Every control survives a reload; the last operation cannot be switched off; clearing data |
| `hall-of-fame.spec.ts` | Empty state, grouping by rank and clock, medals, the legacy section |
| `times-tables.spec.ts` | Galaxy map and locks, phase chooser, Learn end to end, Practice earning a star, Speed Run gating and timing, Daily Mission, heatmap tabs |
| `surprise.spec.ts` | Surprise never offers locked content, marks the run, ends it with another surprise and a way home, leaves a chosen run's ending untouched, and survives a reload |
| `number-beam.spec.ts` | Station map and zone locks, a full ten-question drill answered entirely on the beam with the tile grid asserted absent, dragging/nudging/arrow-keying the alien, the bar revealing its numbers after a miss, hiding the bar, resetting beam progress |
| `number-sense.spec.ts` | Zone locks and a deep link to a locked station, the brief glance and 👁 Look again, a full ten-question drill answered on the beam, and Explore numbers asking nothing at all |
| `progression.spec.ts` | Rank and star progression across the arcade and the trainer |
| `a11y.spec.ts` | Heading structure, keyboard reachability, accessible names, dialog semantics, no positive `tabindex`, and a full axe WCAG 2.1 A/AA audit of every route |
| `responsive.spec.ts` | No horizontal overflow, adequate touch targets, and top-bar labels that are not flush against their button, at 360×640, 768×1024 and 1280×800 |
| `pwa.spec.ts` | Manifest validity, service worker registration, survival across reload, the `404.html` redirect |

### Seeding state

State must be written **before the app boots**, via `page.addInitScript` — the app reads
localStorage during its first render, so setting it after navigation is too late.
`e2e/fixtures.ts` wraps this, along with helpers that answer an arcade question or a
trainer fact by reading the prompt off the page.

### Rules

- Web-first assertions (`await expect(locator).toBeVisible()`), never `waitForTimeout` as
  a synchronisation primitive.
- Role, label and text locators. A stable class selector is allowed only where the UI
  offers no accessible handle, and carries a comment saying so.
- No visual snapshots — they would bind the suite to a rendering environment.

---

## Coverage

`npm run test:coverage` produces text, HTML (`web/coverage/index.html`) and lcov output,
and **fails** below these floors:

| Metric | Floor | Current |
|--------|-------|---------|
| Statements | 96 % | 97.4 % |
| Branches | 94 % | 94.8 % |
| Functions | 97 % | 97.7 % |
| Lines | 98 % | 98.8 % |

Excluded: test files, `src/test/`, and `src/main.tsx` (the bootstrap, exercised by the
end-to-end suite instead).

Coverage is a floor, not a target. A green number on an untested edge case is worse than
an honest gap, so prefer adding the invariant over adding the line.

---

## Continuous integration

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs two jobs on every push and
pull request:

- **static** — lint → coverage-gated unit tests → build (which also type-checks). Uploads
  the coverage report.
- **e2e** — installs Chromium and runs the Playwright suite. Uploads the HTML report.

Both artefacts are retained for 7 days, so a red build can be inspected without
reproducing it locally.

---

## Writing a new test

1. Pick the layer. If it can be answered without a DOM, it belongs in a `.test.ts`.
2. Name it as a sentence describing behaviour — `it('reveals the correct tile when the player fires at the wrong one')`, not `it('works')`.
3. Assert observable behaviour, never internal state.
4. Make it deterministic: seed the PRNG, fake the clock, seed the store.
5. Run only your file while iterating (`npx vitest run src/game/mission.test.ts`), then the full suite before pushing.

If a test fails because the source is wrong, **fix the source**. Never loosen an
assertion to make a suite green — the assertion was the point.
