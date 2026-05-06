import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DriverLoginDto, WebLoginDto, RefreshTokenDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('driver/login')
  @HttpCode(HttpStatus.OK)
  driverLogin(@Body() dto: DriverLoginDto) {
    return this.auth.driverLogin(dto.driver_number, dto.pin);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  webLogin(@Body() dto: WebLoginDto) {
    return this.auth.webLogin(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refreshToken(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.revokeToken(dto.refresh_token);
  }
}
