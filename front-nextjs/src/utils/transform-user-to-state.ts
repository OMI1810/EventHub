import { type TProtectUserData } from '@/types/auth.types'
import { TRole } from '@/types/user.types'

export type TUserDataState = {
	idUser: string
	isLoggedIn: boolean
	role?: TRole
}

export const transformUserToState = (
	user: TProtectUserData
): TUserDataState | null => {
	return {
		idUser: 'idUser' in user ? user.idUser : user.id,
		isLoggedIn: true,
		role: 'role' in user ? user.role : undefined
	}
}
