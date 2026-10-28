import { h } from './ui.js';

// Build footer: "build <short commit hash>" (the hash is injected by vite.config.js; 'dev' when no commit is known).
// Put the same hash next to your live URL in the README so a marker can check the page matches the tagged commit.
export function addFooter() {
  const hash = typeof __COMMIT__ !== 'undefined' ? __COMMIT__ : 'dev';
  document.body.append(h('div', { id: 'build', class: 'ui' }, `build ${hash}`));
  return hash;
}
