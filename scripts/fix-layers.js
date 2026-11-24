const fs = require("fs");
const f = "src/kb3/crash/CrashScene.tsx";
let t = fs.readFileSync(f, "utf8");

const oldLayers = `      if (imgs.far) { ctx!.globalAlpha = 1; ctx!.drawImage(imgs.far, 0, 0, w, h); ctx!.fillStyle = "rgba(4,7,12," + (0.25 + t * 0.2).toFixed(2) + ")"; ctx!.fillRect(0, 0, w, h); }
      if (imgs.farL) { const off = (st.scroll * 0.05) % w; ctx!.globalAlpha = 0.7; ctx!.drawImage(imgs.farL, -off, h * 0.55, w * 1.5, h * 0.45); ctx!.drawImage(imgs.farL, w * 1.5 - off, h * 0.55, w * 1.5, h * 0.45); ctx!.globalAlpha = 1; }
      ctx!.globalAlpha = 0.55;
      if (imgs.mid) { const mw = w * 1.6; const off = (st.scroll * 0.15) % mw; ctx!.globalAlpha = 0.55; ctx!.drawImage(imgs.mid, -off, 0, mw, h * 0.35); ctx!.drawImage(imgs.mid, mw - off, 0, mw, h * 0.35); ctx!.globalAlpha = 1; }
      else { ctx!.fillStyle = "rgba(255,255,255,0.16)"; for (const c of clouds) { const cx = ((c.x * w - st.scroll * 0.4) % (w + 200) + w + 200) % (w + 200) - 100; ctx!.beginPath(); ctx!.ellipse(cx, c.y * h, 60 * c.s, 18 * c.s, 0, 0, 6.283); ctx!.fill(); } }
      ctx!.globalAlpha = 1;
      if (imgs.near && !g.hideNear) { const nw = w * 1.3; const off = (st.scroll * 0.35) % nw; ctx!.globalAlpha = 0.25; ctx!.drawImage(imgs.near, -off, h * 0.7, nw, h * 0.3); ctx!.drawImage(imgs.near, nw - off, h * 0.7, nw, h * 0.3); ctx!.globalAlpha = 1; }
      ctx!.globalCompositeOperation = "soft-light"; ctx!.globalAlpha = 0.15; ctx!.fillStyle = g.color; ctx!.fillRect(0, 0, w, h); ctx!.globalCompositeOperation = "source-over"; ctx!.globalAlpha = 1;
      if (!imgs.near && !g.hideNear) { for (const n of near) { const nx = ((n.x * w - st.scroll * 0.9) % (w + 120) + w + 120) % (w + 120) - 60; const ny = n.y * h; if (n.k === 0) { ctx!.strokeStyle = "rgba(20,26,36,0.7)"; ctx!.lineWidth = 2; ctx!.beginPath(); ctx!.moveTo(nx - 8, ny); ctx!.quadraticCurveTo(nx - 3, ny - 5, nx, ny); ctx!.quadraticCurveTo(nx + 3, ny - 5, nx + 8, ny); ctx!.stroke(); } else { ctx!.fillStyle = "rgba(196,106,58,0.5)"; ctx!.beginPath(); ctx!.ellipse(nx, ny, 9, 11, 0, 0, 6.283); ctx!.fill(); } } }`;

const newLayers = `      // 1. bg.jpg fills the scene
      if (imgs.far) { ctx!.globalAlpha = 1; ctx!.drawImage(imgs.far, 0, 0, w, h); }
      
      // Helper to draw repeating layer with top fade mask
      const tempCvs = typeof document !== "undefined" ? (window as any).__crashLayerCvs || ((window as any).__crashLayerCvs = document.createElement("canvas")) : null;
      const tempCtx = tempCvs ? tempCvs.getContext("2d") : null;
      function drawLayer(img: any, yR: number, hR: number, alpha: number, speed: number, hide: boolean) {
        if (!img || !tempCtx || hide) return;
        const lH = h * hR, lY = h * yR;
        const off = (st.scroll * speed) % w;
        tempCvs.width = w; tempCvs.height = lH;
        tempCtx.clearRect(0, 0, w, lH);
        tempCtx.drawImage(img, -off, 0, w * 2, lH);
        tempCtx.drawImage(img, w - off, 0, w * 2, lH);
        // Top fade mask
        tempCtx.globalCompositeOperation = "destination-in";
        const grad = tempCtx.createLinearGradient(0, 0, 0, lH * 0.25);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,1)");
        tempCtx.fillStyle = grad;
        tempCtx.fillRect(0, 0, w, lH * 0.25);
        tempCtx.fillRect(0, lH * 0.25, w, lH * 0.75);
        tempCtx.globalCompositeOperation = "source-over";
        ctx!.globalAlpha = alpha;
        ctx!.drawImage(tempCvs, 0, lY);
        ctx!.globalAlpha = 1;
      }

      // 2. layer-far (mountains, bottom, h*0.45, y=h*0.55)
      drawLayer(imgs.farL, 0.55, 0.45, 0.7, 0.05, false);
      // 3. layer-mid (clouds, top half, h*0.35, y=0, opacity 55%)
      drawLayer(imgs.mid, 0, 0.35, 0.55, 0.15, false);
      // 4. layer-near (bottom only, h*0.3, y=h*0.7, opacity 25%, hidden in some)
      drawLayer(imgs.near, 0.7, 0.3, 0.25, 0.35, g.hideNear);

      // 5. Light color overlay from registry.color (15%)
      ctx!.globalCompositeOperation = "soft-light";
      ctx!.globalAlpha = 0.15;
      ctx!.fillStyle = g.color;
      ctx!.fillRect(0, 0, w, h);
      ctx!.globalCompositeOperation = "source-over";
      ctx!.globalAlpha = 1;`;

if (t.includes("if (imgs.far) { ctx!.globalAlpha = 1; ctx!.drawImage(imgs.far, 0, 0, w, h);")) {
  t = t.replace(oldLayers, newLayers);
  fs.writeFileSync(f, t, "utf8");
  console.log("DONE: Layers reordered with repeat-x and top fade mask.");
} else {
  console.log("WARN: Could not find exact layer block. Manual check required.");
}
