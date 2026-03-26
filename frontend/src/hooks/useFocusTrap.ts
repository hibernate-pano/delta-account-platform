import { useEffect, useRef } from 'react';

/**
 * Trap focus within a modal container when active.
 * Focus cycles from last element back to first and vice versa.
 * Focuses the first focusable element on activation.
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, isActive: boolean) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Remember where focus was before opening
    previouslyFocused.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));

    const focusFirst = () => {
      const els = getFocusable();
      els[0]?.focus();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const els = getFocusable();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Slight delay so the modal has painted before focusing
    const raf = requestAnimationFrame(focusFirst);
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to where it was before
      previouslyFocused.current?.focus();
    };
  }, [isActive, containerRef]);
}
