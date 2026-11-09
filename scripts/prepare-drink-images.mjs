import { chromium } from 'playwright';
import { readFile,writeFile,mkdir,rename } from 'node:fs/promises';
import { basename,resolve } from 'node:path';
import { existsSync } from 'node:fs';
const sources=JSON.parse((await readFile('public/assets/drinks/sources.json','utf8')).replace(/^\uFEFF/,''));
await mkdir('artifacts/drink-originals',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:5173');
 for(const source of sources){
  if(basename(source.file)!==source.file)throw Error('Invalid source filename');
  const rawExists=existsSync('public/assets/drinks/'+source.file);
  const sourceUrl=(rawExists?'/assets/drinks/':'/artifacts/drink-originals/')+source.file;
  const result=await page.evaluate(async file=>{
   const image=new Image(); image.src=file; await image.decode();
   const scale=Math.min(1,480/Math.max(image.naturalWidth,image.naturalHeight));
   const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
   canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
   return {data:canvas.toDataURL('image/webp',.88).split(',')[1],width:canvas.width,height:canvas.height};
  },sourceUrl);
  source.optimized=source.file.replace(/\.[^.]+$/,'.webp');source.width=result.width;source.height=result.height;
  const buffer=Buffer.from(result.data,'base64');
  await writeFile('public/assets/drinks/'+source.optimized,buffer);
  if(rawExists)await rename(resolve('public/assets/drinks',source.file),resolve('artifacts/drink-originals',source.file));
  source.bytes=buffer.length;
  console.log(source.name+': '+buffer.length+' bytes');
 }
 await writeFile('public/assets/drinks/sources.json',JSON.stringify(sources,null,2));
}finally{await browser.close();}
