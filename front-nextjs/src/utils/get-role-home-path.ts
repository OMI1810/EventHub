import { ADMIN_PAGES } from '@/config/pages/admin.config'
import { DASHBOARD_PAGES } from '@/config/pages/dashboard.config'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { USER_PAGES } from '@/config/pages/user.config'
import { TRole } from '@/types/user.types'

export function getRoleHomePath(role?: TRole | null) {
	switch (role) {
		case 'USER':
			return USER_PAGES.HOME
		case 'ADMIN':
			return ADMIN_PAGES.HOME
		case 'ORGANIZATOR':
			return DASHBOARD_PAGES.ORGANIZATION
		case 'TURNIKET':
			return '/turniket'
		default:
			return PUBLIC_PAGES.LOGIN
	}
}
