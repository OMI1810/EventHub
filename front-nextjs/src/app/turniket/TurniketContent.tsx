'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { DASHBOARD_PAGES } from '@/config/pages/dashboard.config'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import authService from '@/services/auth/auth.service'
import turniketService from '@/services/turniket.service'
import { parsePassQrPayload } from '@/utils/pass-qr'
import { useProfile } from '@/hooks/useProfile'
import { useMutation } from '@tanstack/react-query'
import { Html5Qrcode } from 'html5-qrcode'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

const RESULT_DISPLAY_MS = 4000

export function TurniketContent() {
	const router = useRouter()
	const scannerElementId = useId().replace(/:/g, '-')
	const { isLoading, user } = useProfile()
	const scannerRef = useRef<Html5Qrcode | null>(null)
	const isStoppingRef = useRef(false)
	const resultTimerRef = useRef<number | null>(null)
	const [scannerError, setScannerError] = useState<string | null>(null)
	const [isScannerStarting, setIsScannerStarting] = useState(true)
	const [scanSignal, setScanSignal] = useState<'allow' | 'deny' | null>(null)
	const [isScanLocked, setIsScanLocked] = useState(false)

	useEffect(() => {
		if (isLoading) return

		if (user.role === 'TURNIKET') return

		if (user.role === 'ADMIN') {
			router.replace(DASHBOARD_PAGES.PROFILE)
			return
		}

		if (user.role === 'ORGANIZATOR') {
			router.replace(DASHBOARD_PAGES.ORGANIZATION)
			return
		}

		router.replace(PUBLIC_PAGES.LOGIN)
	}, [isLoading, router, user.role])

	const showSignal = useCallback((signal: 'allow' | 'deny') => {
		if (resultTimerRef.current) {
			window.clearTimeout(resultTimerRef.current)
		}

		setScanSignal(signal)
		setIsScanLocked(true)

		resultTimerRef.current = window.setTimeout(() => {
			setScanSignal(null)
			setIsScanLocked(false)
			resultTimerRef.current = null
		}, RESULT_DISPLAY_MS)
	}, [])

	const verifyMutation = useMutation({
		mutationFn: (token: string) => turniketService.verifyConsume(token),
		onSuccess(response) {
			showSignal(response.data.allow ? 'allow' : 'deny')
		},
		onError() {
			showSignal('deny')
		}
	})

	const logoutMutation = useMutation({
		mutationFn: () => authService.logout(),
		onSuccess() {
			router.replace(PUBLIC_PAGES.LOGIN)
		}
	})

	useEffect(() => {
		if (isLoading || user.role !== 'TURNIKET') return

		let isMounted = true

		const startScanner = async () => {
			try {
				const scanner = new Html5Qrcode(scannerElementId)
				scannerRef.current = scanner

				await scanner.start(
					{ facingMode: 'environment' },
					{
						fps: 10,
						qrbox: {
							width: 240,
							height: 240
						}
					},
					async rawValue => {
						if (isStoppingRef.current || isScanLocked || verifyMutation.isPending) {
							return
						}

						const token = parsePassQrPayload(rawValue)
						if (!token) {
							showSignal('deny')
							return
						}

						setIsScanLocked(true)
						try {
							await verifyMutation.mutateAsync(token)
						} finally {
							if (!resultTimerRef.current) {
								setIsScanLocked(false)
							}
						}
					},
					() => {}
				)

				if (isMounted) {
					setScannerError(null)
					setIsScannerStarting(false)
				}
			} catch {
				if (!isMounted) return

				setScannerError(
					'Не удалось запустить камеру. Проверьте разрешение браузера и попробуйте снова.'
				)
				setIsScannerStarting(false)
			}
		}

		void startScanner()

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
					await scanner.clear()
				} catch {}
			}

			if (resultTimerRef.current) {
				window.clearTimeout(resultTimerRef.current)
				resultTimerRef.current = null
			}

			void stopScanner()
		}
	}, [
		isLoading,
		isScanLocked,
		scannerElementId,
		showSignal,
		user.role,
		verifyMutation
	])

	if (isLoading || user.role !== 'TURNIKET') {
		return (
			<div className="mt-10 flex justify-center">
				<MiniLoader width={150} height={150} />
			</div>
		)
	}

	return (
		<div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-6 text-white">
			<div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Турникет
						</p>
						<h1 className="mt-2 text-2xl font-semibold">Сканирование пропуска</h1>
					</div>

					<button
						type="button"
						onClick={() => logoutMutation.mutate()}
						disabled={logoutMutation.isPending}
						className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-900 disabled:opacity-60"
					>
						{logoutMutation.isPending ? 'Выходим...' : 'Выйти'}
					</button>
				</div>
			</div>

			<div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5">
				<div className="overflow-hidden rounded-3xl border border-zinc-800 bg-black">
					<div id={scannerElementId} className="min-h-[420px]" />
				</div>

				{isScannerStarting ? (
					<div className="mt-4 flex items-center gap-3 text-sm text-zinc-400">
						<MiniLoader width={20} height={20} />
						<span>Запускаем камеру...</span>
					</div>
				) : null}

				{scannerError ? (
					<p className="mt-4 text-sm text-rose-300">{scannerError}</p>
				) : null}
			</div>

			{scanSignal ? (
				<div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
					<div
						className={`flex h-36 w-36 items-center justify-center rounded-full border-4 border-white text-6xl font-bold ${
							scanSignal === 'allow'
								? 'bg-emerald-500 text-zinc-950'
								: 'bg-rose-500 text-white'
						}`}
					>
						{scanSignal === 'allow' ? 'OK' : 'X'}
					</div>
				</div>
			) : null}
		</div>
	)
}
