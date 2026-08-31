import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { UserRepository } from '../../users/repository/user.repository';
import { AuthFactory } from '../auth.factory';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { SubscriptionLifecycleService } from '../../subscriptions/subscription-lifecycle.service';
import {
  createTestUserEntity,
  createTestLoginDto,
  createTestRefreshDto,
  createTestChangePasswordDto,
  createTestRefreshTokenResult,
  createTestLoginResponse,
  createTestOrganization,
  createTestUserOrganization,
  createTestRefreshTokenEntity,
} from './fixtures/auth.fixture';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByUserName: jest.fn(),
  };

  const mockAuthFactory = {
    generateRefreshToken: jest.fn(),
    createLoginResponse: jest.fn(),
    createOrgAccessToken: jest.fn(),
    createAccessToken: jest.fn(),
    compareRefreshToken: jest.fn(),
  };

  const mockPrisma = {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    userOrganization: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    invite: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditLog = {
    log: jest.fn(),
  };

  const mockSubscriptionLifecycle = {
    evaluateSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: AuthFactory, useValue: mockAuthFactory },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
        {
          provide: SubscriptionLifecycleService,
          useValue: mockSubscriptionLifecycle,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login()', () => {
    const userId = '00000000-0000-0000-0000-000000000001';
    const user = createTestUserEntity({ id: userId });
    const dto = createTestLoginDto();
    const tokenResult = createTestRefreshTokenResult();
    const loginResponse = createTestLoginResponse();

    test('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow(
        'AUTH.INVALID_CREDENTIALS',
      );
    });

    test('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockAuditLog.log.mockResolvedValue(undefined);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow(
        'AUTH.INVALID_CREDENTIALS',
      );
      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: user.id,
          action: 'LOGIN_FAILED',
          metadata: expect.objectContaining({ reason: 'wrong_password' }),
        }),
      );
    });

    test('debe lanzar UnauthorizedException si el usuario está inactivo', async () => {
      const inactiveUser = createTestUserEntity({
        id: userId,
        isActive: false,
      });
      mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockAuditLog.log.mockResolvedValue(undefined);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('AUTH.USER_INACTIVE');
      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN_FAILED',
          metadata: expect.objectContaining({ reason: 'inactive_user' }),
        }),
      );
    });

    test('debe hacer login exitoso sin organizaciones', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockAuthFactory.generateRefreshToken.mockResolvedValue(tokenResult);
      mockPrisma.refreshToken.create.mockResolvedValue(undefined);
      mockPrisma.user.update.mockResolvedValue(undefined);
      mockPrisma.userOrganization.findMany.mockResolvedValue([]);
      mockAuditLog.log.mockResolvedValue(undefined);
      mockAuthFactory.createLoginResponse.mockReturnValue(loginResponse);

      const result = await service.login(dto);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tokenId: tokenResult.tokenId,
            tokenHash: tokenResult.hash,
            userId: user.id,
          }),
        }),
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: user.id },
          data: { lastLogin: expect.any(Date) },
        }),
      );
      expect(mockAuthFactory.createLoginResponse).toHaveBeenCalledWith(
        user,
        tokenResult.raw,
      );
      expect(result.data).toBeDefined();
      expect(result.message).toBe('AUTH.LOGIN_SUCCESS');
      expect(result.data.organizations).toEqual([]);
    });

    test('debe hacer login exitoso con una sola organización y auto-seleccionarla', async () => {
      const org = createTestOrganization({
        id: '10000000-0000-0000-0000-000000000001',
        role: 'admin',
      });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockAuthFactory.generateRefreshToken.mockResolvedValue(tokenResult);
      mockPrisma.refreshToken.create.mockResolvedValue(undefined);
      mockPrisma.user.update.mockResolvedValue(undefined);
      mockPrisma.userOrganization.findMany.mockResolvedValue([
        createTestUserOrganization(user.id, org.id, user.role.id),
      ]);
      mockAuditLog.log.mockResolvedValue(undefined);
      mockAuthFactory.createLoginResponse.mockReturnValue(loginResponse);
      mockAuthFactory.createOrgAccessToken.mockReturnValue(
        'org.access.token.xyz',
      );
      mockPrisma.role.findFirst.mockResolvedValue({
        id: user.role.id,
        name: user.role.name,
        slug: 'admin',
      });

      const result = await service.login(dto);

      expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.user.update).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: { id: user.id },
          data: { currentOrganizationId: org.id },
        }),
      );
      expect(mockAuthFactory.createOrgAccessToken).toHaveBeenCalledWith(
        user,
        org.id,
        'admin',
      );
      expect(result.data.accessToken).toBe('org.access.token.xyz');
      expect(result.data.organizations).toHaveLength(1);
      expect(
        (result.data as Record<string, unknown>).organization,
      ).toBeDefined();
      expect(
        (
          (result.data as Record<string, unknown>).organization as {
            id: string;
          }
        ).id,
      ).toBe(org.id);
    });

    test('debe hacer login exitoso con múltiples organizaciones sin auto-seleccionar', async () => {
      const org1 = createTestOrganization({
        id: '10000000-0000-0000-0000-000000000001',
      });
      const org2 = createTestOrganization({
        id: '10000000-0000-0000-0000-000000000002',
        name: 'Org 2',
        slug: 'org-2',
        role: 'editor',
      });
      mockUserRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockAuthFactory.generateRefreshToken.mockResolvedValue(tokenResult);
      mockPrisma.refreshToken.create.mockResolvedValue(undefined);
      mockPrisma.user.update.mockResolvedValue(undefined);
      mockPrisma.userOrganization.findMany.mockResolvedValue([
        createTestUserOrganization(user.id, org1.id, user.role.id),
        {
          ...createTestUserOrganization(
            user.id,
            org2.id,
            '00000000-0000-0000-0000-000000000020',
          ),
          role: {
            id: '00000000-0000-0000-0000-000000000020',
            name: 'Editor',
            slug: 'editor',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ]);
      mockAuditLog.log.mockResolvedValue(undefined);
      mockAuthFactory.createLoginResponse.mockReturnValue(loginResponse);

      const result = await service.login(dto);

      expect(mockAuthFactory.createOrgAccessToken).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
      expect(result.data.organizations).toHaveLength(2);
      expect(
        (result.data as Record<string, unknown>).organization,
      ).toBeUndefined();
    });

    test('no debe fallar si auditLog.log lanza error', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockAuthFactory.generateRefreshToken.mockResolvedValue(tokenResult);
      mockPrisma.refreshToken.create.mockResolvedValue(undefined);
      mockPrisma.user.update.mockResolvedValue(undefined);
      mockPrisma.userOrganization.findMany.mockResolvedValue([]);
      mockAuditLog.log.mockRejectedValue(new Error('audit error'));
      mockAuthFactory.createLoginResponse.mockReturnValue(loginResponse);

      const result = await service.login(dto);

      expect(result.message).toBe('AUTH.LOGIN_SUCCESS');
    });
  });

  describe('refresh()', () => {
    const userId = '00000000-0000-0000-0000-000000000001';
    const user = createTestUserEntity({ id: userId });
    const tokenResult = createTestRefreshTokenResult();

    test('debe lanzar UnauthorizedException si el token no contiene un punto', async () => {
      const dto = createTestRefreshDto('invalidtoken');

      await expect(service.refresh(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh(dto)).rejects.toThrow(
        'AUTH.INVALID_REFRESH_TOKEN',
      );
    });

    test('debe lanzar UnauthorizedException si el token no existe en la base de datos', async () => {
      const dto = createTestRefreshDto('nonexistent.somesecret');
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh(dto)).rejects.toThrow(
        'AUTH.INVALID_REFRESH_TOKEN',
      );
    });

    test('debe lanzar UnauthorizedException si el hash no coincide (token inválido)', async () => {
      const dto = createTestRefreshDto('tokenId999.wrongsecret');
      const storedToken = createTestRefreshTokenEntity({
        tokenId: 'tokenId999',
        tokenHash: '$2b$12$differenthash',
        userId,
        user,
      });
      mockPrisma.refreshToken.findUnique.mockResolvedValue(storedToken);
      mockAuthFactory.compareRefreshToken.mockResolvedValue(false);

      await expect(service.refresh(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.refresh(dto)).rejects.toThrow(
        'AUTH.INVALID_REFRESH_TOKEN',
      );
    });

    test('debe refrescar el token exitosamente', async () => {
      const dto = createTestRefreshDto('tokenId999.validsecret');
      const storedToken = createTestRefreshTokenEntity({
        tokenId: 'tokenId999',
        tokenHash: '$2b$12$currentHash',
        userId,
        user,
      });
      mockPrisma.refreshToken.findUnique.mockResolvedValue(storedToken);
      mockAuthFactory.compareRefreshToken.mockResolvedValue(true);
      mockPrisma.refreshToken.delete.mockResolvedValue(undefined);
      mockAuthFactory.generateRefreshToken.mockResolvedValue(tokenResult);
      mockPrisma.refreshToken.create.mockResolvedValue(undefined);
      mockAuthFactory.createAccessToken.mockReturnValue('new.access.token');
      mockUserRepository.findById.mockResolvedValue(user);

      const result = await service.refresh(dto);

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: storedToken.id } }),
      );
      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tokenId: tokenResult.tokenId,
            tokenHash: tokenResult.hash,
            userId,
          }),
        }),
      );
      expect(mockAuthFactory.createAccessToken).toHaveBeenCalledWith(user);
      expect(result.data.accessToken).toBe('new.access.token');
      expect(result.data.refreshToken).toBe(tokenResult.raw);
      expect(result.data.expiresIn).toBe(900);
      expect(result.message).toBe('AUTH.TOKEN_REFRESHED');
    });
  });

  describe('logout()', () => {
    test('debe eliminar todos los refresh tokens del usuario', async () => {
      const userId = '00000000-0000-0000-0000-000000000001';
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.logout(userId);

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } }),
      );
      expect(result.data).toBeNull();
      expect(result.message).toBe('AUTH.LOGOUT_SUCCESS');
    });
  });

  describe('changePassword()', () => {
    const userId = '00000000-0000-0000-0000-000000000001';
    const user = createTestUserEntity({ id: userId });
    const dto = createTestChangePasswordDto();

    test('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.changePassword(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.changePassword(userId, dto)).rejects.toThrow(
        'AUTH.USER_NOT_FOUND',
      );
    });

    test('debe lanzar ForbiddenException si la contraseña actual no coincide', async () => {
      mockUserRepository.findById.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(userId, dto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.changePassword(userId, dto)).rejects.toThrow(
        'AUTH.INVALID_OLD_PASSWORD',
      );
    });

    test('debe cambiar la contraseña exitosamente y revocar todos los refresh tokens', async () => {
      mockUserRepository.findById.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('$2b$12$newsalt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$newhashedpassword');
      mockPrisma.user.update.mockResolvedValue(undefined);
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.changePassword(userId, dto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        dto.oldPassword,
        user.password,
      );
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith(
        dto.newPassword,
        '$2b$12$newsalt',
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: {
            password: '$2b$12$newhashedpassword',
            mustChangePassword: false,
          },
        }),
      );
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId } }),
      );
      expect(result.data).toBeNull();
      expect(result.message).toBe('AUTH.PASSWORD_CHANGED');
    });
  });

  describe('registerWithInvite()', () => {
    const inviteRoleId = 'role-org-executive';
    const employeeSystemRoleId = 'role-system-employee';
    const invite = {
      id: 'invite-1',
      code: 'invite-code',
      email: 'new@org.com',
      used: false,
      expiresAt: new Date(Date.now() + 86_400_000),
      roleId: inviteRoleId,
      organizationId: 'org-1',
      role: { id: inviteRoleId, type: 'org', slug: 'executive' },
      organization: { id: 'org-1', plan: null },
    };

    test('asigna rol de sistema employee y el rol de la invitación en la membresía', async () => {
      mockPrisma.invite.findUnique.mockResolvedValue(invite);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUserName.mockResolvedValue(null);
      mockPrisma.role.findFirst.mockResolvedValue({
        id: employeeSystemRoleId,
        slug: 'employee',
      });
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('$2b$10$salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');

      const tx = {
        invite: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        user: {
          create: jest.fn().mockResolvedValue({ id: 'user-new' }),
        },
        userOrganization: { create: jest.fn().mockResolvedValue({}) },
      };
      mockPrisma.$transaction.mockImplementation(
        async (fn: (t: typeof tx) => Promise<string>) => fn(tx),
      );
      jest.spyOn(service, 'login').mockResolvedValue({
        data: { accessToken: 't' },
        message: 'AUTH.LOGIN_SUCCESS',
      } as never);

      await service.registerWithInvite({
        code: invite.code,
        userName: 'newuser',
        firstName: 'New',
        lastName: 'User',
        password: 'secret12',
      });

      expect(tx.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            idRole: employeeSystemRoleId,
          }),
        }),
      );
      expect(tx.userOrganization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roleId: inviteRoleId,
          }),
        }),
      );
    });
  });
});
