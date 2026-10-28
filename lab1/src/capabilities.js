import { h, button, closablePanel } from './ui.js';

// Capability detection panel. The W1 question: does THIS device offer WebXR immersive-vr?
// "isSessionSupported" answers "does the browser claim support"; "Test requestSession" answers "does it actually start".

export function deviceClass() {
  const ua = navigator.userAgent;
  if (/OculusBrowser|Quest/i.test(ua)) return 'Meta Quest browser';
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'iOS/iPadOS';
  if (/Android/i.test(ua)) return 'Android';
  return 'Desktop/other';
}

async function supported(mode) {
  if (!navigator.xr) return 'n/a (no navigator.xr)';
  // Some browsers never settle this promise, so race it against a timeout and report that as its own result.
  const timeout = new Promise((resolve) => setTimeout(() => resolve('no answer after 4 s'), 4000));
  try { return String(await Promise.race([navigator.xr.isSessionSupported(mode), timeout])); } catch (e) { return `error: ${e.name}`; }
}

function orientationApi() {
  const DOE = window.DeviceOrientationEvent;
  if (!DOE) return 'unavailable';
  return typeof DOE.requestPermission === 'function' ? 'available, needs requestPermission()' : 'available';
}

export function createCapsPanel({ lab, look, getRenderMode, getInputMode }) {
  const state = {
    'immersive-vr supported': '...',
    'immersive-ar supported': '...',
    'Test requestSession (immersive-vr)': 'not run',
    'Enter VR started': 'not tried',
    'XR input sources': 'no session',
  };
  const table = h('table', { class: 'caps' });
  const note = h('p', { class: 'hint' }, 'Run "Test requestSession" on your phone and report both lines. On Android, supported = true does not guarantee a usable session.');
  const copyOut = h('textarea', { rows: 6, class: 'copy', readonly: true, hidden: true });

  function report() {
    return {
      lab,
      time: new Date().toISOString(),
      device: deviceClass(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      touchPoints: navigator.maxTouchPoints,
      screen: `${screen.width}x${screen.height} @${window.devicePixelRatio}x`,
      secureContext: window.isSecureContext,
      hasNavigatorXr: !!navigator.xr,
      deviceOrientationApi: orientationApi(),
      orientationPermission: look ? look.permission : 'n/a',
      orientationDataFlowing: look ? look.hasData : false,
      renderMode: getRenderMode(),
      inputMode: getInputMode(),
      ...state,
    };
  }

  function render() {
    const r = report();
    const rows = [
      ['Device', r.device],
      ['Screen', r.screen],
      ['Secure context (HTTPS)', String(r.secureContext)],
      ['navigator.xr present', String(r.hasNavigatorXr)],
      ['immersive-vr supported', state['immersive-vr supported']],
      ['immersive-ar supported', state['immersive-ar supported']],
      ['Test requestSession (immersive-vr)', state['Test requestSession (immersive-vr)']],
      ['Enter VR started', state['Enter VR started']],
      ['DeviceOrientation API', r.deviceOrientationApi],
      ['Orientation permission', r.orientationPermission],
      ['Orientation data flowing', String(r.orientationDataFlowing)],
      ['Render mode', r.renderMode],
      ['Input mode', r.inputMode],
      ['XR input sources', state['XR input sources']],
    ];
    table.replaceChildren(...rows.map(([k, v]) => h('tr', {}, h('th', {}, k), h('td', {}, String(v)))));
  }

  async function detect() {
    state['immersive-vr supported'] = await supported('immersive-vr');
    state['immersive-ar supported'] = await supported('immersive-ar');
    render();
    console.table(report());   // A1 week-1 evidence: the same capability report, in the console (also printed by Re-detect)
  }

  async function testRequest() {
    const key = 'Test requestSession (immersive-vr)';
    if (!navigator.xr) { state[key] = 'FAIL: no navigator.xr'; render(); return; }
    state[key] = 'requesting...'; render();
    try {
      const s = await navigator.xr.requestSession('immersive-vr');
      state[key] = 'OK: session granted (ended immediately)';
      await s.end();
    } catch (e) {
      state[key] = `FAIL: ${e.name}: ${e.message}`;
    }
    render();
  }

  async function copy() {
    const text = JSON.stringify(report(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      copyOut.hidden = true;
    } catch {
      copyOut.hidden = false; copyOut.value = text; copyOut.select();   // clipboard blocked: select-all fallback
    }
  }

  let open = lab === 'lab1';   // open at the start only in Lab 1, where reading it is the task
  const el = closablePanel('Capabilities', () => setOpen(false),
    table,
    h('div', { class: 'btnrow' },
      button('Re-detect', detect),
      button('Test requestSession', testRequest),
      button('Copy report', copy)),
    note, copyOut);
  el.id = 'caps';
  const showBtn = button('Capabilities', () => setOpen(true), 'show');   // top right; brings the panel back
  function setOpen(v) { open = v; el.hidden = !v; showBtn.hidden = v; if (v) render(); }
  setOpen(open);
  detect();
  setInterval(() => { if (open) render(); }, 1000);

  return {
    el,
    showBtn,
    setSessionState(text) { state['Enter VR started'] = text; render(); },
    setInputSources(text) { state['XR input sources'] = text; render(); },
    report,
  };
}
