import React from 'react';

export const COMPREHENSIVE_EVRIMA_MUTATIONS = [
  'Accelerated Prey Drive',
  'Absorptive Gut',
  'Cannibalistic',
  'Cellular Regeneration',
  'Congenital Hypoalgesia',
  'Efficient Digestion',
  'Endurance',
  'Epidermal Fibrosis',
  'Featherweight',
  'Gastronomic Regeneration',
  'Heightened Ghrelin',
  'Hematophagy',
  'Hemomania',
  'Hydrodynamic',
  'Hydroregenerative',
  'Hypermetabolic Inanition',
  'Hypervigilance',
  'Multichambered Lungs',
  'Nocturnal Sight',
  'Osteophagic',
  'Osteosclerosis',
  'Parthenogenesis',
  'Photoreceptive',
  'Photosynthetic Tissue',
  'Pneumatic Bones',
  'Prolific Reproduction',
  'Reabsorption',
  'Reniculate Kidneys',
  'Sclerocorneal',
  'Sequential Hermaphroditism',
  'Socialite',
  'Sustained Hydration',
  'Tactile Endurance',
  'Thick Hide',
  'Truculency',
  'Xenomorphic Instinct',
  'Xerocole Adaptation',
];

interface HexagonSlotProps {
  slotNumber: number;
  value: string | null;
  onClick: (e: React.MouseEvent) => void;
  isActiveGroup?: boolean;
}

export function HexagonSlot({
  slotNumber,
  value,
  onClick,
  isActiveGroup = false,
}: HexagonSlotProps) {
  const isFilled = !!value && value !== '-' && value !== 'None';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        title={isFilled ? value : `Slot ${slotNumber} (Trống)`}
        className={`relative transition-all duration-200 focus:outline-none flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 ${
          isActiveGroup ? 'w-24 h-20' : 'w-16 h-14'
        } ${
          isFilled
            ? 'bg-[#0e3b43] text-cyan-200 shadow-md shadow-cyan-950/40 border-2 border-[#16606d]'
            : 'bg-[#101726]/80 text-zinc-600 border border-zinc-800 hover:border-zinc-700'
        }`}
        style={{
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        }}
      >
        <span
          className={`font-semibold text-center leading-tight px-1 select-none line-clamp-2 ${
            isActiveGroup ? 'text-[11px]' : 'text-[9px]'
          } ${isFilled ? 'text-cyan-100 font-medium' : 'text-zinc-500'}`}
        >
          {isFilled ? value : '—'}
        </span>
      </button>

      <span className="text-[10px] font-mono text-zinc-500 font-bold">{slotNumber}</span>
    </div>
  );
}
