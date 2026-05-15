import { IsString, IsOptional, IsEmail, IsNotEmpty, IsUUID, IsDateString, IsNumber, IsInt, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClientDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  contact_name?: string;

  @IsOptional() @IsEmail()
  contact_email?: string;

  @IsOptional() @IsString()
  contact_phone?: string;
}

export class DailyStatsQueryDto {
  @IsOptional() @IsDateString()
  from?: string;

  @IsOptional() @IsDateString()
  to?: string;

  @IsOptional() @IsUUID()
  line_id?: string;
}

export class DirectionStatsQueryDto {
  @IsOptional() @IsDateString()
  from?: string;

  @IsOptional() @IsDateString()
  to?: string;

  @IsOptional() @IsUUID()
  line_id?: string;
}

export class SaveReportDto {
  @IsOptional() @IsUUID()
  line_id?: string;

  @IsDateString()
  period_start: string;

  @IsDateString()
  period_end: string;

  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsInt() @Type(() => Number)
  total_usagers?: number;

  @IsOptional() @IsInt() @Type(() => Number)
  avg_taux?: number;

  @IsOptional() @IsInt() @Type(() => Number)
  jours_service?: number;

  @IsOptional() @IsInt() @Type(() => Number)
  total_incidents?: number;

  @IsOptional() @IsInt() @Type(() => Number)
  total_retards?: number;

  @IsOptional() @IsInt() @Type(() => Number)
  total_unplanned?: number;

  @IsOptional() @IsString()
  comment?: string;

  @IsOptional() @IsObject()
  snapshot?: Record<string, unknown>;
}
