import { IsString, IsOptional, IsISO8601, IsNumber, IsArray, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateTripDto {
  @IsUUID() @IsNotEmpty()
  driver_id: string;

  @IsOptional() @IsUUID()
  client_id?: string;

  @IsISO8601()
  scheduled_at: string;

  @IsOptional() @IsArray()
  stops_order?: string[];

  @IsOptional() @IsNumber()
  amount?: number;

  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateTripDto {
  @IsOptional() @IsUUID()
  driver_id?: string;

  @IsOptional() @IsUUID()
  client_id?: string;

  @IsOptional() @IsISO8601()
  scheduled_at?: string;

  @IsOptional() @IsArray()
  stops_order?: string[];

  @IsOptional() @IsNumber()
  amount?: number;

  @IsOptional() @IsString()
  notes?: string;
}

export class ReplaceDriverDto {
  @IsUUID() @IsNotEmpty()
  driver_id: string;

  @IsOptional() @IsString()
  reason?: string;
}
