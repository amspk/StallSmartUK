import { useEffect, useState, useCallback } from "react";
import { supabase, STALL_ID } from "../lib/supabaseClient";

export function useMenu({ includeInactive = false } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    let query = supabase
      .from("menu_items")
      .select("*")
      .eq("stall_id", STALL_ID)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!includeInactive) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) setError(error.message);
    else setItems(data || []);
    setLoading(false);
  }, [includeInactive]);

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("menu_items_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items", filter: `stall_id=eq.${STALL_ID}` },
        () => fetchItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  return { items, loading, error, refetch: fetchItems };
}
