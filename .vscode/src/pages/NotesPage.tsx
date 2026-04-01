import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Download, Check, ChevronDown, ChevronRight, GripVertical, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/client";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
type BlockType = "text" | "bullet" | "checkbox" | "heading" | "divider";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  collapsed?: boolean;
  children?: Block[];
}

interface Note {
  id: string;
  title: string;
  content: Block[];
  color: string;
  created_at: string;
  updated_at: string;
}

const NOTE_COLORS = [
  { id: "default", bg: "hsl(275 30% 12%)", border: "hsl(275 30% 25%)" },
  { id: "purple",  bg: "hsl(275 40% 14%)", border: "hsl(275 55% 40%)" },
  { id: "blue",    bg: "hsl(220 40% 14%)", border: "hsl(220 55% 40%)" },
  { id: "green",   bg: "hsl(160 35% 13%)", border: "hsl(160 50% 38%)" },
  { id: "pink",    bg: "hsl(330 40% 14%)", border: "hsl(330 55% 45%)" },
  { id: "amber",   bg: "hsl(40 40% 13%)",  border: "hsl(40 70% 45%)"  },
];

function uid() { return Math.random().toString(36).slice(2, 10); }
function emptyBlock(type: BlockType = "text"): Block { return { id: uid(), type, content: "" }; }
function noteColor(id: string) { return NOTE_COLORS.find(c => c.id === id) ?? NOTE_COLORS[0]; }

// ── PDF export (no library needed — uses print) ───────────────────────────────
function exportToPDF(note: Note) {
  const lines = note.content.map(b => {
    switch (b.type) {
      case "heading":  return `<h2 style="margin:12px 0 4px">${b.content}</h2>`;
      case "bullet":   return `<li>${b.content}</li>`;
      case "checkbox": return `<div style="display:flex;gap:8px;align-items:center"><span style="font-size:14px">${b.checked ? "☑" : "☐"}</span><span style="${b.checked ? "text-decoration:line-through;opacity:0.5" : ""}">${b.content}</span></div>`;
      case "divider":  return `<hr style="border:none;border-top:1px solid #ccc;margin:12px 0"/>`;
      default:         return `<p style="margin:4px 0">${b.content}</p>`;
    }
  }).join("\n");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${note.title}</title>
  <style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#1a1a1a;line-height:1.6}h1{margin-bottom:8px}ul{padding-left:20px}</style>
  </head><body><h1>${note.title}</h1><p style="color:#888;font-size:12px">${new Date(note.created_at).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</p><hr/>${lines}</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NotesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [openNote, setOpenNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("notes").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    setNotes((data ?? []).map(r => ({ ...r, content: r.content as Block[] })));
    setLoading(false);
  }, [user]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const createNote = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("notes").insert({
      user_id: user.id, title: "Untitled", content: [emptyBlock()], color: "default",
    }).select().single();
    if (error || !data) return;
    const note = { ...data, content: data.content as Block[] };
    setNotes(prev => [note, ...prev]);
    setOpenNote(note);
  };

  const saveNote = useCallback(async (note: Note) => {
    setSaving(true);
    await supabase.from("notes").update({
      title: note.title, content: note.content, color: note.color,
      updated_at: new Date().toISOString(),
    }).eq("id", note.id);
    setSaving(false);
    setNotes(prev => prev.map(n => n.id === note.id ? note : n));
  }, []);

  // Auto-save on change with debounce
  useEffect(() => {
    if (!openNote) return;
    const t = setTimeout(() => saveNote(openNote), 800);
    return () => clearTimeout(t);
  }, [openNote, saveNote]);

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    setNotes(prev => prev.filter(n => n.id !== id));
    if (openNote?.id === id) setOpenNote(null);
    toast({ title: "Note deleted" });
  };

  // ── Block operations ────────────────────────────────────────────────────────
  const updateBlock = (blockId: string, changes: Partial<Block>) => {
    if (!openNote) return;
    setOpenNote({ ...openNote, content: openNote.content.map(b => b.id === blockId ? { ...b, ...changes } : b) });
  };

  const addBlockAfter = (blockId: string, type: BlockType = "text") => {
    if (!openNote) return;
    const idx = openNote.content.findIndex(b => b.id === blockId);
    const newBlocks = [...openNote.content];
    newBlocks.splice(idx + 1, 0, emptyBlock(type));
    setOpenNote({ ...openNote, content: newBlocks });
  };

  const deleteBlock = (blockId: string) => {
    if (!openNote || openNote.content.length <= 1) return;
    setOpenNote({ ...openNote, content: openNote.content.filter(b => b.id !== blockId) });
  };

  const changeBlockType = (blockId: string, type: BlockType) => {
    if (!openNote) return;
    setOpenNote({ ...openNote, content: openNote.content.map(b => b.id === blockId ? { ...b, type, checked: false } : b) });
  };

  if (loading) return <div className="min-h-screen bg-main-gradient flex items-center justify-center"><span className="text-2xl animate-pulse">📝</span></div>;

  return (
    <div className="min-h-screen bg-main-gradient px-4 pt-6 pb-28">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => openNote ? setOpenNote(null) : navigate("/")}
            className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-display font-semibold gradient-text flex-1">
            {openNote ? openNote.title || "Untitled" : "Notes 📝"}
          </h1>
          {openNote ? (
            <div className="flex items-center gap-2">
              {saving && <span className="text-[10px] font-body text-muted-foreground">Saving...</span>}
              <button onClick={() => exportToPDF(openNote)}
                className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors" title="Export PDF">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={() => deleteNote(openNote.id)}
                className="p-2 rounded-xl glass-card text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={createNote}
              className="p-2 rounded-xl glass-card text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        <AnimatePresence mode="wait">

          {/* ── NOTES LIST ── */}
          {!openNote && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {notes.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="text-sm font-body text-muted-foreground">No notes yet — tap + to create one</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {notes.map((note, i) => {
                    const col = noteColor(note.color);
                    const preview = note.content.find(b => b.content)?.content ?? "";
                    return (
                      <motion.button key={note.id}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setOpenNote(note)}
                        className="relative text-left rounded-2xl p-4 group"
                        style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                        <p className="text-sm font-display font-semibold text-foreground mb-1 truncate">{note.title || "Untitled"}</p>
                        <p className="text-xs font-body text-muted-foreground line-clamp-3 leading-relaxed">{preview || "Empty note"}</p>
                        <p className="text-[10px] font-body text-muted-foreground/50 mt-2">
                          {new Date(note.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                        <button onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── NOTE EDITOR ── */}
          {openNote && (
            <motion.div key="editor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>

              {/* Color picker */}
              <div className="flex items-center gap-2 mb-4">
                {NOTE_COLORS.map(col => (
                  <button key={col.id} onClick={() => setOpenNote({ ...openNote, color: col.id })}
                    className={`w-6 h-6 rounded-full transition-transform ${openNote.color === col.id ? "scale-125 ring-2 ring-white/40" : "hover:scale-110"}`}
                    style={{ background: col.border }} />
                ))}
              </div>

              {/* Title */}
              <input value={openNote.title}
                onChange={e => setOpenNote({ ...openNote, title: e.target.value })}
                placeholder="Note title..."
                className="w-full bg-transparent text-2xl font-display font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none mb-4 border-b border-border/30 pb-2"
              />

              {/* Blocks */}
              <div className="space-y-1">
                {openNote.content.map((block, idx) => (
                  <BlockEditor key={block.id} block={block} idx={idx}
                    onChange={changes => updateBlock(block.id, changes)}
                    onEnter={() => addBlockAfter(block.id, block.type === "checkbox" ? "checkbox" : block.type === "bullet" ? "bullet" : "text")}
                    onDelete={() => deleteBlock(block.id)}
                    onTypeChange={type => changeBlockType(block.id, type)}
                  />
                ))}
              </div>

              {/* Add block buttons */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/20">
                {([
                  { type: "text" as BlockType, label: "Text", icon: "¶" },
                  { type: "heading" as BlockType, label: "Heading", icon: "H" },
                  { type: "bullet" as BlockType, label: "Bullet", icon: "•" },
                  { type: "checkbox" as BlockType, label: "Checkbox", icon: "☐" },
                  { type: "divider" as BlockType, label: "Divider", icon: "—" },
                ]).map(({ type, label, icon }) => (
                  <button key={type}
                    onClick={() => {
                      const last = openNote.content[openNote.content.length - 1];
                      addBlockAfter(last.id, type);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card text-xs font-body text-muted-foreground hover:text-foreground transition-colors">
                    <span className="font-semibold">{icon}</span> {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Block Editor ──────────────────────────────────────────────────────────────
interface BlockEditorProps {
  block: Block;
  idx: number;
  onChange: (changes: Partial<Block>) => void;
  onEnter: () => void;
  onDelete: () => void;
  onTypeChange: (type: BlockType) => void;
}

function BlockEditor({ block, onChange, onEnter, onDelete, onTypeChange }: BlockEditorProps) {
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEnter(); }
    if (e.key === "Backspace" && block.content === "") { e.preventDefault(); onDelete(); }
  };

  if (block.type === "divider") {
    return (
      <div className="flex items-center gap-2 group py-1">
        <hr className="flex-1 border-border/40" />
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 group">
      {/* Type switcher */}
      <div className="relative mt-2">
        <button onClick={() => setShowTypeMenu(v => !v)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all">
          <GripVertical className="w-3 h-3" />
        </button>
        <AnimatePresence>
          {showTypeMenu && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="absolute left-0 top-6 z-20 glass-card rounded-xl p-1 shadow-lg min-w-[120px]">
              {(["text", "heading", "bullet", "checkbox", "divider"] as BlockType[]).map(t => (
                <button key={t} onClick={() => { onTypeChange(t); setShowTypeMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-body transition-colors ${block.type === t ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
                  {t === "text" ? "¶ Text" : t === "heading" ? "H Heading" : t === "bullet" ? "• Bullet" : t === "checkbox" ? "☐ Checkbox" : "— Divider"}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Checkbox */}
      {block.type === "checkbox" && (
        <button onClick={() => onChange({ checked: !block.checked })}
          className={`mt-2.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${block.checked ? "bg-primary border-primary" : "border-muted-foreground/40 hover:border-primary/50"}`}>
          {block.checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
        </button>
      )}

      {/* Bullet */}
      {block.type === "bullet" && (
        <span className="mt-2.5 text-primary shrink-0 text-sm">•</span>
      )}

      {/* Input */}
      {block.type === "heading" ? (
        <input value={block.content} onChange={e => onChange({ content: e.target.value })}
          onKeyDown={handleKeyDown} placeholder="Heading..."
          className={`flex-1 bg-transparent focus:outline-none font-display font-semibold text-xl text-foreground placeholder:text-muted-foreground/30 py-1`}
        />
      ) : (
        <textarea value={block.content} onChange={e => onChange({ content: e.target.value })}
          onKeyDown={handleKeyDown as any}
          placeholder={block.type === "bullet" ? "List item..." : block.type === "checkbox" ? "To-do item..." : "Write something..."}
          rows={1}
          className={`flex-1 bg-transparent focus:outline-none text-sm font-body text-foreground placeholder:text-muted-foreground/30 resize-none py-1.5 leading-relaxed ${block.checked ? "line-through opacity-50" : ""}`}
          style={{ minHeight: "28px" }}
          onInput={e => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = "auto";
            t.style.height = t.scrollHeight + "px";
          }}
        />
      )}
    </div>
  );
}
