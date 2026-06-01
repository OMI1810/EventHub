'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { useState } from 'react'
import { InviteScannerPanel } from './InviteScannerPanel'

interface Props {
	label: string
	title: string
	description: string
	codeLabel: string
	codePlaceholder: string
	emptyHint: string
	filledHint: string
	scanButtonLabel: string
	scannerTitle: string
	submitLabel: string
	isPending: boolean
	onClose: () => void
	onSubmit: (code: string) => void
	onDetected?: (code: string) => void
}

export function JoinByCodeModal({
	label,
	title,
	description,
	codeLabel,
	codePlaceholder,
	emptyHint,
	filledHint,
	scanButtonLabel,
	scannerTitle,
	submitLabel,
	isPending,
	onClose,
	onSubmit,
	onDetected
}: Props) {
	const [isScannerOpen, setIsScannerOpen] = useState(false)
	const [code, setCode] = useState('')

	const handleDetectedCode = (detectedCode: string) => {
		const normalizedCode = detectedCode.toUpperCase()
		setCode(normalizedCode)
		onDetected?.(normalizedCode)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
						<h2 className="mt-3 text-2xl font-bold">{title}</h2>
						{!isScannerOpen ? (
							<p className="mt-3 text-sm text-zinc-400">{description}</p>
						) : null}
					</div>

					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Закрыть
					</button>
				</div>

				{isScannerOpen ? (
					<div className="mt-6">
						<InviteScannerPanel
							title={scannerTitle}
							onDetected={handleDetectedCode}
							onClose={() => setIsScannerOpen(false)}
						/>
					</div>
				) : (
					<form
						onSubmit={event => {
							event.preventDefault()
							onSubmit(code)
						}}
						className="mt-6 space-y-5"
					>
						<label className="block text-sm text-zinc-300">
							{codeLabel}
							<input
								type="text"
								value={code}
								onChange={event => setCode(event.target.value.toUpperCase())}
								placeholder={codePlaceholder}
								className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm uppercase tracking-[0.2em] text-white outline-none transition-colors focus:border-emerald-500"
							/>
						</label>

						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm text-zinc-400">{code ? filledHint : emptyHint}</p>

							<button
								type="button"
								onClick={() => setIsScannerOpen(true)}
								className="rounded-xl border border-emerald-700 px-4 py-2.5 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-950/40"
							>
								{scanButtonLabel}
							</button>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
							<button
								type="button"
								onClick={onClose}
								disabled={isPending}
								className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
							>
								Отмена
							</button>

							<button
								type="submit"
								disabled={isPending || !code.trim()}
								className="flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isPending ? <MiniLoader width={20} height={20} /> : submitLabel}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	)
}
