import { useState, useCallback, useEffect, useMemo } from "react";
import { Todo, TodoCategory } from "@/lib/types";
import { classifyTodo } from "@/lib/bts-classifier";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/client";

function isToday(timestamp: number) {
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function useTodos() {
  const { user } = useAuth();
  const [allTodos, setAllTodos] = useState<Todo[]>([]);

  useEffect(() => {
    if (!user) {
      setAllTodos([]);
      return;
    }

    const fetchTodos = async () => {
      const { data } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setAllTodos(data.map(mapRow));
      }
    };

    fetchTodos();

    const channel = supabase
      .channel("todos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos", filter: `user_id=eq.${user.id}` },
        () => fetchTodos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Today's todos
  const todayTodos = useMemo(
    () => allTodos.filter((t) => isToday(t.createdAt)),
    [allTodos]
  );

  // Past incomplete todos (tasks left undone)
  const undoneTodos = useMemo(
    () => allTodos.filter((t) => !isToday(t.createdAt) && !t.completed),
    [allTodos]
  );

  // Group by category
  const groupedTodos = useMemo(() => {
    const groups: Record<string, Todo[]> = {};
    todayTodos.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [todayTodos]);

  const groupedUndoneTodos = useMemo(() => {
    const groups: Record<string, Todo[]> = {};
    undoneTodos.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [undoneTodos]);

  const addTodo = useCallback(
    async (text: string, category: TodoCategory, severity: number, dueDate?: string) => {
      if (!user) return;
      const member = classifyTodo(text);
      await supabase.from("todos").insert({
        user_id: user.id,
        text,
        completed: false,
        category,
        severity,
        member_name: member.name,
        member_emoji: member.emoji,
        member_label: member.label,
        due_date: dueDate || null,
      });
    },
    [user]
  );

  const toggleTodo = useCallback(
    async (id: string) => {
      if (!user) return;
      const todo = allTodos.find((t) => t.id === id);
      if (!todo) return;
      await supabase.from("todos").update({ completed: !todo.completed }).eq("id", id);
    },
    [user, allTodos]
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      if (!user) return;
      await supabase.from("todos").delete().eq("id", id);
    },
    [user]
  );

  const editTodo = useCallback(
    async (id: string, text: string) => {
      if (!user) return;
      const member = classifyTodo(text);
      await supabase.from("todos").update({
        text,
        member_name: member.name,
        member_emoji: member.emoji,
        member_label: member.label,
      }).eq("id", id);
    },
    [user]
  );

  const completedCount = todayTodos.filter((t) => t.completed).length;
  const totalCount = todayTodos.length;
  const undoneCount = undoneTodos.length;

  return {
    todos: todayTodos,
    allTodos,
    groupedTodos,
    undoneTodos,
    groupedUndoneTodos,
    undoneCount,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    completedCount,
    totalCount,
  };
}

function mapRow(row: any): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    createdAt: new Date(row.created_at).getTime(),
    memberName: row.member_name,
    memberEmoji: row.member_emoji,
    memberLabel: row.member_label,
    category: row.category || "personal",
    severity: row.severity || 3,
    dueDate: row.due_date || null,
  };
}
