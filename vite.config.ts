import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // static JSON from public/mock/ when VITE_USE_MOCK_DATA=true
    mode === "development" &&
      process.env.VITE_USE_MOCK_DATA === "true" && {
        name: "mock-api",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (!req.url?.startsWith("/api/")) return next();

            // /api/health   -> public/mock/health.json
            // /api/datasets -> public/mock/datasets.json
            // /api/wind     -> public/mock/wind.json
            const endpoint = req.url.split("?")[0].replace("/api/", "");
            const mockFile = join(
              process.cwd(),
              "public",
              "mock",
              `${endpoint}.json`,
            );

            if (existsSync(mockFile)) {
              const data = readFileSync(mockFile, "utf-8");
              res.setHeader("Content-Type", "application/json");
              res.end(data);
            } else {
              res.statusCode = 404;
              res.end(
                JSON.stringify({
                  error: `Mock file not found: mock/${endpoint}.json`,
                }),
              );
            }
          });
        },
      },
  ].filter(Boolean),
}));
