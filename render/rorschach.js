// ロールシャッハ風インクブロット生成（左右対称・決定論的）
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

  function generateInkblot(canvas, seed) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || canvas.parentElement.clientWidth || 420;
    const h = canvas.clientHeight || 340;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const rnd = mulberry32(seed);
    const cx = w / 2;

    // 用紙の地
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#101826");
    g.addColorStop(1, "#070b12");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // 枠
    ctx.strokeStyle = "rgba(57,208,255,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    // クラスタごとの色調（青系/紫系をランダムに）
    const tints = ["27,42,58", "38,34,66", "20,52,62", "46,30,58"];
    const clusters = 4 + Math.floor(rnd() * 4); // 4..7
    for (let k = 0; k < clusters; k++) {
      const bx = cx + (10 + rnd() * (w / 2 - 30));   // 右半分の基準点
      const by = h * 0.12 + rnd() * h * 0.76;
      const scale = 0.6 + rnd() * 1.1;
      const tint = tints[Math.floor(rnd() * tints.length)];
      const alpha = 0.55 + rnd() * 0.4;
      const blobs = 3 + Math.floor(rnd() * 4);        // 1クラスタ内のしみ

      for (let b = 0; b < blobs; b++) {
        const ox = (rnd() * 2 - 1) * 34 * scale;
        const oy = (rnd() * 2 - 1) * 34 * scale;
        const rx = (16 + rnd() * 55) * scale;
        const ry = (16 + rnd() * 55) * scale;
        const rot = rnd() * Math.PI;
        // 左右鏡像
        for (const s of [1, -1]) {
          ctx.fillStyle = `rgba(${tint},${alpha})`;
          ctx.beginPath();
          ctx.ellipse(bx * s + ox, by + oy, rx, ry, rot, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 微細なしみ（有機的なにじみ）
    const specks = 60;
    for (let i = 0; i < specks; i++) {
      const px = rnd() * w;
      const py = rnd() * h;
      const r = rnd() * 2.2;
      ctx.fillStyle = `rgba(10,18,28,${0.3 + rnd() * 0.3})`;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  global.Rorschach = { generateInkblot, mulberry32 };
})(window);
