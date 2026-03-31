import { useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, BookOpen, Timer, Sparkles, CalendarDays, KeyRound, Gamepad2, Palette, PawPrint } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTodos } from "@/hooks/useTodos";
import ThemeToggle from "@/components/ThemeToggle";
import { getDailyQuote } from "@/lib/bts-quotes";

const MILESTONES = [5, 10, 20, 35, 50];

const navItems = [
  { title: "Tasks",        desc: "Your daily to-do list",       icon: CheckSquare, path: "/todos",       emoji: "💜", bg: "from-violet-900/60 to-purple-900/40"  },
  { title: "Journal",      desc: "Write your heart out",        icon: BookOpen,    path: "/journal",     emoji: "📖", bg: "from-blue-900/60 to-indigo-900/40"    },
  { title: "Focus",        desc: "Pomodoro & ambient sounds",   icon: Timer,       path: "/focus",       emoji: "🎧", bg: "from-teal-900/60 to-emerald-900/40"   },
  { title: "Calendar",     desc: "Events & reminders",          icon: CalendarDays,path: "/calendar",    emoji: "📅", bg: "from-amber-900/60 to-yellow-900/40"   },
  { title: "Concert Game", desc: "BTS match-3 puzzle",          icon: Gamepad2,    path: "/game",        emoji: "🎮", bg: "from-rose-900/60 to-pink-900/40"      },
  { title: "Pixel Art",    desc: "Color BTS pixel puzzles",     icon: Palette,     path: "/pixel-art",   emoji: "🎨", bg: "from-sky-900/60 to-cyan-900/40"       },
  { title: "BT21 Pet",     desc: "Raise your virtual pet",      icon: PawPrint,    path: "/pet",         emoji: "🐾", bg: "from-orange-900/60 to-red-900/40"     },
  { title: "Magic Shop",   desc: "Unlock rewards with progress",icon: KeyRound,    path: "/magic-shop",  emoji: "🗝️", bg: "from-fuchsia-900/60 to-purple-900/40" },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { allTodos, completedCount, totalCount } = useTodos();
  const totalCompleted = allTodos.filter((t) => t.completed).length;
  const hasNewUnlock = MILESTONES.some((m) => totalCompleted >= m && totalCompleted < m + 3);
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="h-screen w-screen bg-main-gradient flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0 z-10">
        <div>
          <h1 className="text-xl font-display font-semibold gradient-text">Borahae 💜</h1>
          {user?.email && <p className="text-[10px] font-body text-muted-foreground">{user.email}</p>}
        </div>
        <div className="flex items-center gap-3">
          {/* Daily quote */}
          <div className="hidden sm:flex items-center gap-2 glass-card rounded-xl px-4 py-2 max-w-xs">
            <Sparkles className="w-3 h-3 text-primary shrink-0" />
            <p className="text-[11px] font-body text-foreground/70 italic truncate">"{getDailyQuote()}"</p>
          </div>
          <ThemeToggle />
          <button
            onClick={signOut}
            className="px-3 py-1.5 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors text-xs font-body"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Accordion strips */}
      <div className="flex flex-col flex-1 gap-1 px-4 pb-4 overflow-hidden">
        {navItems.map((item, i) => {
          const isHovered = hovered === i;
          const isMagicShop = item.path === "/magic-shop";

          return (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0, flex: isHovered ? 3.5 : 1 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => navigate(item.path)}
              className={`relative rounded-2xl overflow-hidden cursor-pointer w-full bg-gradient-to-r ${item.bg} border border-white/5 flex items-center px-6 gap-5`}
              style={{ minHeight: 0 }}
            >
              {/* Glow on hover */}
              <motion.div
                className="absolute inset-0 bg-white/5"
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              />

              {/* Emoji */}
              <motion.span
                animate={{ scale: isHovered ? 1.3 : 1 }}
                transition={{ duration: 0.25 }}
                className="text-2xl shrink-0 relative z-10"
              >
                {item.emoji}
              </motion.span>

              {/* Text */}
              <div className="relative z-10 text-left overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-display font-semibold text-white">{item.title}</span>
                  {isMagicShop && hasNewUnlock && (
                    <span className="text-[10px] text-primary font-body">✨ New!</span>
                  )}
                </div>
                <motion.p
                  animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? "auto" : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs font-body text-white/60 overflow-hidden"
                >
                  {item.desc}
                </motion.p>
              </div>

              {/* Tasks progress bar */}
              {item.path === "/todos" && isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-auto relative z-10 flex items-center gap-3 shrink-0"
                >
                  <span className="text-xs font-body text-white/60">{completedCount}/{totalCount}</span>
                  <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span className="text-xs font-body text-white/60">{progress}%</span>
                </motion.div>
              )}

              {/* Arrow on hover */}
              <motion.span
                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -8 }}
                transition={{ duration: 0.2 }}
                className="ml-auto relative z-10 text-white/40 text-lg shrink-0"
              >
                →
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;
