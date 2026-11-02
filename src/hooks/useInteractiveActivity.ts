import { useEffect, useRef, useState } from 'react';

function deviceNeedsStaticEffects() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return (
    Boolean(connection?.saveData) ||
    (typeof matchMedia === 'function' &&
      (matchMedia('(max-width: 740px)').matches ||
        matchMedia('(prefers-reduced-motion: reduce)').matches))
  );
}

export function useInteractiveActivity<T extends HTMLElement>(
  reducedEffects: boolean,
  enabled = true,
) {
  const ref = useRef<T>(null);
  const [deviceStatic, setDeviceStatic] = useState(deviceNeedsStaticEffects);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(() => !document.hidden);
  const observerSupported = typeof IntersectionObserver !== 'undefined';

  useEffect(() => {
    const queries =
      typeof matchMedia === 'function'
        ? [matchMedia('(max-width: 740px)'), matchMedia('(prefers-reduced-motion: reduce)')]
        : [];
    const connection = (
      navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }
    ).connection;
    const updateDevice = () => setDeviceStatic(deviceNeedsStaticEffects());
    const updateTab = () => setTabVisible(!document.hidden);
    queries.forEach((query) => query.addEventListener('change', updateDevice));
    connection?.addEventListener('change', updateDevice);
    document.addEventListener('visibilitychange', updateTab);
    return () => {
      queries.forEach((query) => query.removeEventListener('change', updateDevice));
      connection?.removeEventListener('change', updateDevice);
      document.removeEventListener('visibilitychange', updateTab);
    };
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    if (!observerSupported) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, observerSupported]);

  return {
    ref,
    visible,
    active: enabled && visible && tabVisible,
    staticEffects: reducedEffects || deviceStatic || !observerSupported,
  };
}
