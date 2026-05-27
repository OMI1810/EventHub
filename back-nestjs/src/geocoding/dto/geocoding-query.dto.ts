import { IsNotEmpty, IsString } from "class-validator";

export class GeocodingSuggestQueryDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class GeocodingByMagicKeyQueryDto {
  @IsString()
  @IsNotEmpty()
  magicKey: string;
}
