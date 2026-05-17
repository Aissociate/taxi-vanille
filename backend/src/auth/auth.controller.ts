import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DriverLoginDto, WebLoginDto, RefreshTokenDto } from './auth.dto';
import { JwtAuthGuard, RolesGuard } from './guards';
import { Roles } from '../common/decorators';

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

  // ── Gestion des utilisateurs web (direction uniquement) ───────────────────

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('direction')
  listUsers() {
    return this.auth.listUsers();
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('direction')
  createUser(@Body() dto: { email: string; full_name: string; role: string; password: string }, @Request() req: any) {
    return this.auth.createUser(dto, req.user?.sub ?? req.user?.userId);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('direction')
  updateUser(@Param('id') id: string, @Body() dto: { email?: string; full_name?: string; role?: string; active?: boolean }, @Request() req: any) {
    return this.auth.updateUser(id, dto, req.user?.sub ?? req.user?.userId);
  }

  @Put('users/:id/password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('direction')
  @HttpCode(200)
  changePassword(@Param('id') id: string, @Body() dto: { password: string }, @Request() req: any) {
    return this.auth.changePassword(id, dto.password, req.user?.sub ?? req.user?.userId);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('direction')
  deleteUser(@Param('id') id: string, @Request() req: any) {
    return this.auth.deleteUser(id, req.user?.sub ?? req.user?.userId);
  }
}
