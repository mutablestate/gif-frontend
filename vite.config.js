import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import nodePolyfills from "rollup-plugin-polyfill-node";
import { viteCommonjs, esbuildCommonjs } from "@originjs/vite-plugin-commonjs";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    global: {},
    process: {
      env: {},
    },
  },
  plugins: [svelte(), nodePolyfills(), viteCommonjs()],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [esbuildCommonjs(["@project-serum/anchor"], nodePolyfills())],
    },
  },
});
