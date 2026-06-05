import { GuestEventAboutPage } from './GuestEventAboutPage'

interface Props {
	params: Promise<{
		eventId: string
	}>
}

export default async function GuestEventAboutRoute({ params }: Props) {
	const { eventId } = await params

	return <GuestEventAboutPage eventId={eventId} />
}
