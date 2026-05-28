'use client'

import { MiniLoader } from '@/components/ui/MiniLoader'
import { DASHBOARD_PAGES } from '@/config/pages/dashboard.config'
import { PUBLIC_PAGES } from '@/config/pages/public.config'
import { useProfile } from '@/hooks/useProfile'
import adminOrganizationService from '@/services/admin-organization.service'
import adminProfileService from '@/services/admin-profile.service'
import authService from '@/services/auth/auth.service'
import { IAdminOrganizationSummary } from '@/types/admin-organization.types'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { twMerge } from 'tailwind-merge'
import { AdminDeleteAccountModal } from './AdminDeleteAccountModal'
import { AdminJoinOrganizationModal } from './AdminJoinOrganizationModal'
import { AdminOrganizationDetailsModal } from './AdminOrganizationDetailsModal'
import { AdminOrganizationsSection } from './AdminOrganizationsSection'
import { AdminPendingRequestsSection } from './AdminPendingRequestsSection'
import { AdminProfileEditForm } from './AdminProfileEditForm'

export function AdminProfilePage() {
	const router = useRouter()
	const { isLoading: isProfileLoading, user, refetch } = useProfile()
	const [selectedOrganization, setSelectedOrganization] =
		useState<IAdminOrganizationSummary | null>(null)
	const [isEditMode, setIsEditMode] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
	const [isPending, startTransition] = useTransition()

	const { data: adminProfileResponse, isLoading: isAdminProfileLoading } =
		useQuery({
			queryKey: ['admin', 'profile'],
			queryFn: () => adminProfileService.getProfile(),
			enabled: !isProfileLoading && user.role === 'ADMIN'
		})

	const { data: organizationsResponse, isLoading: isOrganizationsLoading } =
		useQuery({
			queryKey: ['admin', 'organizations'],
			queryFn: () => adminOrganizationService.getOrganizations(),
			enabled: !isProfileLoading && user.role === 'ADMIN'
		})

	const { data: requestsResponse, isLoading: isRequestsLoading } = useQuery({
		queryKey: ['admin', 'organization-requests'],
		queryFn: () => adminOrganizationService.getOrganizationRequests(),
		enabled: !isProfileLoading && user.role === 'ADMIN'
	})

	useEffect(() => {
		if (isProfileLoading) return

		if (user.role === 'ORGANIZATOR') {
			router.replace(DASHBOARD_PAGES.ORGANIZATION)
			return
		}

		if (user.role !== 'ADMIN') {
			router.replace(DASHBOARD_PAGES.PROFILE)
		}
	}, [isProfileLoading, router, user.role])

	const { mutate: mutateLogout, isPending: isLogoutPending } = useMutation({
		mutationKey: ['logout'],
		mutationFn: () => authService.logout(),
		onSuccess() {
			refetch()
			startTransition(() => {
				router.push(PUBLIC_PAGES.LOGIN)
			})
		}
	})

	const isLoading =
		isProfileLoading ||
		isAdminProfileLoading ||
		isOrganizationsLoading ||
		isRequestsLoading

	const isLogoutLoading = isLogoutPending || isPending

	if (isLoading || user.role !== 'ADMIN') {
		return (
			<div className="mt-10 flex justify-center">
				<MiniLoader width={150} height={150} />
			</div>
		)
	}

	const adminProfile = adminProfileResponse?.data
	const organizations = organizationsResponse?.data ?? []
	const requests = requestsResponse?.data ?? []

	if (!adminProfile) {
		return (
			<div className="mx-auto max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-white shadow-xl">
				<h1 className="text-2xl font-bold">Профиль администратора недоступен</h1>
				<p className="mt-4 text-sm text-zinc-400">
					Не удалось загрузить данные администратора.
				</p>
			</div>
		)
	}

	return (
		<div className="mx-auto grid max-w-5xl gap-6 text-white">
			<div className="flex justify-end">
				<button
					type="button"
					onClick={() => mutateLogout()}
					disabled={isLogoutLoading}
					className={twMerge(
						'rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800',
						isLogoutLoading && 'cursor-not-allowed opacity-60'
					)}
				>
					{isLogoutLoading ? 'Выход...' : 'Выйти'}
				</button>
			</div>

			<section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Профиль
						</p>
						<h1 className="mt-3 text-3xl font-bold">
							{adminProfile.name || adminProfile.email}
						</h1>
						<p className="mt-3 text-sm text-zinc-400">
							Личный профиль администратора.
						</p>
					</div>

					<div className="flex gap-3">
						<button
							type="button"
							onClick={() => setIsEditMode(current => !current)}
							className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
						>
							{isEditMode ? 'Скрыть форму' : 'Редактировать'}
						</button>
						<button
							type="button"
							onClick={() => setIsDeleteModalOpen(true)}
							className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500"
						>
							Удалить
						</button>
					</div>
				</div>

				{isEditMode ? (
					<AdminProfileEditForm
						profile={adminProfile}
						onCancel={() => setIsEditMode(false)}
					/>
				) : null}

				<div className="mt-6 grid gap-4 md:grid-cols-2">
					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Имя
						</p>
						<p className="mt-3 text-sm text-zinc-200">
							{adminProfile.name || 'Не указано'}
						</p>
					</div>

					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Фамилия
						</p>
						<p className="mt-3 text-sm text-zinc-200">
							{adminProfile.surname || 'Не указано'}
						</p>
					</div>

					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Отчество
						</p>
						<p className="mt-3 text-sm text-zinc-200">
							{adminProfile.patronymic || 'Не указано'}
						</p>
					</div>

					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Телефон
						</p>
						<p className="mt-3 text-sm text-zinc-200">
							{adminProfile.phone || 'Не указано'}
						</p>
					</div>

					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Email
						</p>
						<p className="mt-3 text-sm text-zinc-200">{adminProfile.email}</p>
					</div>

					<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4">
						<p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
							Дополнительный контакт
						</p>
						<p className="mt-3 text-sm text-zinc-200">
							{adminProfile.contact || 'Не указано'}
						</p>
					</div>
				</div>
			</section>

			<AdminOrganizationsSection
				organizations={organizations}
				onSelect={setSelectedOrganization}
				onAdd={() => setIsJoinModalOpen(true)}
			/>

			<AdminPendingRequestsSection
				requests={requests}
				onSelect={request => setSelectedOrganization(request.organization)}
			/>

			{selectedOrganization ? (
				<AdminOrganizationDetailsModal
					organization={selectedOrganization}
					onClose={() => setSelectedOrganization(null)}
				/>
			) : null}

			{isDeleteModalOpen ? (
				<AdminDeleteAccountModal
					onClose={() => setIsDeleteModalOpen(false)}
				/>
			) : null}

			{isJoinModalOpen ? (
				<AdminJoinOrganizationModal
					onClose={() => setIsJoinModalOpen(false)}
				/>
			) : null}
		</div>
	)
}
