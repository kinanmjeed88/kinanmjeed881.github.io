
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';
import { fileURLToPath, URL } from 'url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const apiKey = env.VITE_GROQ_API_KEY || env.API_KEY || env.VITE_API_KEY || process.env.API_KEY || "";
  
  return {
    plugins: [react()],
    base: '/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./', import.meta.url))
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      minify: 'esbuild',
      sourcemap: false
    }
  };
});