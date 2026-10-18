/*
 * Light/dark theme for the landing page and every course page of the hub. Load it first
 * in <head> with a plain <script src> (no defer, no async) so the stored choice is applied
 * before the first paint; tools/harmonize.py does this for every course page:
 *
 *   <script src="assets/hub.js"></script>
 *   ...
 *   <button type="button" class="theme-toggle" data-learn-theme>Dark</button>
 *
 * With no stored choice the page follows the system setting (CSS media query).
 * A click stores "light" or "dark" for every page of the hub and for later visits.
 * Storage errors (private windows, blocked storage) are ignored: the toggle still works
 * for the current page. Printing always uses the light colours (see the stylesheets).
 *
 * Courses may bring their own theme script. So that one choice holds everywhere:
 * - a change of data-theme on <html> by another script is undone, and
 * - matchMedia('(prefers-color-scheme: dark)') answers with the chosen theme, so scripts
 *   that pick colours (canvas, SVG) follow the toggle too.
 */
(function () {
  var KEY = 'learn-hub-theme';
  var QUERY = /prefers-color-scheme\s*:\s*dark/i;
  var root = document.documentElement;
  var realMatchMedia = window.matchMedia ? window.matchMedia.bind(window) : null;
  var german = /^de\b/i.test(root.lang || '');

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* keep working without storage */ }
  }
  function systemDark() {
    try { return realMatchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }

  var chosen = read();
  if (chosen !== 'light' && chosen !== 'dark') chosen = null;

  function current() {
    return chosen || (systemDark() ? 'dark' : 'light');
  }

  function apply() {
    if (chosen) { if (root.getAttribute('data-theme') !== chosen) root.setAttribute('data-theme', chosen); }
    else if (root.hasAttribute('data-theme')) root.removeAttribute('data-theme');
  }
  apply();

  // Keep the hub's choice if a course script sets data-theme on its own.
  try {
    new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  } catch (e) { /* old browsers: the course script may win */ }

  if (realMatchMedia) {
    window.matchMedia = function (query) {
      var real = realMatchMedia(query);
      if (!chosen || !QUERY.test(String(query))) return real;
      return {
        matches: chosen === 'dark', media: real.media, onchange: null,
        addEventListener: function () {}, removeEventListener: function () {},
        addListener: function () {}, removeListener: function () {},
        dispatchEvent: function () { return false; }
      };
    };
  }

  function label() {
    var dark = current() === 'dark';
    var text = german ? (dark ? '☀ Hell' : '☾ Dunkel') : (dark ? '☀ Light' : '☾ Dark');
    var hint = german ? (dark ? 'Zum hellen Design wechseln' : 'Zum dunklen Design wechseln')
                      : (dark ? 'Switch to the light theme' : 'Switch to the dark theme');
    document.querySelectorAll('[data-learn-theme]').forEach(function (b) {
      b.textContent = text;
      b.setAttribute('aria-label', hint);
      b.setAttribute('title', hint);
    });
  }

  function toggle() {
    chosen = current() === 'dark' ? 'light' : 'dark';
    write(chosen);
    apply();
    label();
    // Pages that draw with JS re-read the theme on reload; tell them it changed.
    try { window.dispatchEvent(new CustomEvent('learn-theme-change', { detail: chosen })); } catch (e) {}
  }

  function bind() {
    document.querySelectorAll('[data-learn-theme]').forEach(function (b) {
      if (b.dataset.themeBound) return;
      b.dataset.themeBound = '1';
      b.addEventListener('click', toggle);
    });
    label();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();

  // Follow a system change while no choice is stored.
  try {
    realMatchMedia('(prefers-color-scheme: dark)').addEventListener('change', label);
  } catch (e) { /* old browsers: label stays as it is */ }

  // Another tab changed the choice.
  window.addEventListener('storage', function (ev) {
    if (ev.key !== KEY) return;
    chosen = (ev.newValue === 'light' || ev.newValue === 'dark') ? ev.newValue : null;
    apply();
    label();
  });

  window.Theme = { current: current, toggle: toggle };
})();
