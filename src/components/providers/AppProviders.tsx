'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminRole, AdminUserSession } from '@/types/islepilot';
import { PermissionDefinition, ROLE_PERMISSIONS } from '@/lib/auth/rbac';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface AppContextType {
  currentSession: AdminUserSession;
  setCurrentRole: (role: AdminRole) => void;
  permissions: PermissionDefinition;
  hasPermission: (perm: keyof PermissionDefinition) => boolean;
  checkPermissionOrToast: (perm: keyof PermissionDefinition, actionLabel: string) => boolean;
  isLoadingAuth: boolean;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
  removeToast: (id: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProviders');
  return ctx;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchInterval: 15000, // 15s live refresh
            staleTime: 10000,
            retry: 1,
          },
        },
      })
  );

  const [currentSession, setCurrentSession] = useState<AdminUserSession>({
    id: 'guest',
    username: 'Khách',
    role: 'GUEST',
    authenticated: false,
  });

  const [permissions, setPermissions] = useState<PermissionDefinition>(ROLE_PERMISSIONS.GUEST);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setCurrentRole = (role: AdminRole) => {
    const isAuthed = role !== 'GUEST';
    setCurrentSession((prev) => ({
      ...prev,
      role,
      authenticated: isAuthed,
      username: isAuthed ? (prev.username === 'Khách' ? `Admin (${role})` : prev.username) : 'Khách',
    }));
    setPermissions(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.GUEST);
    addToast('info', 'RBAC Role Switch', `Đã chuyển sang vai trò: ${role}`);
  };

  // Permission Check Helpers
  const hasPerm = (perm: keyof PermissionDefinition): boolean => {
    if (!currentSession.authenticated || currentSession.role === 'GUEST') return false;
    return !!permissions[perm];
  };

  const checkPermissionOrToast = (perm: keyof PermissionDefinition, actionLabel: string): boolean => {
    if (!hasPerm(perm)) {
      addToast(
        'error',
        '⛔ TỪ CHỐI QUYỀN TRUY CẬP',
        `Chức vụ "${currentSession.role}" không có quyền thực hiện: "${actionLabel}". Yêu cầu quyền: [${perm}]`
      );
      return false;
    }
    return true;
  };

  // Keyboard shortcut Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch verified session from /api/auth/me on mount
  React.useEffect(() => {
    setIsLoadingAuth(true);
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.session && data.session.role !== 'GUEST') {
          setCurrentSession({
            ...data.session,
            authenticated: true,
          });
          setPermissions(data.permissions || ROLE_PERMISSIONS[data.session.role as AdminRole] || ROLE_PERMISSIONS.GUEST);
        } else {
          setCurrentSession({
            id: 'guest',
            username: data.session?.username || 'Khách',
            steamId: data.session?.steamId,
            role: 'GUEST',
            authenticated: !!data.session?.steamId, // Logged in with Steam but no BQT role
          });
          setPermissions(ROLE_PERMISSIONS.GUEST);
        }
      })
      .catch(() => {
        setCurrentSession({
          id: 'guest',
          username: 'Khách',
          role: 'GUEST',
          authenticated: false,
        });
        setPermissions(ROLE_PERMISSIONS.GUEST);
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });

    // Check for Steam Auth redirects
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('auth_success')) {
        const grantedRole = url.searchParams.get('role');
        if (grantedRole === 'GUEST') {
          addToast(
            'warning',
            'Xác thực Steam thành công nhưng không có quyền BQT',
            'Tài khoản của bạn chưa được cấp vai trò Ban Quản Trị trên server Discord ST25.'
          );
        } else {
          addToast(
            'success',
            'Đăng nhập Steam thành công!',
            `Đã kết nối tài khoản & nhận quyền hạn Ban Quản Trị (${grantedRole})`
          );
        }
        url.searchParams.delete('auth_success');
        url.searchParams.delete('role');
        window.history.replaceState({}, '', url.toString());
      } else if (url.searchParams.get('auth_error')) {
        addToast('error', 'Lỗi xác thực Steam', url.searchParams.get('auth_error') || '');
        url.searchParams.delete('auth_error');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      currentSession,
      setCurrentRole,
      permissions,
      hasPermission: hasPerm,
      checkPermissionOrToast,
      isLoadingAuth,
      toasts,
      addToast,
      removeToast,
      searchOpen,
      setSearchOpen,
    }),
    [currentSession, permissions, isLoadingAuth, toasts, searchOpen]
  );


  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={value}>
        {children}
        {/* Toast rendering portal */}
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-right ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                  : toast.type === 'error'
                  ? 'bg-red-950/90 border-red-500/40 text-red-200'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
                  : 'bg-zinc-900/90 border-cyan-500/40 text-cyan-200'
              }`}
            >
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.message && <p className="text-xs mt-1 opacity-90">{toast.message}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-3 text-xs opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </AppContext.Provider>
    </QueryClientProvider>
  );
}
