'use client';

import React, { useState } from 'react';
import { Lock, Shield, Key, X, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { useApp } from '@/components/providers/AppProviders';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SteamIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.159-3.33-2.693L.548 14.836C2.001 20.086 6.772 24 12.021 24c6.627 0 12-5.373 12-12S18.607 0 11.979 0zM7.545 18.273c0 .122-.01.242-.027.36l-2.016-.833c.189-.597.683-1.05 1.303-1.157.433.407.74.966.74 1.63zm8.4-11.455c-1.196 0-2.166.97-2.166 2.166s.97 2.166 2.166 2.166 2.166-.97 2.166-2.166-.97-2.166-2.166-2.166zm0 3.61c-.797 0-1.444-.647-1.444-1.444 0-.797.647-1.444 1.444-1.444.797 0 1.444.647 1.444 1.444 0 .797-.647 1.444-1.444 1.444z" />
    </svg>
  );
}

function DiscordIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const { currentSession, setCurrentRole, addToast } = useApp();
  const [authTab, setAuthTab] = useState<'steam' | 'passcode'>('steam');
  const [passcode, setPasscode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSteamRedirect = () => {
    setLoading(true);
    window.location.href = '/api/auth/steam';
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
        onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl glass-panel border border-cyan-500/40 p-6 shadow-2xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Xác Thực Quản Trị Viên (RBAC Auth)</h3>
              <p className="text-[11px] text-zinc-400">Đăng nhập Steam & Quyền Discord như IslePilot</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Steam OpenID vs Secret Key */}
        <div className="mt-4 flex rounded-xl bg-[#090d16] p-1 border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setAuthTab('steam')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
              authTab === 'steam'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <SteamIcon className="w-4 h-4" />
            <span>Steam OpenID (Chuẩn IslePilot)</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthTab('passcode')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
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
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {authTab === 'steam' ? (
          <div className="mt-5 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#0d1322] border border-blue-500/30 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Shield className="w-4 h-4" />
                <span>Cơ Chế Phân Quyền Tự Động:</span>
              </div>
              <ul className="text-zinc-300 space-y-1.5 text-[11px] list-disc list-inside">
                <li>Xác thực chính chủ bằng tài khoản Steam qua <strong>Steam OpenID 2.0</strong>.</li>
                <li>Tự động lấy thông tin liên kết <strong>Discord User & Discord Roles</strong> từ IslePilot.</li>
                <li>Tự động cấp vai trò BQT tương ứng: <strong>Quan Khâm Sai, Long Không AD, Dev, Mod...</strong></li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleSteamRedirect}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#171a21] via-[#1b2838] to-[#2a475e] hover:from-[#2a475e] hover:to-[#1b2838] border border-cyan-500/40 text-white font-bold transition flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-900/20 group"
            >
              <SteamIcon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
              <span className="text-sm">ĐĂNG NHẬP QUA STEAM (Sign in with Steam)</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </button>
            <p className="text-[10px] text-center text-zinc-500">
              Được bảo vệ bởi giao thức bảo mật của Valve Steam Community & IslePilot Cloud API.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-zinc-300">Tên hiển thị Admin</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="VD: NguyenMen..."
                className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-300">Mật mã bảo mật (Admin Passcode)</label>
              <div className="relative mt-1">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Nhập secret key..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <Key className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5" />
              </div>
            </div>


            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                Đóng
              </button>
              <button
                onClick={() => handlePasscodeLogin()}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
