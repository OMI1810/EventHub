'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import adminProfileService from '@/services/admin-profile.service'
import {
	IAdminProfile,
	IUpdateAdminProfileFormData
} from '@/types/admin-profile.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

interface Props {
	profile: IAdminProfile
	onCancel: () => void
}

export function AdminProfileEditForm({ profile, onCancel }: Props) {
	const queryClient = useQueryClient()
	const { register, handleSubmit, reset } = useForm<IUpdateAdminProfileFormData>({
		defaultValues: {
			name: profile.name ?? '',
			surname: profile.surname ?? '',
			patronymic: profile.patronymic ?? '',
			phone: profile.phone ?? '',
			contact: profile.contact ?? ''
		}
	})

	useEffect(() => {
		reset({
			name: profile.name ?? '',
			surname: profile.surname ?? '',
			patronymic: profile.patronymic ?? '',
			phone: profile.phone ?? '',
			contact: profile.contact ?? ''
		})
	}, [profile, reset])

	const { mutate: mutateUpdate, isPending } = useMutation({
		mutationKey: ['admin', 'profile', 'update'],
		mutationFn: (data: IUpdateAdminProfileFormData) =>
			adminProfileService.updateProfile(data),
		onSuccess(response) {
			queryClient.setQueryData(['admin', 'profile'], response)
			toast.success('Данные администратора обновлены')
			onCancel()
		},
		onError() {
			toast.error('Не удалось обновить данные администратора')
		}
	})

	return (
		<form
			onSubmit={handleSubmit(data => mutateUpdate(data))}
			className="mt-6 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<label className="text-sm text-zinc-300">
					Имя
					<input
						type="text"
						{...register('name')}
						className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
					/>
				</label>

				<label className="text-sm text-zinc-300">
					Фамилия
					<input
						type="text"
						{...register('surname')}
						className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
					/>
				</label>

				<label className="text-sm text-zinc-300">
					Отчество
					<input
						type="text"
						{...register('patronymic')}
						className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
					/>
				</label>

				<label className="text-sm text-zinc-300">
					Телефон
					<input
						type="text"
						{...register('phone')}
						className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
					/>
				</label>

				<label className="text-sm text-zinc-300 sm:col-span-2">
					Дополнительный контакт
					<input
						type="text"
						{...register('contact')}
						className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
					/>
				</label>
			</div>

			<div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
				<button
					type="button"
					onClick={onCancel}
					disabled={isPending}
					className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
				>
					Отмена
				</button>

				<button
					type="submit"
					disabled={isPending}
					className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isPending ? <MiniLoader width={20} height={20} /> : 'Сохранить'}
				</button>
			</div>
		</form>
	)
}
