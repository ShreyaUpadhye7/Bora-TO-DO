import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Cookie } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTodos } from "@/hooks/useTodos";
import { getRandomComfort } from "@/lib/comfort-quotes";

interface ShopItem {
  name: string;
  emoji: string;
  description: string;
  milestone: number;
  milestoneLabel: string;
}

const shopItems: ShopItem[] = [
  { name: "Whale", emoji: "🐋", description: "Guardian of deep thoughts", milestone: 5, milestoneLabel: "5 tasks completed" },
  { name: "Galaxy Orb", emoji: "🔮", description: "Holds infinite possibilities", milestone: 10, milestoneLabel: "10 tasks completed" },
  { name: "Moon Jar", emoji: "🏺", description: "Captures moonlit wishes", milestone: 20, milestoneLabel: "20 tasks completed" },
  { name: "Key", emoji: "🗝️", description: "Unlocks hidden potential", milestone: 35, milestoneLabel: "35 tasks completed" },
  { name: "Piano", emoji: "🎹", description: "Plays the melody of your soul", milestone: 50, milestoneLabel: "50 tasks completed" },
];

export default function MagicShopPage() {
  const navigate = useNavigate();
  const { allTodos } = useTodos();
  const [comfortOpen, setComfortOpen] = useState(false);
  const [comfortText, setComfortText] = useState("");

  const totalCompleted = allTodos.filter((t) => t.completed).length;

  const openComfort = () => {
    setComfortText(getRandomComfort());
    setComfortOpen(true);
  };

  return (
    <div className="min-h-screen bg-main-gradient relative overflow-hidden pb-28">
      {/* Galaxy particle overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/20"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/")} className="glass-card p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={openComfort} className="glass-card p-2 rounded-xl text-primary hover:scale-105 transition-transform">
            <Cookie className="w-5 h-5" />
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-display font-semibold gradient-text mb-1">Magic Shop</h1>
          <p className="text-sm font-body text-muted-foreground">Complete tasks to unlock treasures 💜</p>
          <div className="mt-3 glass-card rounded-full px-4 py-1.5 inline-block">
            <span className="text-xs font-body font-semibold text-primary">{totalCompleted} tasks completed</span>
          </div>
        </motion.div>
      </div>

      {/* Shelves */}
      <div className="relative z-10 px-4 space-y-4 max-w-lg mx-auto">
        {shopItems.map((item, i) => {
          const unlocked = totalCompleted >= item.milestone;
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`glass-card rounded-2xl p-5 flex items-center gap-4 transition-all ${
                unlocked ? "" : "opacity-60"
              }`}
              style={unlocked ? { boxShadow: "0 0 24px hsl(275 55% 65% / 0.15), 0 0 48px hsl(275 55% 65% / 0.08)" } : {}}
            >
              <motion.span
                className={`text-4xl block ${unlocked ? "" : "grayscale"}`}
                animate={unlocked ? { y: [0, -4, 0] } : {}}
                transition={unlocked ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {}}
                whileHover={unlocked ? { scale: 1.15 } : {}}
              >
                {item.emoji}
              </motion.span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-display font-semibold text-foreground">{item.name}</h3>
                <p className="text-xs font-body text-muted-foreground">{item.description}</p>
              </div>
              <div className="shrink-0">
                {unlocked ? (
                  <motion.span
                    className="text-xs font-body font-semibold text-primary"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✨ Unlocked
                  </motion.span>
                ) : (
                  <span className="text-[10px] font-body text-muted-foreground text-right block">{item.milestoneLabel}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Comfort Jar Modal */}
      <AnimatePresence>
        {comfortOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setComfortOpen(false)}
          >
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <motion.div
              className="glass-card rounded-3xl p-8 max-w-sm w-full text-center relative z-10"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ boxShadow: "0 0 60px hsl(275 55% 65% / 0.2)" }}
            >
              <span className="text-4xl block mb-4">🫙</span>
              <p className="text-lg font-display italic text-foreground/90 leading-relaxed">
                "{comfortText}"
              </p>
              <button
                onClick={() => setComfortOpen(false)}
                className="mt-6 text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                close 💜
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
