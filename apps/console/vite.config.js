import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Read VITE_SUPABASE_* from the repo root .env so one file serves all apps.
  envDir: '../..',
  server: { port: 5173 },
});
