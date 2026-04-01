import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface AppEvent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_date: string;
  category: string;
  is_notified: boolean;
  created_at: string;
  event_type: "task" | "event" | "reminder";
  is_all_day: boolean;
  reminder_offset: string | null; // '1h' | '1d' | '1w' | '1m' | null
}

export function useEvents() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const eventsQuery = useQuery({
    queryKey: ["events", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user!.id)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data as AppEvent[];
    },
  });

  const addEvent = useMutation({
    mutationFn: async (evt: {
      title: string; description: string; event_date: string; category: string;
      event_type?: string; is_all_day?: boolean; reminder_offset?: string | null;
    }) => {
      const { error } = await supabase.from("events").insert({ ...evt, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
    onError: () => toast({ title: "Failed to add event", variant: "destructive" }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
    onError: () => toast({ title: "Failed to delete event", variant: "destructive" }),
  });

  const markNotified = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").update({ is_notified: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
    onError: () => toast({ title: "Failed to update notification", variant: "destructive" }),
  });

  return { events: eventsQuery.data ?? [], isLoading: eventsQuery.isLoading, addEvent, deleteEvent, markNotified };
}
