// supabase/functions/_shared/auth.ts
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const SESSION_SECRET = Deno.env.get("OWNER_SESSION_SECRET")!;

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

export async function verifyOwnerToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header.");
  }
  const token = authHeader.replace("Bearer ", "").trim();
  const key = await getKey();
  const payload = await verify(token, key); // throws if invalid/expired
  return payload as { sub: string; stall_id: string; email: string; exp: number };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
