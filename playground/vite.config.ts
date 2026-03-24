import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: 'streamdown-vue/styles.css', replacement: resolve(__dirname, '../styles.css') },
      { find: 'streamdown-vue', replacement: resolve(__dirname, '../src/index.ts') },
    ],
  },
  server: {
    port: 5199,
  },
})
