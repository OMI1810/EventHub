'use client'

import { OrganizationInviteSection } from './OrganizationInviteSection'
import { OrganizationJoinRequestsSection } from './OrganizationJoinRequestsSection'

export function OrganizationRequestsPanel() {
	return (
		<div className="space-y-6">
			<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
				<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
					Приглашения / заявки
				</p>
				<h1 className="mt-3 text-3xl font-bold">Управление доступом</h1>
				<p className="mt-4 max-w-3xl text-sm text-zinc-300">
					Здесь можно сгенерировать код для добавления администратора в
					организацию и обработать входящие заявки.
				</p>
			</section>

			<OrganizationInviteSection />
			<OrganizationJoinRequestsSection />
		</div>
	)
}
