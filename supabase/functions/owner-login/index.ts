// supabase/functions/owner-login/index.ts
//
// Verifies an owner's email + password against the `owners` table
// (password_hash is bcrypt). Runs with the SERVICE ROLE key, server-side
// only -- the anon key never gets read access to this table.
//
// On success, returns a simple signed session token (a JWT-like opaque
// token) the frontend stores and sends back on owner-only actions.
// For a production system you'd want to use Supabase Auth properly, but
// this keeps things working with your existing custom `owners` table.

import { createClient } from "npm:@supabase/supabase-js@2";
import { compare } from "npm:bcrypt-ts@5";
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SESSION_SECRET = Deno.env.get("OWNER_SESSION_SECRET")!; // set this yourself, any long random string

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getKey() {
  const enc = new TextEncoder().encode(SESSION_SECRET);
  return crypto.subtle.importKey(
    "raw",
    enc,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: owner, error } = await supabase
      .from("owners")
      .select("id, stall_id, email, password_hash")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    // Always compare against something even if owner not found, to avoid
    // leaking via timing whether an email exists.
    const hashToCheck = owner?.password_hash ?? "$2a$10$invalidsaltinvalidsaltinvalidsa";
    const valid = await compare(password, hashToCheck);

    if (error || !owner || !valid) {
      return new Response(
        JSON.stringify({ error: "Invalid email or password." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const key = await getKey();
    const token = await create(
      { alg: "HS256", typ: "JWT" },
      {
        sub: owner.id,
        stall_id: owner.stall_id,
        email: owner.email,
        exp: getNumericDate(60 * 60 * 24 * 7), // 7 days
      },
      key
    );

    return new Response(
      JSON.stringify({
        token,
        owner: { id: owner.id, email: owner.email, stall_id: owner.stall_id },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
