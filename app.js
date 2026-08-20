(function () {
  "use strict";

  const screens = document.querySelectorAll(".screen");
  let current = "hero";
  let quizIndex = 0;
  let answers = new Array(QUESTIONS.length).fill(0.5);
  let rorschachTexts = ["", "", ""];                    // 3枚のロールシャッハ解釈
  let rorschachIntensities = [0.5, 0.5, 0.5];           // 各図形の印象強度
  let rorschachSeeds = [
    (Math.random() * 0xffffffff) >>> 0,
    (Math.random() * 0xffffffff) >>> 0,
    (Math.random() * 0xffffffff) >>> 0,
  ];
  const RORSCHACH_COUNT = 3;
  const RORSCHACH_TITLES = ["羽を広げた蝶", "燃える街", "沈む月"];
  let rorschachIndex = 0;

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

    // キーボードショートカット（クイズ/ロールシャッハ）
  document.addEventListener("keydown", (e) => {
    const tag = e.target && e.target.tagName;
    const isRorschach = current === "rorschach";
    const isQuiz = current === "quiz";
    if (!isQuiz && !isRorschach) return;

    // ロールシャッハ textarea 内: Enter=改行 / Cmd+Enter=次へ / Esc=戻る
    if (isRorschach && tag === "TEXTAREA") {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        $("btn-rorschach-next").click();
      } else if (e.key === "Escape") {
        e.preventDefault();
        $("btn-rorschach-prev").click();
      }
      return;
    }
    // 数値直接入力内: Enter=次へ / 数字は入力へ
    if (tag === "INPUT" && e.target.id === "quiz-value") {
      if (e.key === "Enter") { e.preventDefault(); $("btn-next").click(); }
      return;
    }
    // ボタン/その他入力フォーカス中はネイティブ動作を優先
    if (tag === "BUTTON") return;
    if (tag === "INPUT" && e.target.type !== "range") return;

    if (e.key === "Enter") {
      e.preventDefault();
      if (isRorschach) $("btn-rorschach-next").click();
      else $("btn-next").click();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (isRorschach) $("btn-rorschach-prev").click();
      else $("btn-prev").click();
    } else if (e.key >= "0" && e.key <= "9") {
      const v = e.key === "0" ? 100 : Number(e.key) * 10;
      e.preventDefault();
      if (isRorschach) setRorschachValue(v);
      else {
        answers[quizIndex] = v / 100;
        $("quiz-slider").value = v;
        $("quiz-value").value = v;
        highlightChip(v);
      }
    }
  });

  // 開始
  $("btn-start").addEventListener("click", () => {
    quizIndex = 0;
    show("quiz");
    renderQuiz();
  });

  // 質問
  function highlightChip(v) {
    document.querySelectorAll("#quiz-chips .chip").forEach((b) => b.classList.toggle("active", Number(b.dataset.v) === v));
  }
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
    $("quiz-value").value = v;
    highlightChip(v);
    $("btn-prev").style.visibility = quizIndex === 0 ? "hidden" : "visible";
    $("btn-next").textContent = quizIndex === QUESTIONS.length - 1 ? "計測完了" : "次へ";
  }

  $("quiz-slider").addEventListener("input", (e) => {
    answers[quizIndex] = Number(e.target.value) / 100;
    $("quiz-value").value = e.target.value;
    highlightChip(Number(e.target.value));
  });

  // 数値直接入力
  $("quiz-value").addEventListener("input", (e) => {
    const v = Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0)));
    answers[quizIndex] = v / 100;
    $("quiz-slider").value = v;
    highlightChip(v);
  });
  $("quiz-value").addEventListener("blur", () => {
    $("quiz-value").value = Math.round(answers[quizIndex] * 100);
  });

  // クイック値チップ
  $("quiz-chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    const v = Number(b.dataset.v);
    answers[quizIndex] = v / 100;
    $("quiz-slider").value = v;
    $("quiz-value").value = v;
    highlightChip(v);
  });

  // スケール直クリック
  $("quiz-scale").addEventListener("click", (e) => {
    const rect = $("quiz-slider").getBoundingClientRect();
    const v = Math.max(0, Math.min(100, Math.round((e.clientX - rect.left) / rect.width * 100)));
    answers[quizIndex] = v / 100;
    $("quiz-slider").value = v;
    $("quiz-value").value = v;
    highlightChip(v);
  });

  $("btn-prev").addEventListener("click", () => {
    if (quizIndex > 0) { quizIndex--; renderQuiz(); }
  });

  $("btn-next").addEventListener("click", () => {
    if (quizIndex < QUESTIONS.length - 1) {
      quizIndex++;
      renderQuiz();
    } else {
      rorschachIndex = 0;
      renderInkblot();
      show("rorschach");
    }
  });

  // ロールシャッハ（3枚）
  function renderInkblot() {
    $("rorschach-label").textContent =
      "INPUT 0" + (6 + rorschachIndex) + " // RORSCHACH PROJECTION (" + String(rorschachIndex + 1) + "/" + RORSCHACH_COUNT + ")";
    $("rorschach-index").textContent = String(rorschachIndex + 1).padStart(2, "0");
    $("rorschach-fill").style.width = ((rorschachIndex + 1) / RORSCHACH_COUNT * 100) + "%";
    Rorschach.generateInkblot($("rorschach-canvas"), rorschachSeeds[rorschachIndex]);
    $("rorschach-text").value = rorschachTexts[rorschachIndex];
    const v = Math.round(rorschachIntensities[rorschachIndex] * 100);
    $("rorschach-slider").value = v;
    $("rorschach-value").textContent = v;
    $("btn-rorschach-next").textContent =
      rorschachIndex === RORSCHACH_COUNT - 1 ? "計測へ進む" : "次の図形へ";
    if (!isTouch()) $("rorschach-text").focus({ preventScroll: true });
  }
  function setRorschachValue(v) {
    rorschachIntensities[rorschachIndex] = v / 100;
    $("rorschach-slider").value = v;
    $("rorschach-value").textContent = v;
  }
  function isTouch() {
    return window.matchMedia && window.matchMedia("(hover: none)").matches;
  }
  function newInkblot() {
    rorschachSeeds[rorschachIndex] = (Math.random() * 0xffffffff) >>> 0;
    Rorschach.generateInkblot($("rorschach-canvas"), rorschachSeeds[rorschachIndex]);
  }
  $("btn-blot").addEventListener("click", newInkblot);
  $("btn-rorschach-prev").addEventListener("click", () => {
    if (rorschachIndex > 0) { rorschachIndex--; renderInkblot(); }
    else { quizIndex = QUESTIONS.length - 1; renderQuiz(); show("quiz"); }
  });
  $("btn-rorschach-next").addEventListener("click", () => {
    if (rorschachIndex < RORSCHACH_COUNT - 1) {
      rorschachIndex++;
      renderInkblot();
    } else {
      const seed = seedFromAnswers(answers);
      beginGeneration(answers, seed);
    }
  });
  $("rorschach-text").addEventListener("input", (e) => {
    rorschachTexts[rorschachIndex] = e.target.value;
  });
  $("rorschach-slider").addEventListener("input", (e) => {
    rorschachIntensities[rorschachIndex] = Number(e.target.value) / 100;
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
  // 3枚のロールシャッハ強度 => 加算合成（上限1）
  function combinedIntensity() {
    return Math.min(1, rorschachIntensities.reduce((a, b) => a + b, 0));
  }
  function seedFromAnswers(arr) {
    const key = arr.map((v) => Math.round(v * 100).toString(36)).join("") +
      ":" + rorschachIntensities.map((v) => Math.round(v * 100).toString(36)).join("") +
      ":" + rorschachTexts.join("|");
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
  // 診断文
  function band(v) {
    if (v >= 0.65) return "high";
    if (v <= 0.35) return "low";
    return "mid";
  }
  const AXIS_LINES = {
    arousal: { high: "心は高揚しています。", low: "心は沈んでいます。", mid: "心は平穏です。" },
    anxiety: { high: "焦りが少し混じっています。", low: "心は穏やかです。", mid: "やや落ち着いています。" },
    fatigue: { high: "体は疲れています。", low: "体は元気です。", mid: "ほどほどに疲れています。" },
    focus: { high: "集中が利いています。", low: "頭は散漫です。", mid: "集中はほどほどです。" },
    openness: { high: "心は開いています。", low: "心は閉じています。", mid: "心は通り抜けて黙っています。" },
  };
  function generateVerdict(values) {
    const b = values.map(band);
    const [ar, an, fa, fo, op] = b;
    let headline;
    if (fa === "high" && ar === "low") headline = "バッテリー残りはわずか。休むのも計測のうち。";
    else if (an === "high" && fo === "low") headline = "集中音がキレています。波が乱れています。";
    else if (ar === "high" && fo === "high") headline = "フロー帯に入っています。この波に乗ろう。";
    else if (op === "high") headline = "窓が全開。外の匂いを吸い込んでいます。";
    else if (op === "low" && fa === "high") headline = "殻にこもったまま。外へ一歩が近道です。";
    else headline = "今を計るのに、正解はありません。ただ揺れています。";
    const lines = QUESTIONS.map((q, i) => AXIS_LINES[q.id][b[i]]);
    if (combinedIntensity() > 0.9) lines.push("ロールシャッハに強い印象。心が語りかけてきます。");
    return { headline, lines };
  }

  function renderResult(values, seed) {
    show("result");
    Graph.drawGraph($("graph-canvas"), values, seed);
    Fractal.drawFractal($("fractal-canvas"), values.concat([combinedIntensity()]), seed);
    $("result-seed").textContent = "SEED-" + seed.toString(16).toUpperCase().padStart(8, "0");
    drawRorschachOut();
    const v = generateVerdict(values);
    const verdict = $("verdict");
    if (verdict) verdict.innerHTML =
      '<span class="verdict-head">' + v.headline + '</span>' +
      '<span class="verdict-body">' + v.lines.join(" ") + '</span>';
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }

  // 3枚の解釈を結果に表示
  function drawRorschachOut() {
    const lines = [];
    for (let i = 0; i < RORSCHACH_COUNT; i++) {
      const t = rorschachTexts[i].trim();
      const s = Math.round(rorschachIntensities[i] * 100);
      const title = RORSCHACH_TITLES[i];
      lines.push(t
        ? `RORSCHACH ${i + 1} // ${title}: 「${t}」／強さ ${s}`
        : `RORSCHACH ${i + 1} // ${title}: （解釈なし）／強さ ${s}`);
    }
    $("rorschach-out").textContent = lines.join("\n");
  }

  // 再計測
  $("btn-reload").addEventListener("click", () => {
    answers = new Array(QUESTIONS.length).fill(0.5);
    rorschachTexts = ["", "", ""];
    rorschachIntensities = [0.5, 0.5, 0.5];
    quizIndex = 0;
    renderQuiz();
    show("quiz");
  });

  // ---- 合成画像（グラフ + フラクタル + キャプション） ----
  function buildResultImage() {
    const W = 1280, pad = 44, gap = 26;
    const panW = Math.floor((W - pad * 2 - gap) / 2);
    const panH = 620;
    const capH = 190;
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
    const t = rorschachTexts;
    ctx.font = "600 22px SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "#ffd58a";
    ctx.fillText(generateVerdict(answers).headline, gx, cy + 38);
    for (let i = 0; i < RORSCHACH_COUNT; i++) {
      if (t[i].trim()) {
        ctx.font = "20px SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = "#7dfa9a";
        ctx.fillText(`RORSCHACH ${i + 1} //「${t[i].trim()}」 強さ ${Math.round(rorschachIntensities[i] * 100)}`, gx, cy + 38 + 30 + i * 28);
      }
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

  // ---- 端末の共有メニュー（Web Share API） ----
  function shareParts() {
    const arr = answers.map((v) => Math.round(v * 100));
    rorschachIntensities.forEach((v) => arr.push(Math.round(v * 100)));
    return arr;
  }
  $("btn-share-native").addEventListener("click", async () => {
    const { canvas, ts } = buildResultImage();
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    const file = new File([blob], `right-now_${ts}.png`, { type: "image/png" });
    const url = location.origin + location.pathname + "#" + shareParts().join("-");
    const shareData = { files: [file], title: "RIGHT NOW // 心の計測", text: "今の私の波形とフラクタル。 " + url };
    if (navigator.share) {
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share(shareData);
          $("share-msg").textContent = "共有しました";
          return;
        }
        await navigator.share({ title: shareData.title, text: shareData.text });
        $("share-msg").textContent = "URLを共有しました";
      } catch (e) {
        if (e.name !== "AbortError") $("share-msg").textContent = "共有をキャンセル/失敗しました";
      }
    } else {
      $("share-msg").textContent = "端末共有は非対応です。画像は「画像を保存」からどうぞ";
    }
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
  // 形式: #a-b-c-d-e-r1-r2-r3 （旧形式 6パーツは新形式の読み込みで互換）
  $("btn-share").addEventListener("click", () => {
    const url = location.origin + location.pathname + "#" + shareParts().join("-");
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
    const ok = (parts.length === n + 1 || parts.length === n + RORSCHACH_COUNT) &&
      parts.every((x) => x >= 0 && x <= 100);
    if (!ok) return;
    answers = parts.slice(0, n).map((x) => x / 100);
    if (parts.length === n + 1) {
      // 旧形式: 最後の1つを全3枚共通の強度として扱う
      rorschachIntensities = new Array(RORSCHACH_COUNT).fill(parts[n] / 100);
    } else {
      rorschachIntensities = parts.slice(n, n + RORSCHACH_COUNT).map((x) => x / 100);
    }
    rorschachTexts = ["", "", ""];
    beginGeneration(answers, seedFromAnswers(answers));
  })();

  // リサイズ
  window.addEventListener("resize", () => {
    if (current === "result") {
      Graph.drawGraph($("graph-canvas"), answers, seedFromAnswers(answers));
      Fractal.drawFractal($("fractal-canvas"), answers.concat([combinedIntensity()]), seedFromAnswers(answers));
    }
  });
})();
