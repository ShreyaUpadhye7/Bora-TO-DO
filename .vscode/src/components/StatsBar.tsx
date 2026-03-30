import { motion } from "framer-motion";

interface StatsBarProps {
  completed: number;
  total: number;
}

export default function StatsBar({ completed, total }: StatsBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-2xl p-4"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">
          Today's Progress
        </span>
        <span className="text-xs font-body font-bold text-primary">
          {completed}/{total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className="h-full rounded-full"
          style={{ background: "var(--gradient-accent)" }}
        />
      </div>
      {completed > 0 && completed === total && total > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-center mt-2 text-primary font-body font-medium"
        >
          ✨ All done! You're amazing! 💜
        </motion.p>
      )}
    </motion.div>
  );
}
