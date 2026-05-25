import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthFactory } from './auth.factory';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [UsersModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthFactory],
})
export class AuthModule {}
