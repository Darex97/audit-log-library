import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'AuditLogLib',
      formats: ['es', 'umd'],
      fileName: (format) => format === 'umd' ? 'index.umd.js' : 'index.js'
    },
    rollupOptions: {
      external: ['exceljs', 'jszip', 'file-saver'],
    },
    outDir: 'dist',
    emptyOutDir: false
  },
  plugins: [
    dts({ insertTypesEntry: true })
  ]
});