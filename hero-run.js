/* Distance-driven map gait: held keys against a wall never run in place. */
(() => {
  'use strict';
  const STRIDE=104,FRAMES=8;
  class HeroRun {
    constructor(){this.reset();}
    reset(){this.phase=0;this.blend=0;this.moving=false;this.footfalls=0;}
    update(distance,dt) {
      this.footfalls=0;
      const moving=Number.isFinite(distance)&&distance>.001;
      if(moving) {
        if(!this.moving&&this.blend===0)this.phase=0;
        const next=this.phase+distance/STRIDE;
        this.footfalls=Math.floor(next*2)-Math.floor(this.phase*2);
        this.phase=next%1;
      }
      this.moving=moving;
      const amount=Math.max(0,dt)*(moving?16:12);
      this.blend=moving?Math.min(1,this.blend+amount):Math.max(0,this.blend-amount);
      if(!moving&&this.blend===0)this.phase=0;
    }
    get frame(){return `heroRun${Math.floor(this.phase*FRAMES)%FRAMES}`;}
  }
  HeroRun.STRIDE=STRIDE;HeroRun.FRAMES=FRAMES;
  if(typeof module!=='undefined'&&module.exports)module.exports=HeroRun;else window.HeroRun=HeroRun;
})();
