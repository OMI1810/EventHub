import type { Metadata } from 'next'
import { OrganizationDashboard } from './OrganizationDashboard'

export const metadata: Metadata = {
	title: 'Панель организации'
}

export default function Page() {
	return <OrganizationDashboard />
}
