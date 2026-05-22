import { Controller, Post, Get, Delete, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  async me(@CurrentUser('id') userId: number) {
    return this.authService.me(userId);
  }

  @Delete('logout')
  async logout() {
    return { data: null, message: 'AUTH.LOGOUT_SUCCESS' };
  }
}
