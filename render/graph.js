// Signal Ritual: 解像度に合わせて一度だけ再初期化する波形描画。
(function (global) {
  "use strict";

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function prepareCanvas(canvas, fallbackWidth, fallbackHeight) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || fallbackWidth;
    const h = canvas.clientHeight || fallbackHeight;
    const pixelWidth = Math.round(w * dpr);
    const pixelHeight = Math.round(h * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function drawGraph(canvas, values, seed) {
    const { ctx, w, h } = prepareCanvas(
      canvas,
      canvas.parentElement ? canvas.parentElement.clientWidth : 520,
      380
    );

    const rnd = mulberry32(seed);
    const padL = 46, padR = 18, padT = 16, padB = 26;
    const gw = w - padL - padR, gh = h - padT - padB;
    const mid = padT + gh / 2;

    ctx.clearRect(0, 0, w, h);

    // グリッド + 目盛り
    ctx.strokeStyle = "rgba(64,120,180,0.14)";
    ctx.fillStyle = "#5d7187";
    ctx.font = "10px SFMono-Regular, Menlo, monospace";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const y = padT + (gh / 6) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      const label = Math.round((5 - i) * 40) + "";
      ctx.fillText(label, 12, y + 3);
    }
    for (let i = 0; i <= 8; i++) {
      const x = padL + (gw / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, h - padB);
      ctx.stroke();
    }
    // ベースライン
    ctx.strokeStyle = "rgba(57,208,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(padL, mid);
    ctx.lineTo(w - padR, mid);
    ctx.stroke();

    // 生波形（ノイズ混じり、ペン描画の精密さ）
    const pts = 400;
    const amp = gh / 2 - 10;
    const xs = new Float32Array(pts);
    const ys = new Float32Array(pts);
    const base = (values[0] - 0.5) * 2;      // arousal で基準偏移
    const jitter = 0.3 + values[1] * 1.2;    // anxiety で振幅増
    const freq = 0.06 + values[3] * 0.12;    // focus で周期変化
    for (let i = 0; i < pts; i++) {
      const t = i / (pts - 1);
      const e = rnd() * 2 - 1;
      const slow = Math.sin(t * Math.PI * 2 * freq) * 0.5;
      const fast = Math.sin(t * Math.PI * 2 * 7 + rnd() * 3) * 0.22;
      let v = base * 0.6 + slow + fast + e * jitter * 0.35;
      v = Math.max(-1, Math.min(1, v));
      xs[i] = padL + t * gw;
      ys[i] = mid + v * amp;
    }

    // 波形本体
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "rgba(57,208,255,0.9)";
    ctx.shadowColor = "rgba(57,208,255,0.6)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < pts; i++) {
      i === 0 ? ctx.moveTo(xs[i], ys[i]) : ctx.lineTo(xs[i], ys[i]);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // プロット点（回答値スケール）
    const n = values.length;
    const r = 4;
    for (let i = 0; i < n; i++) {
      const x = padL + gw * ((i + 0.5) / n);
      const y = padT + gh * (1 - values[i]);
      ctx.fillStyle = "rgba(255,176,58,0.9)";
      ctx.shadowColor = "rgba(255,176,58,0.7)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffd58a";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#ffb03a";
      ctx.shadowBlur = 0;
      ctx.fillText(String.fromCharCode(65 + i), x - 3, y - 9);
    }

    // 縦スケールラベル
    ctx.fillStyle = "#5d7187";
    const labels = values.map((v, i) => QUESTIONS[i].id.toUpperCase().slice(0, 3));
    for (let i = 0; i < n; i++) {
      const x = padL + gw * ((i + 0.5) / n);
      ctx.textAlign = "center";
      ctx.fillText(labels[i], x, h - padB + 16);
    }
    ctx.textAlign = "left";
  }

  function drawHeroWave(canvas, now) {
    const { ctx, w, h } = prepareCanvas(canvas, 520, 160);
    ctx.clearRect(0, 0, w, h);
    const mid = h / 2;
    ctx.strokeStyle = "rgba(64,120,180,0.12)";
    for (let i = 1; i < 6; i++) {
      const y = (h / 6) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    const t = (now || performance.now()) / 1000;
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "rgba(57,208,255,0.8)";
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) {
      const x = (i / 300) * w;
      const y = mid +
        Math.sin(x * 0.03 + t * 2) * 34 +
        Math.sin(x * 0.11 - t * 3.1) * 14;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  global.Graph = { drawGraph, drawHeroWave };
})(window);
