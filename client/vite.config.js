import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En développement, l'API et Socket.IO sont redirigés vers le serveur Node.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
      "/socket.io": { target: "http://localhost:3001", ws: true },
    },
  },
});
