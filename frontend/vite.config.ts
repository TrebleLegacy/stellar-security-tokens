/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      // Mark Ledger packages as external - they're optional and loaded at runtime
      external: [
        '@ledgerhq/hw-transport-webusb',
        '@ledgerhq/hw-app-str',
      ],
      output: {
        // Handle external modules that may not be available
        globals: {
          '@ledgerhq/hw-transport-webusb': 'LedgerTransportWebUSB',
          '@ledgerhq/hw-app-str': 'LedgerStellarApp',
        },
        manualChunks: {
          // Split vendor libraries into separate chunks for better caching
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['lucide-react', 'date-fns'],
        },
      },
      onwarn(warning, warn) {
        // Ignore warnings about Ledger external modules
        if (warning.code === 'UNRESOLVED_IMPORT' &&
          (warning.exporter?.includes('@ledgerhq/'))) {
          return;
        }
        warn(warning);
      },
    },
    // Increase chunk size warning limit to 600KB
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
