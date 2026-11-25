/*
 * Course map: the single list of lessons. Every page loads this file; it fills in
 *   <p class="kicker" data-kicker></p>   -> "Network Management · Lesson 3 of 58 · about 6 minutes"
 *   <nav class="course" data-nav></nav>  -> previous / all lessons / next
 *   <div data-toc></div>                 -> the full contents list (used by index.html)
 *   <span data-count></span>             -> number of lessons
 * Pages in lessons/ and reference/ link back to the home page.
 * To add or reorder lessons, edit LESSONS (and PARTS for a new part) only.
 */
(function () {
  const PARTS = {
    "The big picture": "Why ECUs need network and mode management, which modules do it, the example ECU, and one request through all of them.",
    "ComM": "Users and channels, the channel state machine, who keeps a bus awake, the NM variants, communication allowed, Dcm, and inhibition.",
    "Network management": "How ECUs agree when a bus may sleep: the CanNm states and timers, the NM PDU, the optional features, NmIf and UdpNm.",
    "Bus state managers": "CanSM and EthSM: how a ComM mode becomes controller, transceiver and link states, and what starts above Ethernet.",
    "EcuM and BswM": "The ECU phases, startup, BswM rules, RUN and POST_RUN, shutdown targets, sleep, the alarm clock and multi-core.",
    "Wakeup": "Wakeup sources, how a wakeup is validated, a CAN wakeup end to end, and passive or active startup.",
    "NM coordinator": "A gateway keeps several buses awake together and shuts them down at the same moment.",
    "Partial networking": "Partial network clusters: the PNC state machine, EIRA and ERA, selective wakeup, the PNC gateway, synchronized shutdown and PN learning.",
    "The flows end to end": "Four complete flows on the example ECU, call by call, with the execution context.",
    "The older way": "EcuM Fixed (4.3.1 and older) and PNC handling through COM signals (up to R20-11).",
    "Configuration": "The main containers and parameters, tied back to the features.",
    "Bits and state machines": "The low-level details for later: NM PDU bits and every state transition."
  };
  const LESSONS = [
    { part: 'The big picture', file: '0001-what-network-and-mode-management-is-for.html', title: 'What network and mode management is for', min: 5 },
    { part: 'The big picture', file: '0002-the-modules-and-their-layers.html', title: 'The modules and their layers', min: 6 },
    { part: 'The big picture', file: '0003-the-example-ecu.html', title: 'The example ECU: a body gateway', min: 5 },
    { part: 'The big picture', file: '0004-one-request-from-top-to-bottom.html', title: 'One request from top to bottom', min: 6 },
    { part: 'ComM', file: '0005-comm-users-and-channels.html', title: 'ComM users and channels', min: 6 },
    { part: 'ComM', file: '0006-the-comm-channel-state-machine.html', title: 'The ComM channel state machine', min: 8 },
    { part: 'ComM', file: '0007-network-requested-and-ready-sleep.html', title: 'Network requested and ready sleep', min: 6 },
    { part: 'ComM', file: '0008-nm-variants-per-channel.html', title: 'NM variants per channel', min: 6 },
    { part: 'ComM', file: '0009-communication-allowed-and-bswm.html', title: 'Communication allowed, and BswM', min: 5 },
    { part: 'ComM', file: '0010-dcm-keeps-the-channel-awake.html', title: 'Dcm keeps the channel awake', min: 5 },
    { part: 'ComM', file: '0011-communication-inhibition.html', title: 'Communication inhibition', min: 7 },
    { part: 'Network management', file: '0012-the-coordination-algorithm.html', title: 'The coordination algorithm', min: 5 },
    { part: 'Network management', file: '0013-the-cannm-states.html', title: 'The CanNm states', min: 8 },
    { part: 'Network management', file: '0014-the-nm-timers.html', title: 'The NM timers', min: 7 },
    { part: 'Network management', file: '0015-the-nm-pdu.html', title: 'The NM PDU', min: 5 },
    { part: 'Network management', file: '0016-repeat-message-request-and-node-detection.html', title: 'Repeat message request and node detection', min: 6 },
    { part: 'Network management', file: '0017-passive-mode-communication-control-bus-load-reduction.html', title: 'Passive mode, communication control, bus load reduction', min: 7 },
    { part: 'Network management', file: '0018-remote-sleep-car-wakeup-and-user-data.html', title: 'Remote sleep, car wakeup and user data', min: 7 },
    { part: 'Network management', file: '0019-nmif-the-dispatcher.html', title: 'NmIf: between ComM and the bus NMs', min: 5 },
    { part: 'Network management', file: '0020-udpnm-nm-on-ethernet.html', title: 'UdpNm: NM on Ethernet', min: 6 },
    { part: 'Bus state managers', file: '0021-cansm-the-state-machine.html', title: 'CanSM: one state machine per network', min: 7 },
    { part: 'Bus state managers', file: '0022-cansm-bus-off-recovery.html', title: 'CanSM: bus-off recovery', min: 6 },
    { part: 'Bus state managers', file: '0023-ethsm-from-offline-to-online.html', title: 'EthSM: from OFFLINE to ONLINE', min: 7 },
    { part: 'Bus state managers', file: '0024-above-ethsm-when-the-link-comes-up.html', title: 'Above EthSM: when the link comes up', min: 5 },
    { part: 'EcuM and BswM', file: '0025-the-ecum-phases.html', title: 'The EcuM phases', min: 5 },
    { part: 'EcuM and BswM', file: '0026-startup.html', title: 'Startup: from reset to BswM', min: 7 },
    { part: 'EcuM and BswM', file: '0027-bswm-as-the-glue.html', title: 'BswM as the glue', min: 6 },
    { part: 'EcuM and BswM', file: '0028-run-and-post-run-requests.html', title: 'RUN and POST_RUN requests', min: 6 },
    { part: 'EcuM and BswM', file: '0029-shutdown-targets.html', title: 'Shutdown targets', min: 6 },
    { part: 'EcuM and BswM', file: '0030-sleep-halt-and-poll.html', title: 'Sleep: HALT and POLL', min: 6 },
    { part: 'EcuM and BswM', file: '0031-the-alarm-clock.html', title: 'The alarm clock', min: 5 },
    { part: 'EcuM and BswM', file: '0032-multi-core-and-the-bootloader.html', title: 'Multi-core and the bootloader', min: 5 },
    { part: 'Wakeup', file: '0033-wakeup-sources-and-their-states.html', title: 'Wakeup sources and their states', min: 6 },
    { part: 'Wakeup', file: '0034-wakeup-validation.html', title: 'Wakeup validation', min: 8 },
    { part: 'Wakeup', file: '0035-can-wakeup-end-to-end.html', title: 'CAN wakeup end to end', min: 7 },
    { part: 'Wakeup', file: '0036-passive-and-active-startup.html', title: 'Passive and active startup', min: 5 },
    { part: 'NM coordinator', file: '0037-coordinating-several-buses.html', title: 'Coordinating several buses', min: 6 },
    { part: 'NM coordinator', file: '0038-coordinated-shutdown-and-shutdown-timers.html', title: 'Coordinated shutdown and the shutdown timers', min: 8 },
    { part: 'NM coordinator', file: '0039-nested-sub-buses-and-aborting-a-shutdown.html', title: 'Nested sub-buses and aborting a shutdown', min: 7 },
    { part: 'Partial networking', file: '0040-why-partial-networking.html', title: 'Why partial networking', min: 6 },
    { part: 'Partial networking', file: '0041-the-comm-pnc-state-machine.html', title: 'The ComM PNC state machine', min: 7 },
    { part: 'Partial networking', file: '0042-eira-and-era.html', title: 'EIRA and ERA', min: 8 },
    { part: 'Partial networking', file: '0043-selective-wakeup-in-the-transceiver.html', title: 'Selective wakeup in the transceiver', min: 6 },
    { part: 'Partial networking', file: '0044-the-pnc-gateway.html', title: 'The PNC gateway', min: 8 },
    { part: 'Partial networking', file: '0045-synchronized-pnc-shutdown.html', title: 'Synchronized PNC shutdown', min: 7 },
    { part: 'Partial networking', file: '0046-pn-learning-and-dynamic-mapping.html', title: 'PN learning and dynamic PNC-to-channel mapping', min: 6 },
    { part: 'The flows end to end', file: '0047-power-on-to-full-communication.html', title: 'Power on to full communication', min: 8 },
    { part: 'The flows end to end', file: '0048-woken-by-another-ecu.html', title: 'Woken by another ECU', min: 8 },
    { part: 'The flows end to end', file: '0049-going-to-sleep.html', title: 'Going to sleep', min: 8 },
    { part: 'The flows end to end', file: '0050-a-pnc-request-across-the-gateway.html', title: 'A PNC request across the gateway', min: 8 },
    { part: 'The older way', file: '0051-ecum-fixed.html', title: 'EcuM Fixed', min: 8 },
    { part: 'The older way', file: '0052-ecum-fixed-and-flex-side-by-side.html', title: 'EcuM Fixed and EcuM Flex side by side', min: 6 },
    { part: 'The older way', file: '0053-pnc-through-com-signals.html', title: 'PNC through COM signals', min: 7 },
    { part: 'The older way', file: '0054-reading-an-older-pnc-configuration.html', title: 'Reading an older PNC configuration', min: 6 },
    { part: 'Configuration', file: '0055-configuration-map-comm-and-nm.html', title: 'Configuration map: ComM and NM', min: 9 },
    { part: 'Configuration', file: '0056-configuration-map-state-managers-and-ecum.html', title: 'Configuration map: CanSM, EthSM and EcuM', min: 9 },
    { part: 'Bits and state machines', file: '0057-the-nm-pdu-bit-by-bit.html', title: 'The NM PDU bit by bit', min: 6 },
    { part: 'Bits and state machines', file: '0058-the-full-state-machines.html', title: 'The full ComM and CanSM state machines', min: 9 }
  ];

  const here = location.pathname.split('/').pop();
  const inLessons = /\/lessons\/[^/]*$/.test(location.pathname);
  const inSubfolder = /\/(lessons|reference|config)\/[^/]*$/.test(location.pathname);
  const root = inSubfolder ? '../' : '';
  const idx = inLessons ? LESSONS.findIndex((l) => l.file === here) : -1;
  const href = (l) => root + 'lessons/' + l.file;
  const link = (l, text) => '<a href="' + href(l) + '">' + text + '</a>';

  document.querySelectorAll('[data-kicker]').forEach((el) => {
    const bits = ['Network Management'];
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
