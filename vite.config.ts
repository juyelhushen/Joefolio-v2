import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';

export default defineConfig({
  plugins: [react()],
  define: {
    __HAS_RESUME__: existsSync(new URL('./public/resume.pdf', import.meta.url)),
  },
  server: { host: '0.0.0.0' },
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
});
