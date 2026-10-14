'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Check,
  X,
  RotateCcw,
  Plus,
  Save,
  Search,
  Sliders,
  Sparkles,
  Dna,
  Megaphone,
  Swords,
  Flame,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Trash2,
  Copy,
  Info,
} from 'lucide-react';
import { DiscordRolePermissionItem, SteamRoleAssignment } from '@/lib/db/store';
import { AdminRole } from '@/types/islepilot';
import { useApp } from '@/components/providers/AppProviders';

interface PermissionCategory {
  id: string;
  name: string;
  icon: any;
  items: {
    key: keyof DiscordRolePermissionItem['permissions'];
    label: string;
    description: string;
    critical?: boolean;
  }[];
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'system',
    name: 'Quản Trị Hệ Thống & Bảo Mật',
    icon: Shield,
    items: [
      {
        key: 'canViewDashboard',
        label: 'Truy cập Tổng quan máy chủ',
        description: 'Xem số lượng người chơi online, RAM, CPU và biểu đồ server',
      },
      {
        key: 'canManageRoles',
        label: 'Quản lý Phân quyền (RBAC)',
        description: 'Toàn quyền chỉnh sửa ma trận quyền hạn các Discord Roles',
        critical: true,
      },
      {
        key: 'canViewAuditLogs',
        label: 'Xem Nhật ký hệ thống (Audit Logs)',
        description: 'Xem toàn bộ lịch sử can thiệp lệnh của tất cả Admin',
      },
    ],
  },
  {
    id: 'mutations',
    name: 'Đột Biến Gen & Quản Lý Khủng Long',
    icon: Dna,
    items: [
      {
        key: 'canEditMutations',
        label: 'Can thiệp Đột biến gen Live (16 Slots)',
        description: 'Được phép xem, sửa và cấp 16 slots mutations cho người chơi',
        critical: true,
      },
      {
        key: 'canEditStats',
        label: 'Chỉnh sửa % Tăng trưởng & Chỉ số',
        description: 'Được phép chỉnh % Growth, Máu, Đói, Khát của khủng long',
      },
      {
        key: 'canManageGarage',
        label: 'Quản lý Gara Khủng Long (Parked Dinos)',
        description: 'Xem và can thiệp các slot khủng long đang cất trong gara',
      },
      {
        key: 'canInjectDino',
        label: 'Bơm khủng long mới vào Gara',
        description: 'Cấp thêm slot khủng long trưởng thành vào gara người chơi',
        critical: true,
      },
      {
        key: 'canWipeGarage',
        label: 'Xóa hoặc Dọn dẹp Gara',
        description: 'Xóa vĩnh viễn slot khủng long trong gara',
        critical: true,
      },
    ],
  },
  {
    id: 'broadcast',
    name: 'Phát Thanh & Thông Báo Server',
    icon: Megaphone,
    items: [
      {
        key: 'canBroadcast',
        label: 'Phát thông báo Broadcast In-game',
        description: 'Gửi thông báo chữ vàng tức thì hiển thị trên toàn server The Isle',
      },
      {
        key: 'canManageAnnouncer',
        label: 'Quản lý Auto-Broadcaster',
        description: 'Tạo mẫu thông báo và cài đặt phát thanh tự động định kỳ',
      },
    ],
  },
  {
    id: 'commands',
    name: 'Lệnh Can Thiệp & Trừng Phạt In-Game',
    icon: Flame,
    items: [
      {
        key: 'canHealFeed',
        label: 'Hồi phục / Cho ăn / Cho uống',
        description: 'Bơm đầy Máu, Độ đói, Độ khát cho người chơi gặp nạn',
      },
      {
        key: 'canTeleport',
        label: 'Dịch chuyển tọa độ (Teleport)',
        description: 'Đưa người chơi kẹt map về các vị trí an toàn',
      },
      {
        key: 'canRevive',
        label: 'Hồi sinh khủng long tử nạn',
        description: 'Khôi phục con khủng long vừa tử vong do lỗi map/glitch',
      },
      {
        key: 'canKick',
        label: 'Kick người chơi',
        description: 'Đá người chơi vi phạm quy tắc ra khỏi server',
      },
      {
        key: 'canBan',
        label: 'Cấm người chơi (Ban)',
        description: 'Khóa tài khoản SteamID người chơi phá game hoặc hack/cheat',
        critical: true,
      },
      {
        key: 'canSlay',
        label: 'Tiêu diệt tức thì (Slay)',
        description: 'Hạ sát khủng long vi phạm luật mixpack hoặc trốn combat',
        critical: true,
      },
    ],
  },
  {
    id: 'players',
    name: 'Người Chơi & Giám Sát Chiến Đấu',
    icon: Users,
    items: [
      {
        key: 'canViewPlayers',
        label: 'Xem danh sách người chơi',
        description: 'Xem toàn bộ người chơi đang online và lịch sử tham gia',
      },
      {
        key: 'canInspectPlayer',
        label: 'Soi chi tiết hồ sơ & Ghi chú (Strikes)',
        description: 'Xem tọa độ, Discord, tiền án và ghi chú cảnh cáo',
      },
      {
        key: 'canViewCombatLogs',
        label: 'Xem nhật ký giao tranh (Combat Logs)',
        description: 'Theo dõi sát thương, lịch sử hạ gục và killfeed',
      },
      {
        key: 'canFlagCombatViolations',
        label: 'Gắn cờ cảnh báo vi phạm luật PvP',
        description: 'Đánh dấu các pha nghi vấn trả thù 5 phút hoặc mixpack',
      },
      {
        key: 'canManagePrime',
        label: 'Quản lý Đặc quyền Prime',
        description: 'Cấp hoặc gia hạn đặc quyền hội viên Prime cho người chơi',
      },
      {
        key: 'canManageQuests',
        label: 'Quản lý Nhiệm vụ & Phần thưởng',
        description: 'Kiểm tra và duyệt nhận thưởng nhiệm vụ sinh tồn',
      },
    ],
  },
];

export default function RolesManagementPage() {
  const { currentSession, addToast } = useApp();
  const queryClient = useQueryClient();

  // Search & tab state
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedRoleName, setSelectedRoleName] = useState<string>('Mod');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeView, setActiveView] = useState<'matrix' | 'simulator' | 'steam_assign'>('matrix');

  // SteamID Assignment state
  const [assignSteamId, setAssignSteamId] = useState('');
  const [assignPlayerName, setAssignPlayerName] = useState('');
  const [assignRole, setAssignRole] = useState<AdminRole>('MODERATOR');
  const [assignNote, setAssignNote] = useState('');

  // Simulator state
  const [simSteamId, setSimSteamId] = useState('');
  const [simSelectedRoles, setSimSelectedRoles] = useState<string[]>(['Mod', 'Server - Booster']);

  // Add role modal state
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#3b82f6');

  // Fetch Roles from API
  const { data: rolesData, isLoading, refetch } = useQuery<{
    success: boolean;
    roles: DiscordRolePermissionItem[];
    steamRoleAssignments?: Record<string, SteamRoleAssignment>;
  }>({
    queryKey: ['discord-roles'],
    queryFn: async () => {
      const res = await fetch('/api/islepilot/roles', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (!res.ok) throw new Error('Không thể tải cấu hình roles');
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
  });

  const rawRoles = rolesData?.roles;
const roles = useMemo<DiscordRolePermissionItem[]>(() => {
 if (!rawRoles) return [];
 if (Array.isArray(rawRoles)) return rawRoles as DiscordRolePermissionItem[];
    return Object.values(rawRoles) as DiscordRolePermissionItem[];
  }, [rawRoles]);
  const steamRoleAssignments = rolesData?.steamRoleAssignments || {};

  // Mutation: Assign Role to SteamID
  const assignSteamMutation = useMutation({
    mutationFn: async () => {
      if (!assignSteamId.trim()) throw new Error('Vui lòng nhập SteamID64');
      const res = await fetch('/api/islepilot/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_steam',
          steamId: assignSteamId.trim(),
          role: assignRole,
          playerName: assignPlayerName.trim(),
          note: assignNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi cấp quyền');
      return data;
    },
    onSuccess: (data) => {
      addToast('success', 'Cấp quyền thành công!', data.message);
      setAssignSteamId('');
      setAssignPlayerName('');
      setAssignNote('');
      if (data.steamRoleAssignments) {
        queryClient.setQueryData(['discord-roles'], (old: any) => ({
          ...old,
          steamRoleAssignments: data.steamRoleAssignments,
        }));
      }
      queryClient.invalidateQueries({ queryKey: ['discord-roles'] });
    },
    onError: (err: any) => {
      addToast('error', 'Lỗi cấp quyền', err.message);
      alert(`[LỖI CẤP QUYỀN BQT]: ${err.message}\n\nVui lòng kiểm tra lại phiên đăng nhập BQT của bạn.`);
    },
  });

  // Mutation: Remove Role from SteamID
  const removeSteamMutation = useMutation({
    mutationFn: async (targetSteamId: string) => {
      const res = await fetch('/api/islepilot/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_steam',
          steamId: targetSteamId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi thu hồi quyền');
      return data;
    },
    onSuccess: (data) => {
      addToast('info', 'Đã thu hồi quyền', data.message);
      if (data.steamRoleAssignments) {
        queryClient.setQueryData(['discord-roles'], (old: any) => ({
          ...old,
          steamRoleAssignments: data.steamRoleAssignments,
        }));
      }
      queryClient.invalidateQueries({ queryKey: ['discord-roles'] });
    },
    onError: (err: any) => {
      addToast('error', 'Lỗi thu hồi quyền', err.message);
      alert(`[LỖI THU HỒI QUYỀN]: ${err.message}`);
    },
  });

  // Local editing state for selected role permissions
  const [localPermissions, setLocalPermissions] = useState<Record<string, DiscordRolePermissionItem>>({});

  const currentRoleItem = useMemo(() => {
    if (localPermissions[selectedRoleName]) return localPermissions[selectedRoleName];
    return roles.find((r) => r.roleName === selectedRoleName) || roles[0];
  }, [roles, selectedRoleName, localPermissions]);

  const activePermissions = currentRoleItem?.permissions;

  // Filtered roles list
  const filteredRoles = useMemo(() => {
    return roles.filter((r) =>
      r.roleName.toLowerCase().includes(roleSearch.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(roleSearch.toLowerCase())
    );
  }, [roles, roleSearch]);

  // Mutation: Save Role Permission
  const saveMutation = useMutation({
    mutationFn: async (item: DiscordRolePermissionItem) => {
      const res = await fetch('/api/islepilot/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi lưu phân quyền');
      return data;
    },
    onSuccess: (data) => {
      addToast('success', 'Đã lưu phân quyền thành công!', data.message);
      queryClient.invalidateQueries({ queryKey: ['discord-roles'] });
    },
    onError: (err: any) => {
      addToast('error', 'Lưu phân quyền thất bại', err.message);
    },
  });

  // Mutation: Reset to Defaults
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/islepilot/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi reset');
      return data;
    },
    onSuccess: () => {
      addToast('success', 'Đã khôi phục mặc định!', 'Toàn bộ ma trận quyền hạn ST25 đã được khôi phục.');
      setLocalPermissions({});
      queryClient.invalidateQueries({ queryKey: ['discord-roles'] });
    },
    onError: (err: any) => {
      addToast('error', 'Lỗi reset', err.message);
    },
  });

  // Mutation: Delete Role
  const deleteMutation = useMutation({
    mutationFn: async (roleName: string) => {
      const res = await fetch('/api/islepilot/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', roleName }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi xóa role');
      return data;
    },
    onSuccess: (_, deletedName) => {
      addToast('info', 'Đã xóa role', `Đã xóa role "${deletedName}" khỏi ma trận phân quyền.`);
      setSelectedRoleName(roles[0]?.roleName || 'Mod');
      queryClient.invalidateQueries({ queryKey: ['discord-roles'] });
    },
    onError: (err: any) => {
      addToast('error', 'Lỗi xóa role', err.message);
    },
  });

  // Toggle single permission for current role
  const handleTogglePermission = (key: keyof DiscordRolePermissionItem['permissions']) => {
    if (!currentRoleItem) return;
    const currentVal = !!activePermissions?.[key];
    const nextPerms = {
      ...currentRoleItem.permissions,
      [key]: !currentVal,
    };
    const nextRoleItem: DiscordRolePermissionItem = {
      ...currentRoleItem,
      permissions: nextPerms,
    };
    setLocalPermissions((prev) => ({
      ...prev,
      [currentRoleItem.roleName]: nextRoleItem,
    }));
  };

  // Apply Quick Presets
  const handleApplyPreset = (preset: 'super' | 'mod' | 'vip' | 'view' | 'none') => {
    if (!currentRoleItem) return;
    let nextPerms: DiscordRolePermissionItem['permissions'] = { ...currentRoleItem.permissions };

    const allKeys = PERMISSION_CATEGORIES.flatMap((c) => c.items.map((i) => i.key));

    if (preset === 'super') {
      allKeys.forEach((k) => (nextPerms[k] = true));
    } else if (preset === 'mod') {
      allKeys.forEach((k) => (nextPerms[k] = false));
      nextPerms.canViewDashboard = true;
      nextPerms.canViewPlayers = true;
      nextPerms.canInspectPlayer = true;
      nextPerms.canEditMutations = true;
      nextPerms.canEditStats = true;
      nextPerms.canManageGarage = true;
      nextPerms.canBroadcast = true;
      nextPerms.canHealFeed = true;
      nextPerms.canTeleport = true;
      nextPerms.canKick = true;
      nextPerms.canRevive = true;
      nextPerms.canViewCombatLogs = true;
      nextPerms.canFlagCombatViolations = true;
      nextPerms.canViewAuditLogs = true;
    } else if (preset === 'vip') {
      allKeys.forEach((k) => (nextPerms[k] = false));
      nextPerms.canViewDashboard = true;
      nextPerms.canViewPlayers = true;
      nextPerms.canInspectPlayer = true;
      nextPerms.canViewCombatLogs = true;
    } else if (preset === 'view') {
      allKeys.forEach((k) => (nextPerms[k] = false));
      nextPerms.canViewDashboard = true;
      nextPerms.canViewPlayers = true;
    } else if (preset === 'none') {
      allKeys.forEach((k) => (nextPerms[k] = false));
    }

    setLocalPermissions((prev) => ({
      ...prev,
      [currentRoleItem.roleName]: {
        ...currentRoleItem,
        permissions: nextPerms,
      },
    }));
    addToast('info', 'Đã áp dụng mẫu cấu hình', `Áp dụng mẫu "${preset.toUpperCase()}" cho role ${currentRoleItem.roleName}`);
  };

  // Save current role changes
  const handleSaveCurrentRole = () => {
    if (!currentRoleItem) return;
    saveMutation.mutate(currentRoleItem);
  };

  // Add new custom role
  const handleAddNewRole = () => {
    if (!newRoleName.trim()) {
      addToast('error', 'Lỗi nhập liệu', 'Vui lòng nhập tên role Discord');
      return;
    }
    const item: DiscordRolePermissionItem = {
      roleName: newRoleName.trim(),
      description: newRoleDesc.trim() || 'Role tùy chỉnh tự tạo',
      badgeColor: newRoleColor,
      permissions: {
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
      },
      updatedAt: new Date().toISOString(),
    };

    saveMutation.mutate(item, {
      onSuccess: () => {
        setSelectedRoleName(item.roleName);
        setShowAddRoleModal(false);
        setNewRoleName('');
        setNewRoleDesc('');
      },
    });
  };

  // Compute stats for current role
  const enabledCount = useMemo(() => {
    if (!activePermissions) return 0;
    return Object.values(activePermissions).filter(Boolean).length;
  }, [activePermissions]);

  // Simulator Merged Permissions Calculation
  const simulatorMerged = useMemo(() => {
    const res: Record<string, boolean> = {};
    PERMISSION_CATEGORIES.flatMap((c) => c.items.map((i) => i.key)).forEach((k) => (res[k] = false));

    for (const rName of simSelectedRoles) {
      const found = roles.find((r) => r.roleName === rName);
      if (found) {
        for (const [k, v] of Object.entries(found.permissions)) {
          if (v === true) res[k] = true;
        }
      }
    }
    return res;
  }, [roles, simSelectedRoles]);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1627] via-[#09111e] to-[#0d1627] border border-blue-500/20 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                Hệ Thống Phân Quyền Discord (Custom RBAC)
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                ST25 CLOUD READY
              </span>
            </div>
            <p className="text-sm text-zinc-400 max-w-3xl">
              Tự do cấu hình ma trận quyền hạn cho từng chức vụ Discord liên kết từ máy chủ ST25. Phân quyền hoạt động độc lập, không bị giới hạn bởi quyền mặc định của IslePilot.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
              title="Khôi phục tất cả roles về cài đặt chuẩn ST25"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetMutation.isPending ? 'animate-spin' : ''}`} />
              Reset Mặc Định
            </button>

            <button
              onClick={() => setShowAddRoleModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm Role Mới
            </button>

            <button
              onClick={handleSaveCurrentRole}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu Quyền Role Này'}
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800/80">
          <button
            onClick={() => setActiveView('matrix')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'matrix'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Ma Trận Phân Quyền (Matrix)
          </button>
          <button
            onClick={() => setActiveView('steam_assign')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'steam_assign'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Cấp Quyền Theo SteamID (Direct Assign)
          </button>
          <button
            onClick={() => setActiveView('simulator')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'simulator'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Kiểm Tra / Giả Lập Quyền (Simulator)
          </button>
        </div>
      </div>


      {activeView === 'matrix' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Role Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-[#090e18] border border-zinc-800/80 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Danh Sách Discord Roles ({roles.length})
                </span>
                <span className="text-[11px] font-mono text-zinc-500">IslePilot Linked</span>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm chức vụ..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900/90 border border-zinc-700/60 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Roles List */}
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredRoles.map((r) => {
                  const isSelected = r.roleName === selectedRoleName;
                  const perms = localPermissions[r.roleName]?.permissions || r.permissions;
                  const activeCount = Object.values(perms).filter(Boolean).length;
                  const totalCount = Object.keys(perms).length;

                  return (
                    <div
                      key={r.roleName}
                      onClick={() => setSelectedRoleName(r.roleName)}
                      className={`group p-3 rounded-xl cursor-pointer border transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-500/10 border-blue-500/50 text-white shadow-md'
                          : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: r.badgeColor || '#3b82f6' }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate leading-tight">{r.roleName}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{r.description || 'Chưa có mô tả'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                            activeCount > 15
                              ? 'bg-red-500/20 text-red-400'
                              : activeCount > 8
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : activeCount > 0
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {activeCount}/{totalCount}
                        </span>

                        {r.roleName !== 'QUAN KHÂM SAI' && r.roleName !== 'DEV' && r.roleName !== 'LONG KHÔNG (AD)' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Bạn có chắc muốn xóa role "${r.roleName}" khỏi cấu hình phân quyền?`)) {
                                deleteMutation.mutate(r.roleName);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition"
                            title="Xóa role này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Permission Matrix (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {currentRoleItem && (
              <div className="p-5 rounded-2xl bg-[#090e18] border border-zinc-800/80 shadow-lg space-y-6">
                {/* Role Header & Quick Presets */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800/80 gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: currentRoleItem.badgeColor || '#3b82f6' }}
                      />
                      <h2 className="text-lg font-bold text-white tracking-wide">
                        {currentRoleItem.roleName}
                      </h2>
                      <span className="px-2 py-0.5 text-xs font-mono rounded bg-zinc-800 text-zinc-300">
                        {enabledCount} / {Object.keys(currentRoleItem.permissions).length} Quyền
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{currentRoleItem.description}</p>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1">Mẫu nhanh:</span>
                    <button
                      onClick={() => handleApplyPreset('super')}
                      className="px-2 py-1 text-[11px] rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30 transition"
                    >
                      Super Admin
                    </button>
                    <button
                      onClick={() => handleApplyPreset('mod')}
                      className="px-2 py-1 text-[11px] rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition"
                    >
                      Mod / BQT
                    </button>
                    <button
                      onClick={() => handleApplyPreset('vip')}
                      className="px-2 py-1 text-[11px] rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition"
                    >
                      VIP Member
                    </button>
                    <button
                      onClick={() => handleApplyPreset('view')}
                      className="px-2 py-1 text-[11px] rounded-lg bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/30 transition"
                    >
                      Chỉ Xem
                    </button>
                    <button
                      onClick={() => handleApplyPreset('none')}
                      className="px-2 py-1 text-[11px] rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition"
                    >
                      Tắt Hết
                    </button>
                  </div>
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      activeCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    Tất cả danh mục
                  </button>
                  {PERMISSION_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategory(c.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                        activeCategory === c.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <c.icon className="w-3.5 h-3.5" />
                      {c.name}
                    </button>
                  ))}
                </div>

                {/* Permissions Groups */}
                <div className="space-y-6">
                  {PERMISSION_CATEGORIES.filter(
                    (cat) => activeCategory === 'all' || activeCategory === cat.id
                  ).map((cat) => (
                    <div key={cat.id} className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                        <cat.icon className="w-4 h-4 text-blue-400" />
                        <span>{cat.name}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cat.items.map((item) => {
                          const isEnabled = !!activePermissions?.[item.key];

                          return (
                            <div
                              key={item.key}
                              onClick={() => handleTogglePermission(item.key)}
                              className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                                isEnabled
                                  ? 'bg-blue-950/20 border-blue-500/40 text-white shadow-sm'
                                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800/40 hover:border-zinc-700'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold">{item.label}</span>
                                  {item.critical && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-red-500/20 text-red-400 rounded">
                                      CRITICAL
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-500 leading-snug">{item.description}</p>
                              </div>

                              {/* Toggle Switch UI */}
                              <div
                                className={`w-9 h-5 rounded-full flex-shrink-0 p-0.5 transition-colors ${
                                  isEnabled ? 'bg-blue-600' : 'bg-zinc-700'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                    isEnabled ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Save Reminder */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-blue-300">
                      Cấu hình quyền hạn của <b>{currentRoleItem.roleName}</b> sẽ có hiệu lực ngay lập tức cho tất cả người chơi sở hữu role này.
                    </span>
                  </div>
                  <button
                    onClick={handleSaveCurrentRole}
                    disabled={saveMutation.isPending}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md transition"
                  >
                    {saveMutation.isPending ? 'Đang lưu...' : 'Lưu Ngay'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeView === 'steam_assign' ? (
        /* View 3: Direct SteamID Role Assignment */
        <div className="space-y-6">
          {/* Form to Assign Role */}
          <div className="p-6 rounded-2xl bg-[#090e18] border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Cấp Quyền Quản Trị Trực Tiếp Cho SteamID
                </h3>
                <p className="text-xs text-zinc-400">
                  Gán vai trò BQT cố định bằng SteamID64. Khi người chơi đăng nhập bằng Steam này, hệ thống sẽ mở khóa ngay lập tức mà không cần kiểm tra lại Discord.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  SteamID64 Người Dùng <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: 76561198681721956..."
                  value={assignSteamId}
                  onChange={(e) => setAssignSteamId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Tên Người Dùng / Biệt Danh
                </label>
                <input
                  type="text"
                  placeholder="VD: NguyenMen..."
                  value={assignPlayerName}
                  onChange={(e) => setAssignPlayerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Vai Trò Cấp <span className="text-red-400">*</span>
                </label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value as AdminRole)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="SUPER_ADMIN">Super Admin (Quan Khâm Sai - Toàn quyền)</option>
                  <option value="SENIOR_ADMIN">Senior Admin (Trưởng BQT)</option>
                  <option value="MODERATOR">Moderator (Quản trị viên)</option>
                  <option value="TRIAL_MOD">Trial Mod (Học việc)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Ghi Chú Nhiệm Vụ
                </label>
                <input
                  type="text"
                  placeholder="VD: Admin Ca Đêm, Dev..."
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => assignSteamMutation.mutate()}
                disabled={assignSteamMutation.isPending || !assignSteamId.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{assignSteamMutation.isPending ? 'Đang cấp...' : 'Xác Nhận Cấp Quyền BQT'}</span>
              </button>
            </div>
          </div>

          {/* List of Assigned Steam Accounts */}
          <div className="p-6 rounded-2xl bg-[#090e18] border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Danh Sách SteamID Được Cấp Quyền Trực Tiếp ({Object.keys(steamRoleAssignments).length})
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Các tài khoản dưới đây được lưu trong cơ sở dữ liệu hệ thống ST25 và tự động nhận quyền khi đăng nhập.
                </p>
              </div>
            </div>

            {Object.keys(steamRoleAssignments).length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Chưa có SteamID nào được gán quyền trực tiếp. Mọi phân quyền hiện đang chạy theo Discord Roles.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px]">
                      <th className="pb-3 px-3">STEAMID64</th>
                      <th className="pb-3 px-3">TÊN ADMIN</th>
                      <th className="pb-3 px-3">VAI TRÒ</th>
                      <th className="pb-3 px-3">GHI CHÚ</th>
                      <th className="pb-3 px-3">NGƯỜI CẤP</th>
                      <th className="pb-3 px-3">NGÀY CẤP</th>
                      <th className="pb-3 px-3 text-right">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {Object.values(steamRoleAssignments).map((item) => {
                      const roleColors: Record<string, string> = {
                        SUPER_ADMIN: 'bg-red-500/10 text-red-400 border-red-500/30',
                        SENIOR_ADMIN: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                        MODERATOR: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                        TRIAL_MOD: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
                      };
                      const color = roleColors[item.role] || 'bg-zinc-800 text-zinc-400';

                      return (
                        <tr key={item.steamId} className="hover:bg-zinc-900/40 transition">
                          <td className="py-3 px-3 font-mono text-cyan-400">
                            {item.steamId}
                          </td>
                          <td className="py-3 px-3 font-semibold text-white">
                            {item.playerName || '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold ${color}`}>
                              {item.roleTitle || item.role}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-zinc-400">
                            {item.note || '—'}
                          </td>
                          <td className="py-3 px-3 text-zinc-500 font-mono">
                            {item.assignedBy || 'Admin'}
                          </td>
                          <td className="py-3 px-3 text-zinc-500 font-mono text-[10px]">
                            {new Date(item.assignedAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeSteamMutation.mutate(item.steamId)}
                              disabled={removeSteamMutation.isPending}
                              title="Thu hồi vai trò BQT"
                              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold transition"
                            >
                              Thu hồi
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* View 2: Permission Simulator & Checker */

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 p-5 rounded-2xl bg-[#090e18] border border-zinc-800/80 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              Chọn Roles Để Giả Lập Quyền
            </h3>
            <p className="text-xs text-zinc-400">
              Khi một người chơi sở hữu nhiều Discord Roles cùng lúc, hệ thống sẽ tự động <b>Hợp nhất quyền (Permission Union)</b>.
            </p>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {roles.map((r) => {
                const isChecked = simSelectedRoles.includes(r.roleName);
                return (
                  <div
                    key={r.roleName}
                    onClick={() => {
                      if (isChecked) {
                        setSimSelectedRoles((prev) => prev.filter((name) => name !== r.roleName));
                      } else {
                        setSimSelectedRoles((prev) => [...prev, r.roleName]);
                      }
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isChecked
                        ? 'bg-blue-600/15 border-blue-500/40 text-white'
                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.badgeColor || '#3b82f6' }} />
                      <span className="text-xs font-bold">{r.roleName}</span>
                    </div>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-blue-600 border-blue-500' : 'border-zinc-700'}`}>
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 p-5 rounded-2xl bg-[#090e18] border border-zinc-800/80 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white">Kết Quả Hợp Nhất Quyền Thực Tế</h3>
                <p className="text-xs text-zinc-400">
                  Roles đang giả lập: {simSelectedRoles.join(', ') || 'Chưa chọn role nào'}
                </p>
              </div>
              <span className="px-3 py-1 text-xs font-mono font-bold bg-blue-500/20 text-blue-400 rounded-lg">
                {Object.values(simulatorMerged).filter(Boolean).length} Quyền Hoạt Động
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PERMISSION_CATEGORIES.flatMap((c) => c.items).map((item) => {
                const isAllowed = simulatorMerged[item.key];
                return (
                  <div
                    key={item.key}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isAllowed
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : 'bg-zinc-900/30 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{item.label}</p>
                      <p className="text-[10px] text-zinc-500">{item.description}</p>
                    </div>
                    {isAllowed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Role */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#090e18] border border-zinc-800 shadow-2xl space-y-4 text-zinc-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                Thêm Chức Vụ Discord Mới
              </h3>
              <button onClick={() => setShowAddRoleModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">Tên Role (Khớp với Discord)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: QUAN KHÂM SAI, VIP PRO, BẢO TRỢ..."
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">Mô tả nhiệm vụ / cấp bậc</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ban hỗ trợ kiểm duyệt..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">Màu sắc nhận diện (Badge Color)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newRoleColor}
                    onChange={(e) => setNewRoleColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-zinc-400">{newRoleColor}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowAddRoleModal(false)}
                className="px-4 py-2 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Hủy
              </button>
              <button
                onClick={handleAddNewRole}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white"
              >
                Tạo Role & Bắt Đầu Phân Quyền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
