/* ---------- the round timer: bell, 10-second warning, combo caller ---------- */
const PRESETS = [
  { id: 'box3', name: 'Boxing 3:00', work: 180, rest: 60, rounds: 6 },
  { id: 'box2', name: 'Boxing 2:00', work: 120, rest: 60, rounds: 4 },
  { id: 'mt', name: 'Muay Thai 3:00', work: 180, rest: 120, rounds: 5 },
  { id: 'burn', name: 'Burnout 1:00', work: 60, rest: 30, rounds: 8 },
];
const CALLER_GAP = { basics: 5, combos: 6, defense: 7 };
const NUM_WORD = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' };
const timerSaved = store.get('timer', {});
const T = Object.assign({ preset: 'box3', rounds: 6, work: 180, rest: 60, prep: 10, caller: 'combos', sound: true, voice: false }, timerSaved,
  { phase: 'idle', round: 1, left: 0, running: false, endAt: 0, combo: null, nextCall: 0, warned: false, lastBeep: 0 });
T.left = T.work;
const saveTimer = () => store.set('timer', { preset: T.preset, rounds: T.rounds, work: T.work, rest: T.rest, caller: T.caller, sound: T.sound, voice: T.voice });

/* ----- sound: a synthesized ring bell and a wooden clapper; starts only from a tap ----- */
let actx = null;
function audio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
  if (actx && actx.state === 'suspended') { try { actx.resume(); } catch (e) { /* stays silent */ } }
  return actx;
}
function strike(ctx, t0, gain) {
  const out = ctx.createGain(); out.gain.value = gain; out.connect(ctx.destination);
  [[1, 1], [2.01, .55], [2.76, .42], [4.07, .26], [5.43, .16], [6.8, .1]].forEach(([mult, amp], i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 660 * mult;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(amp, t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.9 / (1 + i * 0.4));
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 2.1);
  });
}
function bell(times) { if (!T.sound) return; const ctx = audio(); if (!ctx) return; for (let k = 0; k < times; k++) strike(ctx, ctx.currentTime + 0.02 + k * 0.34, 0.2); }
function blip(freq, len, type, times, gap) {
  if (!T.sound) return; const ctx = audio(); if (!ctx) return;
  for (let k = 0; k < (times || 1); k++) {
    const t0 = ctx.currentTime + 0.01 + k * (gap || 0.16); const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + len + 0.02);
  }
}
const clapper = () => blip(1250, 0.07, 'square', 3, 0.15);
const canSpeak = () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
function say(combo) {
  if (!T.voice || !canSpeak()) return;
  try { const u = new SpeechSynthesisUtterance(combo.map((x) => NUM_WORD[x] || x).join(', ')); u.rate = 1.2; u.pitch = 0.9; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) { /* voice unavailable */ }
}

/* ----- engine ----- */
let wake = null;
function holdScreen(on) {
  try {
    if (on && navigator.wakeLock && !wake) navigator.wakeLock.request('screen').then((w) => { wake = w; w.addEventListener('release', () => { wake = null; }); }).catch(() => {});
    if (!on && wake) { wake.release().catch(() => {}); wake = null; }
  } catch (e) { /* not supported here */ }
}
function setPhase(phase, secs) { T.phase = phase; T.left = secs; T.endAt = performance.now() + secs * 1000; T.warned = false; T.lastBeep = 0; T.combo = null; T.nextCall = secs - 2; }
function timerStart() {
  audio();
  if (T.phase === 'idle' || T.phase === 'done') { T.round = 1; setPhase('prep', T.prep); }
  else T.endAt = performance.now() + T.left * 1000;
  T.running = true; holdScreen(true); paintTimer();
}
function timerPause() { T.running = false; holdScreen(false); try { if (canSpeak()) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } paintTimer(); }
function timerReset() { T.running = false; T.phase = 'idle'; T.round = 1; T.left = T.work; T.combo = null; holdScreen(false); paintTimer(); }
function timerAdvance() {
  if (T.phase === 'prep') { setPhase('work', T.work); bell(1); }
  else if (T.phase === 'work') {
    if (T.round >= T.rounds) { T.phase = 'done'; T.left = 0; T.running = false; T.combo = null; bell(3); holdScreen(false); }
    else { setPhase('rest', T.rest); bell(1); }
  } else if (T.phase === 'rest') { T.round += 1; setPhase('work', T.work); bell(1); }
}
function timerTick() {
  if (!T.running) return;
  T.left = Math.max(0, (T.endAt - performance.now()) / 1000);
  const whole = Math.ceil(T.left);
  if (T.phase === 'prep' && whole <= 3 && whole >= 1 && T.lastBeep !== whole) { T.lastBeep = whole; blip(880, 0.09, 'sine'); }
  if ((T.phase === 'work' || T.phase === 'rest') && !T.warned && T.left <= 10 && (T.phase === 'work' ? T.work : T.rest) > 15) { T.warned = true; clapper(); }
  if (T.phase === 'work' && T.caller !== 'off' && T.left <= T.nextCall && T.left > 4) {
    const pool = COMBOS[T.caller] || COMBOS.combos; let pick = pool[Math.floor(Math.random() * pool.length)];
    if (T.combo && pick.join() === T.combo.join()) pick = pool[(pool.indexOf(pick) + 1) % pool.length];
    T.combo = pick; T.nextCall = T.left - CALLER_GAP[T.caller]; say(pick);
  }
  if (T.left <= 0) timerAdvance();
  paintTimer();
}
setInterval(timerTick, 100);

/* ----- faces: built once, then only text and attributes change ----- */
const RING = 2 * Math.PI * 92;
const mmss = (secs) => { const s = Math.ceil(secs); return `${Math.floor(s / 60)}:${pad2(s % 60)}`; };
function digitCells(text) { return text.split('').map((ch) => `<span class="${ch === ':' ? 'dg dg--colon' : 'dg'}">${ch}</span>`).join(''); }
function faceMarkup() {
  return `<div class="timer__face" data-t-face data-phase="idle">
      <svg viewBox="0 0 200 200" aria-hidden="true"><circle class="timer__track" cx="100" cy="100" r="92"/><circle class="timer__arc" data-t-arc cx="100" cy="100" r="92" stroke-dasharray="${RING.toFixed(1)}" stroke-dashoffset="0" transform="rotate(-90 100 100)"/></svg>
      <div class="timer__read"><p class="timer__phase" data-t-phase>Round 1</p><p class="timer__digits" data-t-digits role="timer" aria-live="off">3:00</p><p class="timer__combo" data-t-combo></p><p class="timer__names" data-t-names></p></div>
    </div>`;
}
function buildTimers() {
  $$('[data-timer]').forEach((host) => {
    if (host.dataset.built) return; host.dataset.built = '1';
    const full = host.dataset.timer === 'full';
    const main = `${faceMarkup()}
      <div class="timer__main">
        <div class="btn-row timer__go">
          <button class="btn btn--primary btn--lg" type="button" data-action="timer-toggle" data-t-toggle>${icon('play')} <span>Start</span></button>
          <button class="btn btn--ghost btn--lg" type="button" data-action="timer-reset">${icon('reset')} Reset</button>
        </div>
        <div class="timer__toggles">
          <button class="chip" type="button" data-action="timer-sound" data-t-sound aria-pressed="true">${icon('sound')} Bell</button>
          ${full ? '' : `<button class="chip" type="button" data-action="timer-caller-toggle" data-t-callertoggle aria-pressed="true">Combo caller</button>`}
          ${full && canSpeak() ? `<button class="chip" type="button" data-action="timer-voice" data-t-voice aria-pressed="false">Call combos out loud</button>` : ''}
          ${full ? `<button class="chip" type="button" data-action="timer-fullscreen">${icon('expand')} Full screen</button>` : ''}
        </div>
      </div>`;
    if (!full) { host.innerHTML = main; return; }
    host.innerHTML = `<div class="timer__stage">${main}</div>
      <div class="timer__setup">
        <div class="field"><span class="field__label">Preset</span><div class="chips" data-t-presets>${PRESETS.map((p) => `<button class="chip" type="button" data-action="timer-preset" data-id="${p.id}">${p.name}</button>`).join('')}</div></div>
        <div class="steppers">
          ${stepper('rounds', 'Rounds')}${stepper('work', 'Round')}${stepper('rest', 'Rest')}
        </div>
        <div class="field"><span class="field__label">Combo caller</span><div class="chips" data-t-callers>${[['off', 'Off'], ['basics', 'Fundamentals'], ['combos', 'Combinations'], ['defense', 'With defense']].map(([id, n]) => `<button class="chip" type="button" data-action="timer-caller" data-id="${id}">${n}</button>`).join('')}</div></div>
        <div class="punchkey"><p class="field__label">The numbers</p><ol>${Object.keys(PUNCHES).map((n) => `<li><b>${n}</b><span>${PUNCHES[n]}</span></li>`).join('')}</ol>
          <p class="micro muted">Orthodox stance. Southpaws mirror it. Space starts and pauses, R resets.</p></div>
      </div>`;
  });
}
function stepper(key, label) {
  return `<div class="stepper"><span class="field__label">${label}</span><div class="stepper__row">
      <button class="iconbtn" type="button" data-action="timer-step" data-key="${key}" data-dir="-1" aria-label="Less ${label.toLowerCase()}">${icon('minus')}</button>
      <output data-t-val="${key}">0</output>
      <button class="iconbtn" type="button" data-action="timer-step" data-key="${key}" data-dir="1" aria-label="More ${label.toLowerCase()}">${icon('plus')}</button></div></div>`;
}
function paintTimer() {
  const total = T.phase === 'work' ? T.work : T.phase === 'rest' ? T.rest : T.phase === 'prep' ? T.prep : 1;
  const frac = T.phase === 'idle' ? 1 : T.phase === 'done' ? 0 : clamp(T.left / total, 0, 1);
  const label = T.phase === 'idle' ? `${T.rounds} rounds · ${mmss(T.work)} on · ${mmss(T.rest)} off`
    : T.phase === 'prep' ? 'Get ready' : T.phase === 'work' ? `Round ${T.round} of ${T.rounds}` : T.phase === 'rest' ? `Rest · round ${T.round + 1} next` : 'Final bell';
  const digits = T.phase === 'done' ? '0:00' : mmss(T.phase === 'idle' ? T.work : T.left);
  const combo = T.phase === 'work' && T.combo ? T.combo : null;
  $$('[data-timer]').forEach((host) => {
    const face = $('[data-t-face]', host); if (!face) return;
    face.dataset.phase = T.phase; face.classList.toggle('is-warn', (T.phase === 'work' || T.phase === 'rest') && T.left <= 10 && T.running);
    $('[data-t-arc]', host).setAttribute('stroke-dashoffset', (RING * (1 - frac)).toFixed(1));
    const ph = $('[data-t-phase]', host); if (ph.textContent !== label) ph.textContent = label;
    const dg = $('[data-t-digits]', host); if (dg.dataset.v !== digits) { dg.dataset.v = digits; dg.innerHTML = digitCells(digits); }
    const cb = $('[data-t-combo]', host); const key = combo ? combo.join('-') : (T.phase === 'work' && T.caller !== 'off' ? 'wait' : T.phase);
    if (cb.dataset.v !== key) {
      cb.dataset.v = key;
      cb.innerHTML = combo ? combo.map((x) => `<span class="${PUNCHES[x] ? 'pn' : 'pn pn--word'}">${esc(x)}</span>`).join('')
        : T.phase === 'work' && T.caller !== 'off' ? '<span class="timer__hint">Hands up</span>'
          : T.phase === 'rest' ? '<span class="timer__hint">Breathe. Shake it out.</span>' : T.phase === 'done' ? '<span class="timer__hint">Good work.</span>'
            : T.phase === 'prep' ? '<span class="timer__hint">Touch gloves</span>' : '';
      $('[data-t-names]', host).textContent = combo ? combo.map((x) => PUNCHES[x] || x).join(' · ') : '';
    }
    const tg = $('[data-t-toggle]', host); const want = T.running ? 'Pause' : (T.phase === 'idle' || T.phase === 'done') ? 'Start' : 'Resume';
    if (tg.dataset.v !== want) { tg.dataset.v = want; tg.innerHTML = `${icon(T.running ? 'pause' : 'play')} <span>${want}</span>`; }
    const snd = $('[data-t-sound]', host); snd.setAttribute('aria-pressed', String(T.sound)); snd.innerHTML = `${icon(T.sound ? 'sound' : 'mute')} Bell`;
    const ct = $('[data-t-callertoggle]', host); if (ct) ct.setAttribute('aria-pressed', String(T.caller !== 'off'));
    const vo = $('[data-t-voice]', host); if (vo) vo.setAttribute('aria-pressed', String(T.voice));
    $$('[data-t-presets] .chip', host).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === T.preset)));
    $$('[data-action="timer-caller"]', host).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === T.caller)));
    const set = (k, v) => { const o = $(`[data-t-val="${k}"]`, host); if (o) o.textContent = v; };
    set('rounds', T.rounds); set('work', mmss(T.work)); set('rest', mmss(T.rest));
  });
}
Object.assign(actions, {
  'timer-toggle': () => { if (T.running) timerPause(); else timerStart(); },
  'timer-reset': () => timerReset(),
  'timer-sound': () => { T.sound = !T.sound; if (T.sound) bell(1); saveTimer(); paintTimer(); },
  'timer-voice': () => { T.voice = !T.voice; if (T.voice) { audio(); say(['1', '2']); } saveTimer(); paintTimer(); },
  'timer-caller-toggle': () => { T.caller = T.caller === 'off' ? 'combos' : 'off'; saveTimer(); paintTimer(); },
  'timer-caller': (el) => { T.caller = el.dataset.id; saveTimer(); paintTimer(); },
  'timer-preset': (el) => { const p = PRESETS.find((x) => x.id === el.dataset.id); if (!p) return; Object.assign(T, { preset: p.id, work: p.work, rest: p.rest, rounds: p.rounds }); saveTimer(); timerReset(); },
  'timer-step': (el) => {
    const k = el.dataset.key, dir = +el.dataset.dir;
    if (k === 'rounds') T.rounds = clamp(T.rounds + dir, 1, 15);
    if (k === 'work') T.work = clamp(T.work + dir * 30, 30, 600);
    if (k === 'rest') T.rest = clamp(T.rest + dir * 15, 15, 300);
    T.preset = (PRESETS.find((p) => p.work === T.work && p.rest === T.rest && p.rounds === T.rounds) || {}).id || 'custom';
    saveTimer(); if (!T.running && (T.phase === 'idle' || T.phase === 'done')) timerReset(); else paintTimer();
  },
  'timer-fullscreen': () => {
    const el = $('[data-timer="full"] .timer__stage'); if (!el) return;
    try { if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => toast('Full screen is not available in this view.')); else toast('Full screen is not available in this view.'); }
    catch (e) { toast('Full screen is not available in this view.'); }
  },
});
document.addEventListener('keydown', (e) => {
  if (state.route !== 'train' || Overlay.current) return;
  const tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  if (e.code === 'Space' && tag !== 'button' && tag !== 'a') { e.preventDefault(); actions['timer-toggle'](); }
  else if (e.key === 'r' || e.key === 'R') { timerReset(); }
});
