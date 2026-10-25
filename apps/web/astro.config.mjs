import node from '@astrojs/node'
import { defineConfig } from 'astro/config'

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'always',
  server: {
    port: 4321,
  },
  vite: {
    server: {
      proxy: {
        '/api': {
          target: process.env.PUBLIC_PAYLOAD_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
        '/media': {
          target: process.env.PUBLIC_PAYLOAD_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  },
})
