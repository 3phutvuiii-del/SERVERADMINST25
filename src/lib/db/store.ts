import fs from 'fs';
import path from 'path';
import { AuditLogItem, AdminRole, PrimeMemberInfo } from '@/types/islepilot';

const DEFAULT_SEED_FILE = path.join(process.cwd(), 'data', 'store.json');
const DB_FILE = process.env.VERCEL
  ? path.join('/tmp', 'store.json')
  : DEFAULT_SEED_FILE;

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
  }
}

export interface PlayerNoteItem {
  id: string;
  steamId: string;
  playerName?: string;
  authorName: string;
  note: string;
  strikeLevel: number;
  createdAt: string;
}

export interface SteamRoleAssignment {
  steamId: string;
  playerName?: string;
  role: AdminRole;
  roleTitle?: string;
  note?: string;
  assignedBy?: string;
  assignedAt: string;
}


export interface MutationAuditLogItem {
  id: string;
  actorName: string;
  actorRole: AdminRole;
  targetSteamId: string;
  targetPlayerName?: string;
  species?: string;
  mutations: string[];
  elder?: 'No elder' | 'Frail' | 'Prime';
  reason: string;
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface DinoRecord {
  dinoId: string;
  steamId?: string;
  playerName?: string;
  species?: string;
  gender?: 'male' | 'female';
  growth?: number;
  mutations: string[];
  reincarnationCount?: number;
  elder?: 'No elder' | 'Frail' | 'Prime';
  isPrimeElder?: boolean;
  lineage?: {
    parent?: (string | null)[];
    elderA?: (string | null)[];
    elderB?: (string | null)[];
  };
  coordinates?: { x: number; y: number; z?: number };
  updatedAt?: string;
}

export interface AnnouncementTemplate {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'rules' | 'event' | 'maintenance' | 'discord';
  enabledForAuto: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AutoAnnounceConfig {
  enabled: boolean;
  intervalMinutes: number;
  mode: 'sequential' | 'random';
  currentTemplateIndex: number;
  lastBroadcastAt?: string;
  nextBroadcastAt?: string;
}

export interface BroadcastHistoryItem {
  id: string;
  content: string;
  source: 'manual' | 'auto';
  senderName: string;
  status: 'SUCCESS' | 'FAILED';
  sentAt: string;
}

export interface DiscordRolePermissionItem {
  roleName: string;
  description?: string;
  badgeColor?: string;
  permissions: {
    canViewDashboard: boolean;
    canViewPlayers: boolean;
    canInspectPlayer: boolean;
    canEditMutations: boolean;
    canEditStats: boolean;
    canManageGarage: boolean;
    canInjectDino: boolean;
    canWipeGarage: boolean;
    canBroadcast: boolean;
    canManageAnnouncer: boolean;
    canHealFeed: boolean;
    canTeleport: boolean;
    canKick: boolean;
    canBan: boolean;
    canSlay: boolean;
    canRevive: boolean;
    canManagePrime: boolean;
    canManageQuests: boolean;
    canViewCombatLogs: boolean;
    canFlagCombatViolations: boolean;
    canViewAuditLogs: boolean;
    canManageRoles: boolean;
  };
  updatedAt: string;
}

export const DEFAULT_FULL_PERMISSIONS: DiscordRolePermissionItem['permissions'] = {
  canViewDashboard: true,
  canViewPlayers: true,
  canInspectPlayer: true,
  canEditMutations: true,
  canEditStats: true,
  canManageGarage: true,
  canInjectDino: true,
  canWipeGarage: true,
  canBroadcast: true,
  canManageAnnouncer: true,
  canHealFeed: true,
  canTeleport: true,
  canKick: true,
  canBan: true,
  canSlay: true,
  canRevive: true,
  canManagePrime: true,
  canManageQuests: true,
  canViewCombatLogs: true,
  canFlagCombatViolations: true,
  canViewAuditLogs: true,
  canManageRoles: true,
};

export const DEFAULT_MOD_PERMISSIONS: DiscordRolePermissionItem['permissions'] = {
  canViewDashboard: true,
  canViewPlayers: true,
  canInspectPlayer: true,
  canEditMutations: true,
  canEditStats: true,
  canManageGarage: true,
  canInjectDino: false,
  canWipeGarage: false,
  canBroadcast: true,
  canManageAnnouncer: false,
  canHealFeed: true,
  canTeleport: true,
  canKick: true,
  canBan: false,
  canSlay: false,
  canRevive: true,
  canManagePrime: false,
  canManageQuests: true,
  canViewCombatLogs: true,
  canFlagCombatViolations: true,
  canViewAuditLogs: true,
  canManageRoles: false,
};

export const DEFAULT_VIEW_PERMISSIONS: DiscordRolePermissionItem['permissions'] = {
  canViewDashboard: true,
  canViewPlayers: true,
  canInspectPlayer: true,
  canEditMutations: false,
  canEditStats: false,
  canManageGarage: false,
  canInjectDino: false,
  canWipeGarage: false,
  canBroadcast: false,
  canManageAnnouncer: false,
  canHealFeed: false,
  canTeleport: false,
  canKick: false,
  canBan: false,
  canSlay: false,
  canRevive: false,
  canManagePrime: false,
  canManageQuests: false,
  canViewCombatLogs: true,
  canFlagCombatViolations: false,
  canViewAuditLogs: false,
  canManageRoles: false,
};

export const DEFAULT_NONE_PERMISSIONS: DiscordRolePermissionItem['permissions'] = {
  canViewDashboard: true,
  canViewPlayers: false,
  canInspectPlayer: false,
  canEditMutations: false,
  canEditStats: false,
  canManageGarage: false,
  canInjectDino: false,
  canWipeGarage: false,
  canBroadcast: false,
  canManageAnnouncer: false,
  canHealFeed: false,
  canTeleport: false,
  canKick: false,
  canBan: false,
  canSlay: false,
  canRevive: false,
  canManagePrime: false,
  canManageQuests: false,
  canViewCombatLogs: false,
  canFlagCombatViolations: false,
  canViewAuditLogs: false,
  canManageRoles: false,
};

export const DEFAULT_ST25_ROLES: DiscordRolePermissionItem[] = [
  {
    roleName: 'QUAN KHÂM SAI',
    description: 'Quản trị viên cấp cao nhất - Toàn quyền điều hành máy chủ',
    badgeColor: '#ef4444',
    permissions: { ...DEFAULT_FULL_PERMISSIONS },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'LONG KHÔNG (AD)',
    description: 'Admin sáng lập & điều hành server ST25',
    badgeColor: '#dc2626',
    permissions: { ...DEFAULT_FULL_PERMISSIONS },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'DEV',
    description: 'Nhà phát triển kỹ thuật & kiến trúc hệ thống',
    badgeColor: '#8b5cf6',
    permissions: { ...DEFAULT_FULL_PERMISSIONS },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'Mod',
    description: 'Ban quản trị hỗ trợ thành viên, xử lý vi phạm & đột biến',
    badgeColor: '#10b981',
    permissions: { ...DEFAULT_MOD_PERMISSIONS },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'LONG ĐẠI ĐỊA CHỦ',
    description: 'Thành viên VIP cấp 1 - Nhiều slot gara & theo dõi combat',
    badgeColor: '#f59e0b',
    permissions: { ...DEFAULT_VIEW_PERMISSIONS },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'LONG PHÚ NÔNG',
    description: 'Thành viên VIP cấp 2 - Xem trạng thái người chơi',
    badgeColor: '#eab308',
    permissions: { ...DEFAULT_VIEW_PERMISSIONS },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'LONG CHỦ',
    description: 'Thành viên VIP cấp 3',
    badgeColor: '#3b82f6',
    permissions: { ...DEFAULT_VIEW_PERMISSIONS, canInspectPlayer: false },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'LONG TÁ ĐIỀN',
    description: 'Thành viên đóng góp tích cực',
    badgeColor: '#06b6d4',
    permissions: { ...DEFAULT_NONE_PERMISSIONS },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'Server - Booster',
    description: 'Thành viên Boost Discord server ST25',
    badgeColor: '#ec4899',
    permissions: { ...DEFAULT_VIEW_PERMISSIONS, canInspectPlayer: false },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'Streamer',
    description: 'Nhà sáng tạo nội dung chính thức',
    badgeColor: '#a855f7',
    permissions: { ...DEFAULT_NONE_PERMISSIONS },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'Bảo Trợ',
    description: 'Thành viên quỹ phát triển máy chủ',
    badgeColor: '#14b8a6',
    permissions: { ...DEFAULT_NONE_PERMISSIONS },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'Luật sư',
    description: 'Giám sát viên quy tắc và luật giao tranh',
    badgeColor: '#6366f1',
    permissions: { ...DEFAULT_VIEW_PERMISSIONS, canFlagCombatViolations: true },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'Đầm Lầy',
    description: 'Gia tộc / Clan đặc nhiệm Đầm Lầy',
    badgeColor: '#84cc16',
    permissions: { ...DEFAULT_NONE_PERMISSIONS },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'Người mới',
    description: 'Thành viên mới tham gia cộng đồng ST25',
    badgeColor: '#71717a',
    permissions: { ...DEFAULT_NONE_PERMISSIONS, canViewDashboard: false },
    updatedAt: new Date().toISOString(),
  },
  {
    roleName: 'BOT SERVER',
    description: 'Tài khoản bot tự động của server',
    badgeColor: '#64748b',
    permissions: { ...DEFAULT_NONE_PERMISSIONS, canViewDashboard: false },
    updatedAt: new Date().toISOString(),
  },
];

// Persistent caches for server life-cycle (saved to disk)
class AdminDataStore {
  private auditLogs: AuditLogItem[] = [];
  private playerNotes: PlayerNoteItem[] = [];
  private primeMembers: PrimeMemberInfo[] = [];
  private mutationLogs: MutationAuditLogItem[] = [];
  private dinoStore: Record<string, DinoRecord> = {};
  private announcementTemplates: AnnouncementTemplate[] = [
    {
      id: 'tpl-1',
      title: 'Tham gia Discord Cộng Đồng ST25',
      content: '[ST25 VIETNAM] Tham gia Discord chính thức để nhận quà và cập nhật sự kiện: discord.gg/st25vn',
      category: 'discord',
      enabledForAuto: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tpl-2',
      title: 'Quy tắc Mixpack & Cấm Phá Game',
      content: '[LUẬT SERVER] Nghiêm cấm Mixpack khác loài hoặc bảo kê trái phép. Vi phạm kick/ban ngay!',
      category: 'rules',
      enabledForAuto: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tpl-3',
      title: 'Khuyến cáo không Glitch/Bug Kẹt Map',
      content: '[CẢNH BÁO] Không lợi dụng bug kẹt địa hình để né combat. Báo ngay Admin qua Discord khi gặp sự cố.',
      category: 'general',
      enabledForAuto: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tpl-4',
      title: 'Chúc người chơi săn mồi vui vẻ',
      content: '[SỰ KIỆN] Chúc toàn thể anh em sinh tồn mạnh mẽ và thành công tiến hóa Prime Elder trên ST25!',
      category: 'event',
      enabledForAuto: true,
      createdAt: new Date().toISOString(),
    },
  ];
  private autoAnnounceConfig: AutoAnnounceConfig = {
    enabled: false,
    intervalMinutes: 15,
    mode: 'sequential',
    currentTemplateIndex: 0,
    lastBroadcastAt: undefined,
    nextBroadcastAt: undefined,
  };
  private broadcastHistory: BroadcastHistoryItem[] = [];
  private playerMutations: Record<
    string,
    {
      mutations: string[];
      species?: string;
      elder?: 'No elder' | 'Frail' | 'Prime';
      lineage?: {
        parent?: (string | null)[];
        elderA?: (string | null)[];
        elderB?: (string | null)[];
      };
    }
  > = {};
  private garageSlotMutations: Record<
    string,
    {
      mutations: string[];
      elder?: 'No elder' | 'Frail' | 'Prime';
      lineage?: any;
    }
  > = {};

  private rolePermissions: Record<string, DiscordRolePermissionItem> = {};
  private steamRoleAssignments: Record<string, SteamRoleAssignment> = {};

  constructor() {
    this.initDefaultRoles();
    this.loadFromDisk();
  }

  private initDefaultRoles() {
    DEFAULT_ST25_ROLES.forEach((r) => {
      this.rolePermissions[r.roleName] = { ...r };
    });
  }

  private loadFromDisk() {
    try {
      const targetFile = fs.existsSync(DB_FILE)
        ? DB_FILE
        : fs.existsSync(DEFAULT_SEED_FILE)
        ? DEFAULT_SEED_FILE
        : null;

      if (targetFile) {
        const raw = fs.readFileSync(targetFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) this.auditLogs = parsed.auditLogs;
        if (parsed.playerNotes && typeof parsed.playerNotes === 'object') this.playerNotes = parsed.playerNotes;
        if (parsed.primeMembers && typeof parsed.primeMembers === 'object') this.primeMembers = parsed.primeMembers;
        if (parsed.mutationLogs && Array.isArray(parsed.mutationLogs)) this.mutationLogs = parsed.mutationLogs;
        if (parsed.playerMutations && typeof parsed.playerMutations === 'object') this.playerMutations = parsed.playerMutations;
        if (parsed.garageSlotMutations && typeof parsed.garageSlotMutations === 'object') this.garageSlotMutations = parsed.garageSlotMutations;
        if (parsed.dinoStore && typeof parsed.dinoStore === 'object') this.dinoStore = parsed.dinoStore;
        if (parsed.announcementTemplates && Array.isArray(parsed.announcementTemplates) && parsed.announcementTemplates.length > 0) {
          this.announcementTemplates = parsed.announcementTemplates;
        }
        if (parsed.autoAnnounceConfig) {
          this.autoAnnounceConfig = {
            ...this.autoAnnounceConfig,
            ...parsed.autoAnnounceConfig,
          };
        }
        if (parsed.broadcastHistory && Array.isArray(parsed.broadcastHistory)) {
          this.broadcastHistory = parsed.broadcastHistory;
        }
        if (parsed.rolePermissions && typeof parsed.rolePermissions === 'object') {
          // Merge custom roles with defaults
          this.rolePermissions = {
            ...this.rolePermissions,
            ...parsed.rolePermissions,
          };
        }
        if (parsed.steamRoleAssignments && typeof parsed.steamRoleAssignments === 'object') {
          this.steamRoleAssignments = {
            ...this.steamRoleAssignments,
            ...parsed.steamRoleAssignments,
          };
        }
      }
    } catch (err) {
      console.warn('[AdminDataStore] Failed to load data from disk:', err);
    }
  }

  private saveToDisk() {
    try {
      ensureDir(DB_FILE);
      // Read current disk to avoid stomping concurrent changes
      let existingOnDisk: any = {};
      const targetFile = fs.existsSync(DB_FILE)
        ? DB_FILE
        : fs.existsSync(DEFAULT_SEED_FILE)
        ? DEFAULT_SEED_FILE
        : null;
      if (targetFile) {
        try {
          const raw = fs.readFileSync(targetFile, 'utf-8');
          existingOnDisk = JSON.parse(raw) || {};
        } catch {}
      }

      const mergedSteamAssignments = {
        ...(existingOnDisk.steamRoleAssignments || {}),
        ...this.steamRoleAssignments,
      };

      const data = {
        ...existingOnDisk,
        auditLogs: this.auditLogs,
        playerNotes: this.playerNotes,
        primeMembers: this.primeMembers,
        mutationLogs: this.mutationLogs,
        playerMutations: this.playerMutations,
        garageSlotMutations: this.garageSlotMutations,
        dinoStore: this.dinoStore,
        announcementTemplates: this.announcementTemplates,
        autoAnnounceConfig: this.autoAnnounceConfig,
        broadcastHistory: this.broadcastHistory,
        rolePermissions: this.rolePermissions,
        steamRoleAssignments: this.steamRoleAssignments,
      };
      const jsonStr = JSON.stringify(data, null, 2);
      fs.writeFileSync(DB_FILE, jsonStr, 'utf-8');
      if (DB_FILE !== DEFAULT_SEED_FILE && fs.existsSync(path.dirname(DEFAULT_SEED_FILE))) {
        try {
          fs.writeFileSync(DEFAULT_SEED_FILE, jsonStr, 'utf-8');
        } catch {}
      }
    } catch (err) {
      console.warn('[AdminDataStore] Failed to save data to disk:', err);
    }
  }

  // ==========================================
  // STEAMID DIRECT ROLE ASSIGNMENTS
  // ==========================================
  getSteamRoleAssignments(): Record<string, SteamRoleAssignment> {
    this.loadFromDisk();
    return this.steamRoleAssignments;
  }

  assignRoleToSteamId(
    steamId: string,
    role: AdminRole,
    note?: string,
    playerName?: string,
    actor?: string
  ): SteamRoleAssignment {
    this.loadFromDisk();
    const roleTitles: Record<AdminRole, string> = {
      SUPER_ADMIN: 'Quan Khâm Sai (Toàn Quyền)',
      SENIOR_ADMIN: 'Senior Admin',
      MODERATOR: 'Moderator (Quản Trị Viên)',
      TRIAL_MOD: 'Trial Mod (Học Việc)',
      GUEST: 'Người Chơi',
    };
    const item: SteamRoleAssignment = {
      steamId,
      playerName: playerName || '',
      role,
      roleTitle: roleTitles[role] || role,
      note: note || '',
      assignedBy: actor || 'SuperAdmin',
      assignedAt: new Date().toISOString(),
    };
    this.steamRoleAssignments[steamId] = item;
    this.saveToDisk();
    return item;
  }

  removeRoleFromSteamId(steamId: string): boolean {
    this.loadFromDisk();
    if (this.steamRoleAssignments[steamId]) {
      delete this.steamRoleAssignments[steamId];
      this.saveToDisk();
      return true;
    }
    return false;
  }

  getRoleForSteamId(steamId: string): AdminRole | null {
    this.loadFromDisk();
    return this.steamRoleAssignments[steamId]?.role || null;
  }

  // ==========================================
  // DISCORD RBAC PERMISSIONS METHODS
  // ==========================================
  getRolePermissions(): DiscordRolePermissionItem[] {
    return Object.values(this.rolePermissions);
  }

  getRolePermission(roleName: string): DiscordRolePermissionItem | undefined {
    return this.rolePermissions[roleName];
  }

  saveRolePermission(item: DiscordRolePermissionItem): DiscordRolePermissionItem {
    const updated: DiscordRolePermissionItem = {
      ...item,
      updatedAt: new Date().toISOString(),
    };
    this.rolePermissions[item.roleName] = updated;
    this.saveToDisk();
    return updated;
  }

  deleteRolePermission(roleName: string): boolean {
    if (this.rolePermissions[roleName]) {
      delete this.rolePermissions[roleName];
      this.saveToDisk();
      return true;
    }
    return false;
  }

  resetRolePermissionsToDefault(): DiscordRolePermissionItem[] {
    this.rolePermissions = {};
    this.initDefaultRoles();
    this.saveToDisk();
    return Object.values(this.rolePermissions);
  }

  /**
   * Calculate merged permissions (Union) for a set of Discord role names
   */
  getUserEffectivePermissions(roleNames: string[]): DiscordRolePermissionItem['permissions'] {
    // Start with all false
    const result: DiscordRolePermissionItem['permissions'] = { ...DEFAULT_NONE_PERMISSIONS, canViewDashboard: false };

    if (!roleNames || roleNames.length === 0) {
      return result;
    }

    for (const rName of roleNames) {
      const roleItem = this.rolePermissions[rName];
      if (roleItem) {
        // Union each permission boolean
        for (const [key, val] of Object.entries(roleItem.permissions)) {
          if (val === true) {
            (result as any)[key] = true;
          }
        }
      }
    }

    return result;
  }

  // Audit Logs
  getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  addAuditLog(entry: {
    actorId: string;
    actorName: string;
    actorRole: AdminRole;
    action: string;
    targetSteamId?: string;
    targetName?: string;
    reason?: string;
    payload?: any;
    status?: 'SUCCESS' | 'FAILED' | 'PENDING';
  }): AuditLogItem {
    const item: AuditLogItem = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actorId: entry.actorId,
      actorName: entry.actorName,
      actorRole: entry.actorRole,
      action: entry.action,
      targetSteamId: entry.targetSteamId,
      targetName: entry.targetName,
      reason: entry.reason || 'Không ghi rõ lý do',
      payload: entry.payload,
      status: entry.status || 'SUCCESS',
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(item);
    this.saveToDisk();
    return item;
  }

  // Player Notes & Strikes
  getPlayerNotes(steamId?: string): PlayerNoteItem[] {
    if (steamId) {
      return this.playerNotes.filter((n) => n.steamId === steamId);
    }
    return [...this.playerNotes];
  }

  addPlayerNote(data: {
    steamId: string;
    playerName?: string;
    authorName: string;
    note: string;
    strikeLevel?: number;
  }): PlayerNoteItem {
    const item: PlayerNoteItem = {
      id: `pn-${Date.now()}`,
      steamId: data.steamId,
      playerName: data.playerName,
      authorName: data.authorName,
      note: data.note,
      strikeLevel: data.strikeLevel ?? 0,
      createdAt: new Date().toISOString(),
    };
    this.playerNotes.unshift(item);
    this.saveToDisk();
    return item;
  }

  // Prime Members
  getPrimeMembers(): PrimeMemberInfo[] {
    return [...this.primeMembers];
  }

  savePrimeMember(member: PrimeMemberInfo): void {
    const idx = this.primeMembers.findIndex((m) => m.steamId === member.steamId);
    if (idx >= 0) {
      this.primeMembers[idx] = member;
    } else {
      this.primeMembers.unshift(member);
    }
    this.saveToDisk();
  }

  // Mutations Storage
  getPlayerMutations(steamId: string) {
    return this.playerMutations[steamId];
  }

  setPlayerMutations(
    steamId: string,
    data:
      | {
          mutations: string[];
          species?: string;
          elder?: 'No elder' | 'Frail' | 'Prime';
          lineage?: any;
        }
      | string[]
  ): void {
    if (Array.isArray(data)) {
      this.playerMutations[steamId] = {
        mutations: data,
        elder: 'No elder',
      };
    } else {
      this.playerMutations[steamId] = data;
    }
    this.saveToDisk();
  }

  // First-Class Dinosaur UID & Reincarnation Storage
  getDino(dinoId: string): DinoRecord | undefined {
    if (!dinoId) return undefined;
    return this.dinoStore[dinoId];
  }

  getDinoBySteamId(steamId: string): DinoRecord | undefined {
    if (!steamId) return undefined;
    const list = Object.values(this.dinoStore).filter((d) => d.steamId === steamId);
    if (list.length === 0) return undefined;
    list.sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );
    return list[0];
  }

  saveDino(dinoId: string, data: Partial<DinoRecord> & { mutations?: string[] }): DinoRecord {
    if (!dinoId) throw new Error('dinoId is required');
    const existing = this.dinoStore[dinoId] || {
      dinoId,
      mutations: [],
      reincarnationCount: 0,
    };

    const validMuts = (data.mutations || existing.mutations || []).filter(
      (m) => m && m !== 'None' && m !== '-'
    );

    const updated: DinoRecord = {
      ...existing,
      ...data,
      dinoId,
      mutations: validMuts,
      updatedAt: new Date().toISOString(),
    };

    this.dinoStore[dinoId] = updated;

    // Backwards compatibility mappings
    this.garageSlotMutations[dinoId] = {
      mutations: updated.mutations,
      elder: updated.elder,
      lineage: updated.lineage,
    };

    if (updated.steamId) {
      this.playerMutations[updated.steamId] = {
        mutations: updated.mutations,
        elder: updated.elder,
        lineage: updated.lineage,
      };
    }

    this.saveToDisk();
    return updated;
  }

  transferDino(
    dinoId: string,
    targetSteamId: string,
    targetPlayerName?: string
  ): { success: boolean; dino?: DinoRecord; error?: string } {
    const existing = this.dinoStore[dinoId];
    if (!existing) {
      return { success: false, error: `Không tìm thấy Dino với ID ${dinoId}` };
    }

    const updated: DinoRecord = {
      ...existing,
      steamId: targetSteamId,
      playerName: targetPlayerName || existing.playerName,
      updatedAt: new Date().toISOString(),
    };

    this.dinoStore[dinoId] = updated;

    this.garageSlotMutations[dinoId] = {
      mutations: updated.mutations,
      elder: updated.elder,
      lineage: updated.lineage,
    };

    this.playerMutations[targetSteamId] = {
      mutations: updated.mutations,
      elder: updated.elder,
      lineage: updated.lineage,
    };

    this.saveToDisk();
    return { success: true, dino: updated };
  }

  getAllDinos(): Record<string, DinoRecord> {
    return { ...this.dinoStore };
  }

  reincarnateDino(
    dinoId: string,
    newMutations?: string[],
    options?: { elder?: 'No elder' | 'Frail' | 'Prime'; lineage?: any }
  ): DinoRecord {
    const existing = this.dinoStore[dinoId] || {
      dinoId,
      mutations: [],
      reincarnationCount: 0,
    };

    const currentCount = existing.reincarnationCount || 0;
    const mergedMuts = Array.from(
      new Set([...(existing.mutations || []), ...(newMutations || [])])
    ).filter((m) => m && m !== 'None' && m !== '-');

    const updated: DinoRecord = {
      ...existing,
      dinoId,
      reincarnationCount: currentCount + 1,
      mutations: mergedMuts,
      elder: options?.elder || existing.elder,
      isPrimeElder: options?.elder === 'Prime' || existing.isPrimeElder,
      lineage: options?.lineage || existing.lineage,
      updatedAt: new Date().toISOString(),
    };

    this.dinoStore[dinoId] = updated;
    this.saveToDisk();
    return updated;
  }

  getGarageSlotMutations(slotId: string) {
    const dino = this.dinoStore[slotId];
    if (dino) {
      return {
        mutations: dino.mutations,
        elder: dino.elder,
        lineage: dino.lineage,
      };
    }
    return this.garageSlotMutations[slotId];
  }

  setGarageSlotMutations(
    slotId: string,
    data: {
      mutations: string[];
      elder?: 'No elder' | 'Frail' | 'Prime';
      lineage?: any;
      species?: string;
      steamId?: string;
    }
  ): void {
    this.saveDino(slotId, {
      dinoId: slotId,
      mutations: data.mutations,
      elder: data.elder,
      lineage: data.lineage,
      species: data.species,
      steamId: data.steamId,
    });
  }

  // Mutation Audit Logs
  getMutationLogs(): MutationAuditLogItem[] {
    return [...this.mutationLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  clearMutationLogs(): void {
    this.mutationLogs = [];
    this.saveToDisk();
  }

  addMutationLog(entry: {
    actorName: string;
    actorRole: AdminRole;
    targetSteamId: string;
    targetPlayerName?: string;
    species?: string;
    mutations: string[];
    elder?: 'No elder' | 'Frail' | 'Prime';
    reason: string;
    status: 'SUCCESS' | 'FAILED';
  }): MutationAuditLogItem {
    const item: MutationAuditLogItem = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actorName: entry.actorName,
      actorRole: entry.actorRole,
      targetSteamId: entry.targetSteamId,
      targetPlayerName: entry.targetPlayerName,
      species: entry.species || 'Unknown Species',
      mutations: entry.mutations,
      elder: entry.elder || 'No elder',
      reason: entry.reason,
      status: entry.status,
      createdAt: new Date().toISOString(),
    };
    this.mutationLogs.unshift(item);
    this.saveToDisk();
    return item;
  }

  // ==========================================
  // Announcement Templates & Auto-Broadcasting
  // ==========================================
  getAnnouncementTemplates(): AnnouncementTemplate[] {
    return [...this.announcementTemplates];
  }

  saveAnnouncementTemplate(
    data: Omit<AnnouncementTemplate, 'id' | 'createdAt'> & { id?: string }
  ): AnnouncementTemplate {
    if (data.id) {
      const idx = this.announcementTemplates.findIndex((t) => t.id === data.id);
      if (idx >= 0) {
        this.announcementTemplates[idx] = {
          ...this.announcementTemplates[idx],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        this.saveToDisk();
        return this.announcementTemplates[idx];
      }
    }
    const item: AnnouncementTemplate = {
      id: `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: data.title,
      content: data.content,
      category: data.category || 'general',
      enabledForAuto: data.enabledForAuto !== false,
      createdAt: new Date().toISOString(),
    };
    this.announcementTemplates.unshift(item);
    this.saveToDisk();
    return item;
  }

  deleteAnnouncementTemplate(id: string): boolean {
    const before = this.announcementTemplates.length;
    this.announcementTemplates = this.announcementTemplates.filter((t) => t.id !== id);
    if (this.announcementTemplates.length !== before) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  getAutoAnnounceConfig(): AutoAnnounceConfig {
    return { ...this.autoAnnounceConfig };
  }

  updateAutoAnnounceConfig(updates: Partial<AutoAnnounceConfig>): AutoAnnounceConfig {
    this.autoAnnounceConfig = {
      ...this.autoAnnounceConfig,
      ...updates,
    };
    this.saveToDisk();
    return { ...this.autoAnnounceConfig };
  }

  getBroadcastHistory(): BroadcastHistoryItem[] {
    return [...this.broadcastHistory].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
  }

  addBroadcastHistory(entry: {
    content: string;
    source: 'manual' | 'auto';
    senderName: string;
    status: 'SUCCESS' | 'FAILED';
  }): BroadcastHistoryItem {
    const item: BroadcastHistoryItem = {
      id: `bc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      content: entry.content,
      source: entry.source,
      senderName: entry.senderName,
      status: entry.status,
      sentAt: new Date().toISOString(),
    };
    this.broadcastHistory.unshift(item);
    if (this.broadcastHistory.length > 100) {
      this.broadcastHistory = this.broadcastHistory.slice(0, 100);
    }
    this.saveToDisk();
    return item;
  }

  clearBroadcastHistory(): void {
    this.broadcastHistory = [];
    this.saveToDisk();
  }
}

const globalForAdminStore = globalThis as unknown as { adminStore?: AdminDataStore };
export const adminStore = globalForAdminStore.adminStore ?? new AdminDataStore();
globalForAdminStore.adminStore = adminStore;

