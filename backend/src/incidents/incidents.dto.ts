import { IsArray, IsOptional, IsString, IsNumber, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateIncidentDto {
  @IsOptional() @IsUUID()
  trip_id?: string;

  @IsArray()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  types: string[];

  @IsOptional() @IsNumber()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
  lat?: number;

  @IsOptional() @IsNumber()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
  lng?: number;

  @IsOptional() @IsString()
  notes?: string;
}
