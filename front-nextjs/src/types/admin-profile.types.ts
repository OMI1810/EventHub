import { TRole } from './user.types'

export interface IAdminProfile {
	idUser: string
	name?: string
	surname?: string
	patronymic?: string
	email: string
	phone?: string
	contact?: string
	role: TRole
	verificationToken?: string | null
}

export interface IUpdateAdminProfileFormData {
	name?: string
	surname?: string
	patronymic?: string
	phone?: string
	contact?: string
}
