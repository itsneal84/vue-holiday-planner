<script setup>
import { computed } from 'vue'
import { daysInMonth } from '@/lib/dates'

const props = defineProps({
  year:  { type: Number, required: true },
  month: { type: Number, required: true }
})

const days = computed(() => daysInMonth(props.year, props.month))
</script>