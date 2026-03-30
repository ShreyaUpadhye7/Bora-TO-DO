import { motion } from "framer-motion";
import { getDailyQuote } from "@/lib/bts-quotes";

export default function MotivationalBanner() {
  const quote = getDailyQuote();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="glass-card rounded-2xl p-5 text-center"
    >
      <p className="text-sm font-body text-muted-foreground italic leading-relaxed">
        "{quote}"
      </p>
    </motion.div>
  );
}
