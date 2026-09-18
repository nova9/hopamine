import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { defineConfig, type Plugin } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

import { Logo } from "./src/components/logo.tsx";

function faviconPlugin(): Plugin {
  return {
    name: "generate-favicon",
    async buildStart() {
      const favicon = `${renderToStaticMarkup(
        createElement(Logo, { title: "Hopamine" }),
      )}\n`;

      await writeFile(
        path.resolve(import.meta.dirname, "public/favicon.svg"),
        favicon,
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    faviconPlugin(),
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    cloudflare(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
