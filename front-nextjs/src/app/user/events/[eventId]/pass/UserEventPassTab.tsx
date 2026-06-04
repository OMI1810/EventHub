'use client'

import { EventAccessNotice } from '@/components/events/EventAccessNotice'
import { MiniLoader } from '@/components/ui/MiniLoader'
import userEventPassService from '@/services/user-event-pass.service'
import { IUserEventDetails } from '@/types/user-event.types'
import QRCode from 'qrcode'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
	event: IUserEventDetails
}

function formatCountdown(totalSeconds: number) {
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes.toString().padStart(2, '0')}:${seconds
		.toString()
		.padStart(2, '0')}`
}

export function UserEventPassTab({ event }: Props) {
	const [qrDataUrl, setQrDataUrl] = useState('')
	const [activeToken, setActiveToken] = useState<string | null>(null)
	const [expiresAt, setExpiresAt] = useState<number | null>(null)
	const [secondsLeft, setSecondsLeft] = useState(0)
	const tokenRef = useRef<string | null>(null)
	const isRevokingRef = useRef(false)

	const clearPassState = useCallback(() => {
		tokenRef.current = null
		setActiveToken(null)
		setQrDataUrl('')
		setExpiresAt(null)
		setSecondsLeft(0)
	}, [])

	const revokeMutation = useMutation({
		mutationFn: (token: string) =>
			userEventPassService.revokeToken(event.idEvent, token),
		onSettled() {
			isRevokingRef.current = false
			clearPassState()
		}
	})

	const createTokenMutation = useMutation({
		mutationFn: () => userEventPassService.createToken(event.idEvent),
		onSuccess: async response => {
			const { token, qrPayload, expiresAt: nextExpiresAt } = response.data
			const nextQrDataUrl = await QRCode.toDataURL(qrPayload, {
				errorCorrectionLevel: 'M',
				margin: 1,
				width: 320,
				color: {
					dark: '#111111',
					light: '#ffffff'
				}
			})

			tokenRef.current = token
			setActiveToken(token)
			setQrDataUrl(nextQrDataUrl)
			setExpiresAt(nextExpiresAt)
			setSecondsLeft(Math.max(nextExpiresAt - Math.floor(Date.now() / 1000), 0))
		},
		onError() {
			toast.error('Не удалось подготовить QR-пропуск')
		}
	})

	const closeActivePass = useCallback(() => {
		const token = tokenRef.current
		if (!token || isRevokingRef.current) {
			clearPassState()
			return
		}

		isRevokingRef.current = true
		revokeMutation.mutate(token)
	}, [clearPassState, revokeMutation])

	const revokeOnPageLeave = useCallback(() => {
		const token = tokenRef.current
		if (!token || isRevokingRef.current) return

		isRevokingRef.current = true
		userEventPassService.revokeTokenOnPageLeave(event.idEvent, token)
		clearPassState()
	}, [clearPassState, event.idEvent])

	useEffect(() => {
		tokenRef.current = activeToken
	}, [activeToken])

	useEffect(() => {
		if (!expiresAt) return

		const tick = () => {
			const nextSecondsLeft = expiresAt - Math.floor(Date.now() / 1000)

			if (nextSecondsLeft <= 0) {
				clearPassState()
				return
			}

			setSecondsLeft(nextSecondsLeft)
		}

		tick()
		const intervalId = window.setInterval(tick, 1000)
		return () => window.clearInterval(intervalId)
	}, [clearPassState, expiresAt])

	useEffect(() => {
		const handlePageHide = () => revokeOnPageLeave()
		const handleBeforeUnload = () => revokeOnPageLeave()
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				revokeOnPageLeave()
			}
		}

		window.addEventListener('pagehide', handlePageHide)
		window.addEventListener('beforeunload', handleBeforeUnload)
		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			revokeOnPageLeave()
			window.removeEventListener('pagehide', handlePageHide)
			window.removeEventListener('beforeunload', handleBeforeUnload)
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [revokeOnPageLeave])

	const countdownText = useMemo(
		() => formatCountdown(secondsLeft),
		[secondsLeft]
	)

	if (!event.entryPass.isAvailable) {
		return (
			<EventAccessNotice
				text={
					event.entryPass.reason ??
					'Сейчас пропуск для этого участия недоступен.'
				}
			/>
		)
	}

	return (
		<div className="grid gap-4">
			<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
				<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
					Пропуск
				</p>
				<h3 className="mt-3 text-xl font-semibold text-zinc-100">
					QR-пропуск на мероприятие
				</h3>
				<p className="mt-3 max-w-2xl text-sm text-zinc-400">
					Покажите QR-код на входе. Пропуск живёт ограниченное время и
					автоматически отзывается, если вы закроете это окно.
				</p>

				<div className="mt-5 flex flex-wrap gap-3">
					<button
						type="button"
						onClick={() => createTokenMutation.mutate()}
						disabled={createTokenMutation.isPending || Boolean(activeToken)}
						className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{createTokenMutation.isPending ? 'Готовим пропуск...' : 'Показать QR-пропуск'}
					</button>

					{activeToken ? (
						<button
							type="button"
							onClick={closeActivePass}
							disabled={revokeMutation.isPending}
							className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Скрыть пропуск
						</button>
					) : null}
				</div>
			</div>

			{activeToken && qrDataUrl ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
					<div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
									Пропуск активен
								</p>
								<h4 className="mt-2 text-lg font-semibold">
									Покажите QR-код на входе
								</h4>
							</div>
							<button
								type="button"
								onClick={closeActivePass}
								className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900"
							>
								Закрыть
							</button>
						</div>

						<div className="mt-6 rounded-3xl bg-white p-4">
							<img
								src={qrDataUrl}
								alt="QR-пропуск"
								className="mx-auto h-auto w-full max-w-[320px]"
							/>
						</div>

						<div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3">
							<p className="text-sm text-zinc-300">
								Оставшееся время действия: {countdownText}
							</p>
						</div>
					</div>
				</div>
			) : null}

			{revokeMutation.isPending ? (
				<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4 text-sm text-zinc-400">
					<div className="flex items-center gap-3">
						<MiniLoader width={20} height={20} />
						<span>Отзываем текущий пропуск...</span>
					</div>
				</div>
			) : null}
		</div>
	)
}
