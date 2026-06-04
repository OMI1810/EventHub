'use client'

import adminTurniketService from '@/services/admin-turniket.service'
import { ICreateTurniketAccountFormData } from '@/types/admin-turniket.types'
import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { FormEvent, useState } from 'react'
import toast from 'react-hot-toast'

const initialFormState: ICreateTurniketAccountFormData = {
	email: '',
	password: '',
	name: ''
}

export function AdminTurniketSection() {
	const [form, setForm] = useState(initialFormState)
	const [createdCredentials, setCreatedCredentials] = useState<{
		email: string
		password: string
		name: string
	} | null>(null)

	const createMutation = useMutation({
		mutationFn: (data: ICreateTurniketAccountFormData) =>
			adminTurniketService.createTurniketAccount(data),
		onSuccess(response) {
			setCreatedCredentials({
				email: response.data.email,
				password: form.password,
				name: response.data.name ?? form.name
			})
			setForm(initialFormState)
			toast.success('Аккаунт турникета создан')
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message =
				error.response?.data?.message ?? 'Не удалось создать аккаунт турникета'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const updateField = (
		field: keyof ICreateTurniketAccountFormData,
		value: string
	) => {
		setForm(current => ({
			...current,
			[field]: value
		}))
	}

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		createMutation.mutate({
			email: form.email.trim(),
			password: form.password,
			name: form.name.trim()
		})
	}

	return (
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
			<div className="flex flex-col gap-3">
				<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
					Турникет
				</p>
				<h2 className="text-2xl font-bold text-white">Создать турникет</h2>
				<p className="max-w-2xl text-sm text-zinc-400">
					Создайте отдельный служебный аккаунт для сканирования QR-пропусков
					на входе. У этой роли будет только экран турникета.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-3">
				<label className="grid gap-2 text-sm text-zinc-300">
					<span>Email</span>
					<input
						type="email"
						required
						value={form.email}
						onChange={event => updateField('email', event.target.value)}
						className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition-colors focus:border-emerald-500"
					/>
				</label>

				<label className="grid gap-2 text-sm text-zinc-300">
					<span>Пароль</span>
					<input
						type="text"
						required
						minLength={6}
						value={form.password}
						onChange={event => updateField('password', event.target.value)}
						className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition-colors focus:border-emerald-500"
					/>
				</label>

				<label className="grid gap-2 text-sm text-zinc-300">
					<span>Название турникета</span>
					<input
						type="text"
						required
						value={form.name}
						onChange={event => updateField('name', event.target.value)}
						placeholder="Например, Главный вход"
						className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-emerald-500"
					/>
				</label>

				<div className="md:col-span-3 flex flex-wrap items-center gap-3">
					<button
						type="submit"
						disabled={createMutation.isPending}
						className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{createMutation.isPending ? 'Создаём...' : 'Создать турникет'}
					</button>
				</div>
			</form>

			{createdCredentials ? (
				<div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
					<p className="text-sm font-medium text-emerald-200">
						Аккаунт создан. Сохраните данные для входа:
					</p>
					<div className="mt-3 grid gap-2 text-sm text-zinc-200">
						<p>Email: {createdCredentials.email}</p>
						<p>Пароль: {createdCredentials.password}</p>
						<p>Название: {createdCredentials.name}</p>
					</div>
				</div>
			) : null}
		</section>
	)
}
