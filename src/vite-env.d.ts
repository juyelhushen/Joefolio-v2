/// <reference types="vite/client" />

declare const __HAS_RESUME__: boolean;

interface Window {
  __STELLAR_FOLD__?: { active: boolean; elapsed: number; painted: boolean; settled: number };
  __PORTFOLIO_STARTUP__?: {
    ready: () => void;
    fail: () => void;
  };
}
