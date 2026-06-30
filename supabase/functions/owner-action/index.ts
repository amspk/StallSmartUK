// supabase/functions/owner-action/index.ts
//
// Single endpoint for all owner-only writes: accepting/rejecting orders,
// and adding/editing/deleting menu items, toggling stock. Requires a valid
// session token from owner-login. Uses the service role key to bypass RLS
// for these specific, validated operations only.

import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyOwnerToken, corsHeaders } from "../_shared/auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await verifyOwnerToken(req.headers.get("Authorization"));
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const body = await req.json();
    const { action } = body;

    // Helper to make sure owner only ever touches rows for their own stall
    const stallId = payload.stall_id;

    switch (action) {
      case "update_order_status": {
        const { order_id, status, rejection_reason } = body;
        const allowed = ["accepted", "rejected", "ready", "completed", "cancelled"];
        if (!allowed.includes(status)) {
          return jsonError("Invalid status.", 400);
        }
        const { data, error } = await supabase
          .from("orders")
          .update({ status, rejection_reason: status === "rejected" ? rejection_reason ?? null : null })
          .eq("id", order_id)
          .eq("stall_id", stallId)
          .select()
          .maybeSingle();
        if (error) return jsonError(error.message, 400);
        return jsonOk({ order: data });
      }

      case "upsert_menu_item": {
        const { item } = body;
        const row = {
          ...item,
          stall_id: stallId,
        };
        const { data, error } = await supabase
          .from("menu_items")
          .upsert(row)
          .select()
          .maybeSingle();
        if (error) return jsonError(error.message, 400);
        return jsonOk({ item: data });
      }

      case "delete_menu_item": {
        const { item_id } = body;
        const { error } = await supabase
          .from("menu_items")
          .delete()
          .eq("id", item_id)
          .eq("stall_id", stallId);
        if (error) return jsonError(error.message, 400);
        return jsonOk({ deleted: true });
      }

      case "set_stock": {
        const { item_id, is_out_of_stock, quantity_available } = body;
        const { data, error } = await supabase
          .from("menu_items")
          .update({ is_out_of_stock, quantity_available })
          .eq("id", item_id)
          .eq("stall_id", stallId)
          .select()
          .maybeSingle();
        if (error) return jsonError(error.message, 400);
        return jsonOk({ item: data });
      }

      default:
        return jsonError("Unknown action.", 400);
    }
  } catch (e) {
    return jsonError("Unauthorized or invalid request.", 401);
  }
});

function jsonOk(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
