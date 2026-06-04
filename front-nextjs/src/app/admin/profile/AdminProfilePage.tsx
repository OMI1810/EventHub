'use client'

import { ProfileInfoCard } from '@/app/profile/components/ProfileInfoCard'
import { ProfileLayout } from '@/app/profile/components/ProfileLayout'
import { ProfileTwoFactorSettings } from '@/app/profile/components/ProfileTwoFactorSettings'
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
				<h1 className="text-2xl font-bold">
					Профиль администратора недоступен
				</h1>
				<p className="mt-4 text-sm text-zinc-400">
					Не удалось загрузить данные администратора.
				</p>
			</div>
		)
	}

	return (
		<ProfileLayout
			onLogout={() => mutateLogout()}
			isLogoutLoading={isLogoutLoading}
		>
			<ProfileInfoCard
				profile={adminProfile}
				title="Профиль администратора"
				subtitle="Личный профиль администратора."
				isEditMode={isEditMode}
				onToggleEdit={() => setIsEditMode(current => !current)}
				onDelete={() => setIsDeleteModalOpen(true)}
				editForm={
					isEditMode ? (
						<AdminProfileEditForm
							profile={adminProfile}
							onCancel={() => setIsEditMode(false)}
						/>
					) : null
				}
			/>

			<ProfileTwoFactorSettings
				enabled={Boolean(adminProfile.isTwoFactorEnabled)}
				onChanged={refetch}
			/>

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
		</ProfileLayout>
	)
}
