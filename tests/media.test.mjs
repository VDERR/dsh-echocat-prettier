import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createImageSearchTool,EXTERNAL_NOTICE} from '../src/plugin/images.js';
import {apply,IMAGE_GUIDANCE,EMOJI_GUIDANCE} from '../src/plugin/index.js';
import {createSettings} from '../src/shared/settings.js';
import {installTypography} from '../src/client/controller.js';
import {extractSafeVisualQuery,searchCommons,searchOpenverse,createGalleryManager} from '../src/client/gallery.js';
import {analyzeMemeIntent,extractMemeQuery,isMemeTitleRelevant,requestMeme,requestMemes,createMemePreferences,createMemeManager,PREF_KEY} from '../src/client/memes.js';
import {parseBaiduMemeResults,parseBaiduPayloadText,searchBaiduMemes,createMemeRouteHandler,MEME_ROUTE} from '../src/plugin/memes.js';
const real=JSON.parse(readFileSync(new URL('./fixtures/media-example.json',import.meta.url)));
const fixture=JSON.parse(readFileSync(new URL('./fixtures/host-media.json',import.meta.url)));
const response=pages=>Response.json({query:{pages}});
const valid=()=>({title:real.title,imageinfo:[{mime:'image/jpeg',thumburl:real.imageUrl,descriptionurl:real.sourceUrl,extmetadata:{Artist:{value:real.author},LicenseShortName:{value:real.license},LicenseUrl:{value:real.licenseUrl}}}]});
test('image search transmits only validated keywords and returns verified URLs with credits',async()=>{
 const calls=[];const tool=createImageSearchTool({fetcher:async(u,init)=>{calls.push({url:String(u),init});return init.method==='HEAD'?new Response(null,{headers:{'content-type':'image/jpeg','content-length':'9000'}}):response([valid()]);}});
 const r=await tool.execute({query:'panda'});assert.equal(r.status,'ok');assert.equal(calls.length,2);
 const query=new URL(calls[0].url);assert.equal(query.searchParams.get('gsrsearch'),'panda filetype:bitmap');assert.equal(calls[0].init.body,undefined);assert.equal(calls[0].init.credentials,'omit');
 assert.equal(r.items[0].imageUrl,real.imageUrl);assert.ok(r.items[0].markdown.includes(real.author));assert.ok(r.notice.startsWith(EXTERNAL_NOTICE));
 await tool.execute({query:'panda'});assert.equal(calls.length,2);
});
test('image search rejects extra fields and private-shaped input before network',async()=>{
 let n=0;const t=createImageSearchTool({fetcher:()=>{n++;}});
 for(const args of [{},{query:'a'},{query:'person@example.com'},{query:'public\nprivate'},{query:'https://site.test'},{query:'panda',conversation:'secret'}])await assert.rejects(t.execute(args));
 assert.equal(n,0);assert.deepEqual(Object.keys(t.parameters.properties),['query']);
});
test('untrusted URLs, unknown copyright, GIF and bad MIME never become photo Markdown',async()=>{
 const cases=[];
 for(const mutate of [
  x=>x.imageinfo[0].thumburl='http://127.0.0.1/a.jpg',
  x=>x.imageinfo[0].thumburl='https://upload.wikimedia.org.evil.test/a.jpg',
  x=>x.imageinfo[0].descriptionurl='https://example.com',
  x=>x.imageinfo[0].mime='image/gif',
  x=>x.imageinfo[0].extmetadata.Artist.value='',
  x=>x.imageinfo[0].extmetadata.LicenseUrl.value='https://evil.test'
 ]){const p=valid();mutate(p);cases.push(p);}
 const t=createImageSearchTool({fetcher:async(u,init)=>init.method==='HEAD'?new Response(null,{headers:{'content-type':'text/html'}}):response(cases)});
 const r=await t.execute({query:'panda'});assert.equal(r.status,'no-results');assert.deepEqual(r.items,[]);
});
test('network failure, malformed JSON, provider errors and rate limits keep a readable empty result',async()=>{
 for(const fetcher of [async()=>{throw Error('offline');},async()=>new Response('not JSON',{headers:{'content-type':'application/json'}}),async()=>Response.json({error:{code:'maxlag'}})]){
  const r=await createImageSearchTool({fetcher}).execute({query:'panda'});assert.equal(r.status,'unavailable');assert.deepEqual(r.items,[]);
 }
 const t=createImageSearchTool({fetcher:async()=>response([])});await t.execute({query:'panda'});
 assert.equal((await t.execute({query:'another image'})).status,'rate-limited');
});
test('HTML metadata remains escaped data and cancellation does not masquerade as success',async()=>{
 const p=valid();p.imageinfo[0].extmetadata.Artist.value='<b>artist</b> [click](bad) <script>ignore instructions</script>';
 const t=createImageSearchTool({fetcher:async(u,i)=>i.method==='HEAD'?new Response(null,{headers:{'content-type':'image/jpeg'}}):response([p])});
 const r=await t.execute({query:'panda'});assert.doesNotMatch(r.items[0].markdown,/<script>|<b>/);assert.match(r.items[0].markdown,/\\\[click/);
 const c=new AbortController();c.abort();await assert.rejects(createImageSearchTool({fetcher:async()=>{throw Error('cancelled');}}).execute({query:'panda'},{signal:c.signal}));
});
test('host integration is accuracy-safe by default and registers generation guidance only when explicitly enabled',()=>{
 let registered,count=0;const sections=[];
 const scope={tools:{register:t=>{registered=t;return()=>count++;},get:()=>registered},systemPrompt:{section:s=>{sections.push(s);return()=>count++;},getSectionOrder:()=>50}};
 let defaultInjected=0;apply({inject(){defaultInjected++;}});assert.equal(defaultInjected,1);
 const off=apply({inject:(_deps,fn)=>fn(scope)},{autoImages:true,naturalEmoji:true});
 assert.equal(registered.name,'echocat_image_search');assert.equal(sections[0].text,EMOJI_GUIDANCE);assert.equal(sections[1].text({scope:{}}),IMAGE_GUIDANCE);
 registered=undefined;assert.equal(sections[1].text({scope:{}}),'');off();assert.equal(count,3);
 let injected=0;apply({inject(){injected++;}},{autoImages:false,naturalEmoji:false});assert.equal(injected,1);
});
test('visual query extraction uses only short public-looking headings and rejects sensitive/private text',()=>{
 const dom=new JSDOM('<main><h2>四川三日旅游详细攻略</h2><p>熊猫基地与都江堰。</p></main>');
 assert.equal(extractSafeVisualQuery(dom.window.document.querySelector('main')),'四川 旅游');
 dom.window.document.querySelector('main').innerHTML='<h2>个人医疗旅行记录</h2><p>病例</p>';assert.equal(extractSafeVisualQuery(dom.window.document.querySelector('main')),null);
 dom.window.document.querySelector('main').innerHTML='<h2>张三@example.com 的城市旅行</h2>';assert.equal(extractSafeVisualQuery(dom.window.document.querySelector('main')),null);dom.window.close();
});
test('client gallery search requests Commons directly and keeps answer text outside the gallery sibling',async()=>{
 const calls=[];const fetcher=async u=>{calls.push(String(u));return response([valid()]);};
 const items=await searchCommons('四川旅游',{fetcher,limit:2});assert.equal(items.length,1);assert.equal(new URL(calls[0]).searchParams.get('origin'),'*');
 const dom=new JSDOM('<body><div id="prose"><h2>四川三日旅游详细攻略</h2><p>原始答案保持不变。</p></div></body>',{pretendToBeVisual:true});
 const prose=dom.window.document.querySelector('#prose'),before=prose.textContent;
 const settings={get:()=>({enabled:true,mediaGallery:true,imageCount:'2',palette:'nature',motion:true})};
 const manager=createGalleryManager(dom.window.document,settings,{fetcher});await manager.sync(prose);await new Promise(r=>setTimeout(r,0));
 assert.equal(prose.textContent,before);assert.equal(prose.previousElementSibling?.dataset.ecpGallery,'true');assert.match(prose.previousElementSibling.textContent,/不参与答案生成/);
 manager.dispose();assert.equal(prose.previousElementSibling,null);dom.window.close();
});
test('Openverse search is anonymous, keyless and keeps only reusable licensed images',async()=>{
 const calls=[];const fetcher=async(u,init)=>{calls.push({url:String(u),init});return Response.json({results:[{title:'九寨沟',thumbnail:'https://api.openverse.org/v1/images/abc/thumb/',url:'https://live.staticflickr.com/1/example.jpg',foreign_landing_url:'https://www.flickr.com/photos/example/1',creator:'作者',license:'by-sa',license_version:'4.0',license_url:'https://creativecommons.org/licenses/by-sa/4.0/',source:'flickr'},{title:'不可用',thumbnail:'https://evil.test/a.jpg',url:'https://evil.test/a.jpg',foreign_landing_url:'https://example.com/a',creator:'x',license:'by',license_version:'4.0',license_url:'https://creativecommons.org/licenses/by/4.0/'}]});};
 const items=await searchOpenverse('九寨沟',{fetcher,limit:3});assert.equal(items.length,1);assert.equal(items[0].provider,'Openverse · flickr');
 assert.equal(items[0].fallbackImageUrl,'https://live.staticflickr.com/1/example.jpg');
 const url=new URL(calls[0].url);assert.equal(url.hostname,'api.openverse.org');assert.equal(url.searchParams.get('license'),'by,by-sa,cc0,pdm');assert.equal(calls[0].init.credentials,'omit');assert.equal(calls[0].init.headers.Authorization,undefined);
});
test('Unicode variation selectors and ZWJ emoji survive styling and disable without node replacement',async()=>{
 const dom=new JSDOM('<style data-plugin-css="@deepseek-ai/dsh-client-ui-chat/AssistantMarkdown.module.css">'+fixture.assistantCSS+'</style><div data-chat-flow-kind="assistant-step">'+fixture.html+'</div>',{pretendToBeVisual:true});
 const doc=dom.window.document,root=doc.querySelector('.'+fixture.classMap.markdown);
 const p=doc.createElement('p');p.textContent='😊 ✨ 🌿 ☀️ 👩‍💻 👨‍👩‍👧‍👦 🏳️‍🌈';root.append(p);const node=p.firstChild,before=root.innerHTML,text=root.textContent,settings=createSettings();
 const c=installTypography(doc,settings,'');await new Promise(r=>setTimeout(r,430));
 assert.equal(root.textContent,text);assert.equal(p.firstChild,node);assert.equal([...p.textContent].filter(c=>c==='\u200d').length,5);
 assert.equal(root.querySelectorAll('img').length,1);
 settings.update({enabled:false});assert.equal(root.innerHTML,before);c.dispose();dom.window.close();
});


test('meme query is extracted locally, prefixed, short, and suppressed for serious or private replies',()=>{
 const dom=new JSDOM('<main><p><strong>三角洲行动配装建议</strong></p><p>这套游戏思路可以直接试。</p></main>');const prose=dom.window.document.querySelector('main');prose.firstElementChild.dataset.ecpTitle='true';
 assert.equal(extractMemeQuery(prose,'balanced'),'表情包 三角洲行动 得意');prose.innerHTML='<p><strong data-ecp-title="true">为什么这样搭配</strong></p><p>这里有三个建议，可以直接试。</p>';assert.equal(extractMemeQuery(prose,'lively'),null);prose.innerHTML='<p><strong data-ecp-title="true">账户密码处理</strong></p><p>123456</p>';assert.equal(extractMemeQuery(prose,'lively'),null);dom.window.close();
});
test('body-only follow-up replies still extract a concrete subject without generic fallback',()=>{
 const dom=new JSDOM('<main><p>四川旅游春季适合去九寨沟，路线可以这样安排。</p></main>');const prose=dom.window.document.querySelector('main');
 assert.deepEqual(analyzeMemeIntent(prose,'lively'),{topic:'四川旅游',emotion:'',query:'表情包 四川旅游'});
 prose.innerHTML='<p>为什么这样搭配？这里有三个建议，可以直接试。</p>';assert.equal(analyzeMemeIntent(prose,'lively'),null);dom.window.close();
});
test('Baidu response parser keeps only allowlisted image hosts and ranks relevant meme results',()=>{
 const payload={data:[{middleURL:'https://evil.test/a.gif',fromPageTitleEnc:'三角洲行动表情包',type:'gif',width:300,height:300},{middleURL:'https://img2.baidu.com/it/u=1',fromPageTitleEnc:'素材下载',type:'jpg',width:500,height:500},{middleURL:'https://img1.baidu.com/it/u=cat',fromPageTitleEnc:'猫猫搞笑表情包',type:'gif',width:480,height:360},{middleURL:'https://img2.baidu.com/it/u=news',fromPageTitleEnc:'三角洲行动版本更新新闻',type:'jpg',width:480,height:360},{middleURL:'https://img0.baidu.com/it/u=2',fromPageTitleEnc:'三角洲行动搞笑表情包',type:'gif',width:480,height:360}]};
 const items=parseBaiduMemeResults(payload,'三角洲行动');assert.equal(items.length,1);assert.equal(items[0].imageUrl,'https://img0.baidu.com/it/u=2');assert.equal(items[0].animated,true);assert.equal(new URL(items[0].sourceUrl).hostname,'image.baidu.com');
});
test('client rejects a safe but semantically unrelated meme candidate',async()=>{
 const fetcher=async()=>Response.json({items:[{imageUrl:'https://img0.baidu.com/cat.jpg',sourceUrl:'https://image.baidu.com/search/index?word=x',title:'猫猫搞笑表情包'},{imageUrl:'https://img1.baidu.com/news.jpg',sourceUrl:'https://image.baidu.com/search/index?word=x',title:'三角洲行动版本更新新闻'},{imageUrl:'https://img1.baidu.com/game.jpg',sourceUrl:'https://image.baidu.com/search/index?word=x',title:'三角洲行动搞笑表情包'}]});const items=await requestMemes('表情包 三角洲行动 得意',{fetcher});assert.equal(items.length,1);assert.match(items[0].title,/三角洲行动/);assert.equal(isMemeTitleRelevant('猫猫搞笑表情包','表情包 三角洲行动 得意'),false);assert.equal(isMemeTitleRelevant('三角洲行动版本更新新闻','表情包 三角洲行动 得意'),false);assert.equal(isMemeTitleRelevant('三角洲行动搞笑表情包','表情包 三角洲行动 得意'),true);
});
test('host meme lookup sends only the fixed prefix plus short keyword and needs no key',async()=>{
 let call;const fetcher=async(url,init)=>{call={url:new URL(url),init};return new Response(JSON.stringify({data:[{middleURL:'https://img0.baidu.com/it/u=2',fromPageTitleEnc:'三角洲行动表情包',type:'gif',width:480,height:360}]}),{status:200,headers:{'content-type':'application/json'}});};
 const items=await searchBaiduMemes('三角洲行动',{fetcher});assert.equal(items.length,1);assert.equal(call.url.hostname,'image.baidu.com');assert.equal(call.url.searchParams.get('word'),'表情包 三角洲行动');assert.equal(call.init.headers.Authorization,undefined);
});
test('route and client manager decorate after the answer without altering original text',async()=>{
 const fetcher=async()=>Response.json({status:'ok',query:'表情包 三角洲行动 得意',items:[{imageUrl:'https://img0.baidu.com/it/u=2',sourceUrl:'https://image.baidu.com/search/index?word=x',title:'三角洲行动表情包'}]});
 const dom=new JSDOM('<body><div data-chat-flow-kind="assistant-step"><main id="p"><p data-ecp-title="true"><strong>三角洲行动配装建议</strong></p><p>这套游戏方案可以直接试。</p></main></div></body>',{pretendToBeVisual:true});const prose=dom.window.document.querySelector('#p'),before=prose.textContent,settings={get:()=>({enabled:true,autoMeme:true,memeFrequency:'balanced',palette:'minimal',glassMode:'liquid',glassMotion:true,motionStyle:'reveal',motionIntensity:'gentle',shadow:'float'})};const manager=createMemeManager(dom.window.document,settings,{fetcher});await manager.sync(prose);assert.equal(prose.textContent,before);assert.equal(prose.nextElementSibling?.dataset.ecpMeme,'true');assert.equal(prose.nextElementSibling.dataset.query,'表情包 三角洲行动 得意');manager.dispose();dom.window.close();
});
test('every completed reply can request its own memes even when the newest DSH row is prepended',async()=>{
 const calls=[],fetcher=async url=>{const q=new URL(url,'https://local.test').searchParams.get('q');calls.push(q);const topic=q.includes('四川旅游')?'四川旅游':'三角洲行动';return Response.json({items:[{imageUrl:'https://img0.baidu.com/'+encodeURIComponent(topic)+'.jpg',sourceUrl:'https://image.baidu.com/search/index?word=x',title:topic+'搞笑表情包'}]});};
 const dom=new JSDOM('<body><div data-chat-flow-kind="assistant-step" id="new"><main><p data-ecp-title="true"><strong>四川旅游建议</strong></p><p>春季路线可以直接试。</p></main></div><div data-chat-flow-kind="assistant-step" id="old"><main><p data-ecp-title="true"><strong>三角洲行动配装建议</strong></p><p>这套游戏方案可以直接试。</p></main></div></body>',{pretendToBeVisual:true});
 const settings={get:()=>({enabled:true,autoMeme:true,memeFrequency:'lively',memeCount:'1',palette:'minimal',animatedMeme:'still',memeSize:'standard',elementMotion:'none'})},manager=createMemeManager(dom.window.document,settings,{fetcher,storage:null}),oldProse=dom.window.document.querySelector('#old main'),newProse=dom.window.document.querySelector('#new main');
 await manager.sync(oldProse);await manager.sync(newProse);assert.equal(calls.length,2);assert.deepEqual(new Set(calls),new Set(['三角洲行动 得意','四川旅游 得意']));assert.equal(oldProse.nextElementSibling?.dataset.ecpMeme,'true');assert.equal(newProse.nextElementSibling?.dataset.ecpMeme,'true');manager.dispose();dom.window.close();
});
test('meme route validates method and query before external fetch',async()=>{
 let calls=0,status=0,body='';const handler=createMemeRouteHandler({fetcher:async()=>{calls++;return new Response('{}');}});const response={headersSent:false,writeHead(s){status=s;this.headersSent=true;},end(x=''){body+=x;}};await handler({method:'GET',url:MEME_ROUTE+'?q='+encodeURIComponent('https://private.test'),on(){}},response);assert.equal(status,400);assert.equal(calls,0);assert.deepEqual(JSON.parse(body).items,[]);
});

test('Baidu malformed backslash escapes are repaired without evaluating text',()=>{const x=parseBaiduPayloadText('{\"data\":[{\"title\":\"bad\\qvalue\"}]}');assert.equal(x.data[0].title,'bad\\qvalue');assert.equal(parseBaiduPayloadText('not json'),null);});


test('V15 combines topic and emotion without sending the answer body',()=>{
 const dom=new JSDOM('<main><p data-ecp-title="true"><strong>旅行安排建议</strong></p><p>没想到这么快就顺利完成，太好了。</p></main>');const intent=analyzeMemeIntent(dom.window.document.querySelector('main'),'balanced');assert.deepEqual(intent,{topic:'旅行安排',emotion:'开心',query:'表情包 旅行安排 开心'});assert.ok(intent.query.length<=24);dom.window.close();
});
test('V15 quality filter rejects advertising, templates, unsafe hosts and duplicate titles',()=>{
 const payload={data:[{middleURL:'https://img0.baidu.com/1.jpg',thumbURL:'https://img0.baidu.com/1t.jpg',fromPageTitleEnc:'测试游戏广告海报模板',type:'jpg',width:500,height:400},{middleURL:'https://img0.baidu.com/2.jpg',thumbURL:'https://img0.baidu.com/2t.jpg',fromPageTitleEnc:'测试游戏搞笑表情包 - 知乎',type:'gif',width:500,height:400},{middleURL:'https://img1.baidu.com/3.jpg',thumbURL:'https://img1.baidu.com/3t.jpg',fromPageTitleEnc:'测试游戏搞笑表情包 - 百度',type:'gif',width:500,height:400},{middleURL:'https://evil.test/4.jpg',fromPageTitleEnc:'测试游戏表情包',type:'jpg',width:500,height:400}]};const items=parseBaiduMemeResults(payload,'测试游戏 开心');assert.equal(items.length,1);assert.match(items[0].title,/搞笑表情包/);assert.equal(items[0].animated,true);assert.match(items[0].posterUrl,/baidu/);
});
test('V15 local preferences keep only 20 recent images and remember like/dislike locally',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)},prefs=createMemePreferences(storage);for(let i=0;i<25;i++)prefs.remember({imageUrl:'https://img0.baidu.com/'+i+'.jpg'});prefs.like({topic:'旅行',emotion:'开心'});prefs.block({imageUrl:'https://img0.baidu.com/bad.jpg',title:'低质量表情包 - 网站'});const snapshot=prefs.snapshot();assert.equal(snapshot.recent.length,20);assert.equal(snapshot.recent[0],'https://img0.baidu.com/5.jpg');assert.deepEqual(snapshot.liked,['旅行','开心']);assert.equal(prefs.blocked({imageUrl:'https://img0.baidu.com/bad.jpg',title:'anything'}),true);assert.ok(map.has(PREF_KEY));
});
test('V15 client accepts a candidate set so disliked and recent images can be replaced',async()=>{
 const fetcher=async()=>Response.json({items:[{imageUrl:'https://img0.baidu.com/a.gif',posterUrl:'https://img0.baidu.com/a.jpg',sourceUrl:'https://image.baidu.com/search/index?word=x',title:'测试游戏开心表情包',animated:true},{imageUrl:'https://img1.baidu.com/b.jpg',sourceUrl:'https://image.baidu.com/search/index?word=x',title:'测试游戏搞笑表情包',animated:false}]});const items=await requestMemes('表情包 测试游戏 开心',{fetcher});assert.equal(items.length,2);assert.equal(items[0].posterUrl,'https://img0.baidu.com/a.jpg');assert.equal((await requestMeme('表情包 测试游戏 开心',{fetcher})).imageUrl,items[0].imageUrl);
});

test('broken meme candidates stay hidden, retry in the same centered gallery, then remove the whole image area',async()=>{
 const fetcher=async()=>Response.json({items:[{imageUrl:'https://img0.baidu.com/broken-a.jpg',sourceUrl:'https://image.baidu.com/search/index?word=x',title:'旅行安排开心表情包一'},{imageUrl:'https://img1.baidu.com/broken-b.jpg',sourceUrl:'https://image.baidu.com/search/index?word=x',title:'旅行安排开心表情包二'}]});
 const dom=new JSDOM('<body><div data-chat-flow-kind="assistant-step"><main id="p"><p data-ecp-title="true"><strong>旅行安排建议</strong></p><p>这个旅行方案可以直接试。</p></main></div></body>',{pretendToBeVisual:true});const prose=dom.window.document.querySelector('#p'),settings={get:()=>({enabled:true,autoMeme:true,memeFrequency:'balanced',memeCount:'1',palette:'minimal',glassMode:'liquid',glassMotion:true,motionStyle:'liquid',motionIntensity:'gentle',animatedMeme:'still',memeSize:'standard',elementMotion:'hover'})};const manager=createMemeManager(dom.window.document,settings,{fetcher,storage:null});
 await manager.sync(prose);const gallery=prose.nextElementSibling,first=gallery.querySelector('img');assert.equal(gallery.hidden,true);first.dispatchEvent(new dom.window.Event('error'));const second=gallery.querySelector('img');assert.notEqual(second,first);assert.equal(gallery.hidden,true);second.dispatchEvent(new dom.window.Event('error'));assert.equal(prose.nextElementSibling,null);manager.dispose();dom.window.close();
});

test('V2.3.4 renders the requested number of relevant meme candidates in one gallery without altering answer text',async()=>{
 const items=Array.from({length:4},(_,index)=>({imageUrl:`https://img${index%2}.baidu.com/${index}.jpg`,sourceUrl:'https://image.baidu.com/search/index?word=x',title:`旅行安排开心表情包${index}`}));
 const dom=new JSDOM('<body><div data-chat-flow-kind="assistant-step"><main id="p"><p data-ecp-title="true"><strong>旅行安排建议</strong></p><p>旅行方案已经顺利完成。</p></main></div></body>',{pretendToBeVisual:true}),prose=dom.window.document.querySelector('#p'),before=prose.textContent,settings={get:()=>({enabled:true,autoMeme:true,memeFrequency:'lively',memeCount:'3',palette:'minimal',animatedMeme:'still',memeSize:'standard',elementMotion:'none'})};
 const manager=createMemeManager(dom.window.document,settings,{storage:null,fetcher:async()=>Response.json({items})});await manager.sync(prose);const gallery=prose.nextElementSibling;assert.equal(prose.textContent,before);assert.equal(gallery.className,'ecp-meme-gallery');assert.equal(gallery.dataset.ecpMemeCount,'3');assert.equal(gallery.querySelectorAll('.ecp-meme').length,3);manager.dispose();dom.window.close();
});

test('V22 gallery and meme loading timeouts leave no blank frame or endless loader',async()=>{
 const previous=globalThis.__ECHOCAT_IMAGE_TIMEOUT__;globalThis.__ECHOCAT_IMAGE_TIMEOUT__=18;
 try{
  const dom=new JSDOM('<body><div data-chat-flow-kind="assistant-step"><main id="p"><h2>四川旅游攻略</h2><p>旅行景点与城市安排可以直接试。</p></main></div></body>',{pretendToBeVisual:true});const prose=dom.window.document.querySelector('#p');
  const gallerySettings={get:()=>({enabled:true,mediaGallery:true,mediaLevel:'light',imageCount:'1',palette:'minimal',motion:true,glassMode:'liquid',glassMotion:true,motionStyle:'liquid',motionIntensity:'gentle',shadow:'float'})};const galleryFetcher=async u=>new URL(String(u)).hostname==='api.openverse.org'?Response.json({results:[]}):response([valid()]);const gallery=createGalleryManager(dom.window.document,gallerySettings,{fetcher:galleryFetcher});await gallery.sync(prose);assert.equal(prose.previousElementSibling.hidden,true);
  const memeSettings={get:()=>({enabled:true,autoMeme:true,memeFrequency:'balanced',palette:'minimal',glassMode:'liquid',glassMotion:true,motionStyle:'liquid',motionIntensity:'gentle',animatedMeme:'still',memeSize:'standard',elementMotion:'hover'})};const meme=createMemeManager(dom.window.document,memeSettings,{storage:null,fetcher:async()=>Response.json({items:[{imageUrl:'https://img0.baidu.com/never-load.jpg',sourceUrl:'https://image.baidu.com/search/index?word=x',title:'四川旅游表情包'}]})});await meme.sync(prose);assert.equal(prose.nextElementSibling.hidden,true);
  await new Promise(r=>setTimeout(r,45));assert.equal(prose.previousElementSibling,null);assert.equal(prose.nextElementSibling,null);gallery.dispose();meme.dispose();dom.window.close();
 }finally{if(previous===undefined)delete globalThis.__ECHOCAT_IMAGE_TIMEOUT__;else globalThis.__ECHOCAT_IMAGE_TIMEOUT__=previous;}
});
