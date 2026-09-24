export const VISUAL_STYLES=Object.freeze([
 {id:'clear-space',label:'清透留白',en:'Clear Space',summary:'浅色留白、玻璃卡片与克制悬浮。',colors:{primary:'#eaf6f4',secondary:'#dfe8f4',accent:'#4a91a3'},defaults:{font:'sans',density:'relaxed',radius:'round',shadow:'float',accent:'sky'}},
 {id:'neumorphism',label:'新拟态',en:'Neumorphism',summary:'同色底与双向阴影形成可触摸浮雕。',colors:{primary:'#e0e5ec',secondary:'#f3f6fa',accent:'#7190a4'},defaults:{font:'sans',density:'comfortable',radius:'round',shadow:'float',accent:'sky'}},
 {id:'bento-grid',label:'便当网格',en:'Bento Grid',summary:'按信息重要度分格，卡片尺寸形成节奏。',colors:{primary:'#eaf1ef',secondary:'#f1cb91',accent:'#478c80'},defaults:{font:'sans',density:'comfortable',radius:'soft',shadow:'soft',accent:'teal'}},
 {id:'modern-gradient',label:'现代渐变',en:'Modern Gradient',summary:'深色渐变、玻璃高光与氛围光。',colors:{primary:'#3728a4',secondary:'#b032ba',accent:'#ff6f91'},defaults:{font:'sans',density:'comfortable',radius:'soft',shadow:'float',accent:'rose'}},
 {id:'geometric-bold',label:'几何粗体',en:'Geometric Bold',summary:'粗边框、原色块与硬朗错位投影。',colors:{primary:'#ffd400',secondary:'#1769e0',accent:'#ed1c24'},defaults:{font:'sans',density:'compact',radius:'compact',shadow:'flat',accent:'rose'}},
 {id:'card-stack',label:'卡片堆叠',en:'Card Stack',summary:'错位底卡制造层次，同时保持正文清楚。',colors:{primary:'#eef3f3',secondary:'#c5d2d9',accent:'#607d8b'},defaults:{font:'sans',density:'comfortable',radius:'soft',shadow:'float',accent:'sky'}},
 {id:'hero-fullscreen',label:'沉浸首屏',en:'Hero Fullscreen',summary:'开场成为深色主视觉，正文继续适合聊天。',colors:{primary:'#0e2e2c',secondary:'#2f7868',accent:'#eab676'},defaults:{font:'sans',density:'relaxed',radius:'round',shadow:'float',accent:'amber'}},
 {id:'vaporwave',label:'蒸汽波',en:'Vaporwave',summary:'霓虹色、透视网格与低频扫描线。',colors:{primary:'#b967ff',secondary:'#01cdfe',accent:'#ff71ce'},defaults:{font:'sans',density:'comfortable',radius:'soft',shadow:'float',accent:'indigo'}},
 {id:'launch-keynote',label:'发布会',en:'Launch Keynote',summary:'黑色舞台、巨大标题与蓝色聚光。',colors:{primary:'#050505',secondary:'#0a84ff',accent:'#f5f5f7'},defaults:{font:'sans',density:'relaxed',radius:'compact',shadow:'flat',accent:'sky'}},
 {id:'developer-terminal',label:'开发者终端',en:'Developer Terminal',summary:'命令行语言、荧光文本、代码流和状态栏。',colors:{primary:'#07110c',secondary:'#12311f',accent:'#4af626'},defaults:{font:'host',density:'compact',radius:'compact',shadow:'flat',accent:'teal'}},
 {id:'broadcast-glitch',label:'广播故障',en:'Broadcast Glitch',summary:'CRT 扫描、红青错位与可关闭的故障动画。',colors:{primary:'#0b0b0e',secondary:'#00e5d8',accent:'#ff2e4c'},defaults:{font:'sans',density:'compact',radius:'compact',shadow:'flat',accent:'rose'}},
 {id:'retro-vintage',label:'复古印刷',en:'Retro Vintage',summary:'纸张、油墨和衬线杂志排版。',colors:{primary:'#ead8be',secondary:'#87694f',accent:'#a84b31'},defaults:{font:'serif',density:'relaxed',radius:'compact',shadow:'soft',accent:'amber'}},
 {id:'pastel-goth',label:'柔彩哥特',en:'Pastel Goth',summary:'暗紫底与柔粉、薰衣草和青绿微光。',colors:{primary:'#24152e',secondary:'#7ec8c8',accent:'#d4a5e3'},defaults:{font:'sans',density:'comfortable',radius:'soft',shadow:'float',accent:'indigo'}},
 {id:'fluent-design',label:'流畅设计',en:'Fluent Design',summary:'亚克力材质、微软蓝与 Reveal 光感。',colors:{primary:'#e7f4fb',secondary:'#0078d4',accent:'#6ec7ff'},defaults:{font:'sans',density:'comfortable',radius:'soft',shadow:'float',accent:'sky'}},
 {id:'warm-organic',label:'自然有机',en:'Warm Organic',summary:'大地色、纸艺层次与柔和自然曲线。',colors:{primary:'#f3e6ca',secondary:'#68845f',accent:'#c7774e'},defaults:{font:'serif',density:'relaxed',radius:'round',shadow:'soft',accent:'teal'}},
]);

export const LAYOUT_PRESETS=Object.freeze([
 {id:'native',label:'跟随风格',en:'Style Native',summary:'保留当前风格的原生结构。'},
 {id:'magazine',label:'杂志封面',en:'Magazine Cover',summary:'巨幅标题、主次跨栏和编辑式留白。'},
 {id:'timeline',label:'垂直时间轴',en:'Timeline',summary:'单线串联，卡片左右交替推进。'},
 {id:'split-screen',label:'左右分屏',en:'Split Screen',summary:'导语在左，步骤与结论在右。'},
 {id:'staircase',label:'阶梯卡片',en:'Staircase',summary:'卡片逐级错位，形成向下推进的节奏。'},
 {id:'poster',label:'海报舞台',en:'Poster Stage',summary:'居中巨型标题、宽幅信息条和强主视觉。'},
 {id:'dashboard',label:'数据控制台',en:'Dashboard',summary:'三栏信息密度，重点模块跨栏。'},
 {id:'dialogue',label:'对话剧本',en:'Dialogue Script',summary:'左右气泡交替，像人物对话一样阅读。'},
 {id:'collage',label:'自由拼贴',en:'Editorial Collage',summary:'大小卡片、轻微旋转和不规则编排。'},
]);

export const STYLE_MAP=Object.freeze(Object.fromEntries(VISUAL_STYLES.map(style=>[style.id,style])));
export const LAYOUT_MAP=Object.freeze(Object.fromEntries(LAYOUT_PRESETS.map(layout=>[layout.id,layout])));
export const DEFAULT_STYLE_PALETTES=Object.freeze(Object.fromEntries(VISUAL_STYLES.map(style=>[style.id,Object.freeze({...style.colors})])));

export const cleanHex=value=>/^#[0-9a-f]{6}$/iu.test(String(value))?String(value).toLowerCase():null;
export function normalizeStylePalettes(input){
 const result={};if(!input||typeof input!=='object'||Array.isArray(input))return result;
 for(const [id,raw] of Object.entries(input)){
  if(!STYLE_MAP[id]||!raw||typeof raw!=='object'||Array.isArray(raw))continue;
  const palette={};for(const key of ['primary','secondary','accent']){const value=cleanHex(raw[key]);if(value)palette[key]=value;}
  if(Object.keys(palette).length)result[id]={...DEFAULT_STYLE_PALETTES[id],...palette};
 }
 return result;
}

export function colorsFor(settings){return settings.stylePalettes?.[settings.visualStyle]??DEFAULT_STYLE_PALETTES[settings.visualStyle]??DEFAULT_STYLE_PALETTES['clear-space'];}
