import { IsString, IsEmail, MinLength, IsNotEmpty } from 'class-validator';

export class DriverLoginDto {
  @IsString() @IsNotEmpty()
  driver_number: string;

  @IsString() @MinLength(4)
  pin: string;
}

export class WebLoginDto {
  @IsEmail()
  email: string;

  @IsString() @MinLength(6)
  password: string;
}

export class RefreshTokenDto {
  @IsString() @IsNotEmpty()
  refresh_token: string;
}
