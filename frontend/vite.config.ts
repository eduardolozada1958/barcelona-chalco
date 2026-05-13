import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@':            path.resolve(__dirname, 'src'),
        '@components':  path.resolve(__dirname, 'src/components'),
        '@pages':       path.resolve(__dirname, 'src/pages'),
        '@layouts':     path.resolve(__dirname, 'src/layouts'),
        '@hooks':       path.resolve(__dirname, 'src/hooks'),
        '@contexts':    path.resolve(__dirname, 'src/contexts'),
        '@api':         path.resolve(__dirname, 'src/api'),
        '@types':       path.resolve(__dirname, 'src/types'),
        '@utils':       path.resolve(__dirname, 'src/utils'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL ?? 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor:  ['react', 'react-dom'],
            router:  ['react-router-dom'],
            query:   ['@tanstack/react-query'],
            ui:      ['framer-motion', 'lucide-react'],
          },
        },
      },
    },
  };
});
