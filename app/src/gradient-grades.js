const palettes = {
  vice: ['Vice Sunset', '#16152e', '#ae3b77', '#ff9c69', '#fff1c6'],
  neon: ['Neon Nights', '#07162d', '#583488', '#eb62bd', '#a8fff3'],
  golden: ['Golden Hour', '#211821', '#8e493c', '#f7ac62', '#fff1c6'],
  teal: ['Teal Noir', '#061e29', '#17747d', '#9caaa0', '#ffe1aa'],
  pink: ['Hot Pink', '#21102c', '#9d216b', '#f880b3', '#ffe6c4'],
  mono: ['Mono Chrome', '#10131a', '#555764', '#adb4b6', '#fff2de'],
};
const rgb = hex => hex.match(/[a-f\d]{2}/gi).map(x => parseInt(x,16));
export const grades = Object.fromEntries(Object.entries(palettes).map(([id,[name,...stops]]) => {
  const colors = stops.map(rgb);
  const table = Array.from({length:256}, (_,i) => {
    const p=i/255*3, a=Math.min(2,Math.floor(p)), t=p-a;
    return colors[a].map((v,c)=>Math.round(v+(colors[a+1][c]-v)*t));
  });
  return [id,{id,name,stops,table,inks:{hero:.37,cool:.54,base:.43},grain:3.8,vignette:.3}];
}));
export function applyGrade(canvas, id, ink='base') {
  const grade=grades[id] || grades.vice, ctx=canvas.getContext('2d',{willReadFrequently:true});
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height), data=pixels.data;
  const amount=grade.inks[ink];
  for(let p=0;p<data.length;p+=4){
    const light=Math.max(0,Math.min(255,Math.round((data[p]*.25+data[p+1]*.6+data[p+2]*.15-128)*1.19+128)));
    const color=grade.table[light], n=(((p*1664525+1013904223)>>>15)%17-8)*grade.grain/8;
    for(let c=0;c<3;c++) data[p+c]=Math.max(0,Math.min(255,(data[p+c]-128)*1.1*(1-amount)+128*(1-amount)+color[c]*amount+n));
  }
  ctx.putImageData(pixels,0,0);
  const v=ctx.createRadialGradient(canvas.width*.5,canvas.height*.43,canvas.width*.12,canvas.width*.5,canvas.height*.5,Math.max(canvas.width,canvas.height)*.7);
  v.addColorStop(0,'#09091d00');v.addColorStop(1,`rgba(5,8,25,${grade.vignette})`);ctx.fillStyle=v;ctx.fillRect(0,0,canvas.width,canvas.height);
}
