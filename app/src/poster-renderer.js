'use strict';

const paperInk = '#ffe5ad';
const nightInk = '#181020';

function drawPhotoPanel(ctx, shape, crop, photo, grade, unit, layout) {
  const { x, y, w, h, angle, path, id } = shape;
  const snapshot = layout === 'tilt';
  ctx.save();
  if (snapshot) {
    ctx.shadowColor = '#08040e';
    ctx.shadowBlur = unit * .025;
    ctx.shadowOffsetY = unit * .012;
    ctx.strokeStyle = paperInk;
    ctx.lineWidth = unit * .028;
    ctx.stroke(path);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  ctx.clip(path);
  if (angle) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(angle);
    ctx.translate(-x - w / 2, -y - h / 2);
  }
  const ink = id === 0 ? 'hero' : [2,4,6,8].includes(id) ? 'cool' : 'base';
  if (photo) {
    const graded = applyGradientGrade(photo, grade, ink);
    const scale = Math.max(w / graded.width, h / graded.height) * crop.zoom;
    const dw = graded.width * scale, dh = graded.height * scale;
    const dx = x - (dw - w) * (1 + crop.x / 100) / 2;
    const dy = y - (dh - h) * (1 + crop.y / 100) / 2;
    ctx.drawImage(graded, dx, dy, dw, dh);
  }
  const vignette = ctx.createRadialGradient(x + w * .49, y + h * .40, unit * .04, x + w * .5, y + h * .45, Math.hypot(w,h) * .58);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(.62, '#170a2115');
  vignette.addColorStop(1, '#170a21ad');
  ctx.fillStyle = vignette;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  if (snapshot) return;
  ctx.strokeStyle = nightInk;
  ctx.lineWidth = unit * .012;
  ctx.stroke(path);
  ctx.strokeStyle = '#ffce984f';
  ctx.lineWidth = unit * .0018;
  ctx.stroke(path);
}

function drawCoverLettering(ctx, state, w, h, unit) {
  const title = state.caption.trim().toUpperCase();
  const subtitle = state.subtitle.trim();
  if (!title && !subtitle) return;
  const landscape = w > h * 1.2;
  const displayWidth = w * (landscape ? .65 : .87);
  const center = w * .5;
  const baseline = h * (state.layout === 'story' && !landscape ? .76 : .795);
  const maxSize = unit * (landscape ? .205 : .164);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.translate(center, baseline);
  ctx.transform(1, -.065, 0, 1, 0, 0);
  ctx.font = `${maxSize}px Anton`;
  const measured = ctx.measureText(title).width;
  const titleSize = Math.min(maxSize, maxSize * displayWidth / Math.max(1, measured));
  ctx.font = `${titleSize}px Anton`;
  const titleWidth = ctx.measureText(title).width;
  const fieldW = Math.min(w * .92, Math.max(unit * .56, titleWidth + unit * .24));
  const field = ctx.createLinearGradient(-fieldW / 2, 0, fieldW / 2, 0);
  field.addColorStop(0, 'transparent');
  field.addColorStop(.26, '#211026d9');
  field.addColorStop(.74, '#211026d9');
  field.addColorStop(1, 'transparent');
  ctx.fillStyle = field;
  ctx.fillRect(-fieldW / 2, -titleSize * .97, fieldW, titleSize + unit * .1);
  if (state.dots) {
    const step = Math.max(3, unit * .009);
    ctx.fillStyle = '#ff917da0';
    ctx.beginPath();
    for (let y = -titleSize * .94; y < unit * .096; y += step) {
      for (let x = -fieldW * .48; x < fieldW * .48; x += step) {
        const radial = Math.abs(x) / (fieldW * .5);
        const radius = step * (.09 + radial * .12) * (1 - radial ** 8);
        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }
  if (title) {
    const fill = ctx.createLinearGradient(0, -titleSize * .76, 0, 0);
    fill.addColorStop(0, '#fff2c9');
    fill.addColorStop(.45, '#ffd18d');
    fill.addColorStop(1, '#ff875f');
    ctx.strokeStyle = '#221125';
    ctx.lineWidth = unit * .022;
    ctx.strokeText(title, unit * .007, unit * .015);
    ctx.strokeStyle = '#ff766b';
    ctx.lineWidth = unit * .006;
    ctx.strokeText(title, unit * .006, unit * .012);
    ctx.strokeStyle = '#211020';
    ctx.lineWidth = unit * .009;
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = fill;
    ctx.fillText(title, 0, 0);
  }
  if (subtitle) {
    const scriptSize = unit * .080;
    ctx.font = `${scriptSize}px Pacifico`;
    const width = ctx.measureText(subtitle).width;
    ctx.font = `${scriptSize * Math.min(1, displayWidth / Math.max(1, width))}px Pacifico`;
    ctx.strokeStyle = '#32142e';
    ctx.lineWidth = unit * .012;
    ctx.strokeText(subtitle, 0, unit * .076);
    ctx.fillStyle = '#ffe3ec';
    ctx.fillText(subtitle, 0, unit * .071);
  }
  ctx.restore();
}

function drawPosterBorder(ctx, w, h, unit, layout) {
  const inset = unit * .02;
  ctx.strokeStyle = paperInk;
  ctx.lineWidth = unit * .0018;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  const y = h - unit * .025;
  ctx.fillStyle = nightInk;
  ctx.fillRect(w * .5 - unit * .153, y - unit * .016, unit * .306, unit * .031);
  ctx.fillStyle = paperInk;
  ctx.font = `${unit * .012}px monospace`;
  ctx.textAlign = 'center';
  ctx.letterSpacing = `${unit * .003}px`;
  ctx.fillText('N E O N   C O A S T', w * .5, y + unit * .005);
  ctx.letterSpacing = '0px';
  const tag = layout === 'nine' ? '01–09' : 'N / C';
  ctx.fillStyle = nightInk;
  ctx.fillRect(inset, inset, unit * .105, unit * .041);
  ctx.fillStyle = paperInk;
  ctx.textAlign = 'left';
  ctx.fillText(tag, inset + unit * .014, inset + unit * .026);
  ctx.fillRect(w - inset - unit * .053, inset + unit * .014, unit * .035, unit * .003);
  ctx.fillRect(w - inset - unit * .037, inset + unit * .008, unit * .003, unit * .016);
}

function drawCoverPoster(canvas, state, photos, selected = null) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height, unit = Math.min(w, h);
  const margin = unit * .033;
  const frame = { x: margin, y: margin, w: w - margin * 2, h: h - margin * 2 };
  ctx.fillStyle = nightInk;
  ctx.fillRect(0, 0, w, h);
  if (state.layout === 'tilt' || state.layout === 'story') {
    const background = ctx.createLinearGradient(0,0,w,h);
    background.addColorStop(0, '#47234d');
    background.addColorStop(.54, '#241728');
    background.addColorStop(1, '#633449');
    ctx.fillStyle = background;
    ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
  }
  const shapes = getCoverPanels(state.layout, h > w).map(p => panelGeometry(p, frame));
  for (const shape of shapes) {
    const crop = state.crops[shape.id];
    drawPhotoPanel(ctx, shape, crop, photos.get(crop.photo)?.image, state.grade, unit, state.layout);
  }
  drawCoverLettering(ctx, state, w, h, unit);
  drawPosterBorder(ctx, w, h, unit, state.layout);
  if (selected !== null) {
    const shape = shapes.find(p => p.id === selected);
    if (shape) {
      ctx.strokeStyle = '#bffced';
      ctx.lineWidth = unit * .003;
      ctx.setLineDash([unit * .011, unit * .008]);
      ctx.stroke(shape.path);
      ctx.setLineDash([]);
    }
  }
  return shapes;
}
