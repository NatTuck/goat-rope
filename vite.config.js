import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { setupSocketIO } from './src/server/index.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'socket-server',
      configureServer(server) {
        setupSocketIO(server.httpServer);
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
});
