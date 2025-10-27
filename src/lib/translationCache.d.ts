// Declarações de tipos para translationCache.js
declare module '@/lib/translationCache' {
  export function saveTranslation(
    cardId: string,
    cardName: string,
    translatedName: string,
    translatedText: string,
    faces?: any
  ): Promise<boolean>;

  export function getTranslation(
    cardId: string,
    cardName: string
  ): Promise<{
    cardId: string;
    cardName: string;
    translatedName: string;
    translatedText: string;
    faces: any;
    timestamp: number;
  } | null>;

  export function cleanOldTranslations(): Promise<number>;
  export function getStats(): { hits: number; misses: number; saves: number; hitRate: string };
  export function resetStats(): void;
  export function clearAllTranslations(): Promise<boolean>;
  export function countTranslations(): Promise<number>;

  const translationCache: {
    saveTranslation: typeof saveTranslation;
    getTranslation: typeof getTranslation;
    cleanOldTranslations: typeof cleanOldTranslations;
    getStats: typeof getStats;
    resetStats: typeof resetStats;
    clearAllTranslations: typeof clearAllTranslations;
    countTranslations: typeof countTranslations;
  };

  export default translationCache;
}
