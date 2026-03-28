import { ApiError } from '../middlewares/error.middleware.js';

export const SUPER_ADMIN_ID = BigInt(process.env.SUPER_ADMIN_ID || '1');
export const SYSTEM_ROLES = ['customer', 'staff', 'manager', 'admin'] as const;

const ROLE_LEVELS: Record<string, number> = {
  customer: 0,
  staff: 1,
  manager: 2,
  admin: 3
};

export const isKnownRole = (role?: string | null): role is (typeof SYSTEM_ROLES)[number] =>
  !!role && SYSTEM_ROLES.includes(role as (typeof SYSTEM_ROLES)[number]);

export const getRoleLevel = (role?: string | null) => ROLE_LEVELS[role || ''] ?? -1;

export const isSuperAdmin = (userId?: bigint | string | number | null) => {
  if (userId === undefined || userId === null) {
    return false;
  }

  return BigInt(userId) === SUPER_ADMIN_ID;
};

export const canAssignRole = (
  actor: { id?: bigint | string | number | null; role?: string | null },
  targetRole: string
) => {
  if (!targetRole) {
    return true;
  }

  if (!isKnownRole(targetRole)) {
    return false;
  }

  if (isSuperAdmin(actor.id)) {
    return true;
  }

  return getRoleLevel(actor.role) > getRoleLevel(targetRole);
};

export const getReadableRoles = (actor: { id?: bigint | string | number | null; role?: string | null }) => {
  if (isSuperAdmin(actor.id)) {
    return [...SYSTEM_ROLES];
  }

  const actorRoleLevel = getRoleLevel(actor.role);
  return SYSTEM_ROLES.filter((role) => getRoleLevel(role) < actorRoleLevel);
};

export const assertCanReadTargetUser = (
  actor: { id?: bigint | string | number | null; role?: string | null },
  target: { id?: bigint | string | number | null; role?: string | null }
) => {
  if (!actor?.id || !actor?.role) {
    throw new ApiError(401, 'Authentication required');
  }

  if (target?.id !== undefined && target?.id !== null) {
    if (BigInt(target.id) === SUPER_ADMIN_ID && !isSuperAdmin(actor.id)) {
      throw new ApiError(403, 'Không thể truy cập Tài khoản Gốc');
    }
  }

  if (!target?.role) {
    return;
  }

  if (!isKnownRole(target.role) && !isSuperAdmin(actor.id)) {
    throw new ApiError(403, 'Vai trò này không còn được hệ thống hỗ trợ');
  }

  if (!isSuperAdmin(actor.id) && getRoleLevel(actor.role) <= getRoleLevel(target.role)) {
    throw new ApiError(403, 'Bạn không thể truy cập tài khoản cùng cấp hoặc cao hơn');
  }
};

export const assertCanManageTargetUser = (
  actor: { id?: bigint | string | number | null; role?: string | null },
  target: { id?: bigint | string | number | null; role?: string | null }
) => {
  if (!actor?.id || !actor?.role) {
    throw new ApiError(401, 'Authentication required');
  }

  if (target?.id !== undefined && target?.id !== null) {
    if (BigInt(target.id) === SUPER_ADMIN_ID && !isSuperAdmin(actor.id)) {
      throw new ApiError(403, 'Không thể tác động tới Tài khoản Gốc');
    }
  }

  if (target?.role && !isKnownRole(target.role) && !isSuperAdmin(actor.id)) {
    throw new ApiError(403, 'Vai trò này không còn được hệ thống hỗ trợ');
  }

  if (target?.role && !isSuperAdmin(actor.id) && getRoleLevel(actor.role) <= getRoleLevel(target.role)) {
    throw new ApiError(403, 'Bạn không thể tác động tới tài khoản cùng cấp hoặc cao hơn');
  }
};
