import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import {
  MIN_LEVEL_KEY,
  MIN_ORG_LEVEL_KEY,
} from '../../decorators/min-level.decorator';

function ctx(user: { role?: string; orgRole?: string } | undefined) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('lets platform admin through MinOrgLevel without orgRole', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === MIN_LEVEL_KEY) return undefined;
      if (key === MIN_ORG_LEVEL_KEY) return 60;
      return undefined;
    });
    expect(guard.canActivate(ctx({ role: 'admin' }) as never)).toBe(true);
  });

  it('rejects org user without orgRole on MinOrgLevel', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === MIN_LEVEL_KEY) return undefined;
      if (key === MIN_ORG_LEVEL_KEY) return 60;
      return undefined;
    });
    expect(() => guard.canActivate(ctx({ role: 'employee' }) as never)).toThrow(
      ForbiddenException,
    );
  });

  it('rejects system role below MinLevel admin', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === MIN_LEVEL_KEY) return 90;
      return undefined;
    });
    expect(() =>
      guard.canActivate(ctx({ role: 'executive' }) as never),
    ).toThrow(ForbiddenException);
  });
});
