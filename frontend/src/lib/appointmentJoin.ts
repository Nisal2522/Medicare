import type { MyAppointmentRow } from '../api/appointmentApi'

/** Video join: paid/confirmed path and doctor must have approved. */
export function canJoinVideoSession(a: MyAppointmentRow): boolean {
  if (a.status === 'CANCELLED') return false
  if (a.status === 'PENDING_PAYMENT') return false
  if ((a.doctorApprovalStatus ?? 'PENDING') !== 'APPROVED') return false
  return (
    a.status === 'CONFIRMED' ||
    a.status === 'COMPLETED' ||
    a.status === 'PENDING'
  )
}
