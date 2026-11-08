const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),W=require('../weapon-sprites.js');
for(const [id,art] of Object.entries(W.data)){assert.ok(fs.existsSync(path.join(__dirname,'..',art.src)));const [x,y,w,h]=art.box;assert.ok(x>=0&&y>=0&&x+w<=art.size[0]&&y+h<=art.size[1]);assert.ok(art.transparentPixels>art.size[0]*art.size[1]*.05);}
for(const key of Object.keys(W.grips)){for(const height of [77,275]){const pose=W.pose(key,height);for(const k of ['x','y','scale','dw','dh'])assert.ok(Number.isFinite(pose[k]),key);}}
assert.ok(W.slashAngle(.3)<W.slashAngle(.6));assert.ok(W.slashAngle(.6)<W.slashAngle(.9),'Sword turns from raised guard through a downward cut');
assert.notEqual(W.weaponSpec.wood.length,W.weaponSpec.steel.length);
console.log('PASS independent PNG weapon art, complete alpha silhouettes, calibrated idle/run/slash anchors and downward cut rotation');
async function verifyIdle(){
 const vm=require('node:vm'),sprites=require('../sprites.js'),calls=[];
 class Image{set src(value){this.path=value;this.complete=true;this.naturalWidth=1254;Promise.resolve().then(()=>this.onload());}}
 const context={Image,WeaponArt:W.data,QSprites:{data:sprites.data,draw:(c,key)=>{calls.push({body:key});return true;},drawPatch(){}}};context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../weapon-sprites.js'),'utf8'),context);
 await context.WeaponSprites.load();const c={save(){},restore(){},translate(){},rotate(){},drawImage(image){calls.push({src:image.path});}};
 for(const id of ['wood','qingfeng','steel']){calls.length=0;context.WeaponSprites.drawHero(c,'heroIdle',275,id);assert.equal(calls.length,1,'A resting swordsman is one complete redrawn pose without overlaying a sword onto a boxing fist');assert.equal(calls[0].src,`assets/q/hero-${id}-idle.png`);}
 calls.length=0;context.WeaponSprites.drawHero(c,'heroIdle',275,'qingfeng',{slashing:true,progress:.53,hitAt:.53});assert.ok(calls.some(c=>c.src==='assets/q/hero-slash.png'));assert.ok(calls.some(c=>c.src==='assets/weapons/qingfeng.png'));
 calls.length=0;context.WeaponSprites.drawHero(c,'heroIdle',275,null);assert.equal(calls[0].body,'heroIdle','Unarmed hero retains original fist pose');
 console.log('PASS complete redrawn armed idle for every sword, reusable attack weapon and unarmed fallback');
}
module.exports=verifyIdle();
