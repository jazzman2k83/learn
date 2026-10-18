/* Umlauf-Simulator: Warum eine Runde (27,3 Tage) noch kein Phasenzyklus (29,5 Tage) ist.
 *
 *   <div class="mond-sim" data-umlauf-sim data-tag="0"></div>
 *
 * Draufsicht: Die Erde wandert auf ihrer Bahn um die Sonne (links unten), der Mond
 * läuft um die Erde. Die gestrichelte weiße Linie zeigt von der Erde immer in dieselbe
 * Richtung zu einem fernen Stern, die gelbe Linie zur Sonne. Start ist ein Neumond.
 * Winkel und Zeiten sind echt, Abstände und Größen nicht.
 *
 * Braucht assets/mond-sim.js (MondSim.phasePfad, MondSim.phasenName) und kurs.css.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var SIDERISCH = 27.32166, SYNODISCH = 29.53059, JAHR = 365.25; // Tage (NASA)

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
  function komma(x, n) { return x.toFixed(n).replace('.', ','); }

  function simulator(wurzel) {
    var SX = 70, SY = 300, RB = 390, RM = 70, PX = 125, PY = 88, PR = 38;
    var d = parseFloat(wurzel.getAttribute('data-tag')) || 0;
    var timer = null;

    function erdeBei(tag) {
      var a = rad(360 * tag / JAHR);
      return { x: SX + RB * Math.cos(a), y: SY - RB * Math.sin(a) };
    }

    var svg = el('svg', { viewBox: '0 0 640 400', role: 'img',
      'aria-label': 'Erde auf ihrer Bahn um die Sonne, Mond auf seiner Bahn um die Erde' }, wurzel);
    el('rect', { width: 640, height: 400, rx: 6, 'class': 'weltraum' }, svg);

    // Erdbahn (Ausschnitt)
    var b0 = erdeBei(-8), b1 = erdeBei(48);
    el('path', { d: 'M' + b0.x + ',' + b0.y + ' A' + RB + ',' + RB + ' 0 0 0 ' + b1.x + ',' + b1.y, 'class': 'bahn' }, svg);
    text('Bahn der Erde', { x: 372, y: 52, 'text-anchor': 'end' }, svg);

    el('circle', { cx: SX, cy: SY, r: 24, fill: 'var(--sonne)' }, svg);
    text('Sonne', { x: SX, y: SY + 44, 'text-anchor': 'middle' }, svg);

    // Startstellung als blasse Erinnerung
    var e0 = erdeBei(0);
    var start = el('g', { opacity: 0.35 }, svg);
    el('circle', { cx: e0.x, cy: e0.y, r: 13, 'class': 'erde-tag' }, start);
    el('circle', { cx: e0.x - RM, cy: e0.y, r: 8, 'class': 'dunkel' }, start);
    el('circle', { cx: e0.x - RM, cy: e0.y, r: 8, 'class': 'rand' }, start);
    text('Start: Neumond', { x: e0.x + 20, y: e0.y + 30, opacity: 0.6 }, svg);

    var zurSonne = el('line', { stroke: 'var(--sonne)', 'stroke-width': 1.2, opacity: 0.8 }, svg);
    var zumStern = el('line', { stroke: '#e9e5da', 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }, svg);
    var stern = text('★', { 'text-anchor': 'middle', style: 'font-size:15px;fill:#fff' }, svg);
    var sternText = text('zum fernen Stern', { 'text-anchor': 'middle' }, svg);
    var mondbahn = el('circle', { r: RM, 'class': 'bahn' }, svg);

    var erde = el('g', {}, svg);
    el('circle', { r: 13, 'class': 'erde-nacht' }, erde);
    el('path', { d: 'M0,-13 A13,13 0 0 0 0,13Z', 'class': 'erde-tag' }, erde);
    var mond = el('g', {}, svg);
    el('circle', { r: 9, 'class': 'dunkel' }, mond);
    el('path', { d: 'M0,-9 A9,9 0 0 0 0,9Z', 'class': 'hell' }, mond);

    // Anblick von der Erde
    text('So siehst du ihn', { x: PX, y: 28, 'text-anchor': 'middle', 'class': 'titel' }, svg);
    el('circle', { cx: PX, cy: PY, r: PR, 'class': 'dunkel' }, svg);
    var hell = el('path', { 'class': 'hell' }, svg);
    el('circle', { cx: PX, cy: PY, r: PR, 'class': 'rand' }, svg);
    var name = text('', { x: PX, y: PY + PR + 22, 'text-anchor': 'middle' }, svg);

    var unten = document.createElement('div');
    unten.innerHTML =
      '<div class="regler"><span>Springe zu:</span>' +
      '<button type="button" data-d="0">Tag 0</button>' +
      '<button type="button" data-d="' + SIDERISCH + '">Tag 27,3</button>' +
      '<button type="button" data-d="' + SYNODISCH + '">Tag 29,5</button></div>' +
      '<div class="regler"><span>Zeit:</span>' +
      '<input type="range" min="0" max="32" step="0.05" aria-label="Vergangene Tage">' +
      '<button type="button" data-lauf>▶ Laufen lassen</button></div>' +
      '<div class="werte">' +
      '<div><span>Vergangene Tage</span><b data-w="tag"></b></div>' +
      '<div><span>Runde um die Erde</span><b data-w="runde"></b></div>' +
      '<div><span>Phasenzyklus</span><b data-w="phase"></b></div>' +
      '<div><span>Erde gewandert</span><b data-w="erde"></b></div></div>' +
      '<p class="sichtbar"></p>';
    wurzel.appendChild(unten);
    var regler = unten.querySelector('input');
    var lauf = unten.querySelector('[data-lauf]');
    var hinweis = unten.querySelector('.sichtbar');
    function wert(k) { return unten.querySelector('[data-w=' + k + ']'); }
    function anteil(x) { return x >= 0.9995 ? '✓ geschafft' : Math.floor(x * 100) + ' %'; }

    function zeichne() {
      var te = 360 * d / JAHR;                 // Winkel der Erde um die Sonne
      var tm = 180 + 360 * d / SIDERISCH;      // Richtung Erde→Mond, gemessen an den Sternen
      var E = ((360 * d / SYNODISCH) % 360 + 360) % 360;
      var e = erdeBei(d);
      var mx = e.x + RM * Math.cos(rad(tm)), my = e.y - RM * Math.sin(rad(tm));
      var beleuchtung = 'rotate(' + (-te) + ')';

      erde.setAttribute('transform', 'translate(' + e.x.toFixed(1) + ',' + e.y.toFixed(1) + ') ' + beleuchtung);
      mond.setAttribute('transform', 'translate(' + mx.toFixed(1) + ',' + my.toFixed(1) + ') ' + beleuchtung);
      mondbahn.setAttribute('cx', e.x); mondbahn.setAttribute('cy', e.y);
      zurSonne.setAttribute('x1', e.x); zurSonne.setAttribute('y1', e.y);
      zurSonne.setAttribute('x2', SX); zurSonne.setAttribute('y2', SY);
      zumStern.setAttribute('x1', e.x); zumStern.setAttribute('y1', e.y);
      zumStern.setAttribute('x2', e.x - 150); zumStern.setAttribute('y2', e.y);
      stern.setAttribute('x', e.x - 160); stern.setAttribute('y', e.y + 5);
      sternText.setAttribute('x', e.x - 160); sternText.setAttribute('y', e.y - 12);

      var p = window.MondSim.phasePfad(E, PR);
      hell.setAttribute('d', p.d);
      hell.setAttribute('transform', 'translate(' + PX + ',' + PY + ')' + (p.spiegeln ? ' scale(-1,1)' : ''));
      name.textContent = window.MondSim.phasenName(E);

      wert('tag').textContent = komma(d, 1);
      wert('runde').textContent = anteil(d / SIDERISCH);
      wert('phase').textContent = anteil(d / SYNODISCH);
      wert('erde').textContent = Math.round(te) + '°';

      var satz = 'Die weiße Linie zeigt immer zum selben Stern, die gelbe immer zur Sonne.';
      if (d < 0.2) satz = 'Neumond: Der Mond steht genau zwischen Erde und Sonne. Stern und Sonne liegen in derselben Richtung.';
      else if (Math.abs(d - SIDERISCH) < 0.2) satz = 'Eine Runde ist geschafft: Der Mond steht wieder vor demselben Stern. Aber die Sonne steht jetzt woanders – noch kein Neumond.';
      else if (d > SIDERISCH && d < SYNODISCH - 0.2) satz = 'Der Mond muss der Sonnenrichtung noch hinterherlaufen …';
      else if (Math.abs(d - SYNODISCH) < 0.2) satz = 'Jetzt erst steht der Mond wieder zwischen Erde und Sonne: Neumond. Der Phasenzyklus ist komplett.';
      hinweis.textContent = satz;
      regler.value = d;
    }

    function stopp() {
      if (timer) { clearInterval(timer); timer = null; lauf.textContent = '▶ Laufen lassen'; }
    }
    regler.addEventListener('input', function () { stopp(); d = parseFloat(regler.value); zeichne(); });
    lauf.addEventListener('click', function () {
      if (timer) return stopp();
      if (d >= 31.9) d = 0;
      lauf.textContent = '❚❚ Anhalten';
      timer = setInterval(function () {
        d = Math.min(32, d + 0.1);
        zeichne();
        if (d >= 32) stopp();
      }, 50);
    });
    Array.prototype.forEach.call(unten.querySelectorAll('[data-d]'), function (k) {
      k.addEventListener('click', function () { stopp(); d = parseFloat(k.getAttribute('data-d')); zeichne(); });
    });

    zeichne();
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-umlauf-sim]'), simulator);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
