/* Mond-Komponenten.
 *
 * 1) Simulator:      <div class="mond-sim" data-mond-sim data-start="45"></div>
 *    Draufsicht auf Erde und Mondbahn (Blick von Norden, Sonnenlicht von links),
 *    daneben der Anblick von der Erde aus (Nordhalbkugel, Blick nach Süden),
 *    darunter Faustregel-Zeiten für Aufgang, Höchststand, Untergang.
 *
 * 2) Phasenbildchen: <svg data-mondphase="90"></svg>
 *
 * Der einzige Parameter ist die Elongation E in Grad: der Winkel zwischen
 * Sonne und Mond von der Erde aus. 0 = Neumond, 90 = erstes Viertel,
 * 180 = Vollmond, 270 = letztes Viertel.
 *
 * API: window.MondSim = { phasePfad, phasenName, zeiten, lunation }
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var LUNATION = 29.53; // Tage, synodischer Monat (NASA)

  function norm(E) { return ((E % 360) + 360) % 360; }

  // Umriss des beleuchteten Teils, Mittelpunkt (0,0), Radius r.
  function phasePfad(E, r) {
    E = norm(E);
    var zunehmend = E <= 180;
    var e = zunehmend ? E : 360 - E;
    var rx = Math.abs(r * Math.cos(e * Math.PI / 180));
    var sweep = e < 90 ? 0 : 1;
    return {
      d: 'M0,' + (-r) + ' A' + r + ',' + r + ' 0 0 1 0,' + r +
         ' A' + rx.toFixed(2) + ',' + r + ' 0 0 ' + sweep + ' 0,' + (-r) + 'Z',
      spiegeln: !zunehmend
    };
  }

  var PHASEN = [
    [8, 'Neumond', 'Unsichtbar – er steht tagsüber dicht bei der Sonne.'],
    [82, 'Zunehmende Sichel', 'Abends im Westen, nach Sonnenuntergang.'],
    [98, 'Erstes Viertel', 'Nachmittags und in der ersten Nachthälfte.'],
    [172, 'Zunehmender Dreiviertelmond', 'Ab dem Nachmittag bis weit nach Mitternacht.'],
    [188, 'Vollmond', 'Die ganze Nacht, von Sonnenuntergang bis Sonnenaufgang.'],
    [262, 'Abnehmender Dreiviertelmond', 'Vom späteren Abend bis in den Vormittag.'],
    [278, 'Letztes Viertel', 'In der zweiten Nachthälfte und am Vormittag.'],
    [352, 'Abnehmende Sichel', 'Frühmorgens im Osten, vor Sonnenaufgang.'],
    [361, 'Neumond', 'Unsichtbar – er steht tagsüber dicht bei der Sonne.']
  ];

  function phase(E) {
    E = norm(E);
    for (var i = 0; i < PHASEN.length; i++) if (E < PHASEN[i][0]) return PHASEN[i];
    return PHASEN[0];
  }
  function phasenName(E) { return phase(E)[1]; }

  // Faustregel in Sonnenzeit (Stunden): der Mond hinkt der Sonne um E/15 Stunden hinterher.
  function zeiten(E) {
    var versatz = norm(E) / 15;
    return { auf: (6 + versatz) % 24, hoch: (12 + versatz) % 24, unter: (18 + versatz) % 24 };
  }

  function uhr(h) {
    var min = Math.round(h * 6) * 10 % 1440;
    var m = min % 60;
    return Math.floor(min / 60) + ':' + (m < 10 ? '0' : '') + m;
  }

  function el(name, attrs, eltern) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (eltern) eltern.appendChild(e);
    return e;
  }
  function text(str, attrs, eltern) {
    var t = el('text', attrs, eltern);
    t.textContent = str;
    return t;
  }

  function phasenBild(svg) {
    var E = parseFloat(svg.getAttribute('data-mondphase')) || 0;
    svg.setAttribute('viewBox', '-11 -11 22 22');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', phasenName(E));
    el('circle', { r: 10, 'class': 'dunkel' }, svg);
    var p = phasePfad(E, 10);
    el('path', { d: p.d, 'class': 'hell', transform: p.spiegeln ? 'scale(-1,1)' : '' }, svg);
    el('circle', { r: 10, 'class': 'rand' }, svg);
  }

  function simulator(wurzel) {
    var CX = 235, CY = 185, R = 125, PX = 530, PY = 150, PR = 62;
    var E = parseFloat(wurzel.getAttribute('data-start')) || 45;
    var timer = null;

    var svg = el('svg', { viewBox: '0 0 640 370', role: 'img',
      'aria-label': 'Draufsicht auf Erde und Mondbahn mit Anblick des Mondes von der Erde aus' }, wurzel);
    el('rect', { width: 640, height: 370, rx: 6, 'class': 'weltraum' }, svg);

    // Sonnenlicht von links
    text('Sonnenlicht', { x: 14, y: 348, 'class': 'titel' }, svg);
    [70, 130, 185, 240, 300].forEach(function (y) {
      el('line', { x1: 14, y1: y, x2: 52, y2: y, 'class': 'strahl' }, svg);
      el('path', { d: 'M60,' + y + ' l-9,-4 v8z', 'class': 'strahl-spitze' }, svg);
    });

    text('Von oben gesehen (Blick auf den Nordpol)', { x: CX, y: 30, 'text-anchor': 'middle', 'class': 'titel' }, svg);
    el('circle', { cx: CX, cy: CY, r: R, 'class': 'bahn' }, svg);
    var blick = el('line', { x1: CX, y1: CY, 'class': 'blick' }, svg);

    // Erde: linke Hälfte hat Tag
    el('circle', { cx: CX, cy: CY, r: 22, 'class': 'erde-nacht' }, svg);
    el('path', { d: 'M' + CX + ',' + (CY - 22) + ' A22,22 0 0 0 ' + CX + ',' + (CY + 22) + 'Z', 'class': 'erde-tag' }, svg);
    // Wo auf der Erde ist es wie spät? (Erde dreht sich gegen den Uhrzeigersinn)
    text('Mittag', { x: CX - 30, y: CY + 4, 'text-anchor': 'end' }, svg);
    text('Mitternacht', { x: CX + 30, y: CY + 4 }, svg);
    text('Sonnenuntergang', { x: CX, y: CY + 42, 'text-anchor': 'middle' }, svg);
    text('Sonnenaufgang', { x: CX, y: CY - 32, 'text-anchor': 'middle' }, svg);

    // Mond auf der Bahn: immer die linke (sonnenzugewandte) Hälfte hell
    var mond = el('g', {}, svg);
    el('circle', { r: 14, 'class': 'dunkel' }, mond);
    el('path', { d: 'M0,-14 A14,14 0 0 0 0,14Z', 'class': 'hell' }, mond);
    el('circle', { r: 26, 'class': 'greifer' }, mond);

    // Anblick von der Erde
    text('So siehst du ihn', { x: PX, y: 30, 'text-anchor': 'middle', 'class': 'titel' }, svg);
    text('(Blick nach Süden)', { x: PX, y: 48, 'text-anchor': 'middle' }, svg);
    el('circle', { cx: PX, cy: PY, r: PR, 'class': 'dunkel' }, svg);
    var hell = el('path', { 'class': 'hell' }, svg);
    el('circle', { cx: PX, cy: PY, r: PR, 'class': 'rand' }, svg);
    var name = text('', { x: PX, y: PY + PR + 30, 'text-anchor': 'middle' }, svg);
    var anteil = text('', { x: PX, y: PY + PR + 50, 'text-anchor': 'middle' }, svg);

    var unten = document.createElement('div');
    unten.innerHTML =
      '<div class="regler"><button type="button">▶ Laufen lassen</button>' +
      '<input type="range" min="0" max="360" step="1" aria-label="Stellung des Mondes auf seiner Bahn"></div>' +
      '<div class="werte">' +
      '<div><span>Tag im Zyklus</span><b data-w="tag"></b></div>' +
      '<div><span>Aufgang ca.</span><b data-w="auf"></b></div>' +
      '<div><span>Höchststand ca.</span><b data-w="hoch"></b></div>' +
      '<div><span>Untergang ca.</span><b data-w="unter"></b></div></div>' +
      '<p class="sichtbar"></p>' +
      '<div class="tagesband" aria-hidden="true"></div>' +
      '<div class="tagesskala" aria-hidden="true"><span>0 Uhr</span><span>6</span><span>12</span><span>18</span><span>24 Uhr</span></div>';
    wurzel.appendChild(unten);
    var regler = unten.querySelector('input');
    var knopf = unten.querySelector('button');
    var band = unten.querySelector('.tagesband');
    var sichtbar = unten.querySelector('.sichtbar');
    function wert(k) { return unten.querySelector('[data-w=' + k + ']'); }

    function zeichne() {
      var w = E * Math.PI / 180;
      var mx = CX - R * Math.cos(w), my = CY + R * Math.sin(w);
      mond.setAttribute('transform', 'translate(' + mx.toFixed(1) + ',' + my.toFixed(1) + ')');
      blick.setAttribute('x2', mx); blick.setAttribute('y2', my);

      var p = phasePfad(E, PR);
      hell.setAttribute('d', p.d);
      hell.setAttribute('transform', 'translate(' + PX + ',' + PY + ')' + (p.spiegeln ? ' scale(-1,1)' : ''));
      var ph = phase(E);
      name.textContent = ph[1];
      anteil.textContent = Math.round((1 - Math.cos(w)) / 2 * 100) + ' % beleuchtet';
      sichtbar.textContent = 'Zu sehen: ' + ph[2];

      var z = zeiten(E);
      wert('tag').textContent = (norm(E) / 360 * LUNATION).toFixed(1).replace('.', ',');
      wert('auf').textContent = uhr(z.auf) + ' Uhr';
      wert('hoch').textContent = uhr(z.hoch) + ' Uhr';
      wert('unter').textContent = uhr(z.unter) + ' Uhr';

      // Balken: Mond über dem Horizont (kann über Mitternacht laufen)
      var teile = z.auf < z.unter ? [[z.auf, z.unter]] : [[z.auf, 24], [0, z.unter]];
      band.innerHTML = teile.map(function (t) {
        return '<i style="left:' + (t[0] / 24 * 100) + '%;width:' + ((t[1] - t[0]) / 24 * 100) + '%"></i>';
      }).join('');
      regler.value = Math.round(norm(E));
    }

    function stopp() {
      if (timer) { clearInterval(timer); timer = null; knopf.textContent = '▶ Laufen lassen'; }
    }

    regler.addEventListener('input', function () { stopp(); E = parseFloat(regler.value); zeichne(); });
    knopf.addEventListener('click', function () {
      if (timer) return stopp();
      knopf.textContent = '❚❚ Anhalten';
      timer = setInterval(function () { E = norm(E + 1); zeichne(); }, 60);
    });

    // Mond mit Maus oder Finger ziehen
    function zuWinkel(ev) {
      var pt = svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      var q = pt.matrixTransform(svg.getScreenCTM().inverse());
      E = norm(Math.atan2(q.y - CY, -(q.x - CX)) * 180 / Math.PI);
      zeichne();
    }
    mond.addEventListener('pointerdown', function (ev) {
      stopp();
      mond.setPointerCapture(ev.pointerId);
      mond.addEventListener('pointermove', zuWinkel);
    });
    function los() { mond.removeEventListener('pointermove', zuWinkel); }
    mond.addEventListener('pointerup', los);
    mond.addEventListener('pointercancel', los);

    zeichne();
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('svg[data-mondphase]'), phasenBild);
    Array.prototype.forEach.call(document.querySelectorAll('[data-mond-sim]'), simulator);
  }

  window.MondSim = { phasePfad: phasePfad, phasenName: phasenName, zeiten: zeiten, lunation: LUNATION };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
