import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {createSettings,STORAGE_KEY} from '../src/shared/settings.js';
import {discoverAdapter,proseInRow} from '../src/client/adapter.js';
import {discoverAdapter as v1Discover,proseInRow as v1Prose} from './fixtures/v1-adapter.js';
import {installTypography,faceForText} from '../src/client/controller.js';
import {diagnosticText,statusLabel} from '../src/client/diagnostics.js';
import {apply as hostApply} from '../src/plugin/index.js';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/host-release.json',import.meta.url),'utf8'));
const css=readFileSync(new URL('../src/client/content.css',import.meta.url),'utf8');
const tick=(ms=430)=>new Promise(r=>setTimeout(r,ms));
function setup({tag=true,content=fixture.html,role='assistant-step',settings=createSettings()}={}){
 settings.update({mediaGallery:false});
 const dom=new JSDOM('<!doctype html><head>'+(tag?'<style data-plugin-css="@deepseek-ai/dsh-client-ui-chat/AssistantMarkdown.module.css">'+fixture.assistantCSS+'</style>':'')+'</head><body><div data-chat-flow-kind="'+role+'" id="row">'+content+'</div></body>',{pretendToBeVisual:true});
 const doc=dom.window.document;const controller=installTypography(doc,settings,css);
 return {dom,doc,settings,controller,row:doc.querySelector('#row'),prose:doc.querySelector('.'+fixture.classMap.markdown)};
}
function finish(t){t.controller.dispose();t.dom.window.close();}
test('published host SSR structure proves V1 zero matches and V2 one',()=>{
 const dom=new JSDOM('<style data-plugin-css="@deepseek-ai/dsh-client-ui-chat/AssistantMarkdown.module.css">'+fixture.assistantCSS+'</style><div data-chat-flow-kind="assistant-step">'+fixture.html+'</div>');
 const doc=dom.window.document,row=doc.querySelector('[data-chat-flow-kind]');
 assert.equal(fixture.classMap.markdown,'_markdown_uddqf_5');assert.equal(v1Prose(row,v1Discover(doc)).length,0);
 assert.equal(proseInRow(row,discoverAdapter(doc)).length,1);dom.window.close();
});
test('hash variants are recognized within a verified wrapper, not globally',()=>{
 const x=setup({content:fixture.html.replaceAll('_markdown_uddqf_5','_markdown_a9Z_42')});
 assert.equal(proseInRow(x.row,discoverAdapter(x.doc)).length,1);
 x.row.insertAdjacentHTML('beforeend','<div class="_markdown_a9Z_42">outside known body</div>');
 assert.equal(proseInRow(x.row,discoverAdapter(x.doc)).length,1);finish(x);
});
test('extracted CSS fallback uses verified wrapper; unknown pairs remain unmatched',async()=>{
 const a=setup({tag:false});await tick();assert.equal(a.controller.status().state,'active');finish(a);
 const b=setup({tag:false,content:fixture.html.replaceAll('Xpiw2q','Unverified')});await tick();assert.equal(b.controller.status().state,'unmatched');finish(b);
});
test('state updates distinguish waiting, unmatched, active, partial, disabled',async()=>{
 const x=setup();let calls=0;const off=x.controller.subscribe(()=>calls++);
 await tick();assert.equal(x.controller.status().state,'active');assert.equal(x.controller.status().matchedMessages,1);
 x.row.remove();await tick();assert.equal(x.controller.status().state,'waiting');
 x.doc.body.append(x.row);x.prose.className='unrecognized';await tick();assert.equal(x.controller.status().state,'unmatched');
 x.prose.className=fixture.classMap.markdown;const unknown=x.row.cloneNode(true);unknown.querySelector('.'+fixture.classMap.markdown).className='other';x.doc.body.append(unknown);await tick();assert.equal(x.controller.status().state,'partial');
 x.settings.update({enabled:false});assert.equal(x.controller.status().state,'disabled');assert.ok(calls>=4);off();finish(x);
});
test('all original text, element identities and child order survive decoration',async()=>{
 const x=setup();const text=x.prose.textContent,nodes=[...x.prose.querySelectorAll('*')],original=x.prose.innerHTML;
 await tick();assert.equal(x.prose.textContent,text);assert.deepEqual([...x.prose.querySelectorAll('*')],nodes);
 assert.equal(x.prose.querySelectorAll('[data-ecp-title]').length,3);assert.equal(x.prose.querySelectorAll('[data-ecp-tone]').length,2);
 x.settings.update({enabled:false});assert.equal(x.prose.innerHTML,original);finish(x);
});
test('facial emoji are visual-only and serious topics suppress them',async()=>{
 assert.equal(faceForText('这次旅行已经安排好了，祝你玩得开心'),'😊');assert.equal(faceForText('任务已经成功完成'),'🎉');assert.equal(faceForText('需要分析原因再判断'),'🤔');assert.equal(faceForText('医疗风险与用药提醒'),'');
 const x=setup();const text=x.prose.textContent;await tick();const lead=x.prose.querySelector('[data-ecp-block="lead"]');assert.ok(lead?.dataset.ecpFace);assert.equal(x.prose.textContent,text);
 x.settings.update({faceEmoji:false});await tick();assert.equal(lead.hasAttribute('data-ecp-face'),false);assert.equal(x.prose.textContent,text);finish(x);
});
test('V18 keeps the pure outline and removes the entire interaction bar',async()=>{
 const x=setup();const text=x.prose.textContent;await tick();assert.equal(x.doc.querySelectorAll('.ecp-companion,.ecp-reactions,.ecp-reaction,.ecp-copy-answer').length,0);assert.equal(x.prose.previousElementSibling?.dataset.ecpOutline,'true');assert.equal(x.prose.textContent,text);finish(x);
});
test('plugin sidecars do not schedule a second decoration pass',async()=>{
 const x=setup();await tick();const scans=x.controller.status().decorationScans;await tick();assert.equal(x.controller.status().decorationScans,scans);finish(x);
});
test('user, tool, reasoning, compact and unrelated Markdown remain untouched',async()=>{
 for(const role of ['user','tool','steering']){const x=setup({role});await tick();assert.equal(x.controller.status().proseBlocks,0);finish(x);}
 const x=setup();x.prose.setAttribute('data-markdown-variant','compact');
 x.row.insertAdjacentHTML('beforeend','<div data-turn-process-inline><div class="Xpiw2q_root"><div class="Xpiw2q_body"><div class="_markdown_uddqf_5">private reasoning</div></div></div></div>');
 await tick();assert.equal(x.controller.status().proseBlocks,0);finish(x);
});
test('table keyboard focus preserves and restores the host tabindex',async()=>{
 const x=setup();const table=x.prose.querySelector('div > table').parentElement;
 table.setAttribute('tabindex','-1');await tick();assert.equal(table.getAttribute('tabindex'),'0');
 x.settings.update({enabled:false});assert.equal(table.getAttribute('tabindex'),'-1');
 x.settings.update({enabled:true});await tick();x.controller.dispose();assert.equal(table.getAttribute('tabindex'),'-1');x.dom.window.close();
});
test('no title misclassification when bold has ordinary text around it',async()=>{
 const x=setup();const p=x.prose.querySelector('p');p.innerHTML='正文 <strong>强调</strong> 继续';await tick();assert.equal(p.hasAttribute('data-ecp-title'),false);finish(x);
});
test('streaming defers structural decoration then updates once settled',async()=>{
 const x=setup();x.prose.closest('.Xpiw2q_root').dataset.streaming='true';await tick();
 const before=x.controller.status();for(let i=0;i<200;i++)x.prose.querySelector('p').append('流');await tick();
 assert.equal(x.controller.status().scans,before.scans);assert.equal(x.controller.status().decorationScans,before.decorationScans);
 assert.equal(x.prose.querySelectorAll('[data-ecp-title]').length,0);
 x.prose.closest('.Xpiw2q_root').removeAttribute('data-streaming');await tick();assert.equal(x.prose.querySelectorAll('[data-ecp-title]').length,3);finish(x);
});
test('unmarked token streaming is coalesced until the answer becomes quiet',async()=>{
 const x=setup();await tick();const before=x.controller.status().decorationScans,p=x.prose.querySelector('p');
 for(let i=0;i<24;i++){p.append('流');await tick(10);}
 assert.equal(x.controller.status().decorationScans,before);await tick();assert.equal(x.controller.status().decorationScans,before+1);finish(x);
});
test('very long replies enter per-message safety mode without losing content or node identity',async()=>{
 const x=setup(),nodes=[];x.prose.replaceChildren();
 for(let i=0;i<120;i++){const p=x.doc.createElement(i%12===0?'h2':'p');p.textContent='第'+(i+1)+'段：这是用于核验长回复完整性的内容。'.repeat(10);nodes.push(p);x.prose.append(p);}
 const text=x.prose.textContent,html=x.prose.innerHTML;await tick();
 assert.equal(x.prose.dataset.ecpLongContent,'true');assert.equal(x.prose.textContent,text);assert.equal(x.prose.children.length,120);assert.deepEqual([...x.prose.children],nodes);
 x.settings.update({enabled:false});assert.equal(x.prose.textContent,text);assert.equal(x.prose.innerHTML,html);finish(x);
});
test('virtualized role reuse, whole row removal and re-attachment clean up',async()=>{
 const x=setup();await tick();x.row.dataset.chatFlowKind='user';await tick();assert.equal(x.prose.hasAttribute('data-ecp-prose'),false);
 x.row.dataset.chatFlowKind='assistant-step';await tick();assert.equal(x.controller.status().matchedMessages,1);
 x.row.remove();await tick();assert.equal(x.controller.status().proseBlocks,0);assert.equal(x.prose.hasAttribute('data-ecp-prose'),false);
 x.doc.body.append(x.row);await tick();assert.equal(x.controller.status().matchedMessages,1);finish(x);
});
test('new rows and replacement prose keep correct match counts',async()=>{
 const x=setup();await tick();const clone=x.row.cloneNode(true);for(const el of [clone,...clone.querySelectorAll('*')])for(const a of [...el.attributes])if(a.name.startsWith('data-ecp'))el.removeAttribute(a.name);
 x.doc.body.append(clone);await tick();assert.equal(x.controller.status().matchedMessages,2);
 x.prose.replaceWith(x.prose.cloneNode(true));await tick();assert.equal(x.controller.status().proseBlocks,2);finish(x);
});
test('late style mapping and invalidation update adapter without leaking old attrs',async()=>{
 const x=setup();await tick();x.doc.querySelector('style[data-plugin-css]').textContent='.New_root{}.New_body{}';await tick();assert.equal(x.controller.status().state,'unmatched');
 x.doc.querySelector('style[data-plugin-css]').textContent=fixture.assistantCSS;await tick();assert.equal(x.controller.status().state,'active');finish(x);
});
test('stop/restart/unload restore original custom attributes and zero observers',async()=>{
 const x=setup();const p=x.prose.querySelector('p');p.setAttribute('data-ecp-title','original');await tick();
 x.settings.update({enabled:false});assert.equal(p.getAttribute('data-ecp-title'),'original');const scans=x.controller.status().scans;
 p.append('off');await tick();assert.equal(x.controller.status().scans,scans);
 x.settings.update({enabled:true});await tick();x.controller.dispose();x.controller.dispose();
 assert.equal(x.doc.querySelectorAll('style[data-echocat-prettier]').length,0);assert.equal(x.prose.hasAttribute('data-ecp-prose'),false);x.dom.window.close();
});
test('V1/V2 settings migration preserves explicit disabled state and personal choices',()=>{
 const old={enabled:false,rich:false,preset:'paper',font:'host',density:'compact',accent:'indigo'};
 const s=createSettings({getItem:k=>k.endsWith(':v1')?JSON.stringify(old):null});
 assert.equal(s.get().enabled,false);assert.equal(s.get().rich,false);assert.equal(s.get().font,'host');assert.equal(s.get().accent,'indigo');assert.equal(s.get().size,'host');
 assert.equal(createSettings().get().preset,'minimal');assert.equal(createSettings().get().motionStyle,'liquid');assert.equal(createSettings().get().shadow,'float');assert.equal(createSettings().get().layout,'cards');assert.equal(createSettings().get().density,'relaxed');assert.equal(createSettings().get().radius,'round');assert.equal(createSettings().get().animatedMeme,'auto');assert.equal(createSettings().get().mediaGallery,false);assert.equal(createSettings().get().contentWidth,'wide');assert.equal(createSettings().get().surfaceOpacity,'solid');assert.equal(createSettings().get().blurStrength,'heavy');assert.equal(createSettings().get().borderGlow,'subtle');assert.equal(createSettings().get().headingScale,'strong');assert.equal(createSettings().get().elementMotion,'hover');
});
test('storage corruption/denial remains usable and V2 takes precedence',()=>{
 const s=createSettings({getItem(){throw Error('no')},setItem(){throw Error('no')}});s.update({font:'bad',size:'large'});assert.equal(s.get().font,'sans');assert.equal(s.get().size,'large');
 const t=createSettings({getItem:k=>k===STORAGE_KEY?JSON.stringify({preset:'reading',enabled:true}):JSON.stringify({enabled:false})});assert.equal(t.get().enabled,true);
});
test('diagnostic output contains only version, adapter and counts',async()=>{
 const x=setup();await tick();const s=x.controller.status(),d=JSON.parse(diagnosticText(s));
 assert.equal(d.version,'0.23.5');assert.equal(d.matchedMessages,1);assert.deepEqual(Object.keys(d).sort(),['plugin','version','state','assistantRows','matchedMessages','proseBlocks','adapter'].sort());
 assert.doesNotMatch(diagnosticText(s),/攻略|用户|path|token|secret/i);assert.match(statusLabel({...s,state:'unmatched'}),/未匹配/);finish(x);
});
test('host guidance stays opt-in while the passive same-origin meme route remains available',()=>{let called=0;hostApply({inject(){called++;}},{autoImages:false,naturalEmoji:false});assert.equal(called,1);});
test('production bundle and package agree on version and DSH loader contract',()=>{
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));assert.equal(pkg.version,'0.23.5');
 let registration;vm.runInNewContext(readFileSync(new URL('../lib/client.js',import.meta.url),'utf8'),{window:{__ModuleLoader__:{load:x=>registration=x}}});
 assert.equal(registration.id,pkg.name);const api=registration.factory(id=>{assert.equal(id,'react');return {};});assert.equal(typeof api.apply,'function');
 const code=readFileSync(new URL('../lib/client.js',import.meta.url),'utf8');assert.match(code,/dsh-echocat-prettier\/api\/memes/);assert.doesNotMatch(code,/image\.baidu\.com\/search\/acjson|XMLHttpRequest|innerHTML\s*=|dangerouslySetInnerHTML/);
});
