import { defineConfig } from 'vite'
import oxlintPlugin from 'vite-plugin-oxlint'
import { resolve } from 'path'
import pkg from './package.json' with { type: 'json' }

// Externalize all runtime deps — consumers install them via dependencies/peerDependencies
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  'mermaid',
  'shiki',
]

export default defineConfig(({ command }) => ({
  plugins: [
    oxlintPlugin({
      configFile: '.oxlintrc.json',
      format: 'stylish',
      failOnError: command === 'build',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        code: resolve(__dirname, 'src/plugins/code/index.ts'),
        mermaid: resolve(__dirname, 'src/plugins/mermaid/index.ts'),
      },
      formats: ['es'],
    },
    minify: true,
    rollupOptions: {
      external: (id: string) => external.some((dep) => id === dep || id.startsWith(`${dep}/`)),
    },
  },
}))
