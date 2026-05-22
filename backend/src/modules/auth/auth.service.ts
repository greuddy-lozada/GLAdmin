import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../users/repository/user.repository';
import { AuthFactory } from './auth.factory';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authFactory: AuthFactory,
  ) {}

  async login(
    dto: LoginDto,
  ): Promise<{ data: LoginResponseDto; message: string }> {
    const user = await this.userRepository.findByUserName(dto.userName);
    if (!user) {
      throw new UnauthorizedException('AUTH.INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('AUTH.INVALID_CREDENTIALS');
    }

    const loginResponse = this.authFactory.createLoginResponse(user);
    return { data: loginResponse, message: 'AUTH.LOGIN_SUCCESS' };
  }

  async me(userId: number): Promise<{ data: unknown; message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('AUTH.USER_NOT_FOUND');
    }

    const { password: _, ...userWithoutPassword } = user;
    return { data: userWithoutPassword, message: 'AUTH.USER_FOUND' };
  }
}
