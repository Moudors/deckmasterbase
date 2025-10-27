// Hook para debounce - previne execuções excessivas
// Útil para inputs que disparam gravações no Firebase

import { useEffect, useState } from 'react';

/**
 * Hook que retorna um valor "debounced" (atrasado)
 * Ideal para campos de busca, inputs de texto que salvam, etc.
 * 
 * @param {any} value - Valor a ser debounced
 * @param {number} delay - Delay em milissegundos (padrão: 500ms)
 * @returns {any} Valor debounced
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // Só executa 500ms após parar de digitar
 *   if (debouncedSearch) {
 *     performSearch(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Agenda a atualização do valor após o delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancela o timeout anterior se value mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debounce de callbacks
 * Retorna uma função que só executa após X milissegundos de inatividade
 * 
 * @param {Function} callback - Função a ser executada
 * @param {number} delay - Delay em milissegundos (padrão: 500ms)
 * @returns {Function} Callback debounced
 * 
 * @example
 * const debouncedSave = useDebouncedCallback(async (value) => {
 *   await updateDocSilent("users", userId, { bio: value });
 * }, 1000);
 * 
 * <input onChange={(e) => debouncedSave(e.target.value)} />
 */
export function useDebouncedCallback(callback, delay = 500) {
  const [timeoutId, setTimeoutId] = useState(null);

  return (...args) => {
    // Cancela execução anterior se ainda não executou
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Agenda nova execução
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}
