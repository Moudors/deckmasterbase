/**
 * 🎣 HOOK: useImageCache
 * ======================
 * Hook React para carregar imagens do cache local (IndexedDB)
 * 
 * USO:
 * ```jsx
 * const cachedUrl = useImageCache(card.image_url);
 * 
 * <img src={cachedUrl} alt={card.name} />
 * ```
 * 
 * FUNCIONAMENTO:
 * 1. Retorna '' inicialmente (placeholder)
 * 2. Busca no cache IndexedDB
 * 3. Se não estiver em cache, baixa e salva
 * 4. Retorna Blob URL local (blob://...)
 * 5. Se falhar, retorna URL original
 */

import { useState, useEffect } from 'react';
import { getImage } from '../lib/imageCache';

/**
 * @param {string} imageUrl - URL da imagem (Scryfall, Firebase, etc.)
 * @param {boolean} enabled - Se false, não carrega imagem (útil para lazy load)
 * @returns {string} - Blob URL local ou URL original
 */
export function useImageCache(imageUrl, enabled = true) {
  const [cachedUrl, setCachedUrl] = useState('');

  useEffect(() => {
    if (!imageUrl || !enabled) {
      setCachedUrl('');
      return;
    }

    let isMounted = true;

    async function loadImage() {
      try {
        const url = await getImage(imageUrl);
        
        if (isMounted) {
          setCachedUrl(url);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar imagem:', error);
        
        // Fallback para URL original
        if (isMounted) {
          setCachedUrl(imageUrl);
        }
      }
    }

    loadImage();

    // Cleanup: revoga Blob URL quando componente desmonta
    return () => {
      isMounted = false;
      
      // Se for Blob URL local, revoga para liberar memória
      if (cachedUrl && cachedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(cachedUrl);
      }
    };
  }, [imageUrl, enabled]);

  return cachedUrl;
}

export default useImageCache;
