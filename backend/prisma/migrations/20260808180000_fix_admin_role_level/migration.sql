-- Align system admin role level with ROLE_LEVEL.admin (90).
-- Older bootstrap seeded admin at 70, which broke DB-backed hierarchy checks.
UPDATE "roles" SET "level" = 90, "type" = 'system' WHERE "slug" = 'admin';
