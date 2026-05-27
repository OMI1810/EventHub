import type { Metadata } from 'next'
import { DashboardEntry } from './DashboardEntry'

export const metadata: Metadata = {
	title: 'Dashboard'
}

export default function Page() {
	return <DashboardEntry />
}
