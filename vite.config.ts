import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
        autoSubfolderIndex: true,
      },
      pages: [{ path: '/en' }, { path: '/zh-CN' }, { path: '/zh-TW' }, { path: '/ja-JP' }],
    }),
    viteReact(),
  ],
})

export default config
