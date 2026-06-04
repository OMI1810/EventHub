export type TRole = "USER" | "ADMIN" | "ORGANIZATOR" | "TURNIKET";

export interface IUser {
  idUser: string;
  surname?: string;
  name?: string;
  patronymic?: string;
  birthDate?: string;
  city?: string;
  email: string;
  phone?: string;
  contact?: string;
  role?: TRole;
  verificationToken?: string;
  otpCode?: string;
  otpExpiresAt?: Date;
}
