'use client';

import React, { useState } from 'react';
import { MapPin, X, Navigation } from 'lucide-react';
import { TELEPORT_SAFE_ZONES } from '@/lib/utils';
import { IslePilotPlayer } from '@/types/islepilot';

interface TeleportModalProps {
  player: IslePilotPlayer;
  isOpen: boolean;
  onClose: () => void;
  onTeleport: (coords: { x: number; y: number; z: number; name?: string }) => void;
}

export function TeleportModal({ player, isOpen, onClose, onTeleport }: TeleportModalProps) {
  const [customX, setCustomX] = useState<number>(0);
  const [customY, setCustomY] = useState<number>(0);
  const [customZ, setCustomZ] = useState<number>(1000);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl glass-panel border border-cyan-500/40 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dịch chuyển người chơi (Teleport)</h3>
              <p className="text-xs text-zinc-400">
                Mục tiêu: <span className="text-cyan-400 font-semibold">{player.name}</span> ({player.steamId})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current position */}
        {player.position && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Tọa độ hiện tại:</span>
            <span className="text-emerald-400 font-semibold">
              X: {Math.round(player.position.x)} | Y: {Math.round(player.position.y)} | Z: {Math.round(player.position.z)}
            </span>
          </div>
        )}

        {/* Predefined safe zones */}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Điểm đến an toàn định sẵn (Safe Zones)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TELEPORT_SAFE_ZONES.map((zone) => (
              <button
                key={zone.name}
                onClick={() => {
                  onTeleport(zone);
                  onClose();
                }}
                className="flex items-start gap-2 p-3 rounded-xl bg-zinc-900/80 hover:bg-cyan-500/10 border border-zinc-800 hover:border-cyan-500/30 text-left transition group"
              >
                <MapPin className="w-4 h-4 text-cyan-400 mt-0.5 group-hover:scale-110 transition" />
                <div>
                  <p className="text-xs font-bold text-zinc-200 group-hover:text-cyan-300">
                    {zone.name}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    {zone.x}, {zone.y}, {zone.z}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom manual coordinates */}
        <div className="mt-5 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <p className="text-xs font-semibold text-zinc-300 mb-2">Tọa độ thủ công (X, Y, Z)</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400 uppercase font-mono">X</label>
              <input
                type="number"
                value={customX}
                onChange={(e) => setCustomX(Number(e.target.value))}
                className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 uppercase font-mono">Y</label>
              <input
                type="number"
                value={customY}
                onChange={(e) => setCustomY(Number(e.target.value))}
                className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 uppercase font-mono">Z</label>
              <input
                type="number"
                value={customZ}
                onChange={(e) => setCustomZ(Number(e.target.value))}
                className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white font-mono"
              />
            </div>
          </div>

          <button
            onClick={() => {
              onTeleport({ x: customX, y: customY, z: customZ, name: 'Custom Coords' });
              onClose();
            }}
            className="mt-3 w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/20"
          >
            <Navigation className="w-3.5 h-3.5" />
            Teleport đến tọa độ tùy chỉnh
          </button>
        </div>
      </div>
    </div>
  );
}
