import { UserEventAboutPage } from './UserEventAboutPage'

interface Props {
	params: Promise<{
		eventId: string
	}>
}

export default async function UserEventAboutRoute({ params }: Props) {
	const { eventId } = await params

	return <UserEventAboutPage eventId={eventId} />
}
