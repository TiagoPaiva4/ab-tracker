import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ab-tracker/', // <--- ADICIONA ISTO (nome do teu repositório entre barras)
})