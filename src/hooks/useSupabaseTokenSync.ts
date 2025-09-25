import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useSupabase } from "@/context/supabaseContext";

export const useSupabaseTokenSync = () => {
  const { getToken } = useAuth();  
  const supabaseContext = useSupabase();
  const supabase = supabaseContext?.supabase;

  useEffect(() => {
    if(!supabase) {
        return;
    }
    
    const syncToken = async () => {
      const token = await getToken({ template: "supabase" }); // ensure you set up the "supabase" template in Clerk
      if (token) {
        supabase.auth.setAuth(token);
      }
    };

    // Immediately sync on mount
    syncToken();

    // Refresh every 50 minutes (JWT usually valid for 60 minutes)
    const interval = setInterval(syncToken, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [getToken, supabase]);
};
