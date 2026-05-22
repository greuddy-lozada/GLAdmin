import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { IUserRepository } from './user.repository.interface';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter?: Record<string, unknown>): Promise<UserEntity[]> {
    return this.prisma.user.findMany({
      where: filter as never,
      include: { role: true },
    });
  }

  async findById(id: number): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    return user;
  }

  async findOne(filter: Record<string, unknown>): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: filter as never,
      include: { role: true },
    });
    return user;
  }

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        firstName: data.firstName!,
        lastName: data.lastName!,
        userName: data.userName!,
        password: data.password!,
        email: data.email,
        idRole: data.idRole!,
        available: data.available ?? true,
      },
      include: { role: true },
    });
    return user;
  }

  async update(id: number, data: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        idRole: data.idRole,
        available: data.available,
      },
      include: { role: true },
    });
    return user;
  }

  async delete(id: number): Promise<UserEntity> {
    const user = await this.prisma.user.delete({
      where: { id },
    });
    return user;
  }

  async count(filter?: Record<string, unknown>): Promise<number> {
    return this.prisma.user.count({ where: filter as never });
  }

  async findByUserName(userName: string): Promise<UserEntity | null> {
    return this.findOne({ userName });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.findOne({ email });
  }

  async findByRole(roleId: number): Promise<UserEntity[]> {
    return this.findAll({ idRole: roleId });
  }

  async findWithRole(): Promise<UserEntity[]> {
    return this.prisma.user.findMany({
      include: { role: true },
    });
  }
}
