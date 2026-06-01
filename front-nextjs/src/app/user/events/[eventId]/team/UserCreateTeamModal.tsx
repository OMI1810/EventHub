'use client'

import { ICreateUserTeamFormData, UserTeamFormat } from '@/types/user-team.types'
import { useForm } from 'react-hook-form'

interface Props {
	isPending: boolean
	canChooseFormat: boolean
	defaultFormat: UserTeamFormat
	onClose: () => void
	onSubmit: (data: ICreateUserTeamFormData) => void
	mode: 'create' | 'edit'
	initialValues?: ICreateUserTeamFormData
}

const teamFormats: UserTeamFormat[] = ['ONLINE', 'OFFLINE']

const teamFormatLabel: Record<UserTeamFormat, string> = {
	ONLINE: 'Онлайн',
	OFFLINE: 'Офлайн'
}

export function UserCreateTeamModal({
	isPending,
	canChooseFormat,
	defaultFormat,
	onClose,
	onSubmit,
	mode,
	initialValues
}: Props) {
	const { register, handleSubmit, watch } = useForm<ICreateUserTeamFormData>({
		defaultValues: {
			name: initialValues?.name ?? '',
			description: initialValues?.description ?? '',
			format: initialValues?.format ?? defaultFormat
		}
	})

	const selectedFormat = watch('format') ?? defaultFormat

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Команда
						</p>
						<h3 className="mt-3 text-2xl font-bold">
							{mode === 'create' ? 'Создать команду' : 'Редактировать команду'}
						</h3>
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

				<form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
					<label className="block text-sm text-zinc-300">
						Название команды
						<input
							type="text"
							{...register('name', { required: true })}
							className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
						/>
					</label>

					<label className="block text-sm text-zinc-300">
						Описание команды
						<textarea
							rows={4}
							{...register('description')}
							className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500"
						/>
					</label>

					<div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
						<p className="text-sm font-medium text-zinc-200">Режим работы команды</p>
						{canChooseFormat ? (
							<div className="mt-4 grid gap-3 sm:grid-cols-2">
								{teamFormats.map(format => (
									<label
										key={format}
										className={`cursor-pointer rounded-2xl border px-4 py-3 text-sm transition-colors ${
											selectedFormat === format
												? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
												: 'border-zinc-700 text-zinc-200 hover:bg-zinc-800'
										}`}
									>
										<input
											type="radio"
											value={format}
											{...register('format', { required: true })}
											className="sr-only"
										/>
										{teamFormatLabel[format]}
									</label>
								))}
							</div>
						) : (
							<p className="mt-3 text-sm text-zinc-400">
								Для этого мероприятия формат команды фиксирован: {teamFormatLabel[defaultFormat]}.
							</p>
						)}
					</div>

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
							className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isPending
								? mode === 'create'
									? 'Создаём...'
									: 'Сохраняем...'
								: mode === 'create'
									? 'Создать'
									: 'Сохранить'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
