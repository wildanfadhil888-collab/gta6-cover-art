'use strict';

async function exportCoverPng(state, photos, size) {
  const { width, height } = exportFormats[size];
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  drawCoverPoster(output, state, photos);
  const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('PNG encoding failed');
  const slug = state.caption.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slug || 'neon-coast'}-${size}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
