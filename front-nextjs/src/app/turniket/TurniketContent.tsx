'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { DASHBOARD_PAGES } from '@/config/pages/dashboard.config'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { useProfile } from '@/hooks/useProfile'
import authService from '@/services/auth/auth.service'
import turniketService from '@/services/turniket.service'
import { parsePassQrPayload } from '@/utils/pass-qr'
import { useMutation } from '@tanstack/react-query'
import jsQR from 'jsqr'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TurniketHeader } from './components/TurniketHeader'
import { TurniketResultOverlay } from './components/TurniketResultOverlay'
import { TurniketScannerViewport } from './components/TurniketScannerViewport'
import { TurniketStatusPanel } from './components/TurniketStatusPanel'

const RESULT_DISPLAY_MS = 4000

type ScanSignal = {
	type: 'allow' | 'deny'
	title: string
	description: string
}

export function TurniketContent() {
	const router = useRouter()
	const { isLoading, user } = useProfile()

	const videoRef = useRef<HTMLVideoElement | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const rafRef = useRef<number | null>(null)
	const resultTimerRef = useRef<number | null>(null)
	const verifyQrPayloadRef = useRef<(raw: string) => Promise<void>>(async () => {})
	const processingRef = useRef(false)
	const scanLockedRef = useRef(false)

	const [scannerError, setScannerError] = useState<string | null>(null)
	const [isScannerStarting, setIsScannerStarting] = useState(true)
	const [scanSignal, setScanSignal] = useState<ScanSignal | null>(null)
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

	const setScannerLocked = useCallback((nextLocked: boolean) => {
		scanLockedRef.current = nextLocked
		setIsScanLocked(nextLocked)
	}, [])

	const clearResultUi = useCallback(() => {
		if (resultTimerRef.current) {
			window.clearTimeout(resultTimerRef.current)
			resultTimerRef.current = null
		}

		setScanSignal(null)
		setScannerLocked(false)
	}, [setScannerLocked])

	const showSignal = useCallback(
		(type: 'allow' | 'deny', description?: string) => {
			if (resultTimerRef.current) {
				window.clearTimeout(resultTimerRef.current)
				resultTimerRef.current = null
			}

			setScanSignal({
				type,
				title: type === 'allow' ? 'Пропустить' : 'Не пропускать',
				description:
					description ??
					(type === 'allow'
						? 'QR-код подтвержден. Участник может пройти.'
						: 'QR-код отклонен. Проверьте причину и попробуйте снова.')
			})
			setScannerLocked(true)

			resultTimerRef.current = window.setTimeout(() => {
				setScanSignal(null)
				setScannerLocked(false)
				resultTimerRef.current = null
			}, RESULT_DISPLAY_MS)
		},
		[setScannerLocked]
	)

	const verifyMutation = useMutation({
		mutationFn: (token: string) => turniketService.verifyConsume(token),
		onSuccess(response) {
			showSignal(response.data.allow ? 'allow' : 'deny', response.data.message)
		},
		onError() {
			showSignal('deny', 'Не удалось проверить пропуск. Повторите сканирование.')
		}
	})

	const logoutMutation = useMutation({
		mutationFn: () => authService.logout(),
		onSuccess() {
			router.replace(PUBLIC_PAGES.LOGIN)
		}
	})

	const stopMediaLoop = useCallback(() => {
		if (rafRef.current) {
			window.cancelAnimationFrame(rafRef.current)
			rafRef.current = null
		}

		if (streamRef.current) {
			streamRef.current.getTracks().forEach(track => track.stop())
			streamRef.current = null
		}
	}, [])

	const verifyQrPayload = useCallback(
		async (raw: string) => {
			setScannerLocked(true)

			const token = parsePassQrPayload(raw)
			if (!token) {
				showSignal('deny', 'Считанный код не является пропуском EventHub.')
				return
			}

			try {
				await verifyMutation.mutateAsync(token)
			} catch {}
		},
		[setScannerLocked, showSignal, verifyMutation]
	)

	useEffect(() => {
		verifyQrPayloadRef.current = verifyQrPayload
	}, [verifyQrPayload])

	useEffect(() => {
		document.body.classList.add('bg-black')

		return () => {
			document.body.classList.remove('bg-black')
		}
	}, [])

	useEffect(() => {
		if (isLoading || user.role !== 'TURNIKET') return

		let mounted = true

		const startScanner = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: { ideal: 'environment' },
						width: { ideal: 1920 },
						height: { ideal: 1080 }
					},
					audio: false
				})

				if (!mounted) return

				streamRef.current = stream
				setScannerError(null)

				if (videoRef.current) {
					videoRef.current.srcObject = stream
					await videoRef.current.play()
				}

				const canvas = document.createElement('canvas')
				const context = canvas.getContext('2d', { willReadFrequently: true })

				if (!context) {
					setScannerError('Не удалось инициализировать сканер QR-кода.')
					setIsScannerStarting(false)
					return
				}

				const scanLoop = async () => {
					if (!mounted || !videoRef.current) return

					if (
						!processingRef.current &&
						!scanLockedRef.current &&
						videoRef.current.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA
					) {
						processingRef.current = true

						try {
							const frameWidth = videoRef.current.videoWidth
							const frameHeight = videoRef.current.videoHeight

							if (frameWidth > 0 && frameHeight > 0) {
								const maxScanWidth = 1280
								const scale =
									frameWidth > maxScanWidth ? maxScanWidth / frameWidth : 1
								const targetWidth = Math.floor(frameWidth * scale)
								const targetHeight = Math.floor(frameHeight * scale)

								if (
									canvas.width !== targetWidth ||
									canvas.height !== targetHeight
								) {
									canvas.width = targetWidth
									canvas.height = targetHeight
								}

								context.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight)

								const imageData = context.getImageData(
									0,
									0,
									targetWidth,
									targetHeight
								)

								const qr = jsQR(imageData.data, targetWidth, targetHeight, {
									inversionAttempts: 'attemptBoth'
								})

								const value = qr?.data?.trim()
								if (value) {
									await verifyQrPayloadRef.current(value)
								}
							}
						} finally {
							processingRef.current = false
						}
					}

					rafRef.current = window.requestAnimationFrame(scanLoop)
				}

				rafRef.current = window.requestAnimationFrame(scanLoop)
				setIsScannerStarting(false)
			} catch {
				if (!mounted) return

				setScannerError(
					'Не удалось запустить камеру. Проверьте разрешение браузера и попробуйте снова.'
				)
				setIsScannerStarting(false)
			}
		}

		void startScanner()

		return () => {
			mounted = false
			stopMediaLoop()
			clearResultUi()
		}
	}, [clearResultUi, isLoading, stopMediaLoop, user.role])

	if (isLoading || user.role !== 'TURNIKET') {
		return (
			<div className="mt-10 flex justify-center">
				<MiniLoader width={150} height={150} />
			</div>
		)
	}

	return (
		<div className="flex min-h-dvh min-w-0 flex-col gap-3 sm:gap-4">
			<TurniketHeader
				isLoggingOut={logoutMutation.isPending}
				onLogout={() => logoutMutation.mutate()}
			/>
			<TurniketScannerViewport videoRef={videoRef} />
			<TurniketStatusPanel
				isScannerStarting={isScannerStarting}
				isScanLocked={isScanLocked}
				scannerError={scannerError}
			/>
			{scanSignal ? (
				<TurniketResultOverlay
					description={scanSignal.description}
					onClose={clearResultUi}
					title={scanSignal.title}
					type={scanSignal.type}
				/>
			) : null}
		</div>
	)
}
