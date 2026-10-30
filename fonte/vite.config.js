import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// O build gera um único dist/index.html; o script "build" copia esse arquivo
// para a pasta de cima (despesas-pessoais/), que é o que vai para o GitHub.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    chunkSizeWarningLimit: 3000,
  },
  test: {
    environment: "node",
  },
});
