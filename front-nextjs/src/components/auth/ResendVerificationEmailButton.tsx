'use client'

import authService from '@/services/auth/auth.service'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { twMerge } from 'tailwind-merge'

interface Props {
	className?: string
}

export function ResendVerificationEmailButton({ className }: Props) {
	const { mutate: resendVerificationEmail, isPending } = useMutation({
		mutationKey: ['auth', 'resend-verification-email'],
		mutationFn: () => authService.resendVerificationEmail(),
		onSuccess() {
			toast.success('Письмо для подтверждения отправлено')
		},
		onError() {
			toast.error('Не удалось отправить письмо подтверждения')
		}
	})

	return (
		<button
			type="button"
			onClick={() => resendVerificationEmail()}
			disabled={isPending}
			className={twMerge(
				'rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60',
				className
			)}
		>
			{isPending ? 'Отправка...' : 'Отправить письмо повторно'}
		</button>
	)
}
