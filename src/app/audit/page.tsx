'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Lock,
  RefreshCw,
  Search,
  Eye,
  HeartCrack,
  Skull,
  Zap,
} from 'lucide-react';
import { ActivityEvent } from '@/app/api/islepilot/activity/route';
import { ROLE_PERMISSIONS } from '@/lib/auth/rbac';
import { formatTimeAgo, formatNumber, getDinoSpeciesImage } from '@/lib/utils';
import { useApp } from '@/components/providers/AppProviders';

const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'logins', label: 'Logins' },
  { id: 'logouts', label: 'Logouts' },
  { id: 'kills', label: 'Kills' },
  { id: 'gambling', label: 'Gambling' },
  { id: 'coins', label: 'Coins' },
  { id: 'audit', label: 'Audit' },
  { id: 'admin', label: 'Admin' },
  { id: 'panel', label: 'Panel' },
  { id: 'anti-cheat', label: 'Anti-cheat' },
  { id: 'chat', label: 'Chat' },
  { id: 'garage', label: 'Garage' },
  { id: 'shop', label: 'Shop' },
  { id: 'teleport', label: 'Teleport' },
  { id: 'self-slay', label: 'Self-slay' },
  { id: 'dino-sold', label: 'Dino sold' },
  { id: 'mutations', label: 'Mutations' },
  { id: 'tokens', label: 'Tokens' },
];

export default function AuditPage() {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null);
  const [showRbacMatrix, setShowRbacMatrix] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery<{ events: ActivityEvent[] }>({
    queryKey: ['activity-events-audit'],
    queryFn: async () => {
      const res = await fetch('/api/islepilot/activity');
      if (!res.ok) throw new Error('Không thể tải dữ liệu nhật ký');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const events = data?.events || [];

  // Filter events by tab and search
  const filteredEvents = events.filter((ev) => {
    if (activeTab !== 'all') {
      if (activeTab === 'dino-sold' && ev.category !== 'dino-sold') return false;
      else if (activeTab === 'anti-cheat' && ev.category !== 'anti-cheat') return false;
      else if (activeTab === 'self-slay' && ev.category !== 'self-slay') return false;
      else if (ev.category !== activeTab) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchDesc = ev.description.toLowerCase().includes(q);
      const matchActor = ev.actorName?.toLowerCase().includes(q);
      const matchTarget = ev.targetName?.toLowerCase().includes(q);
      const matchSpecies = ev.species?.toLowerCase().includes(q) || ev.actorSpecies?.toLowerCase().includes(q);
      const matchId = ev.id.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchActor || matchTarget || matchSpecies || matchId;
    }

    return true;
  });

  const rbacPermissions = [
    { key: 'canViewDashboard', name: 'Xem Tổng quan Dashboard' },
    { key: 'canViewPlayers', name: 'Xem Danh bạ người chơi' },
    { key: 'canInspectPlayer', name: 'Xem Chi tiết & Chỉ số Dino' },
    { key: 'canHealFeed', name: 'Can thiệp Heal & Feed' },
    { key: 'canTeleport', name: 'Teleport người chơi' },
    { key: 'canRevive', name: 'Hồi sinh (Revive)' },
    { key: 'canKick', name: 'Kick người chơi' },
    { key: 'canSlay', name: 'Hạ gục (Slay Dino)' },
    { key: 'canBan', name: 'Cấm vĩnh viễn (Ban)' },
    { key: 'canManageGarage', name: 'Xem Gara khủng long' },
    { key: 'canInjectDino', name: 'Bơm Dino vào slot mới' },
    { key: 'canWipeGarage', name: 'Xóa toàn bộ Gara (Wipe)' },
    { key: 'canManagePrime', name: 'Cấp Prime & Đặc quyền' },
    { key: 'canViewAuditLogs', name: 'Xem Nhật ký Audit' },
  ];

  return (
    <div className="space-y-5">
      {/* Title & Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Nhật Ký Hoạt Động & Kiểm Toán Hệ Thống (Server Logs & Audit)
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Ghi nhận toàn bộ luồng sự kiện máy chủ: Kills (-HP), Đăng nhập, Admin, Giao dịch, Gara & Anti-cheat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRbacMatrix((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition"
          >
            <Lock className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
            {showRbacMatrix ? 'Ẩn ma trận RBAC' : 'Xem ma trận RBAC'}
          </button>

          <button
            onClick={() => {
              refetch();
              addToast('info', 'Làm mới dữ liệu', 'Đã cập nhật nhật ký hoạt động mới nhất!');
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
            Làm mới Logs
          </button>
        </div>
      </div>

      {/* 18 CATEGORY FILTER TABS BAR (Right at the top, matching user request) */}
      <div className="p-2.5 rounded-2xl glass-panel border border-zinc-800/80 shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? 'border-blue-500 bg-blue-950/40 text-blue-400 shadow-sm shadow-blue-500/30'
                    : 'border-zinc-800/80 bg-zinc-950/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 rounded-2xl glass-panel border border-zinc-800 flex items-center gap-2.5 bg-zinc-950/70">
        <Search className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Tìm kiếm trong danh mục [${activeTab.toUpperCase()}] theo Người chơi, Loài Dino, Loại hành động...`}
          className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
        />
      </div>

      {/* Main Logs Table */}
      <div className="rounded-2xl glass-panel border border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Nhật Ký Sự Kiện: <span className="text-blue-400 uppercase font-mono">{activeTab}</span>
          </h3>
          <span className="text-xs font-mono text-zinc-400">Hiển thị {filteredEvents.length} bản ghi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-zinc-950/80 text-zinc-400 font-mono uppercase text-[11px] border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4">Phân loại</th>
                <th className="py-3.5 px-4">Người chơi / Khủng long</th>
                <th className="py-3.5 px-4">Chi tiết sự kiện</th>
                <th className="py-3.5 px-4 text-center">Máu Bị Trừ (HP Lost)</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Đang tải nhật ký sự kiện...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    Không có bản ghi nào trong mục [{activeTab}].
                  </td>
                </tr>
              ) : (
                filteredEvents.map((item) => {
                  const dinoImage = item.species ? getDinoSpeciesImage(item.species) : null;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-900/50 transition cursor-pointer"
                      onClick={() => setSelectedEvent(item)}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap">
                        {formatTimeAgo(item.timestamp)}
                      </td>

                      {/* Category Tag */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          item.category === 'kills'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : item.category === 'anti-cheat'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : item.category === 'admin' || item.category === 'audit'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : item.category === 'logins'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : item.category === 'logouts'
                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            : item.category === 'teleport'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : item.category === 'garage'
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            : item.category === 'coins' || item.category === 'tokens'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                        }`}>
                          {item.category}
                        </span>
                      </td>

                      {/* Player / Dino Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {dinoImage && (
                            <img
                              src={dinoImage}
                              alt={item.species || 'Dino'}
                              className="w-8 h-8 rounded-lg object-cover bg-zinc-900 border border-zinc-800 flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <p className="font-bold text-white">
                              {item.targetName || item.actorName || 'Hệ thống'}
                            </p>
                            {item.species && (
                              <p className="text-[10px] text-zinc-400 font-mono">
                                {item.species} {item.growth ? `• ${(item.growth * 100).toFixed(0)}%` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Event Detail */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="font-medium text-zinc-200 truncate">{item.title}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{item.description}</p>
                      </td>

                      {/* Deducted HP for Kills & Self-slay */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.hpDeducted ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/70 border border-red-500/50 text-red-400 font-mono font-black text-xs shadow-sm">
                            <HeartCrack className="w-3.5 h-3.5 text-red-400 animate-pulse flex-shrink-0" />
                            <span>-{formatNumber(item.hpDeducted)} HP</span>
                            {item.damageDealt ? (
                              <span className="text-[10px] text-zinc-400 font-medium font-sans">
                                ({item.damageDealt} DMG)
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.flaggedSuspicious ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold font-mono">
                            <AlertTriangle className="w-3 h-3" /> CỜ NGHI VẤN
                          </span>
                        ) : item.severity === 'critical' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono">
                            Cảnh báo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                            <CheckCircle className="w-3 h-3" /> Hợp lệ
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(item);
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Granular Matrix (Shown when toggled) */}
      {showRbacMatrix && (
        <div className="rounded-2xl glass-panel border border-zinc-800 p-5 shadow-xl animate-in fade-in">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-emerald-400" />
            Ma Trận Phân Quyền Quản Trị (RBAC Matrix)
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            Quyền hạn tự động thực thi bảo vệ cấp độ API đối với từng chức danh.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Hành động / Quyền hạn</th>
                  <th className="py-2.5 px-3 text-center">Trial Mod</th>
                  <th className="py-2.5 px-3 text-center">Moderator</th>
                  <th className="py-2.5 px-3 text-center">Senior Admin</th>
                  <th className="py-2.5 px-3 text-center">Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                {rbacPermissions.map((perm) => (
                  <tr key={perm.key} className="hover:bg-zinc-900/40">
                    <td className="py-2 px-3 font-sans text-zinc-300 font-medium">{perm.name}</td>
                    {(['TRIAL_MOD', 'MODERATOR', 'SENIOR_ADMIN', 'SUPER_ADMIN'] as const).map(
                      (role) => {
                        const allowed = (ROLE_PERMISSIONS[role] as any)[perm.key];
                        return (
                          <td key={role} className="py-2 px-3 text-center">
                            {allowed ? (
                              <span className="inline-flex items-center text-emerald-400 font-bold">
                                ✓ CHO PHÉP
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-zinc-600">✕</span>
                            )}
                          </td>
                        );
                      }
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-zinc-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {selectedEvent.category === 'kills' ? (
                  <Skull className="w-5 h-5 text-red-400" />
                ) : (
                  <Zap className="w-5 h-5 text-emerald-400" />
                )}
                Chi Tiết Bản Ghi #{selectedEvent.id}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                {selectedEvent.category}
              </span>
            </div>

            {selectedEvent.hpDeducted ? (
              <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-mono text-red-300 font-bold">
                    Lượng Máu Bị Trừ (HP Deducted)
                  </p>
                  <p className="text-2xl font-black text-red-400 font-mono mt-0.5">
                    -{formatNumber(selectedEvent.hpDeducted)} HP
                  </p>
                </div>
                <div className="text-right">
                  {selectedEvent.damageDealt && (
                    <p className="text-xs font-mono text-zinc-300">
                      Sát thương: <span className="font-bold text-red-400">{selectedEvent.damageDealt} DMG</span>
                    </p>
                  )}
                  {selectedEvent.hitLocation && (
                    <p className="text-xs font-mono text-zinc-400">
                      Vị trí: <span className="text-zinc-200">{selectedEvent.hitLocation}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            <div className="mt-4 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-zinc-400">Tiêu đề:</span>
                <span className="font-bold text-white text-right">{selectedEvent.title}</span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-zinc-400">Thời điểm:</span>
                <span className="font-mono text-zinc-300">
                  {new Date(selectedEvent.timestamp).toLocaleString('vi-VN')}
                </span>
              </div>

              {selectedEvent.actorName && (
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-zinc-400">Bên thực hiện / Kẻ hạ gục:</span>
                  <div className="flex items-center gap-2">
                    {selectedEvent.actorSpecies && (
                      <img
                        src={getDinoSpeciesImage(selectedEvent.actorSpecies)}
                        alt={selectedEvent.actorSpecies}
                        className="w-5 h-5 rounded object-cover"
                      />
                    )}
                    <span className="font-bold text-amber-400">{selectedEvent.actorName}</span>
                  </div>
                </div>
              )}

              {selectedEvent.targetName && (
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-zinc-400">Nạn nhân / Đối tượng:</span>
                  <div className="flex items-center gap-2">
                    {selectedEvent.species && (
                      <img
                        src={getDinoSpeciesImage(selectedEvent.species)}
                        alt={selectedEvent.species}
                        className="w-5 h-5 rounded object-cover"
                      />
                    )}
                    <span className="font-bold text-white">{selectedEvent.targetName}</span>
                  </div>
                </div>
              )}

              <div className="border-b border-zinc-800/80 pb-2">
                <span className="text-zinc-400 block mb-1">Mô tả hành động:</span>
                <p className="text-zinc-300 leading-relaxed font-mono text-[11px] bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                  {selectedEvent.description}
                </p>
              </div>

              {selectedEvent.coordinates && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Tọa độ sự kiện:</span>
                  <span className="font-mono text-cyan-400">
                    X: {selectedEvent.coordinates.x} | Y: {selectedEvent.coordinates.y} | Z: {selectedEvent.coordinates.z}
                  </span>
                </div>
              )}
            </div>

            {selectedEvent.flaggedSuspicious && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Cảnh báo Rule Violation Engine:
                </p>
                <p className="mt-1 text-zinc-300">
                  {selectedEvent.violationReason || 'Phát hiện bất thường về sát thương hoặc thời gian trả thù.'}
                </p>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
