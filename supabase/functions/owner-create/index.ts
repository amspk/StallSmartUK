// supabase/functions/owner-create/index.ts
//
// One-time / admin use: creates an owner account with a bcrypt-hashed
// password. Protected by a setup secret (NOT the same as anything public).
// Recommended: call this once to create your owner login, then either
// delete this function or keep the secret safe -- don't expose it in any
// frontend code.

import { createClient } from "npm:@supabase/supabase-js@2";
import { hash } from "npm:bcrypt-ts@5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SETUP_SECRET = Deno.env.get("OWNER_SETUP_SECRET")!; // set this yourself, any long random string

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { setup_secret, email, password, stall_id, stall_name } = await req.json();

    if (setup_secret !== SETUP_SECRET) {
      return new Response(JSON.stringify({ error: "Forbidden." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email || !password || password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Email and a password (8+ chars) are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let resolvedStallId = stall_id;
    if (!resolvedStallId) {
      const { data: stall, error: stallErr } = await supabase
        .from("stalls")
        .insert({ name: stall_name || "My Stall" })
        .select()
        .single();
      if (stallErr) throw stallErr;
      resolvedStallId = stall.id;
    }

    const password_hash = await hash(password, 10);

    const { data, error } = await supabase
      .from("owners")
      .insert({ email: email.toLowerCase().trim(), password_hash, stall_id: resolvedStallId })
      .select("id, email, stall_id")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ owner: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
