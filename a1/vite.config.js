import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// base './' lets the built site work from a GitHub Pages sub-path (https://user.github.io/repo/).
// HTTPS (self-signed) is only needed for the dev server: phones and headsets on the local network (LAN) need HTTPS to use WebXR.
// __COMMIT__ is the short commit hash shown in the page footer: COMMIT_SHA (or GITHUB_SHA, which GitHub Actions sets) at build time,
// otherwise 'dev'. It lets you prove which commit a deployed page was built from (live page URL plus commit hash).
const commit = (process.env.COMMIT_SHA || process.env.GITHUB_SHA || 'dev').slice(0, 7);

export default defineConfig(({ command }) => ({
  base: './',
  plugins: command === 'serve' ? [basicSsl()] : [],
  define: { __COMMIT__: JSON.stringify(commit) },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
}));
