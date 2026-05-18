# 🛸 Math Invaders

[![Deploy to GitHub Pages](https://github.com/patbaumgartner/math-invaders/actions/workflows/deploy.yml/badge.svg)](https://github.com/patbaumgartner/math-invaders/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

> A free, privacy-friendly neon math shooter for children. Play online at **[patbaumgartner.github.io/math-invaders](https://patbaumgartner.github.io/math-invaders)** with automatic GitHub Pages deployment—no backend required.

**[🎮 Play Now](https://patbaumgartner.github.io/math-invaders)** · **[📖 How to Play](#-how-to-play)** · **[🏗️ Architecture](#-architecture)** · **[🤝 Contributing](#-contributing)**

| Home | Game |
|------|------|
| ![Home page](./docs/math-invaders-home.png) | ![Game page](./docs/math-invaders-game.png) |

| Hall of Fame | Settings |
|-------------|----------|
| ![Hall of Fame](./docs/math-invaders-hall-of-fame.png) | ![Settings page](./docs/math-invaders-settings.png) |

---

## 🎮 How to Play

1. **Choose settings** — select operation, level, difficulty
2. **Create profile** — nickname + avatar (optional, for Hall of Fame)
3. **Start mission** — press start to begin
4. **Aim & shoot** — move rocket 🚀 to target correct answer, then fire
5. **Complete 20 questions** — finish mission to earn Hall of Fame entry

**Controls:**
- **Keyboard:** Arrow keys to move, Spacebar to shoot
- **Touch:** Swipe left/right to move, swipe up to shoot, or tap a lane to select it then tap again to shoot
- **Mouse:** Click direction buttons, then click Shoot button (or click a selected lane to fire)

**Timer:** Varies by level (5–15 s) and difficulty — time's up counts as a wrong answer

---

## 📐 Game Mechanics

### Scoring
- **Correct answer:** +10 points
- **Streak bonus:** +2 per consecutive correct
- **Wrong answer:** −1 life
- **Time's up:** −1 life (counts as wrong answer)
- **Win condition:** 20 questions answered with lives remaining

### Lives & Streak
- Start with **3 lives** ❤️❤️❤️
- Lose 1 life per wrong answer or expired timer
- **Timer per question** depends on level (15 s at Starter → 5 s at Master) and difficulty (Easy +3 s, Normal ±0, Hard −2 s) — minimum 3 s
- Streak grows with correct answers, resets on wrong or timeout
- Formula: `10 + (streak × 2)` points per question

### Math Operations

| Mode | Example | Notes |
|------|---------|-------|
| ➕ Addition | `7 + 3 = ?` | Basic arithmetic |
| ➖ Subtraction | `10 − 4 = ?` | All results allowed |
| ✖️ Multiplication | `6 × 7 = ?` | Whole numbers |
| ➗ Division | `20 ÷ 4 = ?` | Whole number results only |
| 🔢 Division + Remainder | `23 ÷ 5 = 4 r3` | Quotient + remainder |

### Levels (Number Range & Base Time)

| Level | Max Number | Base Time |
|-------|-----------|----------|
| 🟢 Starter | ≤ 10 | 15 s |
| 🔵 Beginner | ≤ 20 | 13 s |
| 🟡 Elementary | ≤ 50 | 11 s |
| 🟠 Intermediate | ≤ 100 | 9 s |
| 🔴 Advanced | ≤ 250 | 7 s |
| ⭐ Expert | ≤ 500 | 6 s |
| 💥 Master | ≤ 1000 | 5 s |

### Difficulty (Time Modifier)

| Difficulty | Time Adjustment |
|------------|----------------|
| 😊 Easy | +3 s |
| 🎯 Normal | ±0 s |
| 🔥 Hard | −2 s |

### Languages

🇩🇪 German · 🇮🇹 Italian · 🇬🇧 English · 🇫🇷 French

Each language has its own Hall of Fame leaderboard.

---

## 🏆 Hall of Fame

- **Per language:** Separate leaderboards for each language
- **Best score only:** One entry per player per level + difficulty combination
- **Grouped view:** Leaderboards are grouped by difficulty then level
- **No backend:** Scores stored locally on your device
- **Requires profile:** Create one to save to Hall of Fame

---

## 🏗️ Architecture

**Static React app on GitHub Pages** — No backend server required.

```
┌─ React 19 + TypeScript
├─ Pages
│  ├─ Home: Profile creation
│  ├─ Game: Main gameplay
│  ├─ Hall of Fame: Leaderboards
│  └─ Settings: Data management
├─ Storage
│  └─ localStorage: Player data, game state, scores
└─ Deploy
   └─ GitHub Actions → GitHub Pages
```

### Tech Stack

- **Frontend:** React 19.2, React Router 7.1, TypeScript 6.0
- **Build:** Vite 8.0 (fast hot reload)
- **Styling:** CSS3 deep-space neon theme (cyan / hot-pink / gold on galaxy-purple)
- **Storage:** Browser localStorage (zero tracking)
- **Deploy:** GitHub Pages + GitHub Actions

### Project Structure

```
web/
├── src/
│   ├── pages/          # 4 main pages
│   ├── components/     # Reusable UI
│   ├── App.tsx         # Router
│   ├── App.css         # Neon theme
│   ├── store.ts        # localStorage API
│   ├── game.ts         # Game logic
│   └── constants.ts    # Static data
├── index.html          # Entry point
├── vite.config.ts      # Vite config
├── tsconfig.json       # TypeScript
└── package.json        # Dependencies
```

---

## 🚀 Development

### Setup

```bash
cd web
npm install
npm run dev
```

Opens [http://localhost:5173/math-invaders](http://localhost:5173/math-invaders)

### Build

```bash
npm run build
```

Output in `web/dist/` — deploy to GitHub Pages or any static host.

### Lint

```bash
npm run lint
```

---

## 🌐 Deployment

**Automatic via GitHub Actions** on push to `main`:

1. Install dependencies
2. Build with Vite
3. Deploy `dist/` to GitHub Pages
4. Live at [patbaumgartner.github.io/math-invaders](https://patbaumgartner.github.io/math-invaders)

See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) for details.

---

## 🎨 Design Philosophy

- **No ads, no tracking, no monetization**
- **Child-safe:** Pure black + neon colors, no hidden patterns
- **Privacy-first:** All data stays on your device
- **Offline-capable:** Works without internet after initial load
- **Accessible:** Keyboard, mouse, and full touch/swipe support

---

## ❓ FAQ

**Q: Is my data private?**  
A: Yes. Everything is stored locally using browser localStorage. No server, no cloud, no analytics.

**Q: Can I play offline?**  
A: Yes, after the initial page load, the app works offline.

**Q: How do I save my progress?**  
A: Create a player profile. Scores auto-save to localStorage.

**Q: Can I use it on mobile?**  
A: Yes, fully responsive for phones and tablets. Touch controls are built in: swipe left/right to move your rocket, swipe up or tap the selected lane to shoot.

**Q: How do I reset my data?**  
A: Settings → Clear All Data to wipe profile and scores.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request. We also have a [Security Policy](SECURITY.md) and [Changelog](CHANGELOG.md).

---

Enjoy! 🎮⚡
