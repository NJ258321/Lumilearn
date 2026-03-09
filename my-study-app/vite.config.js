import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- 必须有这一行，确保变量名是 tailwindcss

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- 这里的名字必须和上面 import 进来的名字一致
  ],
})