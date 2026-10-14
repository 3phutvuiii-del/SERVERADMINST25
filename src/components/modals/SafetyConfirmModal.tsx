'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface SafetyConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  requireMatchString?: string;
  confirmButtonText?: string;
  isDestructive?: boolean;
}

export function SafetyConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  requireMatchString,
  confirmButtonText = 'Xác nhận thực hiện',
  isDestructive = true,
}: SafetyConfirmModalProps) {
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const isMatched = !requireMatchString || inputText.trim() === requireMatchString.trim();

  const handleConfirm = () => {
    if (isMatched) {
      onConfirm();
      setInputText('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl glass-panel border border-red-500/30 p-6 shadow-2xl overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
              <p className="text-xs text-red-400/90 font-mono mt-0.5">YÊU CẦU XÁC THỰC QUẢN TRỊ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-zinc-300 leading-relaxed">{description}</p>

        {requireMatchString && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <p className="text-xs text-zinc-400 mb-1.5">
              Để xác nhận, vui lòng nhập chính xác chuỗi sau:
            </p>
            <code className="text-xs font-mono font-bold text-amber-400 select-all block bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
              {requireMatchString}
            </code>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Nhập "${requireMatchString}"...`}
              className="mt-3 w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
              autoFocus
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              setInputText('');
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isMatched}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              isMatched
                ? isDestructive
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
