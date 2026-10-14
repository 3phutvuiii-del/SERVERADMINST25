'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Dna,
  Check,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronDown,
} from 'lucide-react';
import { IslePilotPlayer } from '@/types/islepilot';
import { getDinoSpeciesImage } from '@/lib/utils';
import { useApp } from '@/components/providers/AppProviders';

interface MutationGrantModalProps {
  player: IslePilotPlayer | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ALL_THE_ISLE_MUTATIONS = [
  'Accelerated Prey Drive',
  'Advanced Gestation',
  'Augmented Tapetum',
  'Barometric Sensitivity',
  'Cannibalistic',
  'Cellular Regeneration',
  'Congenital Hypoalgesia',
  'Efficient Digestion',
  'Enhanced Digestion',
  'Enlarged meniscus',
  'Epidermal Fibrosis',
  'Featherweight',
  'Gastronomic Regeneration',
  'Heightened Ghrelin',
  'Hematophagy',
  'Hemomania',
  'Hydrodynamic',
  'Hypermetabolic Inanition',
  'Hypervigilance',
  'Increased Inspiratory Capacity',
  'Infrasound Communication',
  'Multichambered Lungs',
  'Nocturnal',
  'Osteophagic',
  'Osteosclerosis',
  'Parthenogenesis',
  'Photosynthetic Regeneration',
  'Photosynthetic Tissue',
  'Prolific Reproduction',
  'Reabsorption',
  'Reinforced Tendons',
  'Reniculate Kidneys',
  'Sequential Hermaphroditism',
  'Social Behavior',
  'Submerged Optical Retention',
  'Sustained Hydration',
  'Tactile Endurance',
  'Traumatic Thrombosis',
  'Truculency',
  'Wader',
  'Xerocole Adaptation',
];

export function MutationGrantModal({
  player,
  isOpen,
  onClose,
  onSuccess,
}: MutationGrantModalProps) {
  const { currentSession, addToast } = useApp();
  const [elderStatus, setElderStatus] = useState<'No elder' | 'Frail' | 'Prime'>('Prime');

  // 4 Active slots
  const [activeMutations, setActiveMutations] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  useEffect(() => {
    if (player) {
      if (player.mutations && player.mutations.length > 0) {
        const arr: (string | null)[] = [null, null, null, null];
        player.mutations.forEach((m, idx) => {
          if (idx < 4 && m && m !== 'None' && m !== '-') arr[idx] = m;
        });
        setActiveMutations(arr);

        if (player.mutations.length > 4) {
          const pArr: (string | null)[] = [null, null, null, null];
          player.mutations.slice(4, 8).forEach((m, idx) => {
            if (m && m !== 'None' && m !== '-') pArr[idx] = m;
          });
          setParentMutations(pArr);
        } else {
          setParentMutations([null, null, null, null]);
        }

        if (player.mutations.length > 8) {
          const eAArr: (string | null)[] = [null, null, null, null];
          player.mutations.slice(8, 12).forEach((m, idx) => {
            if (m && m !== 'None' && m !== '-') eAArr[idx] = m;
          });
          setElderAMutations(eAArr);
        } else {
          setElderAMutations([null, null, null, null]);
        }

        if (player.mutations.length > 12) {
          const eBArr: (string | null)[] = [null, null, null, null];
          player.mutations.slice(12, 16).forEach((m, idx) => {
            if (m && m !== 'None' && m !== '-') eBArr[idx] = m;
          });
          setElderBMutations(eBArr);
        } else {
          setElderBMutations([null, null, null, null]);
        }
      } else {
        setActiveMutations([null, null, null, null]);
        setParentMutations([null, null, null, null]);
        setElderAMutations([null, null, null, null]);
        setElderBMutations([null, null, null, null]);
      }
      setElderStatus(player.isPrimeElder ? 'Prime' : 'No elder');
    }
  }, [player]);

  // Lineage slots (Parent, Elder A, Elder B)
  const [parentMutations, setParentMutations] = useState<(string | null)[]>([null, null, null, null]);
  const [elderAMutations, setElderAMutations] = useState<(string | null)[]>([null, null, null, null]);
  const [elderBMutations, setElderBMutations] = useState<(string | null)[]>([null, null, null, null]);

  // Dropdown selector state
  const [editingTarget, setEditingTarget] = useState<{
    group: 'active' | 'parent' | 'elderA' | 'elderB';
    index: number;
  } | null>(null);

  const [dropdownSearch, setDropdownSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  if (!isOpen || !player) return null;

  const dinoImage = getDinoSpeciesImage(player.species);

  const handleSelectMutation = (val: string | null) => {
    if (!editingTarget) return;
    const { group, index } = editingTarget;

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
    setEditingTarget(null);
    setDropdownSearch('');
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    const all16Mutations: string[] = [
      ...activeMutations.map((m) => m || 'None'),
      ...parentMutations.map((m) => m || 'None'),
      ...elderAMutations.map((m) => m || 'None'),
      ...elderBMutations.map((m) => m || 'None'),
    ];
    const validCount = all16Mutations.filter((m) => m && m !== 'None' && m !== '-').length;

    try {
      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mutations',
          steamId: player.steamId,
          playerName: player.name,
          reason: `Khôi phục cấu trúc 16 đột biến gen: ${validCount}/16 kích hoạt (Elder: ${elderStatus})`,
          actorRole: currentSession.role,
          actorName: currentSession.username,
          params: {
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
          'Lưu đột biến thành công!',
          `Đã cấu hình cấu trúc 16 đột biến cho ${player.name} (${validCount}/16 slots kích hoạt).`
        );
        onSuccess?.();
        onClose();
      } else {
        const errorMsg = data.error || data.message || 'Lỗi phản hồi từ máy chủ';
        addToast('error', 'Lưu thất bại', errorMsg);
        window.alert(`[LỖI LƯU ĐỘT BIẾN]\n${errorMsg}`);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Lỗi kết nối máy chủ';
      addToast('error', 'Lỗi kết nối máy chủ', errorMsg);
      window.alert(`[LỖI KẾT NỐI MÁY CHỦ]\n${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMutations = ALL_THE_ISLE_MUTATIONS.filter((m) =>
    m.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col rounded-2xl bg-[#090d16] border border-zinc-800 shadow-2xl overflow-hidden text-zinc-200">
        {/* Top Header / Player Bar */}
        <div className="p-4 px-6 border-b border-zinc-800 bg-[#0d1322] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={dinoImage}
              alt={player.species}
              className="w-10 h-10 rounded-xl object-cover bg-zinc-900 border border-zinc-700"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">{player.species}</span>
                <span className="text-xs font-mono text-zinc-400">({player.female ? 'Female' : 'Male'})</span>
                <span className="text-xs font-mono text-emerald-400 font-bold ml-1">
                  {((player.growth || 0.94) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400">
                Chủ sở hữu: <span className="text-zinc-200">{player.name}</span> ({player.steamId})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main IslePilot Mutations Hierarchy Area */}
        <div className="p-6 overflow-y-auto space-y-6 relative bg-[#070b14]">
          {/* Elder Selection Row (Matching Screenshot) */}
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

          {/* Active Mutations Hexagonal Hierarchy Panel */}
          <div className="rounded-2xl bg-[#0b1020]/90 border border-zinc-800/90 p-6 space-y-8 relative min-h-[380px]">
            {/* 1. Active Mutations Section */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 mb-4">Active mutations</p>
              <div className="flex items-center justify-center gap-4">
                {activeMutations.map((mut, idx) => (
                  <HexagonSlot
                    key={`active-${idx}`}
                    slotNumber={idx + 1}
                    value={mut}
                    onClick={() => setEditingTarget({ group: 'active', index: idx })}
                    isActiveGroup={true}
                  />
                ))}
              </div>
            </div>

            {/* 2. Lineage / Parent Mutations Section */}
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
                      onClick={() => setEditingTarget({ group: 'parent', index: idx })}
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
                      onClick={() => setEditingTarget({ group: 'elderA', index: idx })}
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
                      onClick={() => setEditingTarget({ group: 'elderB', index: idx })}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Dropdown Selector (Matching Screenshot 2) */}
            {editingTarget && (
              <div
                ref={dropdownRef}
                className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 rounded-xl bg-[#0f172a] border border-cyan-500/40 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
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
                      placeholder="Tìm đột biến gen..."
                      className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-zinc-800/40 text-xs">
                  {/* Clear option */}
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
            )}
          </div>

          {/* Bottom Actions Row (Matching Screenshot) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Save mutations'
                )}
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
      </div>
    </div>
  );
}

// Reusable IslePilot Style Hexagon Slot Component
function HexagonSlot({
  slotNumber,
  value,
  onClick,
  isActiveGroup = false,
}: {
  slotNumber: number;
  value: string | null;
  onClick: () => void;
  isActiveGroup?: boolean;
}) {
  const isFilled = !!value && value !== '-';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        title={isFilled ? value : `Slot ${slotNumber} (Trống)`}
        className={`relative transition-all duration-200 focus:outline-none flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 ${
          isActiveGroup ? 'w-24 h-20' : 'w-16 h-14'
        } ${
          isFilled
            ? 'bg-[#0e3b43] text-cyan-200 shadow-md shadow-cyan-950/40 border-2 border-[#16606d]'
            : 'bg-[#101726]/80 text-zinc-600 border border-zinc-800 hover:border-zinc-700'
        }`}
        style={{
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        }}
      >
        <span
          className={`font-semibold text-center leading-tight px-1 select-none line-clamp-2 ${
            isActiveGroup ? 'text-[11px]' : 'text-[9px]'
          } ${isFilled ? 'text-cyan-100 font-medium' : 'text-zinc-500'}`}
        >
          {isFilled ? value : '—'}
        </span>
      </button>

      <span className="text-[10px] font-mono text-zinc-500 font-bold">{slotNumber}</span>
    </div>
  );
}
