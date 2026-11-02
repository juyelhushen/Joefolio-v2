import { useEffect, useRef, useState } from 'react';

export function useAnimationVisibility<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: '120px 0px',
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}
