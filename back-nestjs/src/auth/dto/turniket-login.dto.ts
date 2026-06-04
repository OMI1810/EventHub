import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class TurniketLoginDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @MinLength(6, {
    message: "Password must be at least 6 characters long",
  })
  @IsString()
  password: string;
}
