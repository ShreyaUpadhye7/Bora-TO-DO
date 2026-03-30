// BTS BT21 character pets - one per member
export interface PetType {
  id: string;
  name: string;
  member: string;
  emoji: string;
  color: string;
  personality: string;
  // Pixel art frames for each evolution stage
  stages: PetStage[];
}

export interface PetStage {
  name: string;
  minLevel: number;
  pixels: string[][]; // 2D array of color codes for pixel art
}

export interface PetStats {
  hunger: number;
  happiness: number;
  cleanliness: number;
  energy: number;
  xp: number;
  level: number;
  coins: number;
}

export interface PetAction {
  id: string;
  label: string;
  emoji: string;
  stat: keyof Pick<PetStats, 'hunger' | 'happiness' | 'cleanliness' | 'energy'>;
  amount: number;
  cost: number;
  cooldownMs: number;
}

export const PET_ACTIONS: PetAction[] = [
  { id: 'feed', label: 'Feed', emoji: '🍜', stat: 'hunger', amount: 25, cost: 5, cooldownMs: 30000 },
  { id: 'play', label: 'Play', emoji: '🎮', stat: 'happiness', amount: 20, cost: 3, cooldownMs: 20000 },
  { id: 'clean', label: 'Bath', emoji: '🛁', stat: 'cleanliness', amount: 30, cost: 4, cooldownMs: 45000 },
  { id: 'sleep', label: 'Sleep', emoji: '💤', stat: 'energy', amount: 35, cost: 0, cooldownMs: 60000 },
  { id: 'treat', label: 'Treat', emoji: '🍰', stat: 'happiness', amount: 15, cost: 8, cooldownMs: 15000 },
  { id: 'music', label: 'Music', emoji: '🎵', stat: 'happiness', amount: 10, cost: 2, cooldownMs: 10000 },
];

// Color palette for pixel pets
const C = {
  _: 'transparent',
  W: '#FFFFFF',
  B: '#1a1a2e',
  P: '#c084fc', // purple
  Pk: '#f9a8d4', // pink
  Y: '#fde047', // yellow
  Bl: '#60a5fa', // blue
  G: '#4ade80', // green
  O: '#fb923c', // orange
  R: '#f87171', // red
  Br: '#a16207', // brown
  Gy: '#9ca3af', // gray
  LB: '#93c5fd', // light blue
  LP: '#d8b4fe', // light purple
  LPk: '#fbcfe8', // light pink
  Cr: '#fef3c7', // cream
};

function makePet(
  id: string, name: string, member: string, emoji: string, color: string, personality: string,
  babyPixels: string[][], teenPixels: string[][], adultPixels: string[][]
): PetType {
  return {
    id, name, member, emoji, color, personality,
    stages: [
      { name: 'Baby', minLevel: 1, pixels: babyPixels },
      { name: 'Teen', minLevel: 5, pixels: teenPixels },
      { name: 'Star', minLevel: 10, pixels: adultPixels },
    ],
  };
}

// Cute 8x8 pixel art for each pet at 3 stages
export const PET_TYPES: PetType[] = [
  makePet('koya', 'Koya', 'RM', '🐨', '#c084fc', 'Sleepy & wise',
    // Baby Koya - simple koala face
    [
      [C._,C._,C.P,C.P,C._,C._,C.P,C.P],
      [C._,C.P,C.LP,C.LP,C.P,C.P,C.LP,C.LP],
      [C._,C._,C.LP,C.LP,C.LP,C.LP,C.LP,C._],
      [C._,C._,C.LP,C.B,C.LP,C.LP,C.B,C._],
      [C._,C._,C._,C.LP,C.Bl,C.LP,C._,C._],
      [C._,C._,C._,C.LP,C.LP,C.LP,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
    ],
    // Teen Koya
    [
      [C._,C.P,C.P,C._,C._,C.P,C.P,C._],
      [C.P,C.LP,C.LP,C.P,C.P,C.LP,C.LP,C.P],
      [C._,C.LP,C.LP,C.LP,C.LP,C.LP,C.LP,C._],
      [C._,C.LP,C.B,C.LP,C.LP,C.B,C.LP,C._],
      [C._,C._,C.LP,C.LP,C.Bl,C.LP,C._,C._],
      [C._,C._,C.LP,C.LP,C.LP,C.LP,C._,C._],
      [C._,C._,C._,C.LP,C.LP,C._,C._,C._],
      [C._,C._,C.LP,C._,C._,C.LP,C._,C._],
    ],
    // Adult Koya - with crown
    [
      [C._,C._,C.Y,C.Y,C.Y,C.Y,C._,C._],
      [C._,C.P,C.P,C.Y,C.Y,C.P,C.P,C._],
      [C.P,C.LP,C.LP,C.LP,C.LP,C.LP,C.LP,C.P],
      [C._,C.LP,C.B,C.LP,C.LP,C.B,C.LP,C._],
      [C._,C.LP,C.LP,C.Bl,C.Bl,C.LP,C.LP,C._],
      [C._,C._,C.LP,C.LP,C.LP,C.LP,C._,C._],
      [C._,C._,C.P,C.LP,C.LP,C.P,C._,C._],
      [C._,C._,C.LP,C._,C._,C.LP,C._,C._],
    ]
  ),
  makePet('rj', 'RJ', 'Jin', '🦙', '#fde047', 'Foodie & cheerful',
    [
      [C._,C._,C.Cr,C.Cr,C.Cr,C.Cr,C._,C._],
      [C._,C.Cr,C.W,C.W,C.W,C.W,C.Cr,C._],
      [C._,C.W,C.B,C.W,C.W,C.B,C.W,C._],
      [C._,C.W,C.W,C.W,C.W,C.W,C.W,C._],
      [C._,C._,C.W,C.Pk,C.Pk,C.W,C._,C._],
      [C._,C._,C._,C.W,C.W,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
    ],
    [
      [C._,C.Cr,C.Cr,C.Cr,C.Cr,C.Cr,C.Cr,C._],
      [C.Cr,C.W,C.W,C.W,C.W,C.W,C.W,C.Cr],
      [C._,C.W,C.B,C.W,C.W,C.B,C.W,C._],
      [C._,C.W,C.W,C.W,C.W,C.W,C.W,C._],
      [C._,C._,C.W,C.Pk,C.Pk,C.W,C._,C._],
      [C._,C._,C.W,C.W,C.W,C.W,C._,C._],
      [C._,C._,C._,C.W,C.W,C._,C._,C._],
      [C._,C._,C.W,C._,C._,C.W,C._,C._],
    ],
    [
      [C._,C.Y,C._,C.Y,C.Y,C._,C.Y,C._],
      [C._,C.Cr,C.Cr,C.Cr,C.Cr,C.Cr,C.Cr,C._],
      [C.Cr,C.W,C.W,C.W,C.W,C.W,C.W,C.Cr],
      [C._,C.W,C.B,C.W,C.W,C.B,C.W,C._],
      [C._,C.W,C.W,C.Pk,C.Pk,C.W,C.W,C._],
      [C._,C._,C.W,C.W,C.W,C.W,C._,C._],
      [C._,C._,C.R,C.W,C.W,C.R,C._,C._],
      [C._,C._,C.W,C._,C._,C.W,C._,C._],
    ]
  ),
  makePet('shooky', 'Shooky', 'Suga', '🍪', '#a16207', 'Cool & mischievous',
    [
      [C._,C._,C.Br,C.Br,C.Br,C.Br,C._,C._],
      [C._,C.Br,C.O,C.O,C.O,C.O,C.Br,C._],
      [C._,C.O,C.B,C.O,C.O,C.B,C.O,C._],
      [C._,C.O,C.O,C.O,C.O,C.O,C.O,C._],
      [C._,C._,C.O,C.B,C.B,C.O,C._,C._],
      [C._,C._,C._,C.O,C.O,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
    ],
    [
      [C._,C.Br,C.Br,C.Br,C.Br,C.Br,C.Br,C._],
      [C.Br,C.O,C.O,C.O,C.O,C.O,C.O,C.Br],
      [C._,C.O,C.B,C.O,C.O,C.B,C.O,C._],
      [C._,C.O,C.O,C.O,C.O,C.O,C.O,C._],
      [C._,C._,C.O,C.B,C.B,C.O,C._,C._],
      [C._,C._,C.O,C.O,C.O,C.O,C._,C._],
      [C._,C._,C._,C.O,C.O,C._,C._,C._],
      [C._,C._,C.O,C._,C._,C.O,C._,C._],
    ],
    [
      [C._,C.Gy,C.Gy,C._,C._,C.Gy,C.Gy,C._],
      [C._,C.Br,C.Br,C.Br,C.Br,C.Br,C.Br,C._],
      [C.Br,C.O,C.O,C.O,C.O,C.O,C.O,C.Br],
      [C._,C.O,C.B,C.O,C.O,C.B,C.O,C._],
      [C._,C.O,C.O,C.B,C.B,C.O,C.O,C._],
      [C._,C._,C.O,C.O,C.O,C.O,C._,C._],
      [C._,C._,C.B,C.O,C.O,C.B,C._,C._],
      [C._,C._,C.O,C._,C._,C.O,C._,C._],
    ]
  ),
  makePet('mang', 'Mang', 'J-Hope', '🐴', '#fb923c', 'Dancing & energetic',
    [
      [C._,C._,C._,C.Bl,C.Bl,C._,C._,C._],
      [C._,C._,C.Bl,C.LB,C.LB,C.Bl,C._,C._],
      [C._,C.Bl,C.LB,C.LB,C.LB,C.LB,C.Bl,C._],
      [C._,C.LB,C.B,C.LB,C.LB,C.B,C.LB,C._],
      [C._,C._,C.LB,C.LB,C.LB,C.LB,C._,C._],
      [C._,C._,C._,C.LB,C.LB,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
    ],
    [
      [C._,C._,C.Bl,C.Bl,C.Bl,C.Bl,C._,C._],
      [C._,C.Bl,C.LB,C.LB,C.LB,C.LB,C.Bl,C._],
      [C._,C.LB,C.B,C.LB,C.LB,C.B,C.LB,C._],
      [C._,C.LB,C.LB,C.LB,C.LB,C.LB,C.LB,C._],
      [C._,C._,C.LB,C.Pk,C.LB,C.LB,C._,C._],
      [C._,C._,C.LB,C.LB,C.LB,C.LB,C._,C._],
      [C._,C._,C._,C.LB,C.LB,C._,C._,C._],
      [C._,C._,C.LB,C._,C._,C.LB,C._,C._],
    ],
    [
      [C._,C.O,C._,C._,C._,C._,C.O,C._],
      [C._,C._,C.Bl,C.Bl,C.Bl,C.Bl,C._,C._],
      [C._,C.Bl,C.LB,C.LB,C.LB,C.LB,C.Bl,C._],
      [C._,C.LB,C.B,C.LB,C.LB,C.B,C.LB,C._],
      [C._,C.LB,C.LB,C.Pk,C.LB,C.LB,C.LB,C._],
      [C._,C._,C.LB,C.LB,C.LB,C.LB,C._,C._],
      [C._,C._,C.O,C.LB,C.LB,C.O,C._,C._],
      [C._,C._,C.LB,C._,C._,C.LB,C._,C._],
    ]
  ),
  makePet('chimmy', 'Chimmy', 'Jimin', '🐶', '#fde047', 'Sweet & hardworking',
    [
      [C._,C._,C.Y,C._,C._,C.Y,C._,C._],
      [C._,C.Y,C.Y,C.Y,C.Y,C.Y,C.Y,C._],
      [C._,C.Y,C.B,C.Y,C.Y,C.B,C.Y,C._],
      [C._,C.Y,C.Y,C.Y,C.Y,C.Y,C.Y,C._],
      [C._,C._,C.Y,C.R,C.R,C.Y,C._,C._],
      [C._,C._,C._,C.Y,C.Y,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
    ],
    [
      [C._,C.Y,C.Y,C._,C._,C.Y,C.Y,C._],
      [C.Y,C.Y,C.Y,C.Y,C.Y,C.Y,C.Y,C.Y],
      [C._,C.Y,C.B,C.Y,C.Y,C.B,C.Y,C._],
      [C._,C.Y,C.Y,C.Y,C.Y,C.Y,C.Y,C._],
      [C._,C._,C.Y,C.R,C.R,C.Y,C._,C._],
      [C._,C._,C.R,C.Y,C.Y,C.R,C._,C._],
      [C._,C._,C._,C.Y,C.Y,C._,C._,C._],
      [C._,C._,C.Y,C._,C._,C.Y,C._,C._],
    ],
    [
      [C._,C.R,C.R,C.R,C.R,C.R,C.R,C._],
      [C._,C.Y,C.Y,C.Y,C.Y,C.Y,C.Y,C._],
      [C.Y,C.Y,C.B,C.Y,C.Y,C.B,C.Y,C.Y],
      [C._,C.Y,C.Y,C.Y,C.Y,C.Y,C.Y,C._],
      [C._,C._,C.Y,C.R,C.R,C.Y,C._,C._],
      [C._,C._,C.R,C.Y,C.Y,C.R,C._,C._],
      [C._,C._,C.Y,C.Y,C.Y,C.Y,C._,C._],
      [C._,C._,C.Y,C._,C._,C.Y,C._,C._],
    ]
  ),
  makePet('tata', 'Tata', 'V', '❤️', '#f87171', 'Creative & curious',
    [
      [C._,C._,C.R,C.R,C.R,C.R,C._,C._],
      [C._,C.R,C.R,C.R,C.R,C.R,C.R,C._],
      [C._,C.R,C.B,C.R,C.R,C.B,C.R,C._],
      [C._,C.R,C.R,C.R,C.R,C.R,C.R,C._],
      [C._,C._,C.R,C.R,C.R,C.R,C._,C._],
      [C._,C._,C._,C.R,C.R,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
    ],
    [
      [C.R,C._,C._,C._,C._,C._,C._,C.R],
      [C._,C.R,C.R,C.R,C.R,C.R,C.R,C._],
      [C._,C.R,C.B,C.R,C.R,C.B,C.R,C._],
      [C._,C.R,C.R,C.R,C.R,C.R,C.R,C._],
      [C._,C._,C.R,C.Pk,C.R,C.R,C._,C._],
      [C._,C._,C.R,C.R,C.R,C.R,C._,C._],
      [C._,C._,C._,C.R,C.R,C._,C._,C._],
      [C._,C._,C.R,C._,C._,C.R,C._,C._],
    ],
    [
      [C._,C.Y,C.Y,C._,C._,C.Y,C.Y,C._],
      [C._,C.R,C.R,C.R,C.R,C.R,C.R,C._],
      [C.R,C.R,C.W,C.B,C.R,C.W,C.B,C.R],
      [C._,C.R,C.R,C.R,C.R,C.R,C.R,C._],
      [C._,C._,C.R,C.Pk,C.Pk,C.R,C._,C._],
      [C._,C._,C.R,C.R,C.R,C.R,C._,C._],
      [C._,C._,C.G,C.R,C.R,C.G,C._,C._],
      [C._,C._,C.R,C._,C._,C.R,C._,C._],
    ]
  ),
  makePet('cooky', 'Cooky', 'Jungkook', '🐰', '#f9a8d4', 'Strong & determined',
    [
      [C._,C.Pk,C.Pk,C._,C._,C.Pk,C.Pk,C._],
      [C._,C.Pk,C.LPk,C._,C._,C.LPk,C.Pk,C._],
      [C._,C._,C.LPk,C.LPk,C.LPk,C.LPk,C._,C._],
      [C._,C._,C.LPk,C.B,C.LPk,C.B,C._,C._],
      [C._,C._,C._,C.LPk,C.LPk,C._,C._,C._],
      [C._,C._,C._,C.LPk,C.LPk,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
      [C._,C._,C._,C._,C._,C._,C._,C._],
    ],
    [
      [C._,C.Pk,C.Pk,C._,C._,C.Pk,C.Pk,C._],
      [C._,C.Pk,C.LPk,C.Pk,C.Pk,C.LPk,C.Pk,C._],
      [C._,C._,C.LPk,C.LPk,C.LPk,C.LPk,C._,C._],
      [C._,C._,C.B,C.LPk,C.LPk,C.B,C._,C._],
      [C._,C._,C.LPk,C.LPk,C.LPk,C.LPk,C._,C._],
      [C._,C._,C.LPk,C.LPk,C.LPk,C.LPk,C._,C._],
      [C._,C._,C._,C.LPk,C.LPk,C._,C._,C._],
      [C._,C._,C.LPk,C._,C._,C.LPk,C._,C._],
    ],
    [
      [C._,C.Pk,C.Pk,C._,C._,C.Pk,C.Pk,C._],
      [C._,C.Pk,C.LPk,C.Pk,C.Pk,C.LPk,C.Pk,C._],
      [C._,C._,C.LPk,C.LPk,C.LPk,C.LPk,C._,C._],
      [C._,C._,C.B,C.LPk,C.LPk,C.B,C._,C._],
      [C._,C._,C.LPk,C.R,C.LPk,C.LPk,C._,C._],
      [C._,C._,C.Bl,C.LPk,C.LPk,C.Bl,C._,C._],
      [C._,C._,C._,C.LPk,C.LPk,C._,C._,C._],
      [C._,C._,C.LPk,C._,C._,C.LPk,C._,C._],
    ]
  ),
];

export function getPetStage(pet: PetType, level: number): PetStage {
  let current = pet.stages[0];
  for (const stage of pet.stages) {
    if (level >= stage.minLevel) current = stage;
  }
  return current;
}

export function getOverallMood(stats: PetStats): { label: string; emoji: string; color: string } {
  const avg = (stats.hunger + stats.happiness + stats.cleanliness + stats.energy) / 4;
  if (avg >= 80) return { label: 'Thriving!', emoji: '🌟', color: 'text-green-400' };
  if (avg >= 60) return { label: 'Happy', emoji: '😊', color: 'text-yellow-400' };
  if (avg >= 40) return { label: 'Okay', emoji: '😐', color: 'text-orange-400' };
  if (avg >= 20) return { label: 'Sad', emoji: '😢', color: 'text-red-400' };
  return { label: 'Critical!', emoji: '😭', color: 'text-red-600' };
}

export function calculateStatDecay(lastTime: string): number {
  const elapsed = Date.now() - new Date(lastTime).getTime();
  const hours = elapsed / (1000 * 60 * 60);
  return Math.min(Math.floor(hours * 3), 50); // lose ~3 per hour, max 50
}

export function getXpForLevel(level: number): number {
  return level * 20 + 10;
}
