const SERIOUS=/(?:医疗|疾病|症状|用药|法律|诉讼|合同|财务|投资|股票|急救|隐私|密码|账户|事故|灾难|死亡|哀悼|自杀|暴力伤害)/u;
const PRIVATE_SHAPE=/(?:https?:\/\/|[A-Za-z]:\\|\\\\|@[A-Za-z0-9.-]+|\b\d{6,}\b)/u;
const PLAYFUL=/(?:游戏|动漫|番剧|电影|综艺|明星|角色|旅行|旅游|美食|好玩|开心|搞笑|可爱|完成|成功|搞定|推荐|攻略|配装|玩法)/u;
const GENERIC=/(?:完整|详细|核心|重点|建议|推荐|攻略|方案|总结|指南|解析|教程|清单|行程|预算|配装|玩法|技巧|三个|两个|几个|先说|关于|回复|回答)$/gu;
const GENERIC_TOPIC=/^(?:注意|提醒|结论|步骤|要点|核心|建议|推荐|方案|总结|指南|解析|教程|清单|行程|预算|配装|玩法|技巧|为什么|怎么做|如何做|这样搭配|安排上了|认真听讲)$/u;
const EMOTIONS=new Set(['开心','得意','无奈','思考','震惊','加油','收到','抱歉','生气','尴尬','期待','认真']);
const MEME_MARKER=/(?:表情包|梗图|动图|斗图|gif)/iu;
const TOPIC_STOP=new Set(['这个','那个','这些','那些','这里','那里','现在','已经','还是','然后','就是','其实','整体','感觉','回复','回答','内容','文字','图片','表情包','插件','功能','问题','情况','建议','方案','搭配','需要','希望','可以','应该','进行','使用','显示','添加','增加','更多','比较','非常','直接','继续','重新','目前','时候','一个','一些','三个','两个','几个','用户','我们','你们','他们','自己','东西','方面','这样','怎么','为什么','如何','是否','如果','因为','所以','没有','不会','不是','不够','一下','一遍','完成','开始','处理','提供','支持','进行']);
const PREF_KEY='echocat-prettier:meme-feedback:v1';
const clean=s=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
const strip=value=>{let out=clean(value).replace(/[|｜:：·•—–_()[\]【】「」“”"']/g,' ').replace(/^\d+[.、\s]*/u,'').replace(GENERIC,'').trim();for(let i=0;i<3;i++)out=out.replace(GENERIC,'').trim();return out.slice(0,18);};
const topicKey=value=>clean(value).toLowerCase().replace(/^表情包\s*/u,'').replace(/[-_|｜:：·•—–()[\]【】「」“”"'\s]/g,'');
export function memeTopicTerms(query){return clean(query).replace(/^表情包\s*/u,'').split(/\s+/u).map(topicKey).filter(term=>term.length>=2&&!EMOTIONS.has(term)&&!GENERIC_TOPIC.test(term));}
const topicMarkerDistance=(title,term)=>{const key=topicKey(title),at=key.indexOf(term);if(at<0)return Infinity;const markers=['表情包','梗图','动图','斗图','gif'],positions=markers.map(marker=>key.indexOf(marker)).filter(index=>index>=0);return positions.length?Math.min(...positions.map(index=>Math.abs(index-at))):Infinity;};
export function isMemeTitleRelevant(title,query){const value=clean(title),terms=memeTopicTerms(query);return Boolean(value&&MEME_MARKER.test(value)&&terms.length&&terms.some(term=>topicMarkerDistance(value,term)<=term.length+10));}
function inferBodyTopic(sample){
 const sentence=clean(sample).split(/[。！？!?；;\n]/u).find(part=>part.length>=4)?.replace(/^(?:关于|针对|围绕|对于|这次|本次|当前|这套|这个|该)/u,'').slice(0,90)??'';if(!sentence)return'';
 let segments=[];try{segments=[...new Intl.Segmenter('zh-CN',{granularity:'word'}).segment(sentence)].filter(item=>item.isWordLike).map(item=>clean(item.segment));}catch{segments=sentence.match(/[\p{Script=Han}A-Za-z0-9+#.]{2,12}/gu)??[];}
 const usable=segments.filter(term=>{const key=topicKey(term);return key.length>=2&&!TOPIC_STOP.has(key)&&!GENERIC_TOPIC.test(key)&&!EMOTIONS.has(key)&&!/^(?:(?:有|共|第)[一二三四五六七八九十百千万\d]+|的|了|和|与|或|把|让|再|都|很|更|最|也|还|会|能|要|想|给|来|去)$/u.test(key);});
 if(!usable.length)return'';for(let i=0;i<usable.length-1;i++){const pair=strip(usable[i]+usable[i+1]);if(pair.length>=4&&pair.length<=14&&!GENERIC_TOPIC.test(pair))return pair;}
 const single=strip(usable[0]);return single.length>=3?single:'';
}
const emotionFor=text=>/完成|成功|搞定|做好|太好了|顺利完成/u.test(text)?'开心':/可以直接|稳了|拿下|😎/u.test(text)?'得意':/无奈|没办法|只能|崩溃|心累/u.test(text)?'无奈':/尴尬|社死|不好意思/u.test(text)?'尴尬':/震惊|没想到|居然|竟然/u.test(text)?'震惊':/为什么|原因|分析|判断|思考|考虑/u.test(text)?'思考':/抱歉|失败|没成功/u.test(text)?'抱歉':/加油|坚持|鼓励/u.test(text)?'加油':/注意|提醒|小心/u.test(text)?'收到':'';
export function analyzeMemeIntent(prose,frequency='balanced'){
 const sample=clean(prose?.textContent).slice(0,1000);if(!sample||frequency==='off'||SERIOUS.test(sample)||PRIVATE_SHAPE.test(sample))return null;const quoted=strip(sample.match(/《([^》]{2,18})》/u)?.[1]);const headings=[...prose.querySelectorAll(':scope > h1,:scope > h2,:scope > h3,:scope > [data-ecp-title]')].map(x=>strip(x.textContent)).filter(x=>x.length>=2&&!SERIOUS.test(x)&&!GENERIC_TOPIC.test(x));let topic=quoted&&!GENERIC_TOPIC.test(quoted)?quoted:headings.find(x=>x.length>=3)||inferBodyTopic(sample);const emotion=emotionFor(sample);if(topic&&frequency==='light'&&!PLAYFUL.test(sample))topic='';if(!topic)return null;const terms=[topic,emotion&&emotion!==topic?emotion:''].filter(Boolean),query='表情包 '+terms.join(' ').slice(0,20);return{topic,emotion,query};
}
export const extractMemeQuery=(prose,frequency='balanced')=>analyzeMemeIntent(prose,frequency)?.query??null;
function safeImage(value){if(globalThis.__ECHOCAT_MEME_PREVIEW__===true&&/^data:image\/(?:gif|png|webp|svg\+xml)[;,]/u.test(String(value)))return String(value);try{const u=new URL(value),h=u.hostname.toLowerCase();return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(/^(?:img\d+|hiphotos|t\d+)\.baidu\.com$/u.test(h)||h.endsWith('.bdimg.com')||h.endsWith('.bcebos.com'))?u.href:null;}catch{return null;}}
function safeSource(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='image.baidu.com'&&!u.username&&!u.password&&!u.port?u.href:null;}catch{return null;}}
export async function requestMemes(query,{fetcher=globalThis.fetch,signal}={}){if(typeof query!=='string'||!query.startsWith('表情包 ')||query.length>28||PRIVATE_SHAPE.test(query)||!memeTopicTerms(query).length)return[];const response=await fetcher('/dsh-echocat-prettier/api/memes?q='+encodeURIComponent(query.slice(4)),{signal,credentials:'same-origin',headers:{Accept:'application/json'}});if(!response.ok||!response.headers.get('content-type')?.includes('json'))return[];const data=await response.json(),items=[];for(const raw of data.items??[]){const imageUrl=safeImage(raw.imageUrl),posterUrl=safeImage(raw.posterUrl||raw.imageUrl),sourceUrl=safeSource(raw.sourceUrl),title=clean(raw.title).slice(0,80);if(!imageUrl||!posterUrl||!sourceUrl||!title||!isMemeTitleRelevant(title,query))continue;items.push({imageUrl,posterUrl,sourceUrl,title,provider:'百度图片搜索',animated:raw.animated===true});if(items.length>=8)break;}return items;}
export async function requestMeme(query,options){return(await requestMemes(query,options))[0]??null;}
const unique=(values,max)=>[...new Set(values.filter(x=>typeof x==='string'&&x.length>0))].slice(-max);
export function createMemePreferences(storage){let data={recent:[],blockedUrls:[],blockedTitles:[],liked:[]};try{const x=JSON.parse(storage?.getItem(PREF_KEY)??'null');if(x&&typeof x==='object')data={recent:unique(x.recent??[],20),blockedUrls:unique(x.blockedUrls??[],40),blockedTitles:unique(x.blockedTitles??[],40),liked:unique(x.liked??[],20)};}catch{}const save=()=>{try{storage?.setItem(PREF_KEY,JSON.stringify(data));}catch{}};return{snapshot:()=>structuredClone(data),seen:url=>data.recent.includes(url),blocked:item=>data.blockedUrls.includes(item.imageUrl)||data.blockedTitles.some(x=>item.title.includes(x)),remember:item=>{data.recent=unique([...data.recent,item.imageUrl],20);save();},like:intent=>{data.liked=unique([...data.liked,intent.topic,intent.emotion],20);save();},block:item=>{data.blockedUrls=unique([...data.blockedUrls,item.imageUrl],40);const title=clean(item.title).replace(/[-_|｜].*$/u,'').slice(0,24);if(title.length>=3)data.blockedTitles=unique([...data.blockedTitles,title],40);save();},score:(item,intent)=>data.liked.reduce((n,x)=>n+(x&&(item.title.includes(x)||intent.query.includes(x))?2:0),0)};}
function configureImage(doc,media,img,item,mode){let observer=null,disposed=false;const animated=item.animated&&item.posterUrl!==item.imageUrl,set=src=>{if(!disposed&&img.src!==src)img.src=src;};if(!animated||mode==='still')set(item.posterUrl);else if(mode==='auto'){if(typeof doc.defaultView.IntersectionObserver==='function'){observer=new doc.defaultView.IntersectionObserver(entries=>set(entries.some(x=>x.isIntersecting)?item.imageUrl:item.posterUrl),{rootMargin:'80px'});observer.observe(media);}else set(item.imageUrl);}else{set(item.posterUrl);const play=()=>set(item.imageUrl),pause=()=>set(item.posterUrl);media.addEventListener('pointerenter',play);media.addEventListener('pointerleave',pause);media.addEventListener('focusin',play);media.addEventListener('focusout',pause);return()=>{disposed=true;media.removeEventListener('pointerenter',play);media.removeEventListener('pointerleave',pause);media.removeEventListener('focusin',play);media.removeEventListener('focusout',pause);};}return()=>{disposed=true;observer?.disconnect();};}
const imageTimeout=()=>{const value=Number(globalThis.__ECHOCAT_IMAGE_TIMEOUT__);return Number.isFinite(value)?Math.max(10,Math.min(30000,value)):8000;};
function render(doc,intent,item,value,{onReady,onFailure}={}){
 const card=doc.createElement('aside');card.className='ecp-meme';card.dataset.ecpMeme='true';card.dataset.query=intent.query;card.dataset.ecpAnimated=String(item.animated);card.dataset.ecpGifMode=value.animatedMeme;card.dataset.ecpMemeSize=value.memeSize;card.dataset.ecpElementMotion=value.elementMotion;card.setAttribute('aria-label','匹配当前回答的表情包');card.hidden=true;
 const media=doc.createElement('a');media.className='ecp-meme-media';media.href=item.sourceUrl;media.target='_blank';media.rel='noreferrer noopener';media.title='点击查看图片来源';const img=doc.createElement('img');img.alt=item.title;img.decoding='async';img.referrerPolicy='no-referrer';media.append(img);card.append(media);
 let disposed=false,readyOnce=false,timer=0,disposeImage=()=>{};const cleanup=()=>{clearTimeout(timer);img.removeEventListener('load',ready);img.removeEventListener('error',fail);};const ready=()=>{if(disposed||!img.naturalWidth)return;if(!readyOnce){readyOnce=true;clearTimeout(timer);card.hidden=false;card.dataset.ecpReady='true';onReady?.();}};const fail=()=>{if(disposed)return;disposed=true;cleanup();disposeImage();card.remove();onFailure?.();};
 img.addEventListener('load',ready);img.addEventListener('error',fail);disposeImage=configureImage(doc,media,img,item,value.animatedMeme);timer=setTimeout(fail,imageTimeout());if(img.complete&&img.naturalWidth)queueMicrotask(ready);
 return{node:card,dispose(){if(disposed)return;disposed=true;cleanup();disposeImage();}};
}
export function createMemeManager(doc,settings,{fetcher=globalThis.fetch,storage}={}){
 if(storage===undefined)try{storage=doc.defaultView.localStorage;}catch{}
 const prefs=createMemePreferences(storage),records=new Map(),lastByProse=new WeakMap();
 const desiredCount=value=>Math.max(1,Math.min(4,Number(value.memeCount)||1));
 function clear(prose){
  const old=records.get(prose);if(old?.entries?.length)lastByProse.set(prose,{query:old.intent.query,items:old.entries.map(entry=>entry.item),candidates:old.candidates});
  old?.abort?.abort();for(const entry of old?.entries??[])entry.rendered.dispose();old?.container?.remove();records.delete(prose);
 }
 function choose(record){
  const used=new Set(record.entries.map(entry=>entry.item.imageUrl));
  const available=record.candidates.filter(item=>!used.has(item.imageUrl)&&!record.failed.has(item.imageUrl)&&!prefs.blocked(item)),fresh=available.filter(item=>!prefs.seen(item.imageUrl)),rank=items=>items.sort((a,b)=>prefs.score(b,record.intent)-prefs.score(a,record.intent))[0]??null;
  return rank(fresh)||rank(available);
 }
 function add(prose,record,item,value,{remember=true}={}){
  let rendered;rendered=render(doc,record.intent,item,value,{onReady:()=>{if(records.get(prose)===record)record.container.hidden=false;},onFailure:()=>{
   if(records.get(prose)!==record)return;record.failed.add(item.imageUrl);record.entries=record.entries.filter(entry=>entry.rendered!==rendered);fill(prose,record,settings.get());
  }});
  record.entries.push({item,rendered});record.container.append(rendered.node);if(remember)prefs.remember(item);
 }
 function fill(prose,record,value,preferred=[]){
  const target=desiredCount(value);
  for(const item of preferred){if(record.entries.length>=target)break;if(!record.entries.some(entry=>entry.item.imageUrl===item.imageUrl)&&!record.failed.has(item.imageUrl)&&!prefs.blocked(item))add(prose,record,item,value,{remember:false});}
  while(record.entries.length<target){const next=choose(record);if(!next)break;add(prose,record,next,value);}
  if(!record.entries.length){record.container.remove();records.delete(prose);}
 }
 function mount(prose,record,value,preferred=[]){
  for(const entry of record.entries)entry.rendered.dispose();record.entries=[];record.container?.remove();
  const container=doc.createElement('section');container.className='ecp-meme-gallery';container.dataset.ecpMeme='true';container.dataset.query=record.intent.query;container.dataset.ecpMemeCount=String(desiredCount(value));container.setAttribute('aria-label','匹配当前回答的表情包');container.hidden=true;record.container=container;prose.insertAdjacentElement('afterend',container);fill(prose,record,value,preferred);
 }
 async function sync(prose){
  const value=settings.get();if(!value.enabled||!value.autoMeme||value.memeFrequency==='off'||prose.querySelector('img')){clear(prose);return;}
  const existing=records.get(prose);
  const intent=analyzeMemeIntent(prose,value.memeFrequency);if(!intent){clear(prose);return;}
  const renderSignature=JSON.stringify([value.palette,value.glassMode,value.glassMotion,value.motionStyle,value.motionIntensity,value.animatedMeme,value.memeSize,value.elementMotion,value.memeCount]);
  if(existing?.intent.query===intent.query){if(existing.renderSignature!==renderSignature){existing.renderSignature=renderSignature;mount(prose,existing,value,existing.entries.map(entry=>entry.item));}return;}
  clear(prose);const abort=new AbortController(),record={intent,renderSignature,abort,container:null,entries:[],candidates:[],failed:new Set()};records.set(prose,record);
  const saved=lastByProse.get(prose);
  try{record.candidates=saved?.query===intent.query?saved.candidates:await requestMemes(intent.query,{fetcher,signal:abort.signal});if(abort.signal.aborted||records.get(prose)!==record||!prose.isConnected)return;mount(prose,record,value,saved?.query===intent.query?saved.items:[]);}catch(error){if(error?.name!=='AbortError')clear(prose);}
 }
 return{sync,clear,preferences:prefs,dispose(){for(const prose of [...records.keys()])clear(prose);}};
}
export {PREF_KEY};
