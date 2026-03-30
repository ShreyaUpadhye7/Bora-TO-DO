// BTS Match-3 Game Engine

export const BTS_PIECES = [
  { id: "heart", emoji: "💜", label: "Purple Heart" },
  { id: "mic", emoji: "🎤", label: "Microphone" },
  { id: "army", emoji: "🔮", label: "Army Bomb" },
  { id: "crown", emoji: "👑", label: "Crown" },
  { id: "star", emoji: "⭐", label: "Star" },
  { id: "music", emoji: "🎵", label: "Music Note" },
  { id: "butterfly", emoji: "🦋", label: "Butterfly" },
];

export interface ConcertLevel {
  id: number;
  name: string;
  city: string;
  emoji: string;
  targetScore: number;
  moves: number;
  gridSize: number;
  pieceCount: number; // how many piece types to use
  description: string;
}

export const CONCERT_LEVELS: ConcertLevel[] = [
  { id: 1, name: "Wings Tour", city: "Seoul 🇰🇷", emoji: "🦋", targetScore: 300, moves: 25, gridSize: 6, pieceCount: 5, description: "Begin your journey in Seoul!" },
  { id: 2, name: "Love Yourself", city: "Tokyo 🇯🇵", emoji: "💜", targetScore: 600, moves: 22, gridSize: 6, pieceCount: 5, description: "Spread love in Tokyo!" },
  { id: 3, name: "Speak Yourself", city: "London 🇬🇧", emoji: "🎤", targetScore: 1000, moves: 20, gridSize: 7, pieceCount: 6, description: "Speak your truth in London!" },
  { id: 4, name: "Map of the Soul", city: "Chicago 🇺🇸", emoji: "🗺️", targetScore: 1500, moves: 20, gridSize: 7, pieceCount: 6, description: "Find your soul in Chicago!" },
  { id: 5, name: "Permission to Dance", city: "Las Vegas 🇺🇸", emoji: "💃", targetScore: 2000, moves: 18, gridSize: 7, pieceCount: 7, description: "Dance the night away in Vegas!" },
  { id: 6, name: "Yet To Come", city: "Busan 🇰🇷", emoji: "🌊", targetScore: 2800, moves: 18, gridSize: 8, pieceCount: 7, description: "The best is yet to come!" },
  { id: 7, name: "D-Day World Tour", city: "Paris 🇫🇷", emoji: "🌹", targetScore: 3500, moves: 16, gridSize: 8, pieceCount: 7, description: "Grand finale in Paris!" },
];

export interface Cell {
  id: string;
  pieceIndex: number;
  row: number;
  col: number;
  matched: boolean;
  falling: boolean;
  isNew: boolean;
}

export type Grid = Cell[][];

let cellIdCounter = 0;

function makeCell(row: number, col: number, pieceCount: number): Cell {
  return {
    id: `cell-${cellIdCounter++}`,
    pieceIndex: Math.floor(Math.random() * pieceCount),
    row,
    col,
    matched: false,
    falling: false,
    isNew: false,
  };
}

export function createGrid(size: number, pieceCount: number): Grid {
  const grid: Grid = [];
  for (let r = 0; r < size; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < size; c++) {
      row.push(makeCell(r, c, pieceCount));
    }
    grid.push(row);
  }
  // Remove initial matches
  let hasMatches = true;
  while (hasMatches) {
    hasMatches = false;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Check horizontal
        if (c >= 2 && grid[r][c].pieceIndex === grid[r][c-1].pieceIndex && grid[r][c].pieceIndex === grid[r][c-2].pieceIndex) {
          grid[r][c].pieceIndex = (grid[r][c].pieceIndex + 1) % pieceCount;
          hasMatches = true;
        }
        // Check vertical
        if (r >= 2 && grid[r][c].pieceIndex === grid[r-1][c].pieceIndex && grid[r][c].pieceIndex === grid[r-2][c].pieceIndex) {
          grid[r][c].pieceIndex = (grid[r][c].pieceIndex + 1) % pieceCount;
          hasMatches = true;
        }
      }
    }
  }
  return grid;
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

export function swapCells(grid: Grid, r1: number, c1: number, r2: number, c2: number): Grid {
  const newGrid = cloneGrid(grid);
  const temp = newGrid[r1][c1].pieceIndex;
  newGrid[r1][c1].pieceIndex = newGrid[r2][c2].pieceIndex;
  newGrid[r2][c2].pieceIndex = temp;
  return newGrid;
}

export function findMatches(grid: Grid): [number, number][] {
  const size = grid.length;
  const matched = new Set<string>();

  // Horizontal
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 3; c++) {
      const p = grid[r][c].pieceIndex;
      if (p === grid[r][c+1].pieceIndex && p === grid[r][c+2].pieceIndex) {
        matched.add(`${r},${c}`);
        matched.add(`${r},${c+1}`);
        matched.add(`${r},${c+2}`);
        // Extend
        let ext = c + 3;
        while (ext < size && grid[r][ext].pieceIndex === p) {
          matched.add(`${r},${ext}`);
          ext++;
        }
      }
    }
  }

  // Vertical
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - 3; r++) {
      const p = grid[r][c].pieceIndex;
      if (p === grid[r+1][c].pieceIndex && p === grid[r+2][c].pieceIndex) {
        matched.add(`${r},${c}`);
        matched.add(`${r+1},${c}`);
        matched.add(`${r+2},${c}`);
        let ext = r + 3;
        while (ext < size && grid[ext][c].pieceIndex === p) {
          matched.add(`${ext},${c}`);
          ext++;
        }
      }
    }
  }

  return Array.from(matched).map(s => {
    const [r, c] = s.split(",").map(Number);
    return [r, c] as [number, number];
  });
}

export function removeAndDrop(grid: Grid, matches: [number, number][], pieceCount: number): Grid {
  const newGrid = cloneGrid(grid);
  const size = newGrid.length;

  // Mark matched
  for (const [r, c] of matches) {
    newGrid[r][c].pieceIndex = -1;
  }

  // Drop down
  for (let c = 0; c < size; c++) {
    let writeRow = size - 1;
    for (let r = size - 1; r >= 0; r--) {
      if (newGrid[r][c].pieceIndex !== -1) {
        if (writeRow !== r) {
          newGrid[writeRow][c].pieceIndex = newGrid[r][c].pieceIndex;
          newGrid[writeRow][c].falling = true;
          newGrid[r][c].pieceIndex = -1;
        }
        writeRow--;
      }
    }
    // Fill empty from top
    for (let r = writeRow; r >= 0; r--) {
      newGrid[r][c].pieceIndex = Math.floor(Math.random() * pieceCount);
      newGrid[r][c].isNew = true;
    }
  }

  return newGrid;
}

export function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

export function hasValidMoves(grid: Grid): boolean {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Try swap right
      if (c < size - 1) {
        const swapped = swapCells(grid, r, c, r, c + 1);
        if (findMatches(swapped).length > 0) return true;
      }
      // Try swap down
      if (r < size - 1) {
        const swapped = swapCells(grid, r, c, r + 1, c);
        if (findMatches(swapped).length > 0) return true;
      }
    }
  }
  return false;
}
