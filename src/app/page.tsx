'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  Swords,
  Crown,
  ShieldAlert,
  Server,
  Cpu,
  HardDrive,
  Activity,
  Radio,
  ArrowUpRight,
  RefreshCw,
  Search,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { ServerStatus, IslePilotPlayer, KillfeedItem } from '@/types/islepilot';
import { getDinoSpeciesImage, formatTimeAgo, formatPlaytime } from '@/lib/utils';
import { useApp } from '@/components/providers/AppProviders';

export default function DashboardPage() {
  const { currentSession, addToast } = useApp();
  const [quickTargetId, setQuickTargetId] = useState('');
  const [quickReason, setQuickReason] = useState('');

  // 1. Fetch Server Status
  const { data: serverStatus, isFetching: statusLoading, refetch: refetchStatus } = useQuery<ServerStatus>({
    queryKey: ['serverStatus'],
    queryFn: async () => {
      const res = await fetch('/api/islepilot/server');
      if (!res.ok) throw new Error('Failed to fetch server');
      return res.json();
    },
    refetchInterval: 10000,
  });

  // 2. Fetch Live Online Players
  const { data: playersData, refetch: refetchPlayers } = useQuery<{ players: IslePilotPlayer[] }>({
    queryKey: ['players', 'online'],
    queryFn: async () => {
      const res = await fetch('/api/islepilot/players?online=true');
      if (!res.ok) throw new Error('Failed to fetch online players');
      return res.json();
    },
    refetchInterval: 12000,
  });

  // 3. Fetch Killfeed stream
  const { data: killfeedData, refetch: refetchKillfeed } = useQuery<{ kills: KillfeedItem[] }>({
    queryKey: ['killfeed'],
    queryFn: async () => {
      const res = await fetch('/api/islepilot/killfeed');
      if (!res.ok) throw new Error('Failed to fetch killfeed');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const onlinePlayers = playersData?.players || [];
  const kills = killfeedData?.kills || [];

  const handleQuickKick = async () => {
    if (!quickTargetId.trim()) {
      addToast('warning', 'Vui lòng nhập SteamID64 hoặc Discord ID');
      return;
    }
    try {
      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'kick',
          steamId: quickTargetId.trim(),
          reason: quickReason || 'Admin quick kick from dashboard',
          actorRole: currentSession.role,
          actorName: currentSession.username,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('success', 'Đã kick người chơi thành công!', data.message);
        setQuickTargetId('');
        setQuickReason('');
        refetchPlayers();
      } else {
        addToast('error', 'Kick thất bại', data.error);
      }
    } catch {
      addToast('error', 'Lỗi kết nối');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Live Server Banner */}
      <div className="relative rounded-2xl glass-panel-glow border border-emerald-500/30 p-6 overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                CLUSTER THE ISLE ACTIVE
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide">
              {serverStatus?.name || 'ST25 VIETNAM'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Bảng điều khiển máy chủ trung tâm thời gian thực, đồng bộ trực tiếp với IslePilot API.
              Theo dõi biến động người chơi, sinh lực khủng long và các pha PvP.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                refetchStatus();
                refetchPlayers();
                refetchKillfeed();
              }}
              className="px-3.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-xs text-zinc-300 flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? 'animate-spin text-emerald-400' : ''}`} />
              Đồng bộ dữ liệu
            </button>
            <Link
              href="/players"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/30"
            >
              Quản lý người chơi
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Realtime Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Online Players */}
        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Người chơi Online</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {serverStatus?.playersOnline ?? onlinePlayers.length}
            </span>
            <span className="text-xs font-mono text-zinc-500">/ {serverStatus?.maxSlots || 200} slots</span>
          </div>
          <div className="mt-3 w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{
                width: `${Math.min(100, (((serverStatus?.playersOnline ?? onlinePlayers.length) / (serverStatus?.maxSlots || 200)) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 2: Tickrate & Ping */}
        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Server Tickrate / Ping</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400">
              {serverStatus?.tickrate ? `${serverStatus.tickrate.toFixed(1)}` : '—'}
            </span>
            <span className="text-xs font-mono text-zinc-500">
              {serverStatus?.tickrate ? 'TPS' : ''}
              {serverStatus?.pingMs ? ` • ${serverStatus.pingMs}ms Ping` : ''}
            </span>
          </div>
          <p className="mt-3 text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Trạng thái máy chủ: Ổn định
          </p>
        </div>

        {/* Metric 3: CPU Usage */}
        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Tải CPU Host</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {typeof serverStatus?.cpuPct === 'number' ? `${serverStatus.cpuPct.toFixed(1)}%` : '—'}
            </span>
            <span className="text-xs font-mono text-zinc-500">
              {typeof serverStatus?.cpuPct === 'number' ? 'Host Load' : 'Không báo cáo'}
            </span>
          </div>
          <div className="mt-3 w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${Math.min(100, serverStatus?.cpuPct || 0)}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Memory Usage */}
        <div className="p-5 rounded-2xl glass-panel border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Bộ Nhớ RAM Đang Dùng</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {typeof serverStatus?.memoryUsedMb === 'number'
                ? `${(serverStatus.memoryUsedMb / 1024).toFixed(1)}GB`
                : '—'}
            </span>
            {serverStatus?.memoryTotalMb ? (
              <span className="text-xs font-mono text-zinc-500">
                / {Math.round(serverStatus.memoryTotalMb / 1024)}GB
              </span>
            ) : null}
          </div>
          <div className="mt-3 w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  serverStatus?.memoryUsedMb && serverStatus?.memoryTotalMb
                    ? (serverStatus.memoryUsedMb / serverStatus.memoryTotalMb) * 100
                    : 0
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Live Activity Feed + Quick Action Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed & Kill Stream (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Realtime Killfeed stream */}
          <div className="rounded-2xl glass-panel border border-zinc-800 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <Swords className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Luồng Sự Kiện Tử Vong & PvP (Killfeed)
                  </h3>
                  <p className="text-[11px] text-zinc-500">Cập nhật trực tiếp từ API IslePilot</p>
                </div>
              </div>

              <Link
                href="/combat"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                Xem chi tiết Combat Log
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-zinc-800/60 max-h-80 overflow-y-auto">
              {kills.length === 0 ? (
                <p className="py-8 text-center text-xs text-zinc-500">Chưa có sự kiện tử vong nào gần đây.</p>
              ) : (
                kills.slice(0, 6).map((k) => (
                  <div key={k.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500/80" />
                      <div>
                        {k.killerName ? (
                          <p className="text-zinc-200">
                            <strong className="text-amber-400">{k.killerName}</strong>{' '}
                            <span className="text-zinc-500">({k.killerSpecies})</span>{' '}
                            <span className="text-red-400 font-bold">hạ gục</span>{' '}
                            <strong className="text-white">{k.victimName}</strong>{' '}
                            <span className="text-zinc-500">
                              ({k.victimSpecies} {(k.victimGrowth * 100).toFixed(0)}%)
                            </span>
                          </p>
                        ) : (
                          <p className="text-zinc-200">
                            <strong className="text-white">{k.victimName}</strong>{' '}
                            <span className="text-zinc-500">({k.victimSpecies})</span>{' '}
                            <span className="text-zinc-400">tử vong do</span>{' '}
                            <span className="text-cyan-400 font-semibold">{k.cause}</span>
                          </p>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {formatTimeAgo(k.emittedAt)}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                      ID #{k.id}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Online Players Snapshot */}
          <div className="rounded-2xl glass-panel border border-zinc-800 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Người Chơi Đang Online Ngay Bây Giờ</h3>
                  <p className="text-[11px] text-zinc-500">{onlinePlayers.length} tài khoản trong máy chủ</p>
                </div>
              </div>

              <Link
                href="/players?online=true"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                Mở danh bạ
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onlinePlayers.slice(0, 6).map((player) => {
                const img = getDinoSpeciesImage(player.species);
                return (
                  <div
                    key={player.steamId}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800/80 p-0.5 flex items-center justify-center">
                        <Image src={img} alt={player.species} width={28} height={28} className="object-contain" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-[120px]">{player.name}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          {player.species} • {(player.growth * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/players`}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                    >
                      Inspect
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Action Bar (1 Col) */}
        <div className="space-y-6">
          <div className="rounded-2xl glass-panel border border-zinc-800 p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Thao Tác Nhanh (Quick Action Bar)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Xử lý nhanh người chơi theo SteamID64 mà không cần tìm kiếm danh bạ.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300">SteamID64 hoặc Discord ID</label>
                <input
                  type="text"
                  value={quickTargetId}
                  onChange={(e) => setQuickTargetId(e.target.value)}
                  placeholder="VD: 76561199767090170"
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Lý do can thiệp</label>
                <input
                  type="text"
                  value={quickReason}
                  onChange={(e) => setQuickReason(e.target.value)}
                  placeholder="VD: Cảnh cáo vi phạm kênh chat..."
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleQuickKick}
                  className="py-2 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Kick Nhanh
                </button>
                <Link
                  href="/garage"
                  className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  Mở Gara
                </Link>
              </div>
            </div>
          </div>

          {/* System Audit Preview */}
          <AuditLogDashboardPreview />
        </div>
      </div>
    </div>
  );
}

function AuditLogDashboardPreview() {
  const { data } = useQuery<{ logs: any[] }>({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const res = await fetch('/api/islepilot/audit');
      if (!res.ok) return { logs: [] };
      return res.json();
    },
    refetchInterval: 10000,
  });

  const logs = data?.logs || [];

  return (
    <div className="rounded-2xl glass-panel border border-zinc-800 p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          Audit Log Gần Nhất
        </h3>
        <Link href="/audit" className="text-[11px] text-emerald-400 hover:underline">
          Tất cả
        </Link>
      </div>
      <div className="mt-3 space-y-2 text-xs">
        {logs.length === 0 ? (
          <p className="py-4 text-center text-zinc-500 text-[11px]">
            Chưa có hành động can thiệp nào được ghi nhận trong phiên làm việc.
          </p>
        ) : (
          logs.slice(0, 3).map((log) => (
            <div key={log.id} className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <p className="font-semibold text-zinc-200">
                {log.action} ({log.targetName || log.targetSteamId})
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Admin: {log.actorName} • {log.reason}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

