import { useEffect, useRef } from 'react';

// Gọi callback định kỳ (polling) khi tab đang hiển thị; callback luôn là bản mới nhất, không cần khai báo trong dependency
export function usePolling(callback, intervalMs, enabled = true) {
  const latestCallback = useRef(callback);

  useEffect(() => {
    latestCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const timer = setInterval(() => {
      if (!document.hidden) {
        latestCallback.current();
      }
    }, intervalMs);
    return () => {
      clearInterval(timer);
    };
  }, [intervalMs, enabled]);
}
