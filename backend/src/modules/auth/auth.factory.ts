import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class AuthFactory {
  constructor(private readonly jwtService: JwtService) {}

  createAccessToken(user: UserEntity): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.slug,
      type: 'access',
    };
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  createOrgAccessToken(
    user: UserEntity,
    orgId: number,
    orgRole: string,
  ): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.slug,
      orgId,
      orgRole,
      type: 'access',
    };
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  async generateRefreshToken(): Promise<{ raw: string; hash: string }> {
    const raw = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(raw, 10);
    return { raw, hash };
  }

  async hashRefreshToken(raw: string): Promise<string> {
    return bcrypt.hash(raw, 10);
  }

  async compareRefreshToken(raw: string, hash: string): Promise<boolean> {
    return bcrypt.compare(raw, hash);
  }

  createLoginResponse(user: UserEntity, refreshToken: string): {
    user: {
      id: number;
      firstName: string;
      lastName: string;
      userName: string;
      email: string;
      role: { id: number; name: string; slug: string } | undefined;
      isActive: boolean;
      mustChangePassword: boolean;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const accessToken = this.createAccessToken(user);
    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
      },
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }
}
