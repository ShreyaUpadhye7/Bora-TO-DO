import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Timer } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY = "focus-timer-state";

export default function FloatingTimer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<{ mode: string; secondsLeft: number; running: boolean } | null>(null);

  // Poll localStorage every second
  useEffect(() => {
    const tick = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) { setState(null); return; }
        const { mode, secondsLeft, savedAt, running } = JSON.parse(saved);
        if (running) {
          const elapsed = Math.floor((Date.now() - savedAt) / 1000);
          const adjusted = Math.max(0, secondsLeft - elapsed);
          setState({ mode, secondsLeft: adjusted, running: adjusted > 0 });
        } else {
          setState({ mode, secondsLeft, running: false });
        }
      } catch { setState(null); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Don't show on focus page itself
  if (location.pathname === "/focus") return null;
  if (!state || (!state.running && state.secondsLeft === (state.mode === "focus" ? 25 * 60 : 5 * 60))) return null;

  const mins = Math.floor(state.secondsLeft / 60);
  const secs = state.secondsLeft % 60;
  const label = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const toggleRunning = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...parsed,
        running: !parsed.running,
        savedAt: Date.now(),
        secondsLeft: state.secondsLeft,
      }));
    } catch {}
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 glass-card rounded-2xl px-3 py-2 shadow-lg cursor-pointer"
        style={state.running ? { boxShadow: "0 0 16px hsl(275 60% 55% / 0.3)" } : {}}
        onClick={() => navigate("/focus")}
      >
        <motion.div
          className={`w-2 h-2 rounded-full ${state.mode === "focus" ? "bg-primary" : "bg-green-400"}`}
          animate={state.running ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <Timer className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm font-body font-semibold text-foreground tabular-nums">{label}</span>
        <span className="text-[10px] font-body text-muted-foreground">{state.mode === "focus" ? "Focus" : "Break"}</span>
        <button
          onClick={(e) => { e.stopPropagation(); toggleRunning(); }}
          className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          {state.running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
