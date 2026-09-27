# 🧹 Chores App

A self-hosted family chore tracker built for touchscreens. Each child gets their own profile, color theme, and checklist; parents manage everything behind a PIN. Kids tap to check things off, watch their progress bar fill, build streaks, and (optionally) earn points.

<img width="1222" height="776" alt="image" src="https://github.com/user-attachments/assets/08912522-9367-49aa-9803-5c35b439d89e" />


---

## Features

**For kids**
- Profile picker on launch ("Who's doing chores?") with each child's emoji avatar
- Big, tappable checklist; tap again to uncheck
- **All** view groups today's items by column and sinks finished items to the bottom
- Progress bars for the whole day (in the header) and for each column
- 🔥 Daily streak counter and ⭐ points balance in the header
- Confetti celebration when every required item in a column is done

**For parents (PIN-protected)**
- Unlimited children, each with their own name, emoji avatar, accent color, and theme (Default, Space, Ocean, Adventure, Sunset, Minimal)
- Custom **columns** per child (e.g. Morning, Chores, School), each with an emoji icon
- **Items** with flexible schedules: every day, weekdays, weekends, specific days, once a week, or monthly (a set date or the last day of the month)
- Required vs. **optional/bonus** items; optional items never block progress or streaks
- Per-item point values, with points only awarded from columns marked *points eligible*
- Manually edit or reset streaks, award or deduct points with a note
- **Vacation mode** pauses a child's streak so a trip doesn't break it
- Inline **Edit mode** on the kid dashboard for quick changes without leaving the screen
- Configurable 4-digit PIN with lockout after 5 wrong attempts

## Tech Stack

| Layer    | Technology                                                                 |
|----------|----------------------------------------------------------------------------|
| Backend  | Node.js, Express 4                                                         |
| Database | SQLite via `better-sqlite3` (WAL mode, foreign keys enforced)              |
| Frontend | Vanilla JavaScript single-page app (no framework, no build step), plain CSS |
| Deploy   | Docker + Docker Compose                                                    |

---

## Installation

There are two ways to run it. Docker is recommended because it handles the Node version and native SQLite driver for you.

### Option A: Docker (recommended)

**Prerequisites:** Docker and Docker Compose v2.

1. **Clone the repo**

   ```bash
   git clone https://github.com/zipzyzap/choresApp.git
   cd choresApp
   ```

2. **Create a `.env` file.** Compose requires this file to exist, and it is gitignored, so a fresh clone won't have one. It can be empty:

   ```bash
   touch .env
   ```

   > Leave `PORT` out of `.env` when using Docker. The container must listen on 3000 because that's what the port mapping points at. To change the port you visit in the browser, edit the left side of `ports:` in `docker-compose.yml` (default `3006:3000`).

3. **Build and start**

   ```bash
   docker compose up -d --build
   ```

4. **Open the app** at `http://localhost:3006`, or `http://<server-ip>:3006` from a tablet or phone on the same network.

The database is created automatically on first start at `./data/chores.db`.

### Option B: Run directly with Node

**Prerequisites:** Node.js 20 and npm.

> **Why Node 20?** The pinned `better-sqlite3` 9.x only ships prebuilt binaries up through Node 20/21. On Node 22 or newer, `npm install` falls back to compiling SQLite from source, which requires Python 3, `make`, and a C++ compiler. If you have those installed, newer Node versions work too.

1. **Clone and install**

   ```bash
   git clone https://github.com/zipzyzap/choresApp.git
   cd choresApp
   npm install
   ```

2. **Create the data folder.** The server will crash on startup with `Cannot open database because the directory does not exist` if this is missing:

   ```bash
   mkdir data
   ```

3. **(Optional) Set a port** in `.env` (defaults to 3000):

   ```bash
   echo "PORT=3000" > .env
   ```

4. **Start the server**

   ```bash
   npm start        # normal run
   npm run dev      # auto-restarts when files change (nodemon)
   ```

5. **Open** `http://localhost:3000`.

---

## First-Time Setup (Parents)

The app starts empty. Here's how to get your first child set up.

### 1. Open Parent Settings and change the PIN

On the profile picker, tap **⚙️ Parent Settings** and enter the default PIN: **`1234`**.

<img width="549" height="1072" alt="image" src="https://github.com/user-attachments/assets/d35ce900-adb9-45c7-ad13-34f57a4c0e00" />


Under **App Settings**, enter a new 4-digit PIN and tap **Save Settings**. Do this before anything else.

<img width="1140" height="891" alt="image" src="https://github.com/user-attachments/assets/261856f0-e161-436a-9ab4-ae8ce0ef74d0" />


### 2. Add a child

Tap **+ Add Child** and fill in:

| Field                     | What it does                                                           |
|---------------------------|------------------------------------------------------------------------|
| Name                      | Shown on the profile picker and header                                 |
| Avatar (emoji)            | Any emoji; appears on their profile card                               |
| Accent color              | Colors their dashboard highlights and profile card border             |
| Theme                     | Background style for their dashboard                                   |
| Enable rewards/points     | Shows the ⭐ points balance and awards points for completed items       |

Tap **Save**, then tap **Edit** next to the child you just created.

### 3. Add columns

At the bottom of the child's edit page, tap **+ Add Column**. A column is a group of related items, such as *Morning Routine*, *Chores*, or *Homework*.

- **Icon:** any emoji; shown in the sidebar
- **Points eligible:** only items in points-eligible columns award points (and only if the child has rewards turned on)

### 4. Add items to each column

Open a column and add items. Each item has:

| Field                  | Options                                                                                           |
|------------------------|---------------------------------------------------------------------------------------------------|
| Name                   | e.g. "Make bed", "Feed the dog"                                                                   |
| Frequency              | Every day · Weekdays (Mon–Fri) · Weekends (Sat–Sun) · Specific days · Once a week · Monthly       |
| Points value           | 0–100; awarded when checked off (points-eligible columns only)                                    |
| Optional / bonus item  | Optional items are shown but don't count toward progress, streaks, or the celebration             |

Items only appear on the days their schedule says they're due.

<img width="594" height="764" alt="image" src="https://github.com/user-attachments/assets/e2b0ed15-13ea-46aa-9d3a-43d0033d1412" />


> **Shortcut:** Once a child has a dashboard, you can also make changes in place. Open the child's dashboard, tap their name in the header, choose **✏️ Edit chores**, and enter the PIN. You'll see an Edit Mode banner; tap items to edit them, use **+** to add, and tap **Done** when finished.
> 
<img width="806" height="1176" alt="image" src="https://github.com/user-attachments/assets/3c0a00a1-7cc6-4862-944f-d8fb33e1ec47" />


---

## Daily Use (Kids)

1. **Pick your profile** on the "Who's doing chores?" screen.

<img width="713" height="521" alt="image" src="https://github.com/user-attachments/assets/510e131d-8b94-4b0c-8730-b93bc58e3bee" />


2. **Check things off.** You land on the **All** view, which shows everything due today, grouped by column. Tap a column in the left sidebar to see just that list with its own progress bar.
3. **Tap an item** to mark it done. Tap it again to undo (any points it earned are taken back).
4. **Finish a column** to trigger the celebration.

5. **Switch kids** by tapping your name in the header and choosing another child or **👤 Switch child**.

### How streaks and points work

- **Streak 🔥:** goes up by one on each day the child finishes *all* required items due that day, across all columns. Optional items don't count.
- **Vacation mode:** while on, the streak is frozen and won't change.
- **Points ⭐:** each required or optional item in a points-eligible column adds its point value when checked, and removes it when unchecked. Points never go below zero.

---

## Parent Tools

Open **Parent Settings → Edit** on any child to reach the **Manage** panel:

| Tool            | What it does                                                             |
|-----------------|--------------------------------------------------------------------------|
| Streak → Edit   | Set the streak to any number                                             |
| Streak → Reset  | Set the streak back to 0                                                 |
| + Award / − Deduct | Add or remove points, with an optional reason (logged in the database) |
| Vacation Mode   | Pause/resume the child's streak                                          |
| Delete Child    | Removes the child and all of their columns, items, and history           |

<img width="1159" height="845" alt="image" src="https://github.com/user-attachments/assets/dc999ce6-d52f-4a7f-b457-bda899041697" />


**Danger Zone → Reset All Data** wipes every child, column, item, and setting (including your PIN, which returns to `1234`). It asks for the PIN to confirm.

---

## Security

This app is designed to run **on your home network only.** Please do not expose it directly to the internet.

- The API has no authentication. The PIN keeps kids out of the settings screens, but anyone who can reach the server can call the API directly.
- `GET /api/settings` returns the current PIN in plain text.
- The 5-attempt PIN lockout runs in the browser, so refreshing the page resets it.

If you need remote access, put it behind a VPN (e.g. Tailscale or WireGuard) or a reverse proxy with its own authentication.

---

## Backups & Updates

### Backing up

All data lives in the `data/` folder. Because SQLite runs in WAL mode, you'll see three files: `chores.db`, `chores.db-wal`, and `chores.db-shm`.

- **Safest (while running; requires the `sqlite3` command-line tool):**

  ```bash
  sqlite3 data/chores.db ".backup 'chores-backup.db'"
  ```

- **Or stop the app first**, then copy the whole `data/` folder:

  ```bash
  docker compose stop
  cp -r data data-backup-$(date +%F)
  docker compose start
  ```

Copying only `chores.db` while the app is running can miss recent changes that are still in the `-wal` file.

### Updating

```bash
git pull
```

With Docker, the `private/` and `public/` folders are mounted into the container and nodemon restarts the server automatically when they change. If `package.json` changed, rebuild:

```bash
docker compose up -d --build
```

---

## Known Issues

- **Evening date rollover:** the frontend calculates "today" in UTC. In US time zones, the checklist rolls over to the next day in the evening (e.g. 7 PM Central during daylight time), not at midnight.
- **"Day resets at" setting** is saved but not yet used.
- **Missed days don't reset streaks automatically;** use Streak → Reset in the Manage panel.
- **Rewards shop:** the API supports creating rewards and letting kids redeem points for them, but there is no screen for it yet.

---

## API Reference

All endpoints are under `/api` and use JSON.

| Method | Endpoint                          | Description                                         |
|--------|-----------------------------------|-----------------------------------------------------|
| GET    | `/children`                       | List all children                                   |
| GET    | `/children/:id`                   | Get one child                                       |
| POST   | `/children`                       | Create a child (`name` required)                    |
| PATCH  | `/children/:id`                   | Update child fields                                 |
| DELETE | `/children/:id`                   | Delete a child and all their data                   |
| GET    | `/columns?child_id=`              | List a child's visible columns                      |
| POST   | `/columns`                        | Create a column (`child_id`, `name` required)       |
| PATCH  | `/columns/:id`                    | Update a column                                     |
| DELETE | `/columns/:id`                    | Delete a column and its items                       |
| GET    | `/items?column_id=`               | List items in a column                              |
| POST   | `/items`                          | Create an item (`column_id`, `name` required)       |
| PATCH  | `/items/:id`                      | Update an item                                      |
| DELETE | `/items/:id`                      | Delete an item                                      |
| GET    | `/completions?child_id=&date=`    | Completions for a child on a date (`YYYY-MM-DD`)    |
| POST   | `/completions`                    | Mark an item done; awards points, updates streak    |
| DELETE | `/completions`                    | Un-mark an item; removes points                     |
| GET    | `/completions/log?child_id=&limit=` | Recent completion history                         |
| GET    | `/rewards?child_id=`              | List a child's active rewards                       |
| POST   | `/rewards`                        | Create a reward                                     |
| PATCH  | `/rewards/:id`                    | Update a reward                                     |
| DELETE | `/rewards/:id`                    | Delete a reward                                     |
| POST   | `/rewards/:id/redeem`             | Spend a child's points on a reward                  |
| GET    | `/settings`                       | All app settings                                    |
| PATCH  | `/settings`                       | Update settings                                     |
| POST   | `/settings/verify-pin`            | Check a PIN                                         |
| POST   | `/settings/adjust-points`         | Award (+) or deduct (−) points with a note          |
| POST   | `/settings/reset`                 | Wipe and rebuild the database (PIN required)       |

---

## Project Structure

```
choresApp/
├── private/                  # Server (never served to the browser)
│   ├── server.js             # Express entry point
│   ├── database.js           # SQLite schema, seed defaults, reset
│   └── routes/               # One file per API resource
│       ├── children.js
│       ├── columns.js
│       ├── items.js
│       ├── completions.js
│       ├── rewards.js
│       └── settings.js
├── public/                   # Static frontend (served as-is)
│   ├── index.html
│   ├── css/                  # reset, variables, layout, components, themes, animations
│   └── js/
│       ├── api.js            # All fetch() calls live here
│       ├── state.js          # Central app state with change listeners
│       ├── router.js         # Screen switching; boots the app
│       ├── children.js       # Profile picker + header switcher
│       ├── dashboard.js      # Header, sidebar, progress, edit mode
│       ├── columns.js        # Checklist rendering + tap-to-complete
│       ├── settings*.js      # PIN gate and parent settings screens
│       ├── themes.js
│       ├── animations.js
│       └── utils.js
├── data/                     # SQLite database (created at runtime, gitignored)
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

Built by [@zipzyzap](https://github.com/zipzyzap).
