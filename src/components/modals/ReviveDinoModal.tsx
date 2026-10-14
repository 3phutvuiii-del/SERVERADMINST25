'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  HeartHandshake,
  Heart,
  X,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  Check,
  RefreshCw,
  Zap,
  Dna,
  History,
  RotateCcw,
  Warehouse,
  Compass,
  Search,
} from 'lucide-react';
import { KNOWN_SPECIES_LIST, TELEPORT_SAFE_ZONES, getDinoSpeciesImage } from '@/lib/utils';
import { useApp } from '@/components/providers/AppProviders';

interface ReviveTargetInfo {
  dinoId?: string;
  steamId: string;
  name?: string;
  species?: string;
  growth?: number;
  reason?: string;
  coordinates?: { x: number; y: number; z: number };
  mutations?: string[];
  elder?: string;
  lineage?: any;
}

interface ReviveDinoModalProps {
  isOpen: boolean;
  onClose: () => void;
  target?: ReviveTargetInfo | null;
  onSuccess?: () => void;
}

export function ReviveDinoModal({ isOpen, onClose, target, onSuccess }: ReviveDinoModalProps) {
  const { addToast } = useApp();

  const [dinoId, setDinoId] = useState('');
  const [steamId, setSteamId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [species, setSpecies] = useState('Tyrannosaurus');
  const [growth, setGrowth] = useState<number>(1.0);
  const [healFull, setHealFull] = useState(true);
  const [selectedSafeZone, setSelectedSafeZone] = useState('');
  const [reason, setReason] = useState('Đền bù sự cố / Rollback hồi sinh 5s trước khi chết');
  const [loading, setLoading] = useState(false);

  // Recovery Destination: 'GARAGE' (Default - Auto back to player garage by ID) or 'LIVE_MAP' (Rollback directly to map coordinates)
  const [destination, setDestination] = useState<'GARAGE' | 'LIVE_MAP'>('GARAGE');

  // Rollback coordinates state
  const [casualtyCoords, setCasualtyCoords] = useState<{ x: number; y: number; z: number } | null>(null);
  const [restoreAtCasualtyCoords, setRestoreAtCasualtyCoords] = useState(true);

  // Rollback mutations state
  const [playerMutations, setPlayerMutations] = useState<string[]>([]);
  const [restoreMutations, setRestoreMutations] = useState(true);
  const [isLoadingPlayerMuts, setIsLoadingPlayerMuts] = useState(false);

  // Sync state when target changes
  useEffect(() => {
    if (target) {
      const resolvedDinoId =
        target.dinoId ||
        (target as any).id ||
        `dino_${target.steamId.slice(-6)}_${Date.now().toString(36)}`;
      setDinoId(resolvedDinoId);
      setSteamId(target.steamId || '');
      setPlayerName(target.name || '');
      if (target.species) {
        const match = KNOWN_SPECIES_LIST.find(
          (s) => s.toLowerCase() === target.species?.toLowerCase()
        );
        setSpecies(match || target.species);
      }
      if (target.growth !== undefined) {
        setGrowth(Math.min(1.0, Math.max(0.1, target.growth)));
      } else {
        setGrowth(1.0);
      }
      if (target.reason) {
        setReason(target.reason);
      } else {
        setReason(`Khôi phục Dino ID #${resolvedDinoId} vào Gara`);
      }

      if (target.coordinates && typeof target.coordinates.x === 'number') {
        setCasualtyCoords(target.coordinates);
        setRestoreAtCasualtyCoords(true);
      } else {
        setCasualtyCoords(null);
        setRestoreAtCasualtyCoords(false);
      }

      if (target.mutations && target.mutations.length > 0) {
        setPlayerMutations(target.mutations);
        setRestoreMutations(true);
      } else if (target.steamId) {
        // Fetch current / stored mutations for this player
        setIsLoadingPlayerMuts(true);
        fetch(`/api/islepilot/players/${target.steamId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.player?.mutations && Array.isArray(data.player.mutations)) {
              const valid = data.player.mutations.filter((m: string) => m && m !== 'None' && m !== '-');
              if (valid.length > 0) {
                setPlayerMutations(valid);
                setRestoreMutations(true);
              }
            }
          })
          .catch(() => null)
          .finally(() => setIsLoadingPlayerMuts(false));
      }
    }
  }, [target, isOpen]);

  if (!isOpen) return null;

  const handleQuickGrowth = (val: number) => {
    setGrowth(val);
  };

  const [isLookingUpUid, setIsLookingUpUid] = useState(false);

  const handleLookupByUid = async () => {
    const trimmedId = dinoId.trim();
    if (!trimmedId) {
      addToast('error', 'Lỗi', 'Vui lòng nhập UID khủng long để tra cứu');
      return;
    }
    setIsLookingUpUid(true);
    try {
      const res = await fetch(`/api/islepilot/garage?search=${encodeURIComponent(trimmedId)}`);
      const data = await res.json();
      const slots = data?.garage || [];
      const found = slots.find((s: any) => s.id?.toLowerCase() === trimmedId.toLowerCase()) || slots[0];

      if (found) {
        if (found.steamId) setSteamId(found.steamId);
        if (found.playerName) setPlayerName(found.playerName);
        if (found.species) {
          const match = KNOWN_SPECIES_LIST.find((s) => s.toLowerCase() === found.species?.toLowerCase());
          setSpecies(match || found.species);
        }
        if (found.growth !== undefined) setGrowth(Number(found.growth));

        const allMuts = [
          ...(found.mutations || []),
          ...(found.lineage?.parent || []),
          ...(found.lineage?.elderA || []),
          ...(found.lineage?.elderB || []),
        ].filter((m: string) => m && m !== 'None' && m !== '-');

        if (allMuts.length > 0) {
          setPlayerMutations(allMuts);
          setRestoreMutations(true);
        }
        addToast('success', 'Đã tìm thấy hồ sơ UID!', `Đã nạp khủng long ${found.species} (${Math.round((found.growth || 1) * 100)}%) kèm đột biến gen.`);
      } else {
        addToast('info', 'Thông báo UID', 'UID này hợp lệ, bạn có thể tiếp tục tiến hành khôi phục.');
      }
    } catch {
      addToast('error', 'Lỗi tra cứu', 'Không thể kết nối đến máy chủ để tìm UID');
    } finally {
      setIsLookingUpUid(false);
    }
  };

  const handleRevive = async () => {
    if (!steamId.trim()) {
      addToast('error', 'Lỗi nhập liệu', 'Vui lòng nhập SteamID người chơi cần hồi sinh');
      return;
    }

    if (!species.trim()) {
      addToast('error', 'Lỗi nhập liệu', 'Vui lòng chọn loài khủng long cần hồi sinh');
      return;
    }

    setLoading(true);
    try {
      const payloadCoordinates =
        destination === 'LIVE_MAP' && restoreAtCasualtyCoords && casualtyCoords ? casualtyCoords : undefined;
      const payloadMutations = restoreMutations && playerMutations.length > 0 ? playerMutations : undefined;

      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: destination === 'GARAGE' ? 'back_dino_to_garage' : 'revive',
          steamId: steamId.trim(),
          playerName: playerName.trim() || undefined,
          reason:
            reason.trim() ||
            (destination === 'GARAGE'
              ? `Back đúng Dino ID #${dinoId} vào Gara người chơi`
              : 'Rollback hồi sinh 5s trước khi chết ra bản đồ'),
          params: {
            dinoId: dinoId.trim(),
            species: species.trim(),
            growth,
            healFull,
            destination, // 'GARAGE' or 'LIVE_MAP'
            coordinates: payloadCoordinates,
            teleportLocationId:
              destination === 'LIVE_MAP' && !payloadCoordinates ? selectedSafeZone || undefined : undefined,
            mutations: payloadMutations,
            elder: target?.elder,
            lineage: target?.lineage,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Lỗi từ máy chủ khi thực hiện hồi sinh');
      }

      if (destination === 'GARAGE') {
        addToast(
          'success',
          'ĐÃ BACK DINO THEO ID VÀO GARA THÀNH CÔNG! 🏪',
          `Đã nạp chính xác Dino #${dinoId} (${species} ${(growth * 100).toFixed(0)}%) kèm gen đột biến vào Gara cho ${playerName || steamId}`
        );
      } else {
        addToast(
          'success',
          'ROLLBACK & HỒI SINH RA MAP THÀNH CÔNG! ⚡',
          `Đã khôi phục ${species} (${(growth * 100).toFixed(0)}%) tại vị trí tử nạn cho ${playerName || steamId}`
        );
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Hồi sinh thất bại', err.message);
    } finally {
      setLoading(false);
    }
  };

  const speciesImg = getDinoSpeciesImage(species);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-[#090e18] border border-emerald-500/40 shadow-2xl shadow-emerald-500/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-[#090e18] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <RotateCcw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Rollback & Khôi Phục Khủng Long Theo ID
              </h3>
              <p className="text-xs text-zinc-400">
                Back đúng con Dino theo ID vào Gara trên máy chủ hoặc Rollback vị trí ra bản đồ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-zinc-300">
          {/* Target Player Banner */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-mono text-zinc-400 font-bold">Người Chơi Nhận Dino</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {playerName || 'Chưa rõ tên'} <span className="text-xs font-mono text-cyan-400 font-normal">({steamId || 'Chưa nhập SteamID'})</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold">
              <RotateCcw className="w-3.5 h-3.5" />
              SẴN SÀNG KHÔI PHỤC
            </div>
          </div>

          {/* Dino ID / UID Input & Fast Lookup */}
          <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-zinc-400 text-[10px] uppercase font-bold flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Dino ID / UID Của Con Khủng Long:
              </label>
              <span className="text-[10px] text-zinc-500 italic">
                Nhập hoặc dán UID để load lại đúng con đó
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={dinoId}
                onChange={(e) => setDinoId(e.target.value)}
                placeholder="Ví dụ: dino_c1a2b3... hoặc ID trong Gara"
                className="flex-1 bg-zinc-900/90 border border-cyan-700/60 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder-zinc-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50"
              />
              <button
                type="button"
                disabled={isLookingUpUid}
                onClick={handleLookupByUid}
                className="px-3 py-2 rounded-lg bg-cyan-600/25 border border-cyan-500/50 hover:bg-cyan-600/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                title="Tự động tra cứu hồ sơ khủng long theo UID này"
              >
                {isLookingUpUid ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Tra Cứu UID</span>
              </button>
            </div>
          </div>

          {/* DESTINATION SELECTOR: AUTO BACK TO GARAGE vs ROLLBACK LIVE MAP */}
          <div className="space-y-2">
            <label className="block text-zinc-300 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Điểm Đến Sau Khi Khôi Phục <span className="text-emerald-400">*</span></span>
              <span className="text-[10px] text-zinc-400 font-normal">Chọn cách hệ thống trả lại con khủng long</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: Auto Back to Garage (Default) */}
              <button
                type="button"
                onClick={() => setDestination('GARAGE')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between relative ${
                  destination === 'GARAGE'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Warehouse className={`w-4 h-4 ${destination === 'GARAGE' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    <span className="font-bold text-xs">Cất Vào Gara Cá Nhân</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Khuyên Dùng
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Tự động lưu vào slot Gara. Người chơi mở Gara lấy ra dùng bất cứ lúc nào, an toàn 100%.
                </p>
              </button>

              {/* Option 2: Live Map Coordinates */}
              <button
                type="button"
                onClick={() => setDestination('LIVE_MAP')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between relative ${
                  destination === 'LIVE_MAP'
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Compass className={`w-4 h-4 ${destination === 'LIVE_MAP' ? 'text-cyan-400' : 'text-zinc-400'}`} />
                    <span className="font-bold text-xs">Rollback Ra Bản Đồ</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Trực Tiếp
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Hồi sinh ngay lập tức ra map tại tọa độ tử nạn 5s trước (Dành cho người chơi đang online).
                </p>
              </button>
            </div>
          </div>

          {/* Conditional Destination Explainer */}
          {destination === 'GARAGE' ? (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-emerald-300 text-xs">
                  Cơ Chế Tự Động Đưa Khủng Long Trở Lại Gara (Auto Back To Garage)
                </p>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Hệ thống sẽ tái tạo con khủng long với đúng loài, đúng % tăng trưởng và đầy đủ các đột biến gen, sau đó <b>tự động gọi lệnh cất vào Gara cá nhân</b>. Người chơi khi vào game chỉ việc mở Gara bấm sử dụng mà không lo bị cắn chết tiếp ở bãi chiến trường!
                </p>
              </div>
            </div>
          ) : (
            /* Live Map Coordinates Box */
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
              <p className="font-bold text-cyan-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <History className="w-4 h-4 text-cyan-400" />
                Trạng Thái Hiện Trường 5 Giây Trước Khi Chết (Snapshot)
              </p>

              {casualtyCoords ? (
                <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/80 border border-cyan-500/30 cursor-pointer hover:border-cyan-500/60 transition">
                  <input
                    type="checkbox"
                    checked={restoreAtCasualtyCoords}
                    onChange={(e) => setRestoreAtCasualtyCoords(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-cyan-500 focus:ring-cyan-500 bg-zinc-950 border-zinc-700"
                  />
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      Dịch chuyển về đúng Tọa Độ Tử Nạn (Rollback Vị Trí)
                    </p>
                    <p className="text-[11px] font-mono text-cyan-300 mt-0.5">
                      X: {Math.round(casualtyCoords.x)} | Y: {Math.round(casualtyCoords.y)} | Z: {Math.round(casualtyCoords.z)} (Nâng an toàn +50z)
                    </p>
                  </div>
                </label>
              ) : (
                <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-[11px]">
                  ℹ️ Không có sẵn tọa độ từ Killfeed. Hệ thống sẽ giữ nguyên vị trí hoặc dịch chuyển đến Safe Zone.
                </div>
              )}
            </div>
          )}

          {/* Mutations Rollback Checkbox & Badges */}
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={restoreMutations}
                onChange={(e) => setRestoreMutations(e.target.checked)}
                className="w-4 h-4 rounded text-purple-500 focus:ring-purple-500 bg-zinc-950 border-zinc-700"
              />
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5 text-purple-400" />
                Khôi Phục Toàn Bộ Đột Biến Gen Đã Có ({playerMutations.length} Đột Biến)
              </span>
            </label>

            {isLoadingPlayerMuts ? (
              <p className="text-[11px] text-zinc-400 italic">Đang kiểm tra hồ sơ đột biến gen của người chơi...</p>
            ) : playerMutations.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {playerMutations.map((mut, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-200 text-[11px] font-medium"
                  >
                    <Dna className="w-3 h-3 text-purple-400" />
                    {mut}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500 italic">
                Khủng long chưa có hồ sơ đột biến gen ghi nhận trước đó.
              </p>
            )}
          </div>

          {/* Species Selection */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5 flex items-center justify-between">
              <span>Loài Khủng Long Khôi Phục <span className="text-red-400">*</span></span>
              <span className="text-[11px] text-zinc-400 font-normal">Đang chọn: <b className="text-emerald-400">{species}</b></span>
            </label>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700">
              {speciesImg && (
                <img
                  src={speciesImg}
                  alt={species}
                  className="w-10 h-10 rounded-lg object-cover bg-black/50 border border-zinc-800 flex-shrink-0"
                />
              )}
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
              >
                {KNOWN_SPECIES_LIST.map((sp) => (
                  <option key={sp} value={sp} className="bg-zinc-900 text-white">
                    {sp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Growth Slider & Presets */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-zinc-200">
                Kích Thước Trưởng Thành (Growth): <span className="font-mono text-emerald-400 font-bold text-sm">{(growth * 100).toFixed(0)}% ({growth.toFixed(2)})</span>
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { label: '20% Non', val: 0.2 },
                  { label: '50% Thiếu niên', val: 0.5 },
                  { label: '80% Lớn', val: 0.8 },
                  { label: '100% Max', val: 1.0 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleQuickGrowth(item.val)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition ${
                      growth === item.val
                        ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/30'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={growth}
              onChange={(e) => setGrowth(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Full Heal & Safe Zone options */}
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
              <input
                type="checkbox"
                checked={healFull}
                onChange={(e) => setHealFull(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-950 border-zinc-700"
              />
              <div>
                <p className="font-semibold text-white">Bơm Đầy Sinh Lực (10,000 HP, Đói, Khát, Xóa Gãy Chân)</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Đảm bảo khủng long sau khi hồi sinh có đầy đủ năng lượng chiến đấu, không bị chảy máu chết lại.
                </p>
              </div>
            </label>

            {destination === 'LIVE_MAP' && !restoreAtCasualtyCoords && (
              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Vị Trí An Toàn (Safe Zone Teleport)
                </label>
                <select
                  value={selectedSafeZone}
                  onChange={(e) => setSelectedSafeZone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Giữ nguyên vị trí hiện tại của người chơi --</option>
                  {TELEPORT_SAFE_ZONES.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Audit Reason */}
            <div>
              <label className="block text-zinc-300 font-semibold mb-1.5">
                Lý Do Khôi Phục <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Đền bù tử nạn / Cất lại vào Gara cá nhân..."
                className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleRevive}
            disabled={loading || !steamId.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang thực hiện khôi phục...</span>
              </>
            ) : destination === 'GARAGE' ? (
              <>
                <Warehouse className="w-4 h-4 text-emerald-200" />
                <span>⚡ Khôi Phục & Tự Động Cất Vào Gara</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>⚡ Rollback & Hồi Sinh Ra Map</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
