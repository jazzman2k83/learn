/*
 * Interactive sequence diagram: lifelines for a few actors, and a story that reveals the
 * messages one step at a time.
 *
 *   const s = Seq.create(el, {
 *     actors: [{ id: 'c', label: 'Client ECU', sub: 'uses the service' }, { id: 's', label: 'Server ECU' }],
 *     steps: [
 *       { text: 'The client calls the method.',
 *         rows: [ { from: 'c', to: 's', label: 'Request', kind: 'req' } ] },
 *       { text: 'The answer is lost on the way.',
 *         rows: [ { from: 's', to: 'c', label: 'Response', kind: 'res', lost: true },
 *                 { at: 'c', note: 'timer runs out' } ] }
 *     ]
 *   });
 *   s.set({ steps })   // swap the story (e.g. from a variant chooser), starts at step 1
 *   s.buttons          // the button row, to append extra buttons
 *
 * Row kinds:
 *   message  { from, to, label, kind: 'ev'|'req'|'res'|'err'|'sd'|'mute', lost?, dash? }
 *   note     { at: actorId, note }              a small box on one lifeline
 *   span     { span: [actorA, actorB], note }   a box across several lifelines
 * Colours come from course.css (k-* classes), so both themes and print work.
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const KINDS = ['ev', 'req', 'res', 'err', 'sd'];
  let counter = 0;

  function el(tag, attrs, text) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  function create(host, opts) {
    const id = 'seq' + (++counter);
    let o = Object.assign({ width: 640, rowH: 34 }, opts);
    host.classList.add('seq');
    const scroll = document.createElement('div');
    scroll.className = 'seq-scroll';
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
    const count = document.createElement('span');
    count.className = 'legend';
    count.style.margin = '0';
    bar.append(back, next, count);
    host.append(scroll, text, bar);

    let i = 0;
    let groups = [];
    let bands = [];

    function x(actorId) {
      const n = o.actors.length;
      const k = o.actors.findIndex((a) => a.id === actorId);
      const left = 80;
      const right = o.width - 80;
      return n === 1 ? o.width / 2 : left + (k * (right - left)) / (n - 1);
    }

    function build() {
      const top = 54;
      const rows = o.steps.reduce((sum, s) => sum + s.rows.length, 0);
      const height = top + rows * o.rowH + 18;
      const svg = el('svg', { viewBox: '0 0 ' + o.width + ' ' + height, role: 'img', 'aria-label': 'Sequence diagram' });
      const defs = el('defs', {});
      ['', ...KINDS.map((k) => '-' + k), '-mute'].forEach((suffix) => {
        const m = el('marker', { id: id + '-ah' + suffix, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
        m.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'ah' + (suffix || '') }));
        defs.appendChild(m);
      });
      svg.appendChild(defs);

      const bandLayer = el('g', {});
      svg.appendChild(bandLayer);
      o.actors.forEach((a) => {
        const ax = x(a.id);
        svg.appendChild(el('line', { x1: ax, x2: ax, y1: 44, y2: height - 6, class: 'd-life' }));
        svg.appendChild(el('rect', { x: ax - 70, y: 4, width: 140, height: 40, class: 'actor-box' }));
        svg.appendChild(el('text', { x: ax, y: a.sub ? 21 : 29, class: 'd-tb d-c' }, a.label));
        if (a.sub) svg.appendChild(el('text', { x: ax, y: 36, class: 'd-s d-c' }, a.sub));
      });

      groups = [];
      bands = [];
      let y = top;
      o.steps.forEach((step) => {
        const g = el('g', { class: 'row' });
        const band = el('rect', { x: 2, y: y - 4, width: o.width - 4, height: step.rows.length * o.rowH, fill: 'var(--head)', opacity: 0 });
        bandLayer.appendChild(band);
        bands.push(band);
        step.rows.forEach((r) => {
          const cy = y + o.rowH / 2 + 4;
          if (r.note != null && r.at) {
            const w = Math.min(190, 16 + r.note.length * 6.1);
            const ax = x(r.at);
            g.appendChild(el('rect', { x: ax - w / 2, y: cy - 12, width: w, height: 22, class: 'd-note' }));
            g.appendChild(el('text', { x: ax, y: cy + 3, class: 'd-t d-c' }, r.note));
          } else if (r.note != null && r.span) {
            const xa = Math.min(x(r.span[0]), x(r.span[1])) - 40;
            const xb = Math.max(x(r.span[0]), x(r.span[1])) + 40;
            g.appendChild(el('rect', { x: xa, y: cy - 12, width: xb - xa, height: 22, class: 'd-note' }));
            g.appendChild(el('text', { x: (xa + xb) / 2, y: cy + 3, class: 'd-t d-c' }, r.note));
          } else {
            const x1 = x(r.from);
            const x2 = x(r.to);
            const dir = x2 > x1 ? 1 : -1;
            const kind = KINDS.includes(r.kind) ? r.kind : 'mute';
            const end = r.lost ? x1 + (x2 - x1) * 0.62 : x2 - dir * 2;
            const line = el('line', {
              x1: x1 + dir * 2, y1: cy + 4, x2: end, y2: cy + 4,
              class: kind === 'mute' ? 'd-ln mute' : 'k-' + kind,
              'marker-end': r.lost ? '' : 'url(#' + id + '-ah-' + kind + ')'
            });
            if (r.dash) line.setAttribute('stroke-dasharray', '6 4');
            g.appendChild(line);
            if (r.lost) {
              g.appendChild(el('path', { d: 'M' + (end - 6) + ',' + (cy - 2) + ' l12,12 m0,-12 l-12,12', class: 'd-cross' }));
            }
            const mid = r.lost ? (x1 + end) / 2 : (x1 + x2) / 2;
            g.appendChild(el('text', { x: mid, y: cy - 3, class: 'd-t d-c' }, r.label || ''));
          }
          y += o.rowH;
        });
        svg.appendChild(g);
        groups.push(g);
      });
      scroll.replaceChildren(svg);
    }

    function render() {
      groups.forEach((g, k) => {
        g.classList.toggle('future', k > i);
        bands[k].setAttribute('opacity', k === i ? 1 : 0);
      });
      text.innerHTML = o.steps[i].text;
      back.disabled = i === 0;
      next.textContent = i === o.steps.length - 1 ? 'Start over' : 'Next →';
      count.textContent = 'Step ' + (i + 1) + ' of ' + o.steps.length;
    }

    back.addEventListener('click', () => { if (i > 0) { i--; render(); } });
    next.addEventListener('click', () => { i = i === o.steps.length - 1 ? 0 : i + 1; render(); });
    build();
    render();

    return {
      buttons: bar,
      set(changes) {
        o = Object.assign(o, changes);
        i = 0;
        build();
        render();
      },
      step: () => i
    };
  }

  window.Seq = { create };
})();
