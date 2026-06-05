'use client'

import { ResendVerificationEmailButton } from '@/components/auth/ResendVerificationEmailButton'
import { IProfile } from '@/types/profile.types'
import { ReactNode } from 'react'

interface Props {
	profile: IProfile
	title: string
	subtitle: string
	isEditMode: boolean
	onToggleEdit: () => void
	onDelete: () => void
	editForm?: ReactNode
}

const profileFields: Array<{
	key: keyof Pick<
		IProfile,
		'name' | 'surname' | 'patronymic' | 'phone' | 'email' | 'contact'
	>
	label: string
}> = [
	{ key: 'name', label: 'Имя' },
	{ key: 'surname', label: 'Фамилия' },
	{ key: 'patronymic', label: 'Отчество' },
	{ key: 'phone', label: 'Телефон' },
	{ key: 'email', label: 'Email' },
	{ key: 'contact', label: 'Дополнительный контакт' }
]

export function ProfileInfoCard({
	profile,
	title,
	subtitle,
	isEditMode,
	onToggleEdit,
	onDelete,
	editForm
}: Props) {
	return (
		<section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-xl sm:rounded-3xl sm:p-8">
			<div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					<p className="break-words text-[10px] uppercase tracking-[0.16em] text-zinc-500 sm:text-xs sm:tracking-[0.2em]">
						{title}
					</p>
					<h1 className="mt-3 min-w-0 break-words text-3xl font-bold [overflow-wrap:anywhere]">
						{profile.name || profile.email}
					</h1>
					<p className="mt-3 break-words text-sm text-zinc-400 [overflow-wrap:anywhere]">
						{subtitle}
					</p>
				</div>

				<div className="grid w-full min-w-0 gap-3 sm:flex sm:w-auto sm:shrink-0">
					<button
						type="button"
						onClick={onToggleEdit}
						className="min-w-0 max-w-full whitespace-nowrap rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 sm:w-auto sm:px-5"
					>
						{isEditMode ? 'Скрыть форму' : 'Редактировать'}
					</button>
					<button
						type="button"
						onClick={onDelete}
						className="min-w-0 max-w-full whitespace-nowrap rounded-xl bg-rose-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500 sm:w-auto sm:px-5"
					>
						Удалить
					</button>
				</div>
			</div>

			{profile.verificationToken ? (
				<div className="mt-6 flex min-w-0 flex-col gap-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-amber-200 sm:flex-row sm:items-center sm:justify-between sm:px-5">
					<div className="min-w-0">
						<p className="font-semibold">Почта не верифицирована</p>
						<p className="mt-1 break-words text-amber-100/80 [overflow-wrap:anywhere]">
							Подтвердите email, чтобы получить полный доступ к возможностям аккаунта.
						</p>
					</div>
					<ResendVerificationEmailButton className="shrink-0" />
				</div>
			) : null}

			{editForm}

			<div className="mt-6 grid min-w-0 gap-4 md:grid-cols-2">
				{profileFields.map(field => (
					<div
						key={field.key}
						className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 sm:px-5"
					>
						<p className="break-words text-[10px] uppercase tracking-[0.16em] text-zinc-500 sm:text-xs sm:tracking-[0.2em]">
							{field.label}
						</p>
						<p className="mt-3 break-words text-sm text-zinc-200 [overflow-wrap:anywhere]">
							{profile[field.key] || 'Не указано'}
						</p>
					</div>
				))}
			</div>
		</section>
	)
}
