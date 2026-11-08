/*
 * Sequence: a sequence diagram (one lifeline per module) that you click through call by call.
 *
 *   Sequence.create(el, {
 *     lanes: ['SWC', 'RTE', 'COM', ...],                 // lifeline labels, left to right
 *     steps: [
 *       { ctx: 'SWC runnable (task)',                     // optional: a new execution context starts here
 *         from: 'SWC', to: 'RTE', call: 'Rte_Write()',    // a call (solid arrow)
 *         text: 'What happens and why.' },
 *       { from: 'COM', to: 'RTE', call: 'E_OK', ret: true, text: '...' },   // a return (dashed arrow)
 *       { from: 'COM', note: 'packs the value', text: '...' }               // work inside one module
 *     ]
 *   });
 *   returns { set({ lanes, steps }) } to swap the story.
 *
 * Steps already passed stay visible, the current one is highlighted, later ones are hidden
 * (they all show when printing). Colours come from the CSS variables in course.css.
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 760;          // viewBox width
  const HEAD = 34;        // lane header height
  const ROW = 30;         // height of one step
  const BAND = 24;        // height of a context band
  const CH = 6.1;         // approximate width of one character of the call labels

  function svg(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach((k) => e.setAttribute(k, attrs[k]));
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function create(el, opts) {
    let o = Object.assign({}, opts);
    el.classList.add('seq');

    const head = document.createElement('div');
    head.className = 'seq-head';
    const text = document.createElement('p');
    text.className = 'step-text';
    text.setAttribute('aria-live', 'polite');
    const bar = document.createElement('div');
    bar.className = 'controls';
    bar.style.margin = '0';
    const back = document.createElement('button');
    back.type = 'button';
    back.textContent = '← Back';
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'primary';
    const all = document.createElement('button');
    all.type = 'button';
    all.textContent = 'Show the whole sequence';
    const count = document.createElement('span');
    count.className = 'legend';
    count.style.margin = '0';
    bar.append(back, next, all, count);
    head.append(text, bar);

    const wrap = document.createElement('div');
    wrap.className = 'seq-wrap';
    el.append(head, wrap);

    let i = 0;
    let groups = [];

    function build() {
      const lanes = o.lanes;
      const lw = W / lanes.length;
      const x = (name) => {
        const k = lanes.indexOf(name);
        if (k < 0) throw new Error('Sequence: unknown lane ' + name);
        return lw * k + lw / 2;
      };
      // Vertical layout: a band before every step that opens a new context.
      let y = HEAD + 8;
      const rows = o.steps.map((s) => {
        const r = {};
        if (s.ctx) { r.band = y; y += BAND; }
        r.y = y + ROW * 0.62;
        y += ROW;
        return r;
      });
      const H = y + 10;

      const root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Sequence diagram' });
      // Lane headers and lifelines.
      lanes.forEach((name, k) => {
        const cx = lw * k + lw / 2;
        root.appendChild(svg('line', { x1: cx, y1: HEAD, x2: cx, y2: H - 4, class: 'life' }));
        root.appendChild(svg('rect', { x: lw * k + 3, y: 2, width: lw - 6, height: HEAD - 8, class: name === 'COM' ? 'lane com' : 'lane' }));
        root.appendChild(svg('text', { x: cx, y: HEAD / 2 + 2, class: 'lane-text' }, name));
      });

      groups = o.steps.map((s, k) => {
        const g = svg('g', { class: 'step' });
        const r = rows[k];
        if (s.ctx) {
          g.appendChild(svg('line', { x1: 0, y1: r.band + 3, x2: W, y2: r.band + 3, class: 'band-line' }));
          const label = s.ctx;
          const bw = label.length * 5.6 + 14;
          g.appendChild(svg('rect', { x: 0, y: r.band + 6, width: bw, height: 15, class: 'band' }));
          g.appendChild(svg('text', { x: 7, y: r.band + 17, class: 'band-text' }, label));
        }
        const x1 = x(s.from);
        if (s.note) {
          const tw = s.note.length * 5.8 + 12;
          let bx = x1 - 4;
          if (bx + tw > W - 2) bx = W - 2 - tw;
          g.appendChild(svg('rect', { x: bx, y: r.y - 11, width: tw, height: 16, class: 'note-box' }));
          g.appendChild(svg('text', { x: bx + 6, y: r.y + 1, class: 'note-text' }, s.note));
        } else {
          const x2 = x(s.to);
          const dir = x2 > x1 ? 1 : -1;
          const ay = r.y + 4;
          g.appendChild(svg('line', { x1: x1, y1: ay, x2: x2 - dir * 6, y2: ay, class: s.ret ? 'msg ret' : 'msg' }));
          g.appendChild(svg('polygon', { points: [x2, ay, x2 - dir * 7, ay - 4, x2 - dir * 7, ay + 4].join(' '), class: 'head' }));
          const tw = s.call.length * CH;
          let tx = (x1 + x2) / 2 - tw / 2;
          tx = Math.max(2, Math.min(W - tw - 2, tx));
          g.appendChild(svg('text', { x: tx, y: ay - 5, class: s.ret ? 'call ret' : 'call' }, s.call));
        }
        root.appendChild(g);
        return g;
      });

      wrap.replaceChildren(root);
    }

    function render(scroll) {
      const s = o.steps[i];
      groups.forEach((g, k) => {
        g.classList.toggle('now', k === i);
        g.classList.toggle('future', k > i);
      });
      text.innerHTML = s.text;
      back.disabled = i === 0;
      all.disabled = i === o.steps.length - 1;
      next.textContent = i === o.steps.length - 1 ? 'Start over' : 'Next →';
      count.textContent = 'Step ' + (i + 1) + ' of ' + o.steps.length;
      if (scroll) {
        const r = groups[i].getBoundingClientRect();
        const top = head.getBoundingClientRect().bottom;
        if (r.bottom > window.innerHeight - 16) window.scrollBy(0, r.bottom - window.innerHeight + 48);
        else if (r.top < top + 8) window.scrollBy(0, r.top - top - 24);
      }
    }
    back.addEventListener('click', () => { if (i > 0) { i--; render(true); } });
    next.addEventListener('click', () => { i = i === o.steps.length - 1 ? 0 : i + 1; render(true); });
    all.addEventListener('click', () => { i = o.steps.length - 1; render(false); });
    build();
    render(false);
    return {
      set(changes) {
        o = Object.assign(o, changes);
        i = 0;
        build();
        render(false);
      }
    };
  }
  window.Sequence = { create };
})();
