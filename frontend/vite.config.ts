import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, type PluginOption } from "vite";
import viteTsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        host: "localhost",
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost.localdomain:9090/",
                changeOrigin: true,
            },
        },
    },
    preview: {
        host: "localhost",
        port: 3000,
    },
    build: {
        outDir: "./build",
    },
    plugins: [react(), viteTsconfigPaths(), visualizer() as PluginOption],
});
