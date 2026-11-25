/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths: the same build works on GitHub Pages (sub-folder) and on Vercel (root).
  base: './',
  test: {
    environment: 'node',
  },
});
