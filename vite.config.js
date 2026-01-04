import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative paths for Capacitor Android builds
  // Change back to '/TestAppV1/' for GitHub Pages deployment
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild' // Uses built-in esbuild minifier
  },
  server: {
    host: true // Allow network access for device testing
  }
})
