'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Megaphone,
  Clock,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  Power,
  RotateCw,
  Shuffle,
  CheckCircle2,
  AlertTriangle,
  History,
  Tag,
  Sliders,
  Copy,
  Info,
  Radio,
  FileText,
} from 'lucide-react';
import { useApp } from '@/components/providers/AppProviders';

interface AnnouncementTemplate {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'rules' | 'event' | 'maintenance' | 'discord';
  enabledForAuto: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface AutoAnnounceConfig {
  enabled: boolean;
  intervalMinutes: number;
  mode: 'sequential' | 'random';
  currentTemplateIndex: number;
  lastBroadcastAt?: string;
  nextBroadcastAt?: string;
}

interface BroadcastHistoryItem {
  id: string;
  content: string;
  source: 'manual' | 'auto';
  senderName: string;
  status: 'SUCCESS' | 'FAILED';
  sentAt: string;
}

interface AnnouncementsResponse {
  success: boolean;
  templates: AnnouncementTemplate[];
  config: AutoAnnounceConfig;
  history: BroadcastHistoryItem[];
}

const CATEGORY_MAP: Record<
  string,
  { label: string; color: string; border: string; bg: string }
> = {
  general: {
    label: 'Chung',
    color: 'text-zinc-300',
    border: 'border-zinc-700',
    bg: 'bg-zinc-800/60',
  },
  rules: {
    label: 'Luật Server',
    color: 'text-red-300',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
  },
  event: {
    label: 'Sự Kiện',
    color: 'text-amber-300',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  maintenance: {
    label: 'Bảo Trì',
    color: 'text-orange-300',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
  },
  discord: {
    label: 'Discord',
    color: 'text-indigo-300',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
  },
};

const QUICK_PREFIXES = [
  '[THÔNG BÁO]',
  '[LUẬT SERVER]',
  '[BẢO TRÌ]',
  '[SỰ KIỆN]',
  '[DISCORD]',
  '[CẢNH BÁO]',
];

export default function AnnouncementsPage() {
  const { addToast } = useApp();

  // 1. Fetch live data
  const { data, isLoading, refetch, isFetching } = useQuery<AnnouncementsResponse>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await fetch('/api/islepilot/announcements');
      if (!res.ok) throw new Error('Không thể tải dữ liệu thông báo');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const templates = data?.templates || [];
  const config = data?.config || {
    enabled: false,
    intervalMinutes: 15,
    mode: 'sequential',
    currentTemplateIndex: 0,
  };
  const history = data?.history || [];

  // Active Tab
  const [activeTab, setActiveTab] = useState<'templates' | 'auto' | 'history'>('templates');

  // Quick Broadcast input
  const [quickMessage, setQuickMessage] = useState('');
  const [isSendingQuick, setIsSendingQuick] = useState(false);

  // Filter templates
  const [templateSearch, setTemplateSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal Create/Edit Template
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AnnouncementTemplate | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<'general' | 'rules' | 'event' | 'maintenance' | 'discord'>('general');
  const [formEnabledForAuto, setFormEnabledForAuto] = useState(true);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Auto Broadcaster settings state
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const [intervalInput, setIntervalInput] = useState<number>(config.intervalMinutes || 15);
  const [isTriggeringNext, setIsTriggeringNext] = useState(false);

  // Sync interval input when config loads
  useEffect(() => {
    if (config?.intervalMinutes) {
      setIntervalInput(config.intervalMinutes);
    }
  }, [config?.intervalMinutes]);

  const [timeLeftStr, setTimeLeftStr] = useState<string>('--:--');

  useEffect(() => {
    if (!config?.enabled || !config?.nextBroadcastAt) {
      setTimeLeftStr('Đã tạm dừng');
      return;
    }

    const interval = setInterval(() => {
      const diff = new Date(config.nextBroadcastAt!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeftStr('Đang chuẩn bị gửi...');
      } else {
        const totalSec = Math.floor(diff / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        setTimeLeftStr(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [config?.enabled, config?.nextBroadcastAt]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (categoryFilter !== 'all' && tpl.category !== categoryFilter) return false;
      if (templateSearch.trim()) {
        const q = templateSearch.toLowerCase();
        return (
          tpl.title.toLowerCase().includes(q) || tpl.content.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [templates, categoryFilter, templateSearch]);

  // Handler: Quick Broadcast
  const handleQuickSend = async () => {
    if (!quickMessage.trim()) {
      addToast('warning', 'Vui lòng nhập nội dung thông báo');
      return;
    }
    setIsSendingQuick(true);
    try {
      const res = await fetch('/api/islepilot/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_now',
          payload: { message: quickMessage.trim() },
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        addToast('success', 'Đã phát loa thông báo thành công!', quickMessage);
        setQuickMessage('');
        refetch();
      } else {
        addToast('error', 'Gửi thông báo thất bại', resData.error || resData.message);
      }
    } catch (err: any) {
      addToast('error', 'Lỗi kết nối máy chủ', err.message);
    } finally {
      setIsSendingQuick(false);
    }
  };

  // Handler: Broadcast a specific template directly
  const handleSendTemplateNow = async (tpl: AnnouncementTemplate) => {
    const confirm = window.confirm(
      `Phát loa ngay mẫu: "${tpl.title}"?\n\nNội dung: ${tpl.content}`
    );
    if (!confirm) return;

    try {
      const res = await fetch('/api/islepilot/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_now',
          payload: { message: tpl.content },
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        addToast('success', `Đã phát loa mẫu "${tpl.title}" thành công!`, tpl.content);
        refetch();
      } else {
        addToast('error', 'Gửi thất bại', resData.error || resData.message);
      }
    } catch (err: any) {
      addToast('error', 'Lỗi kết nối', err.message);
    }
  };

  // Handler: Open modal for Add/Edit
  const handleOpenAddTemplate = () => {
    setEditingTemplate(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('general');
    setFormEnabledForAuto(true);
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: AnnouncementTemplate) => {
    setEditingTemplate(tpl);
    setFormTitle(tpl.title);
    setFormContent(tpl.content);
    setFormCategory(tpl.category);
    setFormEnabledForAuto(tpl.enabledForAuto);
    setIsTemplateModalOpen(true);
  };

  // Handler: Save Template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      addToast('warning', 'Vui lòng điền đầy đủ tiêu đề và nội dung');
      return;
    }
    setIsSavingTemplate(true);
    try {
      const res = await fetch('/api/islepilot/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_template',
          payload: {
            id: editingTemplate?.id,
            title: formTitle.trim(),
            content: formContent.trim(),
            category: formCategory,
            enabledForAuto: formEnabledForAuto,
          },
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        addToast(
          'success',
          editingTemplate ? 'Đã cập nhật mẫu thông báo!' : 'Đã tạo mẫu mới!',
          formTitle
        );
        setIsTemplateModalOpen(false);
        refetch();
      } else {
        addToast('error', 'Lưu mẫu thất bại', resData.error);
      }
    } catch (err: any) {
      addToast('error', 'Lỗi kết nối', err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Handler: Delete Template
  const handleDeleteTemplate = async (tpl: AnnouncementTemplate) => {
    const confirm = window.confirm(`Bạn có chắc chắn muốn xóa mẫu: "${tpl.title}"?`);
    if (!confirm) return;

    try {
      const res = await fetch('/api/islepilot/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_template',
          payload: { id: tpl.id },
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        addToast('info', 'Đã xóa mẫu thông báo', tpl.title);
        refetch();
      } else {
        addToast('error', 'Xóa thất bại', resData.error);
      }
    } catch (err: any) {
      addToast('error', 'Lỗi kết nối', err.message);
    }
  };

  // Handler: Toggle template auto inclusion directly
  const handleToggleTemplateAuto = async (tpl: AnnouncementTemplate) => {
    try {
      const res = await fetch('/api/islepilot/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_template',
          payload: {
            ...tpl,
            enabledForAuto: !tpl.enabledForAuto,
          },
        }),
      });
      if (res.ok) {
        addToast(
          'info',
          !tpl.enabledForAuto
            ? `Đã bật tự động phát cho "${tpl.title}"`
            : `Đã tắt tự động phát cho "${tpl.title}"`
        );
        refetch();
      }
    } catch (err: any) {
      addToast('error', 'Lỗi kết nối', err.message);
    }
  };

  // Handler: Toggle Auto Announcer Enabled / Disabled
  const handleToggleAutoAnnouncer = async () => {
    setIsUpdatingConfig(true);
    const newEnabled = !config.enabled;
    try {
      const res = await fetch('/api/islepilot/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          payload: {
            enabled: newEnabled,
            intervalMinutes: intervalInput,
          },
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        addToast(
          newEnabled ? 'success' : 'info',
          newEnabled
            ? 'Đã BẬT chế độ tự động phát thông báo!'
            : 'Đã TẮT chế độ tự động phát thông báo!',
          `Chu kỳ mỗi ${intervalInput} phút.`
        );
        refetch();
      } else {
        addToast('error', 'Cập nhật cấu hình thất bại', resData.error);
      }
    } catch (err: any) {
      addToast('error', 'Lỗi kết nối', err.message);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  // Handler: Save Interval & Mode settings
  const handleSaveAutoSettings = async (mode?: 'sequential' | 'random') => {
    setIsUpdatingConfig(true);
    try {
      const res = await fetch('/api/islepilot/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          payload: {
            intervalMinutes: intervalInput,
            mode: mode || config.mode,
          },
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        addToast('success', 'Đã lưu cấu hình chu kỳ tự động!', `Mỗi ${intervalInput} phút.`);
        refetch();
      }
    } catch (err: any) {
      addToast('error', 'Lỗi kết nối', err.message);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  // Handler: Trigger Next Broadcast Right Now
  const handleTriggerNextNow = async () => {
    setIsTriggeringNext(true);
    try {
      const res = await fetch('/api/islepilot/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_next',
        }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        addToast('success', 'Đã phát loa mẫu tự động tiếp theo!', resData.content);
        refetch();
      } else {
        addToast('error', 'Lỗi kích hoạt', resData.error || resData.message);
      }
    } catch (err: any) {
      addToast('error', 'Lỗi kết nối', err.message);
    } finally {
      setIsTriggeringNext(false);
    }
  };

  // Handler: Clear history
  const handleClearHistory = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa sạch toàn bộ nhật ký phát loa?')) return;
    try {
      const res = await fetch('/api/islepilot/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_history' }),
      });
      if (res.ok) {
        addToast('info', 'Đã xóa toàn bộ lịch sử phát loa');
        refetch();
      }
    } catch (err: any) {
      addToast('error', 'Lỗi kết nối', err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl glass-panel border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Megaphone className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-xl font-black text-white tracking-wide uppercase">
              Quản Lý Thông Báo & Phát Loa Tự Động
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${config.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
            >
              {config.enabled ? 'AUTO ĐANG BẬT' : 'AUTO ĐANG TẮT'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Tạo và lưu trữ các mẫu thông báo (Templates), thiết lập chu kỳ tự động phát tin sau mỗi X phút
            trong game, và theo dõi lịch sử phát loa in-game trên toàn máy chủ ST25 VIETNAM.
          </p>
        </div>

        {/* Quick Auto Status Widget */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-right">
            <p className="text-[10px] text-zinc-400 font-mono">Lần gửi tiếp theo:</p>
            <p className="text-sm font-bold font-mono text-emerald-400">{timeLeftStr}</p>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition flex items-center justify-center"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Quick Broadcast Box (Gửi Thông Báo Tức Thì) */}
      <div className="p-5 rounded-2xl glass-panel border border-zinc-800 bg-zinc-950/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Phát Loa Tức Thì (Instant In-Game Broadcast)
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {quickMessage.length} / 200 ký tự
          </span>
        </div>

        {/* Prefix quick-insert chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-zinc-400 mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-zinc-500" /> Chèn tiền tố:
          </span>
          {QUICK_PREFIXES.map((prefix) => (
            <button
              key={prefix}
              type="button"
              onClick={() => {
                if (!quickMessage.startsWith(prefix)) {
                  setQuickMessage((prev) => `${prefix} ${prev}`.trim());
                }
              }}
              className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] font-mono transition"
            >
              {prefix}
            </button>
          ))}
        </div>

        {/* Text input and send row */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickMessage}
              maxLength={200}
              onChange={(e) => setQuickMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickSend();
              }}
              placeholder="Nhập nội dung thông báo gửi toàn server (VD: [THÔNG BÁO] Server chuẩn bị restart sau 10 phút)..."
              className="w-full h-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="button"
            disabled={isSendingQuick || !quickMessage.trim()}
            onClick={handleQuickSend}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            {isSendingQuick ? 'Đang phát...' : 'Phát Loa Ngay'}
          </button>
        </div>

        {/* The Isle in-game chat preview */}
        {quickMessage.trim() && (
          <div className="p-2.5 rounded-xl bg-[#090d16] border border-zinc-800 text-xs font-mono flex items-center gap-2.5">
            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              In-Game Chat Preview
            </span>
            <span className="text-yellow-300 font-medium">
              [Server Broadcast]: {quickMessage}
            </span>
          </div>
        )}
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${activeTab === 'templates'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-zinc-800/80'
            }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Danh Sách Mẫu Thông Báo</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">
            {templates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('auto')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${activeTab === 'auto'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-zinc-800/80'
            }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Cấu Hình Tự Động (Auto-Announcer)</span>
          <span
            className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
              }`}
          />
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-zinc-800/80'
            }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Nhật Ký Phát Loa ({history.length})</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: TEMPLATES MANAGEMENT
         ======================================================== */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {/* Toolbar: Search, Category Filter, and Add Template */}
          <div className="p-3.5 rounded-xl glass-panel border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Tìm kiếm mẫu thông báo theo tiêu đề hoặc nội dung..."
                  className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Tất cả danh mục</option>
                <option value="general">Chung</option>
                <option value="rules">Luật Server</option>
                <option value="event">Sự Kiện</option>
                <option value="discord">Discord</option>
                <option value="maintenance">Bảo Trì</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddTemplate}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo Mẫu Thông Báo Mới
            </button>
          </div>

          {/* Templates Grid */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-zinc-500 animate-pulse">
              Đang tải danh sách mẫu thông báo...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-zinc-900/30 border border-zinc-800 space-y-2">
              <Megaphone className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">Không tìm thấy mẫu thông báo nào</p>
              <p className="text-xs text-zinc-500">
                Bấm vào nút &quot;Tạo Mẫu Thông Báo Mới&quot; để thêm các thông điệp mẫu cho máy chủ.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((tpl) => {
                const catInfo = CATEGORY_MAP[tpl.category] || CATEGORY_MAP.general;
                return (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between gap-3 group relative overflow-hidden"
                  >
                    <div>
                      {/* Top Bar: Title & Category & Auto Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${catInfo.bg} ${catInfo.color} ${catInfo.border}`}
                            >
                              {catInfo.label}
                            </span>
                            <h3 className="text-sm font-bold text-white tracking-wide">
                              {tpl.title}
                            </h3>
                          </div>
                        </div>

                        {/* Auto-announce toggle chip */}
                        <button
                          type="button"
                          onClick={() => handleToggleTemplateAuto(tpl)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition flex items-center gap-1 ${tpl.enabledForAuto
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                            }`}
                          title="Click để bật/tắt mẫu này trong danh sách tự động phát loa"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${tpl.enabledForAuto ? 'bg-emerald-400' : 'bg-zinc-500'
                              }`}
                          />
                          {tpl.enabledForAuto ? 'Auto: BẬT' : 'Auto: TẮT'}
                        </button>
                      </div>

                      {/* Content Box */}
                      <div className="mt-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 font-mono text-xs text-yellow-300/90 leading-relaxed select-all">
                        {tpl.content}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(tpl.content);
                            addToast('info', 'Đã copy nội dung vào clipboard');
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                          title="Copy nội dung"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickMessage(tpl.content)}
                          className="px-2 py-1 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                          title="Nạp vào ô soạn nhanh"
                        >
                          Nạp ô soạn
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTemplate(tpl)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                          title="Sửa mẫu"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                          title="Xóa mẫu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendTemplateNow(tpl)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
                          title="Phát loa mẫu này ngay lập tức"
                        >
                          <Send className="w-3 h-3" />
                          Phát Mẫu Này
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: AUTO-BROADCASTER CONFIGURATION
         ======================================================== */}
      {activeTab === 'auto' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Master Switch & Status */}
            <div className="p-5 rounded-2xl glass-panel border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Công Tắc Tự Động
                  </span>
                  <Power
                    className={`w-5 h-5 ${config.enabled ? 'text-emerald-400 animate-pulse' : 'text-zinc-600'
                      }`}
                  />
                </div>
                <h3 className="text-base font-bold text-white mt-2">
                  {config.enabled ? 'ĐANG PHÁT TỰ ĐỘNG' : 'ĐANG TẠM DỪNG'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Khi bật, hệ thống sẽ tự động lấy các mẫu thông báo đã chọn để phát loa in-game theo chu kỳ thời gian đã đặt.
                </p>
              </div>

              <button
                type="button"
                disabled={isUpdatingConfig}
                onClick={handleToggleAutoAnnouncer}
                className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg ${config.enabled
                    ? 'bg-red-600/80 hover:bg-red-600 text-white shadow-red-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
              >
                <Power className="w-4 h-4" />
                {config.enabled ? 'TẮT TỰ ĐỘNG PHÁT LOA' : 'BẬT TỰ ĐỘNG PHÁT LOA'}
              </button>
            </div>

            {/* Interval Configuration */}
            <div className="p-5 rounded-2xl glass-panel border border-zinc-800 bg-zinc-950/60 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Chu Kỳ Tự Động Phát Loa (Interval Minutes)
                  </span>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Khoảng thời gian nghỉ giữa mỗi lần gửi thông báo tự động.
                  </p>
                </div>
                <span className="text-lg font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                  {intervalInput} Phút
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-zinc-400 mr-1">Chọn nhanh:</span>
                {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      setIntervalInput(mins);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition ${intervalInput === mins
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* Mode Selection */}
              <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-zinc-400">Chế độ chọn mẫu:</span>
                  <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSaveAutoSettings('sequential')}
                      className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${config.mode === 'sequential'
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                      <RotateCw className="w-3 h-3" />
                      Tuần Tự (Xoay Vòng)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAutoSettings('random')}
                      className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${config.mode === 'random'
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                      <Shuffle className="w-3 h-3" />
                      Ngẫu Nhiên
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUpdatingConfig}
                    onClick={() => handleSaveAutoSettings()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
                  >
                    Lưu Chu Kỳ ({intervalInput} Phút)
                  </button>

                  <button
                    type="button"
                    disabled={isTriggeringNext}
                    onClick={handleTriggerNextNow}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5"
                    title="Bỏ qua chờ và gửi mẫu tiếp theo ngay"
                  >
                    <Send className="w-3 h-3 text-emerald-400" />
                    Gửi Mẫu Kế Tiếp Ngay
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* List of Templates Active in Auto Mode */}
          <div className="p-5 rounded-2xl glass-panel border border-zinc-800 bg-zinc-950/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Danh Sách Mẫu Đang Tham Gia Tự Động Phát Loa
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Chỉ các mẫu có trạng thái &quot;Auto: BẬT&quot; mới được hệ thống lựa chọn để gửi tự động.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                {templates.filter((t) => t.enabledForAuto).length} / {templates.length} Mẫu kích hoạt
              </span>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {templates.map((tpl, idx) => (
                <div
                  key={tpl.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-zinc-900/30 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-zinc-500 text-[11px] w-6">#{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleTemplateAuto(tpl)}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition ${tpl.enabledForAuto
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-zinc-700 bg-zinc-900 text-transparent'
                        }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{tpl.title}</p>
                      <p className="font-mono text-[11px] text-zinc-400 truncate max-w-xl">
                        {tpl.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${tpl.enabledForAuto
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                        }`}
                    >
                      {tpl.enabledForAuto ? 'ĐANG KÍCH HOẠT' : 'TẠM TẮT'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: BROADCAST HISTORY
         ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl glass-panel border border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Lịch Sử Phát Loa Server (Broadcast Audit Trail)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ghi nhận toàn bộ thông điệp đã phát ra toàn máy chủ, cả thủ công và tự động.
              </p>
            </div>

            <button
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs text-zinc-300 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
              Xóa Lịch Sử
            </button>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-zinc-900/30 border border-zinc-800 text-xs text-zinc-500">
              Chưa có thông báo nào được ghi nhận trong lịch sử.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start justify-between gap-4 text-xs font-mono"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full border ${item.source === 'auto'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          }`}
                      >
                        {item.source === 'auto' ? 'AUTO-BOT' : 'THỦ CÔNG'}
                      </span>
                      <span className="text-zinc-400 text-[11px] font-sans">
                        Người gửi: <strong className="text-white">{item.senderName}</strong>
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-500 text-[11px]">
                        {new Date(item.sentAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <p className="text-yellow-300 text-xs font-medium pl-1 break-words select-all">
                      {item.content}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${item.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL: ADD / EDIT ANNOUNCEMENT TEMPLATE
         ======================================================== */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl glass-panel border border-zinc-700 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-400" />
                {editingTemplate ? 'Chỉnh Sửa Mẫu Thông Báo' : 'Tạo Mẫu Thông Báo Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-zinc-500 hover:text-white text-xs font-mono"
              >
                ✕ Đóng
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  Tiêu Đề / Tên Mẫu (Ghi nhớ nội bộ):
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="VD: Nhắc nhở Discord, Quy tắc Mixpack..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  Danh Mục Phân Loại:
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="general">Chung (General)</option>
                  <option value="rules">Luật Server (Rules)</option>
                  <option value="event">Sự Kiện (Event)</option>
                  <option value="discord">Discord & Cộng đồng</option>
                  <option value="maintenance">Bảo Trì (Maintenance)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400 font-semibold">
                    Nội Dung Phát Loa In-Game:
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {formContent.length} / 200 ký tự
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={200}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="[ST25] Nhập thông điệp hiển thị trong The Isle chat..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Bật trong chế độ tự động phát loa</p>
                  <p className="text-[11px] text-zinc-400">
                    Khi bật, hệ thống Auto-Announcer sẽ xoay vòng gửi mẫu này.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formEnabledForAuto}
                  onChange={(e) => setFormEnabledForAuto(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingTemplate}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/20"
                >
                  {isSavingTemplate ? 'Đang lưu...' : 'Lưu Mẫu Thông Báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
