import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { workingDays, today, fromYmd } from '@/lib/dates'
import { LEAVE_TYPES } from '@/lib/leaveTypes'

const STORAGE_KEY = 'holiday-planner-v1'

const SEED_STAFF = [
  { id: 1, name: 'Alice', role: 'Developer', allowance: 28 },
  { id: 2, name: 'Bob', role: 'Developer', allowance: 28 },
  { id: 3, name: 'Charlie', role: 'Developer', allowance: 28 },
]

const SEED_REQUESTS = [
  { id: 101, staffId: 1, start: '2026-09-21', end: '2026-09-25', type: 'annual',   status: 'approved', note: '' },
  { id: 102, staffId: 3, start: '2026-09-28', end: '2026-10-02', type: 'annual',   status: 'pending',  note: 'Sister is getting married in Pune.' },
  { id: 103, staffId: 4, start: '2026-09-16', end: '2026-09-17', type: 'sick',     status: 'approved', note: '' },
  { id: 104, staffId: 2, start: '2026-09-30', end: '2026-09-30', type: 'unpaid',   status: 'pending',  note: 'Moving flat.' },
  { id: 105, staffId: 5, start: '2026-09-07', end: '2026-09-11', type: 'parental', status: 'approved', note: '' }
]

function loadSaved () {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    // Storage can be blocked (private mode, strict browser settings).
    // Falling back to seed data keeps the app usable.
    return null
  }
}

/**
 * A "setup store": the body works exactly like a component's <script setup>.
 * ref()      -> state
 * computed() -> getters
 * function   -> actions
 */
export const useHolidayStore = defineStore('holidays', () => {
  const saved = loadSaved()

  /* ---------- state ---------- */
  const staff = ref(saved?.staff ?? SEED_STAFF)
  const requests = ref(saved?.requests ?? SEED_REQUESTS)

  /* ---------- getters ---------- */

  /** Requests that have been signed off, i.e. the ones that really block time. */
  const approved = computed(() =>
    requests.value.filter(request => request.status === 'approved')
  )

  const pending = computed(() =>
    requests.value.filter(request => request.status === 'pending')
  )

  const decided = computed(() =>
    requests.value.filter(request => request.status !== 'pending')
  )

  /** { staffId: daysRemaining } — the number the whole app leans on. */
  const balances = computed(() => {
    const result = {}
    for (const person of staff.value) {
      const used = approved.value
        .filter(request =>
          request.staffId === person.id && LEAVE_TYPES[request.type].counts)
        .reduce((total, request) =>
          total + workingDays(request.start, request.end), 0)
      result[person.id] = person.allowance - used
    }
    return result
  })

  const offToday = computed(() => {
    const now = today()
    return approved.value.filter(r => r.start <= now && now <= r.end)
  })

  /* ---------- lookups ---------- */

  function personById (id) {
    return staff.value.find(person => person.id === Number(id))
  }

  function requestsFor (staffId) {
    return requests.value
      .filter(request => request.staffId === Number(staffId))
      .slice()
      .sort((a, b) => a.start.localeCompare(b.start))
  }

  /**
   * The booking covering one person on one day, if any.
   * Declined requests are ignored so they vanish from the planner.
   */
  function bookingOn (staffId, ymd) {
    return requests.value.find(request =>
      request.staffId === staffId &&
      request.status !== 'declined' &&
      request.start <= ymd && ymd <= request.end
    )
  }

  /** Who else in the company is off across this range? */
  function clashesWith (staffId, start, end) {
    return approved.value.filter(request =>
      request.staffId !== staffId &&
      request.start <= end && start <= request.end
    )
  }

  /* ---------- actions ---------- */

  function book (draft) {
    requests.value.push({
      id: Date.now(),
      status: 'pending',
      ...draft
    })
  }

  function decide (id, status) {
    const request = requests.value.find(request => request.id === id)
    if (request) request.status = status
  }

  function remove (id) {
    requests.value = requests.value.filter(request => request.id !== id)
  }

  function reset () {
    staff.value = structuredClone(SEED_STAFF)
    requests.value = structuredClone(SEED_REQUESTS)
  }

  /* ---------- persistence ----------
     deep: true is essential. Approving a request mutates an object *inside*
     the array, and a shallow watcher would never notice. */
  watch([staff, requests], () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        staff: staff.value,
        requests: requests.value
      }))
    } catch (error) {
      // Nothing to do — the app still works, it just won't survive a reload.
    }
  }, { deep: true })

  return {
    staff, requests,
    approved, pending, decided, balances, offToday,
    personById, requestsFor, bookingOn, clashesWith,
    book, decide, remove, reset
  }
})
