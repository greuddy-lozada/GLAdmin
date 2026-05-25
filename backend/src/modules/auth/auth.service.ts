import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UserRepository } from '../users/repository/user.repository';
import { AuthFactory } from './auth.factory';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authFactory: AuthFactory,
    private readonly prisma: PrismaService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('AUTH.INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('AUTH.INVALID_CREDENTIALS');
    }

    const { raw, hash } = await this.authFactory.generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: hash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const loginResponse = this.authFactory.createLoginResponse(user, raw);
    return { data: loginResponse, message: 'AUTH.LOGIN_SUCCESS' };
  }

  async refresh(dto: RefreshDto) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: { user: { include: { role: true } } },
    });

    let matchedToken: typeof tokens[0] | null = null;
    for (const token of tokens) {
      const isValid = await this.authFactory.compareRefreshToken(
        dto.refreshToken,
        token.tokenHash,
      );
      if (isValid) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('AUTH.INVALID_REFRESH_TOKEN');
    }

    const user = matchedToken.user;

    await this.prisma.refreshToken.delete({
      where: { id: matchedToken.id },
    });

    const { raw, hash } = await this.authFactory.generateRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: hash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = this.authFactory.createAccessToken(user);
    return {
      data: { accessToken, refreshToken: raw, expiresIn: 900 },
      message: 'AUTH.TOKEN_REFRESHED',
    };
  }

  async me(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('AUTH.USER_NOT_FOUND');
    }

    const { password: _, ...userWithoutPassword } = user;
    return { data: userWithoutPassword, message: 'AUTH.USER_FOUND' };
  }

  async logout(userId: number) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { data: null, message: 'AUTH.LOGOUT_SUCCESS' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('AUTH.USER_NOT_FOUND');
    }

    const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new ForbiddenException('AUTH.INVALID_OLD_PASSWORD');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { data: null, message: 'AUTH.PASSWORD_CHANGED' };
  }
}
