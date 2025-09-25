// context/supabaseContext.tsx
import { createContext, useContext, useMemo } from "react";
import { useSupabaseClient } from "@/lib/supabaseClient";

const SupabaseContext = createContext<any>(null);

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const { supabase, loading } = useSupabaseClient();

  const value = useMemo(() => ({ supabase, loading }), [supabase, loading]);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => useContext(SupabaseContext);
