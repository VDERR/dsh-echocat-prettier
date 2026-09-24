const VISUAL_TOPIC=/(?:旅游|旅行|游记|攻略|景点|城市|古镇|建筑|博物馆|公园|山|湖|海|岛|森林|熊猫|动物|植物|花|美食|菜|餐厅|咖啡|服饰|艺术|绘画|雕塑|电影|游戏|历史|文化|风景|自然)/u;
const SERIOUS_TOPIC=/(?:医疗|疾病|症状|用药|法律|诉讼|合同|财务|投资|股票|急救|隐私|密码|账户|事故|灾难|死亡|哀悼)/u;
const PRIVATE_SHAPE=/(?:https?:\/\/|[A-Za-z]:\\|\\\\|@[A-Za-z0-9.-]+|\b\d{6,}\b)/u;
const GENERIC=/(?:完整|详细|一份|推荐|建议|介绍|安排|计划|方案|总结|指南|攻略|行程|三日|两日|一日|怎么玩|怎么去|是什么|为什么)/gu;
const clean=s=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
function safeURL(value,hosts){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&hosts.includes(url.hostname)?url:null;}catch{return null;}}
function safeExternalURL(value){try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.port)return null;const host=url.hostname.toLowerCase();if(host==='localhost'||host.endsWith('.local')||/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)||host.includes(':'))return null;return url;}catch{return null;}}
function safeOpenImageURL(value){try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.port)return null;const host=url.hostname.toLowerCase();return ['upload.wikimedia.org','live.staticflickr.com','cdn.stocksnap.io','images.rawpixel.com'].includes(host)||/^farm\d+\.staticflickr\.com$/.test(host)?url:null;}catch{return null;}}
export function extractSafeVisualQuery(prose){
 const sample=clean(prose?.textContent).slice(0,800);
 if(!sample||SERIOUS_TOPIC.test(sample)||PRIVATE_SHAPE.test(sample))return null;
 const headings=[...prose.querySelectorAll(':scope > h1,:scope > h2,:scope > h3,:scope > [data-ecp-title]')];
 const source=headings.map(x=>clean(x.textContent)).find(x=>x.length>=2&&x.length<=60&&VISUAL_TOPIC.test(x)&&!SERIOUS_TOPIC.test(x)&&!PRIVATE_SHAPE.test(x));
 if(!source)return null;
 const query=clean(source.replace(GENERIC,' ').replace(/[|｜:：·•—–_()[\]【】「」“”"']/g,' ').replace(/\d+/g,' ')).slice(0,48);
 return query.length>=2?query:null;
}
export async function searchCommons(query,{fetcher=globalThis.fetch,signal,limit=3}={}){
 if(typeof query!=='string'||query.length<2||query.length>48||PRIVATE_SHAPE.test(query))return [];
 const url=new URL('https://commons.wikimedia.org/w/api.php');
 url.search=new URLSearchParams({action:'query',generator:'search',gsrsearch:query+' filetype:bitmap',gsrnamespace:'6',gsrlimit:'8',prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'960',iiextmetadatafilter:'Artist|LicenseShortName|LicenseUrl',format:'json',formatversion:'2',origin:'*'}).toString();
 const response=await fetcher(url,{signal,credentials:'omit',headers:{Accept:'application/json'}});
 if(!response.ok||!response.headers.get('content-type')?.includes('json'))return [];
 const data=await response.json(),items=[];
 for(const page of data.query?.pages??[]){
  if(items.length>=limit)break;
  const info=page.imageinfo?.[0];if(info?.mime!=='image/jpeg')continue;
  const image=safeURL(info.thumburl??info.url,['upload.wikimedia.org','thumb.wikimedia.org']);
  const source=safeURL(info.descriptionurl,['commons.wikimedia.org']);
  const meta=info.extmetadata??{},author=clean(meta.Artist?.value?.replace(/<[^>]*>/g,' ')),license=clean(meta.LicenseShortName?.value);
  const rawLicense=meta.LicenseUrl?.value??'',licenseURL=safeURL(rawLicense.startsWith('//')?'https:'+rawLicense:rawLicense,['creativecommons.org','commons.wikimedia.org']);
  if(!image||!source||!author||!license||(!licenseURL&&!/public domain|^cc0/i.test(license)))continue;
  items.push({title:clean(page.title).replace(/^File:/,''),imageUrl:image.href,sourceUrl:source.href,author,license,licenseUrl:licenseURL?.href??'',provider:'Wikimedia Commons'});
 }
 return items;
}
export async function searchOpenverse(query,{fetcher=globalThis.fetch,signal,limit=3}={}){
 if(typeof query!=='string'||query.length<2||query.length>48||PRIVATE_SHAPE.test(query))return [];
 const url=new URL('https://api.openverse.org/v1/images/');
 url.search=new URLSearchParams({q:query,page_size:String(Math.max(6,Math.min(20,limit*3))),license:'by,by-sa,cc0,pdm'}).toString();
 const response=await fetcher(url,{signal,credentials:'omit',headers:{Accept:'application/json'}});
 if(!response.ok||!response.headers.get('content-type')?.includes('json'))return [];
 const data=await response.json(),items=[];
 for(const item of data.results??[]){
  if(items.length>=limit)break;
  const proxy=safeURL(item.thumbnail,['api.openverse.org']),direct=safeOpenImageURL(item.url);
  const source=safeExternalURL(item.foreign_landing_url),licenseURL=safeURL(item.license_url,['creativecommons.org']);
  const title=clean(item.title),author=clean(item.creator),code=clean(item.license).toLowerCase(),version=clean(item.license_version);
  if((!proxy&&!direct)||!source||!title||!author||!['by','by-sa','cc0','pdm'].includes(code))continue;
  const license=code==='cc0'?'CC0':code==='pdm'?'Public Domain':('CC '+code.toUpperCase()+(version?' '+version:''));
  if(!licenseURL&&!['cc0','pdm'].includes(code))continue;
  const preferDirect=direct?.hostname==='upload.wikimedia.org';
  items.push({title,imageUrl:(preferDirect?direct:proxy??direct).href,fallbackImageUrl:(preferDirect?proxy:direct)?.href??'',sourceUrl:source.href,author,license,licenseUrl:licenseURL?.href??'',provider:'Openverse · '+clean(item.source||item.provider||'公开图库')});
 }
 return items;
}
async function timedSearch(run,parentSignal,timeout){
 const controller=new AbortController(),relay=()=>controller.abort(parentSignal?.reason);
 if(parentSignal?.aborted)relay();else parentSignal?.addEventListener('abort',relay,{once:true});
 const timer=setTimeout(()=>controller.abort(),timeout);
 try{return await run(controller.signal);}finally{clearTimeout(timer);parentSignal?.removeEventListener?.('abort',relay);}
}
export async function searchFreeImages(query,{fetcher=globalThis.fetch,signal,limit=3}={}){
 let first=[];
 try{first=await timedSearch(s=>searchOpenverse(query,{fetcher,signal:s,limit}),signal,5500);}catch(error){if(signal?.aborted)throw error;}
 if(first.length>=limit)return first.slice(0,limit);
 let second=[];
 try{second=await timedSearch(s=>searchCommons(query,{fetcher,signal:s,limit:limit-first.length}),signal,6500);}catch(error){if(signal?.aborted)throw error;}
 const seen=new Set(first.map(x=>x.sourceUrl));return [...first,...second.filter(x=>!seen.has(x.sourceUrl))].slice(0,limit);
}
function addTextLink(doc,parent,text,url){const a=doc.createElement('a');a.textContent=text;a.href=url;a.target='_blank';a.rel='noreferrer noopener';parent.append(a);}
const imageTimeout=()=>{const value=Number(globalThis.__ECHOCAT_IMAGE_TIMEOUT__);return Number.isFinite(value)?Math.max(10,Math.min(30000,value)):8000;};
function renderGallery(doc,query,items,{onEmpty}={}){
 const section=doc.createElement('section');section.className='ecp-gallery';section.dataset.ecpGallery='true';section.setAttribute('aria-label','相关图片参考');section.hidden=true;
 const head=doc.createElement('header'),title=doc.createElement('div'),note=doc.createElement('span');
 title.textContent='📷 相关图片参考';note.textContent='零付费公开来源 · 不参与答案生成';head.append(title,note);section.append(head);
 const grid=doc.createElement('div');grid.className='ecp-gallery-grid';grid.dataset.count='0';const alive=new Set(),readyItems=new Set(),cleanups=new Map();let disposed=false;
 const update=()=>{grid.dataset.count=String(readyItems.size);section.hidden=readyItems.size===0;if(!alive.size&&!disposed){section.remove();onEmpty?.();}};
 for(const item of items){
  const figure=doc.createElement('figure'),link=doc.createElement('a'),img=doc.createElement('img'),caption=doc.createElement('figcaption');
  figure.hidden=true;alive.add(figure);link.href=item.sourceUrl;link.target='_blank';link.rel='noreferrer noopener';img.alt=item.title;img.loading='eager';img.decoding='async';img.referrerPolicy='no-referrer';
  if(item.fallbackImageUrl)img.dataset.fallbackSrc=item.fallbackImageUrl;
  let timer=0;const arm=()=>{clearTimeout(timer);timer=setTimeout(failed,imageTimeout());};const loaded=()=>{if(disposed||!alive.has(figure))return;if(!img.naturalWidth){failed();return;}clearTimeout(timer);figure.hidden=false;readyItems.add(figure);update();};const remove=()=>{clearTimeout(timer);img.removeEventListener('load',loaded);img.removeEventListener('error',failed);alive.delete(figure);readyItems.delete(figure);cleanups.delete(figure);figure.remove();update();};const failed=()=>{if(disposed||!alive.has(figure))return;const fallback=img.dataset.fallbackSrc;if(fallback){delete img.dataset.fallbackSrc;img.src=fallback;arm();}else remove();};
  img.addEventListener('load',loaded);img.addEventListener('error',failed);cleanups.set(figure,remove);img.src=item.imageUrl;arm();if(img.complete&&img.naturalWidth)queueMicrotask(loaded);link.append(img);figure.append(link);
  addTextLink(doc,caption,item.title,item.sourceUrl);caption.append(doc.createTextNode(' · '+item.author+' · '));
  if(item.licenseUrl)addTextLink(doc,caption,item.license,item.licenseUrl);else caption.append(doc.createTextNode(item.license));
  if(item.provider)caption.append(doc.createTextNode(' · '+item.provider));
  figure.append(caption);grid.append(figure);
 }
 section.append(grid);const foot=doc.createElement('p');foot.className='ecp-gallery-note';foot.textContent='无需账号或 API Key；图片由公开图库提供，使用时请保留作者与许可信息。';section.append(foot);section.dataset.query=query;return{node:section,dispose(){if(disposed)return;disposed=true;for(const cleanup of [...cleanups.values()])cleanup();cleanups.clear();}};
}
export function createGalleryManager(doc,settings,{fetcher=globalThis.fetch}={}){
 const records=new Map();
 function clear(prose){const old=records.get(prose);old?.abort?.abort();old?.dispose?.();old?.node?.remove();records.delete(prose);}
 async function sync(prose){
  const value=settings.get();
  if(!value.enabled||!value.mediaGallery||value.mediaLevel==='off'||prose.querySelector('img')){clear(prose);return;}
  const query=extractSafeVisualQuery(prose);if(!query){clear(prose);return;}
  const levels={light:1,standard:2,rich:3},count=levels[value.mediaLevel]??Math.max(1,Math.min(3,Number(value.imageCount)||1)),old=records.get(prose);
  if(old?.query===query&&old.count===count&&old.palette===value.palette&&old.glassMode===value.glassMode&&old.glassMotion===value.glassMotion&&old.motionStyle===value.motionStyle&&old.motionIntensity===value.motionIntensity&&old.shadow===value.shadow)return;
  clear(prose);const abort=new AbortController();records.set(prose,{query,count,palette:value.palette,glassMode:value.glassMode,glassMotion:value.glassMotion,motionStyle:value.motionStyle,motionIntensity:value.motionIntensity,shadow:value.shadow,abort,node:null,dispose:null});
  try{
   const items=await searchFreeImages(query,{fetcher,signal:abort.signal,limit:count});
   const current=records.get(prose);if(abort.signal.aborted||current?.abort!==abort||!prose.isConnected||!items.length)return;
   let rendered;rendered=renderGallery(doc,query,items,{onEmpty:()=>{if(records.get(prose)===current){current.abort.abort();current.dispose?.();records.delete(prose);}}});const node=rendered.node;node.dataset.ecpPalette=value.palette;node.dataset.ecpMotion=String(value.motion);node.dataset.ecpGlass=value.glassMode;node.dataset.ecpGlassMotion=String(value.glassMotion);node.dataset.ecpMotionStyle=value.motionStyle;node.dataset.ecpMotionIntensity=value.motionIntensity;node.dataset.ecpShadow=value.shadow;node.dataset.ecpPlacement='hero';prose.insertAdjacentElement('beforebegin',node);current.node=node;current.dispose=rendered.dispose;
  }catch(error){if(error?.name!=='AbortError')clear(prose);}
 }
 return {sync,clear,dispose(){for(const prose of [...records.keys()])clear(prose);}};
}
