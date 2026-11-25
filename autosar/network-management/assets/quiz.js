/*
 * Quiz component. Usage:
 *
 *   <div id="quiz"></div>
 *   <script src="../assets/quiz.js"></script>
 *   <script>
 *     Quiz.mount(document.getElementById('quiz'), [
 *       { prompt: 'Question?', options: ['right', 'wrong', 'wrong'], answer: 0, why: 'Explanation.' }
 *     ]);
 *   </script>
 *
 * Options are shuffled on load. `prompt` and `why` may contain HTML; options are plain text.
 * Keep every option of a question the same length so formatting gives nothing away.
 */
(function () {
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mount(root, questions) {
    root.classList.add('quiz');
    let answered = 0;
    let correct = 0;
    const score = document.createElement('p');
    score.className = 'score';
    score.setAttribute('aria-live', 'polite');

    questions.forEach((q, qi) => {
      const box = document.createElement('div');
      box.className = 'q';
      const prompt = document.createElement('p');
      prompt.className = 'prompt';
      prompt.innerHTML = '<strong>' + (qi + 1) + '.</strong> ' + q.prompt;
      const opts = document.createElement('div');
      opts.className = 'opts';
      const why = document.createElement('p');
      why.className = 'why';
      why.setAttribute('aria-live', 'polite');

      const order = shuffle(q.options.map((_, i) => i));
      const buttons = order.map((oi) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = q.options[oi];
        b.addEventListener('click', () => {
          const ok = oi === q.answer;
          buttons.forEach((x, k) => {
            x.disabled = true;
            if (order[k] === q.answer) x.classList.add('right');
          });
          if (!ok) b.classList.add('wrong');
          why.innerHTML = (ok ? '<strong>Correct.</strong> ' : '<strong>Not quite.</strong> ') + (q.why || '');
          answered++;
          if (ok) correct++;
          score.textContent = 'Score: ' + correct + ' / ' + answered +
            (answered === questions.length ? ' (done)' : ' answered, ' + (questions.length - answered) + ' to go');
        });
        opts.appendChild(b);
        return b;
      });

      box.append(prompt, opts, why);
      root.appendChild(box);
    });
    root.appendChild(score);
  }

  window.Quiz = { mount };
})();
