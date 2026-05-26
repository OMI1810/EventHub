import { type TProtectUserData } from '@/types/auth.types'

export type TUserDataState = {
	idUser: string
	isLoggedIn: boolean
}

export const transformUserToState = (
	user: TProtectUserData
): TUserDataState | null => {
	return {
		idUser: 'idUser' in user ? user.idUser : user.id,
		isLoggedIn: true
	}
}
