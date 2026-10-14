'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  Heart,
  Droplets,
  Beef,
  Activity,
  AlertTriangle,
  Skull,
  Sparkles,
  Navigation,
  UserX,
  Ban,
  FileText,
  Clock,
  ShieldAlert,
  Crown,
  Share2,
  Dna,
  Edit3,
  Check,
  ChevronDown,
  Save,
  Search,
  Warehouse,
  Copy,
  CheckCircle2,
  ListFilter,
} from 'lucide-react';
import { IslePilotPlayer, DinoSlot } from '@/types/islepilot';
import { getDinoSpeciesImage, formatPlaytime, formatTimeAgo } from '@/lib/utils';
import { useApp } from '@/components/providers/AppProviders';
import { SafetyConfirmModal } from '@/components/modals/SafetyConfirmModal';
import { TeleportModal } from '@/components/players/TeleportModal';
import { MutationGrantModal, ALL_THE_ISLE_MUTATIONS } from '@/components/players/MutationGrantModal';
import { ReviveDinoModal } from '@/components/modals/ReviveDinoModal';
import { HexagonSlot } from '@/components/common/HexagonSlot';

interface PlayerInspectorModalProps {
  player: IslePilotPlayer | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function PlayerInspectorModal({
  player,
  isOpen,
  onClose,
  onRefresh,
}: PlayerInspectorModalProps) {
  const { currentSession, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'dino' | 'mutations' | 'prime' | 'notes'>('dino');
  const [newNote, setNewNote] = useState('');
  const [strikeLevel, setStrikeLevel] = useState(0);

  // Modals state
  const [showSlayModal, setShowSlayModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showTeleportModal, setShowTeleportModal] = useState(false);
  const [showMutationModal, setShowMutationModal] = useState(false);
  const [showReviveModal, setShowReviveModal] = useState(false);

  // Stored Dinos (Garage / Trùng Sinh) State
  const [garageSlots, setGarageSlots] = useState<DinoSlot[]>([]);
  const [isLoadingGarage, setIsLoadingGarage] = useState(false);
  const [selectedTargetDinoId, setSelectedTargetDinoId] = useState<string>('current');
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  // IslePilot Hexagonal Mutations State
  const [elderStatus, setElderStatus] = useState<'No elder' | 'Frail' | 'Prime'>('No elder');
  const [activeMutations, setActiveMutations] = useState<(string | null)[]>([null, null, null, null]);
  const [parentMutations, setParentMutations] = useState<(string | null)[]>([null, null, null, null]);
  const [elderAMutations, setElderAMutations] = useState<(string | null)[]>([null, null, null, null]);
  const [elderBMutations, setElderBMutations] = useState<(string | null)[]>([null, null, null, null]);
  const [isSavingMutations, setIsSavingMutations] = useState(false);

  // Floating Popover Dropdown selector state
  const [editingSlotTarget, setEditingSlotTarget] = useState<{
    group: 'active' | 'parent' | 'elderA' | 'elderB';
    index: number;
  } | null>(null);
  const [slotDropdownSearch, setSlotDropdownSearch] = useState('');
  const slotDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (slotDropdownRef.current && !slotDropdownRef.current.contains(event.target as Node)) {
        setEditingSlotTarget(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Stats Editing State
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [editGrowth, setEditGrowth] = useState(100);
  const [editHealth, setEditHealth] = useState(1000);
  const [editHunger, setEditHunger] = useState(300);
  const [editThirst, setEditThirst] = useState(800);
  const [isSavingStats, setIsSavingStats] = useState(false);
  const [isReincarnating, setIsReincarnating] = useState(false);

  // Helper to load mutations into 16 slots editor
  const loadMutationsIntoEditor = (
    muts: string[],
    lineage?: any,
    elderVal?: string
  ) => {
    const curActive: (string | null)[] = [null, null, null, null];
    const pArr: (string | null)[] = [null, null, null, null];
    const eAArr: (string | null)[] = [null, null, null, null];
    const eBArr: (string | null)[] = [null, null, null, null];

    // Load active mutations (slots 1-4) respecting exact slot index
    if (Array.isArray(muts)) {
      muts.slice(0, 4).forEach((m, idx) => {
        if (m && m !== 'None' && m !== '-') {
          curActive[idx] = m;
        } else {
          curActive[idx] = null;
        }
      });
    }

    // Load lineage mutations (parent, elderA, elderB)
    if (lineage) {
      if (Array.isArray(lineage.parent)) {
        lineage.parent.forEach((m: string, idx: number) => {
          if (idx < 4 && m && m !== 'None' && m !== '-') pArr[idx] = m;
        });
      }
      if (Array.isArray(lineage.elderA)) {
        lineage.elderA.forEach((m: string, idx: number) => {
          if (idx < 4 && m && m !== 'None' && m !== '-') eAArr[idx] = m;
        });
      }
      if (Array.isArray(lineage.elderB)) {
        lineage.elderB.forEach((m: string, idx: number) => {
          if (idx < 4 && m && m !== 'None' && m !== '-') eBArr[idx] = m;
        });
      }
    }

    setActiveMutations(curActive);
    setParentMutations(pArr);
    setElderAMutations(eAArr);
    setElderBMutations(eBArr);
    setElderStatus(
      elderVal === 'Prime' || elderVal === 'Frail' ? (elderVal as any) : 'No elder'
    );
  };

  // Load player & fetch full garage slots
  useEffect(() => {
    if (player && isOpen) {
      setEditGrowth(Math.round((player.growth || 0) * 100));
      setEditHealth(Math.round(player.health || 1000));
      setEditHunger(Math.round(player.hunger || 300));
      setEditThirst(Math.round(player.thirst || 800));

      loadMutationsIntoEditor(
        player.mutations || [],
        (player as any).lineage,
        player.elder || (player.isPrimeElder ? 'Prime' : 'No elder')
      );

      // Fetch garage slots (trùng sinh) for this player
      setIsLoadingGarage(true);
      fetch(`/api/islepilot/players/${player.steamId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.garage && Array.isArray(data.garage)) {
            setGarageSlots(data.garage);
          }
          if (data?.player) {
            loadMutationsIntoEditor(
              data.player.mutations || [],
              data.player.lineage,
              data.player.elder || (data.player.isPrimeElder ? 'Prime' : 'No elder')
            );
          }
        })
        .catch((err) => {
          console.warn('Error loading player garage:', err);
        })
        .finally(() => {
          setIsLoadingGarage(false);
        });
    } else {
      setGarageSlots([]);
      setSelectedTargetDinoId('current');
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

  const dinoImage = getDinoSpeciesImage(player.species);

  // API Action Dispatcher
  const handleAction = async (action: string, reason?: string, params?: any) => {
    try {
      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          steamId: player.steamId,
          playerName: player.name,
          reason: reason || `Admin can thiệp: ${action}`,
          actorRole: currentSession.role,
          actorName: currentSession.username,
          params,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast('success', `Thực thi ${action.toUpperCase()} thành công!`, data.message);
        onRefresh?.();
      } else {
        addToast('error', `Thao tác thất bại: ${action}`, data.error || data.message);
      }
    } catch {
      addToast('error', 'Lỗi kết nối khi gửi yêu cầu đến server');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await handleAction('add_note', 'Thêm ghi chú nội bộ', {
      note: newNote,
      strikeLevel,
    });
    setNewNote('');
    onRefresh?.();
  };

  const handleSelectSlotMutation = (val: string | null) => {
    if (!editingSlotTarget) return;
    const { group, index } = editingSlotTarget;
    if (group === 'active') {
      setActiveMutations((prev) => {
        const next = [...prev];
        next[index] = val;
        return next;
      });
    } else if (group === 'parent') {
      setParentMutations((prev) => {
        const next = [...prev];
        next[index] = val;
        return next;
      });
    } else if (group === 'elderA') {
      setElderAMutations((prev) => {
        const next = [...prev];
        next[index] = val;
        return next;
      });
    } else if (group === 'elderB') {
      setElderBMutations((prev) => {
        const next = [...prev];
        next[index] = val;
        return next;
      });
    }
    setEditingSlotTarget(null);
    setSlotDropdownSearch('');
  };

  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopySuccessId(id);
    setTimeout(() => setCopySuccessId(null), 2000);
    addToast('info', 'Đã copy Dino ID vào bộ nhớ tạm', id);
  };

  const handleSaveMutationsHierarchy = async () => {
    if (!player) return;
    setIsSavingMutations(true);

    const activeClean = activeMutations.map((m) => m || 'None');
    const parentClean = parentMutations.map((m) => m || 'None');
    const elderAClean = elderAMutations.map((m) => m || 'None');
    const elderBClean = elderBMutations.map((m) => m || 'None');

    const totalValidCount = [
      ...activeMutations,
      ...parentMutations,
      ...elderAMutations,
      ...elderBMutations,
    ].filter((m) => m && m !== 'None' && m !== '-').length;

    const targetDinoId = selectedTargetDinoId !== 'current' ? selectedTargetDinoId : player.dinoId;
    const isGarageDino = Boolean(selectedTargetDinoId !== 'current');
    const targetSlot = garageSlots.find((s) => s.id === targetDinoId);
    const targetLabel = isGarageDino
      ? `Gara (${targetSlot?.species || 'Dino'} ID: ${targetDinoId})`
      : `Khủng long hiện tại (${player.species}${targetDinoId ? ` - UID: ${targetDinoId}` : ''})`;

    try {
      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mutations',
          steamId: player.steamId,
          playerName: player.name,
          reason: `Lưu cấu trúc 16 đột biến gen cho ${targetLabel}: ${totalValidCount}/16 kích hoạt (Elder: ${elderStatus})`,
          actorRole: currentSession.role,
          actorName: currentSession.username,
          params: {
            dinoId: targetDinoId,
            slotId: targetDinoId,
            species: targetSlot?.species || player.species,
            mutations: activeClean,
            elder: elderStatus,
            lineage: {
              parent: parentClean,
              elderA: elderAClean,
              elderB: elderBClean,
            },
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success !== false) {
        addToast(
          'success',
          'Save mutations successful!',
          `Đã lưu 16 đột biến cho ${targetLabel}. Áp dụng khi tải lại dino.`
        );
        if (targetDinoId) {
          setGarageSlots((prev) =>
            prev.map((s) =>
              s.id === targetDinoId
                ? {
                    ...s,
                    mutations: activeClean.filter((m) => m && m !== 'None' && m !== '-'),
                    lineage: {
                      parent: parentClean,
                      elderA: elderAClean,
                      elderB: elderBClean,
                    },
                    isPrimeElder: elderStatus === 'Prime',
                    elder: elderStatus as any,
                  }
                : s
            )
          );
        }
        onRefresh?.();
      } else {
        const errorMsg = data.error || data.message || 'Lỗi lưu đột biến';
        addToast('error', 'Lưu thất bại', errorMsg);
        window.alert(`[LỖI LƯU ĐỘT BIẾN]\n${errorMsg}`);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Lỗi kết nối khi gửi yêu cầu đến server';
      addToast('error', 'Lỗi kết nối khi gửi yêu cầu đến server', errorMsg);
      window.alert(`[LỖI KẾT NỐI MÁY CHỦ]\n${errorMsg}`);
    } finally {
      setIsSavingMutations(false);
    }
  };

  const handleReincarnateDino = async () => {
    if (!player) return;
    const targetDinoId = selectedTargetDinoId !== 'current' ? selectedTargetDinoId : player.dinoId;
    if (!targetDinoId) {
      window.alert('Chưa xác định được UID của con khủng long để trùng sinh.');
      return;
    }

    const confirmRebirth = window.confirm(
      `Xác nhận TRÙNG SINH cho con khủng long này (UID: ${targetDinoId})?\n\n` +
      `Lưu ý:\n` +
      `- Trùng sinh là CÙNG 1 CON KHỦNG LONG với CÙNG 1 UID này.\n` +
      `- Giữ nguyên và tích lũy tất cả các đột biến gen qua các đời.\n` +
      `- Tăng số lần trùng sinh của khủng long.`
    );
    if (!confirmRebirth) return;

    setIsReincarnating(true);
    try {
      const all16Mutations = [
        ...activeMutations.map((m) => m || 'None'),
        ...parentMutations.map((m) => m || 'None'),
        ...elderAMutations.map((m) => m || 'None'),
        ...elderBMutations.map((m) => m || 'None'),
      ];

      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reincarnate',
          steamId: player.steamId,
          playerName: player.name,
          reason: `Trùng sinh khủng long (UID: ${targetDinoId})`,
          actorRole: currentSession.role,
          actorName: currentSession.username,
          params: {
            dinoId: targetDinoId,
            slotId: targetDinoId,
            species: player.species,
            mutations: all16Mutations,
            elder: elderStatus,
            lineage: {
              parent: parentMutations,
              elderA: elderAMutations,
              elderB: elderBMutations,
            },
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success !== false) {
        addToast(
          'success',
          'Trùng sinh thành công!',
          `Đã ghi nhận trùng sinh cho khủng long UID: ${targetDinoId}. Cùng 1 con, tích lũy gen đầy đủ!`
        );
        onRefresh?.();
      } else {
        const errorMsg = data.error || data.message || 'Lỗi trùng sinh';
        addToast('error', 'Trùng sinh thất bại', errorMsg);
        window.alert(`[LỖI TRÙNG SINH]\n${errorMsg}`);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Lỗi kết nối';
      addToast('error', 'Lỗi kết nối', errorMsg);
      window.alert(`[LỖI KẾT NỐI]\n${errorMsg}`);
    } finally {
      setIsReincarnating(false);
    }
  };

  const handleSaveStatsDirect = async () => {
    setIsSavingStats(true);
    const targetDinoId = selectedTargetDinoId !== 'current' ? selectedTargetDinoId : undefined;
    const isGarageDino = Boolean(targetDinoId);
    const targetSlot = garageSlots.find((s) => s.id === targetDinoId);
    const targetLabel = isGarageDino
      ? `Gara (${targetSlot?.species || 'Dino'} ID: ${targetDinoId})`
      : `Khủng long hiện tại (${player.species})`;

    try {
      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setgrowth',
          steamId: player.steamId,
          playerName: player.name,
          reason: `Chỉnh tăng trưởng cho ${targetLabel}: Growth ${editGrowth}%`,
          actorRole: currentSession.role,
          actorName: currentSession.username,
          params: {
            dinoId: targetDinoId,
            slotId: targetDinoId,
            growth: editGrowth / 100,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        addToast(
          'success',
          'Chỉnh thông số thành công!',
          `Đã cập nhật Growth ${editGrowth}% cho ${targetLabel}`
        );
        if (isGarageDino && targetDinoId) {
          setGarageSlots((prev) =>
            prev.map((s) => (s.id === targetDinoId ? { ...s, growth: editGrowth / 100 } : s))
          );
        }
        setIsEditingStats(false);
        onRefresh?.();
      } else {
        const errorMsg = data.error || data.message || 'Lỗi chỉnh thông số';
        addToast('error', 'Lỗi chỉnh thông số', errorMsg);
        window.alert(`[LỖI CHỈNH THÔNG SỐ]\n${errorMsg}`);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Lỗi kết nối server';
      addToast('error', 'Lỗi kết nối server', errorMsg);
      window.alert(`[LỖI KẾT NỐI MÁY CHỦ]\n${errorMsg}`);
    } finally {
      setIsSavingStats(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl glass-panel border border-emerald-500/30 shadow-2xl overflow-hidden">
          {/* Header Banner */}
          <div className="relative p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-emerald-950/40">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 p-1 flex items-center justify-center overflow-hidden">
                  <Image
                    src={dinoImage}
                    alt={player.species}
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                  {player.online && (
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-900 rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-white tracking-wide">{player.name}</h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                        player.online
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {player.online ? 'Online' : 'Offline'}
                    </span>
                    {player.isPrimeElder && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                        <Crown className="w-3 h-3" /> PRIME ELDER
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 mt-1.5">
                    <span>
                      SteamID: <strong className="text-zinc-200">{player.steamId}</strong>
                    </span>
                    {player.discord && (
                      <span className="text-cyan-400">
                        Discord: {player.discord.username}
                      </span>
                    )}
                    <span>Chơi: {formatPlaytime(player.totalPlaySec)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-Click Action Bar */}
            <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-zinc-800/80">
              <button
                onClick={() => handleAction('heal', 'Admin phục hồi máu')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                Heal Máu
              </button>

              <button
                onClick={() => handleAction('feed', 'Admin phục hồi thức ăn (Hunger)')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Beef className="w-3.5 h-3.5 text-amber-400" />
                Hồi Đói (Feed)
              </button>

              <button
                onClick={() => handleAction('water', 'Admin phục hồi nước uống (Thirst)')}
                className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                Hồi Nước (Water)
              </button>

              <button
                onClick={() => setShowTeleportModal(true)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                Teleport
              </button>

              <button
                onClick={() => setShowReviveModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Hồi Sinh Khủng Long
              </button>

              <button
                onClick={() => setShowMutationModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Dna className="w-3.5 h-3.5 text-emerald-400" />
                Cộng Mutations
              </button>

              <button
                onClick={() => setIsEditingStats((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
                  isEditingStats
                    ? 'bg-blue-600 text-white border-blue-500 shadow-blue-600/30'
                    : 'bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/30 text-blue-300'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                {isEditingStats ? 'Đóng Thông Số' : 'Chỉnh Thông Số'}
              </button>

              <button
                onClick={() => handleAction('kick', 'Admin kick cảnh cáo')}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <UserX className="w-3.5 h-3.5 text-zinc-400" />
                Kick
              </button>

              <button
                onClick={() => setShowSlayModal(true)}
                className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Skull className="w-3.5 h-3.5 text-red-400" />
                Slay (Hạ gục)
              </button>

              <button
                onClick={() => setShowBanModal(true)}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition ml-auto shadow-lg shadow-red-600/20"
              >
                <Ban className="w-3.5 h-3.5" />
                Cấm (Ban)
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Sleek Pill Style, No Scrollbar Clipping) */}
          <div className="flex items-center gap-2 px-6 py-2.5 border-b border-zinc-800 bg-[#090e1a] text-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('dino')}
              className={`py-2 px-3.5 rounded-xl font-semibold transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'dino'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Chỉ Số Khủng Long
            </button>
            <button
              onClick={() => setActiveTab('mutations')}
              className={`py-2 px-3.5 rounded-xl font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'mutations'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Dna className="w-3.5 h-3.5 text-emerald-400" />
              Live Mutations (16 Gen)
            </button>
            <button
              onClick={() => setActiveTab('prime')}
              className={`py-2 px-3.5 rounded-xl font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'prime'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Nhiệm Vụ Trùng Sinh (Prime)
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-2 px-3.5 rounded-xl font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'notes'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Ghi Chú & Tiền Án (Strikes)
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            {activeTab === 'dino' && (
              <div className="space-y-5">
                {/* Species & Growth Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <p className="text-xs text-zinc-400">Loài & Giới Tính</p>
                    <p className="text-base font-bold text-white mt-1">
                      {player.species} ({player.female ? 'Cái ♀' : 'Đực ♂'})
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-400">Tăng Trưởng (Growth)</p>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {((player.growth || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 mt-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (player.growth || 0) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <p className="text-xs text-zinc-400">Tọa Độ Bản Đồ (Gateway)</p>
                    <p className="text-xs font-mono font-semibold text-zinc-200 mt-1">
                      {player.position
                        ? `X: ${Math.round(player.position.x)} | Y: ${Math.round(player.position.y)} | Z: ${Math.round(player.position.z)}`
                        : 'Không rõ vị trí'}
                    </p>
                  </div>
                </div>

                {/* Vitals Progress Bars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Health */}
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                        <Heart className="w-3.5 h-3.5" /> Máu (Health)
                      </span>
                      <span className="font-mono text-zinc-300">
                        {Math.round(player.health)} / {Math.round(player.maxHealth)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 mt-2 overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (player.health / (player.maxHealth || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Hunger */}
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <Beef className="w-3.5 h-3.5" /> Đói (Hunger)
                      </span>
                      <span className="font-mono text-zinc-300">
                        {Math.round(player.hunger)} / {Math.round(player.maxHunger)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 mt-2 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (player.hunger / (player.maxHunger || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Thirst */}
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                        <Droplets className="w-3.5 h-3.5" /> Khát (Thirst)
                      </span>
                      <span className="font-mono text-zinc-300">
                        {Math.round(player.thirst)} / {Math.round(player.maxThirst)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 mt-2 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (player.thirst / (player.maxThirst || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Debuffs */}
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xs">
                      <Activity className="w-4 h-4 text-zinc-400" />
                      <span>Gãy xương (Broken Leg):</span>
                      <span
                        className={`font-bold ${player.brokenLeg ? 'text-red-400' : 'text-emerald-400'}`}
                      >
                        {player.brokenLeg ? 'CÓ (Bị gãy)' : 'KHÔNG'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Droplets className="w-4 h-4 text-zinc-400" />
                      <span>Chảy máu (Bleed):</span>
                      <span
                        className={`font-bold ${player.bleed ? 'text-red-400' : 'text-emerald-400'}`}
                      >
                        {player.bleed ? `${player.bleed} stacks` : '0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Mutations Overview Card */}
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                      <Dna className="w-4 h-4 text-purple-400" />
                      Đột Biến Gen Tích Lũy ({(player.mutations || []).filter((m) => m && m !== 'None' && m !== '-').length} / 16 Gen)
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('mutations')}
                      className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-medium border border-purple-500/30 flex items-center gap-1 transition"
                    >
                      <Edit3 className="w-3 h-3" />
                      Mở Trình Sửa 16 Đột Biến
                    </button>
                  </div>

                  {(player.mutations || []).filter((m) => m && m !== 'None' && m !== '-').length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(player.mutations || [])
                        .filter((m) => m && m !== 'None' && m !== '-')
                        .map((mut, idx) => (
                          <span
                            key={`dino-mut-${idx}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs font-medium"
                          >
                            <Dna className="w-3 h-3 text-purple-400 flex-shrink-0" />
                            {mut}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic font-mono">
                      — Chưa kích hoạt đột biến nào. Bấm &quot;Mở Trình Sửa 16 Đột Biến&quot; để cấp đột biến cho con khủng long này.
                    </p>
                  )}
                </div>

                {/* Stats Editor Panel (Matching IslePilot Screenshot) */}
                {isEditingStats && (
                  <div className="p-4 rounded-xl bg-[#0a0f1d] border border-blue-500/40 space-y-3.5 animate-in fade-in shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-2">
                        <Edit3 className="w-3.5 h-3.5" /> Chỉnh Thông Số Khủng Long (In-Game Stats Editor)
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        SteamID: {player.steamId}
                      </span>
                    </div>

                    <div className="max-w-md">
                      <label className="block text-[11px] font-medium text-zinc-300 mb-1 flex items-center justify-between">
                        <span>Tăng Trưởng (Growth %)</span>
                        <span className="text-emerald-400 font-mono text-xs">{editGrowth}%</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editGrowth}
                          onChange={(e) => setEditGrowth(Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-28 px-3 py-1.5 rounded-lg bg-[#0e1424] border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                        <div className="flex items-center gap-1.5">
                          {[25, 50, 75, 100].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setEditGrowth(preset)}
                              className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition ${
                                editGrowth === preset
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

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={handleSaveStatsDirect}
                        disabled={isSavingStats}
                        className="px-4 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSavingStats ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setIsEditingStats(false)}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Applies the next time this dino is restored in-game.
                    </p>
                  </div>
                )}

                {/* ST25 Garage Quick Status Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950/80 via-zinc-900/60 to-cyan-950/20 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Warehouse className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        Kho Gara ST25 ({garageSlots.length} Khủng Long Đã Lưu / Trùng Sinh)
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Xem và chỉnh sửa các khủng long trong kho tại trang Kho Gara chuyên dụng
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/garage?search=${player.steamId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    Mở Kho Gara ST25 ↗
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'mutations' && (
              <div className="space-y-6 relative">
                {/* Target Dinosaur Selector Bar */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-medium text-zinc-400">Đang chỉnh sửa cho:</span>
                    <select
                      value={selectedTargetDinoId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedTargetDinoId(val);
                        if (val === 'current') {
                          loadMutationsIntoEditor(
                            player.mutations || [],
                            (player as any).lineage,
                            player.elder || (player.isPrimeElder ? 'Prime' : 'No elder')
                          );
                        } else {
                          const sl = garageSlots.find((s) => s.id === val);
                          if (sl) {
                            loadMutationsIntoEditor(
                              sl.mutations || [],
                              sl.lineage,
                              sl.elder || (sl.isPrimeElder ? 'Prime' : 'No elder')
                            );
                          }
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="current">
                        Khủng long đang chơi ({player.species} - Growth {((player.growth || 0) * 100).toFixed(1)}%)
                      </option>
                      {garageSlots.map((s, idx) => (
                        <option key={s.id} value={s.id}>
                          Gara Slot {idx + 1}: {s.species} (ID: {s.id.slice(0, 10)}... - {((s.growth || 1.0) * 100).toFixed(1)}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTargetDinoId !== 'current' ? (
                    <div className="flex items-center gap-2 text-xs font-mono bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-lg text-cyan-300">
                      <span>Dino ID: <strong className="text-white select-all">{selectedTargetDinoId}</strong></span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(selectedTargetDinoId, e)}
                        className="p-1 rounded hover:bg-cyan-900/50 text-cyan-400 hover:text-white transition"
                        title="Copy Dino ID"
                      >
                        {copySuccessId === selectedTargetDinoId ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-zinc-500">
                      Dino trực tiếp in-game
                    </span>
                  )}
                </div>

                {/* Elder Selection Row (Matching Screenshot 1 & 2) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-400 mr-2">Elder</span>
                  {(['No elder', 'Frail', 'Prime'] as const).map((status) => {
                    const isSelected = elderStatus === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setElderStatus(status)}
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

                {/* Hexagonal Mutations Area Container (Matching Screenshot 1 & 2) */}
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
                          onClick={() =>
                            setEditingSlotTarget({ group: 'active', index: idx })
                          }
                          isActiveGroup={true}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Lineage Section: Parent, Elder A, Elder B */}
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
                            onClick={() =>
                              setEditingSlotTarget({ group: 'parent', index: idx })
                            }
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
                            onClick={() =>
                              setEditingSlotTarget({ group: 'elderA', index: idx })
                            }
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
                            onClick={() =>
                              setEditingSlotTarget({ group: 'elderB', index: idx })
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Floating Popover Dropdown Selector (Matching IslePilot Screenshot 2) */}
                  {editingSlotTarget && (
                    <div
                      ref={slotDropdownRef}
                      className="absolute z-50 w-72 max-h-72 bg-[#090d16] border border-zinc-700/80 rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 animate-in fade-in zoom-in-95"
                      style={{
                        top: editingSlotTarget.group === 'active' ? '85px' : '230px',
                        left:
                          editingSlotTarget.group === 'active'
                            ? `${Math.min(Math.max(25 + editingSlotTarget.index * 15, 10), 70)}%`
                            : '50%',
                        transform: 'translateX(-50%)',
                      }}
                    >
                      {/* Search box */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          autoFocus
                          value={slotDropdownSearch}
                          onChange={(e) => setSlotDropdownSearch(e.target.value)}
                          placeholder="Search mutation..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0e1424] border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-sans"
                        />
                      </div>

                      {/* Clear slot option */}
                      <button
                        type="button"
                        onClick={() => handleSelectSlotMutation(null)}
                        className="text-left px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:bg-zinc-800/80 hover:text-white transition flex items-center justify-between border-b border-zinc-800/60"
                      >
                        <span>— None (Xóa slot) —</span>
                      </button>

                      {/* Scrollable list of Evrima mutations */}
                      <div className="overflow-y-auto max-h-48 space-y-0.5 pr-1">
                        {ALL_THE_ISLE_MUTATIONS.filter((m) =>
                          m.toLowerCase().includes(slotDropdownSearch.toLowerCase())
                        ).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleSelectSlotMutation(m)}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-200 hover:bg-blue-600/20 hover:text-cyan-300 transition flex items-center justify-between"
                          >
                            <span>{m}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons (Matching Screenshot 1 & 2) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isSavingMutations}
                      onClick={handleSaveMutationsHierarchy}
                      className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition shadow-md shadow-blue-500/20 disabled:opacity-50"
                    >
                      {isSavingMutations ? 'Saving...' : 'Save mutations'}
                    </button>
                    <button
                      type="button"
                      disabled={isReincarnating || isSavingMutations}
                      onClick={handleReincarnateDino}
                      className="px-4 py-2 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 text-xs font-semibold transition shadow-md shadow-purple-600/20 disabled:opacity-50 flex items-center gap-1.5"
                      title="Trùng sinh cho con khủng long này (Giữ nguyên cùng UID, tích lũy gen đầy đủ qua các đời)"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      {isReincarnating ? 'Đang trùng sinh...' : 'Trùng Sinh (Giữ UID)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dino')}
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
            )}

            {activeTab === 'prime' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-amber-950/30 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        Tiến Độ Trùng Sinh & Tiến Hóa (Prime Elder)
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                          player.primeEligible || player.prime?.eligible
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {player.primeEligible || player.prime?.eligible
                          ? 'ĐỦ ĐIỀU KIỆN TRÙNG SINH'
                          : 'CHƯA ĐỦ ĐIỀU KIỆN'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Hoàn thành {player.prime?.completed ?? 0} / {player.prime?.required ?? 5} nhiệm vụ bắt buộc (Tổng số {player.prime?.total ?? 10} nhiệm vụ trùng sinh).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {((player.prime as any)?.quests || [
                    { index: 1, name: 'Visit a Sanctuary as a juvenile', done: false },
                    { index: 2, name: 'Get nested in', done: false },
                    { index: 3, name: 'Get perfect diet (1% of each)', done: false },
                    { index: 4, name: 'Visit Mass Migration zone', done: false },
                    { index: 5, name: 'Visit 2 Migration zones', done: false },
                    { index: 6, name: 'Visit 4 Patrol zones', done: false },
                    { index: 7, name: 'Never be Infertile', done: false },
                    { index: 8, name: 'Never get Muscle spasms', done: false },
                    { index: 9, name: 'Raise children to Subadult', done: false },
                    { index: 10, name: 'Be a Hypsi, Troodon, Beipi, Dryo or Deino', done: false },
                  ]).map((q: any) => (
                    <div
                      key={q.index}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                        q.done
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                          : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${
                            q.done ? 'bg-emerald-600/30 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {q.index}
                        </span>
                        <span className={q.done ? 'font-semibold text-white' : ''}>{q.name}</span>
                      </div>
                      {q.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-500">Chưa đạt</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Thêm ghi chú hoặc cảnh cáo (Strike)
                  </h4>
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Ghi lại hành vi vi phạm, nghi vấn toxic, phối hợp săn bất hợp pháp..."
                    className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-zinc-400">Mức độ phạt:</label>
                      <select
                        value={strikeLevel}
                        onChange={(e) => setStrikeLevel(Number(e.target.value))}
                        className="px-2 py-1 rounded bg-zinc-950 border border-zinc-700 text-xs text-zinc-200"
                      >
                        <option value={0}>0 - Ghi chú thông thường</option>
                        <option value={1}>1 - Cảnh cáo lần 1 (Warning)</option>
                        <option value={2}>2 - Cảnh cáo lần 2 (Strike 2)</option>
                        <option value={3}>3 - Vi phạm nghiêm trọng (Strike 3 / Ban)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleAddNote}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
                    >
                      Lưu hồ sơ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Confirmations for Slay and Ban */}
      <SafetyConfirmModal
        isOpen={showSlayModal}
        onClose={() => setShowSlayModal(false)}
        onConfirm={() => handleAction('slay', 'Admin thực thi Slay')}
        title={`Xác nhận SLAY người chơi: ${player.name}`}
        description={`Hành động này sẽ hạ gục ngay lập tức khủng long ${player.species} của người chơi trong game. Khủng long sẽ rơi xác và mất toàn bộ tiến trình nếu không revive.`}
        requireMatchString={player.name}
        confirmButtonText="Hạ gục (Slay)"
        isDestructive={true}
      />

      <SafetyConfirmModal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        onConfirm={() => handleAction('ban', 'Vi phạm luật máy chủ The Isle')}
        title={`CẤM (BAN) NGƯỜI CHƠI KHỎI MÁY CHỦ`}
        description={`Cấm vĩnh viễn SteamID64: ${player.steamId} (${player.name}) khỏi cụm máy chủ ST25 VIETNAM.`}
        requireMatchString={player.steamId}
        confirmButtonText="Xác nhận Ban"
        isDestructive={true}
      />

      {/* Teleport Modal */}
      <TeleportModal
        player={player}
        isOpen={showTeleportModal}
        onClose={() => setShowTeleportModal(false)}
        onTeleport={(coords) =>
          handleAction('teleport', `Dịch chuyển đến ${coords.name || 'tọa độ'}`, coords)
        }
      />

      {/* Mutation Grant Modal */}
      <MutationGrantModal
        player={player}
        isOpen={showMutationModal}
        onClose={() => setShowMutationModal(false)}
        onSuccess={onRefresh}
      />

      {/* Revive Dino Modal */}
      <ReviveDinoModal
        isOpen={showReviveModal}
        onClose={() => setShowReviveModal(false)}
        target={
          player
            ? {
                steamId: player.steamId,
                name: player.name,
                species: player.species,
                growth: player.growth,
              }
            : null
        }
        onSuccess={() => onRefresh?.()}
      />
    </>
  );
}
