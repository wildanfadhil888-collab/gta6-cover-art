import {renderPoster} from './poster-renderer.js';
export const formats=['1920x1080','1080x1350','1080x1080'];
export async function exportPNG(state,photos,size){
 const canvas=document.createElement('canvas');renderPoster(canvas,{...state,size},photos);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG encoding failed')),'image/png'));
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`neon-coast-${size}.png`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
 return blob;
}
export async function exportAll(state,photos){for(const size of formats)await exportPNG(state,photos,size);document.querySelector('#status').textContent='Three PNG downloads started.';}
