import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {VISUAL_STYLES,LAYOUT_PRESETS,DEFAULT_STYLE_PALETTES,colorsFor} from '../src/shared/final-presets.js';
import {createSettings,normalize,STORAGE_KEY} from '../src/shared/settings.js';
import {installTypography} from '../src/client/controller.js';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/host-release.json',import.meta.url),'utf8'));
const css=readFileSync(new URL('../src/client/content.css',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../src/client/final.css',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setTimeout(resolve,430));

test('final catalog exposes 15 distinct visual styles and 9 structural layouts',()=>{
 assert.equal(VISUAL_STYLES.length,15);assert.equal(LAYOUT_PRESETS.length,9);
 assert.equal(new Set(VISUAL_STYLES.map(item=>item.id)).size,15);assert.equal(new Set(LAYOUT_PRESETS.map(item=>item.id)).size,9);
 assert.equal(new Set(VISUAL_STYLES.map(item=>JSON.stringify(item.colors))).size,15);
 assert.deepEqual(VISUAL_STYLES.map(item=>item.id),Object.keys(DEFAULT_STYLE_PALETTES));
});

test('per-style colors are sanitized, isolated, persisted, and resettable',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const settings=createSettings(storage);settings.update({visualStyle:'developer-terminal',diyLayout:'collage',stylePalettes:{'developer-terminal':{primary:'#112233',secondary:'#445566',accent:'#77aa99'},vaporwave:{primary:'javascript:bad',secondary:'#010203',accent:'#abcdef'},unknown:{primary:'#000000'}}});
 assert.equal(settings.get().visualStyle,'developer-terminal');assert.equal(settings.get().diyLayout,'collage');
 assert.deepEqual(colorsFor(settings.get()),{primary:'#112233',secondary:'#445566',accent:'#77aa99'});
 assert.deepEqual(settings.get().stylePalettes.vaporwave,{...DEFAULT_STYLE_PALETTES.vaporwave,secondary:'#010203',accent:'#abcdef'});assert.equal(settings.get().stylePalettes.unknown,undefined);
 assert.ok(values.has(STORAGE_KEY));const restored=createSettings(storage);assert.deepEqual(restored.get().stylePalettes,settings.get().stylePalettes);
 const invalid=normalize({visualStyle:'missing',diyLayout:'missing',stylePalettes:[]});assert.equal(invalid.visualStyle,'clear-space');assert.equal(invalid.diyLayout,'native');assert.deepEqual(invalid.stylePalettes,{});
});

test('V2.3.6 count controls are bounded, persisted, and default to richer decoration',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},settings=createSettings(storage);
 assert.equal(settings.get().memeCount,'2');assert.equal(settings.get().emojiCount,'6');assert.equal(settings.get().memeFrequency,'lively');
 settings.update({memeCount:'4',emojiCount:'8'});assert.equal(createSettings(storage).get().memeCount,'4');assert.equal(createSettings(storage).get().emojiCount,'8');
 const invalid=normalize({memeCount:'99',emojiCount:'99'});assert.equal(invalid.memeCount,'2');assert.equal(invalid.emojiCount,'6');
});

test('V2.3.6 publishes branded update and repository metadata without touching answer content',()=>{
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 const source=readFileSync(new URL('../src/client/index.jsx',import.meta.url),'utf8');
 const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
 assert.equal(pkg.repository.url,'git+https://github.com/VDERR/dsh-echocat-prettier.git');
 assert.equal(pkg.homepage,'https://github.com/VDERR/dsh-echocat-prettier#readme');
 assert.ok(pkg.keywords.includes('dsh-plugin'));
 assert.match(source,/assets\/echocat-logo\.png/);
 assert.match(source,/api\.github\.com\/repos\/VDERR\/dsh-echocat-prettier\/releases\/latest/);
 assert.match(source,/href=\{REPOSITORY_URL\}/);
 assert.match(build,/['"]\.png['"]:\s*['"]dataurl['"]/);
});

test('V2.3.6 uses the official upper sidebar panel contract with matching main and overlay entries',()=>{
 const source=readFileSync(new URL('../src/client/index.jsx',import.meta.url),'utf8');
 assert.match(source,/inject=\['slots','layout'\]/);
 assert.match(source,/name:'sidebar\.panellist',id:PANEL_ID,order:20,label:'回复美化'/);
 assert.match(source,/name:'main',key:PANEL_ID/);
 assert.match(source,/name:'shell\.overlay',id:'echocat-prettier-settings-dialog'/);
 assert.doesNotMatch(source,/sidebar\.footer\.action|ecp-sidebar-control|ecp-sidebar-open|ecp-sidebar-switch/);
});

test('emoji limit changes decorative attributes without changing answer text',async()=>{
 const settings=createSettings();settings.update({autoMeme:false,mediaGallery:false,emojiCount:'2',visualEmoji:true,emojiDensity:'lively'});
 const dom=new JSDOM('<!doctype html><head><style data-plugin-css="@deepseek-ai/dsh-client-ui-chat/AssistantMarkdown.module.css">'+fixture.assistantCSS+'</style></head><body><div data-chat-flow-kind="assistant-step">'+fixture.html+'</div></body>',{pretendToBeVisual:true}),doc=dom.window.document,prose=doc.querySelector('.'+fixture.classMap.markdown),before=prose.textContent,controller=installTypography(doc,settings,css);await tick();
 assert.equal(prose.textContent,before);assert.equal(prose.querySelectorAll('[data-ecp-icon]').length,2);settings.update({emojiCount:'8'});await tick();assert.ok(prose.querySelectorAll('[data-ecp-icon]').length>2);assert.ok(prose.querySelectorAll('[data-ecp-icon]').length<=8);assert.equal(prose.textContent,before);controller.dispose();dom.window.close();
});

test('runtime applies final style, layout, and custom palette without changing answer text',async()=>{
 const settings=createSettings();settings.update({mediaGallery:false,autoMeme:false,visualStyle:'developer-terminal',diyLayout:'split-screen',stylePalettes:{'developer-terminal':{primary:'#102030',secondary:'#204060',accent:'#40ff80'}}});
 const dom=new JSDOM('<!doctype html><head><style data-plugin-css="@deepseek-ai/dsh-client-ui-chat/AssistantMarkdown.module.css">'+fixture.assistantCSS+'</style></head><body><div data-chat-flow-kind="assistant-step">'+fixture.html+'</div></body>',{pretendToBeVisual:true});
 const doc=dom.window.document,prose=doc.querySelector('.'+fixture.classMap.markdown),before=prose.textContent,controller=installTypography(doc,settings,css);await tick();
 assert.equal(prose.textContent,before);assert.equal(prose.dataset.ecpVisualStyle,'developer-terminal');assert.equal(prose.dataset.ecpDiyLayout,'split-screen');assert.equal(prose.dataset.ecpCustomPalette,'true');
 assert.equal(prose.style.getPropertyValue('--ecp-final-primary'),'#102030');assert.equal(prose.style.getPropertyValue('--ecp-final-secondary'),'#204060');assert.equal(prose.style.getPropertyValue('--ecp-final-accent'),'#40ff80');
 settings.update({visualStyle:'vaporwave',diyLayout:'dialogue'});await tick();assert.equal(prose.dataset.ecpVisualStyle,'vaporwave');assert.equal(prose.dataset.ecpDiyLayout,'dialogue');assert.equal(prose.dataset.ecpCustomPalette,'false');
 controller.dispose();assert.equal(prose.hasAttribute('data-ecp-visual-style'),false);assert.equal(prose.style.getPropertyValue('--ecp-final-primary'),'');dom.window.close();
});
