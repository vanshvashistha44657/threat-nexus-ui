// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Base path for static hosting. On GitHub Pages under https://<user>.github.io/<repo>/
// set BASE_PATH=/<repo>/ at build time. Root domains (custom domain / Lovable) keep "/".
const STATIC = process.env["STATIC_BUILD"] === "true";
const rawBase = process.env["BASE_PATH"] ?? "/";
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this. Skipped for the static (GitHub Pages) build, where the
    // prerenderer needs Start's default server entry to emit the SPA shell.
    ...(STATIC ? {} : { server: { entry: "server" as const } }),
    // Emit a static SPA shell (dist/client/index.html) so the app can be hosted
    // on static hosts such as GitHub Pages without a Node/Worker server.
    ...(STATIC ? { spa: { enabled: true }, prerender: { enabled: true } } : {}),
  },
  vite: {
    base,
  },
});
