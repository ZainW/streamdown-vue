import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import oxlintPlugin from 'vite-plugin-oxlint'
import { resolve } from 'path'

export default defineConfig(({ command }) => ({
  plugins: [
    oxlintPlugin({
      configFile: '.oxlintrc.json',
      format: 'stylish',
      failOnError: command === 'build',
    }),
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['vue', 'shiki'],
    },
  },
}))
