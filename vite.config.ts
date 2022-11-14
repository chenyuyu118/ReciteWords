import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import electron from "vite-plugin-electron";
// @ts-ignore
import renderer from 'vite-plugin-electron-renderer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), electron([
    {entry: "electron/main/index.ts"},
    {
      entry: "electron/preload/preload.ts",
      onstart(options) {
        options.reload()
      },
    }
  ]), renderer()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {

  }
})
