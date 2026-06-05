import { OrganizationDashboard } from '@/features/organization/OrganizationDashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Панель организации'
}

export default function Page() {
	return <OrganizationDashboard />
}
