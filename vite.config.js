// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 8000,
    // Enable history API fallback for client-side routing
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
});
