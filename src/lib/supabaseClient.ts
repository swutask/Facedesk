// lib/supabaseClient.ts
import { useSession } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const useSupabaseClient = () => {
  const { session } = useSession();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createSupabaseClient = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const token = await session.getToken({ template: "supabase" });

        if (!token) {
          console.error("JWT token is undefined.");
          setLoading(false);
          return;
        }

        const client = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });

        setSupabase(client);
      } catch (err) {
        console.error("Error fetching Clerk session token:", err);
      } finally {
        setLoading(false);
      }
    };

    createSupabaseClient();
  }, [session]);

  return { supabase, loading };
};
