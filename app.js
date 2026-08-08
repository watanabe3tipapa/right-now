(function () {
  "use strict";

  const screens = document.querySelectorAll(".screen");
  let current = "hero";
  let quizIndex = 0;
  let answers = new Array(QUESTIONS.length).fill(0.5);

  const $ = (id) => document.getElementById(id);

  function show(name) {
    screens.forEach((s) => s.classList.toggle("active", s.id === "screen-" + name));
    current = name;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 時計
  function tick() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    $("clock").textContent = p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }
  setInterval(tick, 1000);
  tick();

  // ヒーロー波
  (function heroWave() {
    const c = $("hero-canvas");
    function draw() { Graph.drawHeroWave(c); }
    draw();
    setInterval(draw, 50);
  })();

  // 開始
  $("btn-start").addEventListener("click", () => {
    quizIndex = 0;
    show("quiz");
    renderQuiz();
  });

  // 質問
  function renderQuiz() {
    const q = QUESTIONS[quizIndex];
    $("quiz-index").textContent = String(quizIndex + 1).padStart(2, "0");
    $("quiz-total").textContent = String(QUESTIONS.length).padStart(2, "0");
    $("progress-fill").style.width = ((quizIndex + 1) / QUESTIONS.length * 100) + "%";
    $("quiz-label").textContent = q.label;
    $("quiz-question").textContent = q.question;
    $("quiz-min").textContent = q.min;
    $("quiz-max").textContent = q.max;
    const v = Math.round(answers[quizIndex] * 100);
    $("quiz-slider").value = v;
    $("quiz-value").textContent = v;
    $("btn-prev").style.visibility = quizIndex === 0 ? "hidden" : "visible";
    $("btn-next").textContent = quizIndex === QUESTIONS.length - 1 ? "計測完了" : "次へ";
  }

  $("quiz-slider").addEventListener("input", (e) => {
    answers[quizIndex] = Number(e.target.value) / 100;
    $("quiz-value").textContent = e.target.value;
  });

  $("btn-prev").addEventListener("click", () => {
    if (quizIndex > 0) { quizIndex--; renderQuiz(); }
  });

  $("btn-next").addEventListener("click", () => {
    if (quizIndex < QUESTIONS.length - 1) {
      quizIndex++;
      renderQuiz();
    } else {
      const seed = seedFromAnswers(answers);
      beginGeneration(answers, seed);
    }
  });

  // シード生成（決定論的）
  function hashFnv(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function seedFromAnswers(arr) {
    const key = arr.map((v) => Math.round(v * 100).toString(36)).join("");
    return hashFnv(key);
  }

  // 生成
  function beginGeneration(values, seed) {
    show("anim");
    Anim.start($("anim-canvas"), values, seed, () => {
      renderResult(values, seed);
    });
  }

  // 結果
  function renderResult(values, seed) {
    show("result");
    Graph.drawGraph($("graph-canvas"), values, seed);
    Fractal.drawFractal($("fractal-canvas"), values, seed);
    $("result-seed").textContent = "SEED-" + seed.toString(16).toUpperCase().padStart(8, "0");
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }

  // 再計測
  $("btn-reload").addEventListener("click", () => {
    answers = new Array(QUESTIONS.length).fill(0.5);
    quizIndex = 0;
    renderQuiz();
    show("quiz");
  });

  // URL共有（ハッシュに回答を埋め込む）
  $("btn-share").addEventListener("click", () => {
    const arr = answers.map((v) => Math.round(v * 100));
    const url = location.origin + location.pathname + "#" + arr.join("-");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => { $("share-msg").textContent = "URLをコピーしました"; },
        () => fallbackCopy(url)
      );
    } else {
      fallbackCopy(url);
    }
  });

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); $("share-msg").textContent = "URLをコピーしました"; }
    catch (e) { $("share-msg").textContent = "URL: " + text; }
    document.body.removeChild(ta);
  }

  // 共有URLからの復元
  (function loadFromHash() {
    const m = location.hash.match(/#([0-9-]+)/);
    if (!m) return;
    const parts = m[1].split("-").map(Number);
    if (parts.length === QUESTIONS.length && parts.every((n) => n >= 0 && n <= 100)) {
      answers = parts.map((n) => n / 100);
      const seed = seedFromAnswers(answers);
      beginGeneration(answers, seed);
    }
  })();

  // リサイズ
  window.addEventListener("resize", () => {
    if (current === "result") {
      Graph.drawGraph($("graph-canvas"), answers, seedFromAnswers(answers));
      Fractal.drawFractal($("fractal-canvas"), answers, seedFromAnswers(answers));
    }
  });
})();
