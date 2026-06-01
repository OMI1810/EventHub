import { UserEventPage } from './UserEventPage'

interface Props {
	params: Promise<{
		eventId: string
	}>
}

export default async function UserEventDetailsPage({ params }: Props) {
	const { eventId } = await params

	return <UserEventPage eventId={eventId} />
}
