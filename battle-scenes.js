/* Scene selection is independent of combat rules and animation timing. */
(() => {
  'use strict';
  const scenes=Object.freeze({
    dojo:Object.freeze({id:'dojo',name:'听雨武馆 · 演武院',caption:'武馆切磋 · 点到即止',src:'assets/battles/dojo-courtyard.png',version:'dojo-painted-2',focalY:.68}),
    village:Object.freeze({id:'village',name:'听雨村 · 村中空地',caption:'村中切磋 · 以武会友',src:'assets/courtyard.svg',focalY:.5})
  });
  // New opponents only need a scene entry here; they need not share the dojo.
  const opponents=Object.freeze({trainer:'dojo',elder:'village'}),loads=new Map();
  function forOpponent(id){return scenes[opponents[id]||'village'];}
  function load(scene){
    if(!loads.has(scene.src))loads.set(scene.src,new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{loads.delete(scene.src);reject(new Error(`战斗场景加载失败：${scene.src}`));};img.src=scene.src+(scene.version?'?v='+encodeURIComponent(scene.version):'');
    }));
    return loads.get(scene.src);
  }
  function crop(iw,ih,w,h,focalY=.5){
    const scale=Math.max(w/iw,h/ih),sw=w/scale,sh=h/scale;
    return {sx:(iw-sw)/2,sy:(ih-sh)*Math.max(0,Math.min(1,focalY)),sw,sh};
  }
  function draw(ctx,img,w,h,scene){
    if(!img?.complete||!img.naturalWidth||!img.naturalHeight)return false;
    const r=crop(img.naturalWidth,img.naturalHeight,w,h,scene.focalY);
    ctx.drawImage(img,r.sx,r.sy,r.sw,r.sh,0,0,w,h);return true;
  }
  const api={scenes,opponents,forOpponent,load,crop,draw};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.BattleScenes=api;
})();
