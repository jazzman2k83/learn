/*
 * Course map: the single list of lessons. Every page loads this file; it fills in
 *   <p class="kicker" data-kicker="about 8 minutes"></p>   -> "AUTOSAR COM · Lesson 3 of 17 · about 8 minutes"
 *   <nav class="course" data-nav></nav>                     -> previous / all lessons / next
 *   <div data-toc></div>                                    -> the full contents list (used by index.html)
 * Pages in lessons/, reference/ and config/ get the links back to the home page.
 * To add or reorder lessons, edit LESSONS only.
 */
(function () {
  const LESSONS = [
    { part: 'The big picture', file: '0001-what-com-does.html', title: 'What COM does' },
    { part: 'The big picture', file: '0002-transfer-property-transmission-mode-signal-processing.html', title: 'Transfer property, transmission mode and signal processing' },
    { part: 'Transmission', file: '0003-repetitions-and-the-minimum-delay-time.html', title: 'Repetitions and the minimum delay time' },
    { part: 'Transmission', file: '0004-transmission-mode-selection.html', title: 'Transmission mode selection' },
    { part: 'Reception', file: '0005-init-values-and-update-bits.html', title: 'Init values and update-bits' },
    { part: 'Reception', file: '0006-deadline-monitoring.html', title: 'Deadline monitoring' },
    { part: 'Reception', file: '0007-data-invalid-values.html', title: 'Data invalid values' },
    { part: 'Reception', file: '0008-filters.html', title: 'Filters' },
    { part: 'Reception', file: '0009-notifications.html', title: 'Notifications' },
    { part: 'Signal groups, I-PDU groups and the gateway', file: '0010-signal-groups.html', title: 'Signal groups' },
    { part: 'Signal groups, I-PDU groups and the gateway', file: '0011-i-pdu-groups.html', title: 'I-PDU groups' },
    { part: 'Signal groups, I-PDU groups and the gateway', file: '0012-signal-gateway.html', title: 'The signal gateway' },
    { part: 'Signal groups, I-PDU groups and the gateway', file: '0013-large-i-pdus-and-dynamic-length-signals.html', title: 'Large I-PDUs and dynamic length signals' },
    { part: 'Below COM', file: '0014-pdur-and-the-lower-layers.html', title: 'PduR and the lower layers' },
    { part: 'Configuration and bits', file: '0015-configuration-map.html', title: 'The configuration map' },
    { part: 'Configuration and bits', file: '0016-signal-packing.html', title: 'Signal packing' },
    { part: 'Configuration and bits', file: '0017-signal-types-and-sign-extension.html', title: 'Signal types and sign extension' }
  ];

  const here = location.pathname.split('/').pop();
  const inLessons = /\/lessons\/[^/]*$/.test(location.pathname);
  const inSubfolder = /\/(lessons|reference|config)\/[^/]*$/.test(location.pathname);
  const root = inSubfolder ? '../' : '';
  const idx = inLessons ? LESSONS.findIndex((l) => l.file === here) : -1;
  const href = (l) => root + 'lessons/' + l.file;
  const link = (l, text) => '<a href="' + href(l) + '">' + text + '</a>';

  document.querySelectorAll('[data-kicker]').forEach((el) => {
    const bits = ['AUTOSAR COM'];
    if (idx >= 0) bits.push('Lesson ' + (idx + 1) + ' of ' + LESSONS.length);
    if (el.dataset.kicker) bits.push(el.dataset.kicker);
    el.textContent = bits.join(' · ');
  });

  document.querySelectorAll('[data-nav]').forEach((el) => {
    const prev = idx > 0 ? LESSONS[idx - 1] : null;
    const next = idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null;
    el.innerHTML =
      '<span>' + (prev ? link(prev, '← ' + prev.title) : '') + '</span>' +
      '<span><a href="' + root + 'index.html">All lessons</a> · <a href="' + root + 'reference/com-at-a-glance.html">COM at a glance</a> · <a href="' + root + 'reference/words.html">Glossary</a> · <a href="' + root + 'config/index.html">Configuration help</a></span>' +
      '<span>' + (next ? link(next, next.title + ' →') : (idx >= 0 ? 'End of the course' : '')) + '</span>';
  });

  document.querySelectorAll('[data-toc]').forEach((el) => {
    let html = '';
    let part = null;
    LESSONS.forEach((l, i) => {
      if (l.part !== part) {
        if (part !== null) html += '</ol>';
        part = l.part;
        html += '<h2>' + part + '</h2><ol class="toc" start="' + (i + 1) + '">';
      }
      html += '<li>' + link(l, l.title) + '</li>';
    });
    el.innerHTML = html + '</ol>';
  });

  window.Course = { LESSONS };
})();
