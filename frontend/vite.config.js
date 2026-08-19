// frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Academic-to-Industry Transition System',
        short_name: 'AI Transition',
        description: 'Intelligent Academic-to-Industry Transition Support System',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 3600,
              },
            },
          },
        ],
      },
    }),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          'ui-vendor': ['@headlessui/react', 'framer-motion'],
          'chart-vendor': ['chart.js', 'react-chartjs-2', 'recharts'],
          'api-vendor': ['axios', 'socket.io-client'],
        },
      },
    },
    target: 'es2020',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        comments: false,
      },
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://academic-to-industry-transition.onrender.com',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://academic-to-industry-transition.onrender.com',
        ws: true,
      },
    },
  },
  preview: {
    port: 3000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux'],
  },
})