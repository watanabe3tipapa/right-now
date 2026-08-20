// Signal Ritual: 走査アニメーション。描画はrequestAnimationFrame、DOM更新は表示値の変化時だけ行う。
(function (global) {
  "use strict";

  let raf = null;
  let onDone = null;
  const DURATION = 3400;

  function start(canvas, values, seed, done) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || 520;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const t0 = performance.now();
    const readout = document.getElementById("anim-readout");
    onDone = done;
    let lastPercent = -1;

    if (raf) cancelAnimationFrame(raf);
    const loop = (now) => {
      const el = now - t0;
      const prog = Math.min(1, el / DURATION);
      drawFrame(ctx, w, h, values, seed, prog);
      const percent = Math.floor(prog * 100);
      if (readout && percent !== lastPercent) {
        readout.textContent =
          "PROCESSING " + String(percent).padStart(3, "0") + "% // " +
          "CHANNELS 5 // " + String.fromCharCode(65 + Math.min(4, Math.floor(prog * 5)));
        lastPercent = percent;
      }
      if (prog < 1) {
        raf = requestAnimationFrame(loop);
      } else if (onDone) {
        const d = onDone; onDone = null;
        d();
      }
    };
    raf = requestAnimationFrame(loop);
  }

  function drawFrame(ctx, w, h, values, seed, prog) {
    ctx.clearRect(0, 0, w, h);

    // グリッド
    ctx.strokeStyle = "rgba(64,120,180,0.13)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const y = (h / 12) * i;
      ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    for (let i = 0; i <= 20; i++) {
      const x = (w / 20) * i;
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
    }
    ctx.stroke();

    // 走査ライン（ペン先）
    const scanX = prog * (w + 120) - 60;
    ctx.strokeStyle = "rgba(125,250,154,0.5)";
    ctx.beginPath();
    ctx.moveTo(scanX, 0); ctx.lineTo(scanX, h); ctx.stroke();

    // 波形の描画進捗
    const pts = 360;
    const mid = h / 2;
    const amp = h * 0.32;
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "rgba(57,208,255,0.85)";
    ctx.shadowColor = "rgba(57,208,255,0.5)";
    ctx.shadowBlur = 6;
    const nsamples = Math.floor(prog * pts);
    ctx.beginPath();
    for (let i = 0; i < nsamples; i++) {
      const t = i / (pts - 1);
      const x = t * w;
      const y = mid +
        Math.sin(t * 16 + prog * 4) * amp * 0.35 +
        Math.sin(t * 5 - prog * 2) * amp * 0.3 +
        (values[(Math.floor(t * 5)) % values.length] - 0.5) * 2 * amp * 0.25;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ペン先
    if (nsamples > 0) {
      const t = (nsamples - 1) / (pts - 1);
      const px = t * w;
      const py = mid +
        Math.sin(t * 16 + prog * 4) * amp * 0.35 +
        Math.sin(t * 5 - prog * 2) * amp * 0.3 +
        (values[(Math.floor(t * 5)) % values.length] - 0.5) * 2 * amp * 0.25;
      ctx.fillStyle = "#ffb03a";
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,176,58,0.4)";
      ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.stroke();
    }

    // 進行バー
    ctx.fillStyle = "rgba(14,22,34,0.9)";
    ctx.fillRect(0, h - 18, w, 18);
    ctx.fillStyle = "rgba(57,208,255,0.8)";
    ctx.fillRect(0, h - 18, w * prog, 18);
  }

  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    onDone = null;
  }

  global.Anim = { start, stop };
})(window);
