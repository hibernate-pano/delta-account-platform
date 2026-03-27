import { useRef, useState } from 'react';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

interface UseSwipeGestureResult {
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  swipeX: number;
}

export const useSwipeGesture = (options: UseSwipeGestureOptions): UseSwipeGestureResult => {
  const { onSwipeLeft, onSwipeRight, threshold = 60 } = options;
  const touchStartX = useRef<number>(0);
  const [swipeX, setSwipeX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - touchStartX.current;
    setSwipeX(Math.abs(diff) < 40 ? diff : diff * 0.3); // dampen past threshold
  };

  const handleTouchEnd = () => {
    const diff = swipeX;
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && onSwipeRight) onSwipeRight();
      else if (diff < 0 && onSwipeLeft) onSwipeLeft();
    }
    setSwipeX(0);
  };

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    swipeX,
  };
};
