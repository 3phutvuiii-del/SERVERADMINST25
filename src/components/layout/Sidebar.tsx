'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Database,
  Radio,
  Swords,
  Scroll,
  Crown,
  ShieldCheck,
  Server,
  Terminal,
  Dna,
  Megaphone,
  Shield,
  Lock,
} from 'lucide-react';
import { useApp } from '@/components/providers/AppProviders';
import { ROLE_BADGE_STYLE, PermissionDefinition } from '@/lib/auth/rbac';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  requiredPerm: keyof PermissionDefinition;
}

const NAVIGATION_ITEMS: NavItem[] = [
  {
    name: 'Tổng quan máy chủ',
    href: '/',
    icon: LayoutDashboard,
    badge: 'LIVE',
    requiredPerm: 'canViewDashboard',
  },
  {
    name: 'Quản lý người chơi',
    href: '/players',
    icon: Users,
    requiredPerm: 'canViewPlayers',
  },
  {
    name: 'Gara & Slot Khủng Long',
    href: '/garage',
    icon: Database,
    requiredPerm: 'canManageGarage',
  },
  {
    name: 'Thông báo Server (Broadcast)',
    href: '/announcements',
    icon: Megaphone,
    badge: 'AUTO',
    requiredPerm: 'canBroadcast',
  },
  {
    name: 'Phân quyền Discord (Roles)',
    href: '/roles',
    icon: Shield,
    badge: 'RBAC',
    requiredPerm: 'canManageRoles',
  },
  {
    name: 'PvP & Combat Logs',
    href: '/combat',
    icon: Swords,
    badge: 'AI Flag',
    requiredPerm: 'canViewCombatLogs',
  },
  {
    name: 'Prime & Đặc quyền',
    href: '/prime',
    icon: Crown,
    badge: 'BETA',
    requiredPerm: 'canManagePrime',
  },
  {
    name: 'Nhiệm vụ & Phần thưởng',
    href: '/quests',
    icon: Scroll,
    badge: 'BETA',
    requiredPerm: 'canManageQuests',
  },

  {
    name: 'Nhật ký hệ thống (Logs)',
    href: '/audit',
    icon: ShieldCheck,
    requiredPerm: 'canViewAuditLogs',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentSession, hasPermission, addToast } = useApp();
  const roleStyle = ROLE_BADGE_STYLE[currentSession.role];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-screen border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/80 p-1 flex items-center justify-center overflow-hidden shadow-lg shadow-emerald-500/10">
            <img
              src="/images/logo/st25.png"
              alt="ST25 VIETNAM"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute('src', '/images/logo/ST25-LOGO.png');
              }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-1.5">
              ST25 <span className="text-emerald-400 font-semibold">VIETNAM</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              IslePilot Core v1.4
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
          Hệ Thống Quản Trị
        </p>

        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isAllowed = hasPermission(item.requiredPerm);

          if (!isAllowed) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() =>
                  addToast(
                    'error',
                    '⛔ TỪ CHỐI QUYỀN TRUY CẬP',
                    `Chức vụ "${currentSession.role}" không có quyền truy cập mục "${item.name}". Yêu cầu quyền: [${item.requiredPerm}]`
                  )
                }
                title={`Chức vụ ${currentSession.role} không có quyền truy cập ${item.name}`}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-400 hover:bg-red-500/5 transition opacity-60 cursor-not-allowed group"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-zinc-600 group-hover:text-red-400 transition" />
                  <span className="line-through decoration-zinc-700">{item.name}</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-zinc-600 group-hover:text-red-400" />
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    item.badge === 'LIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                      : item.badge === 'BETA'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'

                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Admin User Card & Role */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/30">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/70 border border-zinc-800">
          {currentSession.avatarUrl ? (
            <img
              src={currentSession.avatarUrl}
              alt={currentSession.username}
              className="w-8 h-8 rounded-lg object-cover border border-zinc-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-white border border-zinc-700">
              {currentSession.role === 'GUEST' ? '?' : 'AD'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {currentSession.role === 'GUEST' ? 'Khách (Chưa đăng nhập)' : currentSession.username}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-medium border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
              >
                {roleStyle.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
