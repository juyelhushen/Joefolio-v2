import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/opsz.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import '@fontsource-variable/space-grotesk/wght.css';
import App from './app/App';
import LoadBoundary from './components/common/LoadBoundary';
import './styles/global.css';
import './styles/utilities.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LoadBoundary
      label="the application"
      onError={() => window.__PORTFOLIO_STARTUP__?.fail()}
      fallback={
        <main className="load-error section-wrap" role="alert">
          <h1>The portfolio could not start</h1>
          <p>Please reload to try again.</p>
          <a className="button button-secondary" href="">
            Reload portfolio
          </a>
        </main>
      }
    >
      <App />
    </LoadBoundary>
  </React.StrictMode>,
);
