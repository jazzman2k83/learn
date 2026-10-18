/*
 * I-PDU bit grid: layout maths plus two widgets built on it.
 *
 * Bit numbering is AUTOSAR's fixed "sawtooth, decreasing" scheme (System Template
 * TPS_SYST_01068 / 01069): PDU bit p lives in byte floor(p / 8), bit p % 8 of that byte,
 * and each row is drawn with bit 7 on the left.
 *
 *   PduGrid.signalBits(start, size, endian)  -> PDU bit positions, index 0 = signal LSB
 *   PduGrid.pack(bytes, start, size, endian, value) -> writes value into a byte array
 *   PduGrid.explorer(el, { bytes, start, size, endian, value })
 *   PduGrid.clickTask(el, { bytes })
 *
 * endian is 'LITTLE_ENDIAN' or 'BIG_ENDIAN'. The start position is the signal's LSB for
 * little endian and its MSB for big endian (System Template, ISignalToIPduMapping.startPosition).
 */
(function () {
  const LE = 'LITTLE_ENDIAN';
  const BE = 'BIG_ENDIAN';

  function signalBits(start, size, endian) {
    const pos = new Array(size);
    if (endian === BE) {
      let p = start;
      for (let k = size - 1; k >= 0; k--) {
        pos[k] = p;
        // Next less significant bit: one to the right, or bit 7 of the following byte.
        p = p % 8 === 0 ? p + 15 : p - 1;
      }
    } else {
      for (let k = 0; k < size; k++) pos[k] = start + k;
    }
    return pos;
  }

  function fits(positions, nBytes) {
    return positions.every((p) => p >= 0 && p < nBytes * 8);
  }

  function pack(bytes, start, size, endian, value) {
    const v = BigInt(value);
    signalBits(start, size, endian).forEach((p, k) => {
      const byte = Math.floor(p / 8);
      const mask = 1 << (p % 8);
      if ((v >> BigInt(k)) & 1n) bytes[byte] |= mask;
      else bytes[byte] &= ~mask;
    });
    return bytes;
  }

  const hex = (b) => '0x' + b.toString(16).toUpperCase().padStart(2, '0');

  /* Builds the table once; returns { table, cell(p), hexCell(byte) }. */
  function buildGrid(nBytes) {
    const table = document.createElement('table');
    table.className = 'pdu';
    const head = table.createTHead().insertRow();
    head.appendChild(document.createElement('th'));
    for (let b = 7; b >= 0; b--) {
      const th = document.createElement('th');
      th.textContent = 'bit ' + b;
      head.appendChild(th);
    }
    head.appendChild(document.createElement('th'));
    const body = table.createTBody();
    const cells = [];
    const hexCells = [];
    for (let byte = 0; byte < nBytes; byte++) {
      const row = body.insertRow();
      const th = document.createElement('th');
      th.textContent = 'byte ' + byte;
      row.appendChild(th);
      for (let b = 7; b >= 0; b--) {
        const p = byte * 8 + b;
        const td = row.insertCell();
        td.dataset.pos = p;
        td.innerHTML = '<span class="pos">' + p + '</span><span class="val"></span><span class="sbit"></span>';
        cells[p] = td;
      }
      const hx = row.insertCell();
      hx.className = 'hex';
      hexCells[byte] = hx;
    }
    const wrap = document.createElement('div');
    wrap.className = 'pdu-wrap';
    wrap.appendChild(table);
    return { wrap, table, cells, hexCells };
  }

  function field(labelText, input) {
    const label = document.createElement('label');
    label.append(labelText, input);
    return label;
  }

  function numberInput(value, min, max) {
    const i = document.createElement('input');
    i.type = 'number';
    i.value = value;
    i.min = min;
    i.max = max;
    return i;
  }

  function endianSelect(value) {
    const s = document.createElement('select');
    [LE, BE].forEach((e) => s.add(new Option(e, e)));
    s.value = value;
    return s;
  }

  const LEGEND =
    '<span class="sw sig"></span>signal bit' +
    '<span class="sw msb"></span>MSB' +
    '<span class="sw lsb"></span>LSB';

  /* Free exploration: change the configuration, watch the layout and the bytes. */
  function explorer(el, opts) {
    const o = Object.assign({ bytes: 4, start: 5, size: 10, endian: LE, value: 0x2a5 }, opts);
    const grid = buildGrid(o.bytes);
    const start = numberInput(o.start, 0, o.bytes * 8 - 1);
    const size = numberInput(o.size, 1, 32);
    const endian = endianSelect(o.endian);
    const value = document.createElement('input');
    value.type = 'text';
    value.value = '0x' + o.value.toString(16).toUpperCase();
    value.size = 10;
    value.setAttribute('inputmode', 'text');

    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.append(
      field('ComBitPosition', start),
      field('ComBitSize', size),
      field('ComSignalEndianness', endian),
      field('value (hex or decimal)', value)
    );
    const legend = document.createElement('p');
    legend.className = 'legend';
    legend.innerHTML = LEGEND;
    const readout = document.createElement('p');
    readout.className = 'readout';
    readout.setAttribute('aria-live', 'polite');
    el.append(controls, grid.wrap, legend, readout);

    function render() {
      const s = parseInt(start.value, 10);
      const n = parseInt(size.value, 10);
      grid.cells.forEach((td) => {
        td.className = '';
        td.children[1].textContent = '';
        td.children[2].textContent = '';
      });
      grid.hexCells.forEach((h) => (h.textContent = ''));
      if (!(s >= 0) || !(n >= 1) || n > 32) {
        readout.textContent = 'Enter a position >= 0 and a size from 1 to 32.';
        return;
      }
      const positions = signalBits(s, n, endian.value);
      if (!fits(positions, o.bytes)) {
        readout.textContent = 'This signal does not fit in a ' + o.bytes + '-byte I-PDU with that start position.';
        return;
      }
      let v;
      try {
        v = BigInt(value.value.trim() || '0');
      } catch (e) {
        readout.textContent = 'Value must be a number such as 677 or 0x2A5.';
        return;
      }
      if (v < 0n) {
        readout.textContent = 'Use the raw unsigned bit pattern here; signed values are the next lesson.';
        return;
      }
      const max = (1n << BigInt(n)) - 1n;
      const clipped = v & max;
      const bytes = pack(new Array(o.bytes).fill(0), s, n, endian.value, clipped);
      positions.forEach((p, k) => {
        const td = grid.cells[p];
        td.classList.add('sig');
        if (k === n - 1) td.classList.add('msb');
        if (k === 0) td.classList.add('lsb');
        td.children[1].textContent = String((clipped >> BigInt(k)) & 1n);
        td.children[2].textContent = 's' + k;
      });
      bytes.forEach((b, i) => (grid.hexCells[i].textContent = hex(b)));
      readout.textContent =
        'I-PDU bytes: ' + bytes.map(hex).join(' ') +
        (clipped !== v ? '   (value truncated to ' + n + ' bits: 0x' + clipped.toString(16).toUpperCase() + ')' : '');
    }

    [start, size, endian, value].forEach((i) => i.addEventListener('input', render));
    render();
  }

  /* Practice: given a configuration, click every cell the signal occupies. */
  function clickTask(el, opts) {
    const o = Object.assign({ bytes: 4 }, opts);
    const grid = buildGrid(o.bytes);
    grid.table.classList.add('clickable');
    const task = document.createElement('p');
    task.className = 'readout';
    const feedback = document.createElement('p');
    feedback.className = 'feedback';
    feedback.setAttribute('aria-live', 'polite');
    const check = document.createElement('button');
    check.type = 'button';
    check.className = 'primary';
    check.textContent = 'Check';
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = 'New signal';
    const bar = document.createElement('div');
    bar.className = 'controls';
    bar.style.marginTop = '0.9rem';
    bar.style.marginBottom = '0';
    bar.append(check, next);
    const tally = document.createElement('p');
    tally.className = 'legend';
    el.append(task, grid.wrap, bar, feedback, tally);

    let target = [];
    let locked = false;
    let done = 0;
    let firstTry = 0;
    let attempts = 0;

    function newTask() {
      let s, n, e, positions;
      do {
        e = Math.random() < 0.6 ? BE : LE;
        n = 3 + Math.floor(Math.random() * 14); // 3..16 bits
        s = Math.floor(Math.random() * o.bytes * 8);
        positions = signalBits(s, n, e);
        // Only signals that cross a byte boundary: those are the ones worth practising.
      } while (!fits(positions, o.bytes) || Math.floor(Math.min(...positions) / 8) === Math.floor(Math.max(...positions) / 8));
      target = positions;
      locked = false;
      attempts = 0;
      grid.cells.forEach((td) => {
        td.className = '';
        td.tabIndex = 0;
        td.setAttribute('role', 'button');
        td.setAttribute('aria-pressed', 'false');
      });
      feedback.textContent = '';
      feedback.className = 'feedback';
      check.disabled = false;
      task.innerHTML =
        'Click every bit of this signal: ComBitPosition = <strong>' + s +
        '</strong>, ComBitSize = <strong>' + n + '</strong>, ComSignalEndianness = <strong>' + e + '</strong>';
    }

    function toggle(td) {
      if (locked) return;
      td.classList.remove('wrong', 'missed');
      const on = td.classList.toggle('picked');
      td.setAttribute('aria-pressed', String(on));
    }

    grid.cells.forEach((td) => {
      td.addEventListener('click', () => toggle(td));
      td.addEventListener('keydown', (ev) => {
        if (ev.key === ' ' || ev.key === 'Enter') {
          ev.preventDefault();
          toggle(td);
        }
      });
    });

    check.addEventListener('click', () => {
      if (locked) return;
      attempts++;
      const want = new Set(target);
      let wrong = 0;
      let missed = 0;
      grid.cells.forEach((td, p) => {
        td.classList.remove('wrong', 'missed');
        const picked = td.classList.contains('picked');
        if (picked && !want.has(p)) { td.classList.add('wrong'); wrong++; }
        if (!picked && want.has(p)) missed++;
      });
      if (wrong === 0 && missed === 0) {
        locked = true;
        check.disabled = true;
        done++;
        if (attempts === 1) firstTry++;
        const n = target.length;
        grid.cells.forEach((td, p) => {
          if (!want.has(p)) return;
          td.classList.remove('picked');
          td.classList.add('right');
        });
        grid.cells[target[n - 1]].classList.add('msb');
        grid.cells[target[0]].classList.add('lsb');
        feedback.className = 'feedback good';
        feedback.textContent = 'Correct. MSB at bit ' + target[n - 1] + ', LSB at bit ' + target[0] + '.';
        tally.textContent = 'Solved ' + done + ', first try ' + firstTry + '. Aim for three in a row on the first try.';
      } else {
        feedback.className = 'feedback bad';
        feedback.textContent =
          (wrong ? wrong + ' picked bit' + (wrong > 1 ? 's do' : ' does') + ' not belong (red). ' : '') +
          (missed ? missed + ' bit' + (missed > 1 ? 's are' : ' is') + ' still missing.' : '') +
          ' Adjust and check again.';
      }
    });
    next.addEventListener('click', newTask);
    newTask();
  }

  window.PduGrid = { signalBits, pack, explorer, clickTask, LE, BE };
})();
