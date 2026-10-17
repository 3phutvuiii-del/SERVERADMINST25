import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const host = process.env.MYSQL_HOST || '127.0.0.1';
    const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DATABASE || 'adminpanelst25';

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      charset: 'utf8mb4_unicode_ci',
    });
  }
  return pool;
}

export async function testDbConnection(): Promise<{ success: boolean; message: string; version?: string }> {
  try {
    const p = getDbPool();
    const [rows] = await p.query<any[]>('SELECT VERSION() as version');
    const version = rows[0]?.version;
    return { success: true, message: 'Connected to MySQL successfully', version };
  } catch (err: any) {
    return { success: false, message: err?.message || String(err) };
  }
}

// ==========================================
// MYSQL REPOSITORY HELPERS FOR MUTATIONS & GARAGE
// ==========================================

export interface DbPlayerProfile {
  steam_id: string;
  player_name?: string;
  online?: number;
  species?: string;
  gender?: 'male' | 'female';
  growth?: number;
  elder?: 'No elder' | 'Frail' | 'Prime';
  pos_x?: number;
  pos_y?: number;
  pos_z?: number;
  active_mutations?: string[];
  lineage_mutations?: {
    parent?: (string | null)[];
    elderA?: (string | null)[];
    elderB?: (string | null)[];
  };
  updated_at?: string;
}

export async function getPlayerProfileFromDb(steamId: string): Promise<DbPlayerProfile | null> {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM `player_live_profiles` WHERE `steam_id` = ? LIMIT 1',
      [steamId]
    );
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      steam_id: r.steam_id,
      player_name: r.player_name,
      online: r.online,
      species: r.species,
      gender: r.gender,
      growth: r.growth != null ? parseFloat(r.growth) : undefined,
      elder: r.elder,
      pos_x: r.pos_x != null ? parseFloat(r.pos_x) : undefined,
      pos_y: r.pos_y != null ? parseFloat(r.pos_y) : undefined,
      pos_z: r.pos_z != null ? parseFloat(r.pos_z) : undefined,
      active_mutations: typeof r.active_mutations === 'string' ? JSON.parse(r.active_mutations) : r.active_mutations || [],
      lineage_mutations: typeof r.lineage_mutations === 'string' ? JSON.parse(r.lineage_mutations) : r.lineage_mutations || null,
      updated_at: r.updated_at,
    };
  } catch (err) {
    console.warn('[MySQL] Error querying player profile:', err);
    return null;
  }
}

export async function upsertPlayerProfileToDb(profile: DbPlayerProfile): Promise<boolean> {
  try {
    const pool = getDbPool();
    const activeJson = JSON.stringify(profile.active_mutations || []);
    const lineageJson = profile.lineage_mutations ? JSON.stringify(profile.lineage_mutations) : null;
    await pool.query(
      `INSERT INTO \`player_live_profiles\` 
        (\`steam_id\`, \`player_name\`, \`online\`, \`species\`, \`gender\`, \`growth\`, \`elder\`, \`pos_x\`, \`pos_y\`, \`pos_z\`, \`active_mutations\`, \`lineage_mutations\`, \`updated_at\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
        \`player_name\` = COALESCE(VALUES(\`player_name\`), \`player_name\`),
        \`online\` = VALUES(\`online\`),
        \`species\` = COALESCE(VALUES(\`species\`), \`species\`),
        \`gender\` = COALESCE(VALUES(\`gender\`), \`gender\`),
        \`growth\` = COALESCE(VALUES(\`growth\`), \`growth\`),
        \`elder\` = COALESCE(VALUES(\`elder\`), \`elder\`),
        \`pos_x\` = COALESCE(VALUES(\`pos_x\`), \`pos_x\`),
        \`pos_y\` = COALESCE(VALUES(\`pos_y\`), \`pos_y\`),
        \`pos_z\` = COALESCE(VALUES(\`pos_z\`), \`pos_z\`),
        \`active_mutations\` = VALUES(\`active_mutations\`),
        \`lineage_mutations\` = COALESCE(VALUES(\`lineage_mutations\`), \`lineage_mutations\`),
        \`updated_at\` = NOW()`,
      [
        profile.steam_id,
        profile.player_name || null,
        profile.online ?? 1,
        profile.species || 'Tyrannosaurus',
        profile.gender || 'male',
        profile.growth ?? 1.0,
        profile.elder || 'No elder',
        profile.pos_x ?? null,
        profile.pos_y ?? null,
        profile.pos_z ?? null,
        activeJson,
        lineageJson,
      ]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error upserting player profile:', err);
    return false;
  }
}

export interface DbGarageSlot {
  slot_id: string;
  steam_id?: string;
  species?: string;
  gender?: 'male' | 'female';
  growth?: number;
  mutations?: string[];
  elder?: 'No elder' | 'Frail' | 'Prime';
  lineage?: {
    parent?: (string | null)[];
    elderA?: (string | null)[];
    elderB?: (string | null)[];
  };
  updated_at?: string;
}

export async function getGarageSlotFromDb(slotId: string): Promise<DbGarageSlot | null> {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM `garage_slot_mutations` WHERE `slot_id` = ? LIMIT 1',
      [slotId]
    );
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      slot_id: r.slot_id,
      steam_id: r.steam_id,
      species: r.species,
      gender: r.gender,
      growth: r.growth != null ? parseFloat(r.growth) : undefined,
      mutations: typeof r.mutations === 'string' ? JSON.parse(r.mutations) : r.mutations || [],
      elder: r.elder,
      lineage: typeof r.lineage === 'string' ? JSON.parse(r.lineage) : r.lineage || null,
      updated_at: r.updated_at,
    };
  } catch (err) {
    console.warn('[MySQL] Error getting garage slot from db:', err);
    return null;
  }
}

export async function getAllGarageSlotsFromDb(): Promise<Record<string, DbGarageSlot>> {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM `garage_slot_mutations`');
    const result: Record<string, DbGarageSlot> = {};
    for (const r of rows) {
      result[r.slot_id] = {
        slot_id: r.slot_id,
        steam_id: r.steam_id,
        species: r.species,
        gender: r.gender,
        growth: r.growth != null ? parseFloat(r.growth) : undefined,
        mutations: typeof r.mutations === 'string' ? JSON.parse(r.mutations) : r.mutations || [],
        elder: r.elder,
        lineage: typeof r.lineage === 'string' ? JSON.parse(r.lineage) : r.lineage || null,
        updated_at: r.updated_at,
      };
    }
    return result;
  } catch (err) {
    console.warn('[MySQL] Error getting all garage slots:', err);
    return {};
  }
}

export async function upsertGarageSlotToDb(slot: DbGarageSlot): Promise<boolean> {
  try {
    const pool = getDbPool();
    const mutsJson = JSON.stringify(slot.mutations || []);
    const lineageJson = slot.lineage ? JSON.stringify(slot.lineage) : null;
    await pool.query(
      `INSERT INTO \`garage_slot_mutations\`
        (\`slot_id\`, \`steam_id\`, \`species\`, \`gender\`, \`growth\`, \`mutations\`, \`elder\`, \`lineage\`, \`updated_at\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
        \`steam_id\` = COALESCE(VALUES(\`steam_id\`), \`steam_id\`),
        \`species\` = COALESCE(VALUES(\`species\`), \`species\`),
        \`gender\` = COALESCE(VALUES(\`gender\`), \`gender\`),
        \`growth\` = COALESCE(VALUES(\`growth\`), \`growth\`),
        \`mutations\` = VALUES(\`mutations\`),
        \`elder\` = COALESCE(VALUES(\`elder\`), \`elder\`),
        \`lineage\` = COALESCE(VALUES(\`lineage\`), \`lineage\`),
        \`updated_at\` = NOW()`,
      [
        slot.slot_id,
        slot.steam_id || null,
        slot.species || 'Tyrannosaurus',
        slot.gender || 'male',
        slot.growth ?? 1.0,
        mutsJson,
        slot.elder || 'No elder',
        lineageJson,
      ]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error upserting garage slot:', err);
    return false;
  }
}

export interface DbPlayerNote {
  id: string;
  steamId: string;
  playerName?: string;
  authorName: string;
  note: string;
  strikeLevel: number;
  createdAt: string;
}

export async function getPlayerNotesFromDb(steamId: string): Promise<DbPlayerNote[]> {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<any[]>(
      'SELECT `id`, `steam_id` as steamId, `player_name` as playerName, `author_name` as authorName, `note`, `strike_level` as strikeLevel, `created_at` as createdAt FROM `player_notes` WHERE `steam_id` = ? ORDER BY `created_at` DESC',
      [steamId]
    );
    return rows.map((r) => ({
      id: r.id,
      steamId: r.steamId,
      playerName: r.playerName,
      authorName: r.authorName,
      note: r.note,
      strikeLevel: r.strikeLevel,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[MySQL] Error getting player notes:', err);
    return [];
  }
}

export async function addPlayerNoteToDb(note: DbPlayerNote): Promise<boolean> {
  try {
    const pool = getDbPool();
    await pool.query(
      'INSERT INTO `player_notes` (`id`, `steam_id`, `player_name`, `author_name`, `note`, `strike_level`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [note.id, note.steamId, note.playerName || null, note.authorName, note.note, note.strikeLevel, note.createdAt]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error adding player note:', err);
    return false;
  }
}

// ==========================================
// ROLES & PERMISSIONS
// ==========================================
export interface DbSteamRoleAssignment {
  steamId: string;
  playerName?: string;
  role: string;
  roleTitle?: string;
  note?: string;
  assignedBy?: string;
  assignedAt: string;
}

export async function getSteamRoleAssignmentsFromDb(): Promise<Record<string, DbSteamRoleAssignment>> {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM `steam_role_assignments`');
    const result: Record<string, DbSteamRoleAssignment> = {};
    for (const r of rows) {
      result[r.steam_id] = {
        steamId: r.steam_id,
        playerName: r.player_name,
        role: r.role,
        roleTitle: r.role_title,
        note: r.note,
        assignedBy: r.assigned_by,
        assignedAt: r.assigned_at ? new Date(r.assigned_at).toISOString() : new Date().toISOString(),
      };
    }
    return result;
  } catch (err) {
    console.warn('[MySQL] Error getting role assignments:', err);
    return {};
  }
}

export async function saveSteamRoleAssignmentToDb(assign: DbSteamRoleAssignment): Promise<boolean> {
  try {
    const pool = getDbPool();
    await pool.query(
      `INSERT INTO \`steam_role_assignments\` (\`steam_id\`, \`player_name\`, \`role\`, \`role_title\`, \`note\`, \`assigned_by\`, \`assigned_at\`)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        \`player_name\` = VALUES(\`player_name\`),
        \`role\` = VALUES(\`role\`),
        \`role_title\` = VALUES(\`role_title\`),
        \`note\` = VALUES(\`note\`),
        \`assigned_by\` = VALUES(\`assigned_by\`),
        \`assigned_at\` = VALUES(\`assigned_at\`)`,
      [assign.steamId, assign.playerName || null, assign.role, assign.roleTitle || null, assign.note || null, assign.assignedBy || 'System', assign.assignedAt]
    );
    return true;
  } catch (err: any) {
    console.error('[MySQL] Error saving steam role assignment:', err);
    throw new Error(`Lỗi ghi Database MySQL: ${err.message || String(err)}`);
  }
}

export async function removeSteamRoleAssignmentFromDb(steamId: string): Promise<boolean> {
  try {
    const pool = getDbPool();
    await pool.query('DELETE FROM `steam_role_assignments` WHERE `steam_id` = ?', [steamId]);
    return true;
  } catch (err: any) {
    console.error('[MySQL] Error deleting steam role assignment:', err);
    throw new Error(`Lỗi xóa dữ liệu MySQL: ${err.message || String(err)}`);
  }
}

export async function getRolePermissionsFromDb(): Promise<Record<string, any>> {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM `role_permissions`');
    const result: Record<string, any> = {};
    for (const r of rows) {
      result[r.role_name] = {
        roleName: r.role_name,
        description: r.description,
        badgeColor: r.badge_color,
        permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions,
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      };
    }
    return result;
  } catch (err: any) {
    console.error('[MySQL] Error getting role permissions:', err);
    return {};
  }
}

export async function saveRolePermissionToDb(role: { roleName: string; description?: string; badgeColor?: string; permissions: any }): Promise<boolean> {
  try {
    const pool = getDbPool();
    const permJson = JSON.stringify(role.permissions || {});
    await pool.query(
      `INSERT INTO \`role_permissions\` (\`role_name\`, \`description\`, \`badge_color\`, \`permissions\`, \`updated_at\`)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
        \`description\` = VALUES(\`description\`),
        \`badge_color\` = VALUES(\`badge_color\`),
        \`permissions\` = VALUES(\`permissions\`),
        \`updated_at\` = NOW()`,
      [role.roleName, role.description || null, role.badgeColor || '#3b82f6', permJson]
    );
    return true;
  } catch (err: any) {
    console.error('[MySQL] Error saving role permission:', err);
    throw new Error(`Lỗi cập nhật phân quyền MySQL: ${err.message || String(err)}`);
  }
}

// ==========================================
// PRIME MEMBERS
// ==========================================
export interface DbPrimeMember {
  steamId: string;
  playerName?: string;
  registeredAt: string;
  primeTier: string;
  status: 'active' | 'inactive' | 'revoked';
}

export async function getPrimeMembersFromDb(): Promise<DbPrimeMember[]> {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<any[]>('SELECT `steam_id` as steamId, `player_name` as playerName, `registered_at` as registeredAt, `prime_tier` as primeTier, `status` FROM `prime_members`');
    return rows.map((r) => ({
      steamId: r.steamId,
      playerName: r.playerName,
      registeredAt: r.registeredAt ? new Date(r.registeredAt).toISOString() : new Date().toISOString(),
      primeTier: r.primeTier,
      status: r.status,
    }));
  } catch (err) {
    console.warn('[MySQL] Error getting prime members:', err);
    return [];
  }
}

export async function savePrimeMemberToDb(member: DbPrimeMember): Promise<boolean> {
  try {
    const pool = getDbPool();
    await pool.query(
      `INSERT INTO \`prime_members\` (\`steam_id\`, \`player_name\`, \`registered_at\`, \`prime_tier\`, \`status\`)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        \`player_name\` = VALUES(\`player_name\`),
        \`prime_tier\` = VALUES(\`prime_tier\`),
        \`status\` = VALUES(\`status\`)`,
      [member.steamId, member.playerName || null, member.registeredAt, member.primeTier, member.status]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error saving prime member:', err);
    return false;
  }
}

// ==========================================
// ANNOUNCEMENTS
// ==========================================
export interface DbAnnouncementTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  enabledForAuto: boolean;
  createdAt: string;
}

export async function getAnnouncementTemplatesFromDb(): Promise<DbAnnouncementTemplate[]> {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<any[]>('SELECT `id`, `title`, `content`, `category`, `enabled_for_auto` as enabledForAuto, `created_at` as createdAt FROM `announcement_templates`');
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      category: r.category,
      enabledForAuto: Boolean(r.enabledForAuto),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[MySQL] Error getting announcement templates:', err);
    return [];
  }
}

export async function saveAnnouncementTemplateToDb(tpl: DbAnnouncementTemplate): Promise<boolean> {
  try {
    const pool = getDbPool();
    await pool.query(
      `INSERT INTO \`announcement_templates\` (\`id\`, \`title\`, \`content\`, \`category\`, \`enabled_for_auto\`, \`created_at\`)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        \`title\` = VALUES(\`title\`),
        \`content\` = VALUES(\`content\`),
        \`category\` = VALUES(\`category\`),
        \`enabled_for_auto\` = VALUES(\`enabled_for_auto\`)`,
      [tpl.id, tpl.title, tpl.content, tpl.category, tpl.enabledForAuto ? 1 : 0, tpl.createdAt]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error saving announcement template:', err);
    return false;
  }
}

export async function deleteAnnouncementTemplateFromDb(id: string): Promise<boolean> {
  try {
    const pool = getDbPool();
    await pool.query('DELETE FROM `announcement_templates` WHERE `id` = ?', [id]);
    return true;
  } catch (err) {
    console.warn('[MySQL] Error deleting announcement template:', err);
    return false;
  }
}

export async function addBroadcastHistoryToDb(b: { id: string; content: string; source: string; senderName: string; status: string; sentAt: string }): Promise<boolean> {
  try {
    const pool = getDbPool();
    await pool.query(
      'INSERT INTO `broadcast_history` (`id`, `content`, `source`, `sender_name`, `status`, `sent_at`) VALUES (?, ?, ?, ?, ?, ?)',
      [b.id, b.content, b.source, b.senderName, b.status, b.sentAt]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error adding broadcast history:', err);
    return false;
  }
}

export async function getBroadcastHistoryFromDb(): Promise<any[]> {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM `broadcast_history` ORDER BY `sent_at` DESC LIMIT 50');
    return rows.map((r) => ({
      id: r.id,
      content: r.content,
      source: r.source,
      senderName: r.sender_name,
      status: r.status,
      sentAt: r.sent_at ? new Date(r.sent_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[MySQL] Error getting broadcast history:', err);
    return [];
  }
}

// ==========================================
// AUDIT LOGS
// ==========================================
export async function addAuditLogToDb(log: { id: string; actorSteamId?: string; actorName: string; actorRole: string; action: string; targetSteamId?: string; targetName?: string; details?: any; status: string }): Promise<boolean> {
  try {
    const pool = getDbPool();
    const detailsJson = log.details ? JSON.stringify(log.details) : null;
    await pool.query(
      `INSERT INTO \`audit_logs\` (\`id\`, \`actor_steam_id\`, \`actor_name\`, \`actor_role\`, \`action\`, \`target_steam_id\`, \`target_name\`, \`details\`, \`status\`, \`created_at\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [log.id, log.actorSteamId || null, log.actorName, log.actorRole, log.action, log.targetSteamId || null, log.targetName || null, detailsJson, log.status]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error adding audit log:', err);
    return false;
  }
}

export async function getAuditLogsFromDb(): Promise<any[]> {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query<any[]>('SELECT * FROM `audit_logs` ORDER BY `created_at` DESC LIMIT 100');
    return rows.map((r) => ({
      id: r.id,
      actorSteamId: r.actor_steam_id,
      actorName: r.actor_name,
      actorRole: r.actor_role,
      action: r.action,
      targetSteamId: r.target_steam_id,
      targetName: r.target_name,
      details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details,
      status: r.status,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[MySQL] Error getting audit logs:', err);
    return [];
  }
}
