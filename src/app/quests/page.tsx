'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Scroll,
  Gift,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  RefreshCw,
  X,
  User,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { QuestItem, IslePilotPlayer } from '@/types/islepilot';
import { useApp } from '@/components/providers/AppProviders';

export default function QuestsPage() {
  const { currentSession, addToast } = useApp();

  // 1. Fetch real players list
  const { data: playersData } = useQuery<{ players: IslePilotPlayer[] }>({
    queryKey: ['players', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/islepilot/players');
      if (!res.ok) return { players: [] };
      return res.json();
    },
  });

  const playersList = playersData?.players || [];
  const [steamId, setSteamId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'claimed'>('all');

  // Selected player info
  const selectedPlayer = useMemo(() => {
    return playersList.find((p) => p.steamId === steamId);
  }, [playersList, steamId]);

  // 2. Fetch quests from IslePilot API (all or specific player)
  const { data, isLoading, refetch, isFetching } = useQuery<{ quests: QuestItem[]; mode: string }>({
    queryKey: ['quests', steamId],
    queryFn: async () => {
      const url = steamId
        ? `/api/islepilot/quests?steamId=${encodeURIComponent(steamId)}`
        : '/api/islepilot/quests';
      const res = await fetch(url);
      if (!res.ok) return { quests: [], mode: 'all' };
      return res.json();
    },
  });

  const allQuests = data?.quests || [];

  // Filter quests by search and status
  const filteredQuests = useMemo(() => {
    return allQuests.filter((q) => {
      if (statusFilter === 'completed' && !q.completed) return false;
      if (statusFilter === 'in_progress' && (q.completed || q.claimed)) return false;
      if (statusFilter === 'claimed' && !q.claimed) return false;

      if (search.trim()) {
        const s = search.toLowerCase();
        const matchName = q.name.toLowerCase().includes(s);
        const matchDesc = q.description.toLowerCase().includes(s);
        const matchCat = q.category.toLowerCase().includes(s);
        return matchName || matchDesc || matchCat;
      }
      return true;
    });
  }, [allQuests, statusFilter, search]);

  const handleManualGrantReward = async (quest: QuestItem) => {
    if (!steamId && !selectedPlayer) {
      addToast('warning', 'Vui lòng chọn một người chơi cụ thể để phát thưởng!');
      return;
    }

    const targetSteamId = steamId || selectedPlayer?.steamId;
    const targetName = selectedPlayer?.name || targetSteamId;

    try {
      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant_reward',
          steamId: targetSteamId,
          reason: `Phát thưởng nhiệm vụ: ${quest.name}`,
          actorRole: currentSession.role,
          actorName: currentSession.username,
          params: { rewardType: quest.rewardType, amount: quest.rewardAmount },
        }),
      });

      if (res.ok) {
        addToast(
          'success',
          'Đã phát thưởng thành công!',
          `Cấp ${quest.rewardAmount} ${quest.rewardType} cho ${targetName}`
        );
        refetch();
      } else {
        addToast('error', 'Lỗi khi phát thưởng');
      }
    } catch {
      addToast('error', 'Lỗi kết nối');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Scroll className="w-6 h-6 text-purple-400" />
            Hệ Thống Nhiệm Vụ & Phát Thưởng (Quests & Rewards)
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Theo dõi tiến độ hoàn thành nhiệm vụ và phê duyệt cấp phát phần thưởng cho người chơi từ IslePilot API
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-purple-400' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filter and Selection Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-zinc-800/80 space-y-3">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          {/* Player select */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative">
              <select
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                className="px-3 py-2 pr-8 rounded-xl bg-zinc-950 border border-zinc-700/80 text-xs text-white max-w-sm focus:outline-none focus:border-purple-500 font-medium"
              >
                <option value="">-- Tất cả người chơi / Danh mục máy chủ ({playersList.length}) --</option>
                {playersList.map((p) => (
                  <option key={p.steamId} value={p.steamId}>
                    {p.name} ({p.species} • {p.online ? 'Online' : 'Offline'})
                  </option>
                ))}
              </select>
            </div>

            {/* Direct SteamID input */}
            <input
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="Hoặc nhập SteamID..."
              className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700/80 text-xs text-white font-mono w-48 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />

            {steamId && (
              <button
                onClick={() => setSteamId('')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs transition border border-zinc-700"
                title="Bỏ chọn để xem tất cả nhiệm vụ"
              >
                <X className="w-3.5 h-3.5 text-red-400" />
                <span>Xem tất cả</span>
              </button>
            )}
          </div>

          {/* Search Quests */}
          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-purple-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên nhiệm vụ, mô tả..."
              className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="w-3 h-3 text-zinc-400 hover:text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'all'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Tất cả ({allQuests.length})
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'in_progress'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Đang thực hiện
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Đã hoàn thành
            </button>
            <button
              onClick={() => setStatusFilter('claimed')}
              className={`px-3 py-1 rounded-lg transition font-medium ${
                statusFilter === 'claimed'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Đã nhận thưởng
            </button>
          </div>

          {/* Active Context Banner */}
          <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
            {selectedPlayer ? (
              <span className="flex items-center gap-1.5 text-purple-300">
                <User className="w-3.5 h-3.5 text-purple-400" />
                Đang xem người chơi: <strong>{selectedPlayer.name}</strong> ({selectedPlayer.species})
              </span>
            ) : steamId ? (
              <span className="text-purple-300">
                Đang xem SteamID: <strong>{steamId}</strong>
              </span>
            ) : (
              <span className="text-zinc-500">
                Đang xem: Danh mục toàn bộ nhiệm vụ máy chủ ({filteredQuests.length} nhiệm vụ)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-zinc-400 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-2" />
            Đang tải dữ liệu nhiệm vụ từ máy chủ IslePilot...
          </div>
        ) : filteredQuests.length === 0 ? (
          <div className="col-span-full py-16 text-center glass-panel rounded-2xl border border-zinc-800 p-8">
            <Scroll className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-300">
              Không tìm thấy nhiệm vụ nào
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              {search
                ? `Không có nhiệm vụ nào khớp với từ khóa "${search}".`
                : 'Không có nhiệm vụ nào trong trạng thái hoặc người chơi đã chọn.'}
            </p>
            {(steamId || search || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSteamId('');
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="mt-4 px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-semibold hover:bg-purple-600/30 transition"
              >
                Đặt lại tất cả bộ lọc
              </button>
            )}
          </div>
        ) : (
          filteredQuests.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl glass-panel border border-zinc-800/80 hover:border-purple-500/40 p-5 shadow-xl transition space-y-4 relative overflow-hidden group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 uppercase font-bold tracking-wider">
                    {q.category}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2 group-hover:text-purple-300 transition">
                    {q.name}
                  </h4>
                </div>
                {q.completed ? (
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-zinc-800 text-zinc-400 flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                )}
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed min-h-[36px]">{q.description}</p>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-zinc-500">Tiến độ:</span>
                  <span className="font-bold text-zinc-200">
                    {q.progress} / {q.target} {q.unit}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(4, (q.progress / q.target) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Reward summary & Action */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold font-mono">
                  <Gift className="w-4 h-4" />
                  <span>
                    {q.rewardAmount} {q.rewardType}
                  </span>
                </div>

                {q.claimed ? (
                  <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                    ĐÃ NHẬN
                  </span>
                ) : (
                  <button
                    onClick={() => handleManualGrantReward(q)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition shadow-lg shadow-purple-600/20 active:scale-95"
                  >
                    Phát thưởng
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
