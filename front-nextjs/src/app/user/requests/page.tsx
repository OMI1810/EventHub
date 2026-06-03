import { Metadata } from 'next'
import { UserRequestsPage } from './UserRequestsPage'

export const metadata: Metadata = {
	title: 'Мои заявки'
}

export default function Page() {
	return <UserRequestsPage />
}
