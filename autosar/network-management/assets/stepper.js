/*
 * Stepper: a row (or stack) of boxes and a click-through story that lights them up.
 *
 *   Stepper.create(el, {
 *     stages: ['Application', 'COM', 'Bus'],     // box labels (HTML allowed), or { html, cls }
 *                                                // where cls is a module colour such as 'm-soad'
 *     vertical: false,                           // true = stacked layers, top to bottom
 *     steps: [{ at: [0], text: 'The application writes a value.' }, ...],  // at = boxes to light up
 *     onStep: (i, step) => {}                    // optional: called after each step is shown
 *   });
 *   returns { set({ stages, steps }) } to swap the story.
 */
(function () {
  function create(el, opts) {
    let o = Object.assign({ vertical: false }, opts);
    const diagram = document.createElement('div');
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
    el.append(diagram, text, bar);
    let i = 0;
    let boxes = [];

    function build() {
      diagram.className = o.vertical ? 'stack' : 'flow';
      diagram.replaceChildren();
      boxes = o.stages.map((label, k) => {
        if (k > 0 && !o.vertical) {
          const a = document.createElement('div');
          a.className = 'arrow';
          a.textContent = '→';
          diagram.appendChild(a);
        }
        const b = document.createElement('div');
        const stage = typeof label === 'string' ? { html: label } : label;
        b.className = (o.vertical ? 'layer' : 'box') + (stage.cls ? ' ' + stage.cls : '');
        b.innerHTML = stage.html;
        diagram.appendChild(b);
        return b;
      });
    }
    function render() {
      const s = o.steps[i];
      boxes.forEach((b, k) => b.classList.toggle(o.vertical ? 'active' : 'main', s.at.includes(k)));
      text.innerHTML = s.text;
      back.disabled = i === 0;
      next.textContent = i === o.steps.length - 1 ? 'Start over' : 'Next →';
      count.textContent = 'Step ' + (i + 1) + ' of ' + o.steps.length;
      if (o.onStep) o.onStep(i, s);
    }
    back.addEventListener('click', () => { if (i > 0) { i--; render(); } });
    next.addEventListener('click', () => { i = i === o.steps.length - 1 ? 0 : i + 1; render(); });
    build();
    render();
    return {
      set(changes) {
        o = Object.assign(o, changes);
        i = 0;
        build();
        render();
      }
    };
  }
  window.Stepper = { create };
})();
