'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApp } from '@/components/providers/AppProviders';
import {
  Search,
  RefreshCw,
  Cpu,
  HardDrive,
  Users,
  Shield,
  Send,
  Radio,
  Lock,
  LogOut,
  LogIn,
} from 'lucide-react';
import { AdminRole, ServerStatus } from '@/types/islepilot';
import { ROLE_BADGE_STYLE } from '@/lib/auth/rbac';
import { AdminLoginModal } from '@/components/auth/AdminLoginModal';

export function Header() {
  const { currentSession, setCurrentRole, setSearchOpen, addToast } = useApp();
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check server-side session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.session) {
          setCurrentRole(data.session.role);
        }
      })
      .catch(() => {});
  }, []);

  const { data: serverStatus, isFetching, refetch } = useQuery<ServerStatus>({
    queryKey: ['serverStatus'],
    queryFn: async () => {
      const res = await fetch('/api/islepilot/server');
      if (!res.ok) throw new Error('Failed to fetch server status');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    try {
      const res = await fetch('/api/islepilot/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_command',
          steamId: 'ALL',
          reason: `Broadcast: ${broadcastMessage}`,
          params: { command: `announce "${broadcastMessage}"` },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast('success', 'Thông báo đã gửi!', `Nội dung: ${broadcastMessage}`);
        setBroadcastMessage('');
        setShowBroadcastModal(false);
      } else {
        addToast('error', 'Gửi thông báo thất bại', data.error);
      }
    } catch {
      addToast('error', 'Lỗi kết nối máy chủ');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentRole('GUEST');
    addToast('info', 'Đã đăng xuất', 'Phiên làm việc đã trở về trạng thái Khách');
  };

  const roleStyle = ROLE_BADGE_STYLE[currentSession.role];

  return (
    <>
      <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Server Live Stats Header */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-white">
                {serverStatus?.name || 'ST25 VIETNAM'}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-4 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  <strong className="text-emerald-400">{serverStatus?.playersOnline ?? 0}</strong>
                  /100 online
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>{serverStatus?.cpuPct ? `${serverStatus.cpuPct.toFixed(1)}%` : '18.4%'}</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {serverStatus?.memoryUsedMb
                    ? `${Math.round(serverStatus.memoryUsedMb / 1024)}GB`
                    : '5.2GB'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Global Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-white transition"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Tìm kiếm</span>
            <kbd className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-mono border border-zinc-700">
              Ctrl+K
            </kbd>
          </button>

          {/* Quick Broadcast button */}
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium transition"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Broadcast</span>
          </button>

          {/* Refresh Ticker */}
          <button
            onClick={() => refetch()}
            title="Làm mới dữ liệu từ IslePilot"
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Active Auth Role Badge & Login Trigger */}
          <button
            onClick={() => setShowLoginModal(true)}
            title={currentSession.role === 'GUEST' ? 'Nhấp để đăng nhập Steam / BQT' : 'Nhấp để đổi phân quyền BQT'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition hover:scale-105 ${
              currentSession.role === 'GUEST'
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                : `${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`
            }`}
          >
            {currentSession.avatarUrl ? (
              <img
                src={currentSession.avatarUrl}
                alt={currentSession.username}
                className="w-5 h-5 rounded-full object-cover border border-white/20"
              />
            ) : currentSession.role === 'GUEST' ? (
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <div className="flex flex-col text-left">
              <span className="text-[10px] opacity-80 leading-tight">
                {currentSession.role === 'GUEST' ? 'Chưa đăng nhập' : currentSession.username}
              </span>
              <span className="text-[11px] font-mono font-bold leading-tight">
                {currentSession.role === 'GUEST' ? 'Đăng nhập BQT' : roleStyle.label}
              </span>
            </div>
          </button>

          {/* Logout button - only show when authenticated */}
          {currentSession.role !== 'GUEST' && (
            <button
              onClick={handleLogout}
              title="Đăng xuất khỏi phiên BQT"
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-red-500/20 border border-zinc-800 text-zinc-400 hover:text-red-400 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Broadcast Modal */}
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-md rounded-2xl glass-panel border border-emerald-500/40 p-6 shadow-2xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                Gửi Thông Báo Toàn Server (Broadcast)
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Tin nhắn sẽ hiển thị trực tiếp trên màn hình của tất cả người chơi đang online.
              </p>

              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="VD: Server sẽ restart trong 15 phút để bảo trì..."
                className="mt-4 w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Hủy
                </button>
                <button
                  onClick={handleBroadcast}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  Phát tin
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Admin Login & Role Switch Modal */}
      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
