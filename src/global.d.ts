// Extensões de tipos globais para TypeScript
import { QueryClient } from "@tanstack/react-query";

declare global {
  interface Window {
    queryClient?: QueryClient;
    cacheManager?: {
      checkUsage: () => Promise<any>;
      forceClean: () => Promise<void>;
      getInfo: () => any;
    };
    offlineSyncManager?: any;
  }
}

export {};
