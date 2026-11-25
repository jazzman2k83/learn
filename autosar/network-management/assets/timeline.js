/*
 * Running timeline: a clock sweeps left to right over a few lanes and you drop marks on it.
 *
 *   const tl = Timeline.create(el, {
 *     lanes: [{ id: 'bus', label: 'On the wire' }],
 *     duration: 12,                       // seconds for one sweep
 *     axis: 1,                            // optional: label the time axis every 1 s
 *     onTick: (prev, now) => {},          // called every frame while running
 *     onReset: () => {}
 *   });
 *   tl.mark('bus', 'text', 'k-sd');       // drop a mark at the current time (css class optional)
 *   tl.markAt('bus', 3.5, 'text', 'k-ev');// drop a mark at a given time
 *   tl.span('bus', 2, 5, 'f-sd', 'lease');// draw a bar from 2 s to 5 s (classes f-sd, f-ev, f-res, f-req, f-err, f-mute)
 *   tl.start(); tl.stop(); tl.reset(); tl.now(); tl.running(); tl.finished();
 *   tl.buttons                            // a <div> to append your own buttons to
 *
 * Helpers: Timeline.crossed(prev, now, period) -> how many multiples of period lie in (prev, now].
 *          Timeline.button(text, onClick, primary) -> a ready <button>.
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 700;
  const LEFT = 132;
  const RIGHT = 15;
  const LANE_H = 46;
  const TOP = 10;

  function svg(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function create(el, opts) {
    const o = Object.assign({ duration: 12, onTick: () => {}, onReset: () => {} }, opts);
    el.classList.add('timeline');
    const axisH = o.axis ? 16 : 0;
    const H = TOP + o.lanes.length * LANE_H + 6 + axisH;
    const root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Timeline' });
    const laneY = {};
    const xOf = (time) => LEFT + (time / o.duration) * (W - LEFT - RIGHT);
    o.lanes.forEach((lane, i) => {
      const y = TOP + i * LANE_H + 30;
      laneY[lane.id] = y;
      const text = svg('text', { x: 0, y: y + 4, class: 'lane-label' });
      text.textContent = lane.label;
      root.append(text, svg('line', { x1: LEFT, x2: W - RIGHT, y1: y, y2: y, class: 'lane-line' }));
    });
    if (o.axis) {
      const yA = TOP + o.lanes.length * LANE_H + 14;
      for (let t = 0; t <= o.duration + 1e-9; t += o.axis) {
        const label = svg('text', { x: xOf(t), y: yA, class: 'axis-text' });
        label.textContent = (Math.round(t * 10) / 10) + ' s';
        root.appendChild(label);
      }
    }
    const spans = svg('g', {});
    const marks = svg('g', {});
    const cursor = svg('line', { x1: LEFT, x2: LEFT, y1: TOP, y2: H - 4 - axisH, class: 'cursor' });
    root.append(spans, marks, cursor);

    const scroll = document.createElement('div');
    scroll.className = 'tl-scroll';
    scroll.appendChild(root);
    const buttons = document.createElement('div');
    buttons.className = 'buttons';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'Start again';
    el.append(scroll, buttons);

    let t = 0;
    let running = false;
    let last = 0;
    let timer = null;

    // A plain interval, not requestAnimationFrame: it keeps time in background tabs too.
    function step() {
      if (!running) return;
      const ts = performance.now();
      const prev = t;
      t = Math.min(o.duration, t + (ts - last) / 1000);
      last = ts;
      cursor.setAttribute('x1', xOf(t));
      cursor.setAttribute('x2', xOf(t));
      o.onTick(prev, t);
      if (t >= o.duration) stop();
    }
    function stop() {
      running = false;
      clearInterval(timer);
    }
    function drawMark(laneId, time, text, cls) {
      const x = xOf(Math.max(0, Math.min(o.duration, time)));
      const y = laneY[laneId];
      marks.appendChild(svg('circle', { cx: x, cy: y, r: cls === 'tick' ? 3 : 6, class: 'mark ' + (cls || '') }));
      if (text) {
        const label = svg('text', { x, y: y - 11, class: 'mark-text' });
        label.textContent = text;
        marks.appendChild(label);
      }
    }

    const api = {
      buttons,
      now: () => t,
      running: () => running,
      finished: () => t >= o.duration,
      start() {
        if (running || t >= o.duration) return;
        running = true;
        last = performance.now();
        timer = setInterval(step, 40);
      },
      stop,
      reset() {
        stop();
        t = 0;
        marks.replaceChildren();
        spans.replaceChildren();
        cursor.setAttribute('x1', LEFT);
        cursor.setAttribute('x2', LEFT);
        o.onReset();
      },
      mark(laneId, text, cls) { drawMark(laneId, t, text, cls); },
      markAt(laneId, time, text, cls) { drawMark(laneId, time, text, cls); },
      span(laneId, from, to, cls, text) {
        const a = xOf(Math.max(0, Math.min(o.duration, from)));
        const b = xOf(Math.max(0, Math.min(o.duration, to)));
        const y = laneY[laneId];
        const r = svg('rect', { x: Math.min(a, b), y: y - 7, width: Math.max(1, Math.abs(b - a)), height: 14, class: 'span ' + (cls || 'f-mute') });
        if (text) {
          const tip = svg('title', {});
          tip.textContent = text;
          r.appendChild(tip);
        }
        spans.appendChild(r);
        // Label only when it fits inside the bar (about 5.6 px per character at 10 px).
        if (text && Math.abs(b - a) >= text.length * 5.6 + 8) {
          const label = svg('text', { x: Math.min(a, b) + 4, y: y + 4, class: 'span-text' });
          label.textContent = text;
          spans.appendChild(label);
        }
        return r;
      }
    };
    resetBtn.addEventListener('click', () => api.reset());
    // Callers add their buttons first; keep "Start again" last.
    queueMicrotask(() => buttons.appendChild(resetBtn));
    return api;
  }

  function crossed(prev, now, period) {
    return Math.floor(now / period) - Math.floor(prev / period);
  }

  function button(text, onClick, primary) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    if (primary) b.className = 'primary';
    b.addEventListener('click', onClick);
    return b;
  }

  window.Timeline = { create, crossed, button };
})();
