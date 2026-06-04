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
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
						{title}
					</p>
					<h1 className="mt-3 text-3xl font-bold">
						{profile.name || profile.email}
					</h1>
					<p className="mt-3 text-sm text-zinc-400">{subtitle}</p>
				</div>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={onToggleEdit}
						className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
					>
						{isEditMode ? 'Скрыть форму' : 'Редактировать'}
					</button>
					<button
						type="button"
						onClick={onDelete}
						className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500"
					>
						Удалить
					</button>
				</div>
			</div>

			{profile.verificationToken ? (
				<div className="mt-6 flex flex-col gap-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-200 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="font-semibold">Почта не верифицирована</p>
						<p className="mt-1 text-amber-100/80">
							Подтвердите email, чтобы получить полный доступ к возможностям аккаунта.
						</p>
					</div>
					<ResendVerificationEmailButton className="shrink-0" />
				</div>
			) : null}

			{editForm}

			<div className="mt-6 grid gap-4 md:grid-cols-2">
				{profileFields.map(field => (
					<div
						key={field.key}
						className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4"
					>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							{field.label}
						</p>
						<p className="mt-3 text-sm text-zinc-200">
							{profile[field.key] || 'Не указано'}
						</p>
					</div>
				))}
			</div>
		</section>
	)
}
