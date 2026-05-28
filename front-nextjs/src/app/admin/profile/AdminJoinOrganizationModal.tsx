'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import adminOrganizationService from '@/services/admin-organization.service'
import { ICreateAdminOrganizationRequestFormData } from '@/types/admin-organization.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { AdminQrScannerPanel } from './AdminQrScannerPanel'

interface Props {
	onClose: () => void
}

export function AdminJoinOrganizationModal({ onClose }: Props) {
	const queryClient = useQueryClient()
	const [isScannerOpen, setIsScannerOpen] = useState(false)
	const { register, handleSubmit, reset, setValue, watch } =
		useForm<ICreateAdminOrganizationRequestFormData>({
			defaultValues: {
				code: ''
			}
		})

	const codeValue = watch('code')

	const { mutate: mutateCreateRequest, isPending } = useMutation({
		mutationKey: ['admin', 'organization-requests', 'create'],
		mutationFn: (data: ICreateAdminOrganizationRequestFormData) =>
			adminOrganizationService.createOrganizationRequest(data),
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: ['admin', 'organization-requests']
			})
			reset()
			toast.success('Заявка на вступление в организацию отправлена')
			onClose()
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message =
				error?.response?.data?.message ??
				'Не удалось отправить заявку на вступление'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const handleDetectedCode = (code: string) => {
		setValue('code', code.toUpperCase(), {
			shouldDirty: true,
			shouldTouch: true
		})
		toast.success('QR-код считан. Проверьте код и отправьте заявку.')
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
			<div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Организации
						</p>
						<h2 className="mt-3 text-2xl font-bold">
							Вступление в организацию
						</h2>
						<p className="mt-3 text-sm text-zinc-400">
							Введите код приглашения вручную или отсканируйте QR-код,
							который вам отправил владелец организации.
						</p>
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

				<form
					onSubmit={handleSubmit(data => mutateCreateRequest(data))}
					className="mt-6 space-y-5"
				>
					<label className="block text-sm text-zinc-300">
						Код приглашения
						<input
							type="text"
							placeholder="Например, A1B2-C3D4"
							{...register('code', { required: true })}
							className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm uppercase tracking-[0.2em] text-white outline-none transition-colors focus:border-emerald-500"
						/>
					</label>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-zinc-400">
							{codeValue
								? 'Код можно отредактировать вручную перед отправкой.'
								: 'Вы можете ввести код вручную или считать его через камеру.'}
						</p>

						<button
							type="button"
							onClick={() => setIsScannerOpen(current => !current)}
							className="rounded-xl border border-emerald-700 px-4 py-2.5 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-950/40"
						>
							{isScannerOpen ? 'Скрыть сканер' : 'Отсканировать QR-код'}
						</button>
					</div>

					{isScannerOpen ? (
						<AdminQrScannerPanel
							onDetected={handleDetectedCode}
							onClose={() => setIsScannerOpen(false)}
						/>
					) : null}

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
							disabled={isPending}
							className="flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isPending ? (
								<MiniLoader width={20} height={20} />
							) : (
								'Отправить заявку'
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
