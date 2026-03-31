import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/client";
import { useToast } from "@/hooks/use-toast";

// ── helpers ──────────────────────────────────────────────────────────────────
function getJarMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function jarLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function todayISO() { return new Date().toISOString().split("T")[0]; }

interface Entry { id: string; content: string; entry_date: string; jar_month: string; }

// ── VIEWS ─────────────────────────────────────────────────────────────────────
type View = "write" | "submit-anim" | "jars" | "jar-open";

export default function GratitudeJarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<View>("write");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  // jar browser
  const [allMonths, setAllMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthEntries, setMonthEntries] = useState<Entry[]>([]);
  const [searchDate, setSearchDate] = useState("");
  const [shaking, setShaking] = useState(false);
  const [highlightedEntry, setHighlightedEntry] = useState<Entry | null>(null);
  const [openEntry, setOpenEntry] = useState<Entry | null>(null);

  // load distinct months
  const loadMonths = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("gratitude_entries")
      .select("jar_month")
      .eq("user_id", user.id)
      .order("jar_month", { ascending: false });
    if (data) {
      const unique = [...new Set(data.map((r) => r.jar_month))];
      setAllMonths(unique);
    }
  }, [user]);

  useEffect(() => { loadMonths(); }, [loadMonths]);

  // load entries for selected month
  const loadMonthEntries = useCallback(async (month: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("gratitude_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("jar_month", month)
      .order("entry_date", { ascending: true });
    setMonthEntries(data ?? []);
  }, [user]);

  useEffect(() => {
    if (selectedMonth) loadMonthEntries(selectedMonth);
  }, [selectedMonth, loadMonthEntries]);

  // ── submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user || !text.trim()) return;
    setSaving(true);
    const today = todayISO();
    const month = getJarMonth();
    const { error } = await supabase.from("gratitude_entries").upsert({
      user_id: user.id,
      content: text.trim(),
      entry_date: today,
      jar_month: month,
    }, { onConflict: "user_id,entry_date" });
    setSaving(false);
    if (error) { toast({ title: "Failed to save", variant: "destructive" }); return; }
    setView("submit-anim");
    await loadMonths();
    setTimeout(() => { setText(""); setView("write"); }, 4200);
  };

  // ── jar search ──────────────────────────────────────────────────────────────
  const handleSearch = () => {
    if (!searchDate.trim()) return;
    // accept "23 march 2025" or "2025-03-23" or "march 23 2025"
    const parsed = new Date(searchDate);
    if (isNaN(parsed.getTime())) { toast({ title: "Couldn't parse that date, try '23 March 2025'" }); return; }
    const iso = parsed.toISOString().split("T")[0];
    const found = monthEntries.find((e) => e.entry_date === iso);
    setShaking(true);
    setTimeout(() => setShaking(false), 700);
    setTimeout(() => {
      if (found) setHighlightedEntry(found);
      else toast({ title: "No entry found for that date 💜" });
    }, 750);
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-main-gradient relative overflow-hidden flex flex-col items-center px-4 pt-6 pb-28">

      {/* back */}
      <div className="w-full max-w-lg flex items-center gap-3 mb-6">
        <button onClick={() => view === "jar-open" ? setView("jars") : view === "jars" ? setView("write") : navigate("/")}
          className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-display font-semibold gradient-text">Gratitude Jar 🫙</h1>
      </div>

      {/* ── WRITE VIEW ── */}
      <AnimatePresence mode="wait">
        {view === "write" && (
          <motion.div key="write" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-lg flex flex-col gap-4">

            {/* Parchment */}
            <div className="relative">
              {/* torn top edge */}
              <svg viewBox="0 0 400 20" className="w-full" style={{ marginBottom: -1 }}>
                <path d="M0,20 Q20,2 40,14 Q60,26 80,8 Q100,0 120,12 Q140,24 160,6 Q180,0 200,14 Q220,26 240,8 Q260,0 280,16 Q300,28 320,10 Q340,2 360,14 Q380,24 400,8 L400,20 Z"
                  fill="hsl(40 60% 92%)" />
              </svg>
              <div className="relative px-7 py-6" style={{ background: "hsl(40 60% 92%)", boxShadow: "2px 4px 24px rgba(0,0,0,0.18)" }}>
                {/* ink stain decoration */}
                <div className="absolute top-3 right-5 w-8 h-8 rounded-full opacity-10" style={{ background: "hsl(25 60% 40%)" }} />
                <div className="absolute bottom-4 left-4 w-5 h-5 rounded-full opacity-8" style={{ background: "hsl(25 60% 40%)" }} />
                <p className="text-xs font-body text-amber-900/50 mb-3 italic">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What are you grateful for today? ✨"
                  rows={8}
                  className="w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed text-amber-950 placeholder:text-amber-900/30 font-body"
                  style={{ fontFamily: "'Georgia', serif" }}
                />
              </div>
              {/* torn bottom edge */}
              <svg viewBox="0 0 400 20" className="w-full" style={{ marginTop: -1 }}>
                <path d="M0,0 Q20,18 40,6 Q60,-6 80,12 Q100,20 120,8 Q140,-4 160,14 Q180,22 200,6 Q220,-4 240,12 Q260,20 280,4 Q300,-8 320,10 Q340,20 360,6 Q380,-4 400,12 L400,0 Z"
                  fill="hsl(40 60% 92%)" />
              </svg>
            </div>

            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleSubmit} disabled={saving || !text.trim()}
                className="flex-1 py-3 rounded-xl text-sm font-body font-semibold text-primary-foreground disabled:opacity-40"
                style={{ background: "var(--gradient-accent)" }}>
                {saving ? "Saving..." : "Drop in Jar 🫙"}
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setView("jars")}
                className="px-5 py-3 rounded-xl text-sm font-body font-semibold glass-card text-foreground">
                Open Jars
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── SUBMIT ANIMATION ── */}
        {view === "submit-anim" && (
          <motion.div key="anim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-6 w-full max-w-lg min-h-[60vh]">

            {/* Paper rolling up */}
            <motion.div
              initial={{ scaleY: 1, opacity: 1 }}
              animate={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-48 h-32 rounded-lg flex items-center justify-center text-amber-950 text-xs font-body italic"
              style={{ background: "hsl(40 60% 92%)", transformOrigin: "bottom", boxShadow: "2px 4px 16px rgba(0,0,0,0.15)" }}
            >
              ✨ Gratitude sealed
            </motion.div>

            {/* Jar */}
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="relative flex flex-col items-center"
            >
              {/* Jar SVG */}
              <JarSVG label={jarLabel(getJarMonth())} glowing />

              {/* Letter going in */}
              <motion.div
                initial={{ y: -40, opacity: 1, scale: 0.6 }}
                animate={{ y: 20, opacity: 0, scale: 0.2 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="absolute top-0 w-8 h-6 rounded bg-amber-100 border border-amber-300"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              />
            </motion.div>

            {/* Ocean float away */}
            <motion.div
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x: 200, y: 40, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2, delay: 1.6 }}
              className="absolute bottom-32"
            >
              <JarSVG label={jarLabel(getJarMonth())} small />
              <motion.div
                animate={{ scaleX: [1, 1.1, 0.9, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-2xl text-center mt-1">🌊</motion.div>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
              className="text-sm font-body text-muted-foreground italic">
              Your gratitude is sealed in the jar 💜
            </motion.p>
          </motion.div>
        )}

        {/* ── JARS VIEW ── */}
        {view === "jars" && (
          <motion.div key="jars" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full max-w-lg">
            <p className="text-sm font-body text-muted-foreground mb-5 text-center">Tap a jar to open it</p>
            {allMonths.length === 0 && (
              <p className="text-center text-muted-foreground font-body text-sm mt-10">No jars yet — write your first gratitude! 💜</p>
            )}
            <div className="flex flex-wrap justify-center gap-8">
              {allMonths.map((month, i) => (
                <motion.button key={month}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -6, scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setSelectedMonth(month); setSearchDate(""); setHighlightedEntry(null); setView("jar-open"); }}
                  className="flex flex-col items-center gap-2">
                  <JarSVG label={jarLabel(month)} />
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

            {/* Search */}
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

            {/* Jar with letters */}
            <motion.div
              animate={shaking ? { x: [-6, 6, -5, 5, -3, 3, 0] } : {}}
              transition={{ duration: 0.6 }}
              className="relative flex flex-col items-center"
            >
              <JarSVG label={jarLabel(selectedMonth)} large />

              {/* Letters inside jar */}
              <div className="absolute bottom-8 flex flex-wrap justify-center gap-1 px-4 max-w-[140px]">
                {monthEntries.map((entry, i) => {
                  const isHighlighted = highlightedEntry?.id === entry.id;
                  return (
                    <motion.button key={entry.id}
                      animate={isHighlighted ? { y: -30, scale: 1.3, zIndex: 10 } : { y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => setOpenEntry(entry)}
                      className="relative w-7 h-5 rounded-sm flex items-center justify-center text-[8px]"
                      style={{
                        background: isHighlighted ? "hsl(40 80% 88%)" : "hsl(40 60% 85%)",
                        border: isHighlighted ? "1px solid hsl(25 60% 60%)" : "1px solid hsl(40 40% 75%)",
                        boxShadow: isHighlighted ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
                        transform: `rotate(${(i % 3 - 1) * 8}deg)`,
                      }}
                      title={entry.entry_date}
                    >
                      {isHighlighted && (
                        <span className="absolute -top-4 text-[9px] font-body text-primary whitespace-nowrap">
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
              className="relative max-w-sm w-full"
            >
              {/* torn top */}
              <svg viewBox="0 0 400 20" className="w-full" style={{ marginBottom: -1 }}>
                <path d="M0,20 Q20,2 40,14 Q60,26 80,8 Q100,0 120,12 Q140,24 160,6 Q180,0 200,14 Q220,26 240,8 Q260,0 280,16 Q300,28 320,10 Q340,2 360,14 Q380,24 400,8 L400,20 Z"
                  fill="hsl(40 60% 92%)" />
              </svg>
              <div className="px-7 py-6 relative" style={{ background: "hsl(40 60% 92%)" }}>
                {/* ribbon date */}
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
              {/* torn bottom */}
              <svg viewBox="0 0 400 20" className="w-full" style={{ marginTop: -1 }}>
                <path d="M0,0 Q20,18 40,6 Q60,-6 80,12 Q100,20 120,8 Q140,-4 160,14 Q180,22 200,6 Q220,-4 240,12 Q260,20 280,4 Q300,-8 320,10 Q340,20 360,6 Q380,-4 400,12 L400,0 Z"
                  fill="hsl(40 60% 92%)" />
              </svg>
              <p className="text-center text-xs text-muted-foreground mt-3 font-body">tap outside to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Jar SVG component ─────────────────────────────────────────────────────────
function JarSVG({ label, glowing = false, small = false, large = false }: { label: string; glowing?: boolean; small?: boolean; large?: boolean }) {
  const size = small ? 60 : large ? 160 : 110;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 1.2} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={glowing ? { filter: "drop-shadow(0 0 12px hsl(275 60% 65% / 0.5))" } : {}}>
        {/* lid */}
        <rect x="28" y="8" width="44" height="14" rx="4" fill="hsl(25 60% 55%)" />
        <rect x="32" y="6" width="36" height="6" rx="3" fill="hsl(25 50% 65%)" />
        {/* jar body */}
        <path d="M22 22 Q18 30 18 50 L18 95 Q18 105 30 108 L70 108 Q82 105 82 95 L82 50 Q82 30 78 22 Z"
          fill="hsl(200 40% 85% / 0.55)" stroke="hsl(200 30% 70% / 0.6)" strokeWidth="1.5" />
        {/* glass shine */}
        <path d="M26 30 Q24 50 24 70" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
        <path d="M32 26 Q30 35 30 45" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
        {/* water/ocean tint at bottom */}
        <path d="M18 85 Q50 78 82 85 L82 95 Q82 105 70 108 L30 108 Q18 105 18 95 Z"
          fill="hsl(200 60% 70% / 0.2)" />
      </svg>
      {/* label on lid */}
      <span className="text-[10px] font-body font-semibold text-foreground/70 -mt-2 text-center leading-tight max-w-[80px]">{label}</span>
    </div>
  );
}
