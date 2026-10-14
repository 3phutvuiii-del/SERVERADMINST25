'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/providers/AppProviders';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Key,
  ExternalLink,
  AlertTriangle,
  Server,
  Users,
  Dna,
  LogOut,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { AdminRole } from '@/types/islepilot';

function SteamIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.159-3.33-2.693L.548 14.836C2.001 20.086 6.772 24 12.021 24c6.627 0 12-5.373 12-12S18.607 0 11.979 0zM7.545 18.273c0 .122-.01.242-.027.36l-2.016-.833c.189-.597.683-1.05 1.303-1.157.433.407.74.966.74 1.63zm8.4-11.455c-1.196 0-2.166.97-2.166 2.166s.97 2.166 2.166 2.166 2.166-.97 2.166-2.166-.97-2.166-2.166-2.166zm0 3.61c-.797 0-1.444-.647-1.444-1.444 0-.797.647-1.444 1.444-1.444.797 0 1.444.647 1.444 1.444 0 .797-.647 1.444-1.444 1.444z" />
    </svg>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { currentSession, setCurrentRole, addToast, isLoadingAuth } = useApp();
  const [authTab, setAuthTab] = useState<'steam' | 'passcode'>('steam');
  const [passcode, setPasscode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Loading state while checking session
  if (isLoadingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#050811] text-white">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/20">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <RefreshCw className="w-24 h-24 text-emerald-500/20 animate-spin absolute" />
        </div>
        <div className="mt-6 text-center">
          <h2 className="text-base font-bold text-white tracking-wide">ST25 VIETNAM RBAC SECURITY GATE</h2>
          <p className="text-xs text-zinc-400 mt-1">Đang kiểm tra xác thực quyền hạn Ban Quản Trị...</p>
        </div>
      </div>
    );
  }

  // 2. Check if user is authenticated with a valid BQT role
  const isAuthorized =
    currentSession.authenticated &&
    currentSession.role !== 'GUEST' &&
    ['SUPER_ADMIN', 'SENIOR_ADMIN', 'MODERATOR', 'TRIAL_MOD'].includes(currentSession.role);

  // If authorized, render children (full admin panel)
  if (isAuthorized) {
    return <>{children}</>;
  }

  // 3. User logged in via Steam, but has NO admin role on Discord (Access Denied)
  const isSteamDenied =
    currentSession.authenticated && currentSession.role === 'GUEST' && currentSession.steamId;

  const handleSteamLogin = () => {
    setLoading(true);
    window.location.href = '/api/auth/steam';
  };

  const handleLogout = async () => {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentRole('GUEST');
    setLoading(false);
    window.location.href = '/';
  };

  const handlePasscodeLogin = async (codeToUse?: string, nameToUse?: string) => {
    const code = codeToUse || passcode;
    const name = nameToUse || adminName || 'BQT ST25';

    if (!code.trim()) {
      setErrorMsg('Vui lòng nhập mật mã quản trị');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code.trim(), username: name.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(
          'success',
          'Đăng nhập BQT thành công!',
          `Đã xác thực vai trò: ${data.session.role} (${data.session.username})`
        );
        setCurrentRole(data.session.role);
      } else {
        setErrorMsg(data.error || 'Mật mã quản trị viên không chính xác');
      }
    } catch {
      setErrorMsg('Lỗi kết nối khi gửi yêu cầu xác thực');
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040711] overflow-y-auto">
      {/* Background aesthetics & glowing ambient grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1322_1px,transparent_1px),linear-gradient(to_bottom,#0c1322_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-2xl glass-panel border border-zinc-800 p-6 md:p-8 shadow-2xl shadow-black/80 my-auto">
        {/* Top Branding Header */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-zinc-800/80">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-zinc-900 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              ST25 VIETNAM
            </span>
            <span className="text-[11px] font-mono text-zinc-500">IslePilot Control Panel</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-2 tracking-tight">
            CỔNG XÁC THỰC QUẢN TRỊ VIÊN
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Vui lòng đăng nhập để hệ thống tự động kiểm tra vai trò BQT trên server Discord ST25 và mở khóa chức năng tương ứng.
          </p>
        </div>

        {/* Access Denied Banner for normal Steam players without Discord BQT Role */}
        {isSteamDenied && (
          <div className="mt-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>TỪ CHỐI TRUY CẬP: KHÔNG TÌM THẤY QUYỀN BQT</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Tài khoản Steam <strong>{currentSession.username}</strong> ({currentSession.steamId}) đã xác thực thành công qua Steam OpenID, nhưng{' '}
              <span className="text-red-400 font-semibold">chưa được cấp vai trò Ban Quản Trị</span> trên server Discord ST25 hoặc IslePilot.
            </p>
            <div className="p-2.5 rounded-lg bg-black/40 border border-red-500/20 text-[10px] text-zinc-400">
              💡 Nếu bạn là Admin ST25, vui lòng liên hệ <strong>Super Admin / Chủ Server</strong> để gán vai trò BQT cho bạn trên Discord, sau đó bấm đăng nhập lại.
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất Steam & Thử tài khoản khác</span>
            </button>
          </div>
        )}

        {/* Tab switch: Steam OpenID vs Emergency Passcode */}
        <div className="mt-6 flex rounded-xl bg-zinc-950/80 p-1 border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setAuthTab('steam')}
            className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              authTab === 'steam'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <SteamIcon className="w-4 h-4" />
            <span>Steam OpenID (Chuẩn IslePilot)</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthTab('passcode')}
            className={`flex-1 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              authTab === 'passcode'
                ? 'bg-zinc-800 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Mật Mã Khẩn Cấp</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Content: Steam Auth */}
        {authTab === 'steam' ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Quy trình phân quyền tự động theo IslePilot:</span>
              </div>
              <ul className="text-zinc-400 space-y-1.5 text-[11px] list-disc list-inside leading-relaxed">
                <li>Đăng nhập chính chủ bằng tài khoản Steam qua <strong>Valve Steam OpenID 2.0</strong>.</li>
                <li>Hệ thống gọi API IslePilot lấy liên kết <strong>Discord User & Discord Roles</strong>.</li>
                <li>Tự động mở khóa giao diện theo quyền: <strong>Quan Khâm Sai, Long Không AD, Dev, Senior Admin, Mod...</strong></li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleSteamLogin}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#171a21] via-[#1b2838] to-[#2a475e] hover:from-[#2a475e] hover:to-[#1b2838] border border-cyan-500/40 text-white font-bold transition flex items-center justify-center gap-3 shadow-xl shadow-cyan-950/40 group hover:scale-[1.01]"
            >
              <SteamIcon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
              <span className="text-sm">ĐĂNG NHẬP VỚI STEAM</span>
              <ExternalLink className="w-4 h-4 text-zinc-400" />
            </button>
            <p className="text-[10px] text-center text-zinc-500">
              Chỉ các tài khoản có vai trò Ban Quản Trị trên server Discord ST25 mới có quyền truy cập.
            </p>
          </div>
        ) : (
          /* Tab Content: Emergency Passcode */
          <div className="mt-5 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Tên hiển thị Quản trị viên
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="VD: NguyenMen..."
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Mật mã quản trị (Passcode)
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Nhập secret key..."
                  onKeyDown={(e) => e.key === 'Enter' && handlePasscodeLogin()}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handlePasscodeLogin()}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Xác Nhận Đăng Nhập Khẩn Cấp</span>
              </button>
            </div>
          </div>
        )}


        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cluster ST25 Live</span>
          </div>
          <span>Bảo mật RBAC v2.4</span>
        </div>
      </div>
    </div>
  );
}
