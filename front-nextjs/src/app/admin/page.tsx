import { ADMIN_PAGES } from '@/config/pages/admin.config'
import { redirect } from 'next/navigation'

export default function Page() {
	redirect(ADMIN_PAGES.EVENTS)
}
