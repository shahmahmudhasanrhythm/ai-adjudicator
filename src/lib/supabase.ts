import { createClient } from "@supabase/supabase-js";

// This securely connects your Next.js backend to your Supabase Knowledge Graph
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);