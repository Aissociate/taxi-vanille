import { IsNumber, IsOptional, IsString, IsISO8601, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GpsPingDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional() @IsNumber()
  accuracy_m?: number;

  @IsOptional() @IsString()
  trip_id?: string;

  @IsOptional() @IsISO8601()
  recorded_at?: string;
}

export class GpsBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GpsPingDto)
  pings: GpsPingDto[];
}
