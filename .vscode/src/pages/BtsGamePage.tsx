import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Zap, RotateCcw, Lock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import {
  BTS_PIECES,
  CONCERT_LEVELS,
  ConcertLevel,
  Grid,
  createGrid,
  swapCells,
  findMatches,
  removeAndDrop,
  isAdjacent,
  hasValidMoves,
} from "@/lib/match-game";

type GameState = "menu" | "playing" | "won" | "lost";

const BtsGamePage = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>("menu");
  const [level, setLevel] = useState<ConcertLevel>(CONCERT_LEVELS[0]);
  const [unlockedLevel, setUnlockedLevel] = useState(() => {
    const saved = localStorage.getItem("bts-game-level");
    return saved ? parseInt(saved) : 1;
  });
  const [grid, setGrid] = useState<Grid>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [matchedCells, setMatchedCells] = useState<Set<string>>(new Set());
  const processingRef = useRef(false);

  const startLevel = useCallback((lvl: ConcertLevel) => {
    setLevel(lvl);
    setGrid(createGrid(lvl.gridSize, lvl.pieceCount));
    setScore(0);
    setMoves(lvl.moves);
    setCombo(0);
    setSelected(null);
    setGameState("playing");
    setMatchedCells(new Set());
  }, []);

  const processMatches = useCallback(async (currentGrid: Grid, currentScore: number, comboCount: number) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setAnimating(true);

    let g = currentGrid;
    let s = currentScore;
    let c = comboCount;

    while (true) {
      const matches = findMatches(g);
      if (matches.length === 0) break;

      c++;
      const matchSet = new Set(matches.map(([r, col]) => `${r},${col}`));
      setMatchedCells(matchSet);

      // Points: base 10 per piece, combo multiplier
      const points = matches.length * 10 * c;
      s += points;
      setScore(s);
      setCombo(c);

      await new Promise(res => setTimeout(res, 350));

      g = removeAndDrop(g, matches, level.pieceCount);
      setGrid(g);
      setMatchedCells(new Set());

      await new Promise(res => setTimeout(res, 300));
    }

    setCombo(0);
    setAnimating(false);
    processingRef.current = false;

    // Check win/lose
    if (s >= level.targetScore) {
      setGameState("won");
      if (level.id >= unlockedLevel && level.id < CONCERT_LEVELS.length) {
        const next = level.id + 1;
        setUnlockedLevel(next);
        localStorage.setItem("bts-game-level", String(next));
      }
    } else if (!hasValidMoves(g)) {
      // Reshuffle if no moves
      setGrid(createGrid(level.gridSize, level.pieceCount));
    }
  }, [level, unlockedLevel]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (animating || gameState !== "playing" || moves <= 0) return;

    if (!selected) {
      setSelected([row, col]);
      return;
    }

    const [sr, sc] = selected;
    if (sr === row && sc === col) {
      setSelected(null);
      return;
    }

    if (!isAdjacent(sr, sc, row, col)) {
      setSelected([row, col]);
      return;
    }

    // Swap
    const swapped = swapCells(grid, sr, sc, row, col);
    const matches = findMatches(swapped);

    if (matches.length === 0) {
      // Invalid swap — flash and revert
      setSelected(null);
      return;
    }

    setGrid(swapped);
    setSelected(null);
    const newMoves = moves - 1;
    setMoves(newMoves);

    processMatches(swapped, score, 0);

    if (newMoves <= 0 && score < level.targetScore) {
      setTimeout(() => {
        if (score < level.targetScore) setGameState("lost");
      }, 1500);
    }
  }, [selected, grid, animating, gameState, moves, score, level, processMatches]);

  // Check lose after moves update
  useEffect(() => {
    if (gameState === "playing" && moves <= 0 && !animating && score < level.targetScore) {
      const t = setTimeout(() => setGameState("lost"), 800);
      return () => clearTimeout(t);
    }
  }, [moves, animating, gameState, score, level.targetScore]);

  const scoreProgress = Math.min(100, (score / level.targetScore) * 100);

  // MENU VIEW
  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-main-gradient flex flex-col items-center px-4 py-8 pb-28">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate("/")} className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-display font-semibold gradient-text">BTS Concert Tour</h1>
          </div>

          <p className="text-sm font-body text-muted-foreground mb-6 text-center">
            Match BTS icons across world concert stages! 🌍💜
          </p>

          <div className="space-y-3">
            {CONCERT_LEVELS.map((lvl) => {
              const locked = lvl.id > unlockedLevel;
              return (
                <motion.button
                  key={lvl.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: lvl.id * 0.07 }}
                  disabled={locked}
                  onClick={() => !locked && startLevel(lvl)}
                  className={`w-full glass-card rounded-2xl p-4 flex items-center gap-4 text-left transition-all ${
                    locked ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] cursor-pointer"
                  }`}
                >
                  <span className="text-3xl">{locked ? "🔒" : lvl.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-foreground text-base">{lvl.name}</h3>
                      <span className="text-xs font-body text-muted-foreground">{lvl.city}</span>
                    </div>
                    <p className="text-xs font-body text-muted-foreground mt-0.5">{lvl.description}</p>
                    <div className="flex gap-3 mt-1 text-xs font-body text-muted-foreground">
                      <span>🎯 {lvl.targetScore} pts</span>
                      <span>🔄 {lvl.moves} moves</span>
                      <span>📐 {lvl.gridSize}×{lvl.gridSize}</span>
                    </div>
                  </div>
                  {locked ? <Lock className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-primary" />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // GAME VIEW
  return (
    <div className="min-h-screen bg-main-gradient flex flex-col items-center px-2 py-4 pb-28">
      {/* Header */}
      <div className="w-full max-w-md mb-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setGameState("menu")} className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h2 className="text-sm font-display font-semibold gradient-text">{level.emoji} {level.name}</h2>
            <p className="text-[10px] font-body text-muted-foreground">{level.city}</p>
          </div>
          <button onClick={() => startLevel(level)} className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="glass-card rounded-xl p-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-body mb-1">
              <span className="text-muted-foreground">Score</span>
              <span className="text-foreground font-semibold">{score}/{level.targetScore}</span>
            </div>
            <Progress value={scoreProgress} className="h-2" />
          </div>
          <div className="text-center px-3 border-l border-border">
            <p className="text-lg font-display font-bold text-foreground">{moves}</p>
            <p className="text-[10px] font-body text-muted-foreground">Moves</p>
          </div>
        </div>

        {/* Combo indicator */}
        <AnimatePresence>
          {combo > 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="text-center mt-2"
            >
              <span className="inline-flex items-center gap-1 text-sm font-body font-bold text-primary">
                <Zap className="w-4 h-4" /> {combo}x Combo! 🔥
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Game Grid */}
      <div className="glass-card rounded-2xl p-3">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${level.gridSize}, 1fr)`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selected && selected[0] === r && selected[1] === c;
              const isMatched = matchedCells.has(`${r},${c}`);
              const piece = BTS_PIECES[cell.pieceIndex];
              const cellSize = level.gridSize >= 8 ? "w-9 h-9" : level.gridSize >= 7 ? "w-10 h-10" : "w-11 h-11";
              const fontSize = level.gridSize >= 8 ? "text-lg" : level.gridSize >= 7 ? "text-xl" : "text-2xl";

              return (
                <motion.button
                  key={cell.id + "-" + r + "-" + c}
                  layout
                  initial={cell.isNew ? { opacity: 0, y: -20, scale: 0.5 } : false}
                  animate={{
                    opacity: isMatched ? 0 : 1,
                    scale: isMatched ? 1.3 : isSelected ? 1.15 : 1,
                    y: 0,
                  }}
                  transition={{
                    layout: { type: "spring", stiffness: 300, damping: 25 },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.15 },
                  }}
                  onClick={() => handleCellClick(r, c)}
                  className={`${cellSize} rounded-xl flex items-center justify-center transition-all cursor-pointer
                    ${isSelected
                      ? "bg-primary/20 ring-2 ring-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                      : "bg-secondary/50 hover:bg-secondary/80"
                    }
                    ${isMatched ? "bg-primary/30" : ""}
                  `}
                >
                  <span className={`${fontSize} select-none ${isMatched ? "animate-bounce" : ""}`}>
                    {piece?.emoji || "💜"}
                  </span>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Piece Legend */}
      <div className="mt-3 flex gap-2 flex-wrap justify-center">
        {BTS_PIECES.slice(0, level.pieceCount).map((p) => (
          <span key={p.id} className="text-xs font-body text-muted-foreground flex items-center gap-1">
            {p.emoji} {p.label}
          </span>
        ))}
      </div>

      {/* Win/Lose Modal */}
      <AnimatePresence>
        {(gameState === "won" || gameState === "lost") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="glass-card rounded-3xl p-8 max-w-xs w-full text-center mx-4"
            >
              {gameState === "won" ? (
                <>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: 2 }}
                    className="text-6xl mb-4"
                  >
                    🏆
                  </motion.div>
                  <h2 className="text-2xl font-display font-bold gradient-text mb-2">Borahae!</h2>
                  <p className="text-sm font-body text-muted-foreground mb-1">
                    {level.name} — {level.city} cleared!
                  </p>
                  <p className="text-lg font-body font-bold text-primary mb-4">{score} points</p>
                  <div className="flex gap-2">
                    {level.id < CONCERT_LEVELS.length && (
                      <button
                        onClick={() => startLevel(CONCERT_LEVELS[level.id])}
                        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                      >
                        Next Stage <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setGameState("menu")}
                      className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      Menu
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">😢</div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">Out of Moves!</h2>
                  <p className="text-sm font-body text-muted-foreground mb-1">
                    You scored {score}/{level.targetScore}
                  </p>
                  <p className="text-xs font-body text-muted-foreground mb-4">
                    "Fall down 7 times, get up 8." — BTS 💜
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startLevel(level)}
                      className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-4 h-4" /> Retry
                    </button>
                    <button
                      onClick={() => setGameState("menu")}
                      className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      Menu
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BtsGamePage;
