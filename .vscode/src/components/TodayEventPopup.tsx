import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { isToday } from "date-fns";
import { useEvents, AppEvent } from "@/hooks/useEvents";

export default function TodayEventPopup() {
  const { events, markNotified } = useEvents();
  const [visible, setVisible] = useState(false);
  const [todayEvents, setTodayEvents] = useState<AppEvent[]>([]);

  useEffect(() => {
    const unnotified = events.filter(
      (e) => isToday(new Date(e.event_date)) && !e.is_notified
    );
    if (unnotified.length > 0) {
      setTodayEvents(unnotified);
      setVisible(true);
    }
  }, [events]);

  const dismiss = () => {
    todayEvents.forEach((e) => markNotified.mutate(e.id));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && todayEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative rounded-2xl p-6 max-w-sm w-full text-center overflow-hidden"
            style={{
              background: "linear-gradient(145deg, hsl(275 40% 12%), hsl(280 30% 8%))",
              boxShadow: "0 0 80px hsl(275 60% 50% / 0.25), 0 0 40px hsl(275 60% 50% / 0.15), inset 0 1px 0 hsl(275 50% 40% / 0.3)",
              border: "1px solid hsl(275 40% 30% / 0.4)",
            }}
          >
            <button onClick={dismiss} className="absolute top-3 right-3 text-white/40 hover:text-white/80">
              <X className="w-5 h-5" />
            </button>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl mb-3"
            >
              💜
            </motion.div>
            <p className="text-xs font-body font-semibold uppercase tracking-[0.2em] text-purple-300/80 mb-2">
              Borahae!
            </p>
            <h2 className="text-xl font-display font-semibold text-white mb-3">
              You have {todayEvents.length === 1 ? "an event" : `${todayEvents.length} events`} today
            </h2>
            <div className="space-y-2 mb-4">
              {todayEvents.map((e) => (
                <div key={e.id} className="flex items-center justify-center gap-2">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span className="text-sm font-body text-white/90">{e.title}</span>
                </div>
              ))}
            </div>
            <button
              onClick={dismiss}
              className="px-6 py-2 rounded-xl text-sm font-body font-semibold text-white"
              style={{ background: "linear-gradient(135deg, hsl(275 55% 55%), hsl(285 45% 45%))" }}
            >
              Got it! ✨
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
