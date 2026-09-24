import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {previewServer} from './serve.mjs';

await mkdir('test-output',{recursive:true});
const server=await previewServer(),checks=[],errors=[],external=[];
const record=(name,detail={})=>checks.push({name,pass:true,...detail});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:resolve('test-output/browser-profile-long-'+Date.now()),args:['--disable-background-networking','--disable-component-update']});
try{
 const page=await browser.newPage();await page.setViewport({width:1280,height:960,deviceScaleFactor:1});page.on('pageerror',error=>errors.push(error.message));
 await page.setRequestInterception(true);page.on('request',request=>{if(request.url().startsWith('http://127.0.0.1:')||request.url().startsWith('data:'))request.continue();else{external.push(request.url());request.abort();}});
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'networkidle0'});await page.waitForSelector('#after [data-ecp-prose]');
 await page.evaluate(()=>window.preview.settings.update({autoMeme:false,mediaGallery:false,visualStyle:'developer-terminal',diyLayout:'collage',glassMotion:true,elementMotion:'mixed'}));await new Promise(resolve=>setTimeout(resolve,230));
 const stream=await page.evaluate(async()=>{
  const prose=document.querySelector('#after [data-ecp-prose]'),before=window.preview.status().decorationScans,nodes=[];prose.replaceChildren();
  for(let index=0;index<120;index++){
   const node=document.createElement(index%12===0?'h2':'p');node.textContent='第'+(index+1)+'段：这是用于验证超长回复在持续生成时不闪烁、不丢字并保持节点身份的正文。'.repeat(8);nodes.push(node);prose.append(node);await new Promise(resolve=>setTimeout(resolve,6));
  }
  window.__ecpLongNodes=nodes;window.__ecpLongText=prose.textContent;window.__ecpLongHTML=prose.innerHTML;
  return{before,after:window.preview.status().decorationScans,length:prose.textContent.length,blocks:prose.children.length};
 });
 assert.equal(stream.after,stream.before);record('unmarked token streaming performs no repeated full-answer decoration',{durationMs:120*6,decorationScans:stream.after,length:stream.length});
 await new Promise(resolve=>setTimeout(resolve,420));
 const settled=await page.evaluate(()=>{
  const prose=document.querySelector('#after [data-ecp-prose]'),last=prose.lastElementChild,root=prose.getBoundingClientRect(),tail=last.getBoundingClientRect(),css=getComputedStyle(prose),animated=[prose,...prose.querySelectorAll('*')].filter(node=>getComputedStyle(node).animationName!=='none').length;
  return{scans:window.preview.status().decorationScans,long:prose.dataset.ecpLongContent,textEqual:prose.textContent===window.__ecpLongText,nodesEqual:[...prose.children].every((node,index)=>node===window.__ecpLongNodes[index]),blocks:prose.children.length,overflow:css.overflow,animation:css.animationName,filter:css.filter,backdrop:css.backdropFilter||css.webkitBackdropFilter,animated,rootBottom:root.bottom,tailBottom:tail.bottom,pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
 });
 assert.equal(settled.scans,stream.before+1);assert.equal(settled.long,'true');assert.equal(settled.textEqual,true);assert.equal(settled.nodesEqual,true);assert.equal(settled.blocks,120);assert.equal(settled.overflow,'visible');assert.equal(settled.animation,'none');assert.equal(settled.filter,'none');assert.ok(settled.backdrop==='none'||settled.backdrop==='');assert.equal(settled.animated,0);assert.ok(settled.tailBottom<=settled.rootBottom+1);assert.equal(settled.pageOverflow,0);
 record('settled long answer keeps all 120 blocks and automatically disables expensive paint effects',settled);
 const restored=await page.evaluate(()=>{const prose=document.querySelector('#after [data-ecp-prose]');window.preview.settings.update({enabled:false});return{textEqual:prose.textContent===window.__ecpLongText,htmlEqual:prose.innerHTML===window.__ecpLongHTML,nodesEqual:[...prose.children].every((node,index)=>node===window.__ecpLongNodes[index]),longAttribute:prose.hasAttribute('data-ecp-long-content')};});
 assert.deepEqual(restored,{textEqual:true,htmlEqual:true,nodesEqual:true,longAttribute:false});record('disabling the plugin restores the exact host HTML without replacing any answer node');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
}finally{
 await writeFile('test-output/browser-long-answer-results.json',JSON.stringify({version:'2.3.3',liveDSH:false,checks,errors,external},null,2));await browser.close();await new Promise(resolve=>server.close(resolve));console.log(JSON.stringify({pass:checks.length,errors,external},null,2));
}
