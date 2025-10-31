import { useState, useCallback } from 'react';
import { enrichSuggestionsWithPortuguese } from '../api/visualTranslationCache';

export interface TranslatedSuggestion {
  english: string;        // Nome oficial usado para buscar
  portuguese: string | null; // Nome visual (PT se existir, EN caso contrário)
  displayName: string;    // Nome que será exibido
}

export function useVisualTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);

  /**
   * 🌍 Traduz sugestões de autocomplete para exibição visual
   */
  const translateSuggestions = useCallback(async (
    englishSuggestions: string[]
  ): Promise<TranslatedSuggestion[]> => {
    if (englishSuggestions.length === 0) return [];

    setIsTranslating(true);
    
    try {
      // Buscar apenas as primeiras 5 para não sobrecarregar
      const enriched = await enrichSuggestionsWithPortuguese(englishSuggestions, 5);
      
      // Mapear para formato final
      const translated: TranslatedSuggestion[] = enriched.map(item => ({
        english: item.english,
        portuguese: item.portuguese,
        displayName: item.portuguese || item.english // Preferir PT, fallback EN
      }));

      // Adicionar sugestões restantes sem tradução
      if (englishSuggestions.length > 5) {
        for (let i = 5; i < englishSuggestions.length; i++) {
          translated.push({
            english: englishSuggestions[i],
            portuguese: null,
            displayName: englishSuggestions[i]
          });
        }
      }

      return translated;
    } catch (error) {
      console.error('❌ Erro ao traduzir sugestões:', error);
      // Fallback: retornar sugestões em inglês
      return englishSuggestions.map(eng => ({
        english: eng,
        portuguese: null,
        displayName: eng
      }));
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return {
    isTranslating,
    translateSuggestions
  };
}
