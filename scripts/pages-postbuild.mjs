/**
 * Post-processing for static (GitHub Pages) builds.
 * - .nojekyll so /assets/_* files are served
 * - 404.html SPA fallback so deep links / refreshes resolve on any route
 * - CNAME passthrough when public/CNAME exists (custom domain)
 */
import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "dist", "client");
if (!existsSync(out)) {
  console.error("dist/client not found — run the build first.");
  process.exit(1);
}

writeFileSync(join(out, ".nojekyll"), "");

const shell = existsSync(join(out, "_shell.html"))
  ? join(out, "_shell.html")
  : join(out, "index.html");
copyFileSync(shell, join(out, "404.html"));

const cname = join(process.cwd(), "public", "CNAME");
if (existsSync(cname)) copyFileSync(cname, join(out, "CNAME"));

console.log("GitHub Pages post-build complete:", out);
