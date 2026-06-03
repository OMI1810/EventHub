import { Metadata } from 'next'
import { GuestHomePage } from './GuestHomePage'

export const metadata: Metadata = {
	title: 'Гостевая лента'
}

export default function Page() {
	return <GuestHomePage />
}
