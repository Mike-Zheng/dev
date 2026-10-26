/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string }

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // GitHub Pages serves the site from main:/docs
    outDir: 'docs',
    chunkSizeWarningLimit: 1500,
  },
  // The image compressor worker lazy-loads its codecs, which needs ES-module workers
  worker: {
    format: 'es',
  },
  // Emscripten / wasm-pack glue locates its .wasm via import.meta.url, which pre-bundling breaks
  optimizeDeps: {
    exclude: ['@jsquash/jpeg', '@jsquash/webp', 'libimagequant-wasm'],
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
