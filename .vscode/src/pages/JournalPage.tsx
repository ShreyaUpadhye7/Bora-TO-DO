import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, ChevronLeft, ChevronRight, BookOpen, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/client";
import { btsMembers } from "@/lib/bts-classifier";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";

function getMemberForDate(date: Date) {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return btsMembers[dayOfYear % btsMembers.length];
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function displayDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const JournalPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const member = getMemberForDate(currentDate);
  const isToday = formatDate(currentDate) === formatDate(new Date());

  const loadEntry = useCallback(async () => {
    if (!user) return;
    setLoaded(false);
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", formatDate(currentDate))
      .maybeSingle();

    if (data) {
      setContent(data.content);
      setEntryId(data.id);
    } else {
      setContent("");
      setEntryId(null);
    }
    setLoaded(true);
  }, [user, currentDate]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const saveEntry = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (entryId) {
        await supabase
          .from("journal_entries")
          .update({ content, updated_at: new Date().toISOString() })
          .eq("id", entryId);
      } else {
        const { data } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            content,
            entry_date: formatDate(currentDate),
            member_name: member.name,
            member_emoji: member.emoji,
            member_label: member.label,
          })
          .select()
          .single();
        if (data) setEntryId(data.id);
      }
      toast({ title: "Saved 💜", description: "Your journal entry has been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const navigateDay = (delta: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + delta);
    if (next <= new Date()) setCurrentDate(next);
  };

  return (
    <div className="min-h-screen bg-main-gradient relative overflow-hidden">
      {/* Warm decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(var(--cat-selfcare) / 0.3), transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 -right-16 w-56 h-56 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.15), transparent 70%)" }}
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xs"
            style={{ left: `${10 + Math.random() * 80}%`, top: `${5 + Math.random() * 40}%` }}
            animate={{ opacity: [0.05, 0.25, 0.05], y: [0, -8, 0] }}
            transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          >
            {["📖", "✨", "🌸", "💜", "🦋", "✍️", "🌙", "💫"][i]}
          </motion.div>
        ))}
      </div>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 pb-28 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-display font-semibold gradient-text">Journal</h1>
          </div>
          <ThemeToggle />
        </motion.header>

        {/* Date Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-4 flex items-center justify-between mb-5"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateDay(-1)}
            className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <div className="text-center">
            <p className="text-sm font-body font-medium text-foreground">{displayDate(currentDate)}</p>
            {isToday && (
              <motion.p
                className="text-xs font-body text-primary font-semibold"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨ Today
              </motion.p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateDay(1)}
            disabled={isToday}
            className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* BTS Member of the Day */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-4 mb-5 flex items-center gap-4"
        >
          <motion.span
            className="text-4xl"
            animate={{ y: [0, -4, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            {member.emoji}
          </motion.span>
          <div className="flex-1">
            <p className="text-sm font-body font-semibold text-foreground">
              Today's guide: {member.name}
            </p>
            <p className="text-xs font-body text-muted-foreground">{member.label}</p>
          </div>
          <Sparkles className="w-4 h-4 text-primary/40" />
        </motion.div>

        {/* Journal Writing Area */}
        <AnimatePresence mode="wait">
          {loaded && (
            <motion.div
              key={formatDate(currentDate)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <div className="glass-card rounded-2xl p-1 flex-1 flex flex-col mb-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Dear diary... ${member.emoji}\n\nWhat's on your mind today?`}
                  className="flex-1 min-h-[50vh] w-full rounded-xl p-5 text-sm font-body text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none leading-relaxed bg-transparent"
                />
              </div>

              <motion.div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={saveEntry}
                  disabled={saving || !content.trim()}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-body font-semibold text-primary-foreground transition-all disabled:opacity-50 hover:opacity-90"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Entry"}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default JournalPage;
