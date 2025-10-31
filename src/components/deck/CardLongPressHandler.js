// CardLongPressHandler.js
// Responsável por long press para menu de arte
import { useLongPress } from "use-long-press";

export function useCardLongPress({ onLongPress, threshold = 800 }) {
  // Adiciona debug para garantir que o hook está sendo chamado
  return useLongPress((event) => {
    console.log('[DEBUG] Long press acionado!', event);
    if (typeof onLongPress === 'function') {
      onLongPress(event);
    }
  }, {
    threshold,
    captureEvent: true,
    onStart: (event) => {
      console.log('[DEBUG] Long press iniciado', event);
    },
    onCancel: (event) => {
      console.log('[DEBUG] Long press cancelado', event);
    }
  });
}
