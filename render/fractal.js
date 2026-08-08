// フラクタル: L-system（木）描画
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

  function buildParams(values, seed) {
    const rnd = mulberry32(seed);
    const [arousal, anxiety, fatigue, focus, openness, rsIntensity = 0.5] = values;

    // 回答値 → パラメータ
    const baseAngle = lerp(16, 34, arousal);
    const angleVar = lerp(0.25, 0.8, anxiety);       // 非対称度
    const depth = 5 + Math.round(focus * 4);          // 反復深さ 5..9
    const shrink = lerp(0.82, 0.64, fatigue);         // 枝の縮小率
    const taper = lerp(0.6, 0.85, fatigue);           // 太さの減衰
    const symmetry = lerp(1.0, 0.15, anxiety);        // 左右対称度
    const hueBase = lerp(200, 330, openness);         // 色相 青→紫
    const lenScale = lerp(0.9, 1.25, openness);       // 全長
    const sway = 0.5 + rnd() * 0.5;                   // 揺らぎ係数
    const energy = lerp(1, 1.9, rsIntensity);         // ロールシャッハ強度→枝量
    return { baseAngle, angleVar, depth, shrink, taper, symmetry, hueBase, lenScale, sway, energy, seed, rnd };
  }

  function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }

  function drawFractal(canvas, values, seed) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || 380;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const p = buildParams(values, seed);
    const baseX = w / 2;
    const baseY = h * 0.94;
    const baseLen = h * 0.24 * p.lenScale;

    // 根元（グラデーション発光）
    ctx.fillStyle = "rgba(125,250,154,0.18)";
    ctx.beginPath();
    ctx.arc(baseX, baseY, 5, 0, Math.PI * 2);
    ctx.fill();

    drawBranch(ctx, baseX, baseY, -Math.PI / 2, baseLen, p.depth, 9, p, seed);
  }

  function drawBranch(ctx, x, y, angle, len, depth, width, p, seed) {
    if (depth <= 0 || len < 1.5) return;
    const x2 = x + Math.cos(angle) * len;
    const y2 = y + Math.sin(angle) * len;

    const t = 1 - depth / p.depth;
    const hue = p.hueBase + Math.sin(depth * 0.9 + p.sway) * 18;
    const light = 40 + t * 28;
    ctx.strokeStyle = `hsla(${hue}, 85%, ${light}%, 0.95)`;
    ctx.lineWidth = Math.max(0.6, width);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const r1 = p.rnd(), r2 = p.rnd();
    const bA = p.baseAngle + (r1 - 0.5) * p.angleVar * 2;
    const left = bA * p.symmetry + (1 - p.symmetry) * bA * (0.6 + r1);
    const right = bA + (1 - p.symmetry) * bA * (0.6 + r2) * 0.8;
    const newW = width * p.taper;
    const newLen = len * p.shrink;

    drawBranch(ctx, x2, y2, angle - left, newLen, depth - 1, newW, p, seed);
    drawBranch(ctx, x2, y2, angle + right, newLen, depth - 1, newW, p, seed);
    // 中央の継続枝
    if (p.symmetry > 0.7) {
      drawBranch(ctx, x2, y2, angle, newLen * 0.82, depth - 1, newW * 0.9, p, seed);
    }
    // ロールシャッハ強度によるオーラ（細かい芽吹き）
    if (p.energy > 1 && depth <= 3) {
      const twigs = Math.round((p.energy - 1) * 6);
      for (let i = 0; i < twigs; i++) {
        if (p.rnd() < (p.energy - 1) * 0.7) {
          const a = angle + (p.rnd() * 2 - 1) * 2.2;
          drawBranch(ctx, x2, y2, a, newLen * (0.3 + p.rnd() * 0.4), depth - 1, newW * 0.5, p, seed);
        }
      }
    }
  }

  global.Fractal = { drawFractal, buildParams, lerp };
})(window);
