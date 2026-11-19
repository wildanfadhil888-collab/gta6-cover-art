'use strict';

const coverLayouts = {
  nine: 'Nine-panel grid', hero3: 'Hero + three', full: 'Full bleed',
  tilt: 'Tilted snapshots', split: 'Split duo', story: 'Story strip'
};

function panel(id, points, angle = 0) {
  return { id, points, angle };
}

function rectangle(id, x, y, w, h, angle) {
  return panel(id, [[x,y],[x+w,y],[x+w,y+h],[x,y+h]], angle);
}

function drawNinePanelCover() {
  const left = [[0,0],[.29,0],[.255,.32],[.22,.66],[.19,1]];
  const right = [[1,0],[.73,0],[.765,.33],[.79,.68],[.83,1]];
  return [
    panel(0, [left[1], [.52,0], [.70,.23], right[2], right[3], [.56,.76], [.35,.80], left[3], left[2]]),
    panel(1, [left[0],left[1],left[2],[0,.38]]),
    panel(2, [[0,.38],left[2],left[3],[0,.72]]),
    panel(3, [[0,.72],left[3],[.35,.80],left[4],[0,1]]),
    panel(4, [[.52,0],right[1],right[2],[.70,.23]]),
    panel(5, [right[1],right[0],[1,.30],right[2]]),
    panel(6, [right[2],[1,.30],[1,.66],right[3]]),
    panel(7, [right[3],[1,.66],[1,1],right[4],[.56,.76]]),
    panel(8, [left[4],[.35,.80],[.56,.76],right[4]])
  ];
}

function getCoverPanels(layout, portrait) {
  switch (layout) {
    case 'hero3': return [
      rectangle(0,0,0,1,.71), rectangle(1,0,.71,.33,.29),
      rectangle(2,.33,.71,.34,.29), rectangle(3,.67,.71,.33,.29)
    ];
    case 'full': return [rectangle(0,0,0,1,1)];
    case 'tilt': return [
      rectangle(1,.08,.11,.41,.61,-.13), rectangle(2,.56,.12,.36,.63,.14),
      rectangle(0,.28,.09,.46,.76,-.045)
    ];
    case 'split': return [
      panel(0, [[0,0],[.56,0],[.45,1],[0,1]]),
      panel(1, [[.56,0],[1,0],[1,1],[.45,1]])
    ];
    case 'story': return portrait ? [
      rectangle(0,.09,0,.82,.52),
      panel(1, [[.09,.52],[.91,.52],[.91,.77],[.09,.72]]),
      panel(2, [[.09,.72],[.91,.77],[.91,1],[.09,1]])
    ] : [
      rectangle(1,0,.07,.26,.86), rectangle(0,.26,.07,.48,.86), rectangle(2,.74,.07,.26,.86)
    ];
    default: return drawNinePanelCover();
  }
}

function panelGeometry(panel, frame) {
  const points = panel.points.map(([x,y]) => [frame.x + x * frame.w, frame.y + y * frame.h]);
  const xs = points.map(point => point[0]);
  const ys = points.map(point => point[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  const w = Math.max(...xs) - x, h = Math.max(...ys) - y;
  const path = new Path2D();
  points.forEach(([px,py], i) => {
    const dx = px - x - w / 2, dy = py - y - h / 2;
    const rx = x + w / 2 + dx * Math.cos(panel.angle) - dy * Math.sin(panel.angle);
    const ry = y + h / 2 + dx * Math.sin(panel.angle) + dy * Math.cos(panel.angle);
    if (i === 0) path.moveTo(rx, ry);
    else path.lineTo(rx, ry);
  });
  path.closePath();
  return { ...panel, x, y, w, h, path };
}
