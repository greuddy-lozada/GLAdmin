import { TENANT_SCOPED_MODELS } from '../prisma.service';

describe('TENANT_SCOPED_MODELS', () => {
  test('no incluye Invite — el panel admin lista invitaciones cross-org', () => {
    expect(TENANT_SCOPED_MODELS).not.toContain('Invite');
  });
});
