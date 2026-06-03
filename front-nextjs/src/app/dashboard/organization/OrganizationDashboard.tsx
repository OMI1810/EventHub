'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { useOrganization } from '@/hooks/useOrganization'
import { useProfile } from '@/hooks/useProfile'
import authService from '@/services/auth/auth.service'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { twMerge } from 'tailwind-merge'
import { OrganizationAdminsSection } from './OrganizationAdminsSection'
import { OrganizationEventsSection } from './OrganizationEventsSection'
import { OrganizationInfoSection } from './OrganizationInfoSection'
import {
	OrganizationDashboardTab,
	OrganizationSidebar
} from './OrganizationSidebar'
import { OrganizationRequestsPanel } from './OrganizationRequestsPanel'

function OrganizationAccessError({
	title,
	description
}: {
	title: string
	description: string
}) {
	return (
		<div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-white shadow-xl">
			<h1 className="text-2xl font-bold">{title}</h1>
			<p className="mt-4 text-sm text-zinc-400">{description}</p>
		</div>
	)
}

export function OrganizationDashboard() {
	const router = useRouter()
	const { isLoading: isProfileLoading, user } = useProfile()
	const canViewOrganizationDashboard = user.role === 'ORGANIZATOR'
	const { organization, isLoading } = useOrganization(
		canViewOrganizationDashboard
	)
	const [isPending, startTransition] = useTransition()
	const [activeTab, setActiveTab] =
		useState<OrganizationDashboardTab>('info')

	const { mutate: mutateLogout, isPending: isLogoutPending } = useMutation({
		mutationKey: ['logout'],
		mutationFn: () => authService.logout(),
		onSuccess() {
			startTransition(() => {
				router.push(PUBLIC_PAGES.LOGIN)
			})
		}
	})

	const isLogoutLoading = isPending || isLogoutPending

	if (isProfileLoading || (canViewOrganizationDashboard && isLoading)) {
		return (
			<div className="mt-10">
				<MiniLoader width={150} height={150} />
			</div>
		)
	}

	if (!canViewOrganizationDashboard) {
		return (
			<OrganizationAccessError
				title="Нет доступа к панели организации"
				description="Эта страница доступна только владельцу организации."
			/>
		)
	}

	if (!organization) {
		return (
			<OrganizationAccessError
				title="Панель организации"
				description="Данные организации недоступны для текущего аккаунта."
			/>
		)
	}

	return (
		<div className="w-full max-w-7xl text-white">
			<div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
				<div className="space-y-4">
					<OrganizationSidebar
						organizationName={organization.name}
						activeTab={activeTab}
						onChangeTab={setActiveTab}
					/>

					<button
						onClick={() => mutateLogout()}
						disabled={isLogoutLoading}
						className={twMerge(
							'w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-medium transition-colors hover:bg-zinc-800',
							isLogoutLoading && 'cursor-not-allowed opacity-60'
						)}
					>
						{isLogoutLoading ? 'Загрузка...' : 'Выйти'}
					</button>
				</div>

				<div className="min-w-0">
					{activeTab === 'info' ? (
						<OrganizationInfoSection organization={organization} />
					) : null}

					{activeTab === 'admins' ? <OrganizationAdminsSection /> : null}

					{activeTab === 'events' ? <OrganizationEventsSection /> : null}

					{activeTab === 'requests' ? <OrganizationRequestsPanel /> : null}
				</div>
			</div>
		</div>
	)
}
