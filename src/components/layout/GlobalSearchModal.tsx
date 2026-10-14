'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/providers/AppProviders';
import { useRouter } from 'next/navigation';
import { Search, User, Shield, Crosshair, MapPin, X, ArrowRight } from 'lucide-react';
import { KNOWN_SPECIES_LIST, TELEPORT_SAFE_ZONES } from '@/lib/utils';

export function GlobalSearchModal() {
  const { searchOpen, setSearchOpen } = useApp();
  const [query, setQuery] = useState('');
  const router = useRouter();

  if (!searchOpen) return null;

  const filteredSpecies = KNOWN_SPECIES_LIST.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredZones = TELEPORT_SAFE_ZONES.filter((z) =>
    z.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectPlayerSearch = () => {
    if (query) {
      router.push(`/players?search=${encodeURIComponent(query)}`);
      setSearchOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl glass-panel border border-emerald-500/30 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-800 bg-zinc-950/60">
          <Search className="w-5 h-5 text-emerald-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm theo SteamID64, Tên người chơi, Loài khủng long, Tọa độ..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSelectPlayerSearch();
              if (e.key === 'Escape') setSearchOpen(false);
            }}
          />
          <kbd className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded font-mono border border-zinc-700">
            ESC
          </kbd>
          <button
            onClick={() => setSearchOpen(false)}
            className="ml-3 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {query.trim().length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Hành động nhanh
              </p>
              <button
                onClick={handleSelectPlayerSearch}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 transition text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>
                    Tìm kiếm hồ sơ người chơi có từ khóa: <strong className="text-white">"{query}"</strong>
                  </span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Species */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Loài khủng long trong server
            </p>
            <div className="grid grid-cols-2 gap-2">
              {filteredSpecies.map((spec) => (
                <button
                  key={spec}
                  onClick={() => {
                    router.push(`/garage?species=${encodeURIComponent(spec)}`);
                    setSearchOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 text-xs text-zinc-200 transition text-left"
                >
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{spec}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Teleport zones */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Khu vực an toàn & Tọa độ Teleport
            </p>
            <div className="space-y-1.5">
              {filteredZones.map((zone) => (
                <div
                  key={zone.name}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/50 text-xs text-zinc-300"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{zone.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500">
                    ID: {zone.id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
