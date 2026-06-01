'use client'

import { InviteScannerPanel } from '@/app/invites/components/InviteScannerPanel'

interface Props {
	onDetected: (code: string) => void
	onClose: () => void
}

export function AdminQrScannerPanel({ onDetected, onClose }: Props) {
	return (
		<InviteScannerPanel
			title="Сканирование QR-кода"
			onDetected={onDetected}
			onClose={onClose}
		/>
	)
}
