// Tiny DOM helpers (no framework). All DOM UI lives here; head-locked 3D UI lives in gaze.js / comfort.js.
export function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c !== false && c != null) e.append(c);
  return e;
}

export function button(label, onClick, cls = '') {
  return h('button', { type: 'button', class: 'btn ' + cls, onClick }, label);
}

export function slider({ label, min, max, step, value, format = (v) => v, onInput }) {
  const out = h('output', {}, String(format(value)));
  const input = h('input', { type: 'range', min, max, step, value });
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    out.textContent = String(format(v));
    onInput(v);
  });
  const el = h('label', { class: 'row' }, h('span', {}, label), input, out);
  el.sync = (v) => { input.value = v; out.textContent = String(format(v)); };
  return el;
}

export function checkbox({ label, value, onInput }) {
  const input = h('input', { type: 'checkbox' });
  input.checked = !!value;
  input.addEventListener('change', () => onInput(input.checked));
  const el = h('label', { class: 'row check' }, input, h('span', {}, label));
  el.sync = (v) => { input.checked = !!v; };
  return el;
}

export function select({ label, options, value, onInput }) {
  const sel = h('select', {}, options.map(([v, text]) => h('option', { value: v }, text)));
  sel.value = value;
  sel.addEventListener('change', () => onInput(sel.value));
  const el = h('label', { class: 'row' }, h('span', {}, label), sel);
  el.sync = (v) => { sel.value = v; };
  return el;
}

// A floating panel with a close button. The caller puts a matching "show" button on screen (see capabilities.js).
export function closablePanel(title, onClose, ...kids) {
  return h('div', { class: 'ui panel' },
    h('div', { class: 'head' },
      h('strong', {}, title),
      h('button', { type: 'button', class: 'btn close', 'aria-label': 'Close ' + title, onClick: onClose }, '\u2715')),
    h('div', { class: 'body' }, ...kids));
}

// A start card. The click handler is the one user gesture we get, so everything that needs a gesture
// (iOS DeviceOrientation permission, AudioContext resume, fullscreen) must be called from onStart synchronously.
export function startOverlay({ title, lines, onStart }) {
  const overlay = h('div', { id: 'start' },
    h('div', { class: 'card' },
      h('h1', {}, title),
      ...lines.map((l) => h('p', {}, l)),
      button('Start', () => { onStart(); overlay.remove(); }, 'primary')));
  document.body.append(overlay);
  return overlay;
}
