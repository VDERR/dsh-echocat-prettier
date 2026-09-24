import React,{useEffect,useMemo,useState,useSyncExternalStore} from 'react';
import {createRoot} from 'react-dom/client';
import fixture from '../tests/fixtures/host-release.json';
import memeFixture from '../tests/fixtures/host-meme.json';

const {apply}=window.__prettierRegistration.factory(id=>{
  if(id==='react')return React;
  throw new Error('Unexpected module '+id);
});

window.__ECHOCAT_MEME_PREVIEW__=true;
const svg=(emoji,title,accent)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d7f2ee"/><stop offset=".55" stop-color="#e5ecfb"/><stop offset="1" stop-color="#f5e6f0"/></linearGradient></defs><rect width="640" height="400" rx="36" fill="url(#g)"/><circle cx="198" cy="194" r="108" fill="#fff" fill-opacity=".78"/><text x="198" y="230" text-anchor="middle" font-size="108">${emoji}</text><text x="354" y="184" font-family="Microsoft YaHei,sans-serif" font-size="38" font-weight="700" fill="#294451">${title}</text><rect x="352" y="218" width="154" height="40" rx="20" fill="${accent}" fill-opacity=".34"/><text x="429" y="245" text-anchor="middle" font-family="Microsoft YaHei,sans-serif" font-size="18" fill="#34737f">主题 · 情绪</text></svg>`);
const memeOne=svg('😎','三角洲出发','#72c9bd'),memeTwo=svg('😊','三角洲思路','#d69fbf'),memeThree=svg('✨','三角洲重点','#8aa9df'),memeFour=svg('👌','三角洲推进','#ddb37a'),memeIrrelevant=svg('🐱','猫猫路过','#d8a7b1'),travelOne=svg('🏞️','四川出发','#72c9bd'),travelTwo=svg('🐼','四川路线','#d69fbf'),travelThree=svg('🍜','四川美食','#ddb37a');
const nativeFetch=window.fetch.bind(window);
window.fetch=(input,init)=>{
  const raw=typeof input==='string'?input:input.url;let pathname='';
  try{pathname=new URL(raw,location.href).pathname;}catch{}
  if(pathname.endsWith('/dsh-echocat-prettier/api/memes')){const query=new URL(raw,location.href).searchParams.get('q')||'';if(query.includes('四川旅游'))return Promise.resolve(Response.json({status:'ok',query:'表情包 四川旅游',items:[
    {imageUrl:travelOne,posterUrl:travelOne,sourceUrl:'https://image.baidu.com/',title:'四川旅游开心表情包',animated:false},
    {imageUrl:travelTwo,posterUrl:travelTwo,sourceUrl:'https://image.baidu.com/',title:'四川旅游路线梗图',animated:false},
    {imageUrl:travelThree,posterUrl:travelThree,sourceUrl:'https://image.baidu.com/',title:'四川旅游美食表情包',animated:false}
  ]}));return Promise.resolve(Response.json({status:'ok',query:'表情包 三角洲行动 得意',items:[
    {imageUrl:memeIrrelevant,posterUrl:memeIrrelevant,sourceUrl:'https://image.baidu.com/',title:'猫猫搞笑表情包',animated:false},
    {imageUrl:memeIrrelevant,posterUrl:memeIrrelevant,sourceUrl:'https://image.baidu.com/',title:'三角洲行动版本更新新闻',animated:false},
    {imageUrl:memeOne,posterUrl:memeOne,sourceUrl:'https://image.baidu.com/',title:'三角洲行动得意表情包',animated:false},
    {imageUrl:memeTwo,posterUrl:memeTwo,sourceUrl:'https://image.baidu.com/',title:'三角洲行动轻松表情包',animated:false},
    {imageUrl:memeThree,posterUrl:memeThree,sourceUrl:'https://image.baidu.com/',title:'三角洲行动重点表情包',animated:false},
    {imageUrl:memeFour,posterUrl:memeFour,sourceUrl:'https://image.baidu.com/',title:'三角洲行动推进表情包',animated:false}
  ]}));}
  return nativeFetch(input,init);
};

const stressFixture={...memeFixture,html:`<div class="Xpiw2q_root"><div class="Xpiw2q_body"><div class="${memeFixture.classMap.markdown}"><p>这是一段用于检验窄窗口与极端内容的长导语。它不会替换真实回答，只在网页预览中帮助检查超长文字、连续标点、英文单词 VeryLongUnbrokenContentForResponsiveLayoutAudit 和不同层级是否会越界。😊</p><p><strong>一个非常长但仍应完整换行并保持层级清楚的旅行规划标题：五天四晚多城市公共交通与天气变化综合安排</strong></p><ol><li><strong>先确定最重要的目标。</strong> 把必须完成的事项放在第一位，同时保留足够的缓冲时间。</li><li><strong>把复杂任务拆成小块。</strong> 每一块只解决一个问题，让阅读节奏保持清楚。</li><li><strong>检查窄窗口表现。</strong> 很长的说明应该自然换行，不能挤出卡片边界。</li><li><strong>检查数量增加后的布局。</strong> 第四张卡片不能和前面的卡片发生覆盖或不对称拥挤。</li><li><strong>第五张卡片保持完整。</strong> 五张卡片在宽屏时应形成两列加一个通栏，在窄屏时应全部单列。</li></ol><p><strong>宽表格滚动验收</strong></p><div class="${memeFixture.classMap.tableScroll}"><table><thead><tr><th>日期</th><th>上午安排</th><th>中午安排</th><th>下午安排</th><th>晚间安排</th><th>交通方式</th><th>预算范围</th><th>备注与备选</th></tr></thead><tbody><tr><td>D1</td><td>博物馆与城市步行</td><td>本地餐馆</td><td>旧城建筑路线</td><td>河岸夜景</td><td>地铁加步行</td><td>300—500 元</td><td>下雨时改为室内展览</td></tr><tr><td>D2</td><td>自然景区</td><td>景区简餐</td><td>山谷与观景台</td><td>返回市区休息</td><td>公交加接驳车</td><td>400—650 元</td><td>提前确认末班车时间</td></tr></tbody></table></div><p>收尾再用一段较长文字检查内容边界：无论窗口变窄、标题变长、卡片数量增加或表格列数变多，正文都应留在自己的容器内，版块之间保持呼吸感，表格只在自身区域横向滚动，页面本身不应出现横向溢出。</p></div></div></div>`};

const hostStyle=document.createElement('style');
hostStyle.dataset.pluginCss='@deepseek-ai/dsh-client-ui-chat/AssistantMarkdown.module.css';
hostStyle.textContent=fixture.assistantCSS;document.head.append(hostStyle);
const mdStyle=document.createElement('style');mdStyle.textContent=fixture.css;document.head.append(mdStyle);
let Controls=()=>null;
const runtime=apply({slots:{inject:(_,fn)=>fn(),register:(seat,C)=>{if(seat.name==='sidebar.footer.action')Controls=C;return()=>{};}},effect:fn=>fn()});
runtime.settings.reset();
runtime.settings.update({enabled:true,layout:'cards',density:'comfortable',radius:'round',shadow:'soft',motionStyle:'still',glassMotion:false,elementMotion:'none',headingScale:'strong',contentWidth:'wide',visualEmoji:true,faceEmoji:true,emojiDensity:'lively',emojiCount:'6',outline:true,autoMeme:true,memeFrequency:'lively',memeCount:'2',animatedMeme:'auto',memeSize:'standard',mediaGallery:false,mediaLevel:'off'});
const previewSheet=document.querySelector('[data-v23-preview]');if(previewSheet)document.head.append(previewSheet);
const v226Sheet=document.querySelector('[data-v226-preview]');if(v226Sheet)document.head.append(v226Sheet);
const v227Sheet=document.querySelector('[data-v227-preview]');if(v227Sheet)document.head.append(v227Sheet);
const v228Sheet=document.querySelector('[data-v228-preview]');if(v228Sheet)document.head.append(v228Sheet);

const triplet=(a,b,c)=>[['soft',a],['balanced',b],['bold',c]];
const styles=[
 {id:'clear-space',label:'清透留白',en:'Clear Space',group:'default',summary:'当前认可版：浅色、宽松、玻璃卡片与克制悬浮。',controls:{tone:triplet('雾白','青瓷','冰蓝'),shape:triplet('精致圆角','柔和圆角','大圆角'),depth:triplet('轻悬浮','柔和层次','明显悬浮'),signature:triplet('无流光','柔光掠过','水光呼吸')}},
 {id:'neumorphism',label:'新拟态',en:'Neumorphism',group:'required',summary:'同色底与双向阴影，触感柔和。',controls:{tone:triplet('冷灰','雾蓝','暖米'),shape:triplet('小圆角','标准圆角','胶囊圆角'),depth:triplet('浅浮雕','标准浮雕','深浮雕'),signature:triplet('静止','按压反馈','阴影呼吸')}},
 {id:'bento-grid',label:'便当网格',en:'Bento Grid',group:'required',summary:'信息按重要度分格，尺寸有节奏。',controls:{tone:triplet('灰白','海盐','薄荷'),shape:triplet('利落','柔和','饱满'),depth:triplet('平面','分层','悬浮'),signature:triplet('静止','顺序入场','格子聚焦')}},
 {id:'modern-gradient',label:'现代渐变',en:'Modern Gradient',group:'required',summary:'深色渐变、玻璃高光与氛围光。',controls:{tone:triplet('蓝紫','紫粉','日落'),shape:triplet('精致','流线','圆润'),depth:triplet('轻玻璃','标准玻璃','深玻璃'),signature:triplet('静止','光晕漂移','渐变流动')}},
 {id:'geometric-bold',label:'几何粗体',en:'Geometric Bold',group:'required',summary:'粗边框、原色块与明确的视觉冲击。',controls:{tone:triplet('红蓝','蓝黄','四色'),shape:triplet('直角','切角','圆方'),depth:triplet('平面','硬投影','错位层'),signature:triplet('静止','形状弹入','边框跳色')}},
 {id:'card-stack',label:'卡片堆叠',en:'Card Stack',group:'required',summary:'错位底卡制造层次，不遮挡正文。',controls:{tone:triplet('云灰','暖杏','冷蓝'),shape:triplet('窄圆角','标准圆角','大圆角'),depth:triplet('双层','三层','四层'),signature:triplet('静止','展开入场','轻微错位')}},
 {id:'hero-fullscreen',label:'沉浸首屏',en:'Hero Fullscreen',group:'required',summary:'把开场做成首屏主视觉，正文仍适合聊天。',controls:{tone:triplet('暮色','森林','海湾'),shape:triplet('直角画幅','圆角画幅','电影画幅'),depth:triplet('轻遮罩','标准遮罩','深遮罩'),signature:triplet('静止','文字揭示','镜头推近')}},
 {id:'vaporwave',label:'蒸汽波',en:'Vaporwave',group:'required',summary:'霓虹色、透视网格与低频扫描线。',controls:{tone:triplet('粉蓝','紫青','霓虹全彩'),shape:triplet('硬边','圆角','未来胶囊'),depth:triplet('轻霓虹','标准霓虹','强霓虹'),signature:triplet('静止','网格漂移','霓虹脉冲')}},
 {id:'launch-keynote',label:'发布会',en:'Launch Keynote',group:'required',summary:'黑色舞台、巨大标题与苹果蓝强调。',controls:{tone:triplet('深黑','蓝黑','银黑'),shape:triplet('利落','柔和','大留白'),depth:triplet('纯舞台','柔光舞台','聚光舞台'),signature:triplet('静止','段落揭示','聚光掠过')}},
 {id:'developer-terminal',label:'开发者终端',en:'Developer Terminal',group:'required',summary:'命令行语言、荧光文本与状态栏。',controls:{tone:triplet('经典绿','青紫','琥珀'),shape:triplet('直角','微圆角','窗口圆角'),depth:triplet('纯终端','面板终端','发光终端'),signature:triplet('静止','光标闪烁','逐行显现')}},
 {id:'broadcast-glitch',label:'广播故障',en:'Broadcast Glitch',group:'random',summary:'CRT 扫描、红青错位与新闻播报感。',controls:{tone:triplet('红青','黄青','警报红'),shape:triplet('直角','屏幕圆角','播报条'),depth:triplet('轻噪点','CRT','强信号'),signature:triplet('静止','扫描线','标题故障')}},
 {id:'retro-vintage',label:'复古印刷',en:'Retro Vintage',group:'random',summary:'纸张、油墨与杂志式衬线排版。',controls:{tone:triplet('旧报纸','暖牛皮','墨绿棕'),shape:triplet('直角','邮票边','柔圆角'),depth:triplet('平纸','纸张层次','厚卡纸'),signature:triplet('静止','印章入场','纸纹浮动')}},
 {id:'pastel-goth',label:'柔彩哥特',en:'Pastel Goth',group:'random',summary:'暗紫底与柔粉、薰衣草和青绿微光。',controls:{tone:triplet('薰衣草','粉青','暮紫'),shape:triplet('尖角','柔圆','胶囊'),depth:triplet('薄雾','月光','深夜'),signature:triplet('静止','星光出现','月晕呼吸')}},
 {id:'fluent-design',label:'流畅设计',en:'Fluent Design',group:'random',summary:'亚克力材质、微软蓝与 Reveal 光感。',controls:{tone:triplet('微软蓝','湖蓝','蓝紫'),shape:triplet('小圆角','标准圆角','大圆角'),depth:triplet('轻亚克力','标准亚克力','深亚克力'),signature:triplet('静止','Reveal 悬停','柔光移动')}},
 {id:'warm-organic',label:'自然有机',en:'Warm Organic',group:'random',summary:'大地色、手作纸纹、叶片曲线与自然生长感。',controls:{tone:triplet('苔藓','陶土','麦穗'),shape:triplet('岩石圆角','叶片切角','手作胶囊'),depth:triplet('亚麻平面','纸艺层次','浮雕拼贴'),signature:triplet('静止','叶影摆动','生长展开')}}
];
const STYLE_MAP=Object.fromEntries(styles.map(x=>[x.id,x]));
const DEFAULT_PALETTES={
 'clear-space':{primary:'#eaf6f4',secondary:'#dfe8f4',accent:'#4a91a3'},
 neumorphism:{primary:'#e0e5ec',secondary:'#f3f6fa',accent:'#7190a4'},
 'bento-grid':{primary:'#eaf1ef',secondary:'#f1cb91',accent:'#478c80'},
 'modern-gradient':{primary:'#3728a4',secondary:'#b032ba',accent:'#ff6f91'},
 'geometric-bold':{primary:'#ffd400',secondary:'#1769e0',accent:'#ed1c24'},
 'card-stack':{primary:'#eef3f3',secondary:'#c5d2d9',accent:'#607d8b'},
 'hero-fullscreen':{primary:'#0e2e2c',secondary:'#2f7868',accent:'#eab676'},
 vaporwave:{primary:'#b967ff',secondary:'#01cdfe',accent:'#ff71ce'},
 'launch-keynote':{primary:'#050505',secondary:'#0a84ff',accent:'#f5f5f7'},
 'developer-terminal':{primary:'#07110c',secondary:'#12311f',accent:'#4af626'},
 'broadcast-glitch':{primary:'#0b0b0e',secondary:'#00e5d8',accent:'#ff2e4c'},
 'retro-vintage':{primary:'#ead8be',secondary:'#87694f',accent:'#a84b31'},
 'pastel-goth':{primary:'#24152e',secondary:'#7ec8c8',accent:'#d4a5e3'},
 'fluent-design':{primary:'#e7f4fb',secondary:'#0078d4',accent:'#6ec7ff'},
 'warm-organic':{primary:'#f3e6ca',secondary:'#68845f',accent:'#c7774e'}
};
const groups=[['default','默认方案'],['required','指定 9 套'],['random','随机精选 5 套']];
const commonControls={
 density:{label:'内容密度',options:[['compact','紧凑'],['standard','标准'],['spacious','宽松']]},
 heading:{label:'标题层级',options:[['calm','克制'],['clear','清晰'],['striking','醒目']]},
 media:{label:'图片与 emoji',options:[['off','纯文字'],['balanced','适量'],['rich','丰富']]},
 motion:{label:'动效强度',options:[['still','静止'],['subtle','克制'],['clear','明显']]}
};
const layouts=[
 {id:'native',label:'跟随风格',en:'Style Native',summary:'保留当前风格原生结构。'},
 {id:'magazine',label:'杂志封面',en:'Magazine Cover',summary:'巨幅标题、主次跨栏和编辑式留白。'},
 {id:'timeline',label:'垂直时间轴',en:'Timeline',summary:'单线串联，卡片左右交替推进。'},
 {id:'split-screen',label:'左右分屏',en:'Split Screen',summary:'导语与结论在左，步骤与表格在右。'},
 {id:'staircase',label:'阶梯卡片',en:'Staircase',summary:'卡片逐级错位，形成向下推进的节奏。'},
 {id:'poster',label:'海报舞台',en:'Poster Stage',summary:'居中大标题、宽幅信息条和强主视觉。'},
 {id:'dashboard',label:'数据控制台',en:'Dashboard',summary:'三栏信息密度，重点模块跨栏。'},
 {id:'dialogue',label:'对话剧本',en:'Dialogue Script',summary:'左右气泡交替，像人物对话一样阅读。'},
 {id:'collage',label:'自由拼贴',en:'Editorial Collage',summary:'大小卡片、轻微旋转和不规则编排。'}
];
const LAYOUT_MAP=Object.fromEntries(layouts.map(x=>[x.id,x]));
const initialCommon={density:'spacious',heading:'striking',media:'rich',motion:'clear'};
const initialStyle={tone:'balanced',shape:'balanced',depth:'balanced',signature:'balanced'};
const storageKey='echocat-prettier:preview:v2.3.4',previousStorageKey='echocat-prettier:preview:v2.3.3';
const loadState=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||localStorage.getItem(previousStorageKey)||'{}')}catch{return{}}};

function Segmented({name,value,options,onChange,test}){
 return <fieldset className="control-card" data-control={test||name}><legend>{name}</legend><div>{options.map(([id,label])=><button key={id} aria-pressed={value===id} data-value={id} onClick={()=>onChange(id)}>{label}</button>)}</div></fieldset>;
}

function PaletteEditor({styleName,palette,custom,onChange,onReset}){
 const fields=[['primary','主色'],['secondary','辅助色'],['accent','强调色']];
 return <div className="palette-editor" data-custom={custom?'true':'false'}>
  <div className="palette-heading"><div><b>自定义配色</b><span>{styleName}独立保存，切换风格不会串色</span></div><button type="button" onClick={onReset} disabled={!custom}>恢复本套默认</button></div>
  <div className="palette-fields">{fields.map(([field,label])=><label key={field}><span>{label}</span><span className="color-control"><input type="color" aria-label={styleName+label} value={palette[field]} onChange={e=>onChange(field,e.target.value)}/><code>{palette[field].toUpperCase()}</code></span></label>)}</div>
  <div className="palette-ribbon" aria-hidden="true"><i style={{background:palette.primary}}/><i style={{background:palette.secondary}}/><i style={{background:palette.accent}}/></div>
 </div>;
}

const contrastInk=hex=>{const rgb=(hex.match(/[a-f\d]{2}/gi)||['ff','ff','ff']).map(x=>parseInt(x,16)/255);const linear=rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722>.42?'#17242a':'#f8fbff'};

function App(){
 const pluginState=useSyncExternalStore(runtime.settings.subscribe,runtime.settings.get);
 const saved=useMemo(loadState,[]);
 const [styleId,setStyleId]=useState(STYLE_MAP[saved.styleId]?saved.styleId:'clear-space');
 const [common,setCommon]=useState({...initialCommon,...saved.common});
 const [overrides,setOverrides]=useState(saved.overrides||{});
 const [palettes,setPalettes]=useState(saved.palettes||{});
 const [layoutId,setLayoutId]=useState(LAYOUT_MAP[saved.layoutId]?saved.layoutId:'native');
 const [diyOpen,setDiyOpen]=useState(false);
 const [narrow,setNarrow]=useState(false);
 const [stress,setStress]=useState(false);
 const [dark,setDark]=useState(false);
 const [replay,setReplay]=useState(0);
 const currentStyle=STYLE_MAP[styleId];
 const currentLayout=LAYOUT_MAP[layoutId];
 const custom={...initialStyle,...overrides[styleId]};
 const palette={...DEFAULT_PALETTES[styleId],...palettes[styleId]};
 const hasCustomPalette=Boolean(palettes[styleId]);
 const currentFixture=stress?stressFixture:memeFixture;
 const updateCommon=(field,value)=>setCommon(x=>({...x,[field]:value}));
 const updateCustom=(field,value)=>setOverrides(x=>({...x,[styleId]:{...initialStyle,...x[styleId],[field]:value}}));
 const updatePalette=(field,value)=>setPalettes(x=>({...x,[styleId]:{...DEFAULT_PALETTES[styleId],...x[styleId],[field]:value}}));
 const resetPalette=()=>setPalettes(x=>{const next={...x};delete next[styleId];return next;});
 const selectStyle=id=>{if(STYLE_MAP[id]){setStyleId(id);setReplay(x=>x+1);}};
 const selectLayout=id=>{if(LAYOUT_MAP[id]){setLayoutId(id);setReplay(x=>x+1);}};
 const customLabel=field=>currentStyle.controls[field].find(([id])=>id===custom[field])?.[1]||custom[field];
 useEffect(()=>{localStorage.setItem(storageKey,JSON.stringify({styleId,common,overrides,palettes,layoutId}));},[styleId,common,overrides,palettes,layoutId]);
 useEffect(()=>{runtime.settings.update({headingScale:common.heading==='striking'?'strong':common.heading==='clear'?'balanced':'calm',density:common.density==='compact'?'compact':common.density==='spacious'?'relaxed':'comfortable',visualEmoji:common.media!=='off',faceEmoji:common.media!=='off',emojiDensity:common.media==='rich'?'lively':'balanced',emojiCount:common.media==='rich'?'8':'4',autoMeme:common.media==='rich',memeFrequency:common.media==='rich'?'lively':'off',memeCount:common.media==='rich'?'3':'1',memeSize:common.media==='rich'?'large':'standard',motionStyle:'still',glassMotion:false,elementMotion:'none'});},[common]);
 useEffect(()=>{document.body.toggleAttribute('data-ds-dark-theme',dark);},[dark]);
 void pluginState;
 window.preview={
   settings:runtime.settings,status:runtime.status,dispose:runtime,
    setStyle:selectStyle,listStyles:()=>styles.map(x=>x.id),getStyle:()=>styleId,replay:()=>setReplay(x=>x+1),
    setLayout:selectLayout,listLayouts:()=>layouts.map(x=>x.id),getLayout:()=>layoutId,setDiyOpen,
   setNarrow,setStress,setTheme:setDark,
   setCommon:(field,value)=>updateCommon(field,value),
    setStyleControl:(field,value)=>updateCustom(field,value),
    setPalette:(field,value)=>updatePalette(field,value),resetPalette,getPalette:()=>palette,
    getState:()=>({styleId,common,custom,overrides,palette,palettes,layoutId})
 };
 return <main className={'v23-page'+(narrow?' is-narrow':'')+(stress?' is-stress':'')}>
   <header className="topbar">
<div><span className="eyebrow">ECHOCAT PRETTIER · V2.3.4</span><h1>风格 × 排版双层预设</h1><p>15 套视觉风格与 9 套结构排版可自由组合；长回复自动进入性能保护，不改 AI 原文、顺序和结论。</p></div>
      <div className="quick-actions"><button className="layout-diy-trigger" aria-pressed={diyOpen} id="layout-diy" onClick={()=>setDiyOpen(x=>!x)}>▦ 排版 DIY</button><button aria-pressed={stress} id="stress" onClick={()=>setStress(x=>!x)}>{stress?'普通内容':'长文验收'}</button><button aria-pressed={narrow} id="width" onClick={()=>setNarrow(x=>!x)}>{narrow?'恢复宽屏':'窄栏验收'}</button><button aria-pressed={dark} id="theme" onClick={()=>setDark(x=>!x)}>{dark?'浅色界面':'深色界面'}</button></div>
   </header>
   <section className="preset-panel" aria-label="风格预设">
     <div className="panel-heading"><div><b>选择整套风格</b><span>1 个默认 + 9 个指定 + 5 个精选</span></div><strong>15 套</strong></div>
     {groups.map(([gid,title])=><div className="preset-group" key={gid}><h2>{title}</h2><div className="preset-grid">{styles.filter(x=>x.group===gid).map(style=><button key={style.id} id={'preset-'+style.id} className="preset-tile" aria-pressed={styleId===style.id} onClick={()=>selectStyle(style.id)}><i data-swatch={style.id}/><span><b>{style.label}</b><small>{style.en}</small></span><em>{styleId===style.id?'当前':'预览'}</em></button>)}</div></div>)}
    </section>
    <section className="layout-diy-panel" aria-label="排版 DIY" hidden={!diyOpen}>
      <div className="panel-heading"><div><b>排版 DIY</b><span>排版与风格相互独立；选择后立即重组标题、卡片、表格与留白</span></div><strong>{currentLayout.label}</strong></div>
      <div className="layout-grid">{layouts.map(layout=><button key={layout.id} id={'layout-'+layout.id} className="layout-tile" data-layout={layout.id} aria-pressed={layoutId===layout.id} onClick={()=>selectLayout(layout.id)}><i aria-hidden="true"><b/><b/><b/><b/></i><span><b>{layout.label}</b><small>{layout.en}</small><em>{layout.summary}</em></span></button>)}</div>
    </section>
   <section className="control-panel" aria-label="当前风格设置">
     <div className="panel-heading"><div><b>{currentStyle.label} · 自定义</b><span>{currentStyle.summary}</span></div><span className="saved-badge">自动记忆</span></div>
     <div className="control-section"><h2>每套共用</h2><div className="control-grid common-grid">{Object.entries(commonControls).map(([field,item])=><Segmented key={field} name={item.label} value={common[field]} options={item.options} test={'common-'+field} onChange={v=>updateCommon(field,v)}/>)}</div></div>
      <div className="control-section style-controls"><h2>{currentStyle.label}专属</h2><div className="control-grid">{Object.entries(currentStyle.controls).map(([field,options],index)=><Segmented key={field} name={['配色倾向','形状语言','材质层次','标志动效'][index]} value={custom[field]} options={options} test={'style-'+field} onChange={v=>updateCustom(field,v)}/>)}</div></div>
      <div className="control-section palette-section"><h2>本套颜色</h2><PaletteEditor styleName={currentStyle.label} palette={palette} custom={hasCustomPalette} onChange={updatePalette} onReset={resetPalette}/></div>
     <div className="applied-state" aria-live="polite"><div><b>当前已应用</b><span>{customLabel('tone')} · {customLabel('shape')} · {customLabel('depth')} · {customLabel('signature')}</span></div><button id="replay-animation" onClick={()=>setReplay(x=>x+1)}>↻ 重播风格动画</button></div>
   </section>
   <section className="compare-grid" aria-label="美化前后对照">
     <article className="compare-cell before-cell"><div className="compare-caption"><b>关闭美化</b><span>宿主原始样式</span></div><div className="message before" id="before"><div dangerouslySetInnerHTML={{__html:currentFixture.html}}/></div></article>
<article className="compare-cell after-cell"><div className="compare-caption"><b>开启美化 · {currentStyle.label}</b><span>{currentLayout.label} · {hasCustomPalette?'自定义配色':'风格默认色'} · {common.heading==='striking'?'醒目标题':'自定义标题'}</span></div><div key={styleId+'-'+layoutId+'-'+replay} className="message after v23-stage" id="after" data-v233-version="2.3.3" data-v228-layout={layoutId} data-v227-custom-palette={hasCustomPalette?'true':'false'} data-v23-style={styleId} data-v23-density={common.density} data-v23-heading={common.heading} data-v23-media={common.media} data-v23-motion={common.motion} data-v23-tone={custom.tone} data-v23-shape={custom.shape} data-v23-depth={custom.depth} data-v23-signature={custom.signature} style={{'--v227-primary':palette.primary,'--v227-secondary':palette.secondary,'--v227-accent':palette.accent,'--v227-ink':contrastInk(palette.primary)}}><div id="after-row" data-chat-flow-kind="assistant-step" dangerouslySetInnerHTML={{__html:currentFixture.html}}/></div></article>
   </section>
   <div className="preview-sidebar-demo"><span>DSH 左侧栏底部</span><Controls wide/></div>
<footer>V2.3.4 网页版离线验收 · EchoCat 品牌 × GitHub 更新入口 × 长回复性能保护 · 当前未安装到 DSH</footer>
 </main>;
}

createRoot(document.getElementById('app')).render(<App/>);
