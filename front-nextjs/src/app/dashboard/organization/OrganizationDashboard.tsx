'use client'

import { ResendVerificationEmailButton } from '@/components/auth/ResendVerificationEmailButton'
import { MiniLoader } from '@/components/ui/MiniLoader'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { useOrganization } from '@/hooks/useOrganization'
import { useProfile } from '@/hooks/useProfile'
import authService from '@/services/auth/auth.service'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ReactNode, useState, useTransition } from 'react'
import { twMerge } from 'tailwind-merge'
import { OrganizationAdminsSection } from './OrganizationAdminsSection'
import { OrganizationEventsSection } from './OrganizationEventsSection'
import { OrganizationInfoSection } from './OrganizationInfoSection'
import {
	OrganizationDashboardTab,
	OrganizationSidebar
} from './OrganizationSidebar'
import { OrganizationCreateForm } from './OrganizationCreateForm'
import { OrganizationRequestsPanel } from './OrganizationRequestsPanel'

function OrganizationAccessError({
	title,
	description,
	action
}: {
	title: string
	description: string
	action?: ReactNode
}) {
	return (
		<div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-white shadow-xl">
			<h1 className="text-2xl font-bold">{title}</h1>
			<p className="mt-4 text-sm text-zinc-400">{description}</p>
			{action ? <div className="mt-6">{action}</div> : null}
		</div>
	)
}

export function OrganizationDashboard() {
	const router = useRouter()
	const { isLoading: isProfileLoading, user } = useProfile()
	const canViewOrganizationDashboard = user.role === 'ORGANIZATOR'
	const shouldLoadOrganization =
		canViewOrganizationDashboard && !user.verificationToken
	const { organization, isLoading } = useOrganization(shouldLoadOrganization)
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
		if (user.verificationToken) {
			return (
				<OrganizationAccessError
					title="Подтвердите почту"
					description="Организацию можно создать после подтверждения email. Проверьте почту и перейдите по ссылке из письма."
					action={<ResendVerificationEmailButton />}
				/>
			)
		}

		return <OrganizationCreateForm />
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
					{user.verificationToken ? (
						<div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-200 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="font-semibold">Почта не верифицирована</p>
								<p className="mt-1 text-amber-100/80">
									Подтвердите email, чтобы получить полный доступ к возможностям аккаунта.
								</p>
							</div>
							<ResendVerificationEmailButton className="shrink-0" />
						</div>
					) : null}

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
