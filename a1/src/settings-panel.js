import { settings, set, onChange, reset } from './settings.js';
import { h, button, slider, checkbox, select, closablePanel } from './ui.js';

// DOM settings panel with a close button. Sections: 'xp' (Lab 2 perception experiment), 'comfort', 'access' (Lab 3).
// The settings sit on tabs so the panel fits a phone screen: Gaze (with the trial), Comfort, Access (with sound), Viewer (Lab 2).
// DOM does not appear inside a stereo split screen or a headset, so set values in mono first (Lab 3 adds 3D buttons: menu.js).
// comfortButtons: extra buttons for the Comfort tab (the Comfort preset button from main.js); Reset settings sits centered below every tab.
export function createSettingsPanel({ sections, open = true, comfortButtons = [] }) {
  const controls = {};
  // Tabs in display order; add() and group() fill the tab chosen with on().
  const tabs = [['access', 'Gaze'], ['comfort', 'Comfort'], ['access', 'Access'], ['xp', 'Viewer']]
    .filter(([sec]) => sections.includes(sec)).map(([, label]) => ({ label, rows: [] }));
  const rows = (label) => tabs.find((t) => t.label === label).rows;
  let cur;
  const on = (label) => { cur = rows(label); };
  const add = (key, el) => { controls[key] = el; cur.push(el); };
  const group = (title) => cur.push(h('p', { class: 'group' }, title));   // small heading inside a tab

  if (sections.includes('xp')) {
    on('Viewer');
    group('Experiment');
    add('ipd', slider({ label: 'IPD (mm)', min: 40, max: 90, step: 1, value: settings.ipd * 1000, format: (v) => v.toFixed(0),
      onInput: (v) => set('ipd', v / 1000) }));
    add('latencyMs', slider({ label: 'Added latency (ms)', min: 0, max: 400, step: 10, value: settings.latencyMs, format: (v) => v.toFixed(0),
      onInput: (v) => set('latencyMs', v) }));
    add('showFps', checkbox({ label: 'Show FPS (developer)', value: settings.showFps, onInput: (v) => set('showFps', v) }));
    group('Cardboard viewer');
    add('viewerFit', checkbox({ label: 'Viewer fit (cardboard)', value: settings.viewerFit, onInput: (v) => set('viewerFit', v) }));
    add('lensSpacing', slider({ label: 'Lens spacing (mm)', min: 50, max: 75, step: 1, value: settings.lensSpacing,
      format: (v) => v.toFixed(0), onInput: (v) => set('lensSpacing', v) }));
  }
  if (sections.includes('comfort')) {
    on('Comfort');
    add('vignette', select({ label: 'Comfort vignette', options: [['off', 'Off'], ['motion', 'During motion'], ['always', 'Always']],
      value: settings.vignette, onInput: (v) => set('vignette', v) }));
    add('turnMode', select({ label: 'Turning', options: [['snap', 'Snap'], ['smooth', 'Smooth']],
      value: settings.turnMode, onInput: (v) => set('turnMode', v) }));
    add('snapAngle', slider({ label: 'Turn angle (deg)', min: 15, max: 90, step: 15, value: settings.snapAngle,
      format: (v) => v.toFixed(0), onInput: (v) => set('snapAngle', v) }));
    if (comfortButtons.length) cur.push(h('div', { class: 'btnrow' }, ...comfortButtons));
  }
  if (sections.includes('access')) {
    on('Gaze');
    add('gazeEnabled', checkbox({ label: 'Gaze activation (dwell)', value: settings.gazeEnabled, onInput: (v) => set('gazeEnabled', v) }));
    add('dwell', slider({ label: 'Dwell time (s)', min: 0.5, max: 3, step: 0.1, value: settings.dwell,
      format: (v) => v.toFixed(1), onInput: (v) => set('dwell', v) }));
    add('targetScale', slider({ label: 'Target size', min: 0.8, max: 1.6, step: 0.1, value: settings.targetScale,
      format: (v) => v.toFixed(1) + 'x', onInput: (v) => set('targetScale', v) }));
    on('Access');
    add('reducedMotion', checkbox({ label: 'Reduced motion (forces snap turn, no animation)', value: settings.reducedMotion, onInput: (v) => set('reducedMotion', v) }));
    add('contrast', checkbox({ label: 'High contrast', value: settings.contrast, onInput: (v) => set('contrast', v) }));
    add('seated', checkbox({ label: 'Seated mode (headset: holds eye height at 1.6 m)', value: settings.seated, onInput: (v) => set('seated', v) }));
    group('Sound');
    add('captions', checkbox({ label: 'Audio captions', value: settings.captions, onInput: (v) => set('captions', v) }));
    add('audio', checkbox({ label: 'Sound on', value: settings.audio, onInput: (v) => set('audio', v) }));
    add('volume', slider({ label: 'Volume', min: 0, max: 1, step: 0.1, value: settings.volume,
      format: (v) => v.toFixed(1), onInput: (v) => set('volume', v) }));
  }

  const results = h('ol', { class: 'results' });
  const api = {
    addResult(text) { results.append(h('li', {}, text)); api.show('Gaze'); },   // a finished trial opens the Gaze tab, where the results are
    onStartTrial: null,
    onResetHeight: null,
    onReset: null,   // called after Reset settings (main.js puts the Comfort preset button back)
  };
  if (sections.includes('access')) {
    rows('Gaze').push(
      h('div', { class: 'btnrow' }, button('Start 10-target trial', () => api.onStartTrial?.())),
      h('p', { class: 'hint' }, 'The trial times how long each target takes. Change dwell time and target size between runs and compare the mean.'),
      results);
    rows('Access').splice(3, 0, h('div', { class: 'btnrow' }, button('Reset height', () => api.onResetHeight?.())));   // after Seated mode
  }
  const footer = h('div', { class: 'btnrow foot' }, button('Reset settings', () => { reset(); api.onReset?.(); }, 'link'));

  // Tab bar (one row on a laptop, two on a phone) and one page per tab; Reset settings stays below every tab.
  const bar = h('div', { class: 'tabs', role: 'tablist' });
  const pages = tabs.map((t) => h('div', { role: 'tabpanel', 'aria-label': t.label }, ...t.rows));
  const tabBtns = tabs.map((t, i) => h('button', { type: 'button', class: 'tab', role: 'tab', onClick: () => show(i) }, t.label));
  function show(i) {
    pages.forEach((p, j) => { p.hidden = j !== i; });
    tabBtns.forEach((b, j) => b.setAttribute('aria-selected', String(j === i)));
  }
  if (tabs.length > 1) bar.append(...tabBtns);
  show(0);

  const title = sections.includes('access') ? 'Settings (comfort and accessibility)' : 'Settings';
  const el = closablePanel(title, () => setOpen(false), tabs.length > 1 ? bar : null, ...pages, footer);
  el.id = 'settings';
  const showBtn = button('Settings', () => setOpen(true), 'show');   // top right; brings the panel back
  function setOpen(v) { el.hidden = !v; showBtn.hidden = v; }
  setOpen(open);

  // Keep the DOM in sync when a preset, a 3D button or Reset settings changes a value.
  onChange((key, value) => {
    const c = controls[key];
    if (c) c.sync(key === 'ipd' ? value * 1000 : value);
  });

  return Object.assign(api, { el, showBtn, setOpen, show: (label) => show(tabs.findIndex((t) => t.label === label)) });
}
