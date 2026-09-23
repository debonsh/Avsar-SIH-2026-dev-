// Quiz component — vanilla JS, dark-theme aware
// Usage: <div class="quiz" data-quiz='{"q":"...","opts":["a","b","c"],"ans":0,"why":"..."}'></div>
// Or batch-load via the API below.

(function () {
  function pick(opts, root) {
    opts.forEach((label, i) => {
      const el = document.createElement('button');
      el.className = 'opt';
      el.textContent = label;
      el.onclick = () => answer(i, el, root);
      root.querySelector('.opts').appendChild(el);
    });
  }

  function answer(idx, el, root) {
    const ans = parseInt(root.dataset.ans, 10);
    const why = root.dataset.why || '';
    const fb = root.querySelector('.feedback');
    const all = root.querySelectorAll('.opt');
    if (idx === ans) {
      el.classList.add('correct');
      fb.className = 'feedback show good';
      fb.textContent = '✓ Correct. ' + why;
    } else {
      el.classList.add('wrong');
      all[ans].classList.add('correct');
      fb.className = 'feedback show bad';
      fb.textContent = '✗ Not quite. Correct answer is highlighted. ' + why;
    }
    all.forEach(b => b.disabled = true);
    b => b.style.pointerEvents = 'none';
  }

  function init() {
    document.querySelectorAll('[data-quiz]').forEach(root => {
      const data = JSON.parse(root.dataset.quiz);
      root.innerHTML = '<div class="q">' + data.q + '</div><div class="opts"></div><div class="feedback"></div>';
      pick(data.opts, root);
      root.dataset.ans = data.ans;
      root.dataset.why = data.why;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
