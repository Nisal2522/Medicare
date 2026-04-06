/** Post-login landing routes (JWT role from auth-service). */
export function getDashboardPathByRole(role: string): string {
  switch (role) {
    case 'PATIENT':
      return '/dashboard/patient'
    case 'DOCTOR':
      return '/dashboard/doctor'
    case 'ADMIN':
      return '/admin/dashboard'
    default:
      return '/'
  }
}
