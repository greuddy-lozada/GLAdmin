import { IRepository } from '../../../shared/interfaces/repository.interface';
import { UserEntity } from '../entities/user.entity';

export interface IUserRepository extends IRepository<UserEntity> {
  findByUserName(userName: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByRole(roleId: string): Promise<UserEntity[]>;
  findWithRole(): Promise<UserEntity[]>;
}
