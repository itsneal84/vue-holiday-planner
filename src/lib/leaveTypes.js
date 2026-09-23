export const LEAVE_TYPES = {
  annual:   { label: 'Annual leave', colour: 'var(--annual)',   counts: true  },
  sick:     { label: 'Sick leave',   colour: 'var(--sick)',     counts: false },
  parental: { label: 'Parental',     colour: 'var(--parental)', counts: false },
  unpaid:   { label: 'Unpaid',       colour: 'var(--unpaid)',   counts: false }
}

export const leaveTypeList = Object.entries(LEAVE_TYPES)
  .map(([key, value]) => ({ key, ...value }))