# FocusFlow — web version

A single self-contained HTML file (`focusflow.html`): the same FocusFlow
concept — tasks, a stats dashboard, a Pomodoro timer, and a daily journal —
rebuilt as a plain web app after the React Native / Expo build turned out
to be incompatible with this environment's Expo Go client (SDK 57's
`expo-router` transitively depends on a native Worklets module that Expo Go
here doesn't correctly implement, regardless of package version).

## Why this version exists

No native modules, no build step, no Expo Go, no Metro. It's one HTML file
with inline CSS and vanilla JavaScript. It runs anywhere a browser runs —
open it directly, or serve it from any static file host.

## Data & persistence

Everything is stored in the browser's `localStorage` under the key
`focusflow.v1`, written synchronously on every change (no debounce, so a
completed task is never lost even if the tab closes immediately after).
Data lives entirely on-device: there's no server, no account, and nothing
is sent anywhere. It persists across reloads and browser restarts as long
as the site's storage isn't cleared.

## Running it

Just open `focusflow.html` in a browser — double-click it, or serve the
folder with any static server, e.g.:

```bash
npx serve web
```

On a phone, open the page in the browser and use "Add to Home Screen" for
an app-like icon and full-screen launch.

## Testing

The interactive logic (task CRUD, filters, swipe-to-complete, drag
reorder, subtasks, the Pomodoro timer, stats computations, and the
localStorage round-trip) is covered by a jsdom-based functional test that
actually executes the page's script against a simulated DOM rather than
just checking syntax. It isn't part of the shipped page; re-run it with:

```bash
cd web
npm install jsdom
node test.js
```
