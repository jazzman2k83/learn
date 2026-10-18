/* Quiz-Komponente.
 *
 * Markup:
 *   <div class="quiz">
 *     <p class="frage">Frage?</p>
 *     <div class="optionen">
 *       <button>Falsche Antwort</button>
 *       <button data-richtig>Richtige Antwort</button>
 *     </div>
 *     <p class="erklaerung">Wird nach dem Antworten eingeblendet.</p>
 *   </div>
 *
 * Optional irgendwo auf der Seite: <p class="quiz-stand" data-quiz-stand></p>
 * Regel für Autoren: alle Optionen einer Frage haben gleich viele Wörter.
 */
(function () {
  function init() {
    var quizze = Array.prototype.slice.call(document.querySelectorAll('.quiz'));
    var stand = document.querySelector('[data-quiz-stand]');
    var richtig = 0, beantwortet = 0;

    function zeigeStand() {
      if (!stand) return;
      stand.textContent = beantwortet === 0
        ? quizze.length + ' Fragen. Erst überlegen, dann klicken – jede Frage zählt nur einmal.'
        : richtig + ' von ' + beantwortet + ' richtig' +
          (beantwortet === quizze.length ? ' – fertig. Sag deinem Lehrer (Claude) das Ergebnis und was dich überrascht hat.' : '.');
    }

    quizze.forEach(function (quiz) {
      var knoepfe = Array.prototype.slice.call(quiz.querySelectorAll('.optionen button'));
      knoepfe.forEach(function (knopf) {
        knopf.addEventListener('click', function () {
          var treffer = knopf.hasAttribute('data-richtig');
          knoepfe.forEach(function (k) {
            k.disabled = true;
            if (k.hasAttribute('data-richtig')) k.classList.add('richtig');
          });
          if (!treffer) knopf.classList.add('falsch');
          quiz.classList.add('beantwortet');
          beantwortet++;
          if (treffer) richtig++;
          zeigeStand();
        });
      });
    });
    zeigeStand();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
