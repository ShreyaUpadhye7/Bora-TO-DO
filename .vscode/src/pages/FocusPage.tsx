import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, VolumeX, Headphones, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AMBIENT_SOUNDS, AmbientType, ambientEngine } from "@/lib/ambient-sounds";
import ThemeToggle from "@/components/ThemeToggle";

type TimerMode = "focus" | "break";

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;
const STORAGE_KEY = "focus-timer-state";

function loadTimerState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const { mode, secondsLeft, savedAt, running } = JSON.parse(saved);
    // If it was running, subtract elapsed time since save
    if (running) {
      const elapsed = Math.floor((Date.now() - savedAt) / 1000);
      const adjusted = Math.max(0, secondsLeft - elapsed);
      return { mode, secondsLeft: adjusted, running: adjusted > 0 };
    }
    return { mode, secondsLeft, running: false };
  } catch {
    return null;
  }
}

const FocusPage = () => {
  const navigate = useNavigate();
  const saved = loadTimerState();
  const [mode, setMode] = useState<TimerMode>(saved?.mode ?? "focus");
  const [secondsLeft, setSecondsLeft] = useState(saved?.secondsLeft ?? FOCUS_MINUTES * 60);
  const [running, setRunning] = useState(saved?.running ?? false);
  const [activeSound, setActiveSound] = useState<AmbientType | null>(null);
  const [volume, setVolume] = useState(0.3);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = mode === "focus" ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const reset = useCallback(() => {
    setRunning(false);
    setSecondsLeft(mode === "focus" ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60);
  }, [mode]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          if (mode === "focus") {
            setSessionsCompleted((s) => s + 1);
            setMode("break");
            return BREAK_MINUTES * 60;
          } else {
            setMode("focus");
            return FOCUS_MINUTES * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode]);

  const toggleSound = (id: AmbientType) => {
    if (activeSound === id) {
      ambientEngine.stop();
      setActiveSound(null);
    } else {
      ambientEngine.play(id);
      ambientEngine.setVolume(volume);
      setActiveSound(id);
    }
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    ambientEngine.setVolume(v);
  };

  useEffect(() => () => ambientEngine.stop(), []);

  // Persist timer state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, secondsLeft, running, savedAt: Date.now() }));
  }, [mode, secondsLeft, running]);

  return (
    <div className="min-h-screen bg-main-gradient relative overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.12), transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-32 h-32 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(var(--cat-work) / 0.2), transparent 70%)" }}
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        {/* Floating particles */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/10"
            style={{
              width: 2 + Math.random() * 4,
              height: 2 + Math.random() * 4,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.1, 0.5, 0.1], y: [0, -20, 0] }}
            transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-8 pb-28 min-h-screen flex flex-col items-center">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between w-full mb-8"
        >
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-display font-semibold gradient-text">Focus</h1>
          </div>
          <ThemeToggle />
        </motion.header>

        {/* Mode indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-full px-5 py-2 mb-8 flex items-center gap-2"
        >
          <motion.div
            className={`w-2 h-2 rounded-full ${mode === "focus" ? "bg-primary" : "bg-green-400"}`}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs font-body font-semibold text-foreground uppercase tracking-widest">
            {mode === "focus" ? "Focus Mode" : "Break Time"}
          </span>
          {sessionsCompleted > 0 && (
            <span className="text-xs font-body text-muted-foreground ml-1">
              🔥 {sessionsCompleted}
            </span>
          )}
        </motion.div>

        {/* Timer Circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="relative w-64 h-64 mb-8"
        >
          {/* Glow ring */}
          {running && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 40px hsl(var(--primary) / 0.2), 0 0 80px hsl(var(--primary) / 0.1)` }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          )}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              strokeWidth="2"
              className="stroke-border/30"
            />
            <motion.circle
              cx="50" cy="50" r="45"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className={mode === "focus" ? "stroke-primary" : "stroke-green-400"}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-body font-light text-foreground tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </p>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 mb-10"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setRunning(!running)}
            className="w-16 h-16 rounded-full flex items-center justify-center text-primary-foreground transition-all shadow-lg"
            style={{ background: "var(--gradient-accent)", boxShadow: "0 8px 24px hsl(var(--primary) / 0.3)" }}
          >
            {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={reset}
            className="w-16 h-16 rounded-full flex items-center justify-center glass-card text-foreground transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Ambient Sounds */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-3 h-3 text-primary" />
            <p className="text-xs font-body uppercase tracking-widest text-muted-foreground font-semibold">
              Ambient Sounds
            </p>
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {AMBIENT_SOUNDS.map((s) => (
              <motion.button
                key={s.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleSound(s.id)}
                className={`glass-card px-4 py-2.5 rounded-xl text-sm font-body transition-all flex items-center gap-2 ${
                  activeSound === s.id
                    ? "ring-2 ring-primary bg-primary/10 text-foreground shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Volume */}
          {activeSound && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center justify-center gap-3 pt-2 border-t border-border/30"
            >
              <VolumeX className="w-4 h-4 text-muted-foreground" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => handleVolume(parseFloat(e.target.value))}
                className="w-32 accent-primary"
              />
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default FocusPage;
