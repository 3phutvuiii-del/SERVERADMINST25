'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Swords,
  ShieldAlert,
  AlertTriangle,
  Search,
  CheckCircle,
  Eye,
  RefreshCw,
  Skull,
  HeartCrack,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';
import { KillfeedItem } from '@/types/islepilot';
import { formatTimeAgo, formatNumber, getDinoSpeciesImage, getHealthDeducted } from '@/lib/utils';
import { useApp } from '@/components/providers/AppProviders';
import { ReviveDinoModal } from '@/components/modals/ReviveDinoModal';

const COMBAT_TABS = [
  { id: 'all', label: 'Tất cả Kills & Combat' },
  { id: 'pvp', label: 'PvP Người chơi vs Người chơi' },
  { id: 'suspicious', label: 'Cờ nghi vấn vi phạm (Suspicious Flags)' },
  { id: 'environment', label: 'Tử vong môi trường (Self-slay)' },
];

export default function CombatPage() {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedKill, setSelectedKill] = useState<KillfeedItem | null>(null);

  // Revive Modal state
  const [reviveTarget, setReviveTarget] = useState<any | null>(null);
  const [showReviveModal, setShowReviveModal] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery<{ kills: KillfeedItem[] }>({
    queryKey: ['killfeed-combat'],
    queryFn: async () => {
      const res = await fetch('/api/islepilot/killfeed');
      if (!res.ok) throw new Error('Không thể tải nhật ký chiến đấu');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const kills = data?.kills || [];

  // Filter list
  const filteredKills = kills.filter((k) => {
    const isPvp = k.cause === 'player' || !!k.killerName;

    if (activeTab === 'pvp' && !isPvp) return false;
    if (activeTab === 'environment' && isPvp) return false;
    if (activeTab === 'suspicious' && !k.flaggedSuspicious) return false;

    if (search.trim()) {
      const s = search.toLowerCase();
      const matchVictim = k.victimName.toLowerCase().includes(s);
      const matchVictimSpecies = k.victimSpecies.toLowerCase().includes(s);
      const matchKiller = k.killerName ? k.killerName.toLowerCase().includes(s) : false;
      const matchKillerSpecies = k.killerSpecies ? k.killerSpecies.toLowerCase().includes(s) : false;
      const matchId = k.id.toLowerCase().includes(s);
      return matchVictim || matchVictimSpecies || matchKiller || matchKillerSpecies || matchId;
    }

    return true;
  });

  const totalSuspicious = kills.filter((k) => k.flaggedSuspicious).length;

  return (
    <div className="space-y-5">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Swords className="w-6 h-6 text-red-500" />
            PvP Combat Intelligence (Nhật Ký Chiến Đấu & Killfeed)
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Theo dõi lượng máu bị trừ (-HP), tọa độ tử vong, sát thương và thuật toán phát hiện vi phạm
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setReviveTarget(null);
              setShowReviveModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white transition shadow-lg shadow-emerald-600/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            Hồi Sinh Khủng Long
          </button>

          <button
            onClick={() => {
              refetch();
              addToast('info', 'Làm mới dữ liệu', 'Đã cập nhật Killfeed mới nhất!');
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
            Làm mới Killfeed
          </button>
        </div>
      </div>

      {/* Combat Filter Tabs Bar */}
      <div className="p-2.5 rounded-2xl glass-panel border border-zinc-800/80 shadow-md">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {COMBAT_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? 'border-red-500 bg-red-950/40 text-red-400 shadow-sm shadow-red-500/30'
                    : 'border-zinc-800/80 bg-zinc-950/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {tab.label}
                {tab.id === 'suspicious' && totalSuspicious > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 font-mono">
                    {totalSuspicious}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Flagging Alert Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold text-amber-300">
            Hệ thống phát hiện vi phạm tự động (Rule Violation Engine):
          </p>
          <p className="text-zinc-300 mt-0.5 leading-relaxed">
            Hệ thống tự động phát hiện các pha Revenge kill &lt; 5 phút, cắn trộm cùng bầy Apex hoặc sát thương đột biến bất thường để hỗ trợ Admin xử lý khiếu nại.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-zinc-800 flex items-center gap-2.5 bg-zinc-950/70">
        <Search className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo Killer, Nạn nhân, loài Khủng long, Kill ID..."
          className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
        />
      </div>

      {/* Combat Table */}
      <div className="rounded-2xl glass-panel border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-zinc-950/80 text-zinc-400 font-mono uppercase text-[11px] border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4">Kẻ hạ gục (Killer)</th>
                <th className="py-3.5 px-4">Nạn nhân (Victim)</th>
                <th className="py-3.5 px-4 text-center">Máu Bị Trừ (HP Lost)</th>
                <th className="py-3.5 px-4">Nguyên nhân / Hit</th>
                <th className="py-3.5 px-4 text-center">Đánh giá</th>
                <th className="py-3.5 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Đang tải nhật ký chiến đấu...
                  </td>
                </tr>
              ) : filteredKills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    Không có pha giao tranh nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredKills.map((kill) => {
                  const hpLost = getHealthDeducted(kill.victimSpecies, kill.victimGrowth, kill.damageDealt);
                  const victimImg = getDinoSpeciesImage(kill.victimSpecies);
                  const killerImg = kill.killerSpecies ? getDinoSpeciesImage(kill.killerSpecies) : null;

                  return (
                    <tr
                      key={kill.id}
                      className="hover:bg-zinc-900/50 transition cursor-pointer"
                      onClick={() => setSelectedKill(kill)}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap">
                        {formatTimeAgo(kill.emittedAt)}
                      </td>

                      {/* Killer */}
                      <td className="py-3.5 px-4">
                        {kill.killerName ? (
                          <div className="flex items-center gap-2.5">
                            {killerImg && (
                              <img
                                src={killerImg}
                                alt={kill.killerSpecies || 'Killer'}
                                className="w-8 h-8 rounded-lg object-cover bg-zinc-900 border border-zinc-800 flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div>
                              <p className="font-bold text-amber-400">{kill.killerName}</p>
                              <p className="text-[10px] text-zinc-500 font-mono">
                                {kill.killerSpecies} ({kill.killerSteamId?.slice(0, 8)}...)
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic">Môi trường tự nhiên</span>
                        )}
                      </td>

                      {/* Victim */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {victimImg && (
                            <img
                              src={victimImg}
                              alt={kill.victimSpecies}
                              className="w-8 h-8 rounded-lg object-cover bg-zinc-900 border border-zinc-800 flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <p className="font-bold text-white">{kill.victimName}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">
                              {kill.victimSpecies} • {(kill.victimGrowth * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* MÁU BỊ TRỪ (HP LOST) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/70 border border-red-500/50 text-red-400 font-mono font-black text-xs shadow-sm">
                          <HeartCrack className="w-3.5 h-3.5 text-red-400 animate-pulse flex-shrink-0" />
                          <span>-{formatNumber(hpLost)} HP</span>
                          {kill.damageDealt ? (
                            <span className="text-[10px] text-zinc-400 font-medium font-sans">
                              ({kill.damageDealt} DMG)
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Cause & Hit info */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {kill.cause.toUpperCase()}
                        </span>
                        {kill.hitLocation && (
                          <span className="ml-2 text-zinc-400 text-[11px]">
                            ({kill.hitLocation})
                          </span>
                        )}
                      </td>

                      {/* System Flag */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {kill.flaggedSuspicious ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold font-mono">
                            <AlertTriangle className="w-3 h-3" /> CỜ NGHI VẤN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                            <CheckCircle className="w-3 h-3" /> Hợp lệ
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviveTarget({
                                dinoId: (kill as any).victimDinoId || `dino_${kill.victimSteamId.slice(-6)}_${kill.id}`,
                                steamId: kill.victimSteamId,
                                name: kill.victimName,
                                species: kill.victimSpecies,
                                growth: kill.victimGrowth,
                                coordinates: kill.coordinates,
                                reason: `Hồi sinh nạn nhân ${kill.victimName} (${kill.victimSpecies} ${(kill.victimGrowth * 100).toFixed(0)}%) sau giao tranh #${kill.id}`,
                              });
                              setShowReviveModal(true);
                            }}
                            title="Hồi sinh khủng long nạn nhân"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Khôi Phục / Cất Gara</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedKill(kill);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kill Detail Modal */}
      {selectedKill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-red-500/30 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Skull className="w-5 h-5 text-red-400" />
              Chi Tiết Pha Giao Tranh (Combat Event #{selectedKill.id})
            </h3>

            {/* Health Deducted Box */}
            <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-mono text-red-300 font-bold">
                  Lượng Máu Bị Trừ Của Nạn Nhân
                </p>
                <p className="text-2xl font-black text-red-400 font-mono mt-0.5">
                  -{formatNumber(getHealthDeducted(selectedKill.victimSpecies, selectedKill.victimGrowth, selectedKill.damageDealt))} HP
                </p>
              </div>
              <div className="text-right">
                {selectedKill.damageDealt && (
                  <p className="text-xs font-mono text-zinc-300">
                    Sát thương kết liễu: <span className="font-bold text-red-400">{selectedKill.damageDealt} DMG</span>
                  </p>
                )}
                <p className="text-xs font-mono text-zinc-400">
                  Vị trí trúng: <span className="text-zinc-200">{selectedKill.hitLocation || 'Body'}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Thời điểm xảy ra:</span>
                <span className="font-mono text-zinc-200">
                  {new Date(selectedKill.emittedAt).toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Kẻ ra đòn (Killer):</span>
                <div className="flex items-center gap-2">
                  {selectedKill.killerSpecies && (
                    <img
                      src={getDinoSpeciesImage(selectedKill.killerSpecies)}
                      alt={selectedKill.killerSpecies}
                      className="w-5 h-5 rounded object-cover"
                    />
                  )}
                  <span className="font-bold text-amber-400">
                    {selectedKill.killerName || 'Môi trường'} ({selectedKill.killerSpecies || 'N/A'})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Nạn nhân (Victim):</span>
                <div className="flex items-center gap-2">
                  <img
                    src={getDinoSpeciesImage(selectedKill.victimSpecies)}
                    alt={selectedKill.victimSpecies}
                    className="w-5 h-5 rounded object-cover"
                  />
                  <span className="font-bold text-white">
                    {selectedKill.victimName} ({selectedKill.victimSpecies} • {(selectedKill.victimGrowth * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              {selectedKill.coordinates && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Tọa độ tử vong:</span>
                  <span className="font-mono text-cyan-400">
                    X: {selectedKill.coordinates.x} | Y: {selectedKill.coordinates.y} | Z: {selectedKill.coordinates.z}
                  </span>
                </div>
              )}
            </div>

            {selectedKill.violationReason && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Lý do bị hệ thống gắn cờ vi phạm:
                </p>
                <p className="mt-1 text-zinc-300">{selectedKill.violationReason}</p>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setReviveTarget({
                    dinoId: (selectedKill as any).victimDinoId || `dino_${selectedKill.victimSteamId.slice(-6)}_${selectedKill.id}`,
                    steamId: selectedKill.victimSteamId,
                    name: selectedKill.victimName,
                    species: selectedKill.victimSpecies,
                    growth: selectedKill.victimGrowth,
                    coordinates: selectedKill.coordinates,
                    reason: `Rollback 5s trước khi chết: Hồi sinh nạn nhân ${selectedKill.victimName} (${selectedKill.victimSpecies}) sau pha giao tranh #${selectedKill.id}`,
                  });
                  setSelectedKill(null);
                  setShowReviveModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>⚡ Khôi Phục Dino (Cất Gara / Rollback Map)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedKill(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-white"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revive Dino Modal */}
      <ReviveDinoModal
        isOpen={showReviveModal}
        onClose={() => setShowReviveModal(false)}
        target={reviveTarget}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
