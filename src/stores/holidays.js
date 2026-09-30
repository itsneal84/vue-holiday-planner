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

export const useHolidayStore = defineStore('holidays', () => {
  const holidays = ref([])
  const employees = ref([])

  const addHoliday = (holiday) => {
    holidays.value.push(holiday)
  }

  const removeHoliday = (holiday) => {
    holidays.value = holidays.value.filter(h => h.id !== holiday.id)
  }

  return { holidays, employees, addHoliday, removeHoliday }
})
