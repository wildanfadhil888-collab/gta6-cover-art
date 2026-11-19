import {layouts,geometry} from './cover-layouts.js';
import {grades} from './gradient-grades.js';
import {defaultPanels,renderPoster} from './poster-renderer.js';
import {exportPNG,exportAll,formats} from './export-png.js';
import {shotSettings,readyAfterPaint} from './shots.js';
const $=s=>document.querySelector(s), canvas=$('#cover');
let state={caption:'SUNSET GETAWAY',subtitle:'Trouble in paradise',layout:'nine',grade:'vice',size:'1920x1080',selected:0,panels:defaultPanels()};
const shot=shotSettings(state);
if(!layouts[state.layout])state.layout='nine';if(!grades[state.grade])state.grade='vice';if(!formats.includes(state.size))state.size='1920x1080';
if(state.layout!=='nine'){const crops=defaultPanels();state.panels=[crops[0],crops[5],crops[7],crops[6],...crops.slice(4)];}
let photos=[],past=[],future=[],drag=null,pending=false;
const snapshot=()=>structuredClone(state);
function remember(){past.push(snapshot());if(past.length>60)past.shift();future=[];}
function commit(fn){remember();fn();sync();}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;renderPoster(canvas,state,photos);});}
function sync(){
 $('#caption').value=state.caption;$('#subtitle').value=state.subtitle;$('#undo').disabled=!past.length;$('#redo').disabled=!future.length;
 $('#panel').innerHTML=geometry(state.layout,canvas.width,canvas.height).panels.map(p=>`<option value="${p.index}">Panel ${String(p.index+1).padStart(2,'0')}${p.index===0?' — Hero':''}</option>`).join('');
 if(state.selected>=$('#panel').options.length)state.selected=0;$('#panel').value=state.selected;
 const p=state.panels[state.selected];$('#zoom').value=p.z;$('#zoom-value').value=p.z.toFixed(2)+'×';$('#offset-x').value=p.x;$('#offset-y').value=p.y;$('#panel-badge').textContent='PANEL '+String(state.selected+1).padStart(2,'0');
 $('#preview-size').textContent=state.size.replace('x',' × ');
 for(const [group,value]of[['layouts',state.layout],['grades',state.grade]])for(const b of $('#'+group).children)b.setAttribute('aria-pressed',b.dataset.value===value);
 for(const b of $('#photos').children)b.setAttribute('aria-pressed',Number(b.dataset.index)===p.photo);
 schedule();
}
function photoButtons(){
 $('#photos').replaceChildren();photos.forEach((photo,i)=>{const b=document.createElement('button');b.dataset.value=photo.id;b.dataset.index=i;b.title=photo.name;b.setAttribute('aria-label',photo.name);const image=document.createElement('img');image.src=photo.src;image.alt=photo.name;b.append(image);b.onclick=()=>commit(()=>{state.panels[state.selected]={photo:i,z:1,x:0,y:0};});$('#photos').append(b);});
}
function loadPhoto(src,id,name){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve({src,id,name,image});image.onerror=()=>reject(new Error('Cannot load '+name));image.src=src;});}
for(const [id,l]of Object.entries(layouts)){const b=document.createElement('button');b.dataset.value=id;b.innerHTML=`<strong>${l.icon}</strong>${l.name}`;b.onclick=()=>commit(()=>{state.layout=id;state.selected=0;});$('#layouts').append(b);}
for(const [id,g]of Object.entries(grades)){const b=document.createElement('button');b.dataset.value=id;b.innerHTML=`<span class="swatch" style="background:linear-gradient(135deg,${g.stops.join(',')})"></span>${g.name}`;b.onclick=()=>commit(()=>state.grade=id);$('#grades').append(b);}
$('#undo').onclick=()=>{if(!past.length)return;future.push(snapshot());state=past.pop();sync();};
$('#redo').onclick=()=>{if(!future.length)return;past.push(snapshot());state=future.pop();sync();};
for(const key of ['caption','subtitle'])$('#'+key).addEventListener('input',e=>commit(()=>state[key]=e.target.value));
$('#panel').onchange=e=>{state.selected=Number(e.target.value);sync();};
for(const [id,key]of [['zoom','z'],['offset-x','x'],['offset-y','y']]){
 const input=$('#'+id);let moving=false;
 input.addEventListener('pointerdown',()=>{remember();moving=true;});input.addEventListener('input',()=>{if(!moving)remember();state.panels[state.selected][key]=Number(input.value);sync();});input.addEventListener('change',()=>moving=false);input.addEventListener('pointerup',()=>moving=false);
}
$('#reset-crop').onclick=()=>commit(()=>Object.assign(state.panels[state.selected],{z:1,x:0,y:0}));
let uploadNumber=0;
$('#upload').onchange=async e=>{try{for(const file of e.target.files){const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});photos.push(await loadPhoto(data,'upload-'+uploadNumber++,file.name));}photoButtons();sync();$('#status').textContent='Photos added. Pick a panel, then choose a photo.';}catch(error){$('#status').textContent=error.message;}};
function position(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};}
canvas.onpointerdown=e=>{const point=position(e),panels=geometry(state.layout,canvas.width,canvas.height).panels;const panel=[...panels].reverse().find(p=>{const dx=point.x-p.x-p.w/2,dy=point.y-p.y-p.h/2;const x=dx*Math.cos(-p.angle)-dy*Math.sin(-p.angle),y=dx*Math.sin(-p.angle)+dy*Math.cos(-p.angle);return Math.abs(x)<p.w/2&&Math.abs(y)<p.h/2;});if(!panel)return;state.selected=panel.index;remember();drag={...point,x0:state.panels[panel.index].x,y0:state.panels[panel.index].y,panel};canvas.setPointerCapture(e.pointerId);sync();};
canvas.onpointermove=e=>{if(!drag)return;const p=position(e),crop=state.panels[state.selected];crop.x=Math.max(-1,Math.min(1,drag.x0+(p.x-drag.x)/drag.panel.w*2));crop.y=Math.max(-1,Math.min(1,drag.y0+(p.y-drag.y)/drag.panel.h*2));sync();};
canvas.onpointerup=()=>drag=null;canvas.onpointercancel=()=>drag=null;
canvas.addEventListener('wheel',e=>{e.preventDefault();commit(()=>{const p=state.panels[state.selected];p.z=Math.max(1,Math.min(6,p.z+Math.sign(e.deltaY)*-.1));});},{passive:false});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'#redo':'#undo').click();}});
for(const b of $('#exports').children)b.onclick=async()=>{try{await exportPNG(state,photos,b.dataset.value);commit(()=>state.size=b.dataset.value);$('#status').textContent=`PNG downloaded · ${b.dataset.value.replace('x',' × ')}`;}catch(error){$('#status').textContent=error.message;}};
$('#export-all').onclick=async()=>{try{await exportAll(snapshot(),photos);}catch(error){$('#status').textContent=error.message;}};
async function boot(){
 await Promise.all([document.fonts.load('20px Anton'),document.fonts.load('20px Pacifico')]);
 const names=['boulevard','pier','rooftop','neon-street'];photos=await Promise.all(names.map((name,i)=>loadPhoto(`./samples/${name}.jpg`,'sample-'+i,name.replace('-',' '))));
 if(shot.photo){let name=shot.photo.replace(/\.jpg$/,'');const i=names.indexOf(name);if(i>=0)state.panels[0].photo=i;}
 photoButtons();sync();renderPoster(canvas,state,photos);await readyAfterPaint();
}
boot().catch(error=>{$('#status').textContent=error.message;console.error(error);});
