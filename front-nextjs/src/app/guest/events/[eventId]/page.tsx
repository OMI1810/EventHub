import { GuestEventPage } from './GuestEventPage'

interface Props {
	params: Promise<{
		eventId: string
	}>
}

export default async function GuestEventDetailsPage({ params }: Props) {
	const { eventId } = await params

	return <GuestEventPage eventId={eventId} />
}
