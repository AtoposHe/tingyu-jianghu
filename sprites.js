/* PNG key poses are selected by battle phase; rules still settle independently. */
(() => {
  'use strict';
  const data=typeof module!=='undefined'&&module.exports?require('./sprite-data.js'):window.QSpriteData;
  const images={},loads={};
  function load() {
    return Promise.all(Object.entries(data).map(([key,frame])=>{
      // Eight run frames share one PNG; load/decode that sheet only once.
      if(!loads[frame.src])loads[frame.src]=new Promise((resolve,reject)=>{
        const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`素材加载失败：${frame.src}`));image.src=frame.src;
      });
      return loads[frame.src].then(image=>{images[key]=image;return image;});
    }));
  }
  function chooseFrame(side,state={}) {
    const prefix=side==='hero'?'hero':'enemy';
    if(state.hit)return prefix+'Hit';
    if(!state.attacking)return prefix+'Idle';
    const p=state.progress,hit=state.hitAt;
    if(side==='enemy'&&state.action==='skill'&&p>=.30&&p<.88)return 'enemyPalm';
    if(p<hit-.14)return side==='hero'?'heroWindup':'enemyIdle';
    if(p<hit+.19)return side==='hero'?'heroAttack':state.action==='skill'?'enemyPalm':'enemyAttack';
    if(side==='hero'&&p<.88)return 'heroWindup';
    return prefix+'Idle';
  }
  function geometry(key,height) {
    const frame=data[key];if(!frame)throw Error(`Unknown sprite frame: ${key}`);
    const [sx,sy,sw,sh]=frame.box,scale=height/(frame.referenceHeight||sh);
    return {sx,sy,sw,sh,dx:(sx-frame.anchor[0])*scale,dy:(sy-frame.anchor[1])*scale,dw:sw*scale,dh:sh*scale};
  }
  function drawImage(c,image,key,height) {
    if(!image?.complete||!image.naturalWidth)return false;
    const g=geometry(key,height);c.drawImage(image,g.sx,g.sy,g.sw,g.sh,g.dx,g.dy,g.dw,g.dh);return true;
  }
  function draw(c,key,height) {return drawImage(c,images[key],key,height);}
  function drawPatch(c,key,x,y,w,h,height){const image=images[key],frame=data[key];if(!image?.complete)return;const s=height/(frame.referenceHeight||frame.box[3]);c.drawImage(image,x,y,w,h,(x-frame.anchor[0])*s,(y-frame.anchor[1])*s,w*s,h*s);}
  const api={drawPatch,height:275,data,load,chooseFrame,geometry,draw,drawImage};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.QSprites=api;
})();
