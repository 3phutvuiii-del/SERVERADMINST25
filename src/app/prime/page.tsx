'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Crown,
  Plus,
  Zap,
  CheckCircle,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { PrimeMemberInfo } from '@/types/islepilot';
import { useApp } from '@/components/providers/AppProviders';

export default function PrimePage() {
  const { currentSession, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [targetSteamId, setTargetSteamId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [tier, setTier] = useState<'PRIME_STANDARD' | 'PRIME_ELDER' | 'VIP_IMMORTAL'>('PRIME_ELDER');
  const [growthMultiplier, setGrowthMultiplier] = useState(1.5);
  const [garageSlots, setGarageSlots] = useState(5);
  const [durationDays, setDurationDays] = useState(30);

  const { data, isLoading, refetch } = useQuery<{ members: PrimeMemberInfo[] }>({
    queryKey: ['primeMembers'],
    queryFn: async () => {
      const res = await fetch('/api/islepilot/prime');
      if (!res.ok) throw new Error('Failed to load prime members');
      return res.json();
    },
  });

  const members = data?.members || [];

  const handleGrantPrime = async () => {
    if (!targetSteamId.trim() || !playerName.trim()) {
      addToast('warning', 'Vui lòng điền đủ SteamID64 và Tên người chơi');
      return;
    }

    const startsAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + durationDays * 86400 * 1000).toISOString();

    const newMember: PrimeMemberInfo = {
      steamId: targetSteamId.trim(),
      playerName: playerName.trim(),
      tier,
      growthMultiplier,
      garageSlots,
      priorityQueue: true,
      startsAt,
      expiresAt,
      isActive: true,
    };

    try {
      const res = await fetch('/api/islepilot/prime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });

      if (res.ok) {
        addToast('success', 'Đã cấp quyền Prime thành công!', `Gói: ${tier} cho ${playerName}`);
        setShowAddModal(false);
        setTargetSteamId('');
        setPlayerName('');
        refetch();
      } else {
        addToast('error', 'Lỗi khi lưu gói Prime');
      }
    } catch {
      addToast('error', 'Lỗi kết nối máy chủ');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Crown className="w-6 h-6 text-amber-400" />
            Trung Tâm Hội Viên Prime & Đặc Quyền (VIP Perks)
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Quản lý gói hội viên Prime Elder, hệ số tăng trưởng (Growth Multiplier) và mở rộng slot Gara
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-lg shadow-amber-600/30"
        >
          <Plus className="w-4 h-4" />
          Cấp Gói Prime / Perk Mới
        </button>
      </div>

      {/* Prime Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <p className="col-span-full py-12 text-center text-zinc-400 text-xs">Đang tải danh sách Prime...</p>
        ) : members.length === 0 ? (
          <p className="col-span-full py-12 text-center text-zinc-400 text-xs">Chưa có hội viên Prime nào.</p>
        ) : (
          members.map((m) => (
            <div
              key={m.steamId}
              className="rounded-2xl glass-panel border border-amber-500/30 p-5 shadow-xl relative overflow-hidden group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold uppercase">
                    {m.tier.replace('_', ' ')}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5 group-hover:text-amber-300 transition">
                    {m.playerName}
                  </h4>
                  <p className="text-[11px] font-mono text-zinc-500">{m.steamId}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Crown className="w-5 h-5" />
                </div>
              </div>

              {/* Perks list */}
              <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Hệ số Growth:
                  </span>
                  <strong className="text-amber-400 font-mono">x{m.growthMultiplier.toFixed(1)}</strong>
                </div>

                <div className="flex items-center justify-between text-zinc-300">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" /> Số slot Gara:
                  </span>
                  <strong className="text-cyan-400 font-mono">{m.garageSlots} Slots</strong>
                </div>

                <div className="flex items-center justify-between text-zinc-300">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Hàng chờ ưu tiên:
                  </span>
                  <span className="text-emerald-400 font-bold">BẬT (Priority Queue)</span>
                </div>

                <div className="flex items-center justify-between text-zinc-400 pt-2 border-t border-zinc-800/80 text-[11px] font-mono">
                  <span>Hết hạn:</span>
                  <span>{new Date(m.expiresAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Grant Prime Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-amber-500/40 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Cấp Quyền Prime / Đặc Quyền Cho Người Chơi
            </h3>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-zinc-300">SteamID64</label>
                <input
                  type="text"
                  value={targetSteamId}
                  onChange={(e) => setTargetSteamId(e.target.value)}
                  placeholder="VD: 76561199767090170"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-300">Tên người chơi</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="VD: DragonSlayer_VN"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-300">Hạng Prime (Tier)</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white"
                  >
                    <option value="PRIME_STANDARD">Prime Standard (x1.2)</option>
                    <option value="PRIME_ELDER">Prime Elder (x1.5)</option>
                    <option value="VIP_IMMORTAL">VIP Immortal (x2.0)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-zinc-300">Thời hạn (Ngày)</label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-300">Hệ số Growth Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={growthMultiplier}
                    onChange={(e) => setGrowthMultiplier(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-300">Số lượng Slot Gara</label>
                  <input
                    type="number"
                    value={garageSlots}
                    onChange={(e) => setGarageSlots(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handleGrantPrime}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-lg shadow-amber-600/30"
              >
                Xác nhận cấp Prime
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
