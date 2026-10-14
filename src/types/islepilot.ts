// Types and Interfaces for IslePilot API and ST25 Admin Control Panel

export type AdminRole = 'SUPER_ADMIN' | 'SENIOR_ADMIN' | 'MODERATOR' | 'TRIAL_MOD' | 'GUEST';

export interface AdminUserSession {
  id: string;
  username: string;
  steamId?: string;
  discordId?: string;
  avatarUrl?: string;
  role: AdminRole;
  authenticated?: boolean;
}


export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface PlayerPrimeProgress {
  eligible: boolean;
  isElder: boolean;
  completed: number;
  required: number;
  total: number;
}

export interface PlayerDiscordInfo {
  id: string;
  username: string;
  discriminator?: string;
  avatar?: string;
  roles?: string[];
}

export interface IslePilotPlayer {
  steamId: string;
  name: string;
  online: boolean;
  species: string;
  female: boolean;
  growth: number; // 0.0 to 1.0 (or elder 1.0+)
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  thirst: number;
  maxThirst: number;
  stamina?: number;
  maxStamina?: number;
  bleed?: number;
  brokenLeg?: boolean;
  primeEligible: boolean;
  isPrimeElder: boolean;
  prime?: PlayerPrimeProgress;
  position?: PlayerPosition;
  lastSeenAt: string;
  totalPlaySec: number;
  discord?: PlayerDiscordInfo | null;
  serverNodeId?: string;
  mutations?: string[];
  dinoId?: string;
  reincarnationCount?: number;
  elder?: 'No elder' | 'Frail' | 'Prime';
  lineage?: {
    parent?: (string | null)[];
    elderA?: (string | null)[];
    elderB?: (string | null)[];
  };
  // Admin-enriched fields
  internalNotesCount?: number;
  strikesCount?: number;
  isBanned?: boolean;
  isOutcast?: boolean;
}

export interface ServerStatus {
  name: string;
  playersOnline: number;
  lastPlayerCount: number;
  lastSeenAt: string;
  cpuPct?: number;
  memoryUsedMb?: number;
  memoryTotalMb?: number;
  maxSlots?: number;
  tickrate?: number;
  uptimeSeconds?: number;
  pingMs?: number;
}

export interface DinoSlot {
  id: string;
  steamId: string;
  playerName?: string;
  slotNumber: number;
  species: string;
  gender: 'male' | 'female';
  growth: number;
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  thirst: number;
  maxThirst: number;
  stamina: number;
  maxStamina: number;
  bleed: number;
  brokenLeg: boolean;
  isPrimeElder?: boolean;
  elder?: 'No elder' | 'Frail' | 'Prime';
  mutations?: string[];
  reincarnationCount?: number;
  lineage?: {
    parent?: (string | null)[];
    elderA?: (string | null)[];
    elderB?: (string | null)[];
  };
  colors?: {
    skinPresetId?: string;
    palette?: Record<string, string>; // Hex color map
  };
  parkedAt: string;
  lastUsedAt?: string;
}

export interface KillfeedItem {
  id: string;
  victimSteamId: string;
  victimName: string;
  victimSpecies: string;
  victimGrowth: number;
  killerSteamId?: string | null;
  killerName?: string | null;
  killerSpecies?: string | null;
  killerGrowth?: number;
  cause: string; // 'environment', 'pvp', 'admin', 'starvation', 'dehydration'
  hitLocation?: 'Head' | 'Body' | 'Tail' | 'Legs' | 'Unknown';
  damageDealt?: number;
  coordinates?: { x: number; y: number; z: number };
  emittedAt: string;
  flaggedSuspicious?: boolean;
  violationReason?: string;
}

export interface CombatLogHit {
  id: string;
  timestamp: string;
  attackerSteamId: string;
  attackerName: string;
  targetSteamId: string;
  targetName: string;
  damage: number;
  bodyPart: string;
  weaponOrBite: string;
  x: number;
  y: number;
  z: number;
}

export interface PrimeMemberInfo {
  steamId: string;
  playerName: string;
  discordId?: string;
  tier: 'PRIME_STANDARD' | 'PRIME_ELDER' | 'VIP_IMMORTAL';
  growthMultiplier: number;
  garageSlots: number;
  priorityQueue: boolean;
  godmodeTestAvailable?: boolean;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface QuestItem {
  id: string;
  name: string;
  description: string;
  category: 'daily' | 'weekly' | 'achievement' | 'bounty';
  progress: number;
  target: number;
  unit: string;
  rewardType: 'currency' | 'skin' | 'token' | 'prime_days';
  rewardAmount: number;
  completed: boolean;
  claimed: boolean;
  expiresAt?: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: AdminRole;
  action: string;
  targetSteamId?: string;
  targetName?: string;
  reason?: string;
  payload?: any;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  createdAt: string;
}

export interface WebhookEventPayload {
  event: 'kill' | 'join' | 'leave' | 'command' | 'server_status' | 'crash';
  timestamp: string;
  data: any;
}

export interface QuickActionRequest {
  action: 'heal' | 'feed' | 'slay' | 'revive' | 'teleport' | 'kick' | 'ban' | 'unban' | 'set_growth' | 'set_perk';
  steamId: string;
  reason: string;
  params?: {
    growth?: number;
    destination?: { x: number; y: number; z: number; name?: string };
    durationHours?: number;
    perkType?: string;
    perkValue?: any;
  };
}
