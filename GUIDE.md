# Build a holiday planner with Vue

A staged guide to building a staff leave-booking app from an empty folder. Each stage introduces one or two Vue ideas and ends with a check you can run in the browser. The finished project is in the same folder as this guide — treat it as the answer sheet, not the starting point.

**What you're building:** a wall-planner grid showing who's off, a booking form that counts working days and refuses to overdraw an allowance, an approval queue, and a per-person page on its own URL. State lives in Pinia and survives a reload.

**Before you start:** Node 18 or newer. Some JavaScript. You don't need prior Vue.

**How to use this:** build each stage yourself first. Open the finished file only after you have something working, or after twenty minutes of being stuck. Comparing a working thing to a better thing teaches more than copying.

---

## Stage 0 — Get a blank project running

```bash
npm create vue@latest
```

Name it `holiday-planner`. Say **yes** to Router and Pinia, **no** to everything else (TypeScript, testing, ESLint) so there's less noise while you learn.

```bash
cd holiday-planner
npm install
npm run dev
```

Then clear the decks: delete everything inside `src/components/`, `src/views/`, and `src/stores/`, empty `src/assets/main.css`, and cut `App.vue` down to a `<template>` with a heading and `<RouterView />`. The generated welcome page is scaffolding, not a foundation.

**Done when:** the browser shows your heading and no console errors.

---

## Stage 1 — Design tokens and the shell

No Vue yet. Put every colour in `src/assets/main.css` as a custom property on `:root`, and import that file in `main.js`.

```css
:root {
  --paper: #EDEFEA;
  --ink: #16202B;
  --annual: #2E7D6F;
  --sick: #9E4230;
  /* ...and so on */
}
```

Why bother: components will set `background: var(--annual)` rather than a literal hex, so adding dark mode later is one `@media (prefers-color-scheme: dark)` block instead of a search-and-replace across a dozen files.

Give `App.vue` a masthead and a centred `.shell` wrapper, and put the styles in a `<style scoped>` block at the bottom of the same file. `scoped` means those rules can't leak out and hit anything else — that's the main practical benefit of single-file components.

**Done when:** a styled page frame with your heading, and changing `--paper` changes the background.

---

## Stage 2 — Date maths, with no Vue in it

Create `src/lib/dates.js`. This is plain exported functions, and keeping it free of Vue is deliberate: it's the part most likely to have bugs, and you want to be able to reason about it without reactivity in the picture.

You need:

- `toYmd(date)` — a Date to `'2026-09-18'`
- `fromYmd(ymd)` — back again
- `isClosed(ymd)` — weekend or bank holiday
- `datesBetween(start, end)` — inclusive list of date strings
- `workingDays(start, end)` — the count that actually costs someone leave
- `daysInMonth(year, month)` — every day in a month with `{ ymd, number, letter, closed, isToday }`
- `prettyRange(start, end)` — `'21 Sep – 25 Sep'`

Also export a `CLOSED_DAYS` array of bank holidays.

**The one real trap:** `new Date('2026-09-18')` is parsed as UTC. West of Greenwich that's the 17th at 7pm, so your dates silently shift by a day. Build the Date from parts instead:

```js
const [year, month, day] = ymd.split('-').map(Number)
return new Date(year, month - 1, day)   // month is 0-indexed
```

Storing dates as `'YYYY-MM-DD'` strings throughout has a quiet bonus: they sort and compare correctly with `<` and `>`, so `request.start <= ymd && ymd <= request.end` is a valid overlap test with no Date objects involved.

**Done when:** in the browser console, `workingDays('2026-12-21','2026-12-31')` returns 7 — ten calendar days minus two weekend days and the Christmas closures.

Also create `src/lib/leaveTypes.js` exporting a `LEAVE_TYPES` object keyed by `annual`, `sick`, `parental`, `unpaid`, each with a `label`, a `colour` (a `var(--...)` string), and a `counts` boolean for whether it comes out of the allowance.

---

## Stage 3 — Your first component: the planner grid

**Concepts: props, `v-for`, `:class`, `:style`, `computed`.**

Make `src/components/PlannerGrid.vue`. For now, hardcode an array of five staff and a handful of bookings right in the file — the store comes later, and you want to see pixels before you build plumbing.

```vue
<script setup>
import { computed } from 'vue'
import { daysInMonth } from '@/lib/dates'

const props = defineProps({
  year:  { type: Number, required: true },
  month: { type: Number, required: true }
})

const days = computed(() => daysInMonth(props.year, props.month))
</script>
```

Three things to notice. `<script setup>` means every top-level binding is available in the template with no `return` statement. `defineProps` is a compiler macro — you don't import it. And `days` is `computed`, so it recalculates when `year` or `month` changes and caches otherwise.

For layout, one CSS grid per row with the day count passed in as a custom property:

```vue
<div class="grid" :style="{ '--days': days.length }">
```

```css
.row {
  display: grid;
  grid-template-columns: 148px repeat(var(--days), minmax(19px, 1fr)) 64px;
}
```

Name column, one column per day, allowance column. Because every row uses the same template, the columns line up without you calculating a single width.

Then nest two `v-for` loops — people down, days across — and inside each cell decide whether that person is off that day. `v-for` always needs a `:key` that's stable and unique; use `person.id` and `day.ymd`.

For the coloured bar, `:class` takes an object where the key is a class name and the value is a condition:

```vue
<span
  class="bar"
  :class="{ pending: booking.status === 'pending' }"
  :style="{ '--type-colour': LEAVE_TYPES[booking.type].colour }"
/>
```

That `--type-colour` trick is worth internalising: the component sets one custom property, and the stylesheet can then use it in a solid fill, a hatched gradient, and a border, all without the component knowing anything about how it's drawn.

**Done when:** a month of columns with weekends shaded, names down the side, and coloured bars for the hardcoded bookings. Pending ones look different from approved ones.

---

## Stage 4 — Move state into a Pinia store

**Concepts: shared state, getters, actions.**

Three components are about to need the same list of requests. Passing it down through props would work; passing every change back up through events would get tedious. That's what a store is for.

`src/stores/holidays.js`, written in setup style so it reads like a component:

```js
export const useHolidayStore = defineStore('holidays', () => {
  const staff = ref(SEED_STAFF)         // state
  const requests = ref(SEED_REQUESTS)

  const pending = computed(() =>        // getter
    requests.value.filter(r => r.status === 'pending')
  )

  function decide (id, status) {        // action
    const request = requests.value.find(r => r.id === id)
    if (request) request.status = status
  }

  return { staff, requests, pending, decide }
})
```

`ref` is state, `computed` is a getter, a function is an action. There is no third concept.

Build these getters: `approved`, `pending`, `decided`, and `balances`. **`balances` is the keystone of the whole app** — an object of `{ staffId: daysRemaining }`, worked out by taking each person's allowance and subtracting the working days of every approved request whose leave type has `counts: true`.

Get it right and you never write update code again. The number in the grid's "Left" column, the projection in the booking form, and the overdraw warning all read the same computed value, so approving a request updates all three at once. That's the moment Vue starts paying you back.

Add these lookups too: `personById(id)`, `requestsFor(staffId)`, `bookingOn(staffId, ymd)`, and `clashesWith(staffId, start, end)`. Then actions: `book(draft)`, `decide(id, status)`, `remove(id)`, `reset()`.

Now rewire `PlannerGrid` to call `useHolidayStore()` and drop its hardcoded arrays. Note what stays as props: `year` and `month`. Those are about *this particular grid*, not about the company, so they don't belong in the store. Deciding what is and isn't store-worthy is most of the skill here.

**Done when:** the grid renders identically, but from the store.

---

## Stage 5 — The booking form

**Concepts: `v-model`, `reactive`, `computed`, `watch`.**

`src/components/RequestForm.vue`. Hold the draft in a single `reactive` object rather than five separate refs:

```js
const form = reactive({
  staffId: store.staff[0]?.id ?? null,
  start: today(),
  end: today(),
  type: 'annual',
  note: ''
})
```

Bind each field with `v-model="form.start"` and so on. `v-model` on an `<input>` is just `:value` plus an `@input` handler — worth remembering, because you'll implement it by hand in Stage 7.

Rule of thumb for `ref` vs `reactive`: `ref` for single values, `reactive` for a related cluster like a form. With `reactive` you skip `.value`, but you must never reassign the whole object — `Object.assign(form, blank())` to reset it, not `form = blank()`.

Derive three things:

```js
const length = computed(() => workingDays(form.start, form.end))
const remaining = computed(() => store.balances[form.staffId] ?? 0)
const wouldOverdraw = computed(() =>
  LEAVE_TYPES[form.type].counts && length.value > remaining.value
)
```

Show `length` and `remaining - length` live in the form. Type a date and watch them move. Nothing subscribes, nothing listens, nothing calls a recalculate function.

Now the one place a `watch` is right:

```js
watch(() => form.start, newStart => {
  if (form.end < newStart) form.end = newStart
})
```

**The distinction to learn here:** `computed` is for "this value *is* derived from those values" — the end date isn't derived from the start date, because the user edits it freely. `watch` is for "when this changes, *do* something" — a side effect. If you find yourself writing a `watch` that only assigns to another piece of state, it probably wanted to be a `computed`.

Validate in a `submit()` function — no person selected, end before start, zero working days, would overdraw — set an `error` ref, and only call `store.book({ ...form })` when it's clean. Spread the form so the store gets a plain copy rather than a live reference to your reactive object.

**Done when:** you can book leave, it appears hatched on the grid, and trying to book 40 days of annual leave is refused.

---

## Stage 6 — The approval queue, and a component with a slot

**Concepts: reusable components, slots, `v-if` / `v-else`.**

Make `RequestCard.vue` first — one request rendered as a card, with `request` as a prop. It's about to be used in two different places that need different buttons, so instead of a `mode` prop, leave a hole:

```vue
<div v-if="$slots.actions" class="acts">
  <slot name="actions" />
</div>
```

The parent fills it:

```vue
<RequestCard :request="request">
  <template #actions>
    <button @click="store.decide(request.id, 'approved')">Approve</button>
    <button @click="store.decide(request.id, 'declined')">Decline</button>
  </template>
</RequestCard>
```

The card owns layout; the parent owns behaviour. When you next catch yourself adding a boolean prop that only switches which buttons render, reach for a slot instead.

Then `ApprovalQueue.vue`: loop `store.pending` into cards with approve and decline actions, plus a short recently-decided list underneath with an undo. Give it a real empty state — "Nothing to review. New requests land here." An empty screen should tell you what will fill it.

**Done when:** approving a request turns its bar solid on the grid and drops the allowance number, in the same tick.

---

## Stage 7 — Month navigation, and `v-model` on your own component

**Concepts: `emits`, custom `v-model`.**

`MonthNav.vue` with back, forward, and a "Today" button. The month cursor lives in the parent view (both the nav and the grid need it, so it sits at their nearest common ancestor). The nav needs to change it without mutating a prop — props are one-way, and writing to one is an error.

```js
const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])

function shift (step) {
  const date = new Date(props.modelValue.year, props.modelValue.month + step, 1)
  emit('update:modelValue', { year: date.getFullYear(), month: date.getMonth() })
}
```

The parent then writes `<MonthNav v-model="cursor" />`, which Vue expands to `:modelValue="cursor" @update:modelValue="cursor = $event"`. **That's the entire mechanism** — `v-model` is a prop named `modelValue` plus an event named `update:modelValue`. It was never magic on `<input>` either.

Use `new Date(year, month + step, 1)` to move months rather than adding to the number yourself; it rolls December into next January for free.

**Done when:** you can page through months and bookings appear in the right ones, including a booking that straddles a month boundary.

---

## Stage 8 — Routing and the person page

**Concepts: routes, route params, lazy loading.**

Move the planner into `src/views/PlannerView.vue` and leave `App.vue` as masthead plus `<RouterView />`. Then in `src/router/index.js`:

```js
routes: [
  { path: '/', name: 'planner', component: PlannerView },
  {
    path: '/person/:id',
    name: 'person',
    component: () => import('@/views/PersonView.vue'),
    props: true
  }
]
```

Two details worth understanding. The arrow function around the import makes that view its own JavaScript chunk, fetched only when someone visits the route — you'll see it as a separate file when you run `npm run build`. And `props: true` turns the `:id` segment into a normal prop, so `PersonView` doesn't need to know it's being routed to and stays testable in isolation.

The catch: route params arrive as **strings**. `/person/3` gives you `'3'`, and `'3' === 3` is false, so `find(p => p.id === props.id)` silently returns nothing. Coerce with `Number()` — this is the bug everyone hits once.

Build `PersonView.vue` with four figures across the top (days left, taken, awaiting approval, sick days), the full booking history, and a reused `RequestForm` locked to that person via a `lockedStaffId` prop. Make the names in the planner grid clickable with `router.push({ name: 'person', params: { id: person.id } })`.

Handle the missing case: `/person/99` should say so and offer a way back, not crash on `undefined.name`.

**Done when:** clicking a name navigates, the back button works, and refreshing on `/person/3` still loads the page.

---

## Stage 9 — Make it survive a reload

**Concepts: `watch` with `deep`, defensive storage.**

In the store, load once at the top and save on every change:

```js
watch([staff, requests], () => {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      staff: staff.value,
      requests: requests.value
    }))
  } catch (error) {
    // Storage can be blocked. The app still works in memory.
  }
}, { deep: true })
```

**`deep: true` is not optional here.** Approving a request mutates a property on an object *inside* an array — the array reference never changes, so a shallow watcher sees nothing and your change is never saved. If you want to feel the bug before you fix it, leave `deep` off, approve something, and reload.

Wrap both the read and the write in `try/catch`. Private browsing and strict privacy settings can make `localStorage` throw on access, and an unhandled exception in the store means a blank page rather than a mildly degraded one.

**Done when:** you book leave, reload, and it's still there. Then "Reset to sample data" puts it back.

---

## Stretch goals

In rough order of difficulty:

1. **Half days.** Add `startsAfternoon` / `endsMorning` flags and make `workingDays` return 0.5 increments. Touches your date lib, the balance getter, and the bar rendering.
2. **A year view.** Twelve month strips stacked, one row per person. Your `daysInMonth` already does the work; this is mostly a layout problem.
3. **Block the clash.** The store has `clashesWith`. Turn it from a warning into a rule: no more than two people from the same `role` off at once.
4. **Carry-over.** Five unused days roll into next year, expiring in March. Your `balances` getter becomes year-aware, which means a year in the store's state.
5. **Undo.** Keep a stack of the last few actions and add a global undo. This one will teach you more about where your mutations live than any amount of reading.
6. **A real backend.** Swap `localStorage` for `fetch`. Add `loading` and `error` refs to the store, and decide whether the UI updates optimistically or waits for the server.

---

## The five things worth taking away

**`computed` over manual updates.** If a value can be derived, derive it. Every `computed` is a bug you don't have, because there's no code path where you forgot to refresh something.

**`watch` is for side effects, not derivation.** Saving to storage, syncing a URL, firing a request. A `watch` whose only job is assigning to other state is a `computed` in disguise.

**Props down, events up — until it hurts.** Then a store. Don't start with a store, and don't cling to prop-drilling once three cousins need the same array.

**Put anything without Vue in it outside Vue.** Your date library has no reactivity, which is why it's the easiest part of the app to be confident in.

**Slots beat configuration props.** The second time you add a boolean to a component to switch its rendering, you wanted a slot.

---

## Where the reference project lives

```
src/
  main.js                   app, plugins, mount
  App.vue                   shell + <RouterView />
  router/index.js           two routes, one lazy
  stores/holidays.js        all shared state
  lib/dates.js              pure date maths
  lib/leaveTypes.js         leave kinds in one place
  components/
    PlannerGrid.vue         the wall planner
    MonthNav.vue            custom v-model
    RequestForm.vue         v-model, computed, watch
    RequestCard.vue         slots
    ApprovalQueue.vue       composition of the above
  views/
    PlannerView.vue         route: /
    PersonView.vue          route: /person/:id
```

```bash
npm install
npm run dev
```
