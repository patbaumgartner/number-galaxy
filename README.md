# 🛸 Math Invaders

**Math Invaders** is a fully free, privacy-friendly neon math shooter for children. It runs as a single Next.js application — one container, one URL, zero tracking.

![Screenshot of Math Invaders](./docs/math-invaders-game.png)

---

## 🚀 How to play

1. **Choose your weapon** — select an operation, level, and difficulty.
2. **Pick your pilot** — enter a nickname and avatar to save progress (optional).
3. **Press ▶ Start mission** to begin.
4. **Steer your rocket** 🚀 left and right until it points at the correct answer lane.
5. **Fire!** — hit the correct answer invader to score points.
6. **Complete 10 questions** to finish a mission and reach the Hall of Fame.

---

## 🎮 Controls

| Action         | Mouse / Touch          | Keyboard                  |
|----------------|------------------------|---------------------------|
| Move left       | Click **← Left** button | Arrow Left `←`           |
| Move right      | Click **Right →** button | Arrow Right `→`          |
| Shoot           | Click **🔫 Shoot**      | `Space`                   |
| New mission     | Click **🔄 New mission** | —                        |

---

## 📐 Game rules

### Scoring

| Event                       | Points earned          |
|-----------------------------|------------------------|
| Correct answer              | **+10**                |
| Streak bonus (per streak level) | **+2 × streak**   |
| Wrong answer                | **−1 life**            |

### Session structure

- Each **mission** consists of exactly **10 questions**.
- You start with **3 lives** ❤️❤️❤️.
- Losing all lives **ends the mission early**.
- Answering all 10 questions **wins the mission** regardless of lives.
- Your best score per language is saved to the **Hall of Fame** (requires a saved profile).

### Streak

A **streak** grows by 1 with every correct answer in a row.  
A wrong answer resets the streak to 0.  
Each correct answer earns `10 + streak × 2` points — so staying on a streak pays off!

### Math modes

| Mode                     | Description                          |
|--------------------------|--------------------------------------|
| ➕ Addition              | `a + b = ?`                          |
| ➖ Subtraction           | `a − b = ?`                          |
| ✖️ Multiplication        | `a × b = ?`                          |
| ➗ Division              | `a ÷ b = ?` (whole number results)   |
| 🔢 Division + remainders | `a ÷ b = q r` (quotient + remainder) |

### Levels

| Level                | Number range              |
|----------------------|---------------------------|
| 🌱 Starter (8–10)    | Small, beginner-friendly  |
| 🚀 Advanced (8–10)   | Larger numbers            |
| ⚡ Challenge (10+)   | Hard problems, wide range |

### Difficulty

| Difficulty | Effect                                    |
|------------|-------------------------------------------|
| 😊 Easy    | Wider gap between options — easier picks  |
| 🎯 Normal  | Moderate distractor closeness             |
| 🔥 Hard    | Distractors are very close to the answer  |

---

## 🌍 Languages

Math Invaders supports **German (DE), Italian (IT), English (EN), and French (FR)**.  
Switching language also loads the Hall of Fame for that language.  
Remainder notation adapts to the language: German uses `Rest`, others use `r`.

---

## 🏆 Hall of Fame

- Requires a saved player profile (nickname + avatar).
- Only the **best score** per player per language is stored.
- No email, no password, no tracking — a nickname is enough.

---

## 👨‍🚀 Avatars

Each of the **12 crew avatars** is procedurally generated with a unique neon color circle. Choose the one that feels most like you!

| Avatar          | Neon colour |
|-----------------|-------------|
| 🦊 Comet Fox    | Orange      |
| 🐼 Nebula Panda | Lime        |
| 🦁 Solar Lion   | Gold        |
| 🐯 Tiger Spark  | Amber       |
| 🐨 Cosmo Koala  | Cyan        |
| 🦄 Star Unicorn | Magenta     |
| 🐬 Orbit Dolphin | Mint       |
| 🐢 Rocket Turtle | Green      |
| 🐙 Astro Octopus | Pink       |
| 🐸 Moon Frog    | Chartreuse  |
| 🐻 Galaxy Bear  | Purple      |
| 🐰 Meteor Bunny | Lavender    |

---

## 🛡️ Why Math Invaders is child-safe

- No ads
- No tracking or analytics
- No paywalls or premium features
- No manipulative streaks or loot boxes
- No forced email registration
- Short, focused 10-question sessions
- Pure black + neon design — no hidden UI patterns

---

## 🏗️ Run locally

```bash
cd backend
npm install
npm run dev
```

Open **http://localhost:3000**

---

## 🐳 Docker (single container)

```bash
# from the project root
docker compose up --build
```

The app is served at **http://localhost:3000** and SQLite data persists in `./backend/data/`.

---

## 🔌 API

| Method | Path                           | Description                  |
|--------|--------------------------------|------------------------------|
| POST   | `/api/register`                | Create or update player       |
| GET    | `/api/game-state?playerId=...` | Load saved game state         |
| POST   | `/api/game-state`              | Save game state               |
| GET    | `/api/hall-of-fame?language=..`| Fetch top scores              |
| POST   | `/api/hall-of-fame`            | Submit score                  |

---

## 🧱 Architecture

```
one container
└── Next.js (backend/)
    ├── / → MathInvadersGame UI (React, neon dark design)
    ├── /api/register
    ├── /api/game-state
    └── /api/hall-of-fame
        └── SQLite at backend/data/math-invaders.sqlite
```

The `web/` Vite workspace remains in the repo as a standalone reference build.
