import type { Jugador, TacticaGuardada } from '../types';

/* ── Render a tactic to an offscreen canvas (shared by PNG & PDF) ─────────
 * `portrait` mirrors the mobile board orientation: field coordinates are
 * stored in landscape space and rotated 90° when drawing in portrait.
 *
 * TODO(anim): a future WebM export could reuse renderTacticToCanvas by
 * driving it through interpolateFrames() (see src/utils/animation.ts) frame
 * by frame into a MediaRecorder(canvas.captureStream()) to record the play
 * animation as video. Out of scope for now — live playback only.
 */

interface ExportOptions {
  portrait: boolean;
  notify: (msg: string) => void;
}

export function renderTacticToCanvas(data: TacticaGuardada, portrait: boolean): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  if (portrait) {
    canvas.width = 900;
    canvas.height = 1600;
  } else {
    canvas.width = 1600;
    canvas.height = 900;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;

  // 1. Grass background gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#2d8a4e');
  grad.addColorStop(0.3, '#1b7a3a');
  grad.addColorStop(0.55, '#28924a');
  grad.addColorStop(0.8, '#1c6e38');
  grad.addColorStop(1, '#2d8a4e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 2. Mowing stripes (12 stripes)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  if (portrait) {
    const stripeHeight = h / 12;
    for (let i = 0; i < 12; i += 2) {
      ctx.fillRect(0, i * stripeHeight, w, stripeHeight);
    }
  } else {
    const stripeWidth = w / 12;
    for (let i = 0; i < 12; i += 2) {
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, h);
    }
  }

  // 3. Pitch lines styling
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Boundaries (4% margin)
  const padX = w * 0.04;
  const padY = h * 0.04;
  const fieldW = w * 0.92;
  const fieldH = h * 0.92;

  // Outer border
  ctx.strokeRect(padX, padY, fieldW, fieldH);

  if (portrait) {
    // ═══ PORTRAIT FIELD LINES ═══
    // Center line (horizontal)
    ctx.beginPath();
    ctx.moveTo(padX, h / 2);
    ctx.lineTo(padX + fieldW, h / 2);
    ctx.stroke();

    // Center circle
    const centerRadius = fieldW * 0.18;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, centerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.006, 0, Math.PI * 2);
    ctx.fill();

    // Top Penalty Area
    const penAreaW = fieldW * 0.5929;
    const penAreaH = fieldH * 0.1571;
    const penAreaX = padX + fieldW * 0.2035;
    ctx.strokeRect(penAreaX, padY, penAreaW, penAreaH);

    // Top Goal Area
    const goalAreaW = fieldW * 0.2694;
    const goalAreaH = fieldH * 0.0524;
    const goalAreaX = padX + fieldW * 0.3653;
    ctx.strokeRect(goalAreaX, padY, goalAreaW, goalAreaH);

    // Top Penalty Spot
    const topPenSpotY = padY + fieldH * 0.1048;
    ctx.beginPath();
    ctx.arc(w / 2, topPenSpotY, w * 0.005, 0, Math.PI * 2);
    ctx.fill();

    // Top Penalty Arc (the "D")
    const penArcRadius = fieldH * 0.0871;
    ctx.save();
    ctx.beginPath();
    ctx.rect(padX, padY + penAreaH, fieldW, h);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(w / 2, topPenSpotY, penArcRadius, 0, Math.PI);
    ctx.stroke();
    ctx.restore();

    // Bottom Penalty Area
    ctx.strokeRect(penAreaX, padY + fieldH - penAreaH, penAreaW, penAreaH);

    // Bottom Goal Area
    ctx.strokeRect(goalAreaX, padY + fieldH - goalAreaH, goalAreaW, goalAreaH);

    // Bottom Penalty Spot
    const bottomPenSpotY = padY + fieldH - fieldH * 0.1048;
    ctx.beginPath();
    ctx.arc(w / 2, bottomPenSpotY, w * 0.005, 0, Math.PI * 2);
    ctx.fill();

    // Bottom Penalty Arc (the "D")
    ctx.save();
    ctx.beginPath();
    ctx.rect(padX, padY, fieldW, fieldH - penAreaH);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(w / 2, bottomPenSpotY, penArcRadius, Math.PI, 0);
    ctx.stroke();
    ctx.restore();
  } else {
    // ═══ LANDSCAPE FIELD LINES ═══
    // Center line
    ctx.beginPath();
    ctx.moveTo(w / 2, padY);
    ctx.lineTo(w / 2, padY + fieldH);
    ctx.stroke();

    // Center circle
    const centerRadius = fieldH * 0.18;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, centerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.004, 0, Math.PI * 2);
    ctx.fill();

    // Left Penalty Area
    const penAreaW = fieldW * 0.1571;
    const penAreaH = fieldH * 0.5929;
    const penAreaY = padY + fieldH * 0.2035;
    ctx.strokeRect(padX, penAreaY, penAreaW, penAreaH);

    // Left Goal Area
    const goalAreaW = fieldW * 0.0524;
    const goalAreaH = fieldH * 0.2694;
    const goalAreaY = padY + fieldH * 0.3653;
    ctx.strokeRect(padX, goalAreaY, goalAreaW, goalAreaH);

    // Left Penalty Spot
    const leftPenSpotX = padX + fieldW * 0.1048;
    ctx.beginPath();
    ctx.arc(leftPenSpotX, h / 2, w * 0.003, 0, Math.PI * 2);
    ctx.fill();

    // Left Penalty Arc (the "D")
    const penArcRadius = fieldW * 0.0871;
    ctx.save();
    ctx.beginPath();
    ctx.rect(padX + penAreaW, padY, w, fieldH);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(leftPenSpotX, h / 2, penArcRadius, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.restore();

    // Right Penalty Area
    ctx.strokeRect(padX + fieldW - penAreaW, penAreaY, penAreaW, penAreaH);

    // Right Goal Area
    ctx.strokeRect(padX + fieldW - goalAreaW, goalAreaY, goalAreaW, goalAreaH);

    // Right Penalty Spot
    const rightPenSpotX = padX + fieldW - fieldW * 0.1048;
    ctx.beginPath();
    ctx.arc(rightPenSpotX, h / 2, w * 0.003, 0, Math.PI * 2);
    ctx.fill();

    // Right Penalty Arc (the "D")
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, padY, padX + fieldW - penAreaW, fieldH);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(rightPenSpotX, h / 2, penArcRadius, Math.PI / 2, -Math.PI / 2);
    ctx.stroke();
    ctx.restore();
  }

  // Corner Arcs
  const cornerRadius = (portrait ? fieldW : fieldH) * 0.025;
  ctx.beginPath();
  ctx.arc(padX, padY, cornerRadius, 0, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(padX, padY + fieldH, cornerRadius, -Math.PI / 2, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(padX + fieldW, padY, cornerRadius, Math.PI / 2, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(padX + fieldW, padY + fieldH, cornerRadius, Math.PI, -Math.PI / 2);
  ctx.stroke();

  // 3.5 Draw zones first so they sit behind arrows, elements and players
  data.elements
    .filter((el) => el.type === 'zone')
    .forEach((el) => {
      const scale = el.scale ?? 1;
      const elX = portrait ? (el.y / 100) * w : (el.x / 100) * w;
      const elY = portrait ? ((100 - el.x) / 100) * h : (el.y / 100) * h;
      const base = w * 0.09 * scale;

      ctx.save();
      ctx.translate(elX, elY);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.fillStyle = 'rgba(252, 211, 77, 0.15)';
      ctx.strokeStyle = 'rgba(252, 211, 77, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      if ((el.shape ?? 'circle') === 'circle') {
        ctx.arc(0, 0, base / 2, 0, Math.PI * 2);
      } else {
        ctx.roundRect(-base / 2, -base / 2, base, base, 8);
      }
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

  // 4. Draw lines (arrows)
  data.arrows.forEach((arr) => {
    const scale = arr.scale ?? 1;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4.5 * scale;

    const x1 = portrait ? arr.y1 : arr.x1;
    const y1 = portrait ? 100 - arr.x1 : arr.y1;
    const x2 = portrait ? arr.y2 : arr.x2;
    const y2 = portrait ? 100 - arr.x2 : arr.y2;

    const style = arr.style ?? 'solid';
    ctx.setLineDash(style === 'dashed' ? [14 * scale, 12 * scale] : []);

    ctx.beginPath();
    ctx.moveTo((x1 / 100) * w, (y1 / 100) * h);
    if (style === 'curved') {
      // Control point (field %) — derived default when never shaped
      const midXf = (arr.x1 + arr.x2) / 2;
      const midYf = (arr.y1 + arr.y2) / 2;
      const dxf = arr.x2 - arr.x1;
      const dyf = arr.y2 - arr.y1;
      const lenf = Math.hypot(dxf, dyf) || 1;
      const cxf = arr.cx ?? midXf + (-dyf / lenf) * 15;
      const cyf = arr.cy ?? midYf + (dxf / lenf) * 15;
      const cxE = portrait ? cyf : cxf;
      const cyE = portrait ? 100 - cxf : cyf;
      ctx.quadraticCurveTo((cxE / 100) * w, (cyE / 100) * h, (x2 / 100) * w, (y2 / 100) * h);
    } else {
      ctx.lineTo((x2 / 100) * w, (y2 / 100) * h);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc((x1 / 100) * w, (y1 / 100) * h, Math.max(5, 6 * scale), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc((x2 / 100) * w, (y2 / 100) * h, Math.max(5, 6 * scale), 0, Math.PI * 2);
    ctx.fill();
  });

  // 5. Draw elements (zones already drawn above)
  data.elements.forEach((el) => {
    if (el.type === 'zone') return;
    const scale = el.scale ?? 1;
    const elX = portrait ? (el.y / 100) * w : (el.x / 100) * w;
    const elY = portrait ? ((100 - el.x) / 100) * h : (el.y / 100) * h;

    if (el.type === 'ball') {
      ctx.save();
      ctx.translate(elX, elY);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.font = `${Math.round(28 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚽', 0, 0);
      ctx.restore();
    } else if (el.type === 'cone') {
      const coneW = 36 * scale;
      const coneH = 24 * scale;
      ctx.save();
      ctx.translate(elX, elY);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(0, coneH / 2 - 2 * scale, coneW / 2, 4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-coneW * 0.4, coneH / 2 - 2 * scale);
      ctx.lineTo(-coneW * 0.2, -coneH / 2 + 6 * scale);
      ctx.lineTo(coneW * 0.2, -coneH / 2 + 6 * scale);
      ctx.lineTo(coneW * 0.4, coneH / 2 - 2 * scale);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.ellipse(0, -coneH / 2 + 6 * scale, coneW * 0.2, 2.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (el.type === 'goal') {
      const goalW = 54 * scale;
      const goalH = 34 * scale;
      ctx.save();
      ctx.translate(elX, elY);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, goalH * 0.35, goalW * 0.45, 4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(-goalW * 0.25, -goalH * 0.2, goalW * 0.5, goalH * 0.5);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(-goalW * 0.25, -goalH * 0.2, goalW * 0.5, goalH * 0.5);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(-goalW * 0.5, -goalH * 0.3);
      ctx.lineTo(-goalW * 0.25, -goalH * 0.2);
      ctx.lineTo(-goalW * 0.25, goalH * 0.3);
      ctx.lineTo(-goalW * 0.5, goalH * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(goalW * 0.5, -goalH * 0.3);
      ctx.lineTo(goalW * 0.25, -goalH * 0.2);
      ctx.lineTo(goalW * 0.25, goalH * 0.3);
      ctx.lineTo(goalW * 0.5, goalH * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-goalW * 0.5, -goalH * 0.3);
      ctx.lineTo(goalW * 0.5, -goalH * 0.3);
      ctx.lineTo(goalW * 0.25, -goalH * 0.2);
      ctx.lineTo(-goalW * 0.25, -goalH * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3 * scale;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(-goalW * 0.5, goalH * 0.3);
      ctx.lineTo(-goalW * 0.5, -goalH * 0.3);
      ctx.lineTo(goalW * 0.5, -goalH * 0.3);
      ctx.lineTo(goalW * 0.5, goalH * 0.3);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 0.8 * scale;
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(goalW * 0.12 * i, -goalH * 0.2);
        ctx.lineTo(goalW * 0.12 * i, goalH * 0.3);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-goalW * 0.25, -goalH * 0.04);
      ctx.lineTo(goalW * 0.25, -goalH * 0.04);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-goalW * 0.25, goalH * 0.12);
      ctx.lineTo(goalW * 0.25, goalH * 0.12);
      ctx.stroke();
      ctx.restore();
    } else if (el.type === 'dummy') {
      const dummyW = 34 * scale;
      const dummyH = 40 * scale;
      ctx.save();
      ctx.translate(elX, elY);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, dummyH / 2, dummyW * 0.4, 3 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5 * scale;
      ctx.beginPath();
      ctx.moveTo(0, dummyH / 2);
      ctx.lineTo(0, dummyH * 0.1);
      ctx.stroke();
      ctx.fillStyle = '#a3e635';
      ctx.strokeStyle = '#84cc16';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.roundRect(-dummyW * 0.22, -dummyH * 0.15, dummyW * 0.44, dummyH * 0.5, 3 * scale);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 1.5 * scale;
      for (let i = -1; i <= 1; i++) {
        const yOff = dummyH * 0.1 * i + dummyH * 0.08;
        ctx.beginPath();
        ctx.moveTo(-dummyW * 0.18, yOff);
        ctx.lineTo(dummyW * 0.18, yOff);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, -dummyH * 0.3, dummyW * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (el.type === 'text') {
      ctx.save();
      ctx.translate(elX, elY);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.font = `bold ${Math.round(14 * scale)}px system-ui, sans-serif`;
      const textVal = el.text ?? 'Texto';
      const textMetrics = ctx.measureText(textVal);
      const textW = textMetrics.width;
      const textH = 18 * scale;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      const boxW = textW + 16 * scale;
      const boxH = textH + 10 * scale;

      ctx.beginPath();
      ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 6 * scale);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(textVal, 0, 0);
      ctx.restore();
    }
  });

  // 6. Draw players (benched players are not on the pitch)
  const drawPlayersOnCanvas = (playersList: Jugador[], jerseyColor: string) => {
    playersList
      .filter((j) => j.enCancha !== false)
      .forEach((j) => {
      const pX = portrait ? (j.y / 100) * w : (j.x / 100) * w;
      const pY = portrait ? ((100 - j.x) / 100) * h : (j.y / 100) * h;

      // Draw t-shirt SVG silhouette path
      ctx.save();
      ctx.translate(pX, pY - 14);
      const jerseyScale = portrait ? 1.25 : 1.0;
      ctx.scale(jerseyScale, jerseyScale);
      ctx.translate(-32, -34);

      ctx.fillStyle = jerseyColor;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(22, 4);
      ctx.bezierCurveTo(24, 2, 40, 2, 42, 4);
      ctx.lineTo(48, 3);
      ctx.lineTo(56, 14);
      ctx.lineTo(56, 24);
      ctx.lineTo(48, 21);
      ctx.lineTo(48, 62);
      ctx.bezierCurveTo(48, 64, 46, 66, 44, 66);
      ctx.lineTo(20, 66);
      ctx.bezierCurveTo(18, 66, 16, 64, 16, 62);
      ctx.lineTo(16, 21);
      ctx.lineTo(8, 24);
      ctx.lineTo(8, 14);
      ctx.lineTo(16, 3);
      ctx.lineTo(16, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Collar
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(24, 4);
      ctx.bezierCurveTo(28, 7, 36, 7, 40, 4);
      ctx.stroke();

      // Shading
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.moveTo(16, 21);
      ctx.lineTo(16, 62);
      ctx.bezierCurveTo(16, 64, 18, 66, 20, 66);
      ctx.lineTo(24, 66);
      ctx.lineTo(24, 21);
      ctx.closePath();
      ctx.fill();

      // Sleeve lines
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(16, 21);
      ctx.lineTo(22, 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(48, 21);
      ctx.lineTo(42, 5);
      ctx.stroke();

      // Number on shirt
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(j.numero.toString(), 32, 44);
      ctx.restore();

      // Draw name label pill underneath
      ctx.font = 'bold 16px system-ui, sans-serif';
      const nameText = j.nombre;
      const nameW = ctx.measureText(nameText).width + 14;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      const nameY = pY + 26;
      ctx.roundRect(pX - nameW / 2, nameY, nameW, 22, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(nameText, pX, nameY + 3);
    });
  };

  drawPlayersOnCanvas(data.local, data.colorLocal);
  drawPlayersOnCanvas(data.visitante, data.colorVisitante);

  return canvas;
}

/* ── File name helper ─────────────────────────────────────────────────── */

function safeFileName(tacticName: string | undefined): string {
  return (tacticName ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'pizarra-tactica';
}

function desktopDownload(canvas: HTMLCanvasElement, fileName: string, notify: (msg: string) => void) {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
  notify('✓ Imagen PNG descargada');
}

/* ── Export as Image (PNG) ────────────────────────────────────────────── */

export function exportTacticAsImage(data: TacticaGuardada, { portrait, notify }: ExportOptions): void {
  const canvas = renderTacticToCanvas(data, portrait);
  if (!canvas) return;

  const fileName = `${safeFileName(data.tacticName)}-${Date.now()}.png`;

  if (!portrait) {
    desktopDownload(canvas, fileName, notify);
    return;
  }

  canvas.toBlob(async (blob) => {
    if (!blob) {
      desktopDownload(canvas, fileName, notify);
      return;
    }

    // 1. Try Web Share API — lets user "Save Image" to camera roll
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: data.tacticName || 'Táctica',
          });
          notify('✓ Imagen guardada');
          return;
        } catch (err: unknown) {
          // User cancelled share sheet — don't fall through
          if (err instanceof DOMException && err.name === 'AbortError') {
            return;
          }
          console.warn('Share failed, trying download fallback', err);
        }
      }
    }

    // 2. Fallback: trigger download via Blob URL (saves to Downloads/Gallery)
    try {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
      notify('✓ Imagen descargada');
    } catch {
      // 3. Last resort: open image in new tab for long-press save
      const dataUrl = canvas.toDataURL('image/png');
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`
          <html>
            <head>
              <title>PizarrApp - Guardar imagen</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { margin: 0; background: #111827; color: #f3f4f6; display: flex; flex-direction: column;
                       align-items: center; justify-content: center; font-family: system-ui, sans-serif;
                       padding: 16px; min-height: 100vh; box-sizing: border-box; }
                img { max-width: 100%; max-height: 75vh; border-radius: 12px;
                      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); margin-bottom: 20px; }
                p { font-size: 14px; text-align: center; color: #9ca3af; }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" alt="Táctica" />
              <p>Mantén presionada la imagen para guardarla en tu galería.</p>
            </body>
          </html>
        `);
        newTab.document.close();
        notify('✓ Táctica abierta para guardar');
      }
    }
  }, 'image/png');
}

/* ── Export as PDF (A4, jspdf loaded on demand) ───────────────────────── */

export async function exportTacticAsPdf(data: TacticaGuardada, { portrait, notify }: ExportOptions): Promise<void> {
  const canvas = renderTacticToCanvas(data, portrait);
  if (!canvas) return;

  const { jsPDF } = await import('jspdf');
  const imgData = canvas.toDataURL('image/png');
  const fileName = `${safeFileName(data.tacticName)}-${Date.now()}.pdf`;

  if (portrait) {
    // A4 portrait: 210 mm × 297 mm — canvas is 9:16
    const pageW = 210;
    const pageH = 297;
    let finalW = pageW;
    let finalH = (pageW * 16) / 9;
    if (finalH > pageH) {
      finalH = pageH;
      finalW = (pageH * 9) / 16;
    }
    const offsetX = (pageW - finalW) / 2;
    const offsetY = (pageH - finalH) / 2;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, finalW, finalH);
    pdf.save(fileName);
  } else {
    // A4 landscape: 297 mm × 210 mm — canvas is 16:9
    const pageW = 297;
    const pageH = 210;
    const imgH = (pageW * 9) / 16;
    const offsetY = (pageH - imgH) / 2;

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'PNG', 0, offsetY, pageW, imgH);
    pdf.save(fileName);
  }
  notify('✓ PDF descargado');
}
