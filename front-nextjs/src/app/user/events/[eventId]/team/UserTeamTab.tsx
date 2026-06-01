'use client'

import { InviteCodeCard } from '@/app/invites/components/InviteCodeCard'
import { InviteQrModal } from '@/app/invites/components/InviteQrModal'
import { InviteRegenerateModal } from '@/app/invites/components/InviteRegenerateModal'
import { JoinByCodeModal } from '@/app/invites/components/JoinByCodeModal'
import userTeamService from '@/services/user-team.service'
import {
	IUserTeamInviteResponse,
	IUserTeamMember,
	IUserTeamState
} from '@/types/user-team.types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { UserCreateTeamModal } from './UserCreateTeamModal'
import { UserDeleteTeamModal } from './UserDeleteTeamModal'
import { UserTeamMemberDetailsModal } from './UserTeamMemberDetailsModal'

interface Props {
	eventId: string
}

function formatTeamFormat(format: 'ONLINE' | 'OFFLINE') {
	return format === 'ONLINE' ? 'Онлайн' : 'Офлайн'
}

function formatInviteExpiry(expiresAt: string) {
	return new Intl.DateTimeFormat('ru-RU', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).format(new Date(expiresAt))
}

function getMemberName(member: IUserTeamMember) {
	return [member.surname, member.name, member.patronymic].filter(Boolean).join(' ')
}

function AccessWarning({ text }: { text: string }) {
	return (
		<div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 px-5 py-8 text-sm leading-6 text-zinc-400">
			{text}
		</div>
	)
}

export function UserTeamTab({ eventId }: Props) {
	const queryClient = useQueryClient()
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
	const [selectedMember, setSelectedMember] = useState<IUserTeamMember | null>(null)
	const [invite, setInvite] = useState<IUserTeamInviteResponse | null>(null)
	const [isQrModalOpen, setIsQrModalOpen] = useState(false)
	const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false)

	const { data, isLoading } = useQuery({
		queryKey: ['user-team', eventId],
		queryFn: async () => {
			const response = await userTeamService.getTeamState(eventId)
			return response.data
		}
	})

	const invalidateTeamQueries = () => {
		queryClient.invalidateQueries({
			queryKey: ['user-team', eventId]
		})
		queryClient.invalidateQueries({
			queryKey: ['user-event-details', eventId]
		})
	}

	const createTeamMutation = useMutation({
		mutationFn: (payload: { name: string; description?: string; format?: 'ONLINE' | 'OFFLINE' }) =>
			userTeamService.createTeam(eventId, payload),
		onSuccess() {
			invalidateTeamQueries()
			setIsCreateModalOpen(false)
			toast.success('Команда создана')
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message = error.response?.data?.message ?? 'Не удалось создать команду'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const updateTeamMutation = useMutation({
		mutationFn: (payload: {
			teamId: string
			data: { name?: string; description?: string; format?: 'ONLINE' | 'OFFLINE' }
		}) => userTeamService.updateTeam(payload.teamId, payload.data),
		onSuccess() {
			invalidateTeamQueries()
			setIsEditModalOpen(false)
			toast.success('Данные команды обновлены')
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message = error.response?.data?.message ?? 'Не удалось обновить команду'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const deleteTeamMutation = useMutation({
		mutationFn: userTeamService.deleteTeam,
		onSuccess() {
			invalidateTeamQueries()
			setIsDeleteModalOpen(false)
			setInvite(null)
			toast.success('Команда удалена')
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message = error.response?.data?.message ?? 'Не удалось удалить команду'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const createInviteMutation = useMutation({
		mutationFn: userTeamService.createTeamInvite,
		onSuccess(response) {
			setInvite(response.data)
			setIsQrModalOpen(false)
			setIsRegenerateModalOpen(false)
			toast.success('Код приглашения команды сгенерирован')
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message = error.response?.data?.message ?? 'Не удалось создать код приглашения'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const joinByInviteMutation = useMutation({
		mutationFn: userTeamService.joinByInvite,
		onSuccess() {
			invalidateTeamQueries()
			setIsJoinModalOpen(false)
			toast.success('Заявка на вступление в команду отправлена')
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message = error.response?.data?.message ?? 'Не удалось отправить заявку в команду'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const approveJoinRequestMutation = useMutation({
		mutationFn: userTeamService.approveJoinRequest,
		onSuccess() {
			invalidateTeamQueries()
			toast.success('Заявка одобрена')
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message = error.response?.data?.message ?? 'Не удалось одобрить заявку'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const rejectJoinRequestMutation = useMutation({
		mutationFn: userTeamService.rejectJoinRequest,
		onSuccess() {
			invalidateTeamQueries()
			toast.success('Заявка отклонена')
		},
		onError(error: AxiosError<{ message?: string | string[] }>) {
			const message = error.response?.data?.message ?? 'Не удалось отклонить заявку'
			toast.error(Array.isArray(message) ? message[0] : message)
		}
	})

	const sortedMembers = useMemo(
		() =>
			data?.team?.members
				? [...data.team.members].sort((left, right) =>
						(getMemberName(left) || left.email).localeCompare(
							getMemberName(right) || right.email,
							'ru'
						)
				  )
				: [],
		[data?.team?.members]
	)

	if (isLoading || !data) {
		return (
			<div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-5 py-8 text-sm text-zinc-400">
				Загружаем состояние команды...
			</div>
		)
	}

	if (!data.isParticipating) {
		return (
			<AccessWarning text="Чтобы работать с командой, необходимо участвовать в мероприятии." />
		)
	}

	if (!data.hasTeam) {
		return (
			<>
				<div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
					<h3 className="text-xl font-bold text-white">У вас пока нет команды</h3>
					<p className="mt-3 text-sm leading-6 text-zinc-400">
						Вы можете вступить в существующую команду по invite-коду или возглавить свою собственную.
					</p>

					<div className="mt-6 flex flex-col gap-3 sm:flex-row">
						<button
							type="button"
							onClick={() => setIsJoinModalOpen(true)}
							className="rounded-xl border border-emerald-700 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-950/40"
						>
							Вступить в команду
						</button>
						<button
							type="button"
							onClick={() => setIsCreateModalOpen(true)}
							className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
						>
							Возглавить свою команду
						</button>
					</div>
				</div>

				{isCreateModalOpen ? (
					<UserCreateTeamModal
						mode="create"
						isPending={createTeamMutation.isPending}
						canChooseFormat={data.canChooseFormat}
						defaultFormat={data.defaultFormat}
						onClose={() => setIsCreateModalOpen(false)}
						onSubmit={formData => createTeamMutation.mutate(formData)}
					/>
				) : null}

				{isJoinModalOpen ? (
					<JoinByCodeModal
						label="Команды"
						title="Вступление в команду"
						description="Введите код приглашения вручную или откройте сканер QR-кода."
						codeLabel="Код приглашения"
						codePlaceholder="Например, A1B2-C3D4"
						emptyHint="Вы можете ввести код вручную или считать его через камеру."
						filledHint="Код можно отредактировать вручную перед отправкой."
						scanButtonLabel="Отсканировать QR-код"
						scannerTitle="Сканирование QR-кода"
						submitLabel="Отправить заявку"
						isPending={joinByInviteMutation.isPending}
						onClose={() => setIsJoinModalOpen(false)}
						onDetected={() => {
							toast.success('QR-код считан. Проверьте код и отправьте заявку.')
						}}
						onSubmit={code => joinByInviteMutation.mutate({ code, eventId })}
					/>
				) : null}
			</>
		)
	}

	const team = data.team!

	return (
			<>
				<section className="grid gap-6">
					<div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Команда</p>
								<h3 className="mt-3 text-2xl font-bold text-white">{team.name}</h3>
								<p className="mt-3 text-sm leading-6 text-zinc-400">
									{team.description || 'Описание команды пока не добавлено.'}
								</p>
							</div>

							<div className="flex flex-wrap gap-2">
								<span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
									{formatTeamFormat(team.format)}
								</span>
								<span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
									Участников: {team.members.length}
									{data.teamMemberLimit ? `/${data.teamMemberLimit}` : ''}
								</span>
							</div>
						</div>

						{team.isCaptain ? (
							<div className="mt-6 flex flex-col gap-3 sm:flex-row">
								<button
									type="button"
									onClick={() => setIsEditModalOpen(true)}
									className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
								>
									Редактировать команду
								</button>
								<button
									type="button"
									onClick={() => setIsDeleteModalOpen(true)}
									className="rounded-xl border border-rose-700 px-5 py-2.5 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-950/40"
								>
									Удалить команду
								</button>
							</div>
						) : null}
					</div>

					<div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Участники</p>
						<div className="mt-4 grid gap-3">
							{sortedMembers.map(member => (
								<button
									key={member.idUser}
									type="button"
									onClick={() => setSelectedMember(member)}
									className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-4 text-left transition-colors hover:bg-zinc-800"
								>
									<p className="text-sm font-semibold text-zinc-100">
										{getMemberName(member) || member.email}
									</p>
									<p className="mt-2 text-sm text-zinc-400">{member.email}</p>
								</button>
							))}
						</div>
					</div>

					{team.isCaptain ? (
						<InviteCodeCard
							label="Приглашение"
							title="Код приглашения в команду"
							description="Сгенерируйте код для участников, которых хотите пригласить в свою команду."
							code={invite?.code}
							expiresHint={
								invite
									? `Действует до ${formatInviteExpiry(invite.expiresAt)}. Нажмите, чтобы скопировать.`
									: undefined
							}
							emptyStateText="Активного кода пока нет. Сгенерируйте его, чтобы показать участникам."
							generateLabel="Сгенерировать код"
							isPending={createInviteMutation.isPending}
							onGenerate={() => {
								if (invite) {
									setIsRegenerateModalOpen(true)
									return
								}

								createInviteMutation.mutate(team.idTeam)
							}}
							onCopy={async () => {
								if (!invite?.code) return

								try {
									await navigator.clipboard.writeText(invite.code)
									toast.success('Код приглашения скопирован')
								} catch {
									toast.error('Не удалось скопировать код приглашения')
								}
							}}
							onOpenQr={() => setIsQrModalOpen(true)}
						/>
					) : null}

					{team.isCaptain ? (
						<div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
							<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Заявки в команду</p>
							<div className="mt-4 grid gap-3">
								{team.joinRequests.length ? (
									team.joinRequests.map(request => (
										<div
											key={request.idJoinTeam}
											className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-4"
										>
											<p className="text-sm font-semibold text-zinc-100">
												{getMemberName(request.user) || request.user.email}
											</p>
											<p className="mt-2 text-sm text-zinc-400">
												{request.user.email}
											</p>
											<div className="mt-4 flex flex-col gap-3 sm:flex-row">
												<button
													type="button"
													onClick={() =>
														approveJoinRequestMutation.mutate(request.idJoinTeam)
													}
													disabled={approveJoinRequestMutation.isPending}
													className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
												>
													Принять
												</button>
												<button
													type="button"
													onClick={() =>
														rejectJoinRequestMutation.mutate(request.idJoinTeam)
													}
													disabled={rejectJoinRequestMutation.isPending}
													className="rounded-xl border border-rose-700 px-4 py-2.5 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-950/40 disabled:cursor-not-allowed disabled:opacity-60"
												>
													Отклонить
												</button>
											</div>
										</div>
									))
								) : (
									<AccessWarning text="Ожидающих заявок в команду пока нет." />
								)}
							</div>
						</div>
					) : null}
				</section>

				{selectedMember ? (
					<UserTeamMemberDetailsModal
						member={selectedMember}
						onClose={() => setSelectedMember(null)}
					/>
				) : null}

				{isEditModalOpen ? (
					<UserCreateTeamModal
						mode="edit"
						isPending={updateTeamMutation.isPending}
						canChooseFormat={data.canChooseFormat}
						defaultFormat={data.defaultFormat}
						initialValues={{
							name: team.name,
							description: team.description ?? '',
							format: team.format
						}}
						onClose={() => setIsEditModalOpen(false)}
						onSubmit={formData =>
							updateTeamMutation.mutate({
								teamId: team.idTeam,
								data: formData
							})
						}
					/>
				) : null}

				{isDeleteModalOpen ? (
					<UserDeleteTeamModal
						isPending={deleteTeamMutation.isPending}
						onClose={() => setIsDeleteModalOpen(false)}
						onConfirm={() => deleteTeamMutation.mutate(team.idTeam)}
					/>
				) : null}

				{invite && isQrModalOpen ? (
					<InviteQrModal
						label="QR приглашения"
						title="QR-код приглашения в команду"
						code={invite.code}
						onClose={() => setIsQrModalOpen(false)}
					/>
				) : null}

				{invite && isRegenerateModalOpen ? (
					<InviteRegenerateModal
						label="Перегенерация кода"
						title="Создать новый код приглашения?"
						description={`Сейчас уже есть активный код приглашения. Он действует до ${formatInviteExpiry(invite.expiresAt)}. Если создать новый код, старый сразу перестанет работать.`}
						confirmLabel="Да, создать новый код"
						isPending={createInviteMutation.isPending}
						onClose={() => setIsRegenerateModalOpen(false)}
						onConfirm={() => createInviteMutation.mutate(team.idTeam)}
					/>
				) : null}
			</>
	)
}
