import { DASHBOARD_PAGES } from '@/config/pages/dashboard.config'
import { redirect } from 'next/navigation'

export default function Page() {
	redirect(DASHBOARD_PAGES.ORGANIZATION)
}
