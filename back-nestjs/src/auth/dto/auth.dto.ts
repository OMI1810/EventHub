import { Role } from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from "class-validator";

export class AuthDto {
  @IsEmail()
  email: string;

  @MinLength(6, {
    message: "Password must be at least 6 characters long",
  })
  @IsString()
  password: string;
}

export class RegisterDto extends AuthDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ValidateIf((dto) => dto.role !== Role.ORGANIZATOR)
  @IsOptional()
  @IsString()
  surname?: string;

  @ValidateIf((dto) => dto.role !== Role.ORGANIZATOR)
  @IsOptional()
  @IsString()
  name?: string;

  @ValidateIf((dto) => dto.role !== Role.ORGANIZATOR)
  @IsOptional()
  @IsString()
  patronymic?: string;

  @ValidateIf((dto) => dto.role === Role.ORGANIZATOR)
  @IsNotEmpty()
  @IsString()
  organizationName?: string;

  @ValidateIf((dto) => dto.role === Role.ORGANIZATOR)
  @IsOptional()
  @IsString()
  organizationDescription?: string;

  @ValidateIf((dto) => dto.role === Role.ORGANIZATOR)
  @IsNotEmpty()
  @IsString()
  organizationAddress?: string;
}
