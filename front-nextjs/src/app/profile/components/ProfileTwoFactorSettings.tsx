'use client'

import authService from '@/services/auth/auth.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { twMerge } from 'tailwind-merge'

interface Props {
	enabled: boolean
	className?: string
	onChanged?: () => void
}

export function ProfileTwoFactorSettings({
	enabled,
	className,
	onChanged
}: Props) {
	const queryClient = useQueryClient()

	const mutation = useMutation({
		mutationFn: (nextEnabled: boolean) =>
			authService.updateTwoFactorSetting(nextEnabled),
		onSuccess: async response => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['profile'] }),
				queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] })
			])
			onChanged?.()
			toast.success(
				response.data.isTwoFactorEnabled
					? 'Двухфакторная авторизация включена'
					: 'Двухфакторная авторизация выключена'
			)
		},
		onError: () => {
			toast.error('Не удалось обновить настройку 2FA')
		}
	})

	return (
		<section
			className={twMerge(
				'w-full min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-white shadow-xl sm:rounded-3xl sm:p-6',
				className
			)}
		>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
						Безопасность
					</p>
					<h2 className="mt-2 text-xl font-semibold">
						Двухфакторная авторизация
					</h2>
					<p className="mt-2 max-w-2xl text-sm text-zinc-400">
						Если включить 2FA, при входе после пароля нужно будет ввести код
						из письма. По умолчанию эта настройка выключена.
					</p>
				</div>

				<button
					type="button"
					onClick={() => mutation.mutate(!enabled)}
					disabled={mutation.isPending}
					className={twMerge(
						'shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
						enabled
							? 'border border-zinc-700 text-zinc-100 hover:bg-zinc-800'
							: 'bg-emerald-600 text-white hover:bg-emerald-500'
					)}
				>
					{mutation.isPending
						? 'Сохранение...'
						: enabled
							? 'Выключить'
							: 'Включить'}
				</button>
			</div>
		</section>
	)
}
