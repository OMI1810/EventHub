export interface ICreateTurniketAccountFormData {
	email: string
	password: string
	name: string
}

export interface ICreatedTurniketAccount {
	idUser: string
	email: string
	name?: string | null
	role: 'TURNIKET'
}
