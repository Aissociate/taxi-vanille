import { IsString, IsOptional, IsISO8601, IsNumber, IsArray, IsUUID, IsNotEmpty, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateTripDto {
  @IsUUID() @IsNotEmpty()
  driver_id: string;

  @IsOptional() @IsUUID()
  client_id?: string;

  @IsISO8601()
  scheduled_at: string;

  @IsOptional() @IsISO8601()
  estimated_arrival_at?: string;

  @IsOptional() @IsArray()
  stops_order?: string[];

  @IsOptional() @IsNumber()
  amount?: number;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsInt() @Min(0)
  passenger_count?: number;

  @IsOptional() @IsBoolean()
  is_unplanned?: boolean;

  @IsOptional() @IsString()
  direction?: string;

  @IsOptional() @IsUUID()
  line_id?: string;
}

export class UpdateTripDto {
  @IsOptional() @IsUUID()
  driver_id?: string;

  @IsOptional() @IsUUID()
  client_id?: string;

  @IsOptional() @IsISO8601()
  scheduled_at?: string;

  @IsOptional() @IsISO8601()
  estimated_arrival_at?: string;

  @IsOptional() @IsArray()
  stops_order?: string[];

  @IsOptional() @IsNumber()
  amount?: number;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsInt() @Min(0)
  passenger_count?: number;

  @IsOptional() @IsBoolean()
  is_unplanned?: boolean;

  @IsOptional() @IsString()
  direction?: string;

  @IsOptional() @IsUUID()
  line_id?: string;
}

export class ReplaceDriverDto {
  @IsUUID() @IsNotEmpty()
  driver_id: string;

  @IsOptional() @IsString()
  reason?: string;
}
