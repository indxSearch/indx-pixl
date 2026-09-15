import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileApi } from './server/fileApi';

export default defineConfig({
  plugins: [react(), fileApi()],
  server: { port: 5175, open: true },
});
