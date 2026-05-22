import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './repository/user.repository';
import { UserFactory } from './user.factory';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserRepository, UserFactory],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
