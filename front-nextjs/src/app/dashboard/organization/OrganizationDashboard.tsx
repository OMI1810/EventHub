'use client'

import { ProfileTwoFactorSettings } from '@/app/profile/components/ProfileTwoFactorSettings'
import { ResendVerificationEmailButton } from '@/components/auth/ResendVerificationEmailButton'
import { MiniLoader } from '@/components/ui/MiniLoader'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { useOrganization } from '@/hooks/useOrganization'
import { useProfile } from '@/hooks/useProfile'
import authService from '@/services/auth/auth.service'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState, useTransition } from 'react'
import { twMerge } from 'tailwind-merge'
import { OrganizationAdminsSection } from './OrganizationAdminsSection'
import { OrganizationCreateForm } from './OrganizationCreateForm'
import { OrganizationEventsSection } from './OrganizationEventsSection'
import { OrganizationInfoSection } from './OrganizationInfoSection'
import { OrganizationRequestsPanel } from './OrganizationRequestsPanel'
import {
	OrganizationDashboardTab,
	OrganizationSidebar
} from './OrganizationSidebar'

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
	const { isLoading: isProfileLoading, user, refetch } = useProfile()
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const [activeTab, setActiveTab] =
		useState<OrganizationDashboardTab>('info')

	const canViewOrganizationDashboard = user.role === 'ORGANIZATOR'
	const shouldLoadOrganization =
		canViewOrganizationDashboard && !user.verificationToken
	const { organization, isLoading } = useOrganization(shouldLoadOrganization)

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
	const logoutButton = (
		<button
			type="button"
			onClick={() => mutateLogout()}
			disabled={isLogoutLoading}
			className={twMerge(
				'w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-medium transition-colors hover:bg-zinc-800',
				isLogoutLoading && 'cursor-not-allowed opacity-60'
			)}
		>
			{isLogoutLoading ? 'Загрузка...' : 'Выйти'}
		</button>
	)

	useEffect(() => {
		if (!isSidebarOpen) return

		const originalOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'

		return () => {
			document.body.style.overflow = originalOverflow
		}
	}, [isSidebarOpen])

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
					action={
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
							<ResendVerificationEmailButton />
							<button
								type="button"
								onClick={() => mutateLogout()}
								disabled={isLogoutLoading}
								className={twMerge(
									'rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60',
									isLogoutLoading && 'cursor-not-allowed opacity-60'
								)}
							>
								{isLogoutLoading ? 'Загрузка...' : 'Выйти'}
							</button>
						</div>
					}
				/>
			)
		}

		return <OrganizationCreateForm />
	}

	return (
		<div className="min-h-dvh w-full bg-zinc-950 text-white lg:fixed lg:inset-0 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:overflow-hidden">
			<div className="sticky top-0 z-30 flex items-center border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:hidden">
				<button
					type="button"
					onClick={() => setIsSidebarOpen(true)}
					className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
					aria-label="Открыть меню"
				>
					Меню
				</button>
			</div>

			{isSidebarOpen ? (
				<button
					type="button"
					aria-label="Закрыть меню"
					onClick={() => setIsSidebarOpen(false)}
					className="fixed inset-0 z-40 bg-black/70 lg:hidden"
				/>
			) : null}

			<div
				className={twMerge(
					'fixed inset-y-0 left-0 z-50 w-[min(20rem,86vw)] transform transition-transform duration-200 lg:hidden',
					isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
				)}
			>
				<OrganizationSidebar
					organizationName={organization.name}
					organizationDescription={organization.description}
					activeTab={activeTab}
					onChangeTab={setActiveTab}
					className="h-dvh min-h-0 rounded-none border-y-0 border-l-0"
					onClose={() => setIsSidebarOpen(false)}
					onNavigate={() => setIsSidebarOpen(false)}
					footer={logoutButton}
				/>
			</div>

			<div className="hidden lg:block">
				<OrganizationSidebar
					organizationName={organization.name}
					organizationDescription={organization.description}
					activeTab={activeTab}
					onChangeTab={setActiveTab}
					footer={logoutButton}
				/>
			</div>

			<div className="min-w-0 px-3 py-4 sm:px-4 lg:h-screen lg:overflow-y-auto lg:px-8 lg:py-8">
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
					<div className="grid gap-6">
						<ProfileTwoFactorSettings
							enabled={Boolean(user.isTwoFactorEnabled)}
							onChanged={refetch}
						/>
						<OrganizationInfoSection organization={organization} />
					</div>
				) : null}

				{activeTab === 'admins' ? <OrganizationAdminsSection /> : null}

				{activeTab === 'events' ? <OrganizationEventsSection /> : null}

				{activeTab === 'requests' ? <OrganizationRequestsPanel /> : null}
			</div>
		</div>
	)
}
