# Holiday planner

A staff leave-booking app built with Vue 3, Pinia and Vue Router. This is the
reference version that accompanies GUIDE.md — build it yourself from the guide,
then compare.

## Run it

```bash
npm install
npm run dev
```

## What's in it

- A wall-planner grid: people down the side, days across, coloured bars for leave
- Working-day maths that skips weekends and Scottish bank holidays
- A booking form that projects the remaining allowance as you type and refuses
  to overdraw it
- An approval queue; approving a request updates balances everywhere at once
- A per-person page on its own URL, lazily loaded
- State in a Pinia store, persisted to localStorage

## Vue concepts by file

| Concept | Where to look |
|---|---|
| props, `v-for`, `:class`, `:style` | `components/PlannerGrid.vue` |
| `reactive`, `computed`, `watch`, validation | `components/RequestForm.vue` |
| custom `v-model` | `components/MonthNav.vue` |
| named slots | `components/RequestCard.vue` |
| store state / getters / actions | `stores/holidays.js` |
| routes, params, lazy loading | `router/index.js`, `views/PersonView.vue` |

Data is seeded on first run and saved in your browser. "Reset to sample data"
in the footer puts it back.
