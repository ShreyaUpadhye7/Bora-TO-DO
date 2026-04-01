import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, Pencil, X, Save, Star, ChevronDown, ChevronUp, CalendarClock } from "lucide-react";
import { Todo } from "@/lib/types";
import { btsMembers } from "@/lib/bts-classifier";
import MemberProfileCard from "@/components/MemberProfileCard";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onEditDueDate?: (id: string, dueDate: string | null) => void;
  showDetails?: boolean;
}

export default function TodoItem({ todo, onToggle, onDelete, onEdit, onEditDueDate, showDetails = false }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [expanded, setExpanded] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [editingDate, setEditingDate] = useState(false);

  const member = btsMembers.find((m) => m.name === todo.memberName) || btsMembers[0];

  const handleSave = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      onEdit(todo.id, trimmed);
    }
    setEditing(false);
  };

  const isOverdue = todo.dueDate && !todo.completed && (() => {
    const [y, m, d] = todo.dueDate.split("-").map(Number);
    const due = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  })();

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: -40, scale: 0.95 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`glass-card rounded-2xl p-4 group transition-all ${
          todo.completed ? "opacity-60" : ""
        } ${isOverdue ? "ring-1 ring-destructive/40" : ""}`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onToggle(todo.id)}
            className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
              todo.completed
                ? "bg-primary border-primary"
                : "border-muted-foreground/30 hover:border-primary/50"
            }`}
          >
            <AnimatePresence>
              {todo.completed && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex gap-2 items-center">
                <input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  className="flex-1 glass-input rounded-lg px-3 py-1.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button onClick={handleSave} className="text-primary hover:text-primary/80 transition-colors">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-body font-medium leading-relaxed transition-all ${
                      todo.completed ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {todo.text}
                  </p>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    onClick={() => setShowMember(true)}
                    className="text-xs hover:scale-125 transition-transform cursor-pointer"
                    title={`View ${todo.memberName}'s profile`}
                  >
                    {todo.memberEmoji}
                  </button>
                  <span className="text-xs font-body font-semibold text-primary/80">{todo.memberName}</span>
                  <span className="text-xs text-muted-foreground">· {todo.memberLabel}</span>
                  {todo.dueDate && (
                    <span className={`text-[10px] font-body ml-auto flex items-center gap-0.5 ${isOverdue ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                      <CalendarClock className="w-3 h-3" />
                      {new Date(todo.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {!editing && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setEditText(todo.text); setEditing(true); }}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {onEditDueDate && (
                <Popover open={editingDate} onOpenChange={setEditingDate}>
                  <PopoverTrigger asChild>
                    <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <CalendarClock className="w-3.5 h-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border border-border rounded-xl shadow-lg z-50" align="end">
                    <Calendar
                      mode="single"
                      selected={todo.dueDate ? new Date(todo.dueDate + "T00:00:00") : undefined}
                      onSelect={(date) => {
                        onEditDueDate(todo.id, date ? format(date, "yyyy-MM-dd") : null);
                        setEditingDate(false);
                      }}
                      className={cn("p-3 pointer-events-auto")}
                    />
                    {todo.dueDate && (
                      <div className="px-3 pb-3">
                        <button type="button" onClick={() => { onEditDueDate(todo.id, null); setEditingDate(false); }}
                          className="text-xs text-muted-foreground hover:text-foreground font-body">
                          Clear date
                        </button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              )}
              {!todo.completed && (
                <button
                  onClick={() => onToggle(todo.id)}
                  className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
                  title="Mark done"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => onDelete(todo.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Expandable Details */}
        <AnimatePresence>
          {expanded && !editing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-3">
                <span className="text-xs font-body text-muted-foreground">Priority:</span>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < todo.severity ? "fill-primary text-primary" : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </span>
                {showDetails && (
                  <span className="text-xs font-body text-muted-foreground ml-auto">
                    {new Date(todo.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Member Profile Card */}
      <MemberProfileCard member={member} open={showMember} onClose={() => setShowMember(false)} />
    </>
  );
}
