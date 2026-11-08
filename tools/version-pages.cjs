/* Give edited JS/CSS new URLs even if an older dev server cached them. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
for(const file of ['index.html','effects.html']){
  const target=path.join(root,file);
  const html=fs.readFileSync(target,'utf8').replace(/(src|href)="([^"?:]+\.(?:js|css))(?:\?[^"\s]*)?"/g,(match,attribute,asset)=>{
    const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,asset))).digest('hex').slice(0,12);
    return `${attribute}="${asset}?v=${hash}"`;
  });
  fs.writeFileSync(target,html);
}
console.log('Versioned local scripts and styles in game and effects pages');
