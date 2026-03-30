import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, X, Clock, Trash2, ArrowLeft, CalendarDays, Sparkles } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CalendarPage = () => {
  const { events, addEvent, deleteEvent } = useEvents();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("12:00");
  const [description, setDescription] = useState("");

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    const padStart = getDay(start);
    return { allDays, padStart };
  }, [currentMonth]);

  const eventsOnDate = (date: Date) =>
    events.filter((e) => isSameDay(new Date(e.event_date), date));

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowAddModal(true);
    setTitle("");
    setTime("12:00");
    setDescription("");
  };

  const handleAddEvent = async () => {
    if (!title.trim() || !selectedDate) return;
    const eventDate = new Date(selectedDate);
    const [h, m] = time.split(":").map(Number);
    eventDate.setHours(h, m, 0, 0);

    try {
      await addEvent.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        event_date: eventDate.toISOString(),
        category: "personal",
      });
      toast({ title: "Event added! 💜" });
      setShowAddModal(false);
    } catch {
      toast({ title: "Failed to add event", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast({ title: "Event deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const selectedEvents = selectedDate ? eventsOnDate(selectedDate) : [];
  const totalEvents = events.length;

  return (
    <div className="min-h-screen bg-main-gradient px-4 pt-6 pb-28 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.15), transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-32 -left-24 w-48 h-48 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, hsl(var(--cat-selfcare) / 0.2), transparent 70%)" }}
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 18, repeat: Infinity }}
        />
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xs"
            style={{ left: `${15 + Math.random() * 70}%`, top: `${5 + Math.random() * 25}%` }}
            animate={{ opacity: [0.1, 0.3, 0.1], y: [0, -8, 0] }}
            transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }}
          >
            {["📅", "✨", "💜", "🌟", "📌", "🎀"][i]}
          </motion.div>
        ))}
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button onClick={() => navigate("/")} className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-2xl mb-1"
            >
              📅
            </motion.div>
            <h1 className="text-2xl font-display font-semibold gradient-text">Calendar</h1>
            <p className="text-xs font-body text-muted-foreground">{totalEvents} event{totalEvents !== 1 ? "s" : ""} scheduled</p>
          </div>
          <div className="w-9" /> {/* spacer */}
        </motion.div>

        {/* Month Navigation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-body font-bold text-muted-foreground py-1 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: days.padStart }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.allDays.map((day, idx) => {
              const dayEvents = eventsOnDate(day);
              const today = isToday(day);
              return (
                <motion.button
                  key={day.toISOString()}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.01 }}
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleDateClick(day)}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all font-body text-sm
                    ${today
                      ? "ring-2 ring-primary/60 text-primary font-bold shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                      : "hover:bg-accent/40 text-foreground"
                    }
                    ${today ? "bg-primary/10" : ""}
                  `}
                >
                  <span className={today ? "text-primary font-bold" : ""}>{format(day, "d")}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((_, idx) => (
                        <motion.span
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Today's events summary */}
        {eventsOnDate(new Date()).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-body font-semibold uppercase tracking-widest text-primary">Today's Events</h3>
            </div>
            <div className="space-y-2">
              {eventsOnDate(new Date()).map((evt) => (
                <div key={evt.id} className="flex items-center gap-3 p-2 rounded-xl bg-primary/5">
                  <span className="text-lg">💜</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-semibold text-foreground truncate">{evt.title}</p>
                    <p className="text-xs font-body text-muted-foreground">
                      {format(new Date(evt.event_date), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Event / Day View Modal */}
      <AnimatePresence>
        {showAddModal && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/40 backdrop-blur-md"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-3xl p-6 max-w-sm w-full border border-primary/10"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-display font-semibold text-foreground">
                    {format(selectedDate, "MMMM d, yyyy")}
                  </h2>
                  <p className="text-xs font-body text-muted-foreground">{format(selectedDate, "EEEE")}</p>
                </div>
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Existing events for this day */}
              {selectedEvents.length > 0 && (
                <div className="mb-5 space-y-2">
                  {selectedEvents.map((evt, i) => (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-accent/20"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">💜</span>
                        <div>
                          <p className="text-sm font-body font-semibold text-foreground">{evt.title}</p>
                          <p className="text-xs font-body text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(evt.event_date), "h:mm a")}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                        onClick={() => handleDelete(evt.id)}
                        className="text-destructive/60 hover:text-destructive p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add new event form */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Plus className="w-4 h-4" />
                  <span className="text-xs font-body font-semibold uppercase tracking-wider">New Event</span>
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event title"
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddEvent}
                  disabled={!title.trim() || addEvent.isPending}
                  className="w-full py-3 rounded-xl text-primary-foreground font-body font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  {addEvent.isPending ? "Adding..." : "Add Event 💜"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPage;
