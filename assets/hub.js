/*
 * Light/dark theme. Load it in <head> with a plain <script src> (no defer, no async) so the
 * stored choice is applied before the first paint:
 *
 *   <script src="assets/hub.js"></script>
 *   ...
 *   <button type="button" class="theme-toggle" data-theme-toggle>Dark</button>
 *
 * With no stored choice the page follows the system setting (CSS media query).
 * A click stores "light" or "dark" for every page of the hub and for later visits.
 * Storage errors (private windows, blocked storage) are ignored: the toggle still works
 * for the current page. Printing always uses the light colours (see hub.css).
 */
(function () {
  var KEY = 'learn-hub-theme';
  var root = document.documentElement;

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* keep working without storage */ }
  }
  function systemDark() {
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }
  function current() {
    var chosen = root.getAttribute('data-theme');
    if (chosen === 'light' || chosen === 'dark') return chosen;
    return systemDark() ? 'dark' : 'light';
  }

  var stored = read();
  if (stored === 'light' || stored === 'dark') root.setAttribute('data-theme', stored);

  function label() {
    var dark = current() === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.textContent = dark ? '☀ Light' : '☾ Dark';
      b.setAttribute('aria-label', dark ? 'Switch to the light theme' : 'Switch to the dark theme');
      b.setAttribute('title', dark ? 'Switch to the light theme' : 'Switch to the dark theme');
    });
  }

  function toggle() {
    var next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    write(next);
    label();
  }

  function bind() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
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
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', label);
  } catch (e) { /* old browsers: label stays as it is */ }

  // Another tab changed the choice.
  window.addEventListener('storage', function (ev) {
    if (ev.key !== KEY) return;
    if (ev.newValue === 'light' || ev.newValue === 'dark') root.setAttribute('data-theme', ev.newValue);
    else root.removeAttribute('data-theme');
    label();
  });

  window.Theme = { current: current, toggle: toggle };
})();
