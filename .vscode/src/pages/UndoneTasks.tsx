import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Sparkles, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTodos } from "@/hooks/useTodos";
import TodoItem from "@/components/TodoItem";
import { CATEGORIES } from "@/lib/types";
import { format } from "date-fns";

const UndoneTasks = () => {
  const { groupedUndoneTodos, groupedUpcomingTodos, upcomingTodos, toggleTodo, deleteTodo, editTodo, editTodoDueDate, undoneCount } = useTodos();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-main-gradient relative overflow-hidden pb-28">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 right-0 h-64 opacity-20"
          style={{ background: "radial-gradient(ellipse at top, hsl(var(--primary) / 0.2), transparent 70%)" }}
        />
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xs"
            style={{ left: `${5 + Math.random() * 90}%`, top: `${5 + Math.random() * 90}%` }}
            animate={{ opacity: [0.05, 0.2, 0.05], y: [0, -6, 0] }}
            transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          >
            {["🌙", "✨", "💫", "🌟", "🦋"][i % 5]}
          </motion.div>
        ))}
      </div>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/todos")}
            className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-4xl mb-2"
            >
              🌙
            </motion.div>
            <h1 className="text-3xl font-display font-semibold gradient-text mb-2">Tasks Left Undone</h1>
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-1.5">
              {undoneCount > 0 ? (
                <AlertCircle className="w-3 h-3 text-primary" />
              ) : (
                <Sparkles className="w-3 h-3 text-primary" />
              )}
              <span className="text-xs font-body font-semibold text-foreground">
                {undoneCount} {undoneCount === 1 ? "task" : "tasks"} waiting
              </span>
            </div>
          </div>
        </motion.header>

        <div className="flex-1 space-y-6">
          {undoneCount === 0 && upcomingTodos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-3xl p-10 text-center"
            >
              <motion.p className="text-5xl mb-4" animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}>✨</motion.p>
              <h2 className="text-xl font-display font-semibold text-foreground mb-2">All caught up!</h2>
              <p className="text-sm font-body text-muted-foreground">Nothing left undone — you're amazing! 💜</p>
            </motion.div>
          ) : (
            <>
              {/* Undone section */}
              {undoneCount > 0 && (
                <div className="space-y-6">
                  {CATEGORIES.filter((c) => groupedUndoneTodos[c.value]?.length).map((cat, catIdx) => (
                    <motion.div key={cat.value} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: catIdx * 0.1 }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{cat.emoji}</span>
                        <h2 className="text-sm font-body font-bold uppercase tracking-wider"
                          style={{ color: `hsl(var(--${cat.color}))` }}>{cat.label}</h2>
                        <span className="text-xs font-body text-muted-foreground">({groupedUndoneTodos[cat.value].length})</span>
                        <div className="flex-1 h-px" style={{ background: `hsl(var(--${cat.color}) / 0.2)` }} />
                      </div>
                      <div className="space-y-3 pl-3" style={{ borderLeft: `3px solid hsl(var(--${cat.color}) / 0.3)` }}>
                        <AnimatePresence mode="popLayout">
                          {groupedUndoneTodos[cat.value].map((todo) => (
                            <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo}
                              onEdit={editTodo} onEditDueDate={editTodoDueDate} showDetails />
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Upcoming section */}
              {upcomingTodos.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-body font-bold uppercase tracking-wider text-primary">Upcoming</h2>
                    <span className="text-xs font-body text-muted-foreground">({upcomingTodos.length})</span>
                    <div className="flex-1 h-px bg-primary/20" />
                  </div>
                  <div className="space-y-3 pl-3 border-l-2 border-primary/20">
                    <AnimatePresence mode="popLayout">
                      {upcomingTodos.map((todo) => (
                        <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo}
                          onEdit={editTodo} onEditDueDate={editTodoDueDate} showDetails />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default UndoneTasks;
