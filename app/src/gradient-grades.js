'use strict';

const gradientGrades = {
  vice: { name: 'Vice Sunset', stops: ['#17102b','#6c205e','#d64d75','#ff945c','#ffe5a5'] },
  neon: { name: 'Neon Nights', stops: ['#090b24','#32236c','#a543ba','#44d7e1','#d9fff0'] },
  golden: { name: 'Golden Hour', stops: ['#231425','#74372f','#c66a37','#f5a956','#fff0b8'] },
  teal: { name: 'Teal Noir', stops: ['#071720','#153740','#376966','#7cb6a0','#e3f4c5'] },
  pink: { name: 'Hot Pink', stops: ['#240d31','#73215e','#bf367d','#ff75af','#ffe0e8'] },
  mono: { name: 'Mono Chrome', stops: ['#101019','#35333e','#777585','#b4b1bc','#f7f3ee'] }
};

const gradeCache = new WeakMap();

function applyGradientGrade(photo, gradeId, ink = 'base') {
  if (!gradeCache.has(photo)) gradeCache.set(photo, new Map());
  const cache = gradeCache.get(photo);
  const key = gradeId + '/' + ink;
  if (cache.has(key)) return cache.get(key);
  const plate = document.createElement('canvas');
  const scale = Math.min(1, 1800 / Math.max(photo.naturalWidth, photo.naturalHeight));
  plate.width = Math.max(1, Math.round(photo.naturalWidth * scale));
  plate.height = Math.max(1, Math.round(photo.naturalHeight * scale));
  const ctx = plate.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#514054';
  ctx.fillRect(0, 0, plate.width, plate.height);
  ctx.drawImage(photo, 0, 0, plate.width, plate.height);

  const grade = gradientGrades[gradeId];
  const colors = grade.stops.map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
  const lut = Array.from({ length: 256 }, (_, i) => {
    const position = Math.pow(i / 255, .89) * 4;
    const stop = Math.min(3, Math.floor(position));
    return colors[stop].map((value, c) => value + (colors[stop + 1][c] - value) * (position - stop));
  });
  const pixels = ctx.getImageData(0, 0, plate.width, plate.height);
  const data = pixels.data;
  const light = new Uint8Array(data.length / 4);
  for (let p = 0; p < light.length; p++) {
    const i = p * 4;
    light[p] = data[i] * .25 + data[i + 1] * .62 + data[i + 2] * .13;
  }
  const blend = gradeId === 'mono' ? 1 : ink === 'hero' ? .62 : .87;
  let seed = 28161;
  for (let p = 0; p < light.length; p++) {
    const i = p * 4;
    const level = light[p];
    const edge = Math.abs(level - (light[p + 1] ?? level)) + Math.abs(level - (light[p + plate.width] ?? level));
    const shade = Math.min(37, Math.max(0, edge - 12) * .64);
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    const grain = ((seed >>> 24) / 255 - .5) * 14;
    for (let c = 0; c < 3; c++) {
      const tint = ink === 'cool' && gradeId !== 'mono' ? [-.15, .18, .23][c] * (255 - level) : 0;
      data[i + c] = data[i + c] * (1 - blend) + lut[level][c] * blend + tint + grain - shade;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  cache.set(key, plate);
  if (cache.size > 8) cache.delete(cache.keys().next().value);
  return plate;
}
