export function shotSettings(state){
 const query=new URLSearchParams(location.search);
 if(query.get('shot')==='cover')document.body.classList.add('cover-only');
 for(const key of ['layout','grade','size','caption'])if(query.has(key))state[key]=query.get(key);
 return {photo:query.get('photo'),shot:query.get('shot')};
}
export async function readyAfterPaint(){await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));window.__shotReady=true;}
