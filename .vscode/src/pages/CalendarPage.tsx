import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, X, Clock, Trash2, ArrowLeft, Sparkles, Timer } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useEvents, AppEvent } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(target: Date | null) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    if (!target) return;
    const tick = () => setDiff(Math.max(0, target.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, over: diff === 0 };
}

type View = "month" | "day";

const CalendarPage = () => {
  const { events, addEvent, deleteEvent } = useEvents();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<View>("month");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // add event form
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("12:00");
  const [description, setDescription] = useState("");

  // countdown
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownEventId, setCountdownEventId] = useState<string | null>(null);
  const countdownEvent = events.find(e => e.id === countdownEventId) ?? null;
  const countdown = useCountdown(countdownEvent ? new Date(countdownEvent.event_date) : null);

  // day view scroll to current hour
  const dayScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view === "day" && dayScrollRef.current) {
      const hour = new Date().getHours();
      dayScrollRef.current.scrollTop = Math.max(0, (hour - 1) * 56);
    }
  }, [view]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return { allDays: eachDayOfInterval({ start, end }), padStart: getDay(start) };
  }, [currentMonth]);

  const eventsOnDate = (date: Date) =>
    events.filter(e => isSameDay(new Date(e.event_date), date))
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setView("day");
    setShowAddForm(false);
  };

  const handleAddEvent = async () => {
    if (!title.trim()) return;
    const eventDate = new Date(selectedDate);
    const [h, m] = time.split(":").map(Number);
    eventDate.setHours(h, m, 0, 0);
    try {
      await addEvent.mutateAsync({
        title: title.trim(), description: description.trim(),
        event_date: eventDate.toISOString(), category: "personal",
      });
      toast({ title: "Event added! 💜" });
      setTitle(""); setTime("12:00"); setDescription(""); setShowAddForm(false);
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

  const dayEvents = eventsOnDate(selectedDate);
  const futureEvents = events.filter(e => new Date(e.event_date) > new Date())
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  return (
    <div className="min-h-screen bg-main-gradient px-4 pt-6 pb-28 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.15), transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 12, repeat: Infinity }} />
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
          <button onClick={() => view === "day" ? setView("month") : navigate("/")}
            className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-display font-semibold gradient-text">
              {view === "day" ? format(selectedDate, "MMMM d, yyyy") : "Calendar"}
            </h1>
            {view === "day" && (
              <p className="text-xs font-body text-muted-foreground">{format(selectedDate, "EEEE")}</p>
            )}
          </div>
          {/* Countdown toggle */}
          <button onClick={() => setShowCountdown(v => !v)}
            className={`p-2 rounded-xl glass-card transition-colors ${showCountdown ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Timer className="w-5 h-5" />
          </button>
        </motion.div>

        {/* ── COUNTDOWN PANEL ── */}
        <AnimatePresence>
          {showCountdown && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="w-4 h-4 text-primary" />
                  <span className="text-xs font-body font-semibold uppercase tracking-widest text-primary">Countdown</span>
                </div>
                {/* Event picker */}
                <select value={countdownEventId ?? ""}
                  onChange={e => setCountdownEventId(e.target.value || null)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-sm font-body text-foreground mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-transparent">
                  <option value="">Pick an event...</option>
                  {futureEvents.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.title} — {format(new Date(e.event_date), "MMM d, yyyy")}
                    </option>
                  ))}
                </select>
                {/* Countdown display */}
                {countdownEvent && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-xs font-body text-muted-foreground text-center mb-2">{countdownEvent.title}</p>
                    {countdown.over ? (
                      <p className="text-center text-sm font-body text-primary font-semibold">🎉 It's here!</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: countdown.days, label: "Days" },
                          { val: countdown.hours, label: "Hours" },
                          { val: countdown.mins, label: "Mins" },
                          { val: countdown.secs, label: "Secs" },
                        ].map(({ val, label }) => (
                          <div key={label} className="flex flex-col items-center glass-card rounded-xl py-2">
                            <motion.span key={val} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                              className="text-xl font-display font-semibold text-primary tabular-nums">
                              {String(val).padStart(2, "0")}
                            </motion.span>
                            <span className="text-[10px] font-body text-muted-foreground">{label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ── MONTH VIEW ── */}
          {view === "month" && (
            <motion.div key="month" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass-card rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <h2 className="text-xl font-display font-semibold text-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {WEEKDAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-body font-bold text-muted-foreground py-1 uppercase tracking-wider">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: days.padStart }).map((_, i) => <div key={`pad-${i}`} />)}
                  {days.allDays.map((day, idx) => {
                    const dayEvts = eventsOnDate(day);
                    const today = isToday(day);
                    return (
                      <motion.button key={day.toISOString()}
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.01 }} whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }}
                        onClick={() => handleDayClick(day)}
                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all font-body text-sm
                          ${today ? "ring-2 ring-primary/60 text-primary font-bold bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.2)]" : "hover:bg-accent/40 text-foreground"}`}>
                        <span className={today ? "text-primary font-bold" : ""}>{format(day, "d")}</span>
                        {dayEvts.length > 0 && (
                          <div className="flex gap-0.5 mt-0.5">
                            {dayEvts.slice(0, 3).map((_, i) => (
                              <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-primary"
                                animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
                            ))}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Today's events */}
              {eventsOnDate(new Date()).length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="glass-card rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-body font-semibold uppercase tracking-widest text-primary">Today's Events</h3>
                  </div>
                  <div className="space-y-2">
                    {eventsOnDate(new Date()).map(evt => (
                      <div key={evt.id} className="flex items-center gap-3 p-2 rounded-xl bg-primary/5">
                        <span className="text-lg">💜</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body font-semibold text-foreground truncate">{evt.title}</p>
                          <p className="text-xs font-body text-muted-foreground">{format(new Date(evt.event_date), "h:mm a")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── DAY VIEW ── */}
          {view === "day" && (
            <motion.div key="day" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>

              {/* Day nav */}
              <div className="flex items-center justify-between mb-4">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }}
                  className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <span className="text-sm font-body font-semibold text-foreground">
                  {isToday(selectedDate) ? "✨ Today" : format(selectedDate, "EEEE, MMM d")}
                </span>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
                  className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Add event button */}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddForm(v => !v)}
                className="w-full mb-4 py-2.5 rounded-xl glass-card flex items-center justify-center gap-2 text-sm font-body font-semibold text-primary">
                <Plus className="w-4 h-4" />
                Add Event
              </motion.button>

              {/* Add event form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                    <div className="glass-card rounded-2xl p-4 space-y-3">
                      <input value={title} onChange={e => setTitle(e.target.value)}
                        placeholder="Event title"
                        className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <input type="time" value={time} onChange={e => setTime(e.target.value)}
                        className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <textarea value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="Description (optional)" rows={2}
                        className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={handleAddEvent} disabled={!title.trim() || addEvent.isPending}
                          className="flex-1 py-2.5 rounded-xl text-primary-foreground font-body font-semibold text-sm disabled:opacity-40"
                          style={{ background: "var(--gradient-accent)" }}>
                          {addEvent.isPending ? "Adding..." : "Add Event 💜"}
                        </motion.button>
                        <button onClick={() => setShowAddForm(false)}
                          className="px-4 py-2.5 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 24-hour timeline */}
              <div ref={dayScrollRef} className="glass-card rounded-2xl overflow-y-auto" style={{ maxHeight: "60vh" }}>
                {HOURS.map(hour => {
                  const hourEvents = dayEvents.filter(e => new Date(e.event_date).getHours() === hour);
                  const isCurrentHour = isToday(selectedDate) && new Date().getHours() === hour;
                  return (
                    <div key={hour} className={`flex gap-3 px-4 border-b border-border/20 min-h-[56px] ${isCurrentHour ? "bg-primary/5" : ""}`}>
                      {/* Hour label */}
                      <div className="w-12 shrink-0 flex items-start pt-2">
                        <span className={`text-xs font-body ${isCurrentHour ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                          {format(new Date().setHours(hour, 0, 0, 0), "h a")}
                        </span>
                      </div>
                      {/* Events in this hour */}
                      <div className="flex-1 py-1.5 flex flex-col gap-1">
                        {isCurrentHour && (
                          <div className="flex items-center gap-1 mb-1">
                            <motion.div className="w-2 h-2 rounded-full bg-primary"
                              animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                            <span className="text-[10px] font-body text-primary">Now</span>
                          </div>
                        )}
                        {hourEvents.map(evt => (
                          <motion.div key={evt.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between rounded-lg px-3 py-1.5 group"
                            style={{ background: "hsl(var(--primary) / 0.12)", borderLeft: "3px solid hsl(var(--primary))" }}>
                            <div className="flex items-center gap-2 min-w-0">
                              <Clock className="w-3 h-3 text-primary shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-body font-semibold text-foreground truncate">{evt.title}</p>
                                <p className="text-[10px] font-body text-muted-foreground">{format(new Date(evt.event_date), "h:mm a")}</p>
                              </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
                              onClick={() => handleDelete(evt.id)}
                              className="opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive p-1 transition-opacity">
                              <Trash2 className="w-3 h-3" />
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {dayEvents.length === 0 && (
                <p className="text-center text-xs font-body text-muted-foreground mt-3">No events — tap "Add Event" to plan your day 💜</p>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default CalendarPage;
