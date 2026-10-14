/**
 * ST25 VIETNAM - Tool import dữ liệu từ data/store.json sang file SQL hoặc trực tiếp vào MySQL
 * Sử dụng: node scripts/export_store_to_mysql.js
 */

const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '..', 'data', 'store.json');
const outputPath = path.join(__dirname, '..', 'database', 'seed_data.mysql.sql');

if (!fs.existsSync(storePath)) {
  console.error('Không tìm thấy file data/store.json');
  process.exit(1);
}

const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number' || typeof val === 'boolean') return val ? 1 : 0;
  if (typeof val === 'object') return "'" + JSON.stringify(val).replace(/'/g, "\\'") + "'";
  return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
}

let sql = `-- ==============================================================================
-- DỮ LIỆU ĐƯỢC XUẤT TỰ ĐỘNG TỪ DATA/STORE.JSON CHO MYSQL
-- Thời gian: ${new Date().toISOString()}
-- ==============================================================================\n
SET FOREIGN_KEY_CHECKS = 0;\n\n`;

// 1. steam_role_assignments
if (store.steamRoleAssignments && typeof store.steamRoleAssignments === 'object') {
  const entries = Object.values(store.steamRoleAssignments);
  if (entries.length > 0) {
    sql += `-- 1. steam_role_assignments (${entries.length} bản ghi)\n`;
    sql += `INSERT IGNORE INTO \`steam_role_assignments\` (\`steam_id\`, \`player_name\`, \`role\`, \`role_title\`, \`note\`, \`assigned_by\`, \`assigned_at\`) VALUES\n`;
    sql += entries.map(item => {
      return `  (${escapeSql(item.steamId)}, ${escapeSql(item.playerName)}, ${escapeSql(item.role || 'Guest')}, ${escapeSql(item.roleTitle)}, ${escapeSql(item.note)}, ${escapeSql(item.assignedBy || 'System')}, ${escapeSql(item.assignedAt || new Date().toISOString())})`;
    }).join(',\n') + ';\n\n';
  }
}

// 2. role_permissions
if (store.rolePermissions && typeof store.rolePermissions === 'object') {
  const entries = Object.values(store.rolePermissions);
  if (entries.length > 0) {
    sql += `-- 2. role_permissions (${entries.length} vai trò)\n`;
    sql += `INSERT IGNORE INTO \`role_permissions\` (\`role_name\`, \`description\`, \`badge_color\`, \`permissions\`, \`updated_at\`) VALUES\n`;
    sql += entries.map(item => {
      return `  (${escapeSql(item.roleName)}, ${escapeSql(item.description)}, ${escapeSql(item.badgeColor)}, ${escapeSql(item.permissions || {})}, ${escapeSql(item.updatedAt || new Date().toISOString())})`;
    }).join(',\n') + ';\n\n';
  }
}

// 3. player_live_profiles (tổng hợp từ playerMutations)
if (store.playerMutations && typeof store.playerMutations === 'object') {
  const entries = Object.entries(store.playerMutations);
  if (entries.length > 0) {
    sql += `-- 3. player_live_profiles (${entries.length} người chơi có gen lưu trữ)\n`;
    sql += `INSERT IGNORE INTO \`player_live_profiles\` (\`steam_id\`, \`species\`, \`elder\`, \`active_mutations\`, \`lineage_mutations\`, \`updated_at\`) VALUES\n`;
    sql += entries.map(([steamId, item]) => {
      const active = item.mutations || [];
      const lineage = item.lineage || null;
      return `  (${escapeSql(steamId)}, ${escapeSql(item.species || 'Tyrannosaurus')}, ${escapeSql(item.elder || 'No elder')}, ${escapeSql(active)}, ${escapeSql(lineage)}, NOW())`;
    }).join(',\n') + ';\n\n';
  }
}

// 4. garage_slot_mutations
if (store.garageSlotMutations && typeof store.garageSlotMutations === 'object') {
  const entries = Object.entries(store.garageSlotMutations);
  if (entries.length > 0) {
    sql += `-- 4. garage_slot_mutations (${entries.length} slots gara)\n`;
    sql += `INSERT IGNORE INTO \`garage_slot_mutations\` (\`slot_id\`, \`steam_id\`, \`species\`, \`gender\`, \`growth\`, \`mutations\`, \`elder\`, \`lineage\`, \`updated_at\`) VALUES\n`;
    sql += entries.map(([slotId, item]) => {
      return `  (${escapeSql(slotId)}, ${escapeSql(item.steamId)}, ${escapeSql(item.species)}, ${escapeSql(item.gender || 'male')}, ${item.growth || 1.0}, ${escapeSql(item.mutations || [])}, ${escapeSql(item.elder || 'No elder')}, ${escapeSql(item.lineage || null)}, NOW())`;
    }).join(',\n') + ';\n\n';
  }
}

// 5. player_notes
if (Array.isArray(store.playerNotes) && store.playerNotes.length > 0) {
  sql += `-- 5. player_notes (${store.playerNotes.length} ghi chú)\n`;
  sql += `INSERT IGNORE INTO \`player_notes\` (\`id\`, \`steam_id\`, \`player_name\`, \`author_name\`, \`note\`, \`strike_level\`, \`created_at\`) VALUES\n`;
  sql += store.playerNotes.map(item => {
    return `  (${escapeSql(item.id)}, ${escapeSql(item.steamId)}, ${escapeSql(item.playerName)}, ${escapeSql(item.authorName)}, ${escapeSql(item.note)}, ${item.strikeLevel || 0}, ${escapeSql(item.createdAt || new Date().toISOString())})`;
  }).join(',\n') + ';\n\n';
}

// 6. prime_members
if (Array.isArray(store.primeMembers) && store.primeMembers.length > 0) {
  sql += `-- 6. prime_members (${store.primeMembers.length} thành viên Prime)\n`;
  sql += `INSERT IGNORE INTO \`prime_members\` (\`steam_id\`, \`player_name\`, \`registered_at\`, \`prime_tier\`, \`status\`) VALUES\n`;
  sql += store.primeMembers.map(item => {
    return `  (${escapeSql(item.steamId)}, ${escapeSql(item.playerName)}, ${escapeSql(item.registeredAt || new Date().toISOString())}, ${escapeSql(item.primeTier || 'Standard Prime')}, ${escapeSql(item.status || 'active')})`;
  }).join(',\n') + ';\n\n';
}

// 7. announcement_templates
if (Array.isArray(store.announcementTemplates) && store.announcementTemplates.length > 0) {
  sql += `-- 7. announcement_templates (${store.announcementTemplates.length} mẫu)\n`;
  sql += `INSERT IGNORE INTO \`announcement_templates\` (\`id\`, \`title\`, \`content\`, \`category\`, \`enabled_for_auto\`, \`created_at\`) VALUES\n`;
  sql += store.announcementTemplates.map(item => {
    return `  (${escapeSql(item.id)}, ${escapeSql(item.title)}, ${escapeSql(item.content)}, ${escapeSql(item.category || 'general')}, ${item.enabledForAuto ? 1 : 0}, ${escapeSql(item.createdAt || new Date().toISOString())})`;
  }).join(',\n') + ';\n\n';
}

// 8. auto_announce_config
if (store.autoAnnounceConfig) {
  const c = store.autoAnnounceConfig;
  sql += `-- 8. auto_announce_config\n`;
  sql += `INSERT IGNORE INTO \`auto_announce_config\` (\`id\`, \`enabled\`, \`interval_minutes\`, \`mode\`, \`current_template_index\`, \`last_broadcast_at\`, \`next_broadcast_at\`) VALUES\n`;
  sql += `  (1, ${c.enabled ? 1 : 0}, ${c.intervalMinutes || 10}, ${escapeSql(c.mode || 'sequential')}, ${c.currentTemplateIndex || 0}, ${escapeSql(c.lastBroadcastAt)}, ${escapeSql(c.nextBroadcastAt)}) ON DUPLICATE KEY UPDATE \`enabled\`=VALUES(\`enabled\`), \`interval_minutes\`=VALUES(\`interval_minutes\`);\n\n`;
}

// 9. broadcast_history
if (Array.isArray(store.broadcastHistory) && store.broadcastHistory.length > 0) {
  sql += `-- 9. broadcast_history (${store.broadcastHistory.length} lịch sử phát thanh)\n`;
  sql += `INSERT IGNORE INTO \`broadcast_history\` (\`id\`, \`content\`, \`source\`, \`sender_name\`, \`status\`, \`sent_at\`) VALUES\n`;
  sql += store.broadcastHistory.map(item => {
    return `  (${escapeSql(item.id)}, ${escapeSql(item.content)}, ${escapeSql(item.source || 'manual')}, ${escapeSql(item.senderName)}, ${escapeSql(item.status || 'SUCCESS')}, ${escapeSql(item.sentAt || new Date().toISOString())})`;
  }).join(',\n') + ';\n\n';
}

// 10. mutations_catalog
if (Array.isArray(store.mutationsCatalog) && store.mutationsCatalog.length > 0) {
  sql += `-- 10. mutations_catalog (${store.mutationsCatalog.length} đột biến gen)\n`;
  sql += `INSERT IGNORE INTO \`mutations_catalog\` (\`name\`, \`vi_name\`, \`category\`, \`description\`, \`source_description\`) VALUES\n`;
  sql += store.mutationsCatalog.map(item => {
    return `  (${escapeSql(item.name)}, ${escapeSql(item.viName)}, ${escapeSql(item.category || 'Universal')}, ${escapeSql(item.description)}, ${escapeSql(item.sourceDescription)})`;
  }).join(',\n') + ';\n\n';
}

sql += `SET FOREIGN_KEY_CHECKS = 1;\n-- Hoàn tất xuất dữ liệu!\n`;

fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`Đã xuất thành công dữ liệu sang: ${outputPath}`);
