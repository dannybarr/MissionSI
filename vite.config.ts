// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * Dev only: the TanStack devtools plugin stamps `data-tsd-source` on every JSX element.
 * React Three Fiber reads a dashed prop as a nested path (`data.tsd.source`) and throws,
 * which takes down the shared WebGL stage. Strip it from three.js scene files.
 */
const stripSourceFromThree = {
  name: "mission:strip-tsd-source-from-three",
  apply: "serve" as const,
  enforce: "post" as const,
  transform(code: string, id: string) {
    if (!/[\\/]src[\\/](landing|studio)[\\/]three[\\/].*\.tsx(\?|$)/.test(id)) return null;
    if (!code.includes("data-tsd-source")) return null;
    return { code: code.replace(/["']data-tsd-source["']\s*:\s*["'][^"']*["']\s*,?/g, ""), map: null };
  },
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [stripSourceFromThree],
  },
});
