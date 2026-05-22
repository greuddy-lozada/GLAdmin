import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class AuthFactory {
  constructor(private readonly jwtService: JwtService) {}

  createToken(user: UserEntity): { token: string } {
    const payload = { sub: user.id, userName: user.userName };
    const token = this.jwtService.sign(payload);
    return { token };
  }

  createLoginResponse(user: UserEntity): {
    user: {
      id: number;
      firstName: string;
      lastName: string;
      userName: string;
      email: string | null;
      role: { id: number; name: string; slug: string } | undefined;
      available: boolean;
    };
    token: string;
  } {
    const { token } = this.createToken(user);
    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        role: user.role,
        available: user.available,
      },
      token,
    };
  }
}
