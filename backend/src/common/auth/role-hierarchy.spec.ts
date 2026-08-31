import {
  canAssignRole,
  assignableRoleSlugs,
  assertCanAssignRole,
  isPlatformOperator,
  setRoleLevels,
} from './role-hierarchy';

describe('role-hierarchy', () => {
  beforeAll(() => {
    setRoleLevels({
      master: 100,
      admin: 90,
      executive: 80,
      manager: 60,
      employee: 40,
    });
  });
  describe('canAssignRole', () => {
    it('master can assign any role including master', () => {
      expect(canAssignRole('master', 'master')).toBe(true);
      expect(canAssignRole('master', 'executive')).toBe(true);
      expect(canAssignRole('master', 'manager')).toBe(true);
      expect(canAssignRole('master', 'employee')).toBe(true);
    });

    it('executive can assign manager and employee only', () => {
      expect(canAssignRole('executive', 'manager')).toBe(true);
      expect(canAssignRole('executive', 'employee')).toBe(true);
      expect(canAssignRole('executive', 'executive')).toBe(false);
      expect(canAssignRole('executive', 'master')).toBe(false);
    });

    it('manager can assign employee only', () => {
      expect(canAssignRole('manager', 'employee')).toBe(true);
      expect(canAssignRole('manager', 'manager')).toBe(false);
      expect(canAssignRole('manager', 'executive')).toBe(false);
      expect(canAssignRole('manager', 'master')).toBe(false);
    });

    it('employee can assign no roles', () => {
      expect(canAssignRole('employee', 'employee')).toBe(false);
      expect(canAssignRole('employee', 'manager')).toBe(false);
      expect(assignableRoleSlugs('employee')).toEqual([]);
    });

    it('admin cannot assign admin or master, can assign org roles', () => {
      expect(canAssignRole('admin', 'admin')).toBe(false);
      expect(canAssignRole('admin', 'master')).toBe(false);
      expect(canAssignRole('admin', 'executive')).toBe(true);
      expect(canAssignRole('admin', 'employee')).toBe(true);
    });

    it('returns false for unknown slugs', () => {
      expect(canAssignRole('unknown', 'employee')).toBe(false);
      expect(canAssignRole('master', 'unknown')).toBe(false);
    });
  });

  describe('assertCanAssignRole', () => {
    it('throws ForbiddenException when not allowed', () => {
      expect(() => assertCanAssignRole('manager', 'manager')).toThrow(
        'USER.ROLE_HIERARCHY',
      );
    });

    it('does not throw when allowed', () => {
      expect(() => assertCanAssignRole('executive', 'employee')).not.toThrow();
    });
  });

  describe('isPlatformOperator', () => {
    it('is true for master and admin only', () => {
      expect(isPlatformOperator('master')).toBe(true);
      expect(isPlatformOperator('admin')).toBe(true);
      expect(isPlatformOperator('executive')).toBe(false);
      expect(isPlatformOperator(undefined)).toBe(false);
    });
  });

  describe('assignableRoleSlugs', () => {
    it('returns expected slugs for executive', () => {
      expect(assignableRoleSlugs('executive').sort()).toEqual(
        ['employee', 'manager'].sort(),
      );
    });
  });
});
