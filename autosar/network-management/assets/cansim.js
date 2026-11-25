/*
 * CanSim: one CAN channel of the example ECU (the body gateway), simulated with ComM, NmIf, CanNm and CanSM.
 *
 *   const sim = CanSim.create(el, {
 *     show: ['comm', 'cannm', 'cansm', 'timeline', 'timers', 'log'], // parts to draw (default: all)
 *     start: 'sleep',             // 'sleep' (everything off) or 'awake' (user requests, bus running)
 *     timers: { cycle: 1, rmt: 3, timeout: 2.5, wbs: 2, immCount: 0, immCycle: 0.2 },  // seconds
 *     editTimers: false,          // true: number fields to change the timer values
 *     controls: ['user', 'node', 'burst', 'allowed', 'run'],  // buttons to offer (default: all)
 *     labels: { user: '...', node: '...', burst: '...' },     // optional button texts
 *     lanes: ['self', 'node', 'comm', 'cannm', 'cansm'],      // timeline rows (default from show)
 *     logModules: ['SWC', 'ComM', 'NmIf', 'CanNm', 'CanSM', 'CanIf', 'EcuM', 'BswM', 'Bus'], // log filter
 *     scenario: [{ at: 1, do: 'request' }, { at: 6, do: 'release' }],
 *                                 // do: request | release | nodeOn | nodeOff | burst | allow | forbid
 *     window: 20                  // seconds visible on the timeline
 *   });
 *   sim.request(true|false); sim.node(true|false); sim.burst(); sim.allow(true|false);
 *   sim.pause(); sim.play(); sim.reset(); sim.state() -> { comm, cannm, cansm, t }
 *
 * The channel is ChassisCan (network handle 1) with the ComM user UserChassis and one other node,
 * the Brake ECU: its user is mapped directly to the channel (the body CAN users go through PNCs, which
 * this simulator does not model). ComMNmVariant FULL, CanNm without passive mode, node detection,
 * bus load reduction or Message Cycle Offset; transmit confirmation is assumed at once. CanSM runs the
 * path for a transceiver without partial networking; each controller or transceiver step takes 0.1 s.
 * The clock runs in real time with small example timer values. Calls between the modules use the
 * R25-11 names (ComM_<Bus>SM_ModeIndication written for CAN as ComM_CanSM_ModeIndication).
 * Colours come from course.css; a small <style> for the simulator's own layout is injected once.
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const DT = 0.05;
  const CH = 'ChassisCan';
  const USER = 'UserChassis';
  const NODE = 'Brake ECU';
  let uid = 0;

  const CSS = `
.cansim .cs-parts{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.7rem;margin:.7rem 0}
.cansim .cs-parts .card{background:var(--paper)}
.cansim .cs-parts .tag{margin-bottom:.3rem}
.cansim svg{display:block;width:100%;height:auto}
.cansim .cs-parts svg{fill:none;stroke:none;max-width:25rem;margin:0 auto}
.cansim .cs-frame{fill:none;stroke:var(--d-mute);stroke-width:1.2}
.cansim .cs-frame.on{stroke:var(--good);stroke-width:2.2}
.cansim .cs-ftext{font-family:var(--mono);font-size:10.5px;fill:var(--muted)}
.cansim .cs-st{font-family:var(--mono);font-size:10.5px;fill:var(--ink)}
.cansim .cs-sts{font-family:var(--sans);font-size:11.5px;fill:var(--ink)}
.cansim .cs-sub{font-family:var(--sans);font-size:.72rem;color:var(--muted);margin:.35rem 0 0;overflow-wrap:anywhere}
.cansim .cs-why{font-size:.88rem;min-height:2.9em;margin:.5rem 0}
.cansim .cs-tl{overflow-x:auto;margin:.5rem 0}
.cansim .cs-tl svg{min-width:34rem}
.cansim .cs-lane{font-family:var(--sans);font-size:11px;fill:var(--ink)}
.cansim .cs-ax{font-family:var(--sans);font-size:9.5px;fill:var(--muted);text-anchor:middle}
.cansim .cs-bt{font-family:var(--sans);font-size:9.5px;fill:var(--ink)}
.cansim .b-up{fill:var(--good-soft);stroke:var(--good);stroke-width:.8}
.cansim .b-rs{fill:var(--warn-soft);stroke:var(--warn);stroke-width:.8}
.cansim .b-pbs{fill:var(--sig-soft);stroke:var(--d-mute);stroke-width:.8}
.cansim .b-off{fill:var(--paper);stroke:var(--rule);stroke-width:.8}
.cansim .b-pre{fill:var(--head);stroke:var(--d-mute);stroke-width:.8;stroke-dasharray:2 2}
.cansim .pm-self{fill:var(--m-nm)}
.cansim .pm-node{fill:var(--k-req)}
.cansim .pm-wake{fill:none;stroke:var(--k-err);stroke-width:1.5}
.cansim .cs-cur{stroke:var(--accent);stroke-width:1.5}
.cansim .cs-timers{display:grid;gap:.35rem;font-family:var(--sans);font-size:.75rem;margin:.6rem 0}
.cansim .cs-timer{display:grid;grid-template-columns:minmax(8rem,11rem) 1fr 7rem;gap:.5rem;align-items:center}
.cansim .cs-timer input{width:4.6rem;margin-left:.3rem;padding:.1rem .3rem}
.cansim .cs-bar{height:.5rem;background:var(--sig-soft);position:relative;min-width:3rem}
.cansim .cs-bar i{position:absolute;left:0;top:0;bottom:0;background:var(--m-nm)}
.cansim .cs-val{font-family:var(--mono);font-size:.72rem;color:var(--muted)}
.cansim .log{max-height:12rem}
.cansim .log .t{color:var(--muted);margin-right:.4rem}
.cansim .log .chip{margin-right:.4rem;font-size:.64rem}
@media (max-width:34rem){.cansim .cs-timer{grid-template-columns:1fr 6rem}.cansim .cs-timer .cs-bar{grid-column:1 / -1;grid-row:2}}
@media print{.cansim .cs-controls{display:none}.cansim .log{max-height:none}}`;

  function injectCss() {
    if (document.getElementById('cansim-css')) return;
    const s = document.createElement('style');
    s.id = 'cansim-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  function svg(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach((k) => e.setAttribute(k, attrs[k]));
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* ---------- State names ---------- */
  const COMM = {
    NO_PENDING: 'COMM_NO_COM_NO_PENDING_REQUEST', REQ_PENDING: 'COMM_NO_COM_REQUEST_PENDING',
    SILENT: 'COMM_SILENT_COMMUNICATION', NET_REQ: 'COMM_FULL_COM_NETWORK_REQUESTED', READY_SLEEP: 'COMM_FULL_COM_READY_SLEEP'
  };
  const commMain = (s) => (s === 'NO_PENDING' || s === 'REQ_PENDING') ? 'NO' : s === 'SILENT' ? 'SILENT' : 'FULL';
  const NM = { BSM: 'Bus-Sleep Mode', PBS: 'Prepare Bus-Sleep Mode', RMS: 'Repeat Message State', NOS: 'Normal Operation State', RSS: 'Ready Sleep State' };
  const SM = { NOCOM: 'CANSM_BSM_S_NOCOM', PRE_FULLCOM: 'CANSM_BSM_S_PRE_FULLCOM', FULLCOM: 'CANSM_BSM_S_FULLCOM', SILENTCOM: 'CANSM_BSM_S_SILENTCOM', PRE_NOCOM: 'CANSM_BSM_S_PRE_NOCOM' };
  const MODE = { NO: 'COMM_NO_COMMUNICATION', SILENT: 'COMM_SILENT_COMMUNICATION', FULL: 'COMM_FULL_COMMUNICATION' };
  const BAND = {
    comm: { NO_PENDING: 'b-off', REQ_PENDING: 'b-pre', SILENT: 'b-pbs', NET_REQ: 'b-up', READY_SLEEP: 'b-rs' },
    cannm: { BSM: 'b-off', PBS: 'b-pbs', RMS: 'b-up', NOS: 'b-up', RSS: 'b-rs' },
    cansm: { NOCOM: 'b-off', PRE_FULLCOM: 'b-pre', FULLCOM: 'b-up', SILENTCOM: 'b-pbs', PRE_NOCOM: 'b-pre' }
  };
  const NAMES = { comm: COMM, cannm: NM, cansm: SM };

  /* ---------- Small state diagrams ---------- */
  function diagram(def) {
    const id = 'csah' + (++uid);
    const root = svg('svg', { viewBox: '0 0 ' + def.w + ' ' + def.h, role: 'img', 'aria-label': def.title });
    const defs = svg('defs');
    const mk = svg('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
    mk.appendChild(svg('path', { d: 'M0,0 L10,5 L0,10 z', class: 'ah' }));
    defs.appendChild(mk);
    root.appendChild(defs);
    const frames = {};
    (def.frames || []).forEach((f) => {
      const r = svg('rect', { x: f.x, y: f.y, width: f.w, height: f.h, class: 'cs-frame' });
      root.appendChild(r);
      root.appendChild(svg('text', { x: f.x + 7, y: f.ty || f.y + 13, class: 'cs-ftext' }, f.label));
      frames[f.id] = r;
    });
    (def.arrows || []).forEach((a) => {
      const d = typeof a === 'string' ? a : 'M' + a[0] + ',' + a[1] + ' L' + a[2] + ',' + a[3];
      root.appendChild(svg('path', { d, class: 'd-ln', 'marker-end': 'url(#' + id + ')' }));
    });
    const boxes = {};
    def.states.forEach((s) => {
      const r = svg('rect', { x: s.x, y: s.y, width: s.w, height: s.h, class: 'd-state' });
      root.appendChild(r);
      const lh = 13;
      const y0 = s.y + s.h / 2 - ((s.lines.length - 1) * lh) / 2 + 4;
      s.lines.forEach((ln, i) => root.appendChild(svg('text', { x: s.x + s.w / 2, y: y0 + i * lh, class: (def.sans ? 'cs-sts' : 'cs-st') + ' d-c' }, ln)));
      boxes[s.id] = r;
    });
    return {
      root,
      set(cur, frameOn) {
        Object.keys(boxes).forEach((k) => boxes[k].classList.toggle('on', k === cur));
        Object.keys(frames).forEach((k) => frames[k].classList.toggle('on', k === frameOn));
        root.setAttribute('aria-label', def.title + ': ' + def.name(cur));
      }
    };
  }

  function commDiagram() {
    return diagram({
      w: 360, h: 252, title: 'ComM channel state machine', name: (s) => COMM[s],
      frames: [
        { id: 'FULL', x: 4, y: 4, w: 352, h: 84, label: 'COMM_FULL_COMMUNICATION' },
        { id: 'NO', x: 4, y: 162, w: 352, h: 86, label: 'COMM_NO_COMMUNICATION' }
      ],
      states: [
        { id: 'NET_REQ', x: 14, y: 24, w: 148, h: 52, lines: ['COMM_FULL_COM_', 'NETWORK_REQUESTED'] },
        { id: 'READY_SLEEP', x: 198, y: 24, w: 148, h: 52, lines: ['COMM_FULL_COM_', 'READY_SLEEP'] },
        { id: 'SILENT', x: 198, y: 104, w: 148, h: 42, lines: ['COMM_SILENT_', 'COMMUNICATION'] },
        { id: 'REQ_PENDING', x: 14, y: 184, w: 148, h: 52, lines: ['COMM_NO_COM_', 'REQUEST_PENDING'] },
        { id: 'NO_PENDING', x: 198, y: 184, w: 148, h: 52, lines: ['COMM_NO_COM_NO_', 'PENDING_REQUEST'] }
      ],
      arrows: [[198, 210, 163, 210], [88, 184, 88, 77], [162, 42, 197, 42], [198, 60, 163, 60],
        [250, 76, 250, 103], [310, 104, 310, 77], [272, 146, 272, 183], [198, 120, 140, 77]]
    });
  }
  function nmDiagram() {
    return diagram({
      w: 380, h: 182, sans: true, title: 'CanNm state machine', name: (s) => NM[s],
      frames: [{ id: 'NET', x: 4, y: 4, w: 372, h: 100, ty: 98, label: 'Network Mode' }],
      states: [
        { id: 'RMS', x: 10, y: 24, w: 108, h: 56, lines: ['Repeat Message', 'State'] },
        { id: 'NOS', x: 138, y: 24, w: 108, h: 56, lines: ['Normal Operation', 'State'] },
        { id: 'RSS', x: 266, y: 24, w: 108, h: 56, lines: ['Ready Sleep', 'State'] },
        { id: 'BSM', x: 10, y: 126, w: 150, h: 46, lines: ['Bus-Sleep Mode'] },
        { id: 'PBS', x: 196, y: 126, w: 178, h: 46, lines: ['Prepare Bus-Sleep Mode'] }
      ],
      arrows: [[118, 40, 137, 40], [246, 40, 265, 40], [266, 64, 247, 64], 'M88,24 C88,8 300,8 300,23',
        [330, 80, 330, 125], [196, 149, 161, 149], [64, 126, 64, 81], [230, 126, 100, 81]]
    });
  }
  function smDiagram() {
    return diagram({
      w: 380, h: 194, title: 'CanSM state machine of the network', name: (s) => SM[s],
      states: [
        { id: 'FULLCOM', x: 10, y: 6, w: 360, h: 38, lines: ['CANSM_BSM_S_FULLCOM'] },
        { id: 'PRE_FULLCOM', x: 10, y: 78, w: 172, h: 38, lines: ['CANSM_BSM_S_PRE_FULLCOM'] },
        { id: 'SILENTCOM', x: 198, y: 78, w: 172, h: 38, lines: ['CANSM_BSM_S_SILENTCOM'] },
        { id: 'NOCOM', x: 10, y: 150, w: 172, h: 38, lines: ['CANSM_BSM_S_NOCOM'] },
        { id: 'PRE_NOCOM', x: 198, y: 150, w: 172, h: 38, lines: ['CANSM_BSM_S_PRE_NOCOM'] }
      ],
      arrows: [[60, 150, 60, 117], [60, 78, 60, 45], [250, 44, 250, 77], [330, 78, 330, 45],
        [284, 116, 284, 149], [190, 44, 190, 149], [198, 170, 183, 170]]
    });
  }

  /* ---------- The simulator ---------- */
  function create(el, opts) {
    injectCss();
    const o = Object.assign({
      show: ['comm', 'cannm', 'cansm', 'timeline', 'timers', 'log'], start: 'sleep', editTimers: false,
      controls: ['user', 'node', 'burst', 'allowed', 'run'], labels: {}, scenario: [], window: 20
    }, opts);
    const cfg = Object.assign({ cycle: 1, rmt: 3, timeout: 2.5, wbs: 2, immCount: 0, immCycle: 0.2 }, o.timers);
    const shows = (p) => o.show.indexOf(p) >= 0;
    if (!o.lanes) o.lanes = ['self', 'node'].concat(['comm', 'cannm', 'cansm'].filter(shows));
    el.classList.add('cansim');
    el.replaceChildren();

    /* --- DOM --- */
    const ctl = h('div', 'controls cs-controls');
    function toggle(key, text, fn) {
      const b = h('button', '', text);
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => fn(b.getAttribute('aria-pressed') !== 'true'));
      ctl.appendChild(b);
      return b;
    }
    function plain(text, fn, primary) {
      const b = h('button', primary ? 'primary' : '', text);
      b.type = 'button';
      b.addEventListener('click', fn);
      ctl.appendChild(b);
      return b;
    }
    const has = (c) => o.controls.indexOf(c) >= 0;
    const L = Object.assign({
      user: USER + ' requests ' + CH, node: NODE + ' keeps sending NM PDUs',
      burst: NODE + ' wakes the bus briefly', allowed: 'Communication allowed'
    }, o.labels);
    const bUser = has('user') ? toggle('user', L.user, (on) => api.request(on)) : null;
    const bNode = has('node') ? toggle('node', L.node, (on) => api.node(on)) : null;
    const bBurst = has('burst') ? plain(L.burst, () => api.burst()) : null;
    const bAllow = has('allowed') ? toggle('allowed', L.allowed, (on) => api.allow(on)) : null;
    let bRun = null;
    if (has('run')) {
      bRun = plain('Pause', () => (running ? api.pause() : api.play()));
      plain('Start again', () => api.reset());
    }
    const why = h('p', 'cs-why');
    why.setAttribute('aria-live', 'polite');
    el.append(ctl, why);

    const parts = h('div', 'cs-parts');
    const dia = {};
    const sub = {};
    function card(key, mod, tag, d) {
      const c = h('div', 'card ' + mod);
      c.appendChild(h('p', 'tag', tag));
      c.appendChild(d.root);
      sub[key] = h('p', 'cs-sub');
      c.appendChild(sub[key]);
      parts.appendChild(c);
      dia[key] = d;
    }
    if (shows('comm')) card('comm', 'm-comm', 'ComM · channel ' + CH, commDiagram());
    if (shows('cannm')) card('cannm', 'm-nm', 'CanNm · ' + CH, nmDiagram());
    if (shows('cansm')) card('cansm', 'm-sm', 'CanSM · network ' + CH, smDiagram());
    if (parts.children.length) el.appendChild(parts);

    let tlSvg = null;
    if (shows('timeline')) {
      const wrap = h('div', 'cs-tl');
      tlSvg = svg('svg', { role: 'img', 'aria-label': 'Timeline of ' + CH });
      wrap.appendChild(tlSvg);
      el.appendChild(wrap);
      const lg = h('p', 'legend');
      lg.innerHTML = '<span><svg width="10" height="10" style="display:inline;width:10px;vertical-align:-1px"><circle cx="5" cy="5" r="4" class="pm-self"/></svg> NM PDU of the gateway</span>' +
        '<span><svg width="10" height="10" style="display:inline;width:10px;vertical-align:-1px"><circle cx="5" cy="5" r="4" class="pm-node"/></svg> NM PDU of the ' + NODE + '</span>' +
        '<span><span class="box" style="background:var(--good-soft);border-color:var(--good)"></span>awake, needed</span>' +
        '<span><span class="box" style="background:var(--warn-soft);border-color:var(--warn)"></span>ready to sleep</span>' +
        '<span><span class="box" style="background:var(--sig-soft);border-color:var(--d-mute)"></span>silent, calming down</span>' +
        '<span><span class="box"></span>off, asleep</span>';
      el.appendChild(lg);
    }
    const timerRows = {};
    if (shows('timers')) {
      const box = h('div', 'cs-timers');
      [['cycle', 'Message Cycle Time'], ['rmt', 'Repeat Message Time'], ['timeout', 'NM-Timeout Time'], ['wbs', 'Wait Bus-Sleep Time']].forEach(([k, name]) => {
        const row = h('div', 'cs-timer');
        const lab = h('span', '', name);
        if (o.editTimers) {
          const inp = h('input');
          inp.type = 'number'; inp.min = '0.1'; inp.step = '0.1'; inp.value = String(cfg[k]);
          inp.setAttribute('aria-label', name + ' in seconds');
          inp.addEventListener('change', () => { const v = parseFloat(inp.value); if (v > 0) cfg[k] = v; else inp.value = String(cfg[k]); });
          lab.appendChild(inp);
        }
        const bar = h('span', 'cs-bar');
        const fill = h('i');
        bar.appendChild(fill);
        const val = h('span', 'cs-val', '');
        row.append(lab, bar, val);
        box.appendChild(row);
        timerRows[k] = { fill, val };
      });
      if (o.editTimers) {
        const row = h('div', 'cs-timer');
        const lab = h('span', '', 'Immediate transmissions');
        const inp = h('input');
        inp.type = 'number'; inp.min = '0'; inp.max = '9'; inp.step = '1'; inp.value = String(cfg.immCount);
        inp.setAttribute('aria-label', 'Number of immediate transmissions');
        inp.addEventListener('change', () => { const v = parseInt(inp.value, 10); if (v >= 0 && v < 10) cfg.immCount = v; else inp.value = String(cfg.immCount); });
        lab.appendChild(inp);
        row.append(lab, h('span', ''), h('span', 'cs-val', 'every ' + cfg.immCycle + ' s'));
        box.appendChild(row);
      }
      el.appendChild(box);
    }
    let logEl = null;
    if (shows('log')) {
      logEl = h('ol', 'log');
      logEl.tabIndex = 0;
      logEl.setAttribute('aria-label', 'Calls between the modules');
      el.appendChild(logEl);
    }

    /* --- Model --- */
    let S, T, tl, running = true, lastReal = performance.now(), sinceRender = 0;
    const MODCLS = { SWC: 'm-app', ComM: 'm-comm', NmIf: 'm-nm', CanNm: 'm-nm', CanSM: 'm-sm', CanIf: 'm-if', EcuM: 'm-ecum', BswM: 'm-bswm', Bus: 'm-drv', CanTrcv: 'm-drv' };
    function log(from, to, text) {
      if (!logEl) return;
      if (o.logModules && (o.logModules.indexOf(from) < 0 || (to && o.logModules.indexOf(to) < 0))) return;
      const li = h('li');
      li.appendChild(h('span', 't', S.t.toFixed(2) + ' s'));
      li.appendChild(h('span', 'chip ' + (MODCLS[from] || ''), from + (to ? ' → ' + to : '')));
      li.appendChild(h('code', '', text));
      logEl.appendChild(li);
      while (logEl.children.length > 250) logEl.removeChild(logEl.firstChild);
      logEl.scrollTop = logEl.scrollHeight;
    }
    const say = (text) => { why.textContent = text; };

    function band(lane, state) {
      const segs = tl.bands[lane];
      const last = segs[segs.length - 1];
      if (last && last.state === state) return;
      if (last) last.e = S.t;
      segs.push({ s: S.t, e: null, state });
    }
    function setComm(s, text) {
      S.comm = s;
      band('comm', s);
      if (text) say(text);
      if (s === 'READY_SLEEP') nmCall('Nm_NetworkRelease', 'CanNm_NetworkRelease', canNmRelease);
    }
    function setNm(s, text) { S.nm = s; band('cannm', s); if (text) say(text); }
    function setSm(s) { S.sm = s; band('cansm', s); }

    /* ComM */
    function smRequest(mode) {
      log('ComM', 'CanSM', 'CanSM_RequestComMode(' + CH + ', ' + MODE[mode] + ')');
      S.smReq = mode;
    }
    function enterFull(subState, text) {
      const was = commMain(S.comm);
      if (was !== 'FULL') smRequest('FULL');
      setComm(subState, text);
      if (subState === 'NET_REQ') {
        if (S.userReq) nmCall('Nm_NetworkRequest', 'CanNm_NetworkRequest', canNmRequest);
        else if (S.passive) nmCall('Nm_PassiveStartUp', 'CanNm_PassiveStartUp', canNmPassive);
      }
      S.wake = false; S.passive = false;
    }
    function enterNoCom(text) {
      setComm('NO_PENDING', text);
      smRequest('NO');
      nmCall('Nm_NetworkRelease', 'CanNm_NetworkRelease', canNmRelease);
    }
    function commMainFunction() {
      switch (S.comm) {
        case 'NO_PENDING':
          if (S.userReq) setComm('REQ_PENDING', USER + ' requests COMM_FULL_COMMUNICATION: ComM moves to COMM_NO_COM_REQUEST_PENDING.');
          else if (S.wake) setComm('REQ_PENDING', 'EcuM reported a wakeup of ' + CH + ': ComM moves to COMM_NO_COM_REQUEST_PENDING.');
          break;
        case 'REQ_PENDING':
          if (!S.userReq && !S.wake) setComm('NO_PENDING', 'The request was withdrawn before communication was allowed: back to COMM_NO_COM_NO_PENDING_REQUEST.');
          else if (S.allowed) enterFull('NET_REQ', 'Communication is allowed: ComM enters COMM_FULL_COMMUNICATION, sub-state COMM_FULL_COM_NETWORK_REQUESTED, asks CanSM for full communication and ' + (S.userReq ? 'requests the network.' : 'starts network management passively (wakeup).'));
          else if (!S.saidWait) { S.saidWait = true; say('The request is pending: communication is not allowed on ' + CH + ' yet, so ComM waits in COMM_NO_COM_REQUEST_PENDING.'); }
          break;
        case 'NET_REQ':
          if (!S.userReq) setComm('READY_SLEEP', 'No user requests ' + CH + ' any more: ComM enters COMM_FULL_COM_READY_SLEEP and releases the network. The bus stays awake until network management lets it sleep.');
          break;
        case 'READY_SLEEP':
          if (S.userReq) {
            setComm('NET_REQ', USER + ' requests again: ComM goes back to COMM_FULL_COM_NETWORK_REQUESTED and requests the network.');
            nmCall('Nm_NetworkRequest', 'CanNm_NetworkRequest', canNmRequest);
          }
          break;
        case 'SILENT':
          if (S.userReq) enterFull('NET_REQ', USER + ' requests during COMM_SILENT_COMMUNICATION: ComM returns to COMM_FULL_COM_NETWORK_REQUESTED and requests the network.');
          break;
      }
    }
    function commNetworkMode() {
      log('NmIf', 'ComM', 'ComM_Nm_NetworkMode(' + CH + ')');
      if (S.comm === 'SILENT') enterFull('READY_SLEEP', 'Network management is back in Network Mode: ComM leaves COMM_SILENT_COMMUNICATION for COMM_FULL_COM_READY_SLEEP.');
    }
    function commPrepareBusSleep() {
      log('NmIf', 'ComM', 'ComM_Nm_PrepareBusSleepMode(' + CH + ')');
      if (commMain(S.comm) === 'FULL') {
        setComm('SILENT', 'Network management prepares the bus for sleep: ComM enters COMM_SILENT_COMMUNICATION (receive only).');
        smRequest('SILENT');
      }
    }
    function commBusSleep() {
      log('NmIf', 'ComM', 'ComM_Nm_BusSleepMode(' + CH + ')');
      if (commMain(S.comm) !== 'NO') enterNoCom('The bus sleeps: ComM enters COMM_NO_COMMUNICATION and asks CanSM to switch the network off.');
    }
    function commNetworkStart() {
      log('NmIf', 'ComM', 'ComM_Nm_NetworkStartIndication(' + CH + ')');
      if (commMain(S.comm) === 'NO' && S.allowed) { S.passive = true; enterFull('NET_REQ', 'An NM PDU arrived in Bus-Sleep Mode: ComM switches to COMM_FULL_COMMUNICATION and starts network management passively.'); }
    }
    function commModeIndication(mode) {
      log('CanSM', 'ComM', 'ComM_CanSM_ModeIndication(' + CH + ', ' + MODE[mode] + ')');
      S.indicated = mode;
      log('ComM', 'BswM', 'BswM_ComM_CurrentMode(' + CH + ', ' + MODE[mode] + ')');
    }

    /* NmIf and CanNm */
    function nmCall(nmApi, canApi, fn) {
      log('ComM', 'NmIf', nmApi + '(' + CH + ')');
      log('NmIf', 'CanNm', canApi + '(' + CH + ')');
      fn();
    }
    function nmIndicate(api, comFn) {
      log('CanNm', 'NmIf', api + '(' + CH + ')');
      comFn();
    }
    function startTx(firstAfter) { S.tx = true; T.cycle = firstAfter; }
    function stopTx() { S.tx = false; T.cycle = null; S.immLeft = 0; }
    function enterNetworkMode(active, text) {
      const from = S.nm;
      setNm('RMS', text);
      T.timeout = cfg.timeout; T.rmt = cfg.rmt; T.wbs = null;
      S.immLeft = (active && (from === 'BSM' || from === 'PBS') && cfg.immCount > 0) ? cfg.immCount : 0;
      startTx(0);
      nmIndicate('Nm_NetworkMode', commNetworkMode);
    }
    function canNmRequest() {
      S.nmReq = true;
      if (S.nm === 'BSM' || S.nm === 'PBS') enterNetworkMode(true, 'CanNm leaves ' + NM[S.nm] + ' for the Repeat Message State and starts sending NM PDUs' + (cfg.immCount > 0 ? ', first ' + cfg.immCount + ' immediate transmissions.' : '.'));
      else if (S.nm === 'RSS') { setNm('NOS', 'The network is requested again: CanNm goes from the Ready Sleep State to the Normal Operation State and sends NM PDUs at once.'); startTx(0); }
    }
    function canNmRelease() {
      S.nmReq = false;
      if (S.nm === 'NOS') { setNm('RSS', 'The network is released: CanNm goes to the Ready Sleep State and stops sending NM PDUs. It stays there while NM PDUs of other nodes arrive.'); stopTx(); }
    }
    function canNmPassive() {
      if (S.nm === 'BSM' || S.nm === 'PBS') enterNetworkMode(false, 'Passive startup: CanNm enters the Repeat Message State without a network request, sends NM PDUs for the Repeat Message Time and then goes to the Ready Sleep State.');
    }
    function selfPdu() {
      tl.marks.push({ t: S.t, lane: 'self' });
      if (S.nm === 'RMS' || S.nm === 'NOS' || S.nm === 'RSS') T.timeout = cfg.timeout; // transmit confirmation
    }
    function canNmMainFunction() {
      if (S.tx && T.cycle !== null) {
        T.cycle -= DT;
        if (T.cycle <= 1e-9) {
          if (S.sm === 'FULLCOM') {
            selfPdu();
            if (S.immLeft > 0) { S.immLeft--; T.cycle = S.immLeft > 0 ? cfg.immCycle : cfg.cycle; }
            else T.cycle = cfg.cycle;
          } else T.cycle = 0;
        }
      }
      if (S.nm === 'RMS') {
        T.rmt -= DT;
        if (T.rmt <= 1e-9) {
          T.rmt = null;
          if (S.nmReq) setNm('NOS', 'The Repeat Message Time is over and the network is requested: CanNm goes to the Normal Operation State and keeps sending.');
          else { setNm('RSS', 'The Repeat Message Time is over and the network is released: CanNm goes to the Ready Sleep State and stops sending.'); stopTx(); }
        }
      }
      if (S.nm === 'RMS' || S.nm === 'NOS' || S.nm === 'RSS') {
        T.timeout -= DT;
        if (T.timeout <= 1e-9) {
          if (S.nm === 'RSS') {
            T.timeout = null; T.wbs = cfg.wbs; stopTx();
            setNm('PBS', 'No NM PDU for the NM-Timeout Time in the Ready Sleep State: CanNm enters Prepare Bus-Sleep Mode and waits the Wait Bus-Sleep Time.');
            nmIndicate('Nm_PrepareBusSleepMode', commPrepareBusSleep);
          } else T.timeout = cfg.timeout;
        }
      } else if (S.nm === 'PBS') {
        T.wbs -= DT;
        if (T.wbs <= 1e-9) {
          T.wbs = null;
          setNm('BSM', 'The Wait Bus-Sleep Time is over: CanNm enters Bus-Sleep Mode.');
          nmIndicate('Nm_BusSleepMode', commBusSleep);
        }
      }
    }
    function busPdu() {
      tl.marks.push({ t: S.t, lane: 'node' });
      if (S.sm === 'FULLCOM' || S.sm === 'SILENTCOM') {
        if (S.nm === 'RMS' || S.nm === 'NOS' || S.nm === 'RSS') T.timeout = cfg.timeout;
        else if (S.nm === 'PBS') {
          log('CanIf', 'CanNm', 'CanNm_RxIndication(…)');
          enterNetworkMode(false, 'An NM PDU of the ' + NODE + ' arrives in Prepare Bus-Sleep Mode: CanNm goes back to Network Mode (Repeat Message State).');
        } else if (S.nm === 'BSM') {
          log('CanIf', 'CanNm', 'CanNm_RxIndication(…)');
          nmIndicate('Nm_NetworkStartIndication', commNetworkStart);
        }
      } else if (S.sm === 'NOCOM' && S.wakeAt === null && S.comm === 'NO_PENDING' && !S.wake) {
        tl.marks.push({ t: S.t, lane: 'node', wake: true });
        log('Bus', 'CanTrcv', 'wakeup detected (NM PDU of the ' + NODE + ')');
        say('The CAN transceiver sees traffic on the sleeping bus and reports a wakeup. EcuM validates it and tells ComM.');
        S.wakeAt = S.t + 0.3;
      }
    }

    /* CanSM */
    function smStep(list, done) { S.smSteps = list.slice(); S.smDone = done; T.sm = 0.1; }
    function smDo(step) {
      const [api, val, kind] = step;
      log('CanSM', 'CanIf', api + '(' + (kind === 'cc' ? 'ControllerId' : 'TransceiverId') + ', ' + val + ')');
      if (kind === 'cc') { S.cc = val; log('CanIf', 'CanSM', 'CanSM_ControllerModeIndication(ControllerId, ' + val + ')'); }
      else { S.trcv = val; log('CanIf', 'CanSM', 'CanSM_TransceiverModeIndication(TransceiverId, ' + val.replace('CANTRCV_', 'CANTRCV_') + ')'); }
    }
    function fullComEffect() {
      setSm('FULLCOM'); S.smMode = 'FULL';
      log('CanSM', 'CanIf', 'CanIf_SetPduMode(ControllerId, CANIF_ONLINE)');
      commModeIndication('FULL');
      log('CanSM', 'BswM', 'BswM_CanSM_CurrentState(' + CH + ', CANSM_BSWM_FULL_COMMUNICATION)');
    }
    function canSmMainFunction() {
      if (S.smSteps) {
        T.sm -= DT;
        if (T.sm <= 1e-9) {
          if (S.smSteps.length) { smDo(S.smSteps.shift()); T.sm = 0.1; }
          else { const d = S.smDone; S.smSteps = null; d(); }
        }
        return;
      }
      const r = S.smReq;
      if (S.sm === 'NOCOM' && r === 'FULL') {
        setSm('PRE_FULLCOM');
        smStep([['CanIf_SetTrcvMode', 'CANTRCV_TRCVMODE_NORMAL', 'tr'], ['CanIf_SetControllerMode', 'CAN_CS_STOPPED', 'cc'], ['CanIf_SetControllerMode', 'CAN_CS_STARTED', 'cc']], fullComEffect);
      } else if (S.sm === 'FULLCOM' && r === 'SILENT') {
        setSm('SILENTCOM'); S.smMode = 'SILENT';
        log('CanSM', 'BswM', 'BswM_CanSM_CurrentState(' + CH + ', CANSM_BSWM_SILENT_COMMUNICATION)');
        log('CanSM', 'CanIf', 'CanIf_SetPduMode(ControllerId, CANIF_TX_OFFLINE)');
        commModeIndication('SILENT');
      } else if (S.sm === 'SILENTCOM' && r === 'FULL') {
        fullComEffect();
      } else if ((S.sm === 'FULLCOM' || S.sm === 'SILENTCOM') && r === 'NO') {
        setSm('PRE_NOCOM');
        log('CanSM', 'BswM', 'BswM_CanSM_CurrentState(' + CH + ', CANSM_BSWM_NO_COMMUNICATION)');
        smStep([['CanIf_SetControllerMode', 'CAN_CS_STOPPED', 'cc'], ['CanIf_SetControllerMode', 'CAN_CS_SLEEP', 'cc'],
          ['CanIf_SetTrcvMode', 'CANTRCV_TRCVMODE_NORMAL', 'tr'], ['CanIf_SetTrcvMode', 'CANTRCV_TRCVMODE_STANDBY', 'tr']], () => {
          setSm('NOCOM'); S.smMode = 'NO';
          commModeIndication('NO');
        });
      }
    }

    /* Other node */
    function nodeTick() {
      if (S.nodeOn || (S.burstUntil !== null && S.t < S.burstUntil)) {
        S.nodeCycle -= DT;
        if (S.nodeCycle <= 1e-9) { S.nodeCycle = cfg.cycle; busPdu(); }
      } else if (S.burstUntil !== null && S.t >= S.burstUntil) S.burstUntil = null;
      if (S.wakeAt !== null && S.t >= S.wakeAt) {
        S.wakeAt = null;
        log('EcuM', 'ComM', 'ComM_EcuM_WakeUpIndication(' + CH + ')');
        if (S.comm === 'NO_PENDING') { S.wake = true; S.passive = true; }
      }
    }

    /* --- Rendering --- */
    function renderTimeline() {
      if (!tlSvg) return;
      const W = 700, LEFT = 112, RIGHT = 10, RH = 26, TOP = 6;
      const lanes = o.lanes;
      const H = TOP + lanes.length * RH + 18;
      tlSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const t0 = Math.max(0, S.t - o.window);
      const x = (t) => LEFT + ((t - t0) / o.window) * (W - LEFT - RIGHT);
      tlSvg.replaceChildren();
      const LBL = { self: 'Gateway sends', node: NODE + ' sends', comm: 'ComM', cannm: 'CanNm', cansm: 'CanSM' };
      lanes.forEach((ln, i) => {
        const y = TOP + i * RH;
        tlSvg.appendChild(svg('text', { x: 0, y: y + 16, class: 'cs-lane' }, (o.labels.lanes && o.labels.lanes[ln]) || LBL[ln]));
        if (ln === 'self' || ln === 'node') {
          tlSvg.appendChild(svg('line', { x1: LEFT, x2: W - RIGHT, y1: y + 12, y2: y + 12, class: 'd-tick' }));
          tl.marks.forEach((m) => {
            if (m.lane !== ln || m.t < t0) return;
            if (m.wake) tlSvg.appendChild(svg('circle', { cx: x(m.t), cy: y + 12, r: 7.5, class: 'pm-wake' }));
            else tlSvg.appendChild(svg('circle', { cx: x(m.t), cy: y + 12, r: 4, class: ln === 'self' ? 'pm-self' : 'pm-node' }));
          });
        } else {
          tl.bands[ln].forEach((sg) => {
            const e = sg.e === null ? S.t : sg.e;
            if (e < t0) return;
            const a = x(Math.max(sg.s, t0)), b = x(e);
            const r = svg('rect', { x: a, y: y + 3, width: Math.max(0.5, b - a), height: 18, class: BAND[ln][sg.state] });
            r.appendChild(svg('title', {}, NAMES[ln][sg.state]));
            tlSvg.appendChild(r);
            const name = NAMES[ln][sg.state];
            if (b - a > name.length * 5.3 + 8) tlSvg.appendChild(svg('text', { x: a + 4, y: y + 16, class: 'cs-bt' }, name));
          });
        }
      });
      const yA = TOP + lanes.length * RH + 12;
      for (let s = Math.ceil(t0); s <= t0 + o.window + 1e-9; s += 1) {
        if (s % 2) continue;
        tlSvg.appendChild(svg('text', { x: x(s), y: yA, class: 'cs-ax' }, s + ' s'));
      }
      tlSvg.appendChild(svg('line', { x1: x(S.t), x2: x(S.t), y1: TOP, y2: TOP + lanes.length * RH, class: 'cs-cur' }));
    }
    function renderTimers() {
      const row = (k, left, total, note) => {
        const r = timerRows[k];
        if (!r) return;
        if (left === null || left === undefined) { r.fill.style.width = '0'; r.val.textContent = note || 'not running'; return; }
        r.fill.style.width = Math.max(0, Math.min(100, 100 * (1 - left / total))) + '%';
        r.val.textContent = Math.max(0, left).toFixed(1) + ' s left';
      };
      row('cycle', S.tx ? T.cycle : null, S.immLeft > 0 ? cfg.immCycle : cfg.cycle);
      row('rmt', S.nm === 'RMS' ? T.rmt : null, cfg.rmt);
      row('timeout', (S.nm === 'RMS' || S.nm === 'NOS' || S.nm === 'RSS') ? T.timeout : null, cfg.timeout);
      row('wbs', S.nm === 'PBS' ? T.wbs : null, cfg.wbs);
    }
    function render() {
      if (dia.comm) { dia.comm.set(S.comm, commMain(S.comm) === 'FULL' ? 'FULL' : commMain(S.comm) === 'NO' ? 'NO' : null); sub.comm.textContent = 'Mode indicated to the users: ' + MODE[S.indicated] + (S.allowed ? '' : ' · communication not allowed'); }
      if (dia.cannm) { dia.cannm.set(S.nm, ['RMS', 'NOS', 'RSS'].indexOf(S.nm) >= 0 ? 'NET' : null); sub.cannm.textContent = 'Network ' + (S.nmReq ? 'requested' : 'released') + ' · ' + (S.tx ? 'sending NM PDUs' : 'not sending'); }
      if (dia.cansm) { dia.cansm.set(S.sm, null); sub.cansm.textContent = 'Network mode: ' + MODE[S.smMode] + ' · controller ' + S.cc + ' · transceiver ' + S.trcv; }
      if (bUser) bUser.setAttribute('aria-pressed', String(S.userReq));
      if (bNode) bNode.setAttribute('aria-pressed', String(S.nodeOn));
      if (bAllow) bAllow.setAttribute('aria-pressed', String(S.allowed));
      if (bRun) bRun.textContent = running ? 'Pause' : 'Run';
      renderTimeline();
      renderTimers();
    }

    /* --- Clock --- */
    function step() {
      S.t += DT;
      o.scenario.forEach((sc, i) => { if (!S.done[i] && S.t >= sc.at) { S.done[i] = true; act(sc.do); if (sc.text) say(sc.text); } });
      nodeTick();
      canNmMainFunction();
      commMainFunction();
      canSmMainFunction();
      const cut = S.t - o.window - 2;
      if (tl.marks.length > 400) tl.marks = tl.marks.filter((m) => m.t >= cut);
    }
    function frame() {
      const now = performance.now();
      let el2 = Math.min(0.5, (now - lastReal) / 1000);
      lastReal = now;
      if (!running) return;
      S.acc += el2;
      while (S.acc >= DT) { S.acc -= DT; step(); }
      render();
    }
    function act(what) {
      if (what === 'request') api.request(true);
      else if (what === 'release') api.request(false);
      else if (what === 'nodeOn') api.node(true);
      else if (what === 'nodeOff') api.node(false);
      else if (what === 'burst') api.burst();
      else if (what === 'allow') api.allow(true);
      else if (what === 'forbid') api.allow(false);
    }

    function init() {
      const awake = o.start === 'awake';
      S = {
        t: 0, acc: 0, done: {}, userReq: awake, allowed: true, wake: false, passive: false, saidWait: false,
        comm: awake ? 'NET_REQ' : 'NO_PENDING', nm: awake ? 'NOS' : 'BSM', nmReq: awake, tx: awake, immLeft: 0,
        sm: awake ? 'FULLCOM' : 'NOCOM', smReq: awake ? 'FULL' : 'NO', smMode: awake ? 'FULL' : 'NO', smSteps: null, smDone: null,
        cc: awake ? 'CAN_CS_STARTED' : 'CAN_CS_SLEEP', trcv: awake ? 'CANTRCV_TRCVMODE_NORMAL' : 'CANTRCV_TRCVMODE_STANDBY',
        indicated: awake ? 'FULL' : 'NO', nodeOn: false, nodeCycle: 0, burstUntil: null, wakeAt: null
      };
      T = { cycle: awake ? 0.3 : null, rmt: null, timeout: awake ? cfg.timeout : null, wbs: null, sm: 0 };
      tl = { marks: [], bands: { comm: [{ s: 0, e: null, state: S.comm }], cannm: [{ s: 0, e: null, state: S.nm }], cansm: [{ s: 0, e: null, state: S.sm }] } };
      if (logEl) logEl.replaceChildren();
      say(awake
        ? USER + ' requests ' + CH + ': ComM is in COMM_FULL_COM_NETWORK_REQUESTED, CanNm in the Normal Operation State, CanSM in CANSM_BSM_S_FULLCOM.'
        : CH + ' sleeps: ComM is in COMM_NO_COMMUNICATION, CanNm in Bus-Sleep Mode, CanSM in CANSM_BSM_S_NOCOM.');
      render();
    }

    const api = {
      request(on) {
        if (on === S.userReq) return;
        S.userReq = on;
        S.saidWait = false;
        log('SWC', 'ComM', 'ComM_RequestComMode(' + USER + ', ' + (on ? MODE.FULL : MODE.NO) + ')');
        render();
      },
      node(on) {
        if (on === S.nodeOn) return;
        S.nodeOn = on;
        if (on) S.nodeCycle = 0.05;
        say(on ? 'The ' + NODE + ' needs the bus and sends NM PDUs.' : 'The ' + NODE + ' no longer needs the bus and stops sending NM PDUs.');
        render();
      },
      burst() {
        S.burstUntil = S.t + cfg.rmt;
        S.nodeCycle = 0.05;
        say('The ' + NODE + ' wakes the bus: it sends NM PDUs for its Repeat Message Time, then needs nothing more.');
      },
      allow(on) {
        if (on === S.allowed) return;
        S.allowed = on;
        log('BswM', 'ComM', 'ComM_CommunicationAllowed(' + CH + ', ' + (on ? 'TRUE' : 'FALSE') + ')');
        say(on ? 'Communication on ' + CH + ' is allowed again.' : 'Communication on ' + CH + ' is not allowed: a pending request waits in COMM_NO_COM_REQUEST_PENDING. A channel that already communicates is not affected.');
        render();
      },
      pause() { running = false; render(); },
      play() { running = true; lastReal = performance.now(); render(); },
      reset() { init(); running = true; lastReal = performance.now(); render(); },
      state() { return { comm: COMM[S.comm], cannm: NM[S.nm], cansm: SM[S.sm], t: S.t }; },
      el
    };
    init();
    setInterval(frame, 50);
    return api;
  }

  window.CanSim = { create };
})();
