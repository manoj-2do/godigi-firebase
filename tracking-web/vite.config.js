import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: '../public',
    emptyOutDir: false,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true },
      mangle: { toplevel: true },
    },
    rollupOptions: {
      input: 'index.html',
    },
  },
});