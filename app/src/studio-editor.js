'use strict';

const byId = id => document.getElementById(id);
const canvas = byId('cover');
const stage = canvas.parentElement;
const scene = readShotScene();
const photos = new Map();
const undoStack = [], redoStack = [];
const cropDefaults = [
  [1.12, 8,-88], [2.45,-92,-100], [1.38, 74,-95],
  [2.1,-92,86], [1.55,80,-100], [1.33,-35,-100],
  [2.35,95,33], [2.12,98,98], [2.6,-88,86]
];
const secondSample = scene.sample === 'pier' ? 'boulevard' : 'pier';
let state = {
  caption: scene.caption, subtitle: scene.subtitle, layout: scene.layout,
  grade: scene.grade, size: scene.size, dots: true,
  crops: cropDefaults.map(([zoom,x,y], i) => ({zoom,x,y,photo: [2,4,5,7].includes(i) ? secondSample : scene.sample}))
};
let selection = 0, showSelection = false, shapes = [], ready = false;
let raf = 0, photoCount = 0, exporting = false;
const controlGroups = {};

function selectionButton(container, id, name, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.value = id;
  button.textContent = name;
  button.addEventListener('click', action);
  container.append(button);
  return button;
}

function reflectChoices(container, value) {
  for (const button of container.children) {
    button.setAttribute('aria-pressed', String(button.dataset.value === value));
  }
}

function fitCanvas() {
  if (scene.mode === 'cover') return;
  const style = getComputedStyle(stage);
  const width = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const height = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const scale = Math.max(0, Math.min(width / canvas.width, height / canvas.height));
  canvas.style.width = `${Math.round(canvas.width * scale)}px`;
  canvas.style.height = `${Math.round(canvas.height * scale)}px`;
}

function paintStudio() {
  raf = 0;
  if (!ready) return;
  const { width, height } = exportFormats[state.size];
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    fitCanvas();
  }
  shapes = drawCoverPoster(canvas, state, photos, showSelection ? selection : null);
}

function schedulePaint() {
  if (!raf) raf = requestAnimationFrame(paintStudio);
}

function syncControls() {
  const panels = getCoverPanels(state.layout, state.size === '1080x1350');
  if (!panels.some(p => p.id === selection)) selection = 0;
  const panelSelect = byId('panel');
  const panelIds = panels.map(p => p.id).sort((a,b) => a-b);
  if (panelSelect.dataset.ids !== panelIds.join()) {
    panelSelect.replaceChildren(...panelIds.map(id => new Option(id === 0 ? '01 · Hero' : String(id + 1).padStart(2,'0'), id)));
    panelSelect.dataset.ids = panelIds.join();
  }
  panelSelect.value = selection;
  const crop = state.crops[selection];
  for (const key of ['zoom', 'x', 'y']) byId(key).value = crop[key];
  reflectChoices(byId('photos'), crop.photo);
  reflectChoices(controlGroups.layouts, state.layout);
  reflectChoices(controlGroups.grades, state.grade);
  reflectChoices(controlGroups.formats, state.size);
  byId('grade-name').value = gradientGrades[state.grade].name;
  for (const key of ['caption','subtitle']) {
    if (byId(key).value !== state[key]) byId(key).value = state[key];
  }
  byId('dots').checked = state.dots;
  byId('undo').disabled = !undoStack.length;
  byId('redo').disabled = !redoStack.length;
  schedulePaint();
}

function rememberState(before) {
  undoStack.push(before);
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
}

function changeState(edit) {
  const before = structuredClone(state);
  edit(state);
  if (JSON.stringify(before) !== JSON.stringify(state)) rememberState(before);
  syncControls();
}

function moveHistory(source, destination) {
  if (!source.length) return;
  destination.push(state);
  state = source.pop();
  syncControls();
}

function bindLiveInput(id, update) {
  const input = byId(id);
  let remembered = false;
  const end = () => { remembered = false; };
  input.addEventListener('focus', end);
  input.addEventListener('blur', end);
  input.addEventListener('change', end);
  input.addEventListener('pointerdown', end);
  input.addEventListener('input', () => {
    if (!remembered) rememberState(structuredClone(state));
    remembered = true;
    update(input.value);
    syncControls();
  });
}

async function addPhoto(id, name, source) {
  const image = new Image();
  image.src = source;
  await image.decode();
  photos.set(id, { image, name });
  const button = selectionButton(byId('photos'), id, '', () => {
    showSelection = true;
    changeState(s => {
      if (s.crops[selection].photo !== id) s.crops[selection] = { photo: id, zoom: 1, x: 0, y: 0 };
    });
  });
  button.className = 'photo';
  button.title = `Assign ${name} to panel`;
  const thumbnail = document.createElement('img');
  thumbnail.src = source;
  thumbnail.alt = '';
  const label = document.createElement('span');
  label.textContent = name;
  button.append(thumbnail, label);
}

function buildEditorControls() {
  for (const id of ['layouts','grades','formats']) controlGroups[id] = byId(id);
  for (const [id, name] of Object.entries(coverLayouts)) {
    const button = selectionButton(controlGroups.layouts, id, name, () => changeState(s => { s.layout = id; }));
    const icon = document.createElement('canvas');
    icon.width = 56;
    icon.height = 32;
    icon.className = 'layout-icon';
    icon.setAttribute('aria-hidden', 'true');
    const ctx = icon.getContext('2d');
    const frame = { x: 2, y: 2, w: 52, h: 28 };
    for (const p of getCoverPanels(id, false)) {
      const geometry = panelGeometry(p, frame);
      ctx.fillStyle = p.id === 0 ? '#f4afac' : id === 'tilt' ? '#704059' : '#835774';
      ctx.strokeStyle = '#24162a';
      ctx.lineWidth = 2.5;
      ctx.fill(geometry.path);
      ctx.stroke(geometry.path);
    }
    button.prepend(icon);
  }
  for (const [id, grade] of Object.entries(gradientGrades)) {
    const button = selectionButton(controlGroups.grades, id, '', () => changeState(s => { s.grade = id; }));
    button.title = grade.name;
    button.setAttribute('aria-label', grade.name);
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.backgroundImage = `linear-gradient(130deg,${grade.stops.join(',')})`;
    button.append(swatch);
  }
  for (const [size, format] of Object.entries(exportFormats)) {
    selectionButton(controlGroups.formats, size, format.name, () => changeState(s => { s.size = size; }));
    selectionButton(byId('exports'), size, size.replace('x', ' × '), () => downloadFormats([size]));
  }
  byId('export-all').addEventListener('click', () => downloadFormats(Object.keys(exportFormats)));
}

async function downloadFormats(sizes) {
  if (!ready || exporting) return;
  exporting = true;
  const buttons = [...byId('exports').children, byId('export-all')];
  buttons.forEach(button => { button.disabled = true; });
  const snapshot = structuredClone(state);
  try {
    byId('status').textContent = 'Preparing PNG…';
    for (const size of sizes) await exportCoverPng(snapshot, photos, size);
    byId('status').textContent = sizes.length === 1 ? 'PNG download started.' : 'Three PNG downloads started.';
  } catch {
    byId('status').textContent = 'Could not create the PNG. Try exporting again.';
  } finally {
    exporting = false;
    buttons.forEach(button => { button.disabled = false; });
  }
}

function selectPanel(id) {
  selection = id;
  showSelection = true;
  byId('status').textContent = `Panel ${String(id + 1).padStart(2, '0')} selected · Adjust its crop or photo.`;
  syncControls();
}

function bindStudioControls() {
  byId('undo').addEventListener('click', () => moveHistory(undoStack, redoStack));
  byId('redo').addEventListener('click', () => moveHistory(redoStack, undoStack));
  byId('panel').addEventListener('change', event => selectPanel(Number(event.target.value)));
  byId('dots').addEventListener('change', event => changeState(s => { s.dots = event.target.checked; }));
  for (const id of ['caption', 'subtitle']) bindLiveInput(id, value => { state[id] = value; });
  for (const id of ['zoom', 'x', 'y']) bindLiveInput(id, value => {
    state.crops[selection][id] = Number(value);
    showSelection = true;
  });
  canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * canvas.width / rect.width;
    const y = (event.clientY - rect.top) * canvas.height / rect.height;
    const ctx = canvas.getContext('2d');
    const hit = shapes.findLast(shape => ctx.isPointInPath(shape.path, x, y));
    if (hit) selectPanel(hit.id);
  });
  byId('upload').addEventListener('change', async event => {
    const files = [...event.target.files];
    event.target.value = '';
    if (!files.length) return;
    const targetPanel = selection;
    let first, failures = 0;
    for (const file of files) {
      const id = `upload-${++photoCount}`;
      const source = URL.createObjectURL(file);
      try {
        await addPhoto(id, file.name, source);
        first ??= id;
      } catch {
        failures++;
        URL.revokeObjectURL(source);
      }
    }
    if (first) {
      showSelection = true;
      changeState(s => { s.crops[targetPanel] = { photo: first, zoom: 1, x: 0, y: 0 }; });
    }
    byId('status').textContent = failures ? `${failures} photo(s) could not be opened.` : 'Photo added to the selected panel.';
  });
}

async function openCoverStudio() {
  if (scene.mode === 'cover') document.body.classList.add('shot-cover');
  else {
    buildEditorControls();
    bindStudioControls();
    new ResizeObserver(fitCanvas).observe(stage);
    const panels = canvas.getContext('2d');
    panels.fillStyle = nightInk;
    panels.fillRect(0, 0, canvas.width, canvas.height);
  }
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('40px Pacifico'),
      addPhoto('boulevard', 'Boulevard', './samples/boulevard.jpg'),
      addPhoto('pier', 'Pier', './samples/pier.jpg')
    ]);
    ready = true;
    showSelection = scene.mode === 'editor';
    if (scene.mode !== 'cover') syncControls();
    paintStudio();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
  } catch {
    byId('status').textContent = 'Could not open the local samples or fonts.';
  }
}

openCoverStudio();
