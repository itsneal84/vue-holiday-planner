<script setup>
import { computed } from 'vue'
import { daysInMonth } from '@/lib/dates'

const props = defineProps({
  year:  { type: Number, required: true },
  month: { type: Number, required: true }
})

const days = computed(() => daysInMonth(props.year, props.month))
</script>

<template>
  <div class="planner">
    <div class="grid" :style="{ '--days': days.length }">
      <div class="row head">
        <div class="who">Who</div>
        <div v-for="day in days" :key="day" class="daycell":class="{ closed: day.closed, today: day.isToday }">
          <span class="daynum">{{ day.number }}</span>
          <span class="dayletter">{{ day.letter }}</span>
        </div>
        <div class="left">Left</div>
      </div>

      <div v-for="person in store.staff" :key="person.id" class="row">
        <button class="who" @click="open(person)">{{ person.name }}
          <small>{{person.role}}</small>
        </button>

        <div v-for="day in days" :key="day.ymd" class="daycell":class="{ closed: day.closed, today: day.isToday }">
          <template v-if="!day.closed">
            <span v-if="store.bookingOn(person.id, day.ymd)"
              class="bar"
              :class="barClass(store.bookingOn(person.id, day.ymd), day.ymd)"
              :style="{ '--type-colour': LEAVE_TYPES[store.bookingOn(person.id, day.ymd).type].colour }"
              :title="person.name + ' - ' + LEAVE_TYPES[store.bookingOn(person.id, day.ymd).type].label"
            />
          </template>
        </div>

        <div class="left" :class="{ low: store.balances(person.id) <= 3 }">{{ store.left(person.id) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.planner {
  margin-top: 26px;
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: 6px;
  overflow: auto;
}

.grid {
  min-width: 720px;
}

.row {
  display: grid;
  grid-template-columns: 148px repeat(var(--days), minmax(19px, 1fr)) 64px;
  border-bottom: 1px solid var(--rule-soft);
}

.row:last-child {
  border-bottom: none;
}

.row.head{
  border-bottom: 1px solid var(--rule);
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 2;
}

.daynum {
  display: block;
  text-align: center;
  font-size: 11px;
  padding: 7px 0 3px;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

.dayletter {
  display: block;
  text-align: center;
  font-size: 9px;
  padding-bottom: 7px;
  color: var(--ink-soft);
}

.who {
  padding: 9px 12px;
  background: none;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  border: 0;
  border-right: 1px solid var(--rule);
  border-radius: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.who:hover {
  background: var(--tint);
}

.who small {
  display: block;
  font-weight: 400;
  font-size: 11px;
  color: var(--ink-soft);
}

.left {
  padding: 9px 8px;
  font-size: 13px;
  text-align: right;
  border-left: 1px solid var(--rule);
  font-variant-numeric: tabular-nums;
}

.left.low { color: var(--sick); font-weight: 700; }

.daycell {
  border-right: 1px solid var(--rule-soft);
  position: relative;
}

.daycell.closed { background: var(--tint); }

.daycell.today::after {
  content: "";
  position: absolute;
  inset: 0;
  border-left: 2px solid var(--ink);
}

.bar {
  position: absolute;
  inset: 4px 0;
  background: var(--type-colour);
}

.bar.start { left: 2px; border-radius: 3px 0 0 3px; }

.bar.end { right: 2px; border-radius: 0 3px 3px 0; }

/* Hatched while it is still someone's decision to make. */
.bar.pending {
  background: repeating-linear-gradient(
    -45deg, var(--type-colour) 0 3px, transparent 3px 6px
  );
  box-shadow: inset 0 0 0 1px var(--type-colour);
}
</style>