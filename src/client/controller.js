import {ASSISTANT,discoverAdapter,proseInRow,moduleClass} from './adapter.js';
import {VERSION} from '../version.js';
import {createGalleryManager} from './gallery.js';
import {createMemeManager} from './memes.js';
import {createEnhancementManager} from './enhancements.js';
import {colorsFor} from '../shared/final-presets.js';
const SERIOUS_FACE=/(?:医疗|疾病|症状|用药|法律|诉讼|合同|财务|投资|股票|急救|隐私|密码|账户|事故|灾难|死亡|哀悼|风险|警告|错误|失败|故障|犯罪|战争|暴力|伤亡|失踪|自杀|抑郁|投诉|赔偿|报警)/u;
export function faceForText(text){
 const value=String(text??'').replace(/\s+/g,' ').trim();
 if(!value||SERIOUS_FACE.test(value))return '';
 if(/(?:恭喜|完成|成功|达成|搞定|终于)/u.test(value))return '🎉';
 if(/(?:为什么|原因|分析|判断|考虑|思考|怎么选|区别)/u.test(value))return '🤔';
 if(/(?:开心|喜欢|期待|旅行|美食|推荐|漂亮|好看|轻松)/u.test(value))return '😊';
 if(/(?:加油|慢慢来|别急|陪你|可以做到|没关系)/u.test(value))return '🙂';
 return '😊';
}
export function installTypography(doc,settings,css){
 const win=doc.defaultView,owned=new Set(),pending=new Set(),dirty=new Set(),listeners=new Set(),settleTimers=new Map();
 const originals=new Map(),styleOriginals=new Map(),rowMembers=new WeakMap(),tables=new Map();
 const updateTable=node=>{if(!tables.has(node)||!node.isConnected)return;if(node.clientWidth>0&&node.scrollWidth>node.clientWidth+1)set(node,'data-ecp-overflow','true');else restoreAttr(node,'data-ecp-overflow');};
 const tableObserver=win.ResizeObserver?new win.ResizeObserver(entries=>{for(const entry of entries){const node=tables.has(entry.target)?entry.target:entry.target.parentElement;if(node)updateTable(node);}}):null;
 function releaseTable(node){tableObserver?.unobserve(node);const table=tables.get(node)?.table;if(table)tableObserver?.unobserve(table);tables.delete(node);restoreAttr(node,'data-ecp-overflow');}
 let dead=false,active=false,raf=0,adapter=null,scans=0,flushes=0,decorationScans=0;
 let snapshot=Object.freeze({version:VERSION,state:'loading',enabled:false,assistantRows:0,matchedMessages:0,proseBlocks:0,adapter:null,scans:0,flushes:0});
 const style=doc.createElement('style');style.dataset.plugin='dsh-echocat-prettier';style.dataset.echocatPrettier='content';style.dataset.ecpVersion=VERSION;style.textContent=css;
 const gallery=createGalleryManager(doc,settings);
 const memes=createMemeManager(doc,settings);
 const enhancements=createEnhancementManager(doc,settings);
 function set(el,name,value){
  if(!originals.has(el))originals.set(el,new Map());
  const old=originals.get(el);if(!old.has(name))old.set(name,el.getAttribute(name));
  if(el.getAttribute(name)!==value)el.setAttribute(name,value);
 }
 function restoreAttr(el,name){
  const old=originals.get(el);if(!old?.has(name))return;
  const value=old.get(name);if(value===null)el.removeAttribute(name);else el.setAttribute(name,value);
  old.delete(name);if(!old.size)originals.delete(el);
 }
 function restore(el){for(const name of [...(originals.get(el)?.keys()??[])])restoreAttr(el,name);}
 function setVar(el,name,value){
  if(!styleOriginals.has(el))styleOriginals.set(el,new Map());
  const old=styleOriginals.get(el);if(!old.has(name))old.set(name,el.style.getPropertyValue(name));
  if(el.style.getPropertyValue(name)!==value)el.style.setProperty(name,value);
 }
 function restoreVars(el){
  const old=styleOriginals.get(el);if(!old)return;
  for(const [name,value]of old)if(value)el.style.setProperty(name,value);else el.style.removeProperty(name);
  styleOriginals.delete(el);
 }
 function cancelSettled(el){const timer=settleTimers.get(el);if(timer!==undefined)win.clearTimeout(timer);settleTimers.delete(el);}
 function queueSettled(el,delay=260){cancelSettled(el);if(dead||!active||!el?.isConnected)return;set(el,'data-ecp-updating','true');settleTimers.set(el,win.setTimeout(()=>{settleTimers.delete(el);if(dead||!active||!el.isConnected||streaming(el))return;set(el,'data-ecp-updating','false');dirty.add(el);schedule();},delay));}
 function clear(el){cancelSettled(el);for(const [node,item]of tables)if(item.owner===el)releaseTable(node);
  gallery.clear(el);memes.clear(el);enhancements.clear(el);
  for(const node of [...originals.keys()])if(node===el||el.contains(node))restore(node);
  restoreVars(el);
  owned.delete(el);dirty.delete(el);
 }
 const streaming=el=>el.closest('[data-streaming="true"]')!==null;
 function decorate(el){
  if(streaming(el))return;decorationScans++;
  set(el,'data-ecp-updating','false');
  const value=settings.get();
  const textLength=el.textContent?.length??0,blockCount=el.querySelectorAll('p,li,blockquote,pre,table,details,figure').length,elementCount=el.getElementsByTagName('*').length;
  const longContent=textLength>12000||blockCount>90||elementCount>300;
  set(el,'data-ecp-long-content',String(longContent));
  const desired=new Map();
  const want=(node,key,value)=>{if(!desired.has(node))desired.set(node,{});desired.get(node)[key]=value;};
  let section=0,lead=true,card=0,iconCount=0;
  const iconLimit=!value.visualEmoji||value.emojiDensity==='off'?0:Math.max(0,Math.min(8,Number(value.emojiCount)||(value.emojiDensity==='light'?2:6)));
  const fallbackIcons=['✨','🧩','📌','✅','🌿','📝','🔎','💫'];
  const addIcon=(node,text)=>{if(iconCount>=iconLimit)return;const icon=/注意|警告|风险/u.test(text)?'⚠️':/建议|技巧|提示/u.test(text)?'💡':/路线|步骤|流程|行程/u.test(text)?'🧭':/图片|照片|画廊/u.test(text)?'📷':fallbackIcons[iconCount%fallbackIcons.length];want(node,'data-ecp-icon',icon);iconCount++;};
  for(const child of el.children){
   if(/^H[1-6]$/.test(child.tagName)){section=section%3+1;want(child,'data-ecp-section',String(section));
    addIcon(child,child.textContent.trim());
   }else if(section)want(child,'data-ecp-section',String(section));
   if(child.tagName==='P'){
    const nodes=[...child.childNodes].filter(n=>n.nodeType!==3||n.textContent.trim());
    if(nodes.length&&nodes.every(n=>n.nodeType===1&&n.tagName==='STRONG')&&child.textContent.trim().length<=100){want(child,'data-ecp-title','true');
     addIcon(child,child.textContent.trim());
    }
    else if(lead&&child.textContent.trim().length>18){want(child,'data-ecp-block','lead');const face=value.faceEmoji&&value.emojiDensity==='lively'?faceForText(child.textContent):'';if(face)want(child,'data-ecp-face',face);lead=false;}
    else if(value.magazineFlow&&child.textContent.trim().length>28&&child.firstElementChild?.tagName==='STRONG'){card=card%3+1;want(child,'data-ecp-block','insight');want(child,'data-ecp-card',String(card));addIcon(child,child.textContent.trim());}
   }
   if(['P','BLOCKQUOTE'].includes(child.tagName)&&/^(?:⚠️?\s*)?(?:注意(?:事项)?|提醒|警告|风险提示)[：:]/u.test(child.textContent.trim())){want(child,'data-ecp-tone','caution');if(!/^⚠/u.test(child.textContent.trim()))want(child,'data-ecp-caution-icon','true');}
   if(child.tagName==='BLOCKQUOTE')want(child,'data-ecp-block','quote');
   if(child.tagName==='OL'||child.tagName==='UL'){
    want(child,'data-ecp-block',child.tagName==='OL'?'steps':'points');
    if(value.magazineFlow&&/(?:D\d+|第[一二三四五六七八九十\d]+[天步]|上午|下午|晚上|\d{1,2}[：:]\d{2}|然后|接着|最后)/u.test(child.textContent))want(child,'data-ecp-view','timeline');
    for(const li of child.children)if(li.tagName==='LI'){card=card%3+1;want(li,'data-ecp-card',String(card));const text=li.textContent.trim();if(!/^(?:⚠️?\s*)?(?:注意(?:事项)?|提醒|警告|风险提示)[：:]/u.test(text))addIcon(li.firstElementChild?.tagName==='STRONG'?li.firstElementChild:li,text);}
   }
   if(child.tagName==='OL'||child.tagName==='UL')for(const li of child.children)if(li.tagName==='LI'&&/^(?:⚠️?\s*)?(?:注意(?:事项)?|提醒|警告|风险提示)[：:]/u.test(li.textContent.trim())){want(li,'data-ecp-tone','caution');if(!/^⚠/u.test(li.textContent.trim()))want(li,'data-ecp-caution-icon','true');}
   if(child.querySelector?.('img'))want(child,'data-ecp-block','media');
   if(child.tagName==='DIV'&&[...child.classList].some(t=>moduleClass(t,'tableScroll'))&&child.querySelector(':scope > table')){want(child,'data-ecp-table-scroll','true');want(child,'data-ecp-block','table');want(child,'tabindex','0');}
  }
  for(const node of [...originals.keys()])if(node!==el&&el.contains(node))for(const k of ['data-ecp-title','data-ecp-tone','data-ecp-caution-icon','data-ecp-table-scroll','data-ecp-block','data-ecp-card','data-ecp-section','data-ecp-icon','data-ecp-face','data-ecp-view','tabindex'])if(!desired.get(node)?.[k])restoreAttr(node,k);
  for(const [node,attrs]of desired)for(const [k,v]of Object.entries(attrs))set(node,k,v);
  for(const [node,item]of tables)if(item.owner===el&&!desired.get(node)?.['data-ecp-table-scroll'])releaseTable(node);
  for(const [node,attrs]of desired)if(attrs['data-ecp-table-scroll']){
   if(!tables.has(node)){const table=node.querySelector(':scope > table');tables.set(node,{owner:el,table});tableObserver?.observe(node);if(table)tableObserver?.observe(table);}
   updateTable(node);
  }
  enhancements.sync(el);gallery.sync(el);memes.sync(el);
 }
 function mark(el,{defer=false}={}){
  owned.add(el);set(el,'data-ecp-prose','true');
  const s=settings.get();for(const k of ['font','density','accent','rich','layout','size','intensity','palette','radius','shadow','motion','glassMode','motionStyle','motionIntensity','contentWidth','surfaceOpacity','blurStrength','borderGlow','headingScale','elementMotion','visualStyle','diyLayout'])set(el,'data-ecp-'+k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),String(s[k]));
  for(const [key,attr]of [['multiColor','multi-color'],['visualEmoji','visual-emoji'],['faceEmoji','face-emoji'],['glassMotion','glass-motion'],['emojiDensity','emoji-density']])set(el,'data-ecp-'+attr,String(s[key]));
  const colors=colorsFor(s),custom=Object.hasOwn(s.stylePalettes??{},s.visualStyle);set(el,'data-ecp-custom-palette',String(custom));
  setVar(el,'--ecp-final-primary',colors.primary);setVar(el,'--ecp-final-secondary',colors.secondary);setVar(el,'--ecp-final-accent',colors.accent);
  if(defer)queueSettled(el);else{cancelSettled(el);dirty.add(el);}
 }
 function scanRow(row){
  scans++;const wanted=new Set(proseInRow(row,adapter));
  for(const old of rowMembers.get(row)??[])if(!wanted.has(old))clear(old);
  for(const el of wanted)mark(el,{defer:true});rowMembers.set(row,wanted);
 }
 function publish(){
  const rows=[...doc.querySelectorAll(ASSISTANT)],matched=new Set([...owned].map(el=>el.closest(ASSISTANT)).filter(Boolean)).size;
  const state=!active?'disabled':!rows.length?'waiting':!matched?'unmatched':matched<rows.length?'partial':'active';
  const next={version:VERSION,state,enabled:active,assistantRows:rows.length,matchedMessages:matched,proseBlocks:owned.size,adapter:adapter?.source??null,scans,flushes,decorationScans};
  if(JSON.stringify(next)!==JSON.stringify(snapshot)){snapshot=Object.freeze(next);for(const fn of listeners)fn();}
 }
 function flush(){
  raf=0;if(dead||!active)return;flushes++;
  for(const el of [...owned])if(!el.isConnected||!el.closest(ASSISTANT))clear(el);
  for(const node of [...originals.keys()])if(!node.isConnected)restore(node);
  for(const row of pending)if(row.isConnected)scanRow(row);pending.clear();
  for(const el of dirty)if(el.isConnected)decorate(el);dirty.clear();publish();
 }
 function schedule(row){if(row)pending.add(row);if(!raf)raf=win.requestAnimationFrame(flush);}
 const bodyObserver=new win.MutationObserver(records=>{
  for(const r of records){
   const target=r.target.nodeType===1?r.target:r.target.parentElement;if(!target||target.closest('.ecp-controls'))continue;
   const sidecars='.ecp-outline,.ecp-gallery,.ecp-meme-gallery';if(target.closest(sidecars))continue;
   const changed=[...r.addedNodes,...r.removedNodes].filter(node=>node.nodeType===1||node.textContent?.trim());if(changed.length&&changed.every(node=>node.nodeType===1&&node.matches?.(sidecars)))continue;
   const prose=target.closest('[data-ecp-prose="true"]');
   if(prose&&r.attributeName!=='class'){
    if(!streaming(prose))queueSettled(prose);continue;
   }
   if(r.removedNodes.length)schedule();
   const row=target.closest('[data-chat-flow-kind]');if(row)schedule(row);
   for(const n of r.addedNodes)if(n.nodeType===1){if(n.matches(ASSISTANT))schedule(n);for(const child of n.querySelectorAll(ASSISTANT))schedule(child);}
  }
 });
 const headObserver=new win.MutationObserver(()=>{
  const next=discoverAdapter(doc);if(JSON.stringify(next)===JSON.stringify(adapter))return;
  adapter=next;for(const el of [...owned])clear(el);for(const row of doc.querySelectorAll(ASSISTANT))schedule(row);schedule();
 });
 function stop(){active=false;bodyObserver.disconnect();headObserver.disconnect();tableObserver?.disconnect();if(raf)win.cancelAnimationFrame(raf);raf=0;for(const timer of settleTimers.values())win.clearTimeout(timer);settleTimers.clear();pending.clear();dirty.clear();for(const el of [...owned])clear(el);gallery.dispose();memes.dispose();enhancements.dispose();style.remove();publish();}
 function sync(){
  if(dead)return;if(!settings.get().enabled){stop();return;}
  if(!active){active=true;doc.head.append(style);adapter=discoverAdapter(doc);bodyObserver.observe(doc.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-chat-flow-kind','data-streaming','class']});headObserver.observe(doc.head,{childList:true,subtree:true,characterData:true});for(const row of doc.querySelectorAll(ASSISTANT))schedule(row);schedule();}
  else {for(const el of owned)mark(el);schedule();}
  publish();
 }
 const unsubscribe=settings.subscribe(sync);sync();
 return {dispose(){if(dead)return;dead=true;unsubscribe();stop();listeners.clear();},
  status:()=>snapshot,getSnapshot:()=>snapshot,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}};
}
