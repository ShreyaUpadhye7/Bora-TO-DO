import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, FolderOpen, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import bgImage from "@/assets/bg-lavender.jpg";
import { useTodos } from "@/hooks/useTodos";
import { useAuth } from "@/hooks/useAuth";
import { useConfetti } from "@/hooks/useConfetti";
import AddTodoForm from "@/components/AddTodoForm";
import TodoItem from "@/components/TodoItem";
import MotivationalBanner from "@/components/MotivationalBanner";
import StatsBar from "@/components/StatsBar";
import ThemeToggle from "@/components/ThemeToggle";
import { CATEGORIES } from "@/lib/types";

const Index = () => {
  const { groupedTodos, addTodo, toggleTodo, deleteTodo, editTodo, completedCount, totalCount, undoneCount } = useTodos();
  const { user } = useAuth();
  const navigate = useNavigate();
  useConfetti(completedCount, totalCount);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="fixed inset-0 bg-background/70 backdrop-blur-sm" />

      <main className="relative z-10 max-w-lg mx-auto px-4 py-8 pb-28 min-h-screen flex flex-col">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 relative"
        >
          <div className="absolute left-0 top-1">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute right-0 top-1 flex gap-1">
            <button
              onClick={() => navigate("/undone")}
              className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground relative"
              title="Tasks Left Undone"
            >
              <FolderOpen className="w-4 h-4" />
              {undoneCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                  {undoneCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/stats")}
              className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title="View Stats"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-display font-semibold gradient-text mb-1">Borahae Tasks</h1>
          <p className="text-sm font-body text-muted-foreground">
            {user?.email ? `${user.email} 💜` : "Your calm space to grow 💜"}
          </p>
        </motion.header>

        <div className="mb-5"><MotivationalBanner /></div>
        <div className="mb-5"><StatsBar completed={completedCount} total={totalCount} /></div>
        <div className="mb-5"><AddTodoForm onAdd={addTodo} /></div>

        {/* Grouped Todo List */}
        <div className="flex-1 space-y-6">
          {Object.keys(groupedTodos).length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-5xl mb-3">🌙</p>
              <p className="text-sm font-body text-muted-foreground">No tasks yet. Start with something small.</p>
            </motion.div>
          ) : (
            CATEGORIES.filter((c) => groupedTodos[c.value]?.length).map((cat) => (
              <motion.div
                key={cat.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-sm font-body font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                  style={{ color: `hsl(var(--${cat.color}))` }}
                >
                  <span>{cat.emoji}</span> {cat.label}
                </h2>
                <div className="space-y-3 pl-2" style={{ borderLeft: `3px solid hsl(var(--${cat.color}) / 0.4)` }}>
                  <AnimatePresence mode="popLayout">
                    {groupedTodos[cat.value].map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleTodo}
                        onDelete={deleteTodo}
                        onEdit={editTodo}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
