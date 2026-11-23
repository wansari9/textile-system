-- 002_roles.sql
-- Introduce the LINE_MANAGER role while keeping SUPERVISOR accepted so the
-- migration can be rolled back or re-run safely. Existing supervisors are
-- migrated because in this system a supervisor is a line manager.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('ADMIN', 'LINE_MANAGER', 'SUPERVISOR'));

UPDATE users
   SET role = 'LINE_MANAGER'
 WHERE role = 'SUPERVISOR';

CREATE INDEX IF NOT EXISTS ix_users_assigned_line ON users (assigned_line_id);
