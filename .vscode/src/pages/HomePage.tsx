import { motion } from "framer-motion";
import { CheckSquare, BookOpen, Timer, Sparkles, CalendarDays, KeyRound, Gamepad2, Palette, PawPrint } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTodos } from "@/hooks/useTodos";
import ThemeToggle from "@/components/ThemeToggle";
import { getDailyQuote } from "@/lib/bts-quotes";

const MILESTONES = [5, 10, 20, 35, 50];

const HomePage = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { allTodos, completedCount, totalCount } = useTodos();
  const totalCompleted = allTodos.filter((t) => t.completed).length;
  const hasNewUnlock = MILESTONES.some((m) => totalCompleted >= m && totalCompleted < m + 3);
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const card = (
    path: string,
    content: React.ReactNode,
    className = "",
    delay = 0
  ) => (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3, scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(path)}
      className={`glass-card rounded-2xl p-5 text-left cursor-pointer group relative overflow-hidden ${className}`}
    >
      {content}
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-main-gradient flex flex-col px-6 pt-5 pb-6 max-w-5xl mx-auto w-full">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between mb-5"
      >
        <div>
          <h1 className="text-2xl font-display font-semibold gradient-text">Borahae 💜</h1>
          {user?.email && <p className="text-[11px] font-body text-muted-foreground">{user.email}</p>}
        </div>
        <div className="flex gap-1.5 items-center">
          <ThemeToggle />
          <button
            onClick={signOut}
            className="px-3 py-1.5 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors text-xs font-body"
          >
            Sign out
          </button>
        </div>
      </motion.div>

      {/* Daily quote — full width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl px-5 py-3.5 mb-3 flex items-center gap-3"
      >
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs font-body text-foreground/75 italic leading-relaxed">"{getDailyQuote()}"</p>
      </motion.div>

      {/* Bento grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">

        {/* Tasks — large, spans 2 rows */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          whileHover={{ y: -3, scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/todos")}
          className="glass-card rounded-2xl p-5 text-left cursor-pointer group relative overflow-hidden row-span-2 flex flex-col justify-between"        >
          <div>
            <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform duration-200">💜</span>
            <h2 className="text-lg font-display font-semibold text-foreground mb-1">Tasks</h2>
            <p className="text-xs font-body text-muted-foreground">Your daily to-do list</p>
          </div>
          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-body text-muted-foreground mb-1.5">
              <span>{completedCount}/{totalCount} today</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-secondary/50 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </div>
          </div>
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ boxShadow: "inset 0 0 40px hsl(275 60% 55% / 0.06)" }} />
        </motion.button>

        {/* Journal */}
        {card("/journal", <>
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform duration-200">📖</span>
          <h2 className="text-sm font-display font-semibold text-foreground">Journal</h2>
          <p className="text-[11px] font-body text-muted-foreground mt-0.5">Write your heart out</p>
        </>, "", 0.2)}

        {/* Focus */}
        {card("/focus", <>
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform duration-200">🎧</span>
          <h2 className="text-sm font-display font-semibold text-foreground">Focus</h2>
          <p className="text-[11px] font-body text-muted-foreground mt-0.5">Pomodoro & sounds</p>
        </>, "", 0.25)}

        {/* Calendar */}
        {card("/calendar", <>
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform duration-200">📅</span>
          <h2 className="text-sm font-display font-semibold text-foreground">Calendar</h2>
          <p className="text-[11px] font-body text-muted-foreground mt-0.5">Events & reminders</p>
        </>, "", 0.3)}

        {/* BT21 Pet */}
        {card("/pet", <>
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform duration-200">🐾</span>
          <h2 className="text-sm font-display font-semibold text-foreground">BT21 Pet</h2>
          <p className="text-[11px] font-body text-muted-foreground mt-0.5">Raise your virtual pet</p>
        </>, "", 0.35)}

        {/* Concert Game */}
        {card("/game", <>
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform duration-200">🎮</span>
          <h2 className="text-sm font-display font-semibold text-foreground">Concert Game</h2>
          <p className="text-[11px] font-body text-muted-foreground mt-0.5">BTS match-3 puzzle</p>
        </>, "", 0.4)}

        {/* Pixel Art */}
        {card("/pixel-art", <>
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform duration-200">🎨</span>
          <h2 className="text-sm font-display font-semibold text-foreground">Pixel Art</h2>
          <p className="text-[11px] font-body text-muted-foreground mt-0.5">Color BTS puzzles</p>
        </>, "", 0.45)}

        {/* Magic Shop — full width */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          whileHover={{ y: -3, scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/magic-shop")}
          className="glass-card rounded-2xl px-5 py-4 text-left cursor-pointer group col-span-2 sm:col-span-4 flex items-center gap-4 relative overflow-hidden"
          style={hasNewUnlock ? { boxShadow: "0 0 24px hsl(275 55% 65% / 0.2)" } : {}}
        >
          <motion.div animate={hasNewUnlock ? { opacity: [0.6, 1, 0.6] } : {}} transition={{ duration: 2, repeat: Infinity }}>
            <KeyRound className={`w-6 h-6 ${hasNewUnlock ? "text-primary" : "text-muted-foreground"} group-hover:scale-110 transition-transform`} />
          </motion.div>
          <div>
            <h2 className="text-sm font-display font-semibold text-foreground">Magic Shop</h2>
            <p className="text-[11px] font-body text-muted-foreground">Unlock rewards with your progress</p>
          </div>
          {hasNewUnlock && (
            <span className="ml-auto text-xs text-primary font-body font-semibold">✨ New!</span>
          )}
        </motion.button>

      </div>
    </div>
  );
};

export default HomePage;
