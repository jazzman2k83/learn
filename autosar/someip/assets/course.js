/*
 * Course map: the single list of lessons. Every page loads this file; it fills in
 *   <p class="kicker" data-kicker></p>   -> "SOME/IP · Lesson 3 of 32 · about 6 minutes"
 *   <nav class="course" data-nav></nav>  -> previous / all lessons / next
 *   <div data-toc></div>                 -> the full contents list (used by index.html)
 *   <span data-count></span>             -> number of lessons
 * Pages in lessons/ and reference/ link back to the home page.
 * To add or reorder lessons, edit LESSONS (and PARTS for a new part) only.
 */
(function () {
  const PARTS = {
    'The big picture': 'What SOME/IP is for, what a service is made of, and which AUTOSAR modules take part.',
    'Events, methods and fields': 'The SOME/IP header, then events, methods with and without a response, fields, return codes, and the server and client roles.',
    'Service Discovery': 'OfferService and the TTL, the start phases, FindService, SubscribeEventgroup, unicast or multicast events, reboot detection, and what Sd reports to BswM.',
    'The data path between the wire and the SWC': 'One message through every module in both directions, then socket connections, routing groups, UDP or TCP, SOME/IP TP, and COM or LdCom.',
    'Configuration': 'Where each feature is set: the system description first, then the containers of each module.',
    'Bytes, bits and state machines': 'The low-level details for later: the header, serialization, the SD message, the Sd state machines, the SOME/IP TP header.'
  };
  const LESSONS = [
    { part: 'The big picture', file: '0001-what-someip-is-for.html', title: 'What SOME/IP is for', min: 5 },
    { part: 'The big picture', file: '0002-services-events-methods-fields.html', title: 'Services: events, methods and fields', min: 6 },
    { part: 'The big picture', file: '0003-the-modules-on-the-data-path.html', title: 'The modules on the data path', min: 6 },
    { part: 'Events, methods and fields', file: '0004-the-someip-header.html', title: 'The SOME/IP header', min: 5 },
    { part: 'Events, methods and fields', file: '0005-events.html', title: 'Events', min: 6 },
    { part: 'Events, methods and fields', file: '0006-request-response.html', title: 'Methods: request and response', min: 7 },
    { part: 'Events, methods and fields', file: '0007-fire-and-forget.html', title: 'Methods: fire&forget', min: 4 },
    { part: 'Events, methods and fields', file: '0008-fields.html', title: 'Fields: getter, setter and notifier', min: 6 },
    { part: 'Events, methods and fields', file: '0009-return-codes-and-errors.html', title: 'Return codes and errors', min: 6 },
    { part: 'Events, methods and fields', file: '0010-server-and-client.html', title: 'Server and client', min: 5 },
    { part: 'Service Discovery', file: '0011-offerservice-and-the-ttl.html', title: 'OfferService and the TTL', min: 6 },
    { part: 'Service Discovery', file: '0012-the-sd-phases.html', title: 'Initial Wait, Repetition and Main Phase', min: 7 },
    { part: 'Service Discovery', file: '0013-findservice.html', title: 'FindService', min: 6 },
    { part: 'Service Discovery', file: '0014-subscribing-to-an-eventgroup.html', title: 'Subscribing to an eventgroup', min: 7 },
    { part: 'Service Discovery', file: '0015-unicast-or-multicast-events.html', title: 'Unicast or multicast events', min: 5 },
    { part: 'Service Discovery', file: '0016-reboot-detection.html', title: 'Reboot detection', min: 6 },
    { part: 'Service Discovery', file: '0017-sd-and-bswm.html', title: 'Sd and BswM: requested and available', min: 6 },
    { part: 'The data path between the wire and the SWC', file: '0018-transmission-down-the-stack.html', title: 'Transmission: from the SWC to the wire', min: 7 },
    { part: 'The data path between the wire and the SWC', file: '0019-reception-up-the-stack.html', title: 'Reception: from the wire to the SWC', min: 7 },
    { part: 'The data path between the wire and the SWC', file: '0020-who-writes-the-header.html', title: 'Who writes which header field', min: 5 },
    { part: 'The data path between the wire and the SWC', file: '0021-socket-connections-and-routing-groups.html', title: 'Socket connections and routing groups', min: 7 },
    { part: 'The data path between the wire and the SWC', file: '0022-udp-or-tcp.html', title: 'UDP or TCP', min: 5 },
    { part: 'The data path between the wire and the SWC', file: '0023-someip-tp-segmentation.html', title: 'SOME/IP TP: segmentation', min: 6 },
    { part: 'The data path between the wire and the SWC', file: '0024-com-ldcom-and-the-chain.html', title: 'COM, LdCom and the transformer chain', min: 6 },
    { part: 'Configuration', file: '0025-where-things-are-configured.html', title: 'Where things are configured', min: 6 },
    { part: 'Configuration', file: '0026-the-sd-configuration.html', title: 'The Sd configuration map', min: 8 },
    { part: 'Configuration', file: '0027-the-data-path-configuration.html', title: 'The data path configuration map', min: 8 },
    { part: 'Bytes, bits and state machines', file: '0028-the-header-byte-by-byte.html', title: 'The SOME/IP header, byte by byte', min: 6 },
    { part: 'Bytes, bits and state machines', file: '0029-serialization.html', title: 'Serialization: how data is laid out', min: 8 },
    { part: 'Bytes, bits and state machines', file: '0030-the-sd-message-byte-by-byte.html', title: 'The SD message, byte by byte', min: 8 },
    { part: 'Bytes, bits and state machines', file: '0031-the-sd-state-machines.html', title: 'The Sd state machines', min: 8 },
    { part: 'Bytes, bits and state machines', file: '0032-the-someip-tp-header.html', title: 'The SOME/IP TP header', min: 5 }
  ];

  const here = location.pathname.split('/').pop();
  const inLessons = /\/lessons\/[^/]*$/.test(location.pathname);
  const inSubfolder = /\/(lessons|reference)\/[^/]*$/.test(location.pathname);
  const root = inSubfolder ? '../' : '';
  const idx = inLessons ? LESSONS.findIndex((l) => l.file === here) : -1;
  const href = (l) => root + 'lessons/' + l.file;
  const link = (l, text) => '<a href="' + href(l) + '">' + text + '</a>';

  document.querySelectorAll('[data-kicker]').forEach((el) => {
    const bits = ['SOME/IP'];
    if (idx >= 0) {
      bits.push('Lesson ' + (idx + 1) + ' of ' + LESSONS.length);
      bits.push('about ' + LESSONS[idx].min + ' minutes');
    } else if (el.dataset.kicker) {
      bits.push(el.dataset.kicker);
    }
    el.textContent = bits.join(' · ');
  });

  document.querySelectorAll('[data-nav]').forEach((el) => {
    const prev = idx > 0 ? LESSONS[idx - 1] : null;
    const next = idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null;
    el.innerHTML =
      '<span>' + (prev ? link(prev, '← ' + prev.title) : (idx === 0 ? '<a href="' + root + 'index.html">← Contents</a>' : '')) + '</span>' +
      '<span><a href="' + root + 'index.html">All lessons</a> · <a href="' + root + 'reference/at-a-glance.html">At a glance</a> · <a href="' + root + 'reference/words.html">Glossary</a></span>' +
      '<span>' + (next ? link(next, next.title + ' →') : (idx >= 0 ? 'End of the course · <a href="' + root + 'reference/at-a-glance.html">Sheets</a>' : '')) + '</span>';
  });

  document.querySelectorAll('[data-toc]').forEach((el) => {
    let html = '';
    let part = null;
    let n = 0;
    LESSONS.forEach((l, i) => {
      if (l.part !== part) {
        if (part !== null) html += '</ol>';
        part = l.part;
        n++;
        html += '<h2>Part ' + n + '. ' + part + '</h2>';
        if (PARTS[part]) html += '<p class="part-intro">' + PARTS[part] + '</p>';
        html += '<ol class="toc" start="' + (i + 1) + '">';
      }
      html += '<li>' + link(l, l.title) + ' <span class="min">· ' + l.min + ' min</span></li>';
    });
    el.innerHTML = html + '</ol>';
  });

  document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = String(LESSONS.length); });

  window.Course = { LESSONS, PARTS };
})();
