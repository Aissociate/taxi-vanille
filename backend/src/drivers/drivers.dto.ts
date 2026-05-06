import { IsString, IsOptional, IsEnum, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateDriverDto {
  @IsString() @IsNotEmpty() @MaxLength(20)
  driver_number: string;

  @IsString() @MinLength(4) @MaxLength(6)
  pin: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  full_name: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  tax_id?: string;

  @IsOptional() @IsEnum(['weekly', 'monthly'])
  invoice_period?: 'weekly' | 'monthly';
}

export class UpdateDriverDto {
  @IsOptional() @IsString() @MinLength(4) @MaxLength(6)
  pin?: string;

  @IsOptional() @IsString() @MaxLength(100)
  full_name?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  tax_id?: string;

  @IsOptional() @IsEnum(['weekly', 'monthly'])
  invoice_period?: 'weekly' | 'monthly';
}

export class UpdateFcmTokenDto {
  @IsString() @IsNotEmpty()
  token: string;
}
