'use client'

import { UserOrganizationContactsModal } from '@/app/user/events/[eventId]/UserOrganizationContactsModal'
import { EventAuthCtaRow } from '@/components/events/EventAuthCtaRow'
import { EventHeaderBase } from '@/components/events/EventHeaderBase'
import { GUEST_PAGES } from '@/config/pages/guest.config'
import { IPublicEventDetails } from '@/types/public-event.types'
import { useState } from 'react'

interface Props {
	event: IPublicEventDetails
}

export function GuestEventHeader({ event }: Props) {
	const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false)

	return (
		<>
			<EventHeaderBase
				organizationName={event.organization.name}
				title={event.title}
				description={event.description}
				type={event.type}
				format={event.format}
				dataStart={event.dataStart}
				dataEnd={event.dataEnd}
				onOpenOrganization={() => setIsOrganizationModalOpen(true)}
				detailsHref={GUEST_PAGES.eventAbout(event.slug || event.idEvent)}
				actions={<EventAuthCtaRow />}
			/>

			{isOrganizationModalOpen ? (
				<UserOrganizationContactsModal
					organization={event.organization}
					onClose={() => setIsOrganizationModalOpen(false)}
				/>
			) : null}
		</>
	)
}
