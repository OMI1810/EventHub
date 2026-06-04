'use client'

import { IUserTeamMember } from '@/types/user-team.types'

interface Props {
	member: IUserTeamMember
	onClose: () => void
}

function formatFullName(member: IUserTeamMember) {
	return [member.surname, member.name, member.patronymic]
		.filter(Boolean)
		.join(' ')
}

export function UserTeamMemberDetailsModal({ member, onClose }: Props) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
			<div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Участник команды
						</p>
						<h3 className="mt-3 line-clamp-2 break-all text-2xl font-bold">
							{formatFullName(member) || member.email}
						</h3>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="shrink-0 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
					>
						Закрыть
					</button>
				</div>

				<div className="mt-6 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
					<div className="min-w-0">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
						<p className="mt-2 break-all text-sm text-zinc-100">{member.email}</p>
					</div>
					<div className="min-w-0">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Телефон</p>
						<p className="mt-2 break-words text-sm text-zinc-100">
							{member.phone || 'Не указан'}
						</p>
					</div>
					<div className="min-w-0">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Дополнительный контакт
						</p>
						<p className="mt-2 break-words text-sm text-zinc-100">
							{member.contact || 'Не указан'}
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
