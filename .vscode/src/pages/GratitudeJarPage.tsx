import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/client";
import { useToast } from "@/hooks/use-toast";

function getJarMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}function jarLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Entry { id: string; content: string; entry_date: string; jar_month: string; }
type View = "write" | "submit-anim" | "jars" | "jar-open";

export default function GratitudeJarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<View>("write");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [todayDone, setTodayDone] = useState(false);
  const [todayEntry, setTodayEntry] = useState<Entry | null>(null);

  const [allMonths, setAllMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthEntries, setMonthEntries] = useState<Entry[]>([]);
  const [searchDate, setSearchDate] = useState("");
  const [shaking, setShaking] = useState(false);
  const [highlightedEntry, setHighlightedEntry] = useState<Entry | null>(null);
  const [openEntry, setOpenEntry] = useState<Entry | null>(null);

  const loadMonths = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("gratitude_entries").select("jar_month")
      .eq("user_id", user.id).order("jar_month", { ascending: false });
    if (data) setAllMonths([...new Set(data.map((r) => r.jar_month))]);
  }, [user]);

  // check if today already written
  const checkToday = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("gratitude_entries").select("*")
      .eq("user_id", user.id).eq("entry_date", todayISO()).maybeSingle();
    if (data) { setTodayDone(true); setTodayEntry(data); }
    else { setTodayDone(false); setTodayEntry(null); }
  }, [user]);

  useEffect(() => { loadMonths(); checkToday(); }, [loadMonths, checkToday]);

  const loadMonthEntries = useCallback(async (month: string) => {
    if (!user) return;
    const { data } = await supabase.from("gratitude_entries").select("*")
      .eq("user_id", user.id).eq("jar_month", month).order("entry_date", { ascending: true });
    setMonthEntries(data ?? []);
  }, [user]);

  useEffect(() => { if (selectedMonth) loadMonthEntries(selectedMonth); }, [selectedMonth, loadMonthEntries]);

  const handleSubmit = async () => {
    if (!user || !text.trim() || todayDone) return;
    setSaving(true);
    const { error } = await supabase.from("gratitude_entries").upsert({
      user_id: user.id, content: text.trim(),
      entry_date: todayISO(), jar_month: getJarMonth(),
    }, { onConflict: "user_id,entry_date" });
    setSaving(false);
    if (error) { toast({ title: "Failed to save", variant: "destructive" }); return; }
    setTodayDone(true);
    await loadMonths();
    setView("submit-anim");
    setTimeout(() => { setText(""); setView("write"); }, 5000);
  };

  const handleSearch = () => {
    if (!searchDate.trim()) return;
    const parsed = new Date(searchDate);
    if (isNaN(parsed.getTime())) { toast({ title: "Try '23 March 2025'" }); return; }
    const iso = parsed.toISOString().split("T")[0];
    const found = monthEntries.find((e) => e.entry_date === iso);
    setShaking(true);
    setTimeout(() => setShaking(false), 700);
    setTimeout(() => {
      if (found) setHighlightedEntry(found);
      else toast({ title: "No entry found for that date 💜" });
    }, 750);
  };

  return (
    <div className="min-h-screen bg-main-gradient relative overflow-hidden flex flex-col items-center px-4 pt-6 pb-28">
      <div className="w-full max-w-lg flex items-center gap-3 mb-6">
        <button onClick={() => view === "jar-open" ? setView("jars") : view === "jars" ? setView("write") : navigate("/")}
          className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-display font-semibold gradient-text">Gratitude Jar 🫙</h1>
      </div>

      <AnimatePresence mode="wait">

        {/* ── WRITE VIEW ── */}
        {view === "write" && (
          <motion.div key="write" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-lg flex flex-col gap-4">

            {/* Today done banner */}
            {todayDone && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl px-5 py-4 flex items-center gap-3 border border-primary/20">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-body font-semibold text-foreground">Today's gratitude is sealed 💜</p>
                  <p className="text-xs font-body text-muted-foreground">Come back tomorrow to add more</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => todayEntry && setOpenEntry(todayEntry)}
                  className="text-xs font-body text-primary underline shrink-0">Read it</motion.button>
              </motion.div>
            )}

            {/* Parchment — disabled if today done */}
            <div className={`relative ${todayDone ? "opacity-40 pointer-events-none select-none" : ""}`}>
              <svg viewBox="0 0 400 20" className="w-full" style={{ marginBottom: -1 }}>
                <path d="M0,20 Q20,2 40,14 Q60,26 80,8 Q100,0 120,12 Q140,24 160,6 Q180,0 200,14 Q220,26 240,8 Q260,0 280,16 Q300,28 320,10 Q340,2 360,14 Q380,24 400,8 L400,20 Z" fill="hsl(40 60% 92%)" />
              </svg>
              <div className="relative px-7 py-6" style={{ background: "hsl(40 60% 92%)", boxShadow: "2px 4px 24px rgba(0,0,0,0.18)" }}>
                <div className="absolute top-3 right-5 w-8 h-8 rounded-full opacity-10" style={{ background: "hsl(25 60% 40%)" }} />
                <p className="text-xs font-body text-amber-900/50 mb-3 italic">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
                <textarea value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="What are you grateful for today? ✨"
                  rows={8} disabled={todayDone}
                  className="w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed text-amber-950 placeholder:text-amber-900/30 font-body"
                  style={{ fontFamily: "'Georgia', serif" }} />
              </div>
              <svg viewBox="0 0 400 20" className="w-full" style={{ marginTop: -1 }}>
                <path d="M0,0 Q20,18 40,6 Q60,-6 80,12 Q100,20 120,8 Q140,-4 160,14 Q180,22 200,6 Q220,-4 240,12 Q260,20 280,4 Q300,-8 320,10 Q340,20 360,6 Q380,-4 400,12 L400,0 Z" fill="hsl(40 60% 92%)" />
              </svg>
            </div>

            <div className="flex gap-3">
              {!todayDone && (
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit} disabled={saving || !text.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-body font-semibold text-primary-foreground disabled:opacity-40"
                  style={{ background: "var(--gradient-accent)" }}>
                  {saving ? "Saving..." : "Drop in Jar 🫙"}
                </motion.button>
              )}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setView("jars")}
                className="flex-1 py-3 rounded-xl text-sm font-body font-semibold glass-card text-foreground">
                Open Jars 🫙
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── SUBMIT ANIMATION ── */}
        {view === "submit-anim" && (
          <motion.div key="anim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-8 w-full max-w-lg min-h-[70vh] relative overflow-hidden">

            {/* Paper rolling into scroll */}
            <motion.div className="relative flex flex-col items-center">
              <motion.div
                initial={{ scaleY: 1, opacity: 1, y: 0 }}
                animate={{ scaleY: 0.05, opacity: 0.8, y: 40, borderRadius: "50%" }}
                transition={{ duration: 0.7, delay: 0.2, ease: "easeIn" }}
                className="w-52 h-36 rounded-lg flex items-center justify-center text-amber-950 text-xs font-body italic"
                style={{ background: "hsl(40 60% 92%)", transformOrigin: "bottom", boxShadow: "2px 4px 16px rgba(0,0,0,0.15)" }}>
                ✨ Gratitude sealed
              </motion.div>
              {/* ribbon wrapping */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.85, duration: 0.3 }}
                className="absolute bottom-0 w-16 h-2 rounded-full"
                style={{ background: "hsl(330 60% 65%)" }} />
            </motion.div>

            {/* Iridescent jar rising */}
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0, type: "spring", stiffness: 120 }}
              className="relative flex flex-col items-center">
              <JarSVG label={jarLabel(getJarMonth())} glowing size={180} />
              {/* letter dropping in */}
              <motion.div
                initial={{ y: -60, opacity: 1, rotate: -15 }}
                animate={{ y: 30, opacity: 0, rotate: 5, scale: 0.3 }}
                transition={{ duration: 0.55, delay: 1.5 }}
                className="absolute top-4 w-10 h-7 rounded bg-amber-100 border border-amber-300 flex items-center justify-center text-[10px]"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                📜
              </motion.div>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
              className="text-sm font-body text-muted-foreground italic text-center">
              Your gratitude is sealed 💜<br />
              <span className="text-xs opacity-60">Setting sail into the ocean...</span>
            </motion.p>

            {/* Ocean scene — jar floating away */}
            <motion.div
              initial={{ x: -60, y: 0, opacity: 0 }}
              animate={{ x: [null, 0, 80, 200, 380], y: [null, 0, -8, 4, -6], opacity: [0, 1, 1, 1, 0] }}
              transition={{ duration: 2.2, delay: 2.2, ease: "easeInOut", times: [0, 0.1, 0.4, 0.7, 1] }}
              className="absolute bottom-16 left-0 flex flex-col items-center">
              <JarSVG label="" size={55} />
              {/* waves */}
              <div className="flex gap-0.5 mt-1">
                {[0,1,2].map(i => (
                  <motion.span key={i} className="text-base"
                    animate={{ y: [0, -3, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}>
                    🌊
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── JARS VIEW ── */}
        {view === "jars" && (
          <motion.div key="jars" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full max-w-lg">
            <p className="text-sm font-body text-muted-foreground mb-6 text-center">Tap a jar to open it</p>
            {allMonths.length === 0 && (
              <p className="text-center text-muted-foreground font-body text-sm mt-10">No jars yet — write your first gratitude! 💜</p>
            )}
            <div className="flex flex-wrap justify-center gap-10">
              {allMonths.map((month, i) => (
                <motion.button key={month}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -8, scale: 1.06 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setSelectedMonth(month); setSearchDate(""); setHighlightedEntry(null); setView("jar-open"); }}>
                  <JarSVG label={jarLabel(month)} size={130} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── JAR OPEN VIEW ── */}
        {view === "jar-open" && selectedMonth && (
          <motion.div key="jar-open" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full max-w-lg flex flex-col items-center gap-5">
            <p className="text-lg font-display font-semibold gradient-text">{jarLabel(selectedMonth)}</p>

            <div className="w-full flex gap-2">
              <input value={searchDate} onChange={(e) => setSearchDate(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. 23 March 2025"
                className="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSearch}
                className="px-4 py-2.5 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors">
                <Search className="w-4 h-4" />
              </motion.button>
            </div>

            <motion.div animate={shaking ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.6 }}
              className="relative flex flex-col items-center">
              <JarSVG label={jarLabel(selectedMonth)} size={200} />
              {/* Letters inside jar */}
              <div className="absolute bottom-10 flex flex-wrap justify-center gap-1.5 px-4 max-w-[160px]">
                {monthEntries.map((entry, i) => {
                  const isHighlighted = highlightedEntry?.id === entry.id;
                  return (
                    <motion.button key={entry.id}
                      animate={isHighlighted ? { y: -40, scale: 1.4, zIndex: 20 } : { y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 280 }}
                      whileHover={{ scale: 1.25 }}
                      onClick={() => setOpenEntry(entry)}
                      className="relative w-8 h-6 rounded-sm flex items-center justify-center text-[9px]"
                      style={{
                        background: isHighlighted ? "hsl(40 80% 88%)" : "hsl(40 60% 85%)",
                        border: isHighlighted ? "1px solid hsl(25 60% 60%)" : "1px solid hsl(40 40% 75%)",
                        boxShadow: isHighlighted ? "0 6px 16px rgba(0,0,0,0.25)" : "none",
                        transform: `rotate(${(i % 3 - 1) * 10}deg)`,
                      }} title={entry.entry_date}>
                      {isHighlighted && (
                        <span className="absolute -top-5 text-[9px] font-body text-primary whitespace-nowrap font-semibold">
                          {new Date(entry.entry_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      📜
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
            <p className="text-xs font-body text-muted-foreground">{monthEntries.length} gratitude{monthEntries.length !== 1 ? "s" : ""} in this jar</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── OPEN ENTRY MODAL ── */}
      <AnimatePresence>
        {openEntry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpenEntry(null)}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateX: -20 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full">
              <svg viewBox="0 0 400 20" className="w-full" style={{ marginBottom: -1 }}>
                <path d="M0,20 Q20,2 40,14 Q60,26 80,8 Q100,0 120,12 Q140,24 160,6 Q180,0 200,14 Q220,26 240,8 Q260,0 280,16 Q300,28 320,10 Q340,2 360,14 Q380,24 400,8 L400,20 Z" fill="hsl(40 60% 92%)" />
              </svg>
              <div className="px-7 py-6 relative" style={{ background: "hsl(40 60% 92%)" }}>
                <div className="flex justify-center mb-4">
                  <span className="px-4 py-1 rounded-full text-xs font-body font-semibold text-amber-900"
                    style={{ background: "hsl(25 70% 75%)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                    🎀 {new Date(openEntry.entry_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-amber-950 font-body whitespace-pre-wrap" style={{ fontFamily: "'Georgia', serif" }}>
                  {openEntry.content}
                </p>
              </div>
              <svg viewBox="0 0 400 20" className="w-full" style={{ marginTop: -1 }}>
                <path d="M0,0 Q20,18 40,6 Q60,-6 80,12 Q100,20 120,8 Q140,-4 160,14 Q180,22 200,6 Q220,-4 240,12 Q260,20 280,4 Q300,-8 320,10 Q340,20 360,6 Q380,-4 400,12 L400,0 Z" fill="hsl(40 60% 92%)" />
              </svg>
              <p className="text-center text-xs text-muted-foreground mt-3 font-body">tap outside to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Iridescent Jar SVG ────────────────────────────────────────────────────────
function JarSVG({ label, glowing = false, size = 110 }: { label: string; glowing?: boolean; size?: number }) {
  const id = `irid-${size}-${label.replace(/\s/g, "")}`;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 1.25} viewBox="0 0 100 125" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={glowing ? { filter: "drop-shadow(0 0 18px hsl(275 70% 70% / 0.7)) drop-shadow(0 0 6px hsl(200 80% 70% / 0.5))" } : { filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.18))" }}>
        <defs>
          {/* Iridescent gradient — shifts through purple, teal, pink */}
          <linearGradient id={`${id}-body`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="hsl(275 70% 80%)" stopOpacity="0.75" />
            <stop offset="30%"  stopColor="hsl(200 80% 78%)" stopOpacity="0.65" />
            <stop offset="60%"  stopColor="hsl(330 65% 80%)" stopOpacity="0.6"  />
            <stop offset="100%" stopColor="hsl(160 60% 75%)" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id={`${id}-lid`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="hsl(275 55% 55%)" />
            <stop offset="50%"  stopColor="hsl(200 60% 55%)" />
            <stop offset="100%" stopColor="hsl(330 55% 60%)" />
          </linearGradient>
          <linearGradient id={`${id}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="0.05" />
          </linearGradient>
          {/* stroke shimmer */}
          <linearGradient id={`${id}-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="hsl(275 80% 85%)" stopOpacity="0.9" />
            <stop offset="50%"  stopColor="hsl(200 90% 85%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(330 80% 85%)" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Lid top ridge */}
        <rect x="30" y="5" width="40" height="5" rx="2.5" fill={`url(#${id}-lid)`} opacity="0.9" />
        {/* Lid main */}
        <rect x="26" y="10" width="48" height="14" rx="4" fill={`url(#${id}-lid)`} />
        {/* Lid shine */}
        <rect x="28" y="11" width="44" height="5" rx="2" fill="white" opacity="0.25" />

        {/* Jar body */}
        <path d="M20 24 Q16 34 16 52 L16 96 Q16 108 30 111 L70 111 Q84 108 84 96 L84 52 Q84 34 80 24 Z"
          fill={`url(#${id}-body)`} stroke={`url(#${id}-stroke)`} strokeWidth="1.2" />

        {/* Inner glass depth */}
        <path d="M22 26 Q18 36 18 52 L18 96 Q18 106 30 109 L70 109 Q82 106 82 96 L82 52 Q82 36 78 26 Z"
          fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />

        {/* Shine streaks */}
        <path d="M24 32 Q22 55 22 75" stroke={`url(#${id}-shine)`} strokeWidth="3" strokeLinecap="round" />
        <path d="M30 28 Q28 40 28 52" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />

        {/* Iridescent colour blush inside */}
        <ellipse cx="65" cy="55" rx="12" ry="18" fill="hsl(330 70% 80%)" opacity="0.12" />
        <ellipse cx="35" cy="75" rx="10" ry="14" fill="hsl(200 80% 75%)" opacity="0.1" />

        {/* Water tint at bottom */}
        <path d="M16 88 Q50 80 84 88 L84 96 Q84 108 70 111 L30 111 Q16 108 16 96 Z"
          fill="hsl(200 70% 70%)" opacity="0.18" />

        {/* Bottom shine */}
        <ellipse cx="50" cy="108" rx="22" ry="3" fill="white" opacity="0.12" />
      </svg>
      {label && (
        <span className="text-[11px] font-body font-semibold text-foreground/70 text-center leading-tight max-w-[100px]">{label}</span>
      )}
    </div>
  );
}
