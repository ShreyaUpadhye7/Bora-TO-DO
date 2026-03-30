import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { BTSMember } from "@/lib/bts-classifier";

interface MemberProfileCardProps {
  member: BTSMember;
  open: boolean;
  onClose: () => void;
}

const memberQuotes: Record<string, string> = {
  RM: "Even if you're not perfect, you're limited edition.",
  Jin: "Life is tough, but we should be brave and go on.",
  Suga: "Go on your path, even if you live for a day.",
  "J-Hope": "Dream, though your beginnings might be humble, may the end be prosperous.",
  Jimin: "Your presence can give happiness. I hope you remember that.",
  V: "Don't be trapped in someone else's dream.",
  Jungkook: "If you don't work hard, there won't be good results.",
};

const memberBio: Record<string, string> = {
  RM: "The visionary leader. Guides your deep thinking tasks with wisdom and strategy.",
  Jin: "The joyful spirit. Brings laughter and warmth to your social & creative moments.",
  Suga: "The chill genius. Accompanies your restful, musical, and reflective moments.",
  "J-Hope": "The sunshine. Energizes your workouts, dances, and active routines.",
  Jimin: "The gentle soul. Nurtures your self-care, kindness, and heartfelt moments.",
  V: "The creative soul. Inspires your artistic, aesthetic, and imaginative tasks.",
  Jungkook: "The golden achiever. Pushes you through late-night grinds and ambitious goals.",
};

export default function MemberProfileCard({ member, open, onClose }: MemberProfileCardProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative glass-card rounded-3xl p-6 max-w-xs w-full text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
              className="text-6xl mb-3"
            >
              {member.emoji}
            </motion.div>

            <h3 className="text-2xl font-display font-semibold" style={{ color: member.color }}>
              {member.name}
            </h3>
            <p className="text-xs font-body font-bold uppercase tracking-wider text-muted-foreground mt-1">
              {member.label}
            </p>

            <p className="text-sm font-body text-foreground/80 mt-4 leading-relaxed">
              {memberBio[member.name] || "A beloved BTS member guiding your tasks."}
            </p>

            <div className="mt-4 p-3 rounded-xl bg-secondary/50">
              <p className="text-xs font-body italic text-muted-foreground leading-relaxed">
                "{memberQuotes[member.name] || "You're doing great. Keep going. 💜"}"
              </p>
            </div>

            <div className="mt-4 flex justify-center gap-1">
              {["💜", "💜", "💜"].map((h, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-sm"
                >
                  {h}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
