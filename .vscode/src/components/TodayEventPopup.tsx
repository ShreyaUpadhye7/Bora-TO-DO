import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Bell } from "lucide-react";
import { isToday } from "date-fns";
import { useEvents, AppEvent } from "@/hooks/useEvents";

// Returns ms offset for a reminder_offset string
function reminderOffsetMs(offset: string): number {
  switch (offset) {
    case "1h": return 60 * 60 * 1000;
    case "1d": return 24 * 60 * 60 * 1000;
    case "1w": return 7 * 24 * 60 * 60 * 1000;
    case "1m": return 30 * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

function reminderLabel(offset: string): string {
  switch (offset) {
    case "1h": return "1 hour before";
    case "1d": return "1 day before";
    case "1w": return "1 week before";
    case "1m": return "1 month before";
    default: return "";
  }
}

export default function TodayEventPopup() {
  const { events, markNotified } = useEvents();
  const [visible, setVisible] = useState(false);
  const [popupEvents, setPopupEvents] = useState<AppEvent[]>([]);
  const [isReminder, setIsReminder] = useState(false);
  const shownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const now = Date.now();

    // 1. Today's unnotified events (same as before)
    const todayUnnotified = events.filter(
      (e) => isToday(new Date(e.event_date)) && !e.is_notified && !shownIdsRef.current.has(e.id)
    );

    // 2. Reminder-based: event is in the future but reminder window has arrived
    const reminderDue = events.filter((e) => {
      if (e.is_notified) return false;
      if (shownIdsRef.current.has(`reminder-${e.id}`)) return false;
      if (!e.reminder_offset) return false;
      const eventTime = new Date(e.event_date).getTime();
      if (eventTime <= now) return false; // already past
      const reminderTime = eventTime - reminderOffsetMs(e.reminder_offset);
      return now >= reminderTime;
    });

    if (todayUnnotified.length > 0) {
      todayUnnotified.forEach(e => shownIdsRef.current.add(e.id));
      setPopupEvents(todayUnnotified);
      setIsReminder(false);
      setVisible(true);
    } else if (reminderDue.length > 0) {
      reminderDue.forEach(e => shownIdsRef.current.add(`reminder-${e.id}`));
      setPopupEvents(reminderDue);
      setIsReminder(true);
      setVisible(true);
    }
  }, [events]);

  const dismiss = () => {
    if (!isReminder) popupEvents.forEach((e) => markNotified.mutate(e.id));
    setVisible(false);
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "task": return "text-purple-300";
      case "reminder": return "text-orange-300";
      default: return "text-blue-300";
    }
  };

  return (
    <AnimatePresence>
      {visible && popupEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
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
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-4xl mb-3">
              {isReminder ? "🔔" : "💜"}
            </motion.div>
            <p className="text-xs font-body font-semibold uppercase tracking-[0.2em] text-purple-300/80 mb-2">
              {isReminder ? "Reminder" : "Borahae!"}
            </p>
            <h2 className="text-xl font-display font-semibold text-white mb-3">
              {isReminder
                ? `${popupEvents.length === 1 ? "A reminder" : `${popupEvents.length} reminders`} for you`
                : `You have ${popupEvents.length === 1 ? "an event" : `${popupEvents.length} events`} today`}
            </h2>
            <div className="space-y-2 mb-4">
              {popupEvents.map((e) => (
                <div key={e.id} className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-2">
                    {isReminder ? <Bell className="w-3 h-3 text-orange-400" /> : <Sparkles className="w-3 h-3 text-purple-400" />}
                    <span className="text-sm font-body text-white/90">{e.title}</span>
                  </div>
                  {isReminder && e.reminder_offset && (
                    <span className="text-[10px] font-body text-white/40">{reminderLabel(e.reminder_offset)}</span>
                  )}
                  <span className={`text-[10px] font-body capitalize ${typeColor(e.event_type)}`}>{e.event_type}</span>
                </div>
              ))}
            </div>
            <button onClick={dismiss}
              className="px-6 py-2 rounded-xl text-sm font-body font-semibold text-white"
              style={{ background: "linear-gradient(135deg, hsl(275 55% 55%), hsl(285 45% 45%))" }}>
              Got it! ✨
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
