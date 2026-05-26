export interface IUser {
	idUser: string
	surname?: string
	name?: string
	patronymic?: string
	email: string
	verificationToken?: string
	otpCode?: string
	otpExpiresAt?: Date
}
