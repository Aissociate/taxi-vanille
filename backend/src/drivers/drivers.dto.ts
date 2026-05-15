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

  @IsOptional()
  vehicle_seats?: number;
}

export class UpdateFcmTokenDto {
  @IsString() @IsNotEmpty()
  token: string;
}

export class CreateAdvanceDto {
  @IsNotEmpty()
  amount: number;

  @IsOptional() @IsString()
  date?: string; // ISO date YYYY-MM-DD

  @IsOptional() @IsString()
  notes?: string;
}

export class AddRepaymentDto {
  @IsNotEmpty()
  amount: number;

  @IsOptional() @IsString()
  date?: string;

  @IsOptional() @IsString()
  notes?: string;
}

export class DeclareOdometerDto {
  @IsEnum(['start', 'end'])
  type: 'start' | 'end';

  @IsString() @IsNotEmpty()
  month: string; // YYYY-MM

  @IsNotEmpty()
  km: number;

  @IsOptional() @IsString()
  notes?: string;
}
