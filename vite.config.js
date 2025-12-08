import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use /forsta-kapitlet/ for production build, / for development
  base: command === 'build' ? '/forsta-kapitlet/' : '/',
  server: {
    host: '0.0.0.0', // Lyssna på alla nätverksgränssnitt (gör servern tillgänglig från mobil)
    port: 5173,
  }
}))
