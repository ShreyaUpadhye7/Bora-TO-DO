import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, CheckSquare, BookOpen, Timer, CalendarDays, Bell } from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/todos", icon: CheckSquare, label: "Tasks" },
  { path: "/calendar", icon: CalendarDays, label: "Calendar" },
  { path: "/journal", icon: BookOpen, label: "Journal" },
  { path: "/notifications", icon: Bell, label: "Alerts" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bouncing, setBouncing] = useState<string | null>(null);

  const currentPath = location.pathname;

  useEffect(() => {
    if (bouncing) {
      const t = setTimeout(() => setBouncing(null), 500);
      return () => clearTimeout(t);
    }
  }, [bouncing]);

  // Hide on auth page
  if (currentPath === "/auth") return null;

  const handleNav = (path: string) => {
    if (path === currentPath) return;
    setBouncing(path);
    navigate(path);
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <nav className="glass-nav rounded-2xl px-2 py-2 flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.path ||
            (item.path === "/todos" && ["/todos", "/undone", "/stats"].includes(currentPath));
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 ${
                  bouncing === item.path ? "animate-nav-bounce" : ""
                }`}
              />
              <span className="text-[10px] font-body font-medium relative z-10 mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
