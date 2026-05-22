import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { UserFactory } from './user.factory';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';

type SafeUser = Omit<UserEntity, 'password'>;

function stripPassword(user: UserEntity | SafeUser): SafeUser {
  if ('password' in user) {
    const { password: _, ...safe } = user;
    return safe;
  }
  return user;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userFactory: UserFactory,
  ) {}

  async create(
    dto: CreateUserDto,
  ): Promise<{ data: SafeUser; message: string }> {
    const existing = await this.userRepository.findByUserName(dto.userName);
    if (existing) {
      throw new ConflictException('USER.ALREADY_EXISTS');
    }

    const userData = await this.userFactory.createFromDto(dto);
    const user = await this.userRepository.create(userData);

    return { data: stripPassword(user), message: 'USER.CREATED' };
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userRepository.findWithRole();
    return users.map(stripPassword);
  }

  async findById(id: number): Promise<SafeUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('USER.NOT_FOUND');
    }
    return stripPassword(user);
  }

  async update(
    id: number,
    dto: UpdateUserDto,
  ): Promise<{ data: SafeUser; message: string }> {
    await this.findById(id);
    const user = await this.userRepository.update(id, dto);
    return { data: stripPassword(user), message: 'USER.UPDATED' };
  }

  async delete(id: number): Promise<{ data: SafeUser; message: string }> {
    const user = await this.findById(id);
    await this.userRepository.delete(id);
    return { data: stripPassword(user), message: 'USER.DELETED' };
  }
}
