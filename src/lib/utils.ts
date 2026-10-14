import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(seconds / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatPlaytime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function formatPercentage(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat().format(Math.round(val));
}

export const ST25_LOGO = '/images/logo/st25.png';
export const ST25_LOGO_ALT = '/images/logo/ST25-LOGO.png';

// Accurate Base Max Health values for The Isle dinosaur species
export const DINO_BASE_HEALTH: Record<string, number> = {
  tyrannosaurus: 5000,
  rex: 5000,
  't-rex': 5000,
  trex: 5000,
  deinosuchus: 4000,
  deino: 4000,
  triceratops: 4500,
  trike: 4500,
  stegosaurus: 4500,
  stego: 4500,
  allosaurus: 2800,
  allo: 2800,
  ceratosaurus: 1800,
  cera: 1800,
  carnotaurus: 1800,
  carno: 1800,
  diabloceratops: 2400,
  diablo: 2400,
  maiasaura: 2200,
  maia: 2200,
  tenontosaurus: 1600,
  teno: 1600,
  dilophosaurus: 1200,
  dilo: 1200,
  pachycephalosaurus: 1100,
  pachy: 1100,
  omniraptor: 750,
  raptor: 750,
  gallimimus: 800,
  galli: 800,
  herrerasaurus: 500,
  herrera: 500,
  pteranodon: 450,
  ptera: 450,
  dryosaurus: 350,
  dryo: 350,
  beipiaosaurus: 400,
  beipi: 400,
  troodon: 250,
  hypsilophodon: 180,
  hypsi: 180,
  austroraptor: 650,
  austro: 650,
  kentrosaurus: 2100,
  kentro: 2100,
};

export function getHealthDeducted(species: string, growth: number, damageDealt?: number): number {
  if (damageDealt && damageDealt > 0) {
    return Math.round(damageDealt);
  }
  const clean = (species || '').toLowerCase().trim();
  const base = DINO_BASE_HEALTH[clean] || 2000;
  const growthFactor = Math.max(0.2, Math.min(1.0, growth || 0.5));
  return Math.round(base * growthFactor);
}

export function getDinoSpeciesImage(speciesName: string): string {
  const clean = (speciesName || 'Allosaurus').trim().toLowerCase();

  // Mapping to user's organized folder: /images/details/<Species>.png
  const mapping: Record<string, string> = {
    allosaurus: '/images/details/Allosaurus.png',
    allo: '/images/details/Allosaurus.png',
    tyrannosaurus: '/images/details/Tyrannosaurus.png',
    rex: '/images/details/Tyrannosaurus.png',
    't-rex': '/images/details/Tyrannosaurus.png',
    trex: '/images/details/Tyrannosaurus.png',
    stegosaurus: '/images/details/Stegosaurus.png',
    stego: '/images/details/Stegosaurus.png',
    deinosuchus: '/images/details/Deinosuchus.png',
    deino: '/images/details/Deinosuchus.png',
    carnotaurus: '/images/details/Carnotaurus.png',
    carno: '/images/details/Carnotaurus.png',
    ceratosaurus: '/images/details/Ceratosaurus.png',
    cera: '/images/details/Ceratosaurus.png',
    diabloceratops: '/images/details/Diabloceratops.png',
    diablo: '/images/details/Diabloceratops.png',
    dilophosaurus: '/images/details/Dilophosaurus.png',
    dilo: '/images/details/Dilophosaurus.png',
    dryosaurus: '/images/details/Dryosaurus.png',
    dryo: '/images/details/Dryosaurus.png',
    gallimimus: '/images/details/Gallimimus.png',
    galli: '/images/details/Gallimimus.png',
    herrerasaurus: '/images/details/Herrerasaurus.png',
    herrera: '/images/details/Herrerasaurus.png',
    hypsilophodon: '/images/details/Hypsilophodon.png',
    hypsi: '/images/details/Hypsilophodon.png',
    kentrosaurus: '/images/details/Kentrosaurus.png',
    kentro: '/images/details/Kentrosaurus.png',
    maiasaura: '/images/details/Maiasaura.png',
    maia: '/images/details/Maiasaura.png',
    omniraptor: '/images/details/Omniraptor.png',
    raptor: '/images/details/Omniraptor.png',
    pachycephalosaurus: '/images/details/Pachycephalosaurus.png',
    pachy: '/images/details/Pachycephalosaurus.png',
    pteranodon: '/images/details/Pteranodon.png',
    ptera: '/images/details/Pteranodon.png',
    tenontosaurus: '/images/details/Tenontosaurus.png',
    teno: '/images/details/Tenontosaurus.png',
    triceratops: '/images/details/Triceratops.png',
    trike: '/images/details/Triceratops.png',
    troodon: '/images/details/troodon.png',
    austroraptor: '/images/details/Austroraptor.png',
    austro: '/images/details/Austroraptor.png',
    beipiaosaurus: '/images/details/Beipiaosaurus.png',
    beipi: '/images/details/Beipiaosaurus.png',
  };

  return mapping[clean] || '/images/details/Allosaurus.png';
}

export const KNOWN_SPECIES_LIST = [
  'Allosaurus',
  'Tyrannosaurus',
  'Triceratops',
  'Stegosaurus',
  'Deinosuchus',
  'Carnotaurus',
  'Ceratosaurus',
  'Diabloceratops',
  'Dilophosaurus',
  'Omniraptor',
  'Pteranodon',
  'Pachycephalosaurus',
  'Gallimimus',
  'Tenontosaurus',
  'Troodon',
  'Herrerasaurus',
  'Hypsilophodon',
  'Dryosaurus',
  'Beipiaosaurus',
];

export const TELEPORT_SAFE_ZONES = [
  { name: 'Song Delta (song delta)', id: 'cmuqxsxy809jko9016kge8xd7', x: -120500, y: 345000, z: -1500 },
  { name: 'Đầm Lầy T-Rex (dam lay Trex)', id: 'cmuqzirs901pgms01ww3tc39l', x: 45000, y: -210000, z: 200 },
  { name: 'Hồ Rock (Ho Rock)', id: 'cmuqy5st40b55pb013dbnuvtw', x: 198000, y: 125000, z: -800 },
  { name: 'Sông Rừng Dừa (Song Rung Dua)', id: 'cmuqyb5d400q8o001kc5zlv4w', x: -320000, y: 55000, z: -400 },
  { name: 'Đấu Trường (Dau Truong)', id: 'cmuqyjvzw00rdmi010iylrbc7', x: 10000, y: 15000, z: 3500 },
  { name: 'Hồ High Land (Ho Hight Land)', id: 'cmuqypqcj00w1rs0192jwbmef', x: -85000, y: -190000, z: 6200 },
  { name: 'Hồ Đấu Trường (ho dau truong)', id: 'cmur2r79f0x80pf011bxeffsn', x: 22000, y: 28000, z: 1200 },
  { name: 'Hồ Ông 5 (Ho Ong 5)', id: 'cmuqy1hy500jnmi01kkwcciax', x: -145000, y: -78000, z: 850 },
];
