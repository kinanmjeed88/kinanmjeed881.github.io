import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [react()],
  // 🟢 هام جداً: هذا المسار يجب أن يطابق اسم المستودع لأن الموقع مشروع وليس User Site
  base: '/kinanmjeed881.github.io/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    sourcemap: false,
    emptyOutDir: true,
    // تحسين التوافقية
    target: 'esnext'
  }
});