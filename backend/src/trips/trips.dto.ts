import { IsNumber, IsOptional, IsString, IsEnum, IsISO8601, IsInt, Min } from 'class-validator';

export class StartTripDto {
  @IsOptional() @IsNumber()
  lat?: number;

  @IsOptional() @IsNumber()
  lng?: number;

  @IsOptional() @IsISO8601()
  occurred_at?: string;
}

export class StopEventDto {
  @IsEnum(['arrived', 'departed'])
  event_type: 'arrived' | 'departed';

  @IsOptional() @IsInt() @Min(0)
  passengers_in?: number;

  @IsOptional() @IsInt() @Min(0)
  passengers_out?: number;

  @IsOptional() @IsNumber()
  lat?: number;

  @IsOptional() @IsNumber()
  lng?: number;

  @IsOptional() @IsISO8601()
  occurred_at?: string;
}

export class EndTripDto {
  @IsOptional() @IsNumber()
  lat?: number;

  @IsOptional() @IsNumber()
  lng?: number;

  @IsOptional() @IsISO8601()
  occurred_at?: string;
}
