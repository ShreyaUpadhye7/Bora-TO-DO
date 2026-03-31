import { motion } from "framer-motion";
import { CheckSquare, BookOpen, Timer, Sparkles, CalendarDays, KeyRound, Gamepad2, Palette, PawPrint } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTodos } from "@/hooks/useTodos";
import ThemeToggle from "@/components/ThemeToggle";
import { getDailyQuote } from "@/lib/bts-quotes";

const navItems = [
  { title: "Tasks",        icon: CheckSquare, path: "/todos",      emoji: "💜", color: "hsl(270 60% 65%)" },
  { title: "Journal",      icon: BookOpen,    path: "/journal",    emoji: "📖", color: "hsl(220 60% 65%)" },
  { title: "Focus",        icon: Timer,       path: "/focus",      emoji: "🎧", color: "hsl(165 50% 55%)" },
  { title: "Calendar",     icon: CalendarDays,path: "/calendar",   emoji: "📅", color: "hsl(45 80% 60%)"  },
  { title: "Concert Game", icon: Gamepad2,    path: "/game",       emoji: "🎮", color: "hsl(330 55% 65%)" },
  { title: "Pixel Art",    icon: Palette,     path: "/pixel-art",  emoji: "🎨", color: "hsl(200 60% 60%)" },
  { title: "BT21 Pet",     icon: PawPrint,    path: "/pet",        emoji: "🐾", color: "hsl(25 80% 60%)"  },
];

const MILESTONES = [5, 10, 20, 35, 50];

// Positions for each nav item arranged in a loose arc/scatter layout
// [x%, y%] relative to the container — intentionally asymmetric
const POSITIONS = [
  { x: 8,  y: 12 },  // Tasks        — top left
  { x: 72, y: 6  },  // Journal      — top right
  { x: 82, y: 42 },  // Focus        — right mid
  { x: 68, y: 76 },  // Calendar     — bottom right
  { x: 30, y: 82 },  // Concert Game — bottom mid
  { x: 4,  y: 58 },  // Pixel Art    — left mid
  { x: 18, y: 36 },  // BT21 Pet     — left mid-top
];

const HomePage = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { allTodos } = useTodos();
  const totalCompleted = allTodos.filter((t) => t.completed).length;
  const hasNewUnlock = MILESTONES.some((m) => totalCompleted >= m && totalCompleted < m + 3);

  return (
    <div className="min-h-screen bg-main-gradient relative overflow-hidden select-none">

      {/* Top bar */}
      <div className="absolute top-4 right-4 z-30 flex gap-1">
        <ThemeToggle />
        <button
          onClick={signOut}
          className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors text-xs font-body font-medium"
        >
          Sign out
        </button>
      </div>

      {/* Ambient glow blobs */}
      <motion.div
        className="pointer-events-none absolute w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, hsl(275 60% 55% / 0.12), transparent 70%)", top: "10%", left: "20%" }}
        animate={{ scale: [1, 1.15, 1], x: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute w-[350px] h-[350px] rounded-full"
        style={{ background: "radial-gradient(circle, hsl(220 60% 55% / 0.1), transparent 70%)", bottom: "10%", right: "15%" }}
        animate={{ scale: [1.1, 1, 1.1], x: [0, -15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      {[...Array(14)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full bg-primary/20"
          style={{
            width: 2 + (i % 3) * 2,
            height: 2 + (i % 3) * 2,
            left: `${(i * 7 + 5) % 95}%`,
            top: `${(i * 13 + 8) % 90}%`,
          }}
          animate={{ opacity: [0.1, 0.5, 0.1], y: [0, -18, 0] }}
          transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: i * 0.4 }}
        />
      ))}

      {/* ── SCATTERED NAV ITEMS ── */}
      <div className="absolute inset-0">
        {navItems.map((item, i) => {
          const pos = POSITIONS[i];
          return (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.18, y: -6 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate(item.path)}
              className="absolute flex flex-col items-center gap-1.5 cursor-pointer group"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {/* Icon bubble */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                className="relative w-14 h-14 rounded-2xl glass-card flex items-center justify-center shadow-lg"
                style={{ boxShadow: `0 4px 24px ${item.color}33` }}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{item.emoji}</span>
                {/* Glow ring on hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: `0 0 20px ${item.color}66, inset 0 0 12px ${item.color}22` }}
                />
              </motion.div>
              <span className="text-[11px] font-body font-semibold text-foreground/70 group-hover:text-foreground transition-colors whitespace-nowrap">
                {item.title}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ── CENTRE HERO ── */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center pointer-events-none">

        {/* Outer pulse ring */}
        <motion.div
          className="absolute w-56 h-56 rounded-full border border-primary/10"
          animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-40 h-40 rounded-full border border-primary/15"
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Central orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 120 }}
          className="relative w-28 h-28 rounded-full flex items-center justify-center mb-6"
          style={{
            background: "radial-gradient(circle at 35% 35%, hsl(275 60% 70%), hsl(275 50% 40%))",
            boxShadow: "0 0 60px hsl(275 60% 55% / 0.4), 0 0 120px hsl(275 60% 55% / 0.15), inset 0 1px 0 hsl(275 80% 80% / 0.3)",
          }}
        >
          <motion.span
            className="text-4xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            💜
          </motion.span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center mb-4"
        >
          <h1 className="text-5xl font-display font-semibold gradient-text mb-1">Borahae</h1>
          {user?.email && (
            <p className="text-xs font-body text-muted-foreground">{user.email}</p>
          )}
        </motion.div>

        {/* Daily quote */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="pointer-events-auto glass-card rounded-2xl px-5 py-3 max-w-xs text-center"
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-body font-semibold uppercase tracking-widest text-primary">Daily</span>
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <p className="text-xs font-body text-foreground/75 italic leading-relaxed">"{getDailyQuote()}"</p>
        </motion.div>

        {/* Magic Shop */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: "spring" }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate("/magic-shop")}
          className="pointer-events-auto mt-5 glass-card rounded-2xl px-5 py-2.5 flex items-center gap-2 cursor-pointer"
          style={hasNewUnlock ? { boxShadow: "0 0 20px hsl(275 55% 65% / 0.3)" } : {}}
        >
          <motion.div animate={hasNewUnlock ? { opacity: [0.6, 1, 0.6] } : {}} transition={{ duration: 2, repeat: Infinity }}>
            <KeyRound className={`w-4 h-4 ${hasNewUnlock ? "text-primary" : "text-muted-foreground"}`} />
          </motion.div>
          <span className="text-sm font-body font-medium text-foreground">Magic Shop</span>
          {hasNewUnlock && <span className="text-xs text-primary font-body">✨ New!</span>}
        </motion.button>
      </div>
    </div>
  );
};

export default HomePage;
