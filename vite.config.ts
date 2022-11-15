import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import electron from "vite-plugin-electron";
// @ts-ignore
import renderer from "vite-plugin-electron-renderer";

const path = require("path");

// https://vitejs.dev/config/
console.log(__dirname);
export default defineConfig({
  base: "./",
  plugins: [
    vue(),
    vueJsx(),
    electron([{
      entry: "electron/main/mainElectron.ts"
    }]),
    renderer({
      nodeIntegration: true,
      optimizeDeps: {
        include: []
      }
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  build: {
    minify: false,
    outDir: "dist-electron",
    assetsDir: "."
  },
  assetsInclude: ["**/*.glb"]
});
