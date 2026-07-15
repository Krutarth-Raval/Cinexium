import { useCallback, useRef } from 'react';

export function useLongPress(
  onLongPress: (e: any) => void,
  onClick: (e: any) => void,
  { shouldPreventDefault = true, delay = 500 } = {}
) {
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const target = useRef<EventTarget | null>(null);
  const isLongPressActive = useRef(false);
  const touchEventFired = useRef(false);

  const start = useCallback(
    (event: any) => {
      // Prevent duplicate ghost events
      if (event.type === 'touchstart') {
        touchEventFired.current = true;
      }
      if (event.type === 'mousedown' && touchEventFired.current) {
        return;
      }

      isLongPressActive.current = false;
      if (shouldPreventDefault && event.target) {
        event.target.addEventListener('touchend', preventDefault, { passive: false });
        target.current = event.target;
      }
      timeout.current = setTimeout(() => {
        isLongPressActive.current = true;
        timeout.current = null;
        onLongPress(event);
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const clear = useCallback(
    (event: any, shouldTriggerClick = true) => {
      if (event.type === 'mouseup' && touchEventFired.current) {
        return;
      }

      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
      
      if (shouldPreventDefault && target.current) {
        target.current.removeEventListener('touchend', preventDefault);
      }
    },
    [shouldPreventDefault]
  );

  const handleClick = useCallback((e: any) => {
    if (isLongPressActive.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick(e);
  }, [onClick]);

  return {
    onMouseDown: (e: any) => start(e),
    onTouchStart: (e: any) => start(e),
    onMouseUp: (e: any) => clear(e),
    onMouseLeave: (e: any) => clear(e, false),
    onTouchEnd: (e: any) => clear(e),
    onTouchCancel: (e: any) => clear(e, false),
    onContextMenu: (e: any) => {
      e.preventDefault();
    },
    onClick: handleClick
  };
}

const preventDefault = (e: Event) => {
  if (!isTouchEvent(e)) return;
  if (e.touches.length < 2 && e.preventDefault) {
    e.preventDefault();
  }
};

const isTouchEvent = (e: Event): e is TouchEvent => {
  return e && 'touches' in e;
};
