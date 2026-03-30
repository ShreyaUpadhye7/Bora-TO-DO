import { useState, useRef } from "react";
import { Plus, Star, CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { TodoCategory, CATEGORIES } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface AddTodoFormProps {
  onAdd: (text: string, category: TodoCategory, severity: number, dueDate?: string) => void;
}

export default function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<TodoCategory>("personal");
  const [severity, setSeverity] = useState<number>(3);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, category, severity, dueDate ? format(dueDate, "yyyy-MM-dd") : undefined);
    setText("");
    setDueDate(undefined);
    inputRef.current?.focus();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      <div className="flex gap-3 items-center">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind today? 💜"
          className="flex-1 glass-input rounded-xl px-5 py-3.5 text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="flex gap-3">
        <Select value={category} onValueChange={(v) => setCategory(v as TodoCategory)}>
          <SelectTrigger className="flex-1 glass-input rounded-xl border-none text-sm font-body">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border rounded-xl shadow-lg z-50">
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value} className="font-body text-sm">
                {c.emoji} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(severity)} onValueChange={(v) => setSeverity(Number(v))}>
          <SelectTrigger className="w-28 glass-input rounded-xl border-none text-sm font-body">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border rounded-xl shadow-lg z-50">
            {[1, 2, 3, 4, 5].map((s) => (
              <SelectItem key={s} value={String(s)} className="font-body text-sm">
                <span className="flex items-center gap-1">
                  {Array.from({ length: s }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                  ))}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "glass-input rounded-xl border-none px-3 py-2 text-sm font-body flex items-center gap-1.5 min-w-[90px]",
                !dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              {dueDate ? format(dueDate, "MMM d") : "Due"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover border border-border rounded-xl shadow-lg z-50" align="end">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className={cn("p-3 pointer-events-auto")}
            />
            {dueDate && (
              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={() => setDueDate(undefined)}
                  className="text-xs text-muted-foreground hover:text-foreground font-body"
                >
                  Clear date
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </motion.form>
  );
}
