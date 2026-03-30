import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Calendar, Clock, Trash2, ArrowLeft, Sparkles } from "lucide-react";
import { format, isPast, isToday, isFuture } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/useEvents";

const NotificationsPage = () => {
  const { events, deleteEvent } = useEvents();
  const navigate = useNavigate();

  const { upcoming, past } = useMemo(() => {
    const upcoming = events.filter((e) => {
      const d = new Date(e.event_date);
      return isToday(d) || isFuture(d);
    });
    const past = events.filter((e) => {
      const d = new Date(e.event_date);
      return isPast(d) && !isToday(d);
    });
    return { upcoming, past };
  }, [events]);

  const EventCard = ({ event, dimmed = false, index = 0 }: { event: typeof events[0]; dimmed?: boolean; index?: number }) => (
    <motion.div
      initial={{ opacity: 0, x: -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.02, x: 4 }}
      className={`glass-card rounded-2xl p-4 flex items-start gap-4 ${dimmed ? "opacity-40" : ""}`}
    >
      <motion.div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative"
        style={{ background: dimmed ? "hsl(var(--muted))" : "var(--gradient-accent)" }}
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.4 }}
      >
        <Calendar className={`w-5 h-5 ${dimmed ? "text-muted-foreground" : "text-primary-foreground"}`} />
        {!dimmed && isToday(new Date(event.event_date)) && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-semibold text-foreground truncate">{event.title}</p>
        {event.description && (
          <p className="text-xs font-body text-muted-foreground truncate mt-0.5">{event.description}</p>
        )}
        <p className="text-xs font-body text-muted-foreground flex items-center gap-1 mt-1.5">
          <Clock className="w-3 h-3" />
          {format(new Date(event.event_date), "MMM d, yyyy · h:mm a")}
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.8 }}
        onClick={() => deleteEvent.mutate(event.id)}
        className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-main-gradient px-4 pt-6 pb-28 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 -right-10 w-40 h-40 rounded-full opacity-10"
          style={{ background: "var(--gradient-accent)" }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-40 -left-16 w-56 h-56 rounded-full opacity-5"
          style={{ background: "var(--gradient-accent)" }}
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xs"
            style={{ left: `${10 + Math.random() * 80}%`, top: `${10 + Math.random() * 80}%` }}
            animate={{ opacity: [0.1, 0.4, 0.1], y: [0, -10, 0] }}
            transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          >
            {["🔔", "✨", "💜", "🌙", "⭐"][i % 5]}
          </motion.div>
        ))}
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <button onClick={() => navigate("/")} className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-4xl mb-2"
          >
            🔔
          </motion.div>
          <h1 className="text-3xl font-display font-semibold gradient-text mb-1">Notifications</h1>
          <p className="text-sm font-body text-muted-foreground">
            {upcoming.length > 0 ? `${upcoming.length} upcoming event${upcoming.length > 1 ? "s" : ""} 💜` : "All caught up! 🌙"}
          </p>
        </motion.div>

        {/* Upcoming */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2 mb-4"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-body font-semibold uppercase tracking-widest text-primary">
              Upcoming ({upcoming.length})
            </h2>
            <div className="flex-1 h-px bg-border/50" />
          </motion.div>
          {upcoming.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <motion.p
                className="text-4xl mb-3"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🌙
              </motion.p>
              <p className="text-sm font-body text-muted-foreground">No upcoming events</p>
              <p className="text-xs font-body text-muted-foreground mt-1">Add events from the Calendar page 💜</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
            </div>
          )}
        </div>

        {/* Past */}
        {past.length > 0 && (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mb-4"
            >
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-body font-semibold uppercase tracking-widest text-muted-foreground">
                Past ({past.length})
              </h2>
              <div className="flex-1 h-px bg-border/30" />
            </motion.div>
            <div className="space-y-3">
              {past.map((e, i) => <EventCard key={e.id} event={e} dimmed index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
