import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Locks the built page down to Yapin's API so a pasted webhook token can only
// ever be sent there. Images may come from anywhere (embeds reference them).
// Build-only: the dev server relies on inline scripts for hot reload.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src * data: blob:",
  "connect-src https://www.yapin.gg https://yapin.gg",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join("; ");

const csp = (): Plugin => ({
  name: "yaphook-csp",
  apply: "build",
  transformIndexHtml: (html) =>
    html.replace(
      "<head>",
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n    <meta name="referrer" content="no-referrer" />`,
    ),
});

// Relative base so the build works on a custom domain, a GitHub Pages
// project path, or a Cloudflare Worker without changes.
export default defineConfig({
  base: "./",
  plugins: [react(), csp()],
});
