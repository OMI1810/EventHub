import { TRole } from './user.types'

export interface IProfile {
	idUser: string
	name?: string | null
	surname?: string | null
	patronymic?: string | null
	email: string
	phone?: string | null
	contact?: string | null
	role: TRole
	verificationToken?: string | null
	isTwoFactorEnabled?: boolean
}

export interface IUpdateProfileFormData {
	name?: string
	surname?: string
	patronymic?: string
	phone?: string
	contact?: string
}
