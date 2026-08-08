# FocusFlow

A dark-themed, offline-first To-Do + Performance Analysis mobile app built with **Expo (React Native) + TypeScript**.

FocusFlow helps you manage tasks, build streaks, and understand your own productivity patterns — entirely on-device, with no account and no server.

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| App framework | Expo SDK 57 (React Native 0.86, React 19) + `expo-router` | File-based routing, managed workflow, fast iteration |
| Language | TypeScript (strict mode) | Type-safe domain/data/UI boundaries |
| Local database | `expo-sqlite` (raw SQL over a small repository layer) | A real relational DB that survives app kills and device reboots — no ORM lock-in, full control over schema/migrations |
| State management | Zustand | Minimal boilerplate stores that wrap the repositories and expose actions to the UI |
| Animations | `react-native-reanimated` + `react-native-gesture-handler` | 60fps swipe actions, drag-to-reorder, timer ring, layout transitions |
| Charts | Hand-built with `react-native-svg` | No heavy charting dependency; full control over the dark-theme look |
| Haptics | `expo-haptics` | Light feedback on completes, swipes, and taps |
| Export | `expo-file-system` (new `File`/`Paths` API) + `expo-sharing` | Writes JSON/CSV to the cache dir and opens the native share sheet |

## Project structure

```
app/                          expo-router routes (screens)
  _layout.tsx                 Root layout: DB init/migrations, splash, stack navigator
  (tabs)/
    _layout.tsx                Bottom tab bar (Tasks, Stats, Focus, Journal)
    index.tsx                  Tasks screen (filters, sort, swipe actions, quick add)
    stats.tsx                  Performance dashboard
    focus.tsx                  Daily goals + Pomodoro timer
    journal.tsx                Daily reflection journal
  task/
    new.tsx                    Create-task modal screen
    [id].tsx                   Edit-task modal screen (+ subtasks, delete)
  settings.tsx                 Export data, app info

src/
  domain/                      Pure business logic (no React, no SQL)
    models.ts                  Task/Subtask/Tag/JournalEntry/PomodoroSession/DailyGoal types
    stats.ts                   Completion rate, streaks, breakdowns, heatmap, insights
    productivityScore.ts        Weighted productivity score formula
    recurrence.ts               Recurring-task instance generation

  data/                         Persistence layer
    db/client.ts                SQLite connection (WAL mode)
    db/migrations.ts            Versioned schema migrations (PRAGMA user_version)
    repositories/                One repository per aggregate (tasks, tags, journal,
                                  pomodoro, goals, settings) — the only files that touch SQL

  store/                        Zustand stores — bridge between repositories and UI
    useTaskStore.ts, useTagStore.ts, useJournalStore.ts,
    usePomodoroStore.ts, useGoalStore.ts

  components/
    ui/                         Design-system primitives (Button, Card, Chip, Sheet, …)
    tasks/                      TaskCard, SwipeableRow, TaskList (drag + swipe), TaskForm, …
    charts/                     StatCard, TrendChart, DonutChart, HeatmapCalendar, InsightCard
    focus/                      PomodoroRing
    journal/                    JournalEditor

  theme/                        Dark color palette, spacing, typography tokens
  utils/                        id generation, date helpers, haptics, export
```

This is a classic three-layer split: **domain** (pure functions, fully unit-testable, zero dependencies), **data** (SQLite access, isolated behind repositories), and **UI** (screens/components that only ever talk to Zustand stores — never to SQL directly).

## Data models & local persistence

All data lives in a single SQLite database file (`focusflow.db`) opened once at app start via `expo-sqlite`'s synchronous API, with `PRAGMA journal_mode = WAL` for crash-safe writes and `PRAGMA foreign_keys = ON` for referential integrity. Schema changes are applied through a small versioned migration runner (`src/data/db/migrations.ts`) that tracks `PRAGMA user_version`, so upgrading the app never touches a user's existing data.

Because SQLite writes to disk are synchronous and durable (especially under WAL), data survives:
- App restarts
- The app being killed in the background
- A full device reboot

Tables:

| Table | Purpose |
|---|---|
| `tasks` | Core task fields: title, description, priority, status, due date, estimate/actual minutes, recurrence rule (JSON), manual order index |
| `subtasks` | Child checklist items, cascade-deleted with their parent task |
| `tags` | User-defined categories with a color |
| `task_tags` | Many-to-many join between tasks and tags |
| `journal_entries` | One row per calendar day: free text + mood (1-5) |
| `pomodoro_sessions` | Logged focus sessions (task, duration, completed) |
| `daily_goals` | Per-day target task count + target focus minutes |
| `settings` | Generic key/value store for future preferences |

Domain types in `src/domain/models.ts` mirror these tables but use camelCase, parsed JSON (e.g. `recurrence`), and hydrated relations (a `Task` object already includes its `subtasks` and `tags` arrays) — repositories do the SQL joins so the rest of the app never thinks in rows.

### Recurring tasks

A recurring task is stored as a **template** (a task with a `recurrence` rule and no fixed due date semantics). On every app launch, `findMissingRecurringInstances` (in `src/domain/recurrence.ts`) checks each template against "today" and materializes a concrete task instance (linked via `recurring_template_id`) if one doesn't already exist for that day. Templates themselves are hidden from the Today/Upcoming/Overdue views — only their generated instances show up there — but remain editable from the "All" filter.

## Core features

- **Tasks**: create/edit/delete/complete, subtasks, tags, priority (Low/Medium/High/Critical), due date + time, time estimates, recurring tasks (daily/weekdays/weekly). Swipe right to complete, swipe left to reveal Reschedule/Delete. Long-press the drag handle to reorder manually.
- **Filters & sort**: Today, Upcoming, Overdue, Completed, All — combined with priority/tag chips and 4 sort modes.
- **Stats dashboard**: Day/Week/Month/All-time views with a productivity score, completion rate, average tasks/day, current & longest streaks, a completion trend chart, priority and tag donut breakdowns, a 13-week activity heatmap, and auto-generated insight cards ("Your best day is Tuesday…").
- **Focus tab**: daily goals (target tasks + target focus minutes) with live progress bars, and a 25/5/15-minute Pomodoro timer with an animated ring, session logging, and an optional "focusing on" task picker.
- **Journal**: one entry per day with a 1-5 mood picker and free text, with quick day navigation and a recent-entries list.
- **Export**: JSON or CSV export of all tasks (plus JSON export of journal/focus/goal data), shared via the native share sheet.

## Design

Pure dark theme — no light mode. Deep charcoal backgrounds (`#0F0F11` / `#16161A`), elevated surfaces (`#1C1C21`–`#2A2A32`), high-contrast text, and an indigo/violet accent (`#7C6CF6`) paired with teal (`#2DD4BF`) for secondary accents and progress states. See `src/theme/colors.ts` for the full palette. Cards use soft rounded corners (14–28px radius), generous spacing, skeleton loaders, and empty states throughout. Light haptic feedback fires on completes, swipes, drag start, and timer transitions.

## Setup

```bash
npm install

# Start the dev server (scan the QR code with Expo Go, or press i/a for a simulator)
npm run start

# Or target a platform directly
npm run ios       # requires macOS + Xcode
npm run android    # requires Android Studio / an emulator
```

No environment variables, API keys, or backend are required — the app is fully self-contained.

### Requirements
- Node.js 20+
- Expo Go app (for quick device testing) or Xcode/Android Studio for simulators

## Screens

- **Tasks** — header with live task count and a settings gear; horizontal filter chips (Today/Upcoming/Overdue/Completed/All) and a second row for sort + priority + tag chips; a scrollable card list with swipe actions; a floating quick-add bar pinned above the tab bar.
- **Stats** — a period segmented control, a large productivity-score card, a 2×2 stat grid, a gradient bar trend chart, priority and tag donut charts with legends, a GitHub-style activity heatmap, and insight cards.
- **Focus** — two progress bars for today's task/minute goals with inline goal editors, and a Pomodoro card with an animated progress ring, phase label, session counter, and a task picker.
- **Journal** — a day switcher, a mood-emoji row, a large text area (auto-saves on blur or mood change), and a scrollable list of past entries.
- **Task detail / New task** — presented as modals: title, description, priority chips, due-date presets + native date/time picker, estimated minutes, repeat chips, tag picker with inline tag creation, subtask checklist, and (on edit) a delete button.
- **Settings** — export buttons (JSON/CSV) and a short explanation of how local storage works.
