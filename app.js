(function () {
  "use strict";

  const screens = document.querySelectorAll(".screen");
  let current = "hero";
  let quizIndex = 0;
  let answers = new Array(QUESTIONS.length).fill(0.5);
  let rorschachText = "";
  let rorschachIntensity = 0.5;
  let rorschachSeed = (Math.random() * 0xffffffff) >>> 0;

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
      newInkblot();
      show("rorschach");
    }
  });

  // ロールシャッハ
  function newInkblot() {
    rorschachSeed = (Math.random() * 0xffffffff) >>> 0;
    Rorschach.generateInkblot($("rorschach-canvas"), rorschachSeed);
    $("rorschach-text").value = rorschachText;
    const v = Math.round(rorschachIntensity * 100);
    $("rorschach-slider").value = v;
    $("rorschach-value").textContent = v;
  }
  $("btn-blot").addEventListener("click", newInkblot);
  $("btn-rorschach-prev").addEventListener("click", () => {
    quizIndex = QUESTIONS.length - 1;
    renderQuiz();
    show("quiz");
  });
  $("btn-rorschach-next").addEventListener("click", () => {
    const seed = seedFromAnswers(answers);
    beginGeneration(answers, seed);
  });
  $("rorschach-text").addEventListener("input", (e) => {
    rorschachText = e.target.value;
  });
  $("rorschach-slider").addEventListener("input", (e) => {
    rorschachIntensity = Number(e.target.value) / 100;
    $("rorschach-value").textContent = e.target.value;
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
    const key = arr.map((v) => Math.round(v * 100).toString(36)).join("") +
      ":" + Math.round(rorschachIntensity * 100).toString(36) + ":" + rorschachText;
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
    Fractal.drawFractal($("fractal-canvas"), values.concat([rorschachIntensity]), seed);
    $("result-seed").textContent = "SEED-" + seed.toString(16).toUpperCase().padStart(8, "0");
    const t = rorschachText.trim();
    $("rorschach-out").textContent = t
      ? `RORSCHACH // あなたが見えたもの：「${t}」 ／ 印象の強さ ${Math.round(rorschachIntensity * 100)}`
      : "";
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }

  // 再計測
  $("btn-reload").addEventListener("click", () => {
    answers = new Array(QUESTIONS.length).fill(0.5);
    rorschachText = "";
    rorschachIntensity = 0.5;
    quizIndex = 0;
    renderQuiz();
    show("quiz");
  });

  // ---- 合成画像（グラフ + フラクタル + キャプション） ----
  function buildResultImage() {
    const W = 1280, pad = 44, gap = 26;
    const panW = Math.floor((W - pad * 2 - gap) / 2);
    const panH = 620;
    const capH = 120;
    const H = pad * 2 + panH + capH;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    const g = $("graph-canvas"), f = $("fractal-canvas");
    const gx = pad, fx = pad + panW + gap, y = pad;

    // 背景
    ctx.fillStyle = "#05070b"; ctx.fillRect(0, 0, W, H);

    // パネル枠 + 内容
    for (const px of [gx, fx]) {
      ctx.strokeStyle = "#1b2b40"; ctx.lineWidth = 2;
      ctx.strokeRect(px, y, panW, panH);
    }
    function blit(src, dx) {
      ctx.save();
      ctx.beginPath(); ctx.rect(dx, y, panW, panH); ctx.clip();
      ctx.drawImage(src, dx, y, panW, panH);
      ctx.restore();
    }
    blit(g, gx); blit(f, fx);

    // パネル見出し
    ctx.font = "600 20px SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "#6b7f96";
    ctx.fillText("WAVEFORM // 波形", gx + 16, y + 34);
    ctx.fillText("GEOMETRIC // フラクタル", fx + 16, y + 34);

    // キャプション
    const now = new Date();
    const pad2 = (n) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
    const cy = pad + panH + 46;
    ctx.font = "600 26px SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "#eef7ff";
    ctx.fillText(`RIGHT NOW // ${ts}`, gx, cy);
    ctx.fillStyle = "#39d0ff";
    ctx.fillText("SEED " + $("result-seed").textContent, fx, cy);
    const t = rorschachText.trim();
    if (t) {
      ctx.font = "20px SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = "#7dfa9a";
      ctx.fillText(`RORSCHACH //「${t}」 強さ ${Math.round(rorschachIntensity * 100)}`, gx, cy + 38);
    }
    return { canvas: c, ts };
  }

  // ---- PNG ダウンロード（タイムスタンプ付き） ----
  $("btn-download").addEventListener("click", () => {
    const { canvas, ts } = buildResultImage();
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `right-now_${ts}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    $("share-msg").textContent = "画像を保存しました（PNG）";
  });

  // ---- LocalStorage 保存 + QR コード共有 ----
  function storeResultImage() {
    const { canvas } = buildResultImage();
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    try {
      localStorage.setItem("rn:img:" + token, canvas.toDataURL("image/png"));
      return token;
    } catch (e) {
      return null;
    }
  }
  $("btn-qr").addEventListener("click", () => {
    const token = storeResultImage();
    if (!token) { $("share-msg").textContent = "LocalStorageに保存できませんでした"; return; }
    const url = location.origin + location.pathname + "?img=" + token;
    $("qr-url").textContent = url;
    if (typeof QRCode !== "undefined") {
      QRCode.toCanvas($("qr-canvas"), url, { width: 220, margin: 2 }, (err) => {
        if (err) $("qr-url").textContent = "QR生成失敗: " + err;
      });
    } else {
      $("qr-url").textContent = "(QRライブラリ未読込) " + url;
    }
    $("qr-modal").classList.add("open");
    $("share-msg").textContent = "";
  });
  $("qr-close").addEventListener("click", () => $("qr-modal").classList.remove("open"));
  $("qr-modal").addEventListener("click", (e) => { if (e.target === $("qr-modal")) $("qr-modal").classList.remove("open"); });

  // ---- 保存画像の復元（?img=token） ----
  (function loadFromQuery() {
    const p = new URLSearchParams(location.search);
    const token = p.get("img");
    if (!token) return;
    const data = localStorage.getItem("rn:img:" + token);
    if (!data) return;
    const img = $("lightbox-img");
    img.src = data;
    $("lightbox-dl").href = data;
    $("lightbox").classList.add("open");
  })();
  $("lightbox-close").addEventListener("click", () => $("lightbox").classList.remove("open"));
  $("lightbox").addEventListener("click", (e) => { if (e.target === $("lightbox")) $("lightbox").classList.remove("open"); });

  // URL共有（ハッシュに回答を埋め込む）
  $("btn-share").addEventListener("click", () => {
    const arr = answers.map((v) => Math.round(v * 100));
    arr.push(Math.round(rorschachIntensity * 100));
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
    const n = QUESTIONS.length;
    const ok = (parts.length === n || parts.length === n + 1) &&
      parts.every((x) => x >= 0 && x <= 100);
    if (!ok) return;
    if (parts.length === n + 1) rorschachIntensity = parts[n] / 100;
    answers = parts.slice(0, n).map((x) => x / 100);
    beginGeneration(answers, seedFromAnswers(answers));
  })();

  // リサイズ
  window.addEventListener("resize", () => {
    if (current === "result") {
      Graph.drawGraph($("graph-canvas"), answers, seedFromAnswers(answers));
      Fractal.drawFractal($("fractal-canvas"), answers.concat([rorschachIntensity]), seedFromAnswers(answers));
    }
  });
})();
