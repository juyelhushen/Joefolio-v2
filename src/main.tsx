import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import LoadBoundary from './components/common/LoadBoundary';
import './styles/global.css';
import './styles/utilities.css';

const rootElement = document.getElementById('root');

if (!rootElement) throw new Error('Portfolio root element is missing.');

createRoot(rootElement).render(
  <React.StrictMode>
    <LoadBoundary
      label="the application"
      onError={() => {
        const startupError = document.getElementById('startup-error');
        if (startupError) startupError.hidden = false;
      }}
      fallback={null}
    >
      <App />
    </LoadBoundary>
  </React.StrictMode>,
);
