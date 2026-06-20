import { useEffect, useRef } from 'react';
import type { PointerEventHandler, RefObject } from 'react';
import { shouldDismissBottomSheet } from './bottom-sheet';

interface SwipeToDismissHandlers {
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
}

interface DragState {
  pointerId: number;
  startY: number;
  currentY: number;
  startedAt: number;
}

const DISMISS_ANIMATION_MS = 180;

export function useSwipeToDismiss(
  sheetRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
): SwipeToDismissHandlers {
  const dragRef = useRef<DragState | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  }, []);

  function setOffset(distance: number, animate: boolean) {
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.style.transition = animate ? `transform ${DISMISS_ANIMATION_MS}ms ease-out` : 'none';
    sheet.style.transform = `translate3d(0, ${Math.max(0, distance)}px, 0)`;
  }

  function finishDrag() {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;

    const distance = Math.max(0, drag.currentY - drag.startY);
    const elapsed = performance.now() - drag.startedAt;
    if (shouldDismissBottomSheet(distance, elapsed)) {
      const sheetHeight = sheetRef.current?.getBoundingClientRect().height ?? window.innerHeight;
      setOffset(sheetHeight, true);
      dismissTimerRef.current = setTimeout(() => onDismissRef.current(), DISMISS_ANIMATION_MS);
    } else {
      setOffset(0, true);
    }
  }

  return {
    onPointerDown: (event) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        currentY: event.clientY,
        startedAt: performance.now(),
      };
      setOffset(0, false);
    },
    onPointerMove: (event) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      drag.currentY = event.clientY;
      setOffset(event.clientY - drag.startY, false);
    },
    onPointerUp: (event) => {
      if (dragRef.current?.pointerId !== event.pointerId) return;
      dragRef.current.currentY = event.clientY;
      finishDrag();
    },
    onPointerCancel: (event) => {
      if (dragRef.current?.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setOffset(0, true);
    },
  };
}
