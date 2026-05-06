import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';

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
