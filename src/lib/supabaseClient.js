import { createClient } from "@supabase/supabase-js";

// Replace these with your project's values, or set them as Vite env vars
// (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) in a .env file for safety.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR-ANON-PUBLIC-KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// The fixed demo stall id seeded by the migration. If you support multiple
// stalls later, this becomes dynamic (e.g. from a URL slug).
export const STALL_ID = "00000000-0000-0000-0000-000000000001";

export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
