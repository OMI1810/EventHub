'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { InviteCodeCard } from './InviteCodeCard'
import { InviteQrModal } from './InviteQrModal'
import { InviteRegenerateModal } from './InviteRegenerateModal'

interface InvitePayload {
	code: string
	expiresAt: string
}

interface Props {
	label: string
	title: string
	description: string
	invite: InvitePayload | null
	expiresHint?: string
	emptyStateText: string
	generateLabel: string
	isPending: boolean
	qrLabel: string
	qrTitle: string
	regenerateLabel: string
	regenerateTitle: string
	regenerateDescription?: string
	regenerateConfirmLabel: string
	copySuccessMessage: string
	copyErrorMessage: string
	onGenerate: () => void
}

export function InviteSectionCard({
	label,
	title,
	description,
	invite,
	expiresHint,
	emptyStateText,
	generateLabel,
	isPending,
	qrLabel,
	qrTitle,
	regenerateLabel,
	regenerateTitle,
	regenerateDescription,
	regenerateConfirmLabel,
	copySuccessMessage,
	copyErrorMessage,
	onGenerate
}: Props) {
	const [isQrModalOpen, setIsQrModalOpen] = useState(false)
	const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false)

	const handleGenerate = () => {
		if (invite) {
			setIsRegenerateModalOpen(true)
			return
		}

		onGenerate()
	}

	const handleCopy = async () => {
		if (!invite?.code) return

		try {
			await navigator.clipboard.writeText(invite.code)
			toast.success(copySuccessMessage)
		} catch {
			toast.error(copyErrorMessage)
		}
	}

	return (
		<>
			<InviteCodeCard
				label={label}
				title={title}
				description={description}
				code={invite?.code}
				expiresHint={expiresHint}
				emptyStateText={emptyStateText}
				generateLabel={generateLabel}
				isPending={isPending}
				onGenerate={handleGenerate}
				onCopy={handleCopy}
				onOpenQr={() => setIsQrModalOpen(true)}
			/>

			{invite && isQrModalOpen ? (
				<InviteQrModal
					label={qrLabel}
					title={qrTitle}
					code={invite.code}
					onClose={() => setIsQrModalOpen(false)}
				/>
			) : null}

			{invite && isRegenerateModalOpen ? (
				<InviteRegenerateModal
					label={regenerateLabel}
					title={regenerateTitle}
					description={regenerateDescription ?? ''}
					confirmLabel={regenerateConfirmLabel}
					isPending={isPending}
					onClose={() => setIsRegenerateModalOpen(false)}
					onConfirm={onGenerate}
				/>
			) : null}
		</>
	)
}
