'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import {
  Database,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Dna,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { DinoSlot, IslePilotPlayer } from '@/types/islepilot';
import { getDinoSpeciesImage, KNOWN_SPECIES_LIST } from '@/lib/utils';
import { useApp } from '@/components/providers/AppProviders';
import { SafetyConfirmModal } from '@/components/modals/SafetyConfirmModal';
import { ALL_THE_ISLE_MUTATIONS } from '@/components/players/MutationGrantModal';
import { HexagonSlot } from '@/components/common/HexagonSlot';

export default function GaragePage() {
  const { currentSession, addToast } = useApp();

  // Fetch real players list to populate selector
  const { data: playersData } = useQuery<{ players: IslePilotPlayer[] }>({
    queryKey: ['players', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/islepilot/players');
      if (!res.ok) return { players: [] };
      return res.json();
    },
  });

  const playersList = playersData?.players || [];
  const [targetSteamId, setTargetSteamId] = useState(''); // '' means All Players
  const [searchTerm, setSearchTerm] = useState('');

  // Expanded editor state (Matching IslePilot Screenshot: stats or mutations)
  const [expandedPanel, setExpandedPanel] = useState<{
    slotId: string;
    type: 'stats' | 'mutations';
  } | null>(null);

  const [editingSlotData, setEditingSlotData] = useState<{
    active: (string | null)[];
    parent: (string | null)[];
    elderA: (string | null)[];
    elderB: (string | null)[];
    elder: 'No elder' | 'Frail' | 'Prime';
  } | null>(null);

  // Floating Dropdown state
  const [editingTarget, setEditingTarget] = useState<{
    slotId: string;
    group: 'active' | 'parent' | 'elderA' | 'elderB';
    index: number;
  } | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setEditingTarget(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // New Dino Injection State
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [injectSpecies, setInjectSpecies] = useState('Tyrannosaurus');
  const [injectGender, setInjectGender] = useState<'male' | 'female'>('male');
  const [injectGrowth, setInjectGrowth] = useState<number>(1.0);
  const [injectHealth, setInjectHealth] = useState<number>(5000);
  const [injectHunger, setInjectHunger] = useState<number>(600);
  const [injectThirst, setInjectThirst] = useState<number>(1000);

  // Wipe confirmation
  const [showWipeModal, setShowWipeModal] = useState(false);

  // Query ALL parked dinos on the server from IslePilot with optional player/search filter
  const { data, isLoading, refetch, isFetching } = useQuery<{ garage: DinoSlot[]; total: number }>({
    queryKey: ['garage', 'all', targetSteamId, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (targetSteamId) params.append('steamId', targetSteamId);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/islepilot/garage${queryStr}`);
      if (!res.ok) throw new Error('Failed to load garage slots');
      return res.json();
    },
  });

  const slots = data?.garage || [];
  const totalParked = data?.total ?? slots.length;

  const handleSelectMutation = (val: string | null) => {
    if (!editingTarget || !editingSlotData) return;
    const { group, index } = editingTarget;
    const nextGroup = [...editingSlotData[group]];
    nextGroup[index] = val;
    setEditingSlotData({
      ...editingSlotData,
      [group]: nextGroup,
    });
    setEditingTarget(null);
    setDropdownSearch('');
  };

  const handleSaveMutations = async (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || !editingSlotData) return;
    const steamId = slot.steamId || targetSteamId;

    const activeClean = editingSlotData.active.map((m) => m || 'None');
    const parentClean = editingSlotData.parent.map((m) => m || 'None');
    const elderAClean = editingSlotData.elderA.map((m) => m || 'None');
    const elderBClean = editingSlotData.elderB.map((m) => m || 'None');

    const totalValidCount = [
      ...editingSlotData.active,
      ...editingSlotData.parent,
      ...editingSlotData.elderA,
      ...editingSlotData.elderB,
    ].filter((m) => m && m !== 'None' && m !== '-').length;

    try {
      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mutations',
          steamId,
          playerName: slot.playerName,
          reason: `Lưu cấu trúc 16 đột biến gen cho khủng long ${slot.species} (UID: ${slotId}): ${totalValidCount}/16 kích hoạt (Elder: ${editingSlotData.elder})`,
          actorRole: currentSession.role,
          actorName: currentSession.username,
          params: {
            slotId,
            dinoId: slotId,
            species: slot.species,
            mutations: activeClean,
            elder: editingSlotData.elder,
            lineage: {
              parent: parentClean,
              elderA: elderAClean,
              elderB: elderBClean,
            },
          },
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success !== false) {
        addToast('success', 'Lưu mutations thành công!', `Đã áp dụng cho Dino ID: ${slotId}`);
        setExpandedPanel(null);
        setEditingSlotData(null);
        refetch();
      } else {
        const errorMsg = resData.error || resData.message || 'Lỗi từ máy chủ';
        addToast('error', 'Lưu thất bại', errorMsg);
        window.alert(`[LỖI LƯU ĐỘT BIẾN]\nKhông thể lưu đột biến: ${errorMsg}`);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Lỗi kết nối máy chủ';
      addToast('error', 'Lỗi kết nối máy chủ', errorMsg);
      window.alert(`[LỖI KẾT NỐI MÁY CHỦ]\n${errorMsg}`);
    }
  };

  const handleSaveStats = async (
    slotId: string,
    growthPct: number
  ) => {
    const slot = slots.find((s) => s.id === slotId);
    const steamId = slot?.steamId || targetSteamId;

    try {
      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setgrowth',
          steamId,
          playerName: slot?.playerName,
          reason: `Lưu % tăng trưởng Gara slot ${slotId}: Growth ${growthPct}%`,
          actorRole: currentSession.role,
          actorName: currentSession.username,
          params: {
            slotId,
            dinoId: slotId,
            growth: growthPct / 100,
          },
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success !== false) {
        addToast('success', 'Lưu tăng trưởng thành công!', 'Applies the next time this dino is restored in-game.');
        setExpandedPanel(null);
        refetch();
      } else {
        const errorMsg = resData.error || resData.message || 'Lỗi lưu thông số';
        addToast('error', 'Lưu thông số thất bại', errorMsg);
        window.alert(`[LỖI LƯU THÔNG SỐ]\nKhông thể cập nhật tăng trưởng: ${errorMsg}`);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Lỗi kết nối máy chủ';
      addToast('error', 'Lỗi kết nối máy chủ', errorMsg);
      window.alert(`[LỖI KẾT NỐI MÁY CHỦ]\n${errorMsg}`);
    }
  };

  const handleInjectDino = async () => {
    try {
      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'inject_dino',
          steamId: targetSteamId,
          reason: `Bơm slot dino: ${injectSpecies} (${(injectGrowth * 100).toFixed(0)}%)`,
          actorRole: currentSession.role,
          actorName: currentSession.username,
          params: {
            species: injectSpecies,
            gender: injectGender,
            growth: injectGrowth,
            health: injectHealth,
            hunger: injectHunger,
            thirst: injectThirst,
          },
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        addToast('success', 'Bơm dino vào slot thành công!', resData.message);
        setShowInjectModal(false);
        refetch();
      } else {
        addToast('error', 'Lỗi khi bơm dino', resData.error);
      }
    } catch {
      addToast('error', 'Lỗi kết nối máy chủ');
    }
  };

  const handleDeploySlot = async (slot: DinoSlot) => {
    if (!slot.steamId) {
      addToast('error', 'Lỗi', 'Không tìm thấy SteamID của người chơi cho khủng long này');
      return;
    }
    const confirmDeploy = window.confirm(
      `Hồi sinh khủng long ${slot.species} (${Math.round(slot.growth * 100)}%) ra Map ngay cho người chơi ${slot.playerName || slot.steamId}?\n\n- UID: ${slot.id}\n- Khôi phục nguyên vẹn 16 gen và thông số.`
    );
    if (!confirmDeploy) return;

    try {
      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deploy_garage_dino',
          steamId: slot.steamId,
          playerName: slot.playerName,
          reason: `Hồi sinh trực tiếp khủng long ${slot.species} (UID: ${slot.id}) từ Gara ra Map`,
          actorRole: currentSession.role,
          actorName: currentSession.username,
          params: {
            dinoId: slot.id,
            slotId: slot.id,
            species: slot.species,
            growth: slot.growth,
            gender: slot.gender,
            mutations: slot.mutations,
            elder: slot.elder,
            lineage: slot.lineage,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        addToast('success', 'HỒI SINH RA MAP THÀNH CÔNG! ⚡', `Đã hồi sinh ${slot.species} (UID: ${slot.id}) cho ${slot.playerName || slot.steamId}`);
      } else {
        addToast('error', 'Hồi sinh thất bại', data.error || data.message || 'Lỗi máy chủ');
      }
    } catch (err: any) {
      addToast('error', 'Lỗi kết nối máy chủ', err.message);
    }
  };

  const handleWipeGarage = async () => {
    try {
      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wipe_garage',
          steamId: targetSteamId,
          reason: 'Wipe toàn bộ garage theo yêu cầu',
          actorRole: currentSession.role,
          actorName: currentSession.username,
        }),
      });
      const resData = await res.json();
      if (res.ok) {
        addToast('success', 'Đã wipe garage thành công', resData.message);
        refetch();
      } else {
        addToast('error', 'Thất bại khi wipe garage', resData.error);
      }
    } catch {
      addToast('error', 'Lỗi kết nối');
    }
  };

  const filteredMutations = ALL_THE_ISLE_MUTATIONS.filter((m) =>
    m.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Database className="w-6 h-6 text-emerald-400" />
            Hệ Thống Gara & Slot Khủng Long (Parked Dinos)
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Quản lý lưu trữ slot, phân nhánh đột biến gen (Mutations) theo chuẩn IslePilot và bơm dinosaur
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInjectModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30"
          >
            <Plus className="w-4 h-4" />
            Bơm Dino Vào Slot Mới
          </button>
          <button
            onClick={() => setShowWipeModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Wipe Toàn Bộ Gara
          </button>
        </div>
      </div>

      {/* Search & Server-Wide Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo loài, tên người chơi, SteamID64, đột biến..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">hoặc lọc người chơi:</span>
            <select
              value={targetSteamId}
              onChange={(e) => setTargetSteamId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white max-w-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Tất cả người chơi ({playersList.length}) --</option>
              {playersList.map((p) => (
                <option key={p.steamId} value={p.steamId}>
                  {p.name} ({p.species} • {p.online ? 'Online' : 'Offline'})
                </option>
              ))}
            </select>

            {(targetSteamId || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setTargetSteamId('');
                  setSearchTerm('');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs transition"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
          Làm mới Gara
        </button>
      </div>

      {/* Parked Dinos Table (Exact Match to IslePilot Garage Screenshot) */}
      <div className="rounded-2xl glass-panel border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="p-4 px-6 border-b border-zinc-800 bg-[#0d1322] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold text-white tracking-wide">Parked dinos</h3>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-xs font-bold border border-zinc-700">
              {totalParked}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-[#090d16] text-zinc-400 font-mono uppercase text-[11px] border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-6">Dino & ID Gara</th>
                <th className="py-3.5 px-6">Owner</th>
                <th className="py-3.5 px-6">Gender</th>
                <th className="py-3.5 px-6 min-w-[260px]">Tất Cả Đột Biến (Mutations)</th>
                <th className="py-3.5 px-6">Growth</th>
                <th className="py-3.5 px-6">Parked</th>
                <th className="py-3.5 px-6 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Đang tải dữ liệu Gara từ IslePilot...
                  </td>
                </tr>
              ) : slots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-400">
                    <Database className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                    <p className="text-sm font-semibold text-zinc-300">Không tìm thấy khủng long nào trong Gara</p>
                    <p className="text-xs text-zinc-500 mt-1 font-mono">
                      {searchTerm || targetSteamId
                        ? 'Không có kết quả phù hợp với bộ lọc hiện tại. Thử chọn "Tất cả người chơi" hoặc xóa từ khóa tìm kiếm.'
                        : 'Máy chủ hiện chưa có dữ liệu slot khủng long lưu trữ.'}
                    </p>
                  </td>
                </tr>
              ) : (
                slots.map((slot) => {
                  const isCurrentExpanded = expandedPanel?.slotId === slot.id;
                  const currentExpandedType = isCurrentExpanded ? expandedPanel.type : null;
                  return (
                    <ParkedDinoRow
                      key={slot.id}
                      slot={slot}
                      expandedType={currentExpandedType}
                      onToggleStats={() =>
                        setExpandedPanel((prev) =>
                          prev?.slotId === slot.id && prev.type === 'stats'
                            ? null
                            : { slotId: slot.id, type: 'stats' }
                        )
                      }
                      onToggleMutations={() => {
                        if (expandedPanel?.slotId === slot.id && expandedPanel.type === 'mutations') {
                          setExpandedPanel(null);
                          setEditingSlotData(null);
                        } else {
                          setExpandedPanel({ slotId: slot.id, type: 'mutations' });
                          setEditingSlotData({
                            active: [0, 1, 2, 3].map((i) => slot.mutations?.[i] || null),
                            parent: [0, 1, 2, 3].map((i) => slot.lineage?.parent?.[i] || null),
                            elderA: [0, 1, 2, 3].map((i) => slot.lineage?.elderA?.[i] || null),
                            elderB: [0, 1, 2, 3].map((i) => slot.lineage?.elderB?.[i] || null),
                            elder: slot.elder || (slot.isPrimeElder ? 'Prime' : 'No elder'),
                          });
                        }
                      }}
                      onClose={() => {
                        setExpandedPanel(null);
                        setEditingSlotData(null);
                      }}
                      onSaveStats={(growthPct) => handleSaveStats(slot.id, growthPct)}
                      elderStatus={
                        (isCurrentExpanded && editingSlotData?.elder) ||
                        slot.elder ||
                        (slot.isPrimeElder ? 'Prime' : 'No elder')
                      }
                      onElderChange={(elder) =>
                        setEditingSlotData((prev) => (prev ? { ...prev, elder } : null))
                      }
                      activeMutations={
                        (isCurrentExpanded && editingSlotData?.active) ||
                        [0, 1, 2, 3].map((i) => slot.mutations?.[i] || null)
                      }
                      parentMutations={
                        (isCurrentExpanded && editingSlotData?.parent) ||
                        [0, 1, 2, 3].map((i) => slot.lineage?.parent?.[i] || null)
                      }
                      elderAMutations={
                        (isCurrentExpanded && editingSlotData?.elderA) ||
                        [0, 1, 2, 3].map((i) => slot.lineage?.elderA?.[i] || null)
                      }
                      elderBMutations={
                        (isCurrentExpanded && editingSlotData?.elderB) ||
                        [0, 1, 2, 3].map((i) => slot.lineage?.elderB?.[i] || null)
                      }
                      onSlotClick={(group, index) =>
                        setEditingTarget({ slotId: slot.id, group, index })
                      }
                      onSaveMutations={() => handleSaveMutations(slot.id)}
                      onDeploy={handleDeploySlot}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Dropdown Selector (Matching Screenshot 2) */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            ref={dropdownRef}
            className="w-72 rounded-xl bg-[#0f172a] border border-cyan-500/40 shadow-2xl overflow-hidden animate-in zoom-in-95"
          >
            <div className="p-2.5 border-b border-zinc-800 bg-[#090d16]">
              <p className="text-[11px] font-bold text-cyan-400 uppercase font-mono mb-1.5">
                Chọn Đột Biến: Slot {editingTarget.index + 1} ({editingTarget.group})
              </p>
              <div className="flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-700">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  autoFocus
                  value={dropdownSearch}
                  onChange={(e) => setDropdownSearch(e.target.value)}
                  placeholder="Tìm kiếm đột biến..."
                  className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800/40 text-xs">
              <button
                type="button"
                onClick={() => handleSelectMutation(null)}
                className="w-full text-left px-3.5 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition font-mono"
              >
                — Xóa / Để trống (None)
              </button>

              {filteredMutations.map((mut) => (
                <button
                  key={mut}
                  type="button"
                  onClick={() => handleSelectMutation(mut)}
                  className="w-full text-left px-3.5 py-2 hover:bg-cyan-500/10 hover:text-cyan-300 text-zinc-300 transition flex items-center justify-between group"
                >
                  <span>{mut}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyan-400 -rotate-90" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dino Injection Modal */}
      {showInjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl glass-panel border border-emerald-500/40 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Bơm Khủng Long Mới Vào Slot (Dino Injection)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Khủng long sẽ được tạo mới và gán trực tiếp vào gara của SteamID:{' '}
              <span className="text-emerald-400 font-mono font-bold">{targetSteamId}</span>
            </p>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Loài khủng long</label>
                  <select
                    value={injectSpecies}
                    onChange={(e) => setInjectSpecies(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
                  >
                    {KNOWN_SPECIES_LIST.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Giới tính</label>
                  <select
                    value={injectGender}
                    onChange={(e) => setInjectGender(e.target.value as any)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white"
                  >
                    <option value="male">Đực (Male ♂)</option>
                    <option value="female">Cái (Female ♀)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300">Tiến độ trưởng thành (Growth)</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {(injectGrowth * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={injectGrowth}
                  onChange={(e) => setInjectGrowth(Number(e.target.value))}
                  className="w-full mt-2 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-zinc-400">Máu (HP)</label>
                  <input
                    type="number"
                    value={injectHealth}
                    onChange={(e) => setInjectHealth(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Đói (Hunger)</label>
                  <input
                    type="number"
                    value={injectHunger}
                    onChange={(e) => setInjectHunger(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Khát (Thirst)</label>
                  <input
                    type="number"
                    value={injectThirst}
                    onChange={(e) => setInjectThirst(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setShowInjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleInjectDino}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/20"
                >
                  Xác nhận Bơm Dino
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wipe Confirmation Modal */}
      <SafetyConfirmModal
        isOpen={showWipeModal}
        onClose={() => setShowWipeModal(false)}
        onConfirm={handleWipeGarage}
        title={`Xác nhận WIPE TOÀN BỘ GARA`}
        description={`Hành động này sẽ XÓA VĨNH VIỄN tất cả các slot khủng long đang lưu trữ của SteamID: ${targetSteamId}. Không thể hoàn tác!`}
        requireMatchString={targetSteamId}
        confirmButtonText="WIPE GARA"
        isDestructive={true}
      />
    </div>
  );
}

// Single Parked Dino Row with Inline IslePilot Accordion Editor
function ParkedDinoRow({
  slot,
  expandedType,
  onToggleStats,
  onToggleMutations,
  onClose,
  onSaveStats,
  elderStatus,
  onElderChange,
  activeMutations,
  parentMutations,
  elderAMutations,
  elderBMutations,
  onSlotClick,
  onSaveMutations,
  onDeploy,
}: {
  slot: DinoSlot;
  expandedType: 'stats' | 'mutations' | null;
  onToggleStats: () => void;
  onToggleMutations: () => void;
  onClose: () => void;
  onSaveStats: (growthPct: number) => Promise<void> | void;
  elderStatus: 'No elder' | 'Frail' | 'Prime';
  onElderChange: (s: 'No elder' | 'Frail' | 'Prime') => void;
  activeMutations: (string | null)[];
  parentMutations: (string | null)[];
  elderAMutations: (string | null)[];
  elderBMutations: (string | null)[];
  onSlotClick: (group: 'active' | 'parent' | 'elderA' | 'elderB', index: number) => void;
  onSaveMutations: () => void;
  onDeploy?: (slot: DinoSlot) => void;
}) {
  const dinoImg = getDinoSpeciesImage(slot.species);

  const allSlotMuts = [
    ...(slot.mutations || []),
    ...(slot.lineage?.parent || []),
    ...(slot.lineage?.elderA || []),
    ...(slot.lineage?.elderB || []),
  ].filter((m) => m && m !== 'None' && m !== '-');

  // Local state for inline stats editor: Growth % only (per user requirement)
  const [growth, setGrowth] = useState<number>(Math.round(slot.growth * 100));
  const [isSavingStats, setIsSavingStats] = useState(false);

  useEffect(() => {
    setGrowth(Math.round(slot.growth * 100));
  }, [slot]);

  return (
    <React.Fragment>
      <tr className="hover:bg-zinc-900/40 transition">
        {/* Dino & ID */}
        <td className="py-4 px-6 font-bold text-white">
          <div className="flex items-center gap-3">
            <Image
              src={dinoImg}
              alt={slot.species}
              width={32}
              height={32}
              className="object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{slot.species}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                  Slot #{slot.slotNumber || 1}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-cyan-400">
                <span className="text-zinc-500 text-[10px]">ID:</span>
                <span
                  className="bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60 select-all font-mono font-medium hover:border-cyan-500 transition cursor-copy"
                  title="Dino ID trong Gara (Click để copy)"
                >
                  {slot.id}
                </span>
              </div>
            </div>
          </div>
        </td>

        {/* Owner */}
        <td className="py-4 px-6">
          <div className="font-semibold text-zinc-200">{slot.playerName || 'Survivor'}</div>
          <div className="font-mono text-[11px] text-zinc-500">{slot.steamId}</div>
        </td>

        {/* Gender */}
        <td className="py-4 px-6 text-zinc-300">
          {slot.gender === 'male' ? 'Male' : 'Female'}
        </td>

        {/* All Mutations Column */}
        <td className="py-4 px-6">
          {allSlotMuts.length > 0 ? (
            <div className="space-y-1.5 max-w-[280px]">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 font-bold">
                  {allSlotMuts.length} / 16 Gen
                </span>
                {slot.reincarnationCount && slot.reincarnationCount > 0 ? (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-bold"
                    title="Số lần trùng sinh (cùng 1 UID khủng long)"
                  >
                    Trùng sinh x{slot.reincarnationCount}
                  </span>
                ) : null}
                {slot.isPrimeElder && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    Prime
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {allSlotMuts.map((mut, idx) => (
                  <span
                    key={`${mut}-${idx}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-medium"
                    title={`Đột biến gen #${idx + 1}: ${mut}`}
                  >
                    <Dna className="w-2.5 h-2.5 text-purple-400 flex-shrink-0" />
                    <span>{mut}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <span className="text-zinc-500 text-xs italic font-mono">— Chưa có đột biến</span>
          )}
        </td>

        {/* Growth */}
        <td className="py-4 px-6 font-bold text-emerald-400 font-mono">
          {(slot.growth * 100).toFixed(0)}%
        </td>

        {/* Parked Date */}
        <td className="py-4 px-6 font-mono text-zinc-400">
          {slot.parkedAt ? new Date(slot.parkedAt).toLocaleDateString('vi-VN') : '—'}
        </td>

        {/* Action Links (Matching IslePilot Screenshot 1: Mutations & Edit/Close) */}
        <td className="py-4 px-6 text-right space-x-2.5 whitespace-nowrap">
          {onDeploy && (
            <button
              type="button"
              onClick={() => onDeploy(slot)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition inline-flex items-center gap-1 shadow-sm"
              title={`Hồi sinh trực tiếp khủng long ${slot.species} (UID: ${slot.id}) ra Map cho người chơi`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hồi Sinh Ra Map</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleMutations}
            className={`text-xs font-semibold transition inline-flex items-center gap-1.5 ${
              expandedType === 'mutations'
                ? 'text-cyan-400 font-bold'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <span>Mutations</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-mono">
              {allSlotMuts.length}/16
            </span>
          </button>
          <button
            type="button"
            onClick={onToggleStats}
            className="text-xs font-semibold text-zinc-300 hover:text-white transition"
          >
            {expandedType === 'stats' ? 'Close' : 'Edit'}
          </button>
        </td>
      </tr>

      {/* Expanded Stats Editor Accordion (Matching IslePilot Screenshot: Growth % only) */}
      {expandedType === 'stats' && (
        <tr>
          <td colSpan={7} className="p-0 bg-[#070b14] border-y border-zinc-800/80">
            <div className="p-6 space-y-4 animate-in fade-in">
              <div className="max-w-md">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Growth % (Tăng trưởng)</span>
                  <span className="text-emerald-400 font-mono font-bold text-xs">{growth}%</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={growth}
                    onChange={(e) => setGrowth(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-32 px-3 py-2 rounded-lg bg-[#0e1424] border border-zinc-700/80 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-1.5">
                    {[25, 50, 75, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setGrowth(preset)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                          growth === preset
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSavingStats}
                  onClick={async () => {
                    setIsSavingStats(true);
                    await onSaveStats(growth);
                    setIsSavingStats(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold transition flex items-center gap-2 shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  {isSavingStats ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>

              {/* Helper note */}
              <p className="text-[11px] text-zinc-400 font-sans">
                Applies the next time this dino is restored in-game.
              </p>
            </div>
          </td>
        </tr>
      )}

      {/* Expanded Mutations Accordion (Matching IslePilot Screenshot 2) */}
      {expandedType === 'mutations' && (
        <tr>
          <td colSpan={7} className="p-0 bg-[#070b14] border-y border-zinc-800/80">
            <div className="p-6 space-y-6 animate-in fade-in">
              {/* Dino ID Banner & Quick Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0b1020] border border-cyan-500/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Dna className="w-4 h-4 text-cyan-400" />
                    Cấu Trúc Đột Biến Gen Khủng Long
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-zinc-500 text-[11px]">Dino ID:</span>
                    <span className="bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80 text-cyan-300 font-bold select-all">
                      {slot.id}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-400">
                    Đã kích hoạt:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono text-xs font-bold">
                    {(slot.mutations || []).filter((m) => m && m !== 'None' && m !== '-').length} / 16 Gen
                  </span>
                </div>
              </div>

              {/* Elder Selection Row */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400 mr-2">Elder</span>
                {(['No elder', 'Frail', 'Prime'] as const).map((status) => {
                  const isSelected = elderStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onElderChange(status)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                          : 'bg-[#131b2e] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>

              {/* Hexagonal Mutations Hierarchy Area */}
              <div className="rounded-2xl bg-[#0b1020]/90 border border-zinc-800/90 p-6 space-y-8 relative">
                {/* Active mutations */}
                <div>
                  <p className="text-xs font-semibold text-zinc-400 mb-4">Active mutations</p>
                  <div className="flex items-center justify-center gap-4">
                    {activeMutations.map((mut, idx) => (
                      <HexagonSlot
                        key={`active-${idx}`}
                        slotNumber={idx + 1}
                        value={mut}
                        onClick={() => onSlotClick('active', idx)}
                        isActiveGroup={true}
                      />
                    ))}
                  </div>
                </div>

                {/* Lineage Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-800/60">
                  {/* Parent */}
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 mb-3">Parent</p>
                    <div className="flex items-center justify-center gap-2.5">
                      {parentMutations.map((mut, idx) => (
                        <HexagonSlot
                          key={`parent-${idx}`}
                          slotNumber={idx + 1}
                          value={mut}
                          onClick={() => onSlotClick('parent', idx)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Elder A */}
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 mb-3">Elder A</p>
                    <div className="flex items-center justify-center gap-2.5">
                      {elderAMutations.map((mut, idx) => (
                        <HexagonSlot
                          key={`elderA-${idx}`}
                          slotNumber={idx + 1}
                          value={mut}
                          onClick={() => onSlotClick('elderA', idx)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Elder B */}
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 mb-3">Elder B</p>
                    <div className="flex items-center justify-center gap-2.5">
                      {elderBMutations.map((mut, idx) => (
                        <HexagonSlot
                          key={`elderB-${idx}`}
                          slotNumber={idx + 1}
                          value={mut}
                          onClick={() => onSlotClick('elderB', idx)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onSaveMutations}
                    className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition shadow-md shadow-blue-500/20"
                  >
                    Save mutations
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-[11px] text-zinc-500 font-mono">
                  Applies the next time this dino is restored in-game.
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

