import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [react()],
  // 🟢 المسار الأساسي الصحيح لموقع المشروع
  base: '/kinanmjeed881.github.io/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // تحسين التوافق وتقليل حجم الملفات
    target: 'esnext',
    minify: 'esbuild',
    // التأكد من تفريغ المجلد القديم قبل البناء
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react']
        }
      }
    }
  }
});