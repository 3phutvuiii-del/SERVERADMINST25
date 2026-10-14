import { islePilotClient } from '@/lib/islepilot/client';

import { AdminRole } from '@/types/islepilot';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';

export interface SteamAuthResult {
  success: boolean;
  steamId?: string;
  name?: string;
  avatarUrl?: string;
  role?: AdminRole;
  roleTitle?: string;
  discord?: any;
  error?: string;
}

/**
 * Generate Steam OpenID 2.0 Login URL
 */
export function getSteamLoginUrl(appUrl: string): string {
  const normalizedAppUrl = appUrl.replace(/\/+$/, '');
  const returnTo = `${normalizedAppUrl}/api/auth/steam/callback`;

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': normalizedAppUrl,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

/**
 * Verify OpenID 2.0 assertion returned by Steam
 */
export async function verifySteamOpenId(
  searchParams: Record<string, string>
): Promise<{ success: boolean; steamId?: string; error?: string }> {
  try {
    const claimedId = searchParams['openid.claimed_id'] || searchParams['openid.identity'];
    if (!claimedId) {
      return { success: false, error: 'Thiếu openid.claimed_id từ Steam' };
    }

    // Match 64-bit Steam ID
    const match = claimedId.match(/\/id\/(\d{17})/);
    if (!match || !match[1]) {
      return { success: false, error: 'Định dạng SteamID không hợp lệ' };
    }
    const steamId = match[1];

    // Build verification payload for Steam
    const verifyParams = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      verifyParams.set(key, value);
    }
    verifyParams.set('openid.mode', 'check_authentication');

    const res = await fetch(STEAM_OPENID_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyParams.toString(),
    });

    const text = await res.text();
    const isValid = text.includes('is_valid:true');

    if (!isValid) {
      return { success: false, error: 'Chữ ký OpenID Steam không hợp lệ hoặc đã hết hạn' };
    }

    return { success: true, steamId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi kết nối xác thực Steam' };
  }
}

/**
 * Resolve Admin Role for a SteamID (Via IslePilot Discord Link & Admin Roster)
 */
export async function resolveAdminRoleForSteamId(steamId: string): Promise<{
  role: AdminRole;
  roleTitle: string;
  name: string;
  avatarUrl: string;
  discord?: any;
}> {
  // 1. Fetch player details from IslePilot
  const player = await islePilotClient.getPlayerDetail(steamId).catch(() => null);
  const name = player?.name || `Survivor (${steamId.slice(-4)})`;
  const discord = player?.discord || null;
  const discordRoles: string[] = discord?.roles || [];

  // Default avatar (Steam SVG / Avatar CDN)
  let avatarUrl = discord?.avatar
    ? `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png`
    : `https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg`;

  // Check if env has STEAM_API_KEY to fetch genuine Steam Avatar
  if (process.env.STEAM_API_KEY) {
    try {
      const sRes = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`
      );
      if (sRes.ok) {
        const sData = await sRes.json();
        const pInfo = sData.response?.players?.[0];
        if (pInfo?.avatarfull) {
          avatarUrl = pInfo.avatarfull;
        }
      }
    } catch { }
  }

  // 2. DUY NHẤT CHỦ SỞ HỮU MỚI ĐƯỢC LÀ SUPER_ADMIN (Owner Master SteamID)
  const masterSteamIds = (process.env.ADMIN_SUPER_STEAM_IDS || '76561198681721956')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (masterSteamIds.includes(steamId) || steamId === '76561198681721956' || steamId === '76561198682056372' || steamId === '76561198130578953') {
    return {
      role: 'SUPER_ADMIN',
      roleTitle: 'CHỦ SERVER / QUAN KHÂM SAI (Toàn quyền)',
      name: player?.name || 'Chủ Server ST25',
      avatarUrl,
      discord,
    };
  }

  // 3. Phân quyền theo SteamID được cấp trong bảng MySQL steam_role_assignments
  try {
    const { getSteamRoleAssignmentsFromDb } = await import('@/lib/db/mysql');
    const roleAssignments = await getSteamRoleAssignmentsFromDb();
    const matched = roleAssignments[steamId];
    if (matched && matched.role !== 'GUEST') {
      const roleTitles: Record<AdminRole, string> = {
        SUPER_ADMIN: 'Quan Khâm Sai (Toàn Quyền)',
        SENIOR_ADMIN: 'Senior Admin',
        MODERATOR: 'Moderator (Quản Trị Viên)',
        TRIAL_MOD: 'Trial Mod (Học Việc)',
        GUEST: 'Người Chơi',
      };
      return {
        role: matched.role as AdminRole,
        roleTitle: roleTitles[matched.role as AdminRole] || matched.role,
        name,
        avatarUrl,
        discord,
      };
    }
  } catch (err) {
    console.warn('[SteamAuth] Failed to load role assignments from MySQL:', err);
  }

  // 4. Nếu có liên kết Discord với IslePilot và có danh sách vai trò:
  // TUYỆT ĐỐI KHÔNG TỰ ĐỘNG CẤP SUPER_ADMIN QUA DISCORD (Chỉ tối đa là Senior Admin hoặc Mod)
  if (discordRoles.length > 0) {
    const lowerRoles = discordRoles.map((r) => r.toLowerCase().trim());

    if (
      lowerRoles.some((r) =>
        ['quan khâm sai', 'long không', 'long không (ad)', 'dev', 'senior admin', 'quản lý', 'trưởng bqt'].some((k) =>
          r.includes(k)
        )
      )
    ) {
      return {
        role: 'SENIOR_ADMIN',
        roleTitle: 'SENIOR ADMIN (Ban Quản Trị)',
        name,
        avatarUrl,
        discord,
      };
    }

    if (
      lowerRoles.some((r) =>
        ['mod', 'moderator', 'ban quản trị', 'bqt'].some((k) => r.includes(k))
      )
    ) {
      return {
        role: 'MODERATOR',
        roleTitle: 'MODERATOR (Quản trị viên)',
        name,
        avatarUrl,
        discord,
      };
    }

    if (
      lowerRoles.some((r) =>
        ['trial', 'trial mod', 'học việc', 'thực tập'].some((k) => r.includes(k))
      )
    ) {
      return {
        role: 'TRIAL_MOD',
        roleTitle: 'TRIAL MOD (Học việc)',
        name,
        avatarUrl,
        discord,
      };
    }
  }

  // 5. MỌI TÀI KHOẢN KHÁC: GÁN GUEST (KHÔNG CÓ QUYỀN BQT, CHẶN TRUY CẬP NGAY TỨC THÌ)
  return {
    role: 'GUEST',
    roleTitle: 'Người Chơi (Không có quyền BQT)',
    name,
    avatarUrl,
    discord,
  };
}

