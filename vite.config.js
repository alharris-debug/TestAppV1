import { defineConfig } from 'vite';

export default defineConfig({
  base: './',  // MUST be './' not '/TestAppV1/'
  build: {
    outDir: 'dist'
  }
});