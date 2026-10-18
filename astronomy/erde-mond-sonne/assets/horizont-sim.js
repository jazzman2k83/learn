/* Horizont-Simulator: „Du stehst auf einem Karussell“.
 *
 *   <div class="mond-sim" data-horizont-sim data-phase="90" data-zeit="18"></div>
 *
 * Links die Draufsicht (Blick auf den Nordpol, Sonnenlicht von links) mit einem
 * Beobachter auf der Erde und seiner Horizontlinie. Alles hinter der Linie ist
 * abgedunkelt: Dort ist die Erde im Weg. Rechts derselbe Moment als Himmelsanblick
 * (Blick nach Süden, Osten links, Westen rechts).
 * Der Mond bleibt stehen, nur die Erde dreht sich: Regler = Uhrzeit (Sonnenzeit).
 *
 * Braucht assets/mond-sim.js (MondSim.phasePfad) und die .mond-sim-Stile aus kurs.css.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var zaehler = 0;

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
  function rad(g) { return g * Math.PI / 180; }
  // Winkel auf -180..180 bringen
  function wickeln(g) { return ((g + 180) % 360 + 360) % 360 - 180; }

  // H = Stundenwinkel: 0 = im Süden, negativ = Osthälfte, positiv = Westhälfte
  function lage(H) {
    var a = Math.abs(H);
    if (a > 97) return 'unter dem Horizont';
    if (H < -83) return 'geht gerade im Osten auf';
    if (H < -20) return 'steigt im Südosten';
    if (H <= 20) return 'steht am höchsten, im Süden';
    if (H <= 83) return 'sinkt im Südwesten';
    return 'geht gerade im Westen unter';
  }

  function uhr(t) {
    var min = Math.round(t * 60) % 1440, m = min % 60;
    return Math.floor(min / 60) + ':' + (m < 10 ? '0' : '') + m;
  }

  function mischen(a, b, k) {
    return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * k); }).join(',') + ')';
  }

  function simulator(wurzel) {
    var CX = 205, CY = 200, R = 150, RE = 34;      // Draufsicht
    var SX = 525, SY = 265, RS = 92;               // Himmelsanblick
    var E = parseFloat(wurzel.getAttribute('data-phase'));
    var t = parseFloat(wurzel.getAttribute('data-zeit'));
    if (isNaN(E)) E = 90;
    if (isNaN(t)) t = 18;
    var timer = null;
    var id = 'hz-clip-' + (++zaehler);

    var svg = el('svg', { viewBox: '0 0 640 400', role: 'img',
      'aria-label': 'Beobachter auf der sich drehenden Erde mit Horizont, daneben der Himmelsanblick' }, wurzel);
    el('rect', { width: 640, height: 400, rx: 6, 'class': 'weltraum' }, svg);
    var defs = el('defs', {}, svg);
    el('rect', { x: 0, y: 0, width: 410, height: 400 }, el('clipPath', { id: id }, defs));

    // ----- Draufsicht -----
    var oben = el('g', { 'clip-path': 'url(#' + id + ')' }, svg);
    [90, 145, 200, 255, 310].forEach(function (y) {
      el('line', { x1: 4, y1: y, x2: 24, y2: y, 'class': 'strahl' }, oben);
      el('path', { d: 'M32,' + y + ' l-9,-4 v8z', 'class': 'strahl-spitze' }, oben);
    });
    el('circle', { cx: CX, cy: CY, r: R, 'class': 'bahn' }, oben);
    var blick = el('line', { 'class': 'blick' }, oben);

    var mond = el('g', {}, oben);
    el('circle', { r: 12, 'class': 'dunkel' }, mond);
    el('path', { d: 'M0,-12 A12,12 0 0 0 0,12Z', 'class': 'hell' }, mond);

    // Alles jenseits des Horizonts abdunkeln (die Erde ist im Weg)
    var boden = el('g', {}, oben);
    el('rect', { x: -600, y: 0, width: 1200, height: 900, fill: '#000', opacity: 0.5 }, boden);
    el('line', { x1: -600, y1: 0, x2: 600, y2: 0, stroke: '#e9e5da', 'stroke-width': 1.2 }, boden);

    el('circle', { cx: CX, cy: CY, r: RE, 'class': 'erde-nacht' }, oben);
    el('path', { d: 'M' + CX + ',' + (CY - RE) + ' A' + RE + ',' + RE + ' 0 0 0 ' + CX + ',' + (CY + RE) + 'Z', 'class': 'erde-tag' }, oben);
    el('path', { d: 'M' + (CX - 9) + ',' + (CY + 3) + ' a9,9 0 1 0 9,-9', fill: 'none', stroke: '#c9cbd6', 'stroke-width': 1.2 }, oben);
    el('path', { d: 'M' + (CX - 13) + ',' + (CY + 1) + ' l4,6 l4,-6z', fill: '#c9cbd6' }, oben);

    var figur = el('g', {}, oben);
    el('line', { x1: 0, y1: 0, x2: 0, y2: -13, stroke: '#fff', 'stroke-width': 2.2 }, figur);
    el('circle', { cx: 0, cy: -17, r: 4.2, fill: '#fff' }, figur);
    var ost = text('Ost', { 'text-anchor': 'middle' }, oben);
    var west = text('West', { 'text-anchor': 'middle' }, oben);

    text('Von oben gesehen', { x: 12, y: 24, 'class': 'titel' }, svg);
    text('Sonnenlicht', { x: 12, y: 388, 'class': 'titel' }, svg);

    // ----- Himmelsanblick -----
    el('line', { x1: 410, y1: 0, x2: 410, y2: 400, stroke: '#5a607a' }, svg);
    text('Das siehst du', { x: SX, y: 24, 'text-anchor': 'middle', 'class': 'titel' }, svg);
    text('(Blick nach Süden)', { x: SX, y: 42, 'text-anchor': 'middle' }, svg);
    var himmel = el('path', { d: 'M' + (SX - RS - 14) + ',' + SY + ' A' + (RS + 14) + ',' + (RS + 14) + ' 0 0 1 ' + (SX + RS + 14) + ',' + SY + 'Z' }, svg);
    el('path', { d: 'M' + (SX - RS) + ',' + SY + ' A' + RS + ',' + RS + ' 0 0 1 ' + (SX + RS) + ',' + SY, 'class': 'bahn' }, svg);
    var sonneH = el('circle', { r: 10, fill: 'var(--sonne)' }, svg);
    var mondH = el('g', {}, svg);
    el('circle', { r: 11, 'class': 'dunkel' }, mondH);
    var mondHell = el('path', { 'class': 'hell' }, mondH);
    el('circle', { r: 11, 'class': 'rand' }, mondH);
    el('rect', { x: 412, y: SY, width: 226, height: 400 - SY - 2, fill: '#2a2f24' }, svg);
    el('line', { x1: 412, y1: SY, x2: 638, y2: SY, stroke: '#e9e5da', 'stroke-width': 1.2 }, svg);
    text('Ost', { x: SX - RS, y: SY + 20, 'text-anchor': 'middle' }, svg);
    text('Süd', { x: SX, y: SY + 20, 'text-anchor': 'middle' }, svg);
    text('West', { x: SX + RS, y: SY + 20, 'text-anchor': 'middle' }, svg);
    var uhrText = text('', { x: SX, y: SY + 62, 'text-anchor': 'middle', style: 'font-size:22px;fill:#fff' }, svg);

    var unten = document.createElement('div');
    unten.innerHTML =
      '<div class="regler"><span>Mond:</span>' +
      '<button type="button" data-e="0">Neumond</button>' +
      '<button type="button" data-e="90">Erstes Viertel</button>' +
      '<button type="button" data-e="180">Vollmond</button>' +
      '<button type="button" data-e="270">Letztes Viertel</button></div>' +
      '<div class="regler"><span>Uhrzeit:</span>' +
      '<input type="range" min="0" max="24" step="0.25" aria-label="Uhrzeit">' +
      '<button type="button" data-lauf>▶ Erde drehen</button></div>' +
      '<div class="werte">' +
      '<div><span>Sonne</span><b data-w="sonne"></b></div>' +
      '<div><span>Mond</span><b data-w="mond"></b></div></div>';
    wurzel.appendChild(unten);
    var regler = unten.querySelector('input');
    var lauf = unten.querySelector('[data-lauf]');
    var phasenKnoepfe = Array.prototype.slice.call(unten.querySelectorAll('[data-e]'));

    function aufBogen(knoten, H) {
      var sichtbar = Math.abs(H) <= 97;
      knoten.setAttribute('visibility', sichtbar ? 'visible' : 'hidden');
      var x = SX + RS * Math.sin(rad(H)), y = SY - RS * Math.cos(rad(H));
      if (knoten.tagName === 'circle') { knoten.setAttribute('cx', x); knoten.setAttribute('cy', y); }
      else knoten.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')');
    }

    function zeichne() {
      // Beobachter: mittags links (zur Sonne), dreht gegen den Uhrzeigersinn
      var phi = rad(180 + (t - 12) * 15);
      var ox = CX + RE * Math.cos(phi), oy = CY - RE * Math.sin(phi);
      var dreh = 90 - (180 + (t - 12) * 15);
      var lokal = 'translate(' + ox.toFixed(1) + ',' + oy.toFixed(1) + ') rotate(' + dreh + ')';
      figur.setAttribute('transform', lokal);
      boden.setAttribute('transform', lokal);
      // Osten liegt in Drehrichtung
      var ex = -Math.sin(phi), ey = -Math.cos(phi);
      var hx = Math.cos(phi), hy = -Math.sin(phi);
      ost.setAttribute('x', ox + 62 * ex + 12 * hx); ost.setAttribute('y', oy + 62 * ey + 12 * hy + 4);
      west.setAttribute('x', ox - 62 * ex + 12 * hx); west.setAttribute('y', oy - 62 * ey + 12 * hy + 4);

      var mx = CX - R * Math.cos(rad(E)), my = CY + R * Math.sin(rad(E));
      mond.setAttribute('transform', 'translate(' + mx.toFixed(1) + ',' + my.toFixed(1) + ')');

      var Hs = wickeln((t - 12) * 15), Hm = wickeln((t - 12) * 15 - E);
      var mondOben = Math.abs(Hm) <= 90;
      blick.setAttribute('x1', ox); blick.setAttribute('y1', oy);
      blick.setAttribute('x2', mx); blick.setAttribute('y2', my);
      blick.setAttribute('visibility', mondOben ? 'visible' : 'hidden');

      aufBogen(sonneH, Hs);
      aufBogen(mondH, Hm);
      var p = window.MondSim.phasePfad(E, 11);
      mondHell.setAttribute('d', p.d);
      mondHell.setAttribute('transform', p.spiegeln ? 'scale(-1,1)' : '');

      var hellig = Math.max(0, Math.min(1, (Math.cos(rad(Hs)) + 0.12) / 0.35));
      himmel.setAttribute('fill', mischen([20, 26, 48], [120, 170, 215], hellig));

      uhrText.textContent = uhr(t) + ' Uhr';
      unten.querySelector('[data-w=sonne]').textContent = lage(Hs);
      var m = lage(Hm);
      if (E < 8 || E > 352) m += mondOben ? ' (als Neumond unsichtbar)' : '';
      unten.querySelector('[data-w=mond]').textContent = m;
      regler.value = t;
      phasenKnoepfe.forEach(function (k) {
        k.style.borderColor = parseFloat(k.getAttribute('data-e')) === E ? 'var(--akzent)' : '';
      });
    }

    function stopp() {
      if (timer) { clearInterval(timer); timer = null; lauf.textContent = '▶ Erde drehen'; }
    }
    regler.addEventListener('input', function () { stopp(); t = parseFloat(regler.value); zeichne(); });
    lauf.addEventListener('click', function () {
      if (timer) return stopp();
      lauf.textContent = '❚❚ Anhalten';
      timer = setInterval(function () { t = (t + 0.1) % 24; zeichne(); }, 60);
    });
    phasenKnoepfe.forEach(function (k) {
      k.addEventListener('click', function () { E = parseFloat(k.getAttribute('data-e')); zeichne(); });
    });

    zeichne();
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-horizont-sim]'), simulator);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
