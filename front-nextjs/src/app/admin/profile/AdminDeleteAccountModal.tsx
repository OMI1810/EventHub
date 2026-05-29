'use client'

import { PUBLIC_PAGES } from '@/config/pages/public.config'
import authTokenService from '@/services/auth/auth-token.service'
import authService from '@/services/auth/auth.service'
import adminProfileService from '@/services/admin-profile.service'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
	onClose: () => void
}

export function AdminDeleteAccountModal({ onClose }: Props) {
	const router = useRouter()

	const { mutate: mutateDeleteProfile, isPending } = useMutation({
		mutationKey: ['admin', 'profile', 'delete'],
		mutationFn: () => adminProfileService.deleteProfile(),
		async onSuccess() {
			try {
				await authService.logout()
			} catch {
				// The account is already deleted, so we still clear local auth state.
			}

			authTokenService.removeAccessToken()
			toast.success('Аккаунт администратора удалён')
			router.push(PUBLIC_PAGES.LOGIN)
		},
		onError() {
			toast.error('Не удалось удалить аккаунт администратора')
		}
	})

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-white shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Удаление аккаунта
						</p>
						<h3 className="mt-3 text-2xl font-bold">
							Удалить аккаунт администратора
						</h3>
					</div>

					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Нет
					</button>
				</div>

				<div className="mt-6 rounded-2xl border border-rose-900/60 bg-rose-950/30 px-5 py-5">
					<p className="text-sm leading-6 text-zinc-200">
						Вы точно хотите удалить аккаунт администратора? Это действие удалит
						сам аккаунт, все связи с организациями и все поданные заявки на
						вступление.
					</p>
				</div>

				<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Отмена
					</button>

					<button
						type="button"
						onClick={() => mutateDeleteProfile()}
						disabled={isPending}
						className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isPending ? 'Удаление...' : 'Да, удалить'}
					</button>
				</div>
			</div>
		</div>
	)
}
