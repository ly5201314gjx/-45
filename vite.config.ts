import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Cast process to any to avoid TS error 'Property cwd does not exist on type Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY so the Gemini SDK works as written in the prompt instructions
      // Vercel injects environment variables at build time (or runtime for SSR/Functions, but here we define for client build)
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Fallback for other process.env usage if any, though not recommended for client-side
      'process.env': {}
    },
    server: {
      // Proxy for local development to avoid CORS if running locally without Vercel CLI
      proxy: {
        '/api': {
          target: 'https://api.binance.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api/v3')
        }
      }
    }
  };
});