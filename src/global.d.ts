// Extensões de tipos globais para TypeScript
import { QueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";

declare global {
  interface Window {
    queryClient?: QueryClient;
    supabase?: SupabaseClient;
    cacheManager?: {
      checkUsage: () => Promise<any>;
      forceClean: () => Promise<void>;
      getInfo: () => any;
    };
    offlineSyncManager?: any;
  }
}

export {};
