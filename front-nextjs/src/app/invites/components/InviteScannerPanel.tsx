'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { useEffect, useId, useRef, useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
	title: string
	onDetected: (code: string) => void
	onClose: () => void
}

export function InviteScannerPanel({ title, onDetected, onClose }: Props) {
	const elementId = useId().replace(/:/g, '-')
	const scannerRef = useRef<{
		stop: () => Promise<void>
		clear: () => void
	} | null>(null)
	const isStoppingRef = useRef(false)
	const onDetectedRef = useRef(onDetected)
	const onCloseRef = useRef(onClose)
	const [isStarting, setIsStarting] = useState(true)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	useEffect(() => {
		onDetectedRef.current = onDetected
	}, [onDetected])

	useEffect(() => {
		onCloseRef.current = onClose
	}, [onClose])

	useEffect(() => {
		let isMounted = true

		const startScanner = async () => {
			try {
				const { Html5Qrcode } = await import('html5-qrcode')

				if (!isMounted) return

				const scanner = new Html5Qrcode(elementId)
				scannerRef.current = scanner

				await scanner.start(
					{ facingMode: 'environment' },
					{
						fps: 10,
						qrbox: {
							width: 220,
							height: 220
						}
					},
					async decodedText => {
						if (isStoppingRef.current) return

						isStoppingRef.current = true
						onDetectedRef.current(decodedText.trim())

						try {
							await scanner.stop()
						} finally {
							scanner.clear()
							onCloseRef.current()
						}
					},
					() => {}
				)

				if (isMounted) {
					setIsStarting(false)
				}
			} catch {
				if (!isMounted) return

				setIsStarting(false)
				setErrorMessage(
					'Не удалось получить доступ к камере. Проверьте разрешение браузера и попробуйте снова.'
				)
				toast.error('Не удалось запустить сканер QR-кода')
			}
		}

		startScanner()

		return () => {
			isMounted = false

			const stopScanner = async () => {
				const scanner = scannerRef.current

				if (!scanner || isStoppingRef.current) return

				isStoppingRef.current = true

				try {
					await scanner.stop()
				} catch {}

				try {
					scanner.clear()
				} catch {}
			}

			void stopScanner()
		}
	}, [elementId])

	return (
		<div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/70 p-4">
			<div className="flex items-start justify-between gap-4">
				<p className="text-sm font-medium text-zinc-200">{title}</p>

				<button
					type="button"
					onClick={onClose}
					className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
				>
					Закрыть сканер
				</button>
			</div>

			<div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-black">
				<div id={elementId} className="min-h-[280px]" />
			</div>

			{isStarting ? (
				<div className="mt-4 flex items-center gap-3 text-sm text-zinc-400">
					<MiniLoader width={20} height={20} />
					<span>Запускаем камеру...</span>
				</div>
			) : null}

			{errorMessage ? (
				<p className="mt-4 text-sm text-rose-300">{errorMessage}</p>
			) : null}
		</div>
	)
}
