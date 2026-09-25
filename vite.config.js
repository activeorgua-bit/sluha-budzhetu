import { defineConfig } from 'vite';

// Static site: everything under public/ is copied verbatim into dist/.
export default defineConfig({
  base: './',
  server: { port: 5173, open: false },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
  }
});
