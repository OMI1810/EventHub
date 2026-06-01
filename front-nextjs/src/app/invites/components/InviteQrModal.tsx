'use client'

import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

interface Props {
	label: string
	title: string
	code: string
	onClose: () => void
}

export function InviteQrModal({ label, title, code, onClose }: Props) {
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

	useEffect(() => {
		let isMounted = true

		QRCode.toDataURL(code, {
			width: 320,
			margin: 2,
			color: {
				dark: '#111827',
				light: '#FFFFFF'
			}
		})
			.then((url: string) => {
				if (isMounted) {
					setQrDataUrl(url)
				}
			})
			.catch(() => {
				if (isMounted) {
					setQrDataUrl(null)
				}
			})

		return () => {
			isMounted = false
		}
	}, [code])

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
						<h3 className="mt-3 text-2xl font-bold">{title}</h3>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
					>
						Закрыть
					</button>
				</div>

				<div className="mt-6 rounded-3xl border border-zinc-800 bg-white p-6">
					{qrDataUrl ? (
						<img
							src={qrDataUrl}
							alt="Invite code QR"
							className="mx-auto block h-auto max-w-full"
						/>
					) : (
						<div className="flex min-h-80 items-center justify-center text-sm text-zinc-500">
							Не удалось сформировать QR-код
						</div>
					)}
				</div>

				<div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
						Код, зашитый в QR
					</p>
					<p className="mt-3 font-mono text-xl font-bold tracking-[0.2em] text-emerald-400">
						{code}
					</p>
				</div>
			</div>
		</div>
	)
}
