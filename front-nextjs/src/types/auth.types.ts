import { IUser, TRole } from "./user.types";

// Почему ENUM именно так (7:16) - https://www.youtube.com/watch?v=XdhhCIIksPw
export const AuthToken = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
} as const;

export type AuthToken = (typeof AuthToken)[keyof typeof AuthToken];

export interface ITokenInside {
  id: string;
  role?: TRole;
  iat: number;
  exp: number;
}

export type TProtectUserData =
  | Omit<ITokenInside, "iat" | "exp">
  | Pick<IUser, "idUser">;

export interface IFormData extends Pick<IUser, "email"> {
  password: string;
  phone?: string;
  contact?: string;
  role?: TRole;
  surname?: string;
  name?: string;
  patronymic?: string;
  birthDate?: string;
  city?: string;
  organizationName?: string;
  organizationDescription?: string;
  organizationAddress?: string;
  organizationCordinatX?: number;
  organizationCordinatY?: number;
  personalDataConsent?: boolean;
}
