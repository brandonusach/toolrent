import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 8070,
        open: true,
        host: true
    },
    build: {
        outDir: 'dist',
        sourcemap: true
    }
})