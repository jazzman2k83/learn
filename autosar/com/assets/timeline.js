/*
 * Running timeline: a clock sweeps left to right over a few lanes and you drop marks on it.
 *
 *   const tl = Timeline.create(el, {
 *     lanes: [{ id: 'bus', label: 'On the bus' }],
 *     duration: 12,                       // seconds for one sweep
 *     onTick: (prev, now) => {},          // called every frame while running
 *     onReset: () => {}
 *   });
 *   tl.mark('bus', 'text', 'bus');        // drop a mark at the current time (css class optional)
 *   tl.start(); tl.reset(); tl.now();
 *   tl.buttons                            // a <div> to append your own buttons to
 *
 * Helper: Timeline.crossed(prev, now, period) -> how many multiples of period lie in (prev, now].
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 700;
  const LEFT = 150;
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
    const H = TOP + o.lanes.length * LANE_H + 6;
    const root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Timeline' });
    const laneY = {};
    o.lanes.forEach((lane, i) => {
      const y = TOP + i * LANE_H + 30;
      laneY[lane.id] = y;
      const text = svg('text', { x: 0, y: y + 4, class: 'lane-label' });
      text.textContent = lane.label;
      root.append(text, svg('line', { x1: LEFT, x2: W - RIGHT, y1: y, y2: y, class: 'lane-line' }));
    });
    const marks = svg('g', {});
    const cursor = svg('line', { x1: LEFT, x2: LEFT, y1: TOP, y2: H - 4, class: 'cursor' });
    root.append(marks, cursor);

    const buttons = document.createElement('div');
    buttons.className = 'buttons';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'Start again';
    el.append(root, buttons);

    let t = 0;
    let running = false;
    let last = 0;
    let timer = null;
    const xOf = (time) => LEFT + (time / o.duration) * (W - LEFT - RIGHT);

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
      reset() {
        stop();
        t = 0;
        marks.replaceChildren();
        cursor.setAttribute('x1', LEFT);
        cursor.setAttribute('x2', LEFT);
        o.onReset();
      },
      mark(laneId, text, cls) {
        const x = xOf(t);
        const y = laneY[laneId];
        marks.appendChild(svg('circle', { cx: x, cy: y, r: cls === 'tick' ? 3 : 6, class: 'mark ' + (cls || '') }));
        if (text) {
          const label = svg('text', { x, y: y - 11, class: 'mark-text' });
          label.textContent = text;
          marks.appendChild(label);
        }
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
