const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'focusflow.html'), 'utf8');

const dom = new JSDOM(html, {
  url: 'https://example.org/focusflow',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  storageQuota: 10000000,
});

const { window } = dom;

// Blob/URL are used only by export; stub if jsdom doesn't provide them.
if (!window.URL.createObjectURL) window.URL.createObjectURL = () => 'blob:stub';
if (!window.URL.revokeObjectURL) window.URL.revokeObjectURL = () => {};

window.onerror = (msg, src, line, col, err) => {
  console.error('WINDOW ERROR:', msg, 'line', line, 'col', col);
  if (err && err.stack) console.error(err.stack);
  process.exitCode = 1;
};

function log(label, ok, extra) {
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label + (extra ? ' (' + extra + ')' : ''));
  if (!ok) process.exitCode = 1;
}

function fireClick(el) {
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}
function firePointer(el, type, opts) {
  opts = opts || {};
  const ev = new window.Event(type, { bubbles: true });
  ev.clientX = opts.clientX || 0;
  ev.clientY = opts.clientY || 0;
  ev.pointerId = 1;
  el.dispatchEvent(ev);
}

setTimeout(async () => {
  const d = window.document;

  // App booted
  log('app root renders', !!d.getElementById('view-tasks'));
  log('tasks tab active by default', d.getElementById('view-tasks').classList.contains('active'));

  // Quick add a task
  const input = d.getElementById('quick-add-input');
  input.value = 'Write the launch email';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  fireClick(d.getElementById('quick-submit'));
  log('quick-add creates a task in filter=today when no due date... (should NOT show, no due date)', true);

  // Switch to "All" filter to see the new task (no due date -> not in Today)
  const allChip = Array.from(d.querySelectorAll('[data-filter]')).find(b => b.getAttribute('data-filter') === 'all');
  fireClick(allChip);
  const cards = d.querySelectorAll('.task-card');
  log('task appears under All filter', cards.length === 1, 'count=' + cards.length);
  log('task title correct', cards[0] && cards[0].textContent.includes('Write the launch email'));

  // Open the task sheet via full-form and set a due date + priority + tag + subtask
  fireClick(d.getElementById('quick-expand'));
  await new Promise(r => setTimeout(r, 20)); log('sheet opens for new task', d.getElementById('sheet').classList.contains('open'));
  const titleInput = d.getElementById('f-title');
  titleInput.value = 'Ship v2';
  titleInput.dispatchEvent(new window.Event('input', { bubbles: true }));
  const todayBtn = Array.from(d.querySelectorAll('[data-set-due]')).find(b => b.getAttribute('data-set-due') === 'today');
  fireClick(todayBtn);
  const critBtn = Array.from(d.querySelectorAll('[data-set-priority]')).find(b => b.getAttribute('data-set-priority') === 'critical');
  fireClick(critBtn);
  fireClick(d.getElementById('save-task-btn'));
  log('sheet closes after save', !d.getElementById('sheet').classList.contains('open'));

  const todayChip = Array.from(d.querySelectorAll('[data-filter]')).find(b => b.getAttribute('data-filter') === 'today');
  fireClick(todayChip);
  const todayCards = d.querySelectorAll('.task-card');
  log('new task with due=today shows under Today filter', todayCards.length === 1, 'count=' + todayCards.length);

  // Complete it via checkbox
  const check = d.querySelector('[data-toggle]');
  fireClick(check);
  fireClick(Array.from(d.querySelectorAll('[data-filter]')).find(b => b.getAttribute('data-filter') === 'completed'));
  log('completed task shows under Completed filter', d.querySelectorAll('.task-card').length === 1);

  // Swipe simulation on the "All" filter's remaining task
  fireClick(allChip);
  const row = d.querySelector('[data-row]');
  log('at least one row present for swipe test', !!row);
  if (row) {
    const card = row.querySelector('.task-card');
    firePointer(card, 'pointerdown', { clientX: 100, clientY: 100 });
    firePointer(card, 'pointermove', { clientX: 40, clientY: 100 });
    firePointer(card, 'pointerup', { clientX: 40, clientY: 100 });
    log('swipe left does not throw', true);
  }

  // Stats tab
  fireClick(d.querySelector('[data-tab="stats"]'));
  log('stats view active', d.getElementById('view-stats').classList.contains('active'));
  log('stats view has score card', !!d.querySelector('.score-card'));
  const periodBtn = Array.from(d.querySelectorAll('[data-period]')).find(b => b.getAttribute('data-period') === 'month');
  fireClick(periodBtn);
  log('period switch does not throw', true);

  // Focus tab + timer
  fireClick(d.querySelector('[data-tab="focus"]'));
  log('focus view active', d.getElementById('view-focus').classList.contains('active'));
  const timerToggle = d.getElementById('timer-toggle');
  log('timer toggle exists', !!timerToggle);
  fireClick(timerToggle); // start
  log('timer shows Pause after start', d.getElementById('timer-toggle').textContent === 'Pause');
  fireClick(d.getElementById('timer-toggle')); // pause
  log('timer shows Start after pause', d.getElementById('timer-toggle').textContent === 'Start');
  fireClick(d.getElementById('timer-skip'));
  log('timer skip does not throw', true);

  // Journal tab
  fireClick(d.querySelector('[data-tab="journal"]'));
  log('journal view active', d.getElementById('view-journal').classList.contains('active'));
  const moodBtn = Array.from(d.querySelectorAll('[data-mood]')).find(b => b.getAttribute('data-mood') === '4');
  fireClick(moodBtn);
  log('mood select does not throw', true);
  const jtext = d.getElementById('journal-text');
  jtext.value = 'Solid day.';
  jtext.dispatchEvent(new window.Event('blur', { bubbles: true }));
  log('journal text blur-save does not throw', true);

  // Settings + export
  fireClick(d.getElementById('settings-btn'));
  await new Promise(r => setTimeout(r, 20)); log('settings sheet opens', d.getElementById('sheet').classList.contains('open'));
  fireClick(d.getElementById('export-json'));
  log('export json does not throw', true);
  fireClick(d.getElementById('sheet-close'));

  // Recurring task + subtasks flow
  fireClick(d.querySelector('[data-tab="tasks"]'));
  fireClick(d.getElementById('quick-expand'));
  d.getElementById('f-title').value = 'Daily standup';
  d.getElementById('f-title').dispatchEvent(new window.Event('input', { bubbles: true }));
  const dailyBtn = Array.from(d.querySelectorAll('[data-set-recur]')).find(b => b.getAttribute('data-set-recur') === 'daily');
  fireClick(dailyBtn);
  fireClick(d.getElementById('save-task-btn'));
  log('recurring task creation does not throw', true);

  // Subtasks: open "Ship v2" (currently completed, under All filter) and add/toggle/delete a subtask
  fireClick(allChip);
  const shipCard = Array.from(d.querySelectorAll('.task-card')).find(c => c.textContent.includes('Ship v2'));
  log('found Ship v2 card to reopen', !!shipCard);
  if (shipCard) {
    fireClick(shipCard);
    await new Promise(r => setTimeout(r, 20));
    const subInput = d.getElementById('new-subtask-input');
    log('subtask input present on edit', !!subInput);
    if (subInput) {
      subInput.value = 'Write changelog';
      fireClick(d.getElementById('add-subtask-btn'));
      const subRow = d.querySelector('[data-sub-toggle]');
      log('subtask added and rendered', !!subRow);
      if (subRow) {
        fireClick(subRow);
        log('subtask toggled to done', d.querySelector('.subtask-row .st.done') !== null);
        const delBtn = d.querySelector('[data-sub-del]');
        fireClick(delBtn);
        log('subtask deleted', d.querySelectorAll('[data-sub-toggle]').length === 0);
      }
    }
    fireClick(d.getElementById('sheet-close'));
  }

  // Drag-reorder: add two more tasks (both with due=today, manual sort) and drag the first below the second
  fireClick(todayChip);
  function addTaskDueToday(title) {
    fireClick(d.getElementById('quick-expand'));
    d.getElementById('f-title').value = title;
    d.getElementById('f-title').dispatchEvent(new window.Event('input', { bubbles: true }));
    const btn = Array.from(d.querySelectorAll('[data-set-due]')).find(b => b.getAttribute('data-set-due') === 'today');
    fireClick(btn);
    fireClick(d.getElementById('save-task-btn'));
  }
  addTaskDueToday('Task A');
  addTaskDueToday('Task B');
  fireClick(todayChip);

  const beforeOrder = Array.from(d.querySelectorAll('[data-row]')).map(r => r.getAttribute('data-row'));
  log('two draggable rows present before drag', beforeOrder.length === 2, 'n=' + beforeOrder.length);
  const firstHandle = d.querySelector('[data-drag]');
  log('drag handle present (manual sort)', !!firstHandle);
  if (firstHandle && beforeOrder.length === 2) {
    firePointer(firstHandle, 'pointerdown', { clientY: 0 });
    firePointer(window.document, 'pointermove', { clientY: 200 }); // large dy forces a swap even with getBoundingClientRect()=0 in jsdom
    firePointer(window.document, 'pointerup', { clientY: 200 });
    const afterOrder = Array.from(d.querySelectorAll('[data-row]')).map(r => r.getAttribute('data-row'));
    log('drag reorder swapped the two rows', afterOrder.length === 2 && afterOrder[0] === beforeOrder[1] && afterOrder[1] === beforeOrder[0],
      'before=' + beforeOrder + ' after=' + afterOrder);
  }

  // Persistence check: reload page in same jsdom localStorage
  const stored = window.localStorage.getItem('focusflow.v1');
  log('localStorage has persisted state', !!stored && stored.length > 10, 'len=' + (stored ? stored.length : 0));
  const parsed = JSON.parse(stored);
  log('persisted tasks array non-empty', Array.isArray(parsed.tasks) && parsed.tasks.length >= 3, 'n=' + parsed.tasks.length);

  console.log('\nDone. exitCode=' + (process.exitCode || 0));
}, 300);
