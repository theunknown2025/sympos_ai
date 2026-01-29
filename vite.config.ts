import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/latex': {
            target: 'http://localhost:3002',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/latex/, ''),
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.API_ENDPOINT': JSON.stringify(env.VITE_API_ENDPOINT || ''),
        'process.env.FONT_API_KEY': JSON.stringify(env.VITE_FONT_API_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Fix build error for ".keep" files from latex.js by telling esbuild how to load them.
      // Use the "text" loader so esbuild can inline them without needing an output path.
      optimizeDeps: {
        esbuildOptions: {
          loader: {
            '.keep': 'text',
          },
        },
      },
    };
});
