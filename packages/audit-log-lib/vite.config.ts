import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'AuditLogLib',
      fileName: (format) => `index.${format}.js`
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