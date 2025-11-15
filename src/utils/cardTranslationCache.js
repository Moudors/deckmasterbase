// Sistema de cache local para traduções de cartas
// Carrega o JSON uma vez e mantém em memória durante toda a sessão

class CardTranslationCache {
  constructor() {
    this.translations = null;
    this.isLoading = false;
    this.loadPromise = null;
  }

  // Carrega as traduções do localStorage ou do arquivo
  async loadTranslations() {
    // Se já está carregado, retorna imediatamente
    if (this.translations) {
      return this.translations;
    }

    // Se já está carregando, aguarda a promise existente
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Inicia o carregamento
    this.loadPromise = this._loadFromCache();
    this.translations = await this.loadPromise;
    this.loadPromise = null;
    
    return this.translations;
  }

  async _loadFromCache() {
    const CACHE_KEY = 'mtg_card_translations';
    const CACHE_VERSION_KEY = 'mtg_card_translations_version';
    const CURRENT_VERSION = '1.0.0'; // Incrementar quando atualizar o AllPrintings.json

    try {
      // Tenta carregar do localStorage primeiro
      const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
      const cachedData = localStorage.getItem(CACHE_KEY);

      if (cachedVersion === CURRENT_VERSION && cachedData) {
        console.log('✅ Traduções carregadas do cache local');
        return JSON.parse(cachedData);
      }

      // Se não tem cache ou está desatualizado, carrega o arquivo
      console.log('🔄 Carregando traduções do arquivo...');
      const response = await fetch('/cardTranslations.json');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar arquivo de traduções');
      }

      const data = await response.json();

      // Salva no localStorage para próximas sessões
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
        console.log('✅ Traduções salvas no cache local');
      } catch (e) {
        // Se localStorage estiver cheio, continua sem cache
        console.warn('⚠️  Não foi possível salvar no cache local:', e.message);
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao carregar traduções:', error);
      return {};
    }
  }

  // Busca tradução de inglês para outro idioma
  async getCardTranslation(englishName, language = 'pt-BR') {
    const translations = await this.loadTranslations();
    const card = translations[englishName];
    
    if (!card) return englishName;
    return card.translations[language] || card.english;
  }

  // Busca carta por nome em qualquer idioma
  async findCardByName(searchName) {
    const translations = await this.loadTranslations();
    const lowerSearch = searchName.toLowerCase().trim();
    const normalizedSearch = this._normalizeText(searchName);
    
    for (const [englishName, card] of Object.entries(translations)) {
      const normalizedEnglish = this._normalizeText(card.english);
      
      // Verifica nome em inglês (com ou sem acentos)
      if (card.english.toLowerCase() === lowerSearch || 
          normalizedEnglish === normalizedSearch) {
        return card;
      }
      
      // Verifica traduções (com ou sem acentos)
      for (const translation of Object.values(card.translations)) {
        const normalizedTranslation = this._normalizeText(translation);
        if (translation.toLowerCase() === lowerSearch ||
            normalizedTranslation === normalizedSearch) {
          return card;
        }
      }
    }
    
    return null;
  }

  // Busca cartas que começam com o texto (para autocomplete)
  async findCardsStartingWith(prefix, language = 'pt-BR', limit = 10) {
    const translations = await this.loadTranslations();
    const lowerPrefix = prefix.toLowerCase().trim();
    const normalizedPrefix = this._normalizeText(prefix);
    const results = [];

    if (!lowerPrefix) return results;

    for (const [englishName, card] of Object.entries(translations)) {
      if (results.length >= limit) break;

      // Verifica no idioma especificado
      const translatedName = card.translations[language] || card.english;
      const normalizedTranslated = this._normalizeText(translatedName);
      const normalizedEnglish = this._normalizeText(card.english);
      
      // Busca com ou sem acentos
      if (translatedName.toLowerCase().startsWith(lowerPrefix) ||
          normalizedTranslated.startsWith(normalizedPrefix)) {
        results.push({
          english: card.english,
          translated: translatedName,
          language: language
        });
        continue;
      }

      // Se não encontrou no idioma especificado, verifica em inglês
      if (language !== 'en' && 
          (card.english.toLowerCase().startsWith(lowerPrefix) ||
           normalizedEnglish.startsWith(normalizedPrefix))) {
        results.push({
          english: card.english,
          translated: translatedName,
          language: language
        });
      }
    }

    return results;
  }

  // Normaliza texto removendo acentos para comparação flexível
  _normalizeText(text) {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // Busca cartas que contêm o texto (para busca mais flexível)
  async searchCards(searchText, language = 'pt-BR', limit = 20) {
    const translations = await this.loadTranslations();
    const lowerSearch = searchText.toLowerCase().trim();
    const normalizedSearch = this._normalizeText(searchText);
    const results = [];

    if (!lowerSearch) return results;

    for (const [englishName, card] of Object.entries(translations)) {
      if (results.length >= limit) break;

      const translatedName = card.translations[language] || card.english;
      const normalizedTranslated = this._normalizeText(translatedName);
      const normalizedEnglish = this._normalizeText(card.english);
      
      // Verifica se contém o texto (com ou sem acentos)
      if (translatedName.toLowerCase().includes(lowerSearch) || 
          card.english.toLowerCase().includes(lowerSearch) ||
          normalizedTranslated.includes(normalizedSearch) ||
          normalizedEnglish.includes(normalizedSearch)) {
        results.push({
          english: card.english,
          translated: translatedName,
          language: language
        });
      }
    }

    return results;
  }

  // Limpa o cache (útil para debug ou atualização forçada)
  clearCache() {
    localStorage.removeItem('mtg_card_translations');
    localStorage.removeItem('mtg_card_translations_version');
    this.translations = null;
    console.log('🗑️  Cache de traduções limpo');
  }

  // Retorna estatísticas do cache
  async getCacheStats() {
    const translations = await this.loadTranslations();
    const totalCards = Object.keys(translations).length;
    const cardsWithPTBR = Object.values(translations).filter(
      card => card.translations['pt-BR']
    ).length;

    return {
      totalCards,
      cardsWithPTBR,
      languages: ['pt-BR', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'ru', 'zh-CN', 'zh-TW'],
      cacheSize: localStorage.getItem('mtg_card_translations')?.length || 0
    };
  }
}

// Exporta uma instância única (singleton)
const cardTranslationCache = new CardTranslationCache();

export default cardTranslationCache;

// Exporta também as funções individuais para compatibilidade
export const getCardTranslation = (englishName, language) => 
  cardTranslationCache.getCardTranslation(englishName, language);

export const findCardByName = (searchName) => 
  cardTranslationCache.findCardByName(searchName);

export const findCardsStartingWith = (prefix, language, limit) => 
  cardTranslationCache.findCardsStartingWith(prefix, language, limit);

export const searchCards = (searchText, language, limit) => 
  cardTranslationCache.searchCards(searchText, language, limit);

export const clearTranslationCache = () => 
  cardTranslationCache.clearCache();

export const getTranslationCacheStats = () => 
  cardTranslationCache.getCacheStats();
