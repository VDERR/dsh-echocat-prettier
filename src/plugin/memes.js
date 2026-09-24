const ROUTE='/dsh-echocat-prettier/api/memes';
const PRIVATE_SHAPE=/(?:https?:\/\/|[A-Za-z]:\\|\\\\|@[A-Za-z0-9.-]+|\b\d{6,}\b|[\u0000-\u001f\u007f])/u;
const SERIOUS=/(?:医疗|疾病|症状|用药|法律|诉讼|合同|财务|投资|股票|急救|隐私|密码|账户|事故|灾难|死亡|哀悼|自杀|暴力伤害)/u;
const LOW_QUALITY=/(?:素材|模板|广告|海报|logo|LOGO|下载|壁纸|头像框|二维码|教程|制作器|表情制作|商用|免抠|PNG素材|设计稿)/u;
const POSITIVE=/(?:表情包|搞笑|动图|GIF|gif|梗图|动漫|游戏|沙雕|可爱|斗图)/u;
const MEME_MARKER=/(?:表情包|梗图|动图|斗图|gif)/iu;
const EMOTIONS=new Set(['开心','得意','无奈','思考','震惊','加油','收到','抱歉','生气','尴尬','期待','认真']);
const GENERIC_TOPIC=new Set(['注意','提醒','结论','步骤','要点','核心','建议','推荐','方案','总结','指南','解析','教程','清单','行程','预算','配装','玩法','技巧','为什么','怎么做','如何做','这样搭配','安排上了','认真听讲']);
const clean=s=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
const decodeTitle=value=>{const source=clean(value).replace(/<[^>]*>/g,' ');try{return clean(decodeURIComponent(source));}catch{return source;}};
const topicKey=value=>clean(value).toLowerCase().replace(/[-_|｜:：·•—–()[\]【】「」“”"'\s]/g,'');
const topicTerms=value=>clean(value).replace(/^表情包\s*/u,'').split(/\s+/u).map(topicKey).filter(term=>term.length>=2&&!EMOTIONS.has(term)&&!GENERIC_TOPIC.has(term));
const validKeyword=value=>{const q=clean(value).replace(/^表情包\s*/u,'').slice(0,24);return q.length>=2&&!PRIVATE_SHAPE.test(q)&&!SERIOUS.test(q)&&topicTerms(q).length?q:null;};
function safeImageURL(value){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port)return null;const h=u.hostname.toLowerCase();return /^(?:img\d+|hiphotos|t\d+)\.baidu\.com$/u.test(h)||h.endsWith('.bdimg.com')||h.endsWith('.bcebos.com')?u:null;}catch{return null;}}
function dimensions(item){const width=Number(item.width||item.imageWidth||0),height=Number(item.height||item.imageHeight||0);if(!width||!height)return true;const ratio=width/height;return width>=100&&height>=100&&width<=5000&&height<=5000&&ratio>=.45&&ratio<=2.7;}
const titleKey=s=>clean(s).toLowerCase().replace(/[-_|｜:：·•—–()[\]【】「」“”"'\s]/g,'').replace(/(?:知乎|哔哩哔哩|bilibili|百度).*$/iu,'').slice(0,48);
const markerDistance=(key,term)=>{const at=key.indexOf(term);if(at<0)return Infinity;const positions=['表情包','梗图','动图','斗图','gif'].map(marker=>key.indexOf(marker)).filter(index=>index>=0);return positions.length?Math.min(...positions.map(index=>Math.abs(index-at))):Infinity;};
export function parseBaiduMemeResults(payload,keyword,{limit=8}={}){
 const q=validKeyword(keyword);if(!q||!payload||typeof payload!=='object')return [];
 const terms=topicTerms(q),sourceUrl='https://image.baidu.com/search/index?tn=baiduimage&word='+encodeURIComponent('表情包 '+q),ranked=[];
 for(const [index,item] of (Array.isArray(payload.data)?payload.data:[]).entries()){
  if(!item||typeof item!=='object'||!dimensions(item))continue;const title=decodeTitle(item.fromPageTitleEnc||item.fromPageTitle||item.title||'').slice(0,80);if(!title||LOW_QUALITY.test(title))continue;
  const middle=safeImageURL(item.middleURL),hover=safeImageURL(item.hoverURL),thumb=safeImageURL(item.thumbURL),animated=String(item.type).toLowerCase()==='gif';const image=animated?(hover||middle||thumb):(middle||hover||thumb),poster=thumb||middle||image;if(!image||!poster)continue;
  const key=titleKey(title),matched=terms.filter(term=>markerDistance(key,term)<=term.length+10);if(!MEME_MARKER.test(title)||!matched.length)continue;let score=matched.reduce((total,term)=>total+12+Math.min(8,term.length),0);if(POSITIVE.test(title))score+=3;if(animated)score+=1;for(const emotion of EMOTIONS)if(q.includes(emotion)&&title.includes(emotion))score+=2;
  ranked.push({score,index,item:{imageUrl:image.href,posterUrl:poster.href,sourceUrl,title,provider:'百度图片搜索',animated,qualityScore:score}});
 }
 ranked.sort((a,b)=>b.score-a.score||a.index-b.index);const seenURL=new Set(),seenTitle=new Set(),items=[];
 for(const row of ranked){const key=titleKey(row.item.title);if(seenURL.has(row.item.imageUrl)||seenTitle.has(key))continue;seenURL.add(row.item.imageUrl);seenTitle.add(key);items.push(row.item);if(items.length>=Math.max(1,Math.min(12,limit)))break;}
 return items;
}
export function parseBaiduPayloadText(text){if(typeof text!=='string'||text.length>1_500_000)return null;try{return JSON.parse(text);}catch{}try{return JSON.parse(text.replace(/\\u(?![0-9a-fA-F]{4})/g,'\\\\u').replace(/\\(?!["\\/bfnrtu])/g,'\\\\'));}catch{return null;}}
export async function searchBaiduMemes(keyword,{fetcher=globalThis.fetch,signal,limit=8}={}){
 const q=validKeyword(keyword);if(!q)return [];const url=new URL('https://image.baidu.com/search/acjson');url.search=new URLSearchParams({tn:'resultjson_com',ipn:'rj',ct:'201326592',word:'表情包 '+q,queryWord:'表情包 '+q,pn:'0',rn:'24',ie:'utf-8',oe:'utf-8',face:'0',istype:'2'}).toString();
 const response=await fetcher(url,{signal,headers:{Accept:'application/json,text/plain,*/*','User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',Referer:'https://image.baidu.com/'}});if(!response.ok)return [];const text=await response.text();const payload=parseBaiduPayloadText(text);return payload?parseBaiduMemeResults(payload,q,{limit}):[];
}
const sendJson=(res,status,payload)=>{res.writeHead(status,{'cache-control':'private, max-age=300','content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'});res.end(JSON.stringify(payload));};
export function createMemeRouteHandler({fetcher=globalThis.fetch,now=()=>Date.now(),cacheMs=10*60*1000}={}){const cache=new Map();return async(req,res)=>{if(req.method!=='GET'){res.writeHead(405,{allow:'GET'});res.end();return;}const q=validKeyword(new URL(req.url??'/','http://localhost').searchParams.get('q'));if(!q){sendJson(res,400,{status:'invalid-query',items:[]});return;}const hit=cache.get(q);if(hit&&now()-hit.at<cacheMs){sendJson(res,200,{status:hit.items.length?'ok':'no-results',query:'表情包 '+q,items:hit.items,cached:true});return;}const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);req.on?.('aborted',()=>controller.abort());res.on?.('close',()=>{if(!res.writableEnded)controller.abort();});try{const items=await searchBaiduMemes(q,{fetcher,signal:controller.signal,limit:8});cache.set(q,{at:now(),items});if(cache.size>40)cache.delete(cache.keys().next().value);sendJson(res,200,{status:items.length?'ok':'no-results',query:'表情包 '+q,items});}catch{if(!res.headersSent)sendJson(res,200,{status:'unavailable',query:'表情包 '+q,items:[]});}finally{clearTimeout(timer);}};}
export function registerMemeRoute(ctx,options={}){const webServer=typeof ctx?.get==='function'?ctx.get('webServer'):ctx?.webServer;if(!webServer?.register)return()=>{};return webServer.register({kind:'exact',path:ROUTE,handler:createMemeRouteHandler(options)});}
export {ROUTE as MEME_ROUTE};
