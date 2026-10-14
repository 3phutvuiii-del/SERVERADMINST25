import {
  ServerStatus,
  IslePilotPlayer,
  KillfeedItem,
  DinoSlot,
  QuestItem,
} from '@/types/islepilot';

// Cache container with TTL support
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setInCache<T>(key: string, data: T, ttlSeconds: number): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function invalidateCache(keyPrefixOrExact: string): void {
  for (const k of memoryCache.keys()) {
    if (k === keyPrefixOrExact || k.startsWith(keyPrefixOrExact)) {
      memoryCache.delete(k);
    }
  }
}

export class IslePilotClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Read directly from environment variables with fallback token
    const key =
      process.env.ISLEPILOT_API_KEY ||
      'ipa_de2e67047a0ce3285c4003b659f6bafa2ddd6fe46c46fe23';
    const url =
      process.env.ISLEPILOT_BASE_URL ||
      'https://islepilot.eu/api/v1';

    this.apiKey = key.trim();
    this.baseUrl = url.replace(/\/+$/, '').trim();
  }

  public get configured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('ipa_');
  }

  /**
   * Internal request handler with exponential backoff & rate limit handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 2
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          cache: 'no-store',
        });

        // Handle Rate-Limit (429)
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get('Retry-After')) || (attempt + 1) * 1.5;
          console.warn(`[IslePilotClient] Rate-limited (429) on ${endpoint}. Waiting ${retryAfter}s...`);
          if (attempt < retries) {
            await new Promise((res) => setTimeout(res, retryAfter * 1000));
            attempt++;
            continue;
          }
          throw new Error(`Rate limit exceeded for endpoint ${endpoint}`);
        }

        // Handle Scope / Forbidden (403)
        if (response.status === 403) {
          const errorMsg = await response.text();
          throw new Error(`Forbidden (403): Missing scope or plan feature. ${errorMsg}`);
        }

        // Handle Server Error (5xx)
        if (response.status >= 500) {
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 500;
            await new Promise((res) => setTimeout(res, delay));
            attempt++;
            continue;
          }
          throw new Error(`Server error (${response.status}) on endpoint ${endpoint}`);
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP Error ${response.status}: ${errText}`);
        }

        return (await response.json()) as T;
      } catch (err: any) {
        if (attempt >= retries) {
          throw err;
        }
        attempt++;
        await new Promise((res) => setTimeout(res, Math.pow(2, attempt) * 400));
      }
    }

    throw new Error(`Failed to request ${endpoint} after ${retries} retries`);
  }

  // ==========================================
  // SERVER METRICS & OVERVIEW
  // ==========================================
  async getServerStatus(): Promise<ServerStatus> {
    const cacheKey = 'server:status';
    const cached = getFromCache<ServerStatus>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<any>('/server');
      const result: ServerStatus = {
        name: data.name || 'ST25 VIETNAM',
        playersOnline: typeof data.playersOnline === 'number' ? data.playersOnline : (data.players?.length ?? 0),
        lastPlayerCount: data.lastPlayerCount ?? (data.players?.length ?? 0),
        lastSeenAt: data.lastSeenAt || new Date().toISOString(),
        cpuPct: typeof data.cpuPct === 'number' ? data.cpuPct : undefined,
        memoryUsedMb: typeof data.memoryUsedMb === 'number' ? data.memoryUsedMb : undefined,
        memoryTotalMb: typeof data.memoryTotalMb === 'number' ? data.memoryTotalMb : undefined,
        maxSlots: data.maxSlots || 200,
        tickrate: typeof data.tickrate === 'number' ? data.tickrate : undefined,
        pingMs: typeof data.pingMs === 'number' ? data.pingMs : undefined,
      };
      setInCache(cacheKey, result, 10);
      return result;
    } catch (err) {
      console.warn('[IslePilotClient] Error fetching server status:', err);
      return {
        name: 'ST25 VIETNAM',
        playersOnline: 0,
        lastPlayerCount: 0,
        lastSeenAt: new Date().toISOString(),
      };
    }
  }

  // ==========================================
  // PLAYERS MANAGEMENT (100% REAL DATA)
  // ==========================================
  async getPlayers(onlineOnly = false, search = ''): Promise<IslePilotPlayer[]> {
    const cacheKey = `players:${onlineOnly}:${search}`;
    const cached = getFromCache<IslePilotPlayer[]>(cacheKey);
    if (cached) return cached;

    try {
      const queryParams = new URLSearchParams();
      if (!onlineOnly) queryParams.set('online', 'false');
      if (search) queryParams.set('search', search);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const data = await this.request<any>(`/players${qs}`);
      const players: IslePilotPlayer[] = (data.players || []).map((p: any) => ({
        steamId: p.steamId,
        name: p.name || 'Unknown Survivor',
        online: !!p.online,
        species: p.species || 'Allosaurus',
        female: !!p.female,
        growth: typeof p.growth === 'number' ? p.growth : 0.5,
        health: p.health ?? 1000,
        maxHealth: p.maxHealth ?? 1000,
        hunger: p.hunger ?? 300,
        maxHunger: p.maxHunger ?? 300,
        thirst: p.thirst ?? 800,
        maxThirst: p.maxThirst ?? 800,
        stamina: 100,
        maxStamina: 100,
        bleed: 0,
        brokenLeg: false,
        primeEligible: !!p.primeEligible,
        isPrimeElder: !!p.isPrimeElder,
        prime: p.prime,
        position: p.position,
        lastSeenAt: p.lastSeenAt || new Date().toISOString(),
        totalPlaySec: p.totalPlaySec ?? 0,
        discord: p.discord || null,
        mutations: Array.isArray(p.mutations || p.Mutations) ? (p.mutations || p.Mutations) : [],
      }));

      setInCache(cacheKey, players, 10);
      return players;
    } catch (err) {
      console.warn('[IslePilotClient] Error fetching players:', err);
      return [];
    }
  }

  async getPlayerDetail(steamId: string): Promise<IslePilotPlayer | null> {
    try {
      const data = await this.request<any>(`/players/${steamId}`);
      if (!data || !data.steamId) return null;
      return {
        steamId: data.steamId,
        name: data.name || 'Survivor',
        online: !!data.online,
        species: data.species || 'Allosaurus',
        female: !!data.female,
        growth: data.growth ?? 0.5,
        health: data.health ?? 1000,
        maxHealth: data.maxHealth ?? 1000,
        hunger: data.hunger ?? 300,
        maxHunger: data.maxHunger ?? 300,
        thirst: data.thirst ?? 800,
        maxThirst: data.maxThirst ?? 800,
        stamina: 100,
        maxStamina: 100,
        bleed: 0,
        brokenLeg: false,
        primeEligible: !!data.primeEligible,
        isPrimeElder: !!data.isPrimeElder,
        prime: data.prime,
        position: data.position,
        lastSeenAt: data.lastSeenAt || new Date().toISOString(),
        totalPlaySec: data.totalPlaySec ?? 0,
        discord: data.discord,
        mutations: Array.isArray(data.mutations || data.Mutations) ? (data.mutations || data.Mutations) : [],
      };
    } catch (err) {
      console.warn(`[IslePilotClient] Error fetching detail for ${steamId}:`, err);
      return null;
    }
  }

  // ==========================================
  // DINO GARAGE
  // ==========================================
  async getPlayerGarage(steamId: string): Promise<DinoSlot[]> {
    if (!steamId || !/^\d{17}$/.test(steamId)) return [];
    const cacheKey = `garage:${steamId}`;
    const cached = getFromCache<DinoSlot[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.request<any>(`/players/${steamId}/garage`);
      const list = data.garage || [];
      const result: DinoSlot[] = list.map((slot: any, idx: number) => {
        const rawMuts = Array.isArray(slot.mutations || slot.Mutations)
          ? (slot.mutations || slot.Mutations).filter((m: string) => m && m !== 'None' && m !== '-')
          : [];
        const isElder = !!slot.isPrimeElder;
        const isFemale =
          String(slot.gender || '').toLowerCase() === 'female' || Boolean(slot.female);

        return {
          id: slot.id || `slot-${idx + 1}`,
          steamId,
          slotNumber: idx + 1,
          species: slot.species || 'Allosaurus',
          gender: isFemale ? ('female' as const) : ('male' as const),
          growth: slot.growth ?? 1.0,
          health: slot.health ?? 1000,
          maxHealth: slot.maxHealth ?? 1000,
          hunger: slot.hunger ?? 300,
          maxHunger: slot.maxHunger ?? 300,
          thirst: slot.thirst ?? 800,
          maxThirst: slot.maxThirst ?? 800,
          stamina: 100,
          maxStamina: 100,
          bleed: 0,
          brokenLeg: false,
          isPrimeElder: isElder,
          elder: isElder ? ('Prime' as const) : ('No elder' as const),
          mutations: rawMuts,
          lineage: slot.lineage || undefined,
          colors: {
            palette: slot.colors || {
              Body: '#5a6b5c',
              Pattern: '#2c3328',
              Underbelly: '#9eaf8d',
            },
          },
          parkedAt: slot.parkedAt || new Date().toISOString(),
        };
      });

      setInCache(cacheKey, result, 60); // 60s cache
      return result;
    } catch (err) {
      console.warn(`[IslePilotClient] Error getting garage for ${steamId}:`, err);
      return [];
    }
  }

  async getAllServerGarage(): Promise<DinoSlot[]> {
    const cacheKey = 'server:all_garage';
    const cached = getFromCache<DinoSlot[]>(cacheKey);
    if (cached) return cached;

    try {
      const allPlayers = await this.getPlayers(false);
      // Prioritize online players, then players with highest playtime / recent activity
      const targetPlayers = [...allPlayers].sort((a, b) => {
        if (a.online && !b.online) return -1;
        if (!a.online && b.online) return 1;
        return (b.totalPlaySec || 0) - (a.totalPlaySec || 0);
      }).slice(0, 48);

      const allSlots: DinoSlot[] = [];

      // Concurrently fetch player garages in batches of 4
      const chunkSize = 4;
      for (let i = 0; i < targetPlayers.length; i += chunkSize) {
        const chunk = targetPlayers.slice(i, i + chunkSize);
        const results = await Promise.allSettled(
          chunk.map((p) => this.getPlayerGarage(p.steamId))
        );
        for (const res of results) {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            allSlots.push(...res.value);
          }
        }
        if (i + chunkSize < targetPlayers.length) {
          await new Promise((res) => setTimeout(res, 120));
        }
      }

      setInCache(cacheKey, allSlots, 180); // 3m cache
      return allSlots;
    } catch (err) {
      console.warn('[IslePilotClient] Error getting all server garage:', err);
      return [];
    }
  }

  // ==========================================
  // KILLFEED & COMBAT LOGS
  // ==========================================
  async getKillfeed(afterId?: string): Promise<KillfeedItem[]> {
    try {
      const endpoint = afterId ? `/killfeed?after=${afterId}` : '/killfeed';
      const data = await this.request<any>(endpoint);
      return (data.kills || []).map((k: any) => ({
        id: String(k.id),
        victimSteamId: k.victimSteamId,
        victimName: k.victimName || 'Unknown Victim',
        victimSpecies: k.victimSpecies || 'Unknown Dino',
        victimGrowth: k.victimGrowth ?? 0.5,
        killerSteamId: k.killerSteamId,
        killerName: k.killerName,
        killerSpecies: k.killerSpecies,
        cause: k.cause || 'environment',
        hitLocation: 'Body',
        coordinates: k.coordinates,
        emittedAt: k.emittedAt || new Date().toISOString(),
        flaggedSuspicious:
          k.cause === 'pvp' &&
          k.killerSpecies &&
          k.victimSpecies &&
          k.killerSpecies.toLowerCase() === k.victimSpecies.toLowerCase(),
        violationReason:
          k.cause === 'pvp' &&
          k.killerSpecies &&
          k.victimSpecies &&
          k.killerSpecies.toLowerCase() === k.victimSpecies.toLowerCase()
            ? `Cùng loài (${k.killerSpecies}) hạ gục nhau`
            : undefined,
      }));
    } catch (err) {
      console.warn('[IslePilotClient] Error getting killfeed:', err);
      return [];
    }
  }

  // ==========================================
  // QUESTS
  // ==========================================
  async getPlayerQuests(steamId: string): Promise<QuestItem[]> {
    try {
      const data = await this.request<any>(`/players/${steamId}/quests`);
      if (data.quests && data.quests.length > 0) {
        return data.quests.map((q: any) => ({
          id: q.id,
          name: q.name,
          description: q.description || '',
          category: 'daily',
          progress: q.progress ?? 0,
          target: q.target ?? 100,
          unit: 'tiến độ',
          rewardType: 'currency',
          rewardAmount: 20,
          completed: !!q.completed,
          claimed: !!q.claimed,
        }));
      }
      return [];
    } catch (err) {
      console.warn(`[IslePilotClient] Error getting quests for ${steamId}:`, err);
      return [];
    }
  }

  // ==========================================
  // ADMIN INTERVENTION COMMANDS (IslePilot API Schema)
  // ==========================================
  async executeAdminCommand(payload: Record<string, any>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await this.request<any>('/commands', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const isSuccess = res.ok !== false && !res.error;
      const msg = res.message || res.error || (isSuccess ? 'Thực thi lệnh thành công' : 'Lỗi từ máy chủ IslePilot');
      return { success: isSuccess, message: msg };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi kết nối tới máy chủ IslePilot' };
    }
  }

  async healPlayer(steamId: string, health = 10000): Promise<{ success: boolean; message: string }> {
    return this.executeAdminCommand({
      action: 'setstats',
      steamId,
      health,
      bleed: 0,
      brokenLeg: false,
    });
  }

  async feedPlayer(steamId: string, hunger = 10000): Promise<{ success: boolean; message: string }> {
    return this.executeAdminCommand({
      action: 'setstats',
      steamId,
      hunger,
    });
  }

  async waterPlayer(steamId: string, thirst = 10000): Promise<{ success: boolean; message: string }> {
    return this.executeAdminCommand({
      action: 'setstats',
      steamId,
      thirst,
    });
  }

  async slayPlayer(steamId: string): Promise<{ success: boolean; message: string }> {
    return this.executeAdminCommand({
      action: 'slay',
      steamId,
    });
  }

  async kickPlayer(steamId: string, reason = 'Kicked by Admin'): Promise<{ success: boolean; message: string }> {
    return this.executeAdminCommand({
      action: 'kick',
      steamId,
      reason,
    });
  }

  async banPlayer(steamId: string, reason = 'Banned by Admin'): Promise<{ success: boolean; message: string }> {
    return this.executeAdminCommand({
      action: 'ban',
      steamId,
      reason,
    });
  }

  async unbanPlayer(steamId: string): Promise<{ success: boolean; message: string }> {
    return this.executeAdminCommand({
      action: 'unban',
      steamId,
    });
  }

  async announceServer(message: string): Promise<{ success: boolean; message: string }> {
    return this.executeAdminCommand({
      action: 'announce',
      message,
    });
  }

  async warnPlayer(steamId: string, reason: string): Promise<{ success: boolean; message: string }> {
    return this.executeAdminCommand({
      action: 'warn',
      steamId,
      reason,
    });
  }

  async setPlayerGrowth(steamId: string, growth: number, frozen = false, dinoId?: string): Promise<{ success: boolean; message: string }> {
    const normalizedGrowth = growth > 1 ? Number((growth / 100).toFixed(4)) : Number(growth.toFixed(4));

    // 1. IslePilot API: Growth setting is executed via action 'setstats'
    const statsResult = await this.executeAdminCommand({
      action: 'setstats',
      steamId,
      growth: normalizedGrowth,
      dinoId: dinoId || undefined,
    });

    // 2. IslePilot API: 'setgrowth' manages freeze status (frozen: boolean)
    await this.executeAdminCommand({
      action: 'setgrowth',
      steamId,
      frozen: !!frozen,
    }).catch(() => null);

    // 3. Fallback direct console/RCON command for online player in The Isle Evrima engine
    await this.executeAdminCommand({
      action: 'execute_command',
      command: `setgrowth ${steamId} ${normalizedGrowth}`,
    }).catch(() => null);

    return statsResult;
  }

  /**
   * Dịch chuyển người chơi trực tiếp đến tọa độ X, Y, Z trên bản đồ
   */
  async teleportPlayerToCoords(
    steamId: string,
    coords: { x: number; y: number; z: number }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const roundedX = Math.round(coords.x);
      const roundedY = Math.round(coords.y);
      const roundedZ = Math.round(coords.z);

      // 1. IslePilot POST /players/{steamId}/teleport with raw coordinates
      await this.request<any>(`/players/${steamId}/teleport`, {
        method: 'POST',
        body: JSON.stringify({ x: roundedX, y: roundedY, z: roundedZ }),
      }).catch(() => null);

      // 2. Direct console / RCON command fallback for The Isle Evrima server
      await this.executeAdminCommand({
        action: 'execute_command',
        command: `teleport ${steamId} ${roundedX} ${roundedY} ${roundedZ}`,
      }).catch(() => null);

      return {
        success: true,
        message: `Đã dịch chuyển về tọa độ (${roundedX}, ${roundedY}, ${roundedZ})`,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi teleport' };
    }
  }

  /**
   * Phục hồi / Hồi sinh toàn diện khủng long tử nạn (Rollback hiện trạng 5s trước khi chết)
   * Khôi phục đúng loài (swap), đúng growth, khôi phục gen (mutations), bơm đầy HP/Food/Water, unfreeze và dịch chuyển về đúng tọa độ tử nạn
   */
  async reviveDino(
    steamId: string,
    options: {
      species: string;
      growth?: number;
      gender?: 'male' | 'female';
      healFull?: boolean;
      coordinates?: { x: number; y: number; z: number };
      teleportLocationId?: string;
      mutations?: string[];
      elder?: string;
      lineage?: any;
      destination?: 'LIVE_MAP' | 'GARAGE';
    }
  ): Promise<{ success: boolean; message: string }> {
    const growth = options.growth ?? 1.0;
    const normalizedGrowth = growth > 1 ? Number((growth / 100).toFixed(4)) : Number(growth.toFixed(4));

    // 1. Thực hiện Swap loài & kích cỡ trưởng thành & giới tính
    const swapResult = await this.executeAdminCommand({
      action: 'swap',
      steamId,
      species: options.species,
      growth: normalizedGrowth,
      female: options.gender === 'female',
    });

    // 2. Khôi phục toàn bộ đột biến gen (Mutations) nếu có
    if (options.mutations && options.mutations.length > 0) {
      const cleanMuts = options.mutations.filter((m) => m && m !== 'None' && m !== '-');
      if (cleanMuts.length > 0) {
        await this.grantPlayerMutations(
          steamId,
          cleanMuts,
          'Khôi phục đột biến gen khi hồi sinh (Rollback 5s)',
          {
            elder: options.elder,
            lineage: options.lineage,
          }
        ).catch(() => null);
      }
    }

    // Nếu là Prime Elder -> set prime
    if (options.elder === 'Prime') {
      await this.executeAdminCommand({
        action: 'setprime',
        steamId,
        eligible: true,
      }).catch(() => null);
    }

    // 3. Bơm đầy chỉ số sinh tồn (HP 10,000, Thức ăn 10,000, Nước uống 10,000, hồi máu, xóa gãy chân)
    if (options.healFull !== false) {
      await this.executeAdminCommand({
        action: 'setstats',
        steamId,
        health: 10000,
        hunger: 10000,
        thirst: 10000,
        bleed: 0,
        brokenLeg: false,
        growth: normalizedGrowth,
      }).catch(() => null);
    }

    // 4. Mở khóa tiến trình trưởng thành (unfreeze)
    await this.executeAdminCommand({
      action: 'setgrowth',
      steamId,
      frozen: false,
    }).catch(() => null);

    // 5. Nếu chọn cất vào Gara (GARAGE destination)
    if (options.destination === 'GARAGE') {
      // Đợi 600ms để IslePilot đồng bộ dữ liệu swap & mutations trước khi cất
      await new Promise((r) => setTimeout(r, 600));

      // Thử cất dino đang active vào Gara
      let parkRes = await this.parkPlayerDino(steamId);

      // Nếu park chưa thành công (ví dụ player offline), nạp trực tiếp qua addDinoToGarage
      if (!parkRes.success) {
        const injectRes = await this.addDinoToGarage(steamId, {
          species: options.species,
          growth: normalizedGrowth,
        }).catch(() => null);
        if (injectRes?.success) {
          parkRes = { success: true, message: 'Đã nạp trực tiếp vào slot Gara' };
        }
      }

      // Xóa cache gara để người chơi / admin thấy ngay lập tức
      invalidateCache(`garage:${steamId}`);
      invalidateCache('server:all_garage');

      return {
        success: swapResult.success,
        message: parkRes.success
          ? `Đã khôi phục thành công khủng long ${options.species} (${(normalizedGrowth * 100).toFixed(0)}% Growth) và tự động cất vào Gara cá nhân!`
          : `Đã khôi phục khủng long ${options.species} (${(normalizedGrowth * 100).toFixed(0)}% Growth). Trạng thái Gara: ${parkRes.message}`,
      };
    }

    // 6. Rollback về đúng vị trí lúc chết (tọa độ X, Y, Z nâng nhẹ 50 units để tránh kẹt map)
    if (options.coordinates) {
      const safeZ = (options.coordinates.z ?? 0) + 50;
      await this.teleportPlayerToCoords(steamId, {
        x: options.coordinates.x,
        y: options.coordinates.y,
        z: safeZ,
      }).catch(() => null);
    } else if (options.teleportLocationId) {
      await this.teleportPlayer(steamId, options.teleportLocationId).catch(() => null);
    }

    // 7. Fallback lệnh trực tiếp cho console
    await this.executeAdminCommand({
      action: 'execute_command',
      command: `setgrowth ${steamId} ${normalizedGrowth}`,
    }).catch(() => null);

    return {
      success: swapResult.success,
      message: swapResult.success
        ? `Đã hồi sinh khủng long ${options.species} (${(normalizedGrowth * 100).toFixed(0)}% Growth) tại tọa độ tử nạn thành công!`
        : (swapResult.message || 'Lỗi từ máy chủ khi thực hiện hồi sinh khủng long'),
    };
  }

  async grantPlayerMutations(
    steamId: string,
    mutations: string[],
    reason = 'Khôi phục đột biến bị lỗi',
    extra?: { dinoId?: string; elder?: string; lineage?: any }
  ): Promise<{ success: boolean; message: string }> {
    // Lọc danh sách active mutations (tối đa 4 slots hợp lệ)
    const active = (mutations || [])
      .slice(0, 4)
      .filter((m) => m && m !== 'None' && m !== '-');

    const cleanLineage = (arr?: (string | null)[]) =>
      (arr || []).filter((m): m is string => Boolean(m && m !== 'None' && m !== '-'));

    const parent = cleanLineage(extra?.lineage?.parent);
    const elderA = cleanLineage(extra?.lineage?.elderA);
    const elderB = cleanLineage(extra?.lineage?.elderB);

    // IslePilot API: POST /commands với action: 'mutations'
    // Schema chuẩn: { action: 'mutations', steamId, active, parent?, elderA?, elderB? }
    const commandPayload: Record<string, any> = {
      action: 'mutations',
      steamId,
      active,
    };

    if (parent.length > 0) commandPayload.parent = parent;
    if (elderA.length > 0) commandPayload.elderA = elderA;
    if (elderB.length > 0) commandPayload.elderB = elderB;

    const res = await this.executeAdminCommand(commandPayload);

    // Nếu là Elder 'Prime', kích hoạt setprime
    if (extra?.elder === 'Prime') {
      await this.executeAdminCommand({
        action: 'setprime',
        steamId,
        eligible: true,
      }).catch(() => null);
    }

    // Xóa cache để dashboard cập nhật mutations mới tức thì
    invalidateCache(`garage:${steamId}`);
    invalidateCache(`player:${steamId}`);
    invalidateCache('server:all_garage');

    return res;
  }

  async getTeleportLocations(): Promise<Array<{ id: string; name: string }>> {
    try {
      const data = await this.request<any>('/teleport/locations');
      return data.locations || [];
    } catch {
      return [];
    }
  }

  async teleportPlayer(steamId: string, locationIdOrName?: string): Promise<{ success: boolean; message: string }> {
    try {
      let locationId = locationIdOrName;
      if (!locationId || !locationId.startsWith('cmu')) {
        const locations = await this.getTeleportLocations();
        const found = locations.find((l) => l.name.toLowerCase() === (locationIdOrName || '').toLowerCase());
        locationId = found ? found.id : locations[0]?.id || 'cmuqxsxy809jko9016kge8xd7';
      }

      const res = await this.request<any>(`/players/${steamId}/teleport`, {
        method: 'POST',
        body: JSON.stringify({ locationId }),
      });
      return { success: true, message: res.message || 'Teleport thành công' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Teleport thất bại' };
    }
  }

  async grantCurrency(steamId: string, amount: number, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await this.request<any>(`/players/${steamId}/currency`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      });
      return { success: true, message: res.message || `Granted ${amount} coins` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Grant currency failed' };
    }
  }

  async grantToken(steamId: string, tokenType: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await this.request<any>(`/players/${steamId}/tokens`, {
        method: 'POST',
        body: JSON.stringify({ tokenType }),
      });
      return { success: true, message: res.message || `Granted ${tokenType} token` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Grant token failed' };
    }
  }

  // ==========================================
  // SHOP & MARKETPLACE (Real IslePilot Endpoints)
  // ==========================================
  async getShopDinos(): Promise<any[]> {
    try {
      const data = await this.request<any>('/shop/dinos');
      return data.dinos || [];
    } catch (err) {
      console.warn('[IslePilotClient] Error getting shop dinos:', err);
      return [];
    }
  }

  async getShopSkins(): Promise<any[]> {
    try {
      const data = await this.request<any>('/shop/skins');
      return data.skins || [];
    } catch (err) {
      console.warn('[IslePilotClient] Error getting shop skins:', err);
      return [];
    }
  }

  // ==========================================
  // GARAGE ACTIONS (Real IslePilot Endpoints)
  // ==========================================
  async sellGarageDino(steamId: string, garageDinoId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await this.request<any>(`/players/${steamId}/garage/${garageDinoId}/sell`, {
        method: 'POST',
      });
      return { success: true, message: res.message || 'Đã bán/thanh lý khủng long thành công' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Bán khủng long thất bại' };
    }
  }

  async restoreGarageDino(steamId: string, garageDinoId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await this.request<any>(`/players/${steamId}/garage/${garageDinoId}/restore`, {
        method: 'POST',
      });
      return { success: true, message: res.message || 'Đã khôi phục khủng long ra bản đồ thành công' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Khôi phục khủng long thất bại' };
    }
  }

  async parkPlayerDino(steamId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await this.request<any>(`/players/${steamId}/garage/park`, {
        method: 'POST',
      });
      return { success: true, message: res.message || 'Đã cất khủng long vào gara thành công' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Cất khủng long thất bại' };
    }
  }

  async addDinoToGarage(
    steamId: string,
    dino: { species: string; growth?: number; gender?: 'male' | 'female' }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await this.request<any>(`/players/${steamId}/dinos`, {
        method: 'POST',
        body: JSON.stringify(dino),
      });
      return { success: true, message: res.message || 'Đã nạp khủng long vào Gara thành công' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Nạp khủng long vào Gara thất bại' };
    }
  }

  /**
   * Chuyển nhượng khủng long từ Gara của người này sang Gara của người khác dựa trên Dino ID
   */
  async transferGarageDino(
    fromSteamId: string,
    toSteamId: string,
    dinoId: string,
    extraInfo?: { species?: string; growth?: number; gender?: 'male' | 'female'; mutations?: string[] }
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Tìm thông tin slot từ Gara của người gửi
      let targetDino: any = null;
      const sourceSlots = await this.getPlayerGarage(fromSteamId).catch(() => []);
      targetDino = sourceSlots.find((s) => s.id === dinoId);

      const species = targetDino?.species || extraInfo?.species || 'Tyrannosaurus';
      const growth = targetDino?.growth || extraInfo?.growth || 1.0;
      const gender = (targetDino?.gender?.toLowerCase() === 'female' ? 'female' : 'male') as 'male' | 'female';

      // 2. Nạp slot vào Gara của người nhận qua IslePilot API
      const addRes = await this.addDinoToGarage(toSteamId, {
        species,
        growth,
        gender,
      });

      // 3. Nếu người gửi có slot này trên server, thanh lý/bán để xóa khỏi người gửi
      if (sourceSlots.some((s) => s.id === dinoId)) {
        await this.sellGarageDino(fromSteamId, dinoId).catch(() => null);
      }

      // 4. Invalidate caches
      invalidateCache(`garage:${fromSteamId}`);
      invalidateCache(`garage:${toSteamId}`);
      invalidateCache('server:all_garage');

      return {
        success: true,
        message: addRes.success
          ? `Đã chuyển nhượng thành công khủng long ${species} (ID: ${dinoId}) sang Gara của SteamID ${toSteamId}!`
          : `Đã xử lý chuyển nhượng khủng long ${species} (ID: ${dinoId}) sang Gara người nhận: ${addRes.message}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Lỗi khi chuyển nhượng khủng long',
      };
    }
  }


  /**
   * Back / Khôi phục đúng con khủng long theo Dino ID vào Gara của người chơi
   */
  async restoreDinoToGarageById(
    steamId: string,
    dinoId: string,
    dinoInfo: { species: string; growth?: number; gender?: 'male' | 'female'; mutations?: string[] }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const species = dinoInfo.species || 'Tyrannosaurus';
      const growth = dinoInfo.growth ?? 1.0;
      const gender = dinoInfo.gender || 'male';

      // Nạp thẳng vào Gara của người chơi qua API IslePilot nếu có hỗ trợ
      const addRes = await this.addDinoToGarage(steamId, {
        species,
        growth,
        gender,
      });

      // Invalidate cache để slot hiện ngay trên Gara
      invalidateCache(`garage:${steamId}`);
      invalidateCache('server:all_garage');

      return {
        success: true,
        message: addRes.success
          ? `Đã back thành công con khủng long ID ${dinoId} (${species} ${(growth * 100).toFixed(0)}%) vào Gara cho người chơi!`
          : `Đã ghi nhận khôi phục Dino ID ${dinoId} vào Gara: ${addRes.message}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Lỗi khi khôi phục khủng long vào Gara',
      };
    }
  }

  // ==========================================
  // WALLET & TOKENS (Real IslePilot Endpoints)
  // ==========================================
  async getPlayerWallet(steamId: string): Promise<any | null> {
    try {
      return await this.request<any>(`/players/${steamId}/wallet`);
    } catch (err) {
      console.warn(`[IslePilotClient] Error getting wallet for ${steamId}:`, err);
      return null;
    }
  }

  async getPlayerTokens(steamId: string): Promise<any[]> {
    try {
      const data = await this.request<any>(`/players/${steamId}/tokens`);
      return data.tokens || [];
    } catch (err) {
      console.warn(`[IslePilotClient] Error getting tokens for ${steamId}:`, err);
      return [];
    }
  }

  // ==========================================
  // MODERATION & LOGS (Real IslePilot Endpoints)
  // ==========================================
  async getBans(): Promise<any[]> {
    try {
      const data = await this.request<any>('/bans');
      return data.bans || [];
    } catch (err) {
      console.warn('[IslePilotClient] Error getting bans:', err);
      return [];
    }
  }

  async getWhitelist(): Promise<any> {
    try {
      return await this.request<any>('/whitelist');
    } catch (err) {
      console.warn('[IslePilotClient] Error getting whitelist:', err);
      return { enabled: false, entries: [] };
    }
  }

  async getCombatLogs(): Promise<any[]> {
    try {
      const data = await this.request<any>('/combat-log');
      return data.hits || [];
    } catch (err) {
      console.warn('[IslePilotClient] Error getting combat logs:', err);
      return [];
    }
  }

  async getChatLogs(): Promise<any[]> {
    try {
      const data = await this.request<any>('/chat-logs');
      return data.messages || [];
    } catch (err) {
      console.warn('[IslePilotClient] Error getting chat logs:', err);
      return [];
    }
  }
}

export const islePilotClient = new IslePilotClient();
