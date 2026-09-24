import {STYLE_MAP,LAYOUT_MAP,normalizeStylePalettes} from './final-presets.js';

export const PRESETS=Object.freeze({
 deepOcean:{label:'深海银蓝',description:'深海蓝黑、银灰玻璃与冰蓝高光，克制而有层次',layout:'magazine',palette:'deepOcean',glassMode:'liquid',motionIntensity:'visible',font:'sans',density:'comfortable',accent:'sky',intensity:'expressive',size:'medium',radius:'soft',shadow:'float'},
 moonPearl:{label:'月光珍珠',description:'珍珠白、雾银与淡冰蓝，明亮通透但不过分甜腻',layout:'magazine',palette:'moonPearl',glassMode:'liquid',motionIntensity:'gentle',font:'sans',density:'comfortable',accent:'sky',intensity:'balanced',size:'medium',radius:'soft',shadow:'float'},
 obsidianAmber:{label:'黑金琥珀',description:'石墨黑、暗金与暖琥珀，适合报告和严肃内容',layout:'magazine',palette:'obsidianAmber',glassMode:'liquid',motionIntensity:'visible',font:'serif',density:'comfortable',accent:'amber',intensity:'balanced',size:'medium',radius:'soft',shadow:'float'},
 liquid:{label:'液态银蓝',description:'流动银蓝光晕与透明玻璃层，现代而有生命力',layout:'cards',palette:'liquid',glassMode:'liquid',motionStyle:'liquid',font:'sans',density:'comfortable',accent:'sky',intensity:'expressive',size:'medium',radius:'round',shadow:'float'},
 nature:{label:'自然杂志',description:'暖白、薄荷绿与雾蓝，适合旅行和日常知识',layout:'magazine',palette:'nature',font:'sans',density:'comfortable',accent:'teal',intensity:'balanced',size:'medium',radius:'soft',shadow:'soft'},
 healing:{label:'森系治愈',description:'森林绿、晨雾与暖阳，柔和自然',layout:'magazine',palette:'healing',font:'sans',density:'relaxed',accent:'teal',intensity:'balanced',size:'medium',radius:'soft',shadow:'soft'},
 aurora:{label:'极光玻璃',description:'冰蓝、青绿与淡紫，现代而通透',layout:'cards',palette:'aurora',font:'sans',density:'comfortable',accent:'indigo',intensity:'expressive',size:'medium',radius:'round',shadow:'float'},
 cream:{label:'奶油手账',description:'奶油黄、蜜桃粉与鼠尾草绿，更亲切',layout:'magazine',palette:'cream',font:'sans',density:'relaxed',accent:'amber',intensity:'balanced',size:'medium',radius:'soft',shadow:'soft'},
 editorial:{label:'高级杂志',description:'象牙白、墨黑与酒红，突出大标题和照片',layout:'magazine',palette:'editorial',font:'serif',density:'comfortable',accent:'rose',intensity:'balanced',size:'medium',radius:'compact',shadow:'soft'},
 celebration:{label:'节日庆祝',description:'暖红、金色和彩纸粉，适合成果与祝贺',layout:'cards',palette:'celebration',font:'sans',density:'comfortable',accent:'rose',intensity:'expressive',size:'medium',radius:'soft',shadow:'float'},
 gallery:{label:'深夜画廊',description:'深蓝、墨绿与暗金，自动适配深色阅读',layout:'cards',palette:'gallery',font:'sans',density:'comfortable',accent:'indigo',intensity:'expressive',size:'medium',radius:'soft',shadow:'float'},
 paper:{label:'书页雅集',description:'米白、暗红与纸张层次，标题使用宋体',layout:'paper',palette:'paper',font:'serif',density:'relaxed',accent:'amber',intensity:'subtle',size:'medium',radius:'compact',shadow:'flat'},
 minimal:{label:'清透留白',description:'宽松悬浮卡片、大圆角、厚实重磨砂与稳定液态背景',layout:'cards',palette:'minimal',glassMode:'liquid',motionStyle:'liquid',motionIntensity:'gentle',font:'sans',density:'relaxed',accent:'sky',intensity:'balanced',size:'medium',radius:'round',shadow:'float',animatedMeme:'auto',mediaGallery:false,mediaLevel:'off',contentWidth:'wide',surfaceOpacity:'solid',blurStrength:'heavy',borderGlow:'subtle',headingScale:'strong',memeSize:'standard',memeFeedback:false,elementMotion:'hover'},
});

export const VISIBLE_PRESET_IDS=Object.freeze(['minimal','moonPearl','nature','cream','deepOcean','obsidianAmber']);
export const DEFAULTS=Object.freeze({enabled:true,rich:true,multiColor:true,visualEmoji:true,faceEmoji:true,outline:true,magazineFlow:true,mediaGallery:false,autoMeme:true,memeFeedback:false,motion:true,glassMotion:true,glassMode:'liquid',motionStyle:'liquid',motionIntensity:'gentle',imageCount:'3',mediaLevel:'off',memeFrequency:'lively',memeCount:'2',animatedMeme:'auto',emojiDensity:'lively',emojiCount:'6',contentWidth:'standard',surfaceOpacity:'balanced',blurStrength:'heavy',borderGlow:'crystal',headingScale:'balanced',memeSize:'standard',preset:'minimal',visualStyle:'clear-space',diyLayout:'native',stylePalettes:Object.freeze({}),...PRESETS.minimal});
export const STORAGE_KEY='echocat-prettier:reading:v24';
const LEGACY_KEYS=Object.freeze(Array.from({length:23},(_,index)=>`echocat-prettier:reading:v${23-index}`));
const presetAlias={cards:'nature',reading:'minimal',paper:'paper',calm:'minimal',focus:'minimal'};
const allowed={
 layout:['reading','cards','magazine','paper'],palette:['deepOcean','moonPearl','obsidianAmber','liquid','nature','healing','aurora','cream','editorial','celebration','gallery','paper','minimal'],
 font:['sans','serif','host'],density:['compact','comfortable','relaxed'],accent:['teal','amber','indigo','rose','sky'],
 intensity:['subtle','balanced','expressive'],size:['host','medium','large'],radius:['compact','soft','round'],shadow:['flat','soft','float'],
 imageCount:['1','2','3'],mediaLevel:['off','light','standard','rich'],memeFrequency:['off','light','balanced','lively'],memeCount:['1','2','3','4'],animatedMeme:['still','hover','auto'],glassMode:['static','frost','liquid','aurora'],motionStyle:['still','reveal','reading','progress','breath','focus','liquid'],motionIntensity:['gentle','visible','immersive'],emojiDensity:['off','light','lively'],emojiCount:['2','4','6','8'],
 contentWidth:['compact','standard','wide'],surfaceOpacity:['airy','balanced','solid'],blurStrength:['soft','balanced','heavy'],borderGlow:['subtle','crystal','accent'],headingScale:['calm','balanced','strong'],memeSize:['compact','standard','large'],elementMotion:['none','hover','border','title','cascade','mixed'],
 visualStyle:Object.keys(STYLE_MAP),diyLayout:Object.keys(LAYOUT_MAP),
};
const booleans=['enabled','rich','multiColor','visualEmoji','faceEmoji','outline','magazineFlow','mediaGallery','autoMeme','memeFeedback','motion','glassMotion'];

export function normalize(input){
 const x=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const requested=presetAlias[x.preset]??x.preset;
 const preset=Object.hasOwn(PRESETS,requested)?requested:'minimal';
 const out={...DEFAULTS,...PRESETS[preset],preset};delete out.label;delete out.description;
 for(const key of booleans)if(typeof x[key]==='boolean')out[key]=x[key];
 for(const [key,values]of Object.entries(allowed))if(values.includes(String(x[key])))out[key]=String(x[key]);
 out.stylePalettes=normalizeStylePalettes(x.stylePalettes);
 return out;
}

function migrateLegacy(old){
 const source=old&&typeof old==='object'&&!Array.isArray(old)?old:{};
 const mediaLevel=source.mediaLevel??(source.mediaGallery===false?'off':source.imageCount==='1'?'light':source.imageCount==='2'?'standard':'rich');
 return normalize({...source,mediaLevel,preset:presetAlias[source.preset]??source.preset??'minimal',size:source.size??'host'});
}
export const migrate=migrateLegacy;

function readFirstLegacy(storage){
 for(const key of LEGACY_KEYS){
  const raw=storage?.getItem(key);if(raw===null||raw===undefined)continue;
  const parsed=JSON.parse(raw);return key.endsWith(':v22')?normalize(parsed):migrateLegacy(parsed);
 }
 return normalize(null);
}

export function createSettings(storage){
 let current;
 try{const saved=storage?.getItem(STORAGE_KEY);current=saved!==null&&saved!==undefined?normalize(JSON.parse(saved)):readFirstLegacy(storage);}catch{current=normalize(null);}
 const listeners=new Set(),publish=()=>{for(const fn of listeners)fn();};
 const persist=()=>{try{storage?.setItem(STORAGE_KEY,JSON.stringify(current));}catch{}};
 return {get:()=>current,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},
  update(patch){current=normalize({...current,...patch});persist();publish();},
  preset(id){if(Object.hasOwn(PRESETS,id))this.update({...PRESETS[id],preset:id});},
  reset(){current=normalize(DEFAULTS);persist();publish();}};
}
