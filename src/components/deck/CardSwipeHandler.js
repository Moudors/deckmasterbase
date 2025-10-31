// CardSwipeHandler.js
// Responsável por swipe e duplo toque (zoom/transparência)
export function useCardSwipe({ onSwipeRight, onDoubleTap }) {
  let lastTap = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = Math.abs(touchEndY - touchStartY);

    // Swipe para direita: abrir zoom
    if (diffX > 100 && diffY < 50) {
      onSwipeRight && onSwipeRight();
      return;
    }

    // Detectar duplo toque (aumentado para 400ms para evitar conflito com long press)
    const now = Date.now();
    if (now - lastTap < 400) {
      onDoubleTap && onDoubleTap();
    }
    lastTap = now;
  }

  return {
    handleTouchStart,
    handleTouchEnd,
  };
}
