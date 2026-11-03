import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    __HAS_RESUME__: existsSync(new URL('./public/resume.pdf', import.meta.url)),
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/backend': {
        target:
          loadEnv(mode, process.cwd(), 'VITE_API_BASE_URL').VITE_API_BASE_URL?.trim() ||
          'https://joefolio-backend.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (request) => request.removeHeader('origin'));
        },
      },
    },
  },
  preview: { proxy: {} },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'motion-react',
              test: /node_modules[\\/]motion[\\/]dist[\\/]es[\\/]react\.mjs$/,
            },
          ],
        },
      },
    },
  },
}));
