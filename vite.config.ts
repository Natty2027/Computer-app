import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// BASE_PATH is the asset base. Defaults to "/" (served from the domain root).
// Set BASE_PATH="/Computer-app/" if you deploy under a GitHub Pages project
// subpath instead of a custom domain.
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss({ optimize: false })],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // The two former monorepo workspace packages are vendored under vendor/.
      "@workspace/api-client-react": path.resolve(
        import.meta.dirname,
        "vendor/api-client-react/src/index.ts",
      ),
      "@workspace/object-storage-web": path.resolve(
        import.meta.dirname,
        "vendor/object-storage-web/src/index.ts",
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
