import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  userName: string;
  password: string;
  email: string;
  idRole: string;
  isActive: boolean;
}

@Injectable()
export class UserFactory {
  async createFromDto(dto: CreateUserDto): Promise<CreateUserData> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    return {
      firstName: dto.firstName,
      lastName: dto.lastName,
      userName: dto.userName,
      password: hashedPassword,
      email: dto.email,
      idRole: dto.idRole,
      isActive: dto.isActive ?? true,
    };
  }
}
