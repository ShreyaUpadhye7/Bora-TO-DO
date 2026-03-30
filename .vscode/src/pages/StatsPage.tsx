import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Target, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useTodos } from "@/hooks/useTodos";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ThemeToggle from "@/components/ThemeToggle";

const StatsPage = () => {
  const { allTodos } = useTodos();
  const navigate = useNavigate();

  const weeklyData = useMemo(() => {
    const days: { label: string; completed: number; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayTodos = allTodos.filter((t) => new Date(t.createdAt).toDateString() === dateStr);
      days.push({
        label: dayLabel,
        completed: dayTodos.filter((t) => t.completed).length,
        total: dayTodos.length,
      });
    }
    return days;
  }, [allTodos]);

  const categoryData = useMemo(() => {
    const cats: Record<string, { total: number; completed: number }> = {};
    allTodos.forEach((t) => {
      if (!cats[t.category]) cats[t.category] = { total: 0, completed: 0 };
      cats[t.category].total++;
      if (t.completed) cats[t.category].completed++;
    });
    return Object.entries(cats).map(([name, val]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace("-", " "),
      ...val,
    }));
  }, [allTodos]);

  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayTodos = allTodos.filter((t) => new Date(t.createdAt).toDateString() === dateStr);
      if (dayTodos.length > 0 && dayTodos.every((t) => t.completed)) {
        count++;
      } else if (dayTodos.length > 0) {
        break;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [allTodos]);

  const totalAll = allTodos.length;
  const completedAll = allTodos.filter((t) => t.completed).length;
  const rate = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

  const barColors = ["hsl(270, 40%, 55%)", "hsl(220, 50%, 55%)", "hsl(45, 80%, 50%)", "hsl(330, 45%, 60%)", "hsl(165, 25%, 55%)", "hsl(200, 25%, 55%)", "hsl(30, 35%, 55%)"];

  const statCards = [
    { label: "Total Tasks", value: totalAll, emoji: "📝", icon: Target, gradient: "from-primary/20 to-primary/5" },
    { label: "Completed", value: `${rate}%`, emoji: "✅", icon: TrendingUp, gradient: "from-green-500/20 to-green-500/5" },
    { label: "Streak", value: `${streak}d`, emoji: "🔥", icon: Flame, gradient: "from-orange-500/20 to-orange-500/5" },
  ];

  return (
    <div className="min-h-screen bg-main-gradient relative overflow-hidden pb-28">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 right-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-xs"
            style={{ left: `${10 + Math.random() * 80}%`, top: `${5 + Math.random() * 30}%` }}
            animate={{ opacity: [0.1, 0.3, 0.1], y: [0, -8, 0] }}
            transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          >
            {["📊", "⭐", "💜", "📈", "✨", "🏆", "🎯", "💪"][i]}
          </motion.div>
        ))}
      </div>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-8 min-h-screen flex flex-col">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/todos")}
              className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <ThemeToggle />
          </div>
          <div className="text-center">
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-4xl mb-2"
            >
              📊
            </motion.div>
            <h1 className="text-3xl font-display font-semibold gradient-text mb-1">Your Stats</h1>
            <p className="text-sm font-body text-muted-foreground">Track your purple journey 💜</p>
          </div>
        </motion.header>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.08, type: "spring" }}
              whileHover={{ y: -4, scale: 1.05 }}
              className="glass-card rounded-2xl p-4 text-center relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${stat.gradient} pointer-events-none`} />
              <div className="relative z-10">
                <motion.p
                  className="text-2xl mb-1"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                >
                  {stat.emoji}
                </motion.p>
                <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-2xl p-5 mb-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-body font-bold text-muted-foreground uppercase tracking-wider">
              Last 7 Days
            </h2>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barCategoryGap="20%">
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(270, 10%, 55%)" }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(270, 25%, 12%)",
                    border: "1px solid hsl(270, 15%, 25%)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "hsl(270, 15%, 85%)",
                  }}
                  formatter={(value: number, name: string) => [value, name === "completed" ? "Done" : "Total"]}
                />
                <Bar dataKey="total" fill="hsl(270, 15%, 30%)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="completed" fill="hsl(270, 40%, 55%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-body font-bold text-muted-foreground uppercase tracking-wider">
                By Category
              </h2>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" barCategoryGap="20%">
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(270, 10%, 55%)" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(270, 25%, 12%)",
                      border: "1px solid hsl(270, 15%, 25%)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "hsl(270, 15%, 85%)",
                    }}
                  />
                  <Bar dataKey="completed" radius={[0, 8, 8, 0]}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={barColors[i % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default StatsPage;
