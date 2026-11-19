'use strict';

const exportFormats = {
  '1920x1080': { width: 1920, height: 1080, name: 'Landscape' },
  '1080x1350': { width: 1080, height: 1350, name: 'Portrait' },
  '1080x1080': { width: 1080, height: 1080, name: 'Square' }
};

function readShotScene() {
  const query = new URLSearchParams(location.search);
  const mode = query.get('shot');
  const layout = query.get('layout');
  const grade = query.get('grade');
  const size = query.get('size');
  return {
    mode,
    sample: query.get('photo') === 'pier' ? 'pier' : 'boulevard',
    caption: query.get('caption')?.slice(0, 60) ?? 'SUNSET GETAWAY',
    subtitle: query.get('subtitle')?.slice(0, 60) ?? 'After the heat',
    layout: Object.hasOwn(coverLayouts, layout) ? layout : 'nine',
    grade: Object.hasOwn(gradientGrades, grade) ? grade : 'vice',
    size: Object.hasOwn(exportFormats, size) ? size : '1920x1080'
  };
}
