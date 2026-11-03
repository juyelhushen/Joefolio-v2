/// <reference types="vite/client" />

declare const __HAS_RESUME__: boolean;

interface Window {
  __PORTFOLIO_STARTUP__?: {
    ready: () => void;
    fail: () => void;
  };
}
