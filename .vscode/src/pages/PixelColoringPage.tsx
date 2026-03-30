import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Palette, RotateCcw, Check, Lock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Difficulty, PixelPuzzle, getPuzzlesByDifficulty, getPuzzleById } from "@/lib/pixel-puzzles";

const DIFFICULTY_META: Record<Difficulty, { label: string; emoji: string; color: string }> = {
  easy: { label: "Easy", emoji: "🌱", color: "hsl(145, 50%, 50%)" },
  medium: { label: "Medium", emoji: "⚡", color: "hsl(45, 80%, 55%)" },
  hard: { label: "Hard", emoji: "🔥", color: "hsl(0, 65%, 55%)" },
};

function getCompletedPuzzles(): string[] {
  try {
    return JSON.parse(localStorage.getItem("pixel-completed") || "[]");
  } catch { return []; }
}

function markCompleted(id: string) {
  const arr = getCompletedPuzzles();
  if (!arr.includes(id)) {
    arr.push(id);
    localStorage.setItem("pixel-completed", JSON.stringify(arr));
  }
}

export default function PixelColoringPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"menu" | "levels" | "play">("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [activePuzzle, setActivePuzzle] = useState<PixelPuzzle | null>(null);

  const selectDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    setView("levels");
  };

  const selectPuzzle = (p: PixelPuzzle) => {
    setActivePuzzle(p);
    setView("play");
  };

  const goBack = () => {
    if (view === "play") setView("levels");
    else if (view === "levels") setView("menu");
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-main-gradient flex flex-col items-center px-4 py-6 pb-28">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center gap-3 mb-6">
        <button onClick={goBack} className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-display font-semibold gradient-text">Pixel Art</h1>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "menu" && <DifficultyMenu key="menu" onSelect={selectDifficulty} />}
        {view === "levels" && <LevelSelect key="levels" difficulty={difficulty} onSelect={selectPuzzle} />}
        {view === "play" && activePuzzle && <PixelCanvas key="play" puzzle={activePuzzle} onComplete={() => { markCompleted(activePuzzle.id); setView("levels"); }} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Difficulty Menu ───
function DifficultyMenu({ onSelect }: { onSelect: (d: Difficulty) => void }) {
  const completed = getCompletedPuzzles();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-lg space-y-4">
      {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
        const meta = DIFFICULTY_META[d];
        const puzzles = getPuzzlesByDifficulty(d);
        const done = puzzles.filter((p) => completed.includes(p.id)).length;
        return (
          <motion.button
            key={d}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(d)}
            className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 text-left"
          >
            <span className="text-3xl">{meta.emoji}</span>
            <div className="flex-1">
              <h2 className="text-lg font-display font-semibold text-foreground">{meta.label}</h2>
              <p className="text-xs font-body text-muted-foreground">{done}/{puzzles.length} completed</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${meta.color}20`, border: `2px solid ${meta.color}` }}>
              <span className="text-sm font-bold font-body" style={{ color: meta.color }}>{done}</span>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

// ─── Level Select ───
function LevelSelect({ difficulty, onSelect }: { difficulty: Difficulty; onSelect: (p: PixelPuzzle) => void }) {
  const puzzles = getPuzzlesByDifficulty(difficulty);
  const completed = getCompletedPuzzles();
  const meta = DIFFICULTY_META[difficulty];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-lg">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{meta.emoji}</span>
        <h2 className="text-lg font-display font-semibold text-foreground">{meta.label} Puzzles</h2>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {puzzles.map((p, i) => {
          const done = completed.includes(p.id);
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(p)}
              className={`glass-card rounded-xl p-3 flex flex-col items-center gap-1 relative ${done ? "ring-2 ring-primary/40" : ""}`}
            >
              <span className="text-2xl">{p.emoji}</span>
              <span className="text-[10px] font-body font-medium text-foreground truncate w-full text-center">{p.name}</span>
              {done && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Pixel Canvas ───
function PixelCanvas({ puzzle, onComplete }: { puzzle: PixelPuzzle; onComplete: () => void }) {
  const size = puzzle.grid.length;
  const totalCells = useMemo(() => {
    let c = 0;
    puzzle.grid.forEach((row) => row.forEach((v) => { if (v !== 0) c++; }));
    return c;
  }, [puzzle]);

  // Track which cells user has colored
  const [colored, setColored] = useState<Set<string>>(new Set());
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [showComplete, setShowComplete] = useState(false);

  // Get unique colors used in this puzzle
  const usedColors = useMemo(() => {
    const s = new Set<number>();
    puzzle.grid.forEach((row) => row.forEach((v) => { if (v !== 0) s.add(v); }));
    return Array.from(s).sort();
  }, [puzzle]);

  const handleCellClick = useCallback((r: number, c: number) => {
    const target = puzzle.grid[r][c];
    if (target === 0) return;
    if (selectedColor === null) return;

    const key = `${r}-${c}`;
    if (selectedColor === target) {
      setColored((prev) => {
        const next = new Set(prev);
        next.add(key);
        // Check completion
        if (next.size === totalCells) {
          setTimeout(() => setShowComplete(true), 300);
        }
        return next;
      });
    }
  }, [selectedColor, puzzle, totalCells]);

  const reset = () => {
    setColored(new Set());
    setShowComplete(false);
  };

  const progress = Math.round((colored.size / totalCells) * 100);
  const cellSize = size <= 6 ? "w-10 h-10 sm:w-12 sm:h-12" : size <= 8 ? "w-8 h-8 sm:w-10 sm:h-10" : "w-7 h-7 sm:w-8 sm:h-8";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-lg flex flex-col items-center">
      {/* Puzzle info */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{puzzle.emoji}</span>
        <h2 className="text-lg font-display font-semibold text-foreground">{puzzle.name}</h2>
        <button onClick={reset} className="ml-auto p-1.5 rounded-lg glass-card text-muted-foreground hover:text-foreground">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-secondary mb-4 overflow-hidden">
        <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 200 }} />
      </div>

      {/* Grid */}
      <div className="glass-card rounded-2xl p-3 mb-4 overflow-auto">
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
          {puzzle.grid.map((row, r) =>
            row.map((val, c) => {
              const key = `${r}-${c}`;
              const isColored = colored.has(key);
              const isEmpty = val === 0;
              const bg = isEmpty
                ? "transparent"
                : isColored
                  ? puzzle.colors[val]
                  : "hsl(var(--muted))";

              return (
                <motion.button
                  key={key}
                  className={`${cellSize} rounded-sm border transition-all ${
                    isEmpty
                      ? "border-transparent cursor-default"
                      : isColored
                        ? "border-transparent"
                        : "border-border/30 cursor-pointer hover:brightness-110"
                  }`}
                  style={{ backgroundColor: bg }}
                  onClick={() => handleCellClick(r, c)}
                  whileTap={!isEmpty && !isColored ? { scale: 0.85 } : {}}
                  animate={isColored ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.2 }}
                >
                  {!isEmpty && !isColored && (
                    <span className="text-[9px] font-body font-bold text-muted-foreground/60">{val}</span>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Color palette */}
      <div className="glass-card rounded-2xl p-3 w-full">
        <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2 text-center">Select a color</p>
        <div className="flex flex-wrap justify-center gap-2">
          {usedColors.map((num) => {
            const isSelected = selectedColor === num;
            return (
              <motion.button
                key={num}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedColor(num)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-body font-bold text-xs transition-all ${
                  isSelected ? "ring-2 ring-offset-2 ring-primary ring-offset-background scale-110" : ""
                }`}
                style={{ backgroundColor: puzzle.colors[num], color: num === 8 ? "#333" : "#fff" }}
              >
                {num}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Completion overlay */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="glass-card rounded-3xl p-8 text-center max-w-sm mx-4"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
                className="text-6xl mb-4"
              >
                🎨
              </motion.div>
              <h2 className="text-2xl font-display font-bold gradient-text mb-2">Beautiful!</h2>
              <p className="text-sm font-body text-muted-foreground mb-1">You completed "{puzzle.name}"</p>
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(3)].map((_, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                    <Star className="w-5 h-5 text-primary fill-primary" />
                  </motion.div>
                ))}
              </div>
              <button
                onClick={() => { onComplete(); setShowComplete(false); }}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-body font-semibold hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
