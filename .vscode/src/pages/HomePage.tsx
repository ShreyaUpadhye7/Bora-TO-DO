import { motion } from "framer-motion";
import { CheckSquare, BookOpen, Timer, Sparkles, CalendarDays, KeyRound, Gamepad2, Palette, PawPrint, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTodos } from "@/hooks/useTodos";
import ThemeToggle from "@/components/ThemeToggle";
import { getDailyQuote } from "@/lib/bts-quotes";

const navCards = [
  {
    title: "Tasks",
    description: "Your daily to-do list",
    icon: CheckSquare,
    path: "/todos",
    emoji: "💜",
  },
  {
    title: "Journal",
    description: "Write your heart out",
    icon: BookOpen,
    path: "/journal",
    emoji: "📖",
  },
  {
    title: "Focus",
    description: "Pomodoro & ambient sounds",
    icon: Timer,
    path: "/focus",
    emoji: "🎧",
  },
  {
    title: "Calendar",
    description: "Events & reminders",
    icon: CalendarDays,
    path: "/calendar",
    emoji: "📅",
  },
  {
    title: "Concert Game",
    description: "BTS match-3 puzzle",
    icon: Gamepad2,
    path: "/game",
    emoji: "🎮",
  },
  {
    title: "Pixel Art",
    description: "Color BTS pixel puzzles",
    icon: Palette,
    path: "/pixel-art",
    emoji: "🎨",
  },
  {
    title: "BT21 Pet",
    description: "Raise your virtual pet!",
    icon: PawPrint,
    path: "/pet",
    emoji: "🐾",
  },
  {
    title: "Gratitude Jar",
    description: "Seal your gratitude",
    icon: Heart,
    path: "/gratitude",
    emoji: "🫙",
  },
  {
    title: "Magic Shop",
    description: "Unlock rewards",
    icon: KeyRound,
    path: "/magic-shop",
    emoji: "🗝️",
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { allTodos } = useTodos();
  const totalCompleted = allTodos.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-main-gradient flex flex-col items-center justify-center px-4 pb-24 relative">
      {/* Top bar */}
      <div className="absolute top-4 right-4 flex gap-1">
        <ThemeToggle />
        <button
          onClick={signOut}
          className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors text-xs font-body font-medium"
        >
          Sign out
        </button>
      </div>

      {/* Daily Motivation Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card rounded-2xl px-6 py-4 mb-10 max-w-md w-full text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-body font-semibold uppercase tracking-widest text-primary">
            Daily Motivation
          </span>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <p className="text-sm font-body text-foreground/80 italic leading-relaxed">
          "{getDailyQuote()}"
        </p>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-center mb-10"
      >
        <motion.p
          className="text-5xl mb-3"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          💜
        </motion.p>
        <h1 className="text-5xl font-display font-semibold gradient-text mb-2">
          Borahae
        </h1>
        {user?.email && (
          <p className="text-xs font-body text-muted-foreground mt-2">
            {user.email}
          </p>
        )}
      </motion.div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl w-full">
        {navCards.map((card, i) => (
          <motion.button
            key={card.path}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
            whileHover={{ y: -6, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(card.path)}
            className="glass-card rounded-2xl p-6 text-left transition-all group cursor-pointer"
          >
            <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">
              {card.emoji}
            </span>
            <h2 className="text-lg font-display font-semibold text-foreground mb-1">
              {card.title}
            </h2>
            <p className="text-xs font-body text-muted-foreground">
              {card.description}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
