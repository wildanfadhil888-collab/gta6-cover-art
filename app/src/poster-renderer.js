import {geometry} from './cover-layouts.js';
import {applyGrade,grades} from './gradient-grades.js';
const cache=new Map();
export function defaultPanels(){
 return [
  {photo:0,z:1,x:0,y:.65},
  {photo:2,z:2.8,x:-1,y:1},
  {photo:1,z:3.2,x:-1,y:0},
  {photo:3,z:3.4,x:-.7,y:-1},
  {photo:0,z:3.4,x:1,y:-.8},
  {photo:2,z:1.05,x:-.38,y:0},
  {photo:1,z:1.1,x:-.3,y:.72},
  {photo:3,z:1,x:0,y:0},
  {photo:2,z:3.3,x:-1,y:0},
 ];
}
function panelImage(photo,p,w,h,grade,index){
 const key=[photo.id,p.z,p.x,p.y,w,h,grade,index].join(':');
 if(cache.has(key))return cache.get(key);
 const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));
 const g=c.getContext('2d');
 const scale=Math.max(c.width/photo.image.width,c.height/photo.image.height)*p.z;
 const dw=photo.image.width*scale,dh=photo.image.height*scale;
 const dx=(c.width-dw)*(.5-p.x*.5),dy=(c.height-dh)*(.5-p.y*.5);
 g.drawImage(photo.image,dx,dy,dw,dh);
 applyGrade(c,grade,index===0?'hero':index%2?'cool':'base');
 if(cache.size>65)cache.clear();cache.set(key,c);return c;
}
function fitText(ctx,text,maxWidth,fontSize){while(fontSize>12){ctx.font=`${fontSize}px Anton`;if(ctx.measureText(text).width<=maxWidth)break;fontSize-=2;}return fontSize;}
export function renderPoster(canvas,state,photos,options={}){
 const [w,h]=state.size.split('x').map(Number);if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
 const ctx=canvas.getContext('2d'),geo=geometry(state.layout,w,h),unit=Math.min(w,h)/1080;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#10121b';ctx.fillRect(0,0,w,h);
 const colors=grades[state.grade].stops;
 let bg=ctx.createLinearGradient(0,0,w,geo.band);bg.addColorStop(0,'#281a38');bg.addColorStop(.52,'#622744');bg.addColorStop(1,'#192c3c');ctx.fillStyle=bg;ctx.fillRect(0,0,w,geo.band);
 ctx.fillStyle='#f0a5a2';ctx.globalAlpha=.1;
 for(let y=9*unit;y<geo.band;y+=10*unit)for(let x=8*unit;x<w;x+=10*unit){ctx.beginPath();ctx.arc(x,y,1.7*unit,0,7);ctx.fill();}ctx.globalAlpha=1;
 for(const panel of geo.panels){
  const p=state.panels[panel.index]||state.panels[0], photo=photos[p.photo]||photos[0];
  const gap=7*unit;ctx.save();ctx.translate(panel.x+panel.w/2,panel.y+panel.h/2);ctx.rotate(panel.angle);
  if(state.layout==='tilt'){ctx.shadowColor='#000b';ctx.shadowBlur=20*unit;ctx.fillStyle='#f3dbc4';ctx.fillRect(-panel.w/2-gap,-panel.h/2-gap,panel.w+gap*2,panel.h+gap*5);ctx.shadowBlur=0;}
  ctx.beginPath();ctx.rect(-panel.w/2+gap/2,-panel.h/2+gap/2,panel.w-gap,panel.h-gap);ctx.clip();
  ctx.drawImage(panelImage(photo,p,panel.w,panel.h,state.grade,panel.index),-panel.w/2,-panel.h/2,panel.w,panel.h);
  const shade=ctx.createLinearGradient(0,0,0,panel.h/2);shade.addColorStop(0,'#05051200');shade.addColorStop(1,'#09051a90');ctx.fillStyle=shade;ctx.fillRect(-panel.w/2,-panel.h/2,panel.w,panel.h);
  ctx.restore();
  if(options.selection===panel.index){ctx.save();ctx.strokeStyle='#ffc7d8';ctx.lineWidth=3*unit;ctx.setLineDash([10*unit,6*unit]);ctx.strokeRect(panel.x+gap/2,panel.y+gap/2,panel.w-gap,panel.h-gap);ctx.restore();}
 }
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f7c9bc';ctx.font=`${13*unit}px Arial`;const top=w>h?25*unit:29*unit;
 ctx.letterSpacing=`${4*unit}px`;ctx.fillText('NEON COAST  /  A LIFE LESS ORDINARY',w/2,top);ctx.letterSpacing='0px';
 const title=(state.caption||'UNTITLED').toUpperCase();
 let fs=fitText(ctx,title,w*.9,geo.band*.51);ctx.font=`${fs}px Anton`;
 const titleY=geo.band*.44;ctx.lineJoin='round';ctx.shadowColor='#080d21';ctx.shadowOffsetX=4*unit;ctx.shadowOffsetY=8*unit;ctx.lineWidth=12*unit;ctx.strokeStyle='#101127';ctx.strokeText(title,w/2,titleY);
 const titleFill=ctx.createLinearGradient(0,titleY-fs/2,0,titleY+fs/2);titleFill.addColorStop(0,'#fff7da');titleFill.addColorStop(.45,'#ffd4b8');titleFill.addColorStop(1,colors[2]);ctx.fillStyle=titleFill;ctx.fillText(title,w/2,titleY);ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
 const scriptSize=Math.min(geo.band*.22,w/Math.max(12,(state.subtitle||'').length)*1.5);ctx.font=`${scriptSize}px Pacifico`;ctx.strokeStyle='#252039';ctx.lineWidth=8*unit;ctx.strokeText(state.subtitle,w/2,geo.band*.8);ctx.fillStyle='#a8f4df';ctx.shadowColor='#2efcc8';ctx.shadowBlur=13*unit;ctx.fillText(state.subtitle,w/2,geo.band*.8);ctx.shadowBlur=0;
 ctx.strokeStyle='#f5b7a5';ctx.lineWidth=2*unit;ctx.strokeRect(geo.margin*.47,geo.margin*.47,w-geo.margin*.94,h-geo.margin*.94);
 const badgeWidth=220*unit;ctx.fillStyle='#10131de8';ctx.fillRect(w-geo.margin-badgeWidth,h-geo.margin-41*unit,badgeWidth,41*unit);ctx.fillStyle='#f2cfb3';ctx.font=`${11*unit}px Arial`;ctx.fillText('VOL. 06  /  AFTER HOURS',w-geo.margin-badgeWidth/2,h-geo.margin-20*unit);
 return geo;
}
