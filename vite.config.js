import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const GATEWAY_PORT = process.env.GATEWAY_PORT || 8787;

// The Vite client lives in web/. In dev it proxies the WebSocket to the Node
// gateway; in prod the gateway serves the built dist/ and hosts /ws itself.
export default defineConfig({
  root: 'web',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/ws': { target: `ws://localhost:${GATEWAY_PORT}`, ws: true, changeOrigin: true },
    },
  },
  build: { outDir: '../dist', emptyOutDir: true },
});
