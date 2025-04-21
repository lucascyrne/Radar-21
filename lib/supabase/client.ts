import { createClient } from "@supabase/supabase-js";

// Criar uma única instância do cliente Supabase com configurações aprimoradas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-client-info": "radar21-front",
      },
    },
  }
);

// Exportar a instância única
export default supabase;
