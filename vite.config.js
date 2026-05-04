import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/MENU-DIGITAL/',
  plugins: [react({ jsxRuntime: 'automatic' })],
  build: {
    chunkSizeWarningLimit: 900,
  },
});
