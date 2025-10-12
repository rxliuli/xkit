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
        concurrency: 1,
      },
      pages: [
        // English (default, uses root path)
        { path: '/' },
        { path: '/interaction-circle' },
        { path: '/family-tree' },
        // Other languages
        { path: '/zh-CN' },
        { path: '/zh-CN/interaction-circle' },
        { path: '/zh-CN/family-tree' },
        { path: '/zh-TW' },
        { path: '/zh-TW/interaction-circle' },
        { path: '/zh-TW/family-tree' },
        { path: '/zh-HK' },
        { path: '/zh-HK/interaction-circle' },
        { path: '/zh-HK/family-tree' },
        { path: '/ja-JP' },
        { path: '/ja-JP/interaction-circle' },
        { path: '/ja-JP/family-tree' },
      ],
    }),
    viteReact(),
  ],
})

export default config
