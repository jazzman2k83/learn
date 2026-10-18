/*
 * Byte rows: shows a message as rows of hex bytes, coloured by field, with a click-to-explain.
 *
 *   const view = Bytes.create(el, {
 *     perRow: 4,                       // bytes per row (4 = the 32-bit rows of the specifications)
 *     fields: [                        // in transmission order
 *       { name: 'Message ID', bytes: [0x12, 0x34, 0x80, 0x01], cls: 'm-soad', info: 'HTML text' },
 *       ...
 *     ],
 *     onPick: (field, index) => {}     // optional
 *   });
 *   view.set(fields)                  // replace the content, keeps the picked field if it still exists
 *   view.pick(index)                  // select a field programmatically
 *
 * Every byte cell is a button-like cell (tabindex 0, Enter/Space or click selects its field).
 * Classes: cls is one of the module colours of course.css (m-soad, m-rte, m-tp, m-sd, m-app,
 * m-com, m-ip, m-eth) or 'pad' for padding bytes.
 *
 * Helpers (all big-endian unless noted):
 *   Bytes.u8(v) Bytes.u16(v) Bytes.u24(v) Bytes.u32(v)   -> arrays of byte values
 *   Bytes.le(arr)                                        -> the same bytes reversed (little-endian)
 *   Bytes.hex(arr, sep=' ')                              -> "12 34 AB"
 *   Bytes.parse(text)                                    -> array of bytes from "12 34 ab" or "1234ab"; null if invalid
 *   Bytes.h(v, digits)                                   -> "0x1234"
 */
(function () {
  function u8(v) { return [v & 0xFF]; }
  function u16(v) { return [(v >>> 8) & 0xFF, v & 0xFF]; }
  function u24(v) { return [(v >>> 16) & 0xFF, (v >>> 8) & 0xFF, v & 0xFF]; }
  function u32(v) { return [(v >>> 24) & 0xFF, (v >>> 16) & 0xFF, (v >>> 8) & 0xFF, v & 0xFF]; }
  function le(arr) { return arr.slice().reverse(); }
  function hex(arr, sep) { return arr.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(sep == null ? ' ' : sep); }
  function h(v, digits) { return '0x' + (v >>> 0).toString(16).toUpperCase().padStart(digits || 2, '0'); }
  function parse(text) {
    const clean = String(text).replace(/0x/gi, '').replace(/[\s,:;-]+/g, '');
    if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2) return null;
    const out = [];
    for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.substr(i, 2), 16));
    return out;
  }

  function create(host, opts) {
    const o = Object.assign({ perRow: 4, fields: [] }, opts);
    const wrap = document.createElement('div');
    wrap.className = 'bytes-wrap';
    const info = document.createElement('p');
    info.className = 'field-info';
    info.setAttribute('aria-live', 'polite');
    host.append(wrap, info);
    let picked = -1;
    let cells = [];

    function render() {
      const table = document.createElement('table');
      table.className = 'bytes';
      const head = document.createElement('tr');
      head.appendChild(document.createElement('th'));
      for (let c = 0; c < o.perRow; c++) {
        const th = document.createElement('th');
        th.textContent = '+' + c;
        head.appendChild(th);
      }
      table.appendChild(head);
      cells = [];
      let offset = 0;
      let row = null;
      o.fields.forEach((f, fi) => {
        f.bytes.forEach((b) => {
          if (offset % o.perRow === 0) {
            row = document.createElement('tr');
            const lab = document.createElement('td');
            lab.className = 'lab';
            lab.textContent = 'byte ' + offset;
            row.appendChild(lab);
            table.appendChild(row);
          }
          const td = document.createElement('td');
          td.textContent = b.toString(16).toUpperCase().padStart(2, '0');
          td.className = f.cls || '';
          td.dataset.field = String(fi);
          td.tabIndex = 0;
          td.title = f.name;
          td.addEventListener('click', () => pick(fi));
          td.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(fi); } });
          row.appendChild(td);
          cells.push(td);
          offset++;
        });
      });
      if (!o.fields.length || offset === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td class="lab">–</td><td colspan="' + o.perRow + '" class="lab" style="text-align:left">no bytes</td>';
        table.appendChild(tr);
      }
      wrap.replaceChildren(table);
      if (picked >= o.fields.length) picked = -1;
      mark();
    }

    function mark() {
      cells.forEach((td) => td.classList.toggle('on', Number(td.dataset.field) === picked));
      if (picked < 0) { info.innerHTML = 'Click a byte to see which field it belongs to.'; return; }
      const f = o.fields[picked];
      info.innerHTML = '<strong>' + f.name + '</strong> · ' + f.bytes.length + ' byte' + (f.bytes.length === 1 ? '' : 's') +
        ' · <code>' + (hex(f.bytes) || '–') + '</code>' + (f.info ? '<br>' + f.info : '');
    }

    function pick(i) {
      picked = i;
      mark();
      if (o.onPick && i >= 0) o.onPick(o.fields[i], i);
    }

    render();
    return {
      set(fields) { o.fields = fields; render(); },
      pick
    };
  }

  window.Bytes = { create, u8, u16, u24, u32, le, hex, h, parse };
})();
