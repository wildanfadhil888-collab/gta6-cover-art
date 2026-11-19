export const layouts = {
 nine:{name:'Nine panel',icon:'▦',rects:[[.25,.34,.5,.66],[0,0,.25,.34],[.25,0,.25,.34],[.5,0,.25,.34],[.75,0,.25,.34],[0,.34,.25,.33],[0,.67,.25,.33],[.75,.34,.25,.33],[.75,.67,.25,.33]]},
 hero3:{name:'Hero + three',icon:'▤',rects:[[0,0,.7,1],[.7,0,.3,.333],[.7,.333,.3,.334],[.7,.667,.3,.333]]},
 full:{name:'Full bleed',icon:'▣',rects:[[0,0,1,1]]},
 tilt:{name:'Snapshots',icon:'◩',rects:[[.04,.08,.57,.8,-.07],[.56,.03,.39,.46,.08],[.57,.51,.37,.45,-.06]]},
 split:{name:'Split duo',icon:'◧',rects:[[0,0,.5,1],[.5,0,.5,1]]},
 story:{name:'Story strip',icon:'▥',rects:[[0,0,1,.59],[0,.59,.333,.41],[.333,.59,.334,.41],[.667,.59,.333,.41]]},
};
export function geometry(id,w,h){
 const margin=Math.round(Math.min(w,h)*.019), band=Math.round(h*(w>h?.285:.265));
 const area={x:margin,y:band+margin,w:w-2*margin,h:h-band-2*margin};
 const panels=(layouts[id]||layouts.nine).rects.map(([x,y,pw,ph,angle=0],index)=>({index,x:area.x+x*area.w,y:area.y+y*area.h,w:pw*area.w,h:ph*area.h,angle}));
 if(panels.some(p=>p.y<band))throw new Error('Title band overlaps panels');
 return {margin,band,area,panels};
}
