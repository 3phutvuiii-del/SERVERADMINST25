import { AdminRole } from '@/types/islepilot';

export interface PermissionDefinition {
  canViewDashboard: boolean;
  canViewPlayers: boolean;
  canInspectPlayer: boolean;
  canEditMutations: boolean;
  canEditStats: boolean;
  canHealFeed: boolean;
  canTeleport: boolean;
  canKick: boolean;
  canSlay: boolean;
  canRevive: boolean;
  canBan: boolean;
  canManageGarage: boolean;
  canInjectDino: boolean;
  canWipeGarage: boolean;
  canBroadcast: boolean;
  canManageAnnouncer: boolean;
  canManagePrime: boolean;
  canManageQuests: boolean;
  canViewCombatLogs: boolean;
  canFlagCombatViolations: boolean;
  canViewAuditLogs: boolean;
  canManageRoles: boolean;
  canManageAdminRoles: boolean;
}

export const ROLE_PERMISSIONS: Record<AdminRole, PermissionDefinition> = {
  GUEST: {
    canViewDashboard: true,
    canViewPlayers: false,
    canInspectPlayer: false,
    canEditMutations: false,
    canEditStats: false,
    canHealFeed: false,
    canTeleport: false,
    canKick: false,
    canSlay: false,
    canRevive: false,
    canBan: false,
    canManageGarage: false,
    canInjectDino: false,
    canWipeGarage: false,
    canBroadcast: false,
    canManageAnnouncer: false,
    canManagePrime: false,
    canManageQuests: false,
    canViewCombatLogs: false,
    canFlagCombatViolations: false,
    canViewAuditLogs: false,
    canManageRoles: false,
    canManageAdminRoles: false,
  },
  TRIAL_MOD: {
    canViewDashboard: true,
    canViewPlayers: true,
    canInspectPlayer: true,
    canEditMutations: false,
    canEditStats: false,
    canHealFeed: true,
    canTeleport: false,
    canKick: false,
    canSlay: false,
    canRevive: false,
    canBan: false,
    canManageGarage: false,
    canInjectDino: false,
    canWipeGarage: false,
    canBroadcast: false,
    canManageAnnouncer: false,
    canManagePrime: false,
    canManageQuests: true,
    canViewCombatLogs: true,
    canFlagCombatViolations: false,
    canViewAuditLogs: false,
    canManageRoles: false,
    canManageAdminRoles: false,
  },
  MODERATOR: {
    canViewDashboard: true,
    canViewPlayers: true,
    canInspectPlayer: true,
    canEditMutations: true,
    canEditStats: true,
    canHealFeed: true,
    canTeleport: true,
    canKick: true,
    canSlay: false,
    canRevive: true,
    canBan: false,
    canManageGarage: true,
    canInjectDino: false,
    canWipeGarage: false,
    canBroadcast: true,
    canManageAnnouncer: false,
    canManagePrime: false,
    canManageQuests: true,
    canViewCombatLogs: true,
    canFlagCombatViolations: true,
    canViewAuditLogs: true,
    canManageRoles: false,
    canManageAdminRoles: false,
  },
  SENIOR_ADMIN: {
    canViewDashboard: true,
    canViewPlayers: true,
    canInspectPlayer: true,
    canEditMutations: true,
    canEditStats: true,
    canHealFeed: true,
    canTeleport: true,
    canKick: true,
    canSlay: true,
    canRevive: true,
    canBan: true,
    canManageGarage: true,
    canInjectDino: true,
    canWipeGarage: false,
    canBroadcast: true,
    canManageAnnouncer: true,
    canManagePrime: true,
    canManageQuests: true,
    canViewCombatLogs: true,
    canFlagCombatViolations: true,
    canViewAuditLogs: true,
    canManageRoles: false,
    canManageAdminRoles: false,
  },
  SUPER_ADMIN: {
    canViewDashboard: true,
    canViewPlayers: true,
    canInspectPlayer: true,
    canEditMutations: true,
    canEditStats: true,
    canHealFeed: true,
    canTeleport: true,
    canKick: true,
    canSlay: true,
    canRevive: true,
    canBan: true,
    canManageGarage: true,
    canInjectDino: true,
    canWipeGarage: true,
    canBroadcast: true,
    canManageAnnouncer: true,
    canManagePrime: true,
    canManageQuests: true,
    canViewCombatLogs: true,
    canFlagCombatViolations: true,
    canViewAuditLogs: true,
    canManageRoles: true,
    canManageAdminRoles: true,
  },
};

/**
 * Check permission with fallback to custom permissions map if provided
 */
export function hasPermission(
  role: AdminRole | string,
  permission: keyof PermissionDefinition,
  customEffectivePermissions?: Partial<Record<keyof PermissionDefinition, boolean>>
): boolean {
  if (customEffectivePermissions && customEffectivePermissions[permission] !== undefined) {
    return !!customEffectivePermissions[permission];
  }

  // Check built-in AdminRole
  if (role in ROLE_PERMISSIONS) {
    return !!ROLE_PERMISSIONS[role as AdminRole]?.[permission];
  }

  // Fallback for custom role strings
  if (role === 'QUAN KHÂM SAI' || role === 'DEV' || role === 'LONG KHÔNG (AD)') {
    return true;
  }
  if (role === 'Mod') {
    return !!ROLE_PERMISSIONS.MODERATOR[permission];
  }

  return false;
}

export const ROLE_BADGE_STYLE: Record<AdminRole, { label: string; bg: string; text: string; border: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  SENIOR_ADMIN: {
    label: 'Senior Admin',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  MODERATOR: {
    label: 'Moderator',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  TRIAL_MOD: {
    label: 'Trial Mod',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
  },
  GUEST: {
    label: 'Chưa đăng nhập',
    bg: 'bg-zinc-800/80',
    text: 'text-zinc-400',
    border: 'border-zinc-700/80',
  },
};
