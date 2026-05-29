'use client'

import organizationService from '@/services/organization.service'
import { IOrganizationInviteResponse } from '@/types/organization.types'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { OrganizationInviteQrModal } from './OrganizationInviteQrModal'
import { OrganizationRegenerateInviteModal } from './OrganizationRegenerateInviteModal'

function formatInviteExpiry(expiresAt: string) {
	return new Intl.DateTimeFormat('ru-RU', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).format(new Date(expiresAt))
}

export function OrganizationInviteSection() {
	const [invite, setInvite] = useState<IOrganizationInviteResponse | null>(null)
	const [isQrModalOpen, setIsQrModalOpen] = useState(false)
	const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false)

	const { mutate: mutateCreateInvite, isPending } = useMutation({
		mutationKey: ['organization', 'invite', 'create'],
		mutationFn: () => organizationService.createInviteForMyOrganization(),
		onSuccess(response) {
			setInvite(response.data)
			setIsQrModalOpen(false)
			setIsRegenerateModalOpen(false)
			toast.success('Код приглашения сгенерирован')
		},
		onError() {
			toast.error('Не удалось сгенерировать код приглашения')
		}
	})

	const handleGenerateInvite = () => {
		if (invite) {
			setIsRegenerateModalOpen(true)
			return
		}

		mutateCreateInvite()
	}

	const handleCopyInviteCode = async () => {
		if (!invite?.code) return

		try {
			await navigator.clipboard.writeText(invite.code)
			toast.success('Код приглашения скопирован')
		} catch {
			toast.error('Не удалось скопировать код приглашения')
		}
	}

	return (
		<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
						Приглашение
					</p>
					<h2 className="mt-3 text-2xl font-bold">
						Код приглашения администратора
					</h2>
					<p className="mt-3 text-sm text-zinc-400">
						Сгенерируйте одноразовый код для уже существующего аккаунта
						администратора. Если потеряете его, просто создайте новый.
					</p>
				</div>

				<button
					type="button"
					onClick={handleGenerateInvite}
					disabled={isPending}
					className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isPending ? 'Генерация...' : 'Сгенерировать код'}
				</button>
			</div>

			<div className="mt-6">
				{invite ? (
					<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
						<button
							type="button"
							onClick={handleCopyInviteCode}
							className="w-full rounded-2xl border border-dashed border-emerald-600/60 bg-zinc-950/70 px-5 py-5 text-left transition-colors hover:bg-zinc-800/70"
						>
							<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
								Активный код
							</p>
							<p className="mt-3 font-mono text-2xl font-bold tracking-[0.25em] text-emerald-400">
								{invite.code}
							</p>
							<p className="mt-4 text-sm text-zinc-400">
								Действует до {formatInviteExpiry(invite.expiresAt)}. Нажмите,
								чтобы скопировать.
							</p>
						</button>

						<button
							type="button"
							onClick={() => setIsQrModalOpen(true)}
							className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-5 text-left transition-colors hover:bg-zinc-800/70"
						>
							<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
								QR Code
							</p>
							<p className="mt-3 text-lg font-semibold text-zinc-100">
								Открыть QR
							</p>
							<p className="mt-4 text-sm text-zinc-400">
								Показать этот же код приглашения в виде QR для сканирования.
							</p>
						</button>
					</div>
				) : (
					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-5">
						<p className="text-sm text-zinc-400">
							На этой странице пока нет активного кода. Сгенерируйте его,
							чтобы показать здесь.
						</p>
					</div>
				)}
			</div>

			{invite && isQrModalOpen ? (
				<OrganizationInviteQrModal
					code={invite.code}
					onClose={() => setIsQrModalOpen(false)}
				/>
			) : null}

			{invite && isRegenerateModalOpen ? (
				<OrganizationRegenerateInviteModal
					expiresAt={invite.expiresAt}
					isPending={isPending}
					onClose={() => setIsRegenerateModalOpen(false)}
					onConfirm={() => mutateCreateInvite()}
				/>
			) : null}
		</section>
	)
}
