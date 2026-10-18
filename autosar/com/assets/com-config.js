/*
 * COM configuration model: turns plain answers into configuration containers, and containers
 * into a settings table, an ARXML sketch and a list of rule checks.
 * Needs pdu-grid.js (for the bit layout). Parameter names, ranges and rules follow the
 * AUTOSAR COM specification R25-11, chapter 10.
 *
 *   ComConfig.defaults(dir)            -> answers for 'tx' or 'rx'
 *   ComConfig.build(answers)           -> { nodes, general, callbacks, summary, issues, layout }
 *   ComConfig.node(def, name, params, subs, refs)   -> one container, for hand-written examples
 *   ComConfig.rows(nodes, general)     -> [{ where, name, value, why }]
 *   ComConfig.arxml(nodes, general)    -> string
 *   ComConfig.renderRows(tbody, rows) / renderIssues(ul, issues) / renderLayout(el, layout)
 *   ComConfig.toHash(answers) / fromHash(hash)      -> link a page to a filled-in configurator
 *
 * A container is { def, name, params: [[parameter, value, why]], subs: [containers],
 *                  refs: [[parameter, target, why]] }.
 */
(function () {
  const INT = 'INTEGER', FLOAT = 'FLOAT', BOOL = 'BOOLEAN', ENUM = 'ENUMERATION', STR = 'STRING';

  /* Kind of every parameter used here (decides the ARXML element). */
  const KIND = {
    ComBitPosition: INT, ComBitSize: INT, ComSignalLength: INT, ComUpdateBitPosition: INT,
    ComIPduGroupHandleId: INT, ComSupportedIPduGroups: INT, ComTxModeNumberOfRepetitions: INT, ComTxIPduUnusedAreasDefault: INT,
    ComFilterMask: INT, ComFilterMax: INT, ComFilterMin: INT, ComFilterOffset: INT,
    ComFilterPeriod: INT, ComFilterX: INT,
    ComTimeout: FLOAT, ComFirstTimeout: FLOAT, ComMinimumDelayTime: FLOAT,
    ComTxModeTimePeriod: FLOAT, ComTxModeTimeOffset: FLOAT, ComTxModeRepetitionPeriod: FLOAT,
    ComMainRxTimeBase: FLOAT, ComMainTxTimeBase: FLOAT, ComMainRouteSignalsTimeBase: FLOAT,
    ComIPduLargeData: BOOL, ComSignalGroupArrayAccess: BOOL, ComEnableMDTForCyclicTransmission: BOOL,
    ComEnableSignalGroupArrayApi: BOOL, ComLargeDataSupport: BOOL,
    ComSignalType: ENUM, ComSignalEndianness: ENUM, ComTransferProperty: ENUM,
    ComIPduDirection: ENUM, ComIPduSignalProcessing: ENUM, ComIPduType: ENUM, ComTxModeMode: ENUM,
    ComTxIPduClearUpdateBit: ENUM, ComRxDataTimeoutAction: ENUM, ComDataInvalidAction: ENUM,
    ComFilterAlgorithm: ENUM,
    ComSignalInitValue: STR, ComSignalDataInvalidValue: STR, ComTimeoutSubstitutionValue: STR
  };
  const CHOICE_CONTAINERS = ['ComGwSource', 'ComGwDestination'];
  const CHOICE_REFS = ['ComGwSignalRef', 'ComIPduMainFunctionRef'];
  const VALUES = '/EcucValues/Com/ComConfig/';
  const DEFS = '/AUTOSAR/EcucDefs/Com/';

  const TYPES = {
    BOOLEAN: { bits: 8 },
    UINT8: { bits: 8 }, UINT16: { bits: 16 }, UINT32: { bits: 32 }, UINT64: { bits: 64 },
    SINT8: { bits: 8, signed: true }, SINT16: { bits: 16, signed: true },
    SINT32: { bits: 32, signed: true }, SINT64: { bits: 64, signed: true },
    FLOAT32: { bits: 32, float: true }, FLOAT64: { bits: 64, float: true },
    UINT8_N: { array: true }
  };

  const FILTERS = {
    ALWAYS: { text: 'let every value pass', params: [] },
    NEVER: { text: 'block every value', params: [] },
    MASKED_NEW_EQUALS_X: { text: 'the value equals X', params: ['x'] },
    MASKED_NEW_DIFFERS_X: { text: 'the value differs from X', params: ['x'] },
    MASKED_NEW_DIFFERS_MASKED_OLD: { text: 'the value changed', params: [] },
    NEW_IS_WITHIN: { text: 'the value is inside a range', params: ['min', 'max'] },
    NEW_IS_OUTSIDE: { text: 'the value is outside a range', params: ['min', 'max'] },
    ONE_EVERY_N: { text: 'every Nth value', params: ['n', 'off'] }
  };

  const BASE = {
    dir: 'tx', sig: 'EngineSpeed', pdu: 'EngineData', pduBytes: 8, group: '', main: 10,
    type: 'UINT16', bits: 16, len: 4, start: 0, endian: 'LITTLE_ENDIAN', init: '0',
    write: 'change', others: false, timer: true, period: 100, offset: 0,
    reps: 0, repGap: 20, sigReps: true, mdt: 0, mdtCyclic: true,
    ub: false, ubPos: 16, ubClear: 'Transmit', txTout: 0,
    inv: false, invVal: '65535', invAct: 'NOTIFY',
    two: false, filt: false, alg: 'MASKED_NEW_DIFFERS_X', x: '0', min: '0', max: '100', n: 2, off: 0,
    falseMode: 'NONE', falsePeriod: 1000, proc: 'DEFERRED',
    cbAck: false, cbTout: false, cbErr: false, cbInv: false,
    rxTout: 0, rxFirst: 0, toutAct: 'NONE', sub: '0'
  };

  function defaults(dir) {
    return Object.assign({}, BASE, { dir: dir || 'tx', cbAck: dir === 'rx' });
  }

  function node(def, name, params, subs, refs) {
    return { def, name: name || def, params: params || [], subs: subs || [], refs: refs || [] };
  }

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const secs = (ms) => String(Number((Number(ms) / 1000).toFixed(6)));
  const ms = (v) => Number(v) + ' ms';

  function big(v) {
    try {
      const s = String(v).trim();
      if (s === '') return null;
      return s[0] === '-' ? -BigInt(s.slice(1)) : BigInt(s);
    } catch (e) {
      return null;
    }
  }

  /* ---------- answers -> containers ---------- */

  function build(input) {
    const a = Object.assign({}, BASE, input);
    const tx = a.dir === 'tx';
    const T = TYPES[a.type] || TYPES.UINT16;
    const issues = [];
    const summary = [];
    const callbacks = [];
    const general = [];
    const error = (text, rule) => issues.push({ level: 'error', text, rule });
    const warn = (text, rule) => issues.push({ level: 'warn', text, rule });
    const info = (text, rule) => issues.push({ level: 'info', text, rule });
    const num = (k) => Number(a[k]) || 0;

    /* The signal itself */
    const isBool = a.type === 'BOOLEAN';
    const bits = T.array ? num('len') * 8 : T.float ? T.bits : isBool ? 1 : num('bits');
    const endian = T.array ? 'OPAQUE' : a.endian;
    const start = num('start');
    const sig = node('ComSignal', a.sig, [
      ['ComBitPosition', start, 'Where the signal starts in the packet.'],
      ['ComSignalEndianness', endian, T.array ? 'A row of bytes is always OPAQUE: no byte swapping.' : 'Byte order on the bus.'],
      ['ComSignalType', a.type, 'The kind of number the application sees.']
    ]);
    if (T.array) sig.params.splice(1, 0, ['ComSignalLength', num('len'), 'Length in bytes.']);
    else if (!T.float) sig.params.splice(1, 0, ['ComBitSize', bits, 'How many bits it takes in the packet.']);
    sig.params.push(['ComSignalInitValue', a.init, 'The start value, used until a real value exists.']);

    if (!T.array && !T.float && !isBool) {
      if (bits < 1) error('The bit size must be at least 1.');
      if (bits > T.bits) error('The bit size (' + bits + ') is larger than the type ' + a.type + ' can hold (' + T.bits + ' bits).', 'SWS_Com_CONSTR_00785');
    }
    if (T.array) {
      if (start % 8 !== 0) error('A row of bytes must start on a byte border: the start bit must be a multiple of 8.', 'SWS_Com_CONSTR_00105');
      if (num('len') < 1) error('The length must be at least 1 byte.');
    }

    function checkValue(text, label) {
      if (T.array) {
        const parts = String(text).trim().split(/\s+/).filter(Boolean);
        if (parts.length !== num('len') || parts.some((p) => !/^\d+$/.test(p) || Number(p) > 255))
          error(label + ' of a row of bytes is written as ' + num('len') + ' decimal numbers from 0 to 255 with blanks between them, for example "97 98 100".', 'ECUC_Com_00170');
        return;
      }
      if (T.float) {
        if (String(text).trim() === '' || isNaN(Number(text))) error(label + ' must be a number.');
        return;
      }
      if (isBool) {
        if (!/^(0|1|true|false)$/.test(String(text).trim())) error(label + ' of a BOOLEAN is true or false (or 1 or 0).');
        return;
      }
      const v = big(text);
      if (v === null) { error(label + ' must be a whole number such as 100 or 0xFF.'); return; }
      const n = BigInt(Math.max(1, Math.min(bits, 64)));
      const lo = T.signed ? -(1n << (n - 1n)) : 0n;
      const hi = T.signed ? (1n << (n - 1n)) - 1n : (1n << n) - 1n;
      if (v < lo || v > hi) error(label + ' ' + text + ' does not fit: ' + bits + ' bits of ' + a.type + ' hold ' + lo + ' to ' + hi + '.');
    }
    checkValue(a.init, 'The start value');

    /* Where the bits sit */
    let sigBits = [];
    if (bits >= 1 && bits <= 4096 && start >= 0) {
      sigBits = window.PduGrid.signalBits(start, bits, endian === 'BIG_ENDIAN' ? 'BIG_ENDIAN' : 'LITTLE_ENDIAN');
    }
    const total = num('pduBytes') * 8;
    if (sigBits.some((p) => p < 0 || p >= total))
      error('The signal does not fit into a packet of ' + num('pduBytes') + ' bytes at this start bit.');
    const ubPos = a.ub ? num('ubPos') : null;
    if (a.ub) {
      if (ubPos < 0 || ubPos >= total) error('The update-bit position ' + ubPos + ' lies outside the packet.');
      if (sigBits.includes(ubPos)) error('The update-bit sits on a bit that the signal itself uses.', 'SWS_Com_CONSTR_00102');
      sig.params.push(['ComUpdateBitPosition', ubPos, 'Where the "this is new" bit sits. Must be the same on both sides.']);
    }

    const rule = () => ({
      MASKED_NEW_EQUALS_X: 'the value equals ' + a.x,
      MASKED_NEW_DIFFERS_X: 'the value differs from ' + a.x,
      NEW_IS_WITHIN: 'the value lies between ' + a.min + ' and ' + a.max,
      NEW_IS_OUTSIDE: 'the value lies outside ' + a.min + ' to ' + a.max
    }[a.alg] || (FILTERS[a.alg] || FILTERS.ALWAYS).text);

    /* Filter, also used as the condition for the second send setting */
    function filterNode(why) {
      const f = FILTERS[a.alg] || FILTERS.ALWAYS;
      const p = [['ComFilterAlgorithm', a.alg, why]];
      const width = Math.min(tx ? (T.bits || 8) : Math.max(bits, 1), 32);
      const allOnes = String(2 ** width - 1);
      if (/^MASKED/.test(a.alg)) p.push(['ComFilterMask', allOnes, 'Which bits take part in the comparison. Here: all of them.']);
      if (f.params.includes('x')) p.push(['ComFilterX', a.x, 'The value X to compare with.']);
      if (f.params.includes('min')) {
        p.push(['ComFilterMin', a.min, 'Lower end of the range.'], ['ComFilterMax', a.max, 'Upper end of the range.']);
        const lo = big(a.min), hi = big(a.max);
        if (lo === null || hi === null) error('The range needs two whole numbers.');
        else if (lo > hi) error('The lower end of the range is above the upper end.');
      }
      if (f.params.includes('x') && big(a.x) === null) error('X must be a whole number.');
      if (f.params.includes('n')) {
        p.push(['ComFilterPeriod', num('n'), 'N: one value in every N passes.'], ['ComFilterOffset', num('off'), 'Which of the N passes, counted from 0.']);
        if (num('n') < 2) error('N must be at least 2.', 'ECUC_Com_00312');
        if (num('off') >= num('n')) error('The offset must be smaller than N.', 'SWS_Com_CONSTR_00535');
      }
      const simple = ['ALWAYS', 'NEVER', 'ONE_EVERY_N'];
      if ((T.float || T.array) && !simple.includes(a.alg))
        error('For decimal numbers and rows of bytes only ALWAYS, NEVER and ONE_EVERY_N are supported.', 'SWS_Com_CONSTR_00380');
      if (isBool && /^NEW_IS/.test(a.alg))
        error('A range rule makes no sense for a BOOLEAN and is not supported.', 'SWS_Com_CONSTR_00439');
      if (bits > 32 && f.params.length && !simple.includes(a.alg))
        info('Filter values are limited to 32 bits (up to 4294967295).', 'ECUC_Com_00147');
      return node('ComFilter', 'ComFilter', p);
    }

    /* The packet */
    const pdu = node('ComIPdu', a.pdu, [
      ['ComIPduDirection', tx ? 'SEND' : 'RECEIVE', tx ? 'This control unit sends the packet.' : 'This control unit receives the packet.'],
      ['ComIPduSignalProcessing', a.proc, a.proc === 'IMMEDIATE'
        ? 'Messages to the application are given at once, inside the call from below.'
        : 'Messages to the application are given at COM\'s next heartbeat.'],
      ['ComIPduType', 'NORMAL', 'Fits into one frame. TP would mean "sent in pieces".'],
      ['ComIPduLargeData', 'false', 'Not on the fast lane: COM packs and unpacks this packet.']
    ], [], [
      ['ComIPduSignalRef', a.sig, 'The packet points to each of its signals.'],
      ['ComPduIdRef', '/EcucValues/EcuC/EcucConfigSet/EcucPduCollection/' + a.pdu, 'The same packet as the layers below know it. This link also fixes its length.']
    ]);
    const nodes = [];
    const heartbeat = num('main');
    nodes.push(node(tx ? 'ComMainFunctionTx' : 'ComMainFunctionRx', tx ? 'ComMainFunctionTx' : 'ComMainFunctionRx', [
      [tx ? 'ComMainTxTimeBase' : 'ComMainRxTimeBase', secs(heartbeat), 'How often this heartbeat runs. In seconds, like every time in COM.']
    ]));
    if (heartbeat <= 0) error('The heartbeat period must be above 0.', 'ECUC_Com_10010');

    function onGrid(value, label) {
      if (heartbeat > 0 && value > 0 && Math.abs(value / heartbeat - Math.round(value / heartbeat)) > 1e-9)
        warn(label + ' (' + ms(value) + ') is not a multiple of the heartbeat (' + ms(heartbeat) + '). COM counts time in heartbeats, so the real time gets rounded; how is up to the implementation.', 'ECUC_Com_10010');
    }

    if (a.group) {
      nodes.push(node('ComIPduGroup', a.group, [
        ['ComIPduGroupHandleId', 0, 'The number used to start and stop this group. Usually given by the tool.']
      ]));
      pdu.refs.push(['ComIPduGroupRef', a.group, 'The packet group this packet belongs to.']);
      info('All packet groups are stopped after start-up. Nothing is ' + (tx ? 'sent' : 'received') + ' until something outside COM starts the group "' + a.group + '".', 'SWS_Com_00444');
    } else {
      info('The packet is in no packet group. It is started when COM starts and can never be stopped.', 'SWS_Com_00840');
    }

    if (tx) {
      /* Triggered or pending */
      const once = num('reps') > 0 && !a.sigReps;
      const prop = a.write === 'pending' ? 'PENDING'
        : a.write === 'always' ? (once ? 'TRIGGERED_WITHOUT_REPETITION' : 'TRIGGERED')
        : (once ? 'TRIGGERED_ON_CHANGE_WITHOUT_REPETITION' : 'TRIGGERED_ON_CHANGE');
      sig.params.push(['ComTransferProperty', prop, a.write === 'pending'
        ? 'Writing the signal sends nothing by itself.'
        : a.write === 'always' ? 'Every write asks for a send.' : 'A write asks for a send only if the value changed.']);

      /* Send setting */
      const triggered = a.write !== 'pending' || a.others;
      const mode = triggered ? (a.timer ? 'MIXED' : 'DIRECT') : (a.timer ? 'PERIODIC' : 'NONE');
      const modeWhy = {
        MIXED: 'Timer, plus at once when a triggered signal is written.',
        DIRECT: 'No timer. Sent only when a triggered signal is written.',
        PERIODIC: 'Timer only.',
        NONE: 'COM never starts a send for this packet.'
      };
      const txMode = node('ComTxMode', 'ComTxMode', [['ComTxModeMode', mode, modeWhy[mode]]]);
      if (a.timer) {
        txMode.params.push(['ComTxModeTimePeriod', secs(a.period), 'The timer period, in seconds.']);
        if (num('period') <= 0) error('The timer period must be above 0.');
        onGrid(num('period'), 'The timer period');
        if (num('offset') > 0) {
          txMode.params.push(['ComTxModeTimeOffset', secs(a.offset), 'Wait this long after the packet is started before the first timer send.']);
          onGrid(num('offset'), 'The start delay');
        }
      }
      const reps = (mode === 'DIRECT' || mode === 'MIXED') ? num('reps') : 0;
      if (reps > 0) {
        txMode.params.push(
          ['ComTxModeNumberOfRepetitions', reps, 'Extra sends after the first one: ' + (reps + 1) + ' sends in total.'],
          ['ComTxModeRepetitionPeriod', secs(a.repGap), 'Time between these sends, in seconds.']);
        if (reps > 255) error('At most 255 repeats.', 'ECUC_Com_00281');
        if (num('repGap') <= 0) warn('Repeats need a time between them (above 0).', 'ECUC_Com_00282');
        onGrid(num('repGap'), 'The time between repeats');
        if (a.ub) error('A packet with repeats must not carry update-bits.', 'SWS_Com_CONSTR_00310');
      } else if (num('reps') > 0) {
        info('Repeats only exist for packets that are sent on a write. This packet is not, so the repeats are left out.', 'ECUC_Com_00281');
      }

      const txIPdu = node('ComTxIPdu', 'ComTxIPdu', [
        ['ComTxIPduUnusedAreasDefault', 255, 'What goes into the parts of the packet no signal uses (0xFF here).']
      ], [node('ComTxModeTrue', 'ComTxModeTrue', [], [txMode])]);
      if (num('mdt') > 0) {
        txIPdu.params.unshift(['ComMinimumDelayTime', secs(a.mdt), 'The minimum gap after a send, in seconds.']);
        general.push(['ComEnableMDTForCyclicTransmission', String(!!a.mdtCyclic), a.mdtCyclic
          ? 'The gap also holds for timer sends and repeats. One switch for all of COM.'
          : 'Timer sends and repeats do not start the gap. One switch for all of COM.']);
        onGrid(num('mdt'), 'The minimum gap');
        if (a.mdtCyclic && a.timer && num('mdt') > num('period'))
          warn('The minimum gap is longer than the timer period, so the timer sends will be held back.', 'SWS_Com_00789');
        if (a.mdtCyclic && reps > 0 && num('mdt') > num('repGap'))
          warn('The minimum gap is longer than the time between repeats, so the repeats will be held back.', 'SWS_Com_00789');
      }
      if (a.ub) txIPdu.params.push(['ComTxIPduClearUpdateBit', a.ubClear, {
        Transmit: 'Update-bits are cleared right after the packet was handed down.',
        Confirmation: 'Update-bits are cleared when the bus confirmed the send.',
        TriggerTransmit: 'Update-bits are cleared after the packet was fetched from below.'
      }[a.ubClear]]);

      /* Second send setting */
      if (a.two) {
        sig.subs.push(filterNode('The condition on this signal. While it is true, the "true" send setting is used.'));
        const fm = node('ComTxMode', 'ComTxMode', [['ComTxModeMode', a.falseMode, modeWhy[a.falseMode]]]);
        if (a.falseMode === 'PERIODIC') {
          fm.params.push(['ComTxModeTimePeriod', secs(a.falsePeriod), 'The timer period while the condition is false, in seconds.']);
          if (num('falsePeriod') <= 0) error('The second timer period must be above 0.');
          onGrid(num('falsePeriod'), 'The second timer period');
        }
        txIPdu.subs.push(node('ComTxModeFalse', 'ComTxModeFalse', [], [fm]));
        if (a.others) info('If another signal in this packet also has a condition, the "true" setting is used as soon as one of them is true.', 'SWS_Com_00678');
      }
      pdu.subs.push(txIPdu);

      if (num('txTout') > 0) {
        sig.params.push(['ComTimeout', secs(a.txTout), 'The limit for the bus to confirm a send, in seconds.']);
        onGrid(num('txTout'), 'The send timeout');
        if (reps > 0 && reps * num('repGap') >= num('txTout'))
          warn('All ' + (reps + 1) + ' sends take about ' + ms(reps * num('repGap')) + ', longer than the send timeout. When the timeout strikes, the remaining repeats are dropped.', 'SWS_Com_00392');
        if (!a.cbTout) warn('A send timeout is set but no "not sent in time" message, so the application is never told.', 'SWS_Com_00304');
      } else if (a.cbTout) {
        warn('The "not sent in time" message needs a send timeout above 0.', 'SWS_Com_00333');
      }
      if (a.inv) {
        sig.params.push(['ComSignalDataInvalidValue', a.invVal, 'The reserved value that means "no good value".']);
        checkValue(a.invVal, 'The invalid value');
      }

      /* In plain words */
      const others = a.others ? ' Another signal in the packet can also make it go out.' : '';
      summary.push(a.write === 'pending'
        ? 'Writing ' + a.sig + ' sends nothing by itself. The value rides along the next time ' + a.pdu + ' goes out.' + others
        : 'Writing ' + a.sig + (a.write === 'change' ? ' with a new value' : '') + ' makes ' + a.pdu + ' go out at COM\'s next heartbeat at the latest (every ' + ms(heartbeat) + ').' + (a.write === 'change' ? ' Writing the same value again sends nothing.' : ''));
      if (reps > 0) summary.push(once
        ? 'The packet has ' + reps + ' repeats, but a write of ' + a.sig + ' sends it only once.'
        : 'Each such write puts the packet on the bus ' + (reps + 1) + ' times, ' + ms(a.repGap) + ' apart. A new write in between starts the count again.');
      if (a.timer) summary.push(a.pdu + ' also goes out every ' + ms(a.period) + (num('offset') > 0 ? ', the first time ' + ms(a.offset) + ' after it was started.' : '.'));
      if (mode === 'NONE') warn('COM never starts a send for this packet. It only leaves when a layer below fetches it.', 'SWS_Com_00135');
      if (num('mdt') > 0) summary.push('After a send, the packet waits at least ' + ms(a.mdt) + ' before it may go out again. A send asked for in that time is not lost, only late.');
      if (a.two) summary.push('While ' + rule().replace('the value', 'the value of ' + a.sig) + ', the setting above is used. Otherwise ' + (a.falseMode === 'NONE' ? 'COM does not send the packet at all.' : 'the packet goes out every ' + ms(a.falsePeriod) + ' only.'));
      if (a.ub) summary.push('Each write also sets the update-bit at position ' + ubPos + ', so the receiver can tell a fresh value from a repeated one.');
      if (num('txTout') > 0) summary.push('If the bus does not confirm a send within ' + ms(a.txTout) + ', COM reports this once.');
      if (a.inv) summary.push('The application can mark the signal as invalid. COM then sends the reserved value ' + a.invVal + '.');

      if (a.cbAck) callbacks.push(['COM_TX_ACK', 'Sent: the bus confirmed the packet.']);
      if (a.cbTout) callbacks.push(['COM_TX_TOUT', 'Not sent in time.']);
      if (a.cbErr) callbacks.push(['COM_TX_ERR', 'Could not be sent, because the packet was stopped.']);
    } else {
      /* Receiving */
      if (a.filt) sig.subs.push(filterNode('The pass-or-block rule for received values.'));
      const hasTout = num('rxTout') > 0;
      if (hasTout) {
        sig.params.push(['ComTimeout', secs(a.rxTout), 'The time limit between two arrivals, in seconds.']);
        onGrid(num('rxTout'), 'The timeout');
        if (num('rxFirst') > 0) {
          sig.params.push(['ComFirstTimeout', secs(a.rxFirst), 'The limit for the very first wait after the packet is started, in seconds.']);
          onGrid(num('rxFirst'), 'The first timeout');
        } else {
          info('No first timeout: the signal is not watched until the first packet has arrived. A sender that never starts goes unnoticed.', 'SWS_Com_00716');
        }
        sig.params.push(['ComRxDataTimeoutAction', a.toutAct, {
          NONE: 'On timeout, keep the last value.',
          REPLACE: 'On timeout, go back to the start value.',
          SUBSTITUTE: 'On timeout, switch to the substitute value.'
        }[a.toutAct]]);
        if (a.toutAct === 'SUBSTITUTE') {
          sig.params.push(['ComTimeoutSubstitutionValue', a.sub, 'The value handed out after a timeout.']);
          checkValue(a.sub, 'The substitute value');
        }
        info(a.ub
          ? 'The signal has an update-bit, so it gets its own stopwatch: only packets with the bit set count as an arrival.'
          : 'Signals without update-bit share one stopwatch per packet. It runs with the shortest limit of all of them.', a.ub ? 'SWS_Com_00292' : 'SWS_Com_00291');
        if (!a.cbTout && a.toutAct === 'NONE') warn('The timeout has no visible effect: no message is given and the last value is kept.', 'SWS_Com_00500');
      } else if (a.cbTout) {
        warn('The "overdue" message needs a timeout above 0. Without one the signal is not watched.', 'SWS_Com_00333');
      }
      if (a.inv) {
        sig.params.push(
          ['ComSignalDataInvalidValue', a.invVal, 'The reserved value that means "no good value".'],
          ['ComDataInvalidAction', a.invAct, a.invAct === 'NOTIFY'
            ? 'Tell the application and keep the last good value.'
            : 'Hand out the start value instead, as if it had been received.']);
        checkValue(a.invVal, 'The invalid value');
        if (a.invAct === 'NOTIFY' && !a.cbInv) warn('Invalid values are only reported, but no "invalid" message is set, so the application never notices.', 'SWS_Com_00680');
      }
      if (a.filt && a.alg === 'MASKED_NEW_DIFFERS_MASKED_OLD' && hasTout)
        info('After a timeout, the first value that arrives passes the "changed" filter even if it is the old one.', 'SWS_Com_00793');
      if (a.filt && a.alg === 'NEVER') warn('This filter blocks every value. The application will never see one.', 'SWS_Com_00273');

      summary.push(a.proc === 'IMMEDIATE'
        ? 'When ' + a.pdu + ' arrives, COM unpacks ' + a.sig + ' at once.'
        : 'When ' + a.pdu + ' arrives, COM takes a copy. It unpacks ' + a.sig + ' at its next receive heartbeat (every ' + ms(heartbeat) + ').');
      summary.push('Until the first packet arrives, the application reads the start value ' + a.init + '.');
      if (a.ub) summary.push('COM looks at the update-bit at position ' + ubPos + ' first. If it is not set, the signal is ignored and the old value stays.');
      if (a.inv) summary.push(a.invAct === 'NOTIFY'
        ? 'If the reserved value ' + a.invVal + ' arrives, COM does not store it. It only gives the "invalid" message.'
        : 'If the reserved value ' + a.invVal + ' arrives, COM hands out the start value ' + a.init + ' instead.');
      if (a.filt) summary.push({
        ALWAYS: 'The filter lets every value pass.',
        NEVER: 'The filter blocks every value. None is ever taken over.',
        ONE_EVERY_N: 'Only one of every ' + num('n') + ' arrivals is taken over. The others are thrown away.'
      }[a.alg] || 'A value is only taken over if ' + rule() + '. A blocked value is thrown away and the old one stays.');
      if (hasTout) summary.push('If nothing arrives for ' + ms(a.rxTout) + ', COM ' + ({ NONE: 'keeps the last value', REPLACE: 'goes back to the start value ' + a.init, SUBSTITUTE: 'switches to the substitute value ' + a.sub }[a.toutAct]) + (a.cbTout ? ' and gives the "overdue" message. It does so again after every further ' + ms(a.rxTout) + '.' : '.'));
      summary.push(a.cbAck
        ? 'After a value was taken over, the application gets the "new value" message.'
        : 'No "new value" message is set: the application has to ask for the value itself.');

      if (a.cbAck) callbacks.push(['COM_RX_ACK', 'New value arrived.']);
      if (a.cbTout) callbacks.push(['COM_RX_TOUT', 'Overdue: nothing arrived in time.']);
      if (a.inv && a.cbInv) callbacks.push(['COM_RX_INV', 'The invalid value arrived.']);
    }

    nodes.push(pdu, sig);
    return { nodes, general, callbacks, summary, issues, layout: { bytes: num('pduBytes'), sig: sigBits, ub: ubPos, name: a.sig } };
  }

  /* ---------- containers -> table rows ---------- */

  function rows(nodes, general) {
    const out = [];
    (general || []).forEach((p) => out.push({ where: 'ComGeneral', name: p[0], value: p[1], why: p[2] }));
    (function walk(list, trail) {
      list.forEach((n) => {
        const here = trail.concat(n.name === n.def ? n.def : n.def + ' ' + n.name);
        const where = here.join(' › ');
        n.params.forEach((p) => out.push({ where, name: p[0], value: p[1], why: p[2] }));
        n.refs.forEach((r) => out.push({ where, name: r[0], value: '→ ' + String(r[1]).split('/').pop(), why: r[2] }));
        walk(n.subs, here);
      });
    })(nodes, []);
    return out;
  }

  function renderRows(tbody, list) {
    let last = null;
    tbody.innerHTML = list.map((r) => {
      const where = r.where === last ? '' : esc(r.where);
      last = r.where;
      return '<tr' + (where ? ' class="first"' : '') + '><td class="mono">' + where + '</td><td><code>' + esc(r.name) +
        '</code></td><td class="mono">' + esc(r.value) + '</td><td>' + esc(r.why || '') + '</td></tr>';
    }).join('');
  }

  /* ---------- containers -> ARXML sketch ---------- */

  function arxml(nodes, general) {
    const L = [];
    const put = (depth, text) => L.push('  '.repeat(depth) + text);

    function params(depth, list, defPath) {
      if (!list.length) return;
      put(depth, '<PARAMETER-VALUES>');
      list.forEach((p) => {
        const kind = KIND[p[0]] || STR;
        const tag = kind === ENUM || kind === STR ? 'ECUC-TEXTUAL-PARAM-VALUE' : 'ECUC-NUMERICAL-PARAM-VALUE';
        put(depth + 1, '<' + tag + '>');
        put(depth + 2, '<DEFINITION-REF DEST="ECUC-' + kind + '-PARAM-DEF">' + defPath + '/' + p[0] + '</DEFINITION-REF>');
        put(depth + 2, '<VALUE>' + esc(p[1]) + '</VALUE>');
        put(depth + 1, '</' + tag + '>');
      });
      put(depth, '</PARAMETER-VALUES>');
    }

    function container(depth, n, parentDef) {
      const defPath = parentDef + '/' + n.def;
      const kind = CHOICE_CONTAINERS.includes(n.def) ? 'ECUC-CHOICE-CONTAINER-DEF' : 'ECUC-PARAM-CONF-CONTAINER-DEF';
      put(depth, '<ECUC-CONTAINER-VALUE>');
      put(depth + 1, '<SHORT-NAME>' + esc(n.name) + '</SHORT-NAME>');
      put(depth + 1, '<DEFINITION-REF DEST="' + kind + '">' + defPath + '</DEFINITION-REF>');
      params(depth + 1, n.params, defPath);
      if (n.refs.length) {
        put(depth + 1, '<REFERENCE-VALUES>');
        n.refs.forEach((r) => {
          const target = String(r[1])[0] === '/' ? r[1] : VALUES + r[1];
          put(depth + 2, '<ECUC-REFERENCE-VALUE>');
          put(depth + 3, '<DEFINITION-REF DEST="ECUC-' + (CHOICE_REFS.includes(r[0]) ? 'CHOICE-' : '') + 'REFERENCE-DEF">' + defPath + '/' + r[0] + '</DEFINITION-REF>');
          put(depth + 3, '<VALUE-REF DEST="ECUC-CONTAINER-VALUE">' + esc(target) + '</VALUE-REF>');
          put(depth + 2, '</ECUC-REFERENCE-VALUE>');
        });
        put(depth + 1, '</REFERENCE-VALUES>');
      }
      if (n.subs.length) {
        put(depth + 1, '<SUB-CONTAINERS>');
        n.subs.forEach((s) => container(depth + 2, s, defPath));
        put(depth + 1, '</SUB-CONTAINERS>');
      }
      put(depth, '</ECUC-CONTAINER-VALUE>');
    }

    put(0, '<!-- A sketch to compare with your own file, not a complete configuration.');
    put(0, '     Package paths, names and handle numbers are placeholders. -->');
    put(0, '<ECUC-MODULE-CONFIGURATION-VALUES>');
    put(1, '<SHORT-NAME>Com</SHORT-NAME>');
    put(1, '<DEFINITION-REF DEST="ECUC-MODULE-DEF">/AUTOSAR/EcucDefs/Com</DEFINITION-REF>');
    put(1, '<CONTAINERS>');
    if (general && general.length) container(2, node('ComGeneral', 'ComGeneral', general), DEFS.slice(0, -1));
    put(2, '<ECUC-CONTAINER-VALUE>');
    put(3, '<SHORT-NAME>ComConfig</SHORT-NAME>');
    put(3, '<DEFINITION-REF DEST="ECUC-PARAM-CONF-CONTAINER-DEF">' + DEFS + 'ComConfig</DEFINITION-REF>');
    put(3, '<SUB-CONTAINERS>');
    nodes.forEach((n) => container(4, n, DEFS + 'ComConfig'));
    put(3, '</SUB-CONTAINERS>');
    put(2, '</ECUC-CONTAINER-VALUE>');
    put(1, '</CONTAINERS>');
    put(0, '</ECUC-MODULE-CONFIGURATION-VALUES>');
    return L.join('\n');
  }

  /* ---------- small renderers ---------- */

  function renderIssues(ul, issues) {
    const order = { error: 0, warn: 1, info: 2 };
    const label = { error: 'Not allowed', warn: 'Check this', info: 'Good to know' };
    const sorted = issues.slice().sort((x, y) => order[x.level] - order[y.level]);
    ul.innerHTML = sorted.length
      ? sorted.map((i) => '<li class="' + i.level + '"><strong>' + label[i.level] + '.</strong> ' + esc(i.text) +
          (i.rule ? ' <span class="rule">' + esc(i.rule) + '</span>' : '') + '</li>').join('')
      : '<li class="fine"><strong>Nothing to report.</strong> These settings fit together.</li>';
  }

  /* The rows of the packet that the signal touches, drawn like the bit grid of the packing lesson. */
  function renderLayout(el, layout) {
    el.innerHTML = '';
    const used = layout.sig.filter((p) => p >= 0 && p < layout.bytes * 8);
    if (!used.length) return;
    const all = layout.ub === null ? used : used.concat(layout.ub);
    const first = Math.max(0, Math.floor(Math.min(...all) / 8));
    const last = Math.min(layout.bytes - 1, Math.floor(Math.max(...all) / 8));
    let html = '<table class="pdu small-grid"><thead><tr><th></th>';
    for (let b = 7; b >= 0; b--) html += '<th>bit ' + b + '</th>';
    html += '</tr></thead><tbody>';
    for (let byte = first; byte <= last && byte < first + 16; byte++) {
      html += '<tr><th>byte ' + byte + '</th>';
      for (let b = 7; b >= 0; b--) {
        const p = byte * 8 + b;
        const k = layout.sig.indexOf(p);
        const cls = p === layout.ub ? 'right' : k < 0 ? '' : 'sig' + (k === layout.sig.length - 1 ? ' msb' : '') + (k === 0 ? ' lsb' : '');
        html += '<td class="' + cls + '"><span class="pos">' + p + '</span><span class="sbit">' + (p === layout.ub ? 'new' : '') + '</span></td>';
      }
      html += '</tr>';
    }
    el.innerHTML = '<div class="pdu-wrap">' + html + '</tbody></table></div>' +
      '<p class="legend"><span class="sw sig"></span>' + esc(layout.name) + '<span class="sw msb"></span>MSB<span class="sw lsb"></span>LSB' +
      (layout.ub === null ? '' : '<span class="sw ub"></span>update-bit') + '</p>';
  }

  /* ---------- answers <-> link ---------- */

  function toHash(a) {
    const d = defaults(a.dir);
    const q = new URLSearchParams();
    q.set('dir', a.dir);
    Object.keys(BASE).forEach((k) => {
      if (k !== 'dir' && k in a && String(a[k]) !== String(d[k])) q.set(k, String(a[k]));
    });
    return '#' + q.toString();
  }

  function fromHash(hash) {
    const q = new URLSearchParams(String(hash || '').replace(/^#/, ''));
    const a = defaults(q.get('dir') === 'rx' ? 'rx' : 'tx');
    q.forEach((v, k) => {
      if (!(k in BASE) || k === 'dir') return;
      a[k] = typeof BASE[k] === 'boolean' ? v === 'true' : typeof BASE[k] === 'number' ? Number(v) : v;
    });
    return a;
  }

  window.ComConfig = {
    TYPES, FILTERS, defaults, build, node, rows, arxml, renderRows, renderIssues, renderLayout, toHash, fromHash, esc
  };
})();
