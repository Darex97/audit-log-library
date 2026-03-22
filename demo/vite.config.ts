import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "audit-log-lib": path.resolve(
        __dirname,
        "../packages/audit-log-lib/src"
      )
    }
  }
})
