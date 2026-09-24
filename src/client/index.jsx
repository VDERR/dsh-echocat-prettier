import React,{useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {createSettings,DEFAULTS,normalize} from '../shared/settings.js';
import {VISUAL_STYLES,STYLE_MAP,LAYOUT_PRESETS,LAYOUT_MAP,DEFAULT_STYLE_PALETTES,cleanHex,colorsFor} from '../shared/final-presets.js';
import {installTypography} from './controller.js';
import {statusLabel,diagnosticText} from './diagnostics.js';
import {VERSION} from '../version.js';
import contentCss from './content.css';
import finalCss from './final.css';
import controlsCss from './controls.css';
import finalControlsCss from './final-controls.css';
import logoUrl from '../../assets/echocat-logo.png';

export const name='dsh-echocat-prettier';
export const inject=['slots'];
const REPOSITORY_URL='https://github.com/VDERR/dsh-echocat-prettier';
const RELEASES_URL=REPOSITORY_URL+'/releases/latest';

function versionParts(value){return String(value??'').replace(/^v/i,'').split('.').map(part=>Number.parseInt(part,10)||0);}
function isNewerVersion(remote,local){
 const a=versionParts(remote),b=versionParts(local),length=Math.max(a.length,b.length);
 for(let index=0;index<length;index++){if((a[index]??0)!==(b[index]??0))return (a[index]??0)>(b[index]??0);}
 return false;
}

const groups={
 font:[['sans','本地黑体'],['serif','本地宋体'],['host','跟随 DSH']],size:[['host','跟随'],['medium','标准'],['large','大字']],
 density:[['compact','紧凑'],['comfortable','舒适'],['relaxed','宽松']],intensity:[['subtle','轻柔'],['balanced','适中'],['expressive','鲜明']],
 accent:[['teal','青绿'],['sky','雾蓝'],['indigo','靛紫'],['amber','暖金'],['rose','柔粉']],radius:[['compact','精致圆角'],['soft','柔和'],['round','大圆角']],
 shadow:[['flat','无阴影'],['soft','柔和层次'],['float','明显悬浮']],emojiDensity:[['off','关闭'],['light','轻量'],['lively','活泼']],emojiCount:[['2','2 个'],['4','4 个'],['6','6 个'],['8','8 个']],
 mediaLevel:[['off','无图片'],['light','少量'],['standard','标准'],['rich','丰富']],memeFrequency:[['off','关闭'],['light','克制'],['balanced','常规'],['lively','积极']],memeCount:[['1','1 张'],['2','2 张'],['3','3 张'],['4','4 张']],
 animatedMeme:[['still','保持静止'],['hover','经过播放'],['auto','自动播放']],motionStyle:[['still','完全静止'],['reveal','柔和显现'],['reading','阅读聚焦'],['progress','章节进度'],['liquid','液态流动']],
 contentWidth:[['compact','聚焦窄栏'],['standard','标准宽度'],['wide','尽量铺开']],surfaceOpacity:[['airy','清透'],['balanced','均衡'],['solid','厚实']],
 blurStrength:[['soft','轻磨砂'],['balanced','标准磨砂'],['heavy','重磨砂']],borderGlow:[['subtle','低调'],['crystal','晶莹'],['accent','强调色']],
 headingScale:[['calm','克制'],['balanced','清晰'],['strong','醒目']],memeSize:[['compact','小巧'],['standard','标准'],['large','大图']],
 elementMotion:[['none','关闭'],['hover','悬停抬升'],['border','边框呼吸'],['title','标题微光'],['cascade','依次入场'],['mixed','轻量组合']],
};

function Segment({label,field,value,onChange}){return <fieldset className="ecp-segment"><legend>{label}</legend><div>{groups[field].map(([id,text])=><button type="button" key={id} aria-pressed={value[field]===id} onClick={()=>onChange({[field]:id})}>{text}</button>)}</div></fieldset>;}
function Toggle({label,hint,field,value,onChange}){return <label className="ecp-toggle"><span><b>{label}</b>{hint&&<small>{hint}</small>}</span><input type="checkbox" checked={value[field]} onChange={event=>onChange({[field]:event.target.checked})}/><i aria-hidden="true"/></label>;}

function Preview({value}){
 const colors=colorsFor(value),style={'--ecp-final-primary':colors.primary,'--ecp-final-secondary':colors.secondary,'--ecp-final-accent':colors.accent};
 return <div className="ecp-preview ecp-final-preview" data-ecp-prose="true" data-ecp-rich="true" data-ecp-visual-style={value.visualStyle} data-ecp-diy-layout={value.diyLayout} data-ecp-glass-motion={value.glassMotion} data-ecp-motion={value.motion} data-ecp-motion-style={value.motionStyle} style={style}>
  <div className="ecp-preview-kicker">ECHOCAT · 实时预览</div>
  <p data-ecp-block="lead">准确的原始文字保持不变，插件只重组展示层次。{value.faceEmoji&&value.emojiDensity==='lively'&&<span className="ecp-preview-face">😊</span>}</p>
  <p data-ecp-title="true">✨ 一段更有设计感的回答</p>
  <ol data-ecp-block="steps"><li><b>重点内容</b><span>用结构和颜色建立清楚层级。</span></li><li><b>阅读节奏</b><span>让不同版块拥有明显变化。</span></li><li><b>准确性保护</b><span>不会改写 AI 原文。</span></li></ol>
 </div>;
}

function StyleCard({style,value,onChoose}){
 const colors=value.stylePalettes?.[style.id]??DEFAULT_STYLE_PALETTES[style.id];
 return <button type="button" className="ecp-final-style" aria-pressed={value.visualStyle===style.id} onClick={()=>onChoose(style.id)} style={{'--s1':colors.primary,'--s2':colors.secondary,'--s3':colors.accent}}>
  <i aria-hidden="true"/><span><b>{style.label}</b><small>{style.en}</small></span><em>{value.visualStyle===style.id?'当前':'预览'}</em>
 </button>;
}
function LayoutCard({layout,selected,onChoose}){return <button type="button" className="ecp-final-layout" aria-pressed={selected} onClick={()=>onChoose(layout.id)}><i data-layout={layout.id} aria-hidden="true"><b/><b/><b/><b/></i><span><b>{layout.label}</b><small>{layout.en}</small><em>{layout.summary}</em></span></button>;}
function PaletteEditor({value,onChange,onReset}){
 const style=STYLE_MAP[value.visualStyle],colors=colorsFor(value),custom=Object.hasOwn(value.stylePalettes??{},value.visualStyle);
 return <div className="ecp-final-palette" data-custom={custom}><div><b>本套独立配色</b><small>{style.label} · 切换风格不会串色</small></div>
  {([['primary','主色'],['secondary','辅助色'],['accent','强调色']]).map(([field,label])=><label key={field}><span>{label}</span><input type="color" aria-label={style.label+label} value={colors[field]} onChange={event=>onChange(field,event.target.value)}/><code>{colors[field].toUpperCase()}</code></label>)}
  <button type="button" disabled={!custom} onClick={onReset}>恢复本套默认</button>
 </div>;
}

export function apply(ctx){
 let storage;try{storage=window.localStorage;}catch{}
 const settings=createSettings(storage),controller=installTypography(document,settings,contentCss+'\n'+finalCss);
 const style=document.createElement('style');style.dataset.plugin=name;style.dataset.echocatPrettier='controls';style.dataset.ecpVersion=VERSION;style.textContent=controlsCss+'\n'+finalControlsCss;document.head.append(style);
 const dialogs=new Set();
 function SidebarControl({wide=false}={}){
  const saved=useSyncExternalStore(settings.subscribe,settings.get),state=useSyncExternalStore(controller.subscribe,controller.getSnapshot);
  const ref=useRef(null),[draft,setDraft]=useState(()=>({...saved})),[layoutOpen,setLayoutOpen]=useState(false),[updateState,setUpdateState]=useState({status:'idle',label:'检查更新',url:RELEASES_URL});
  useEffect(()=>{const dialog=ref.current;dialogs.add(dialog);return()=>{dialog?.close();dialogs.delete(dialog);};},[]);
  const change=patch=>setDraft(value=>normalize({...value,...patch}));
  const chooseStyle=id=>{const preset=STYLE_MAP[id];if(preset)setDraft(value=>normalize({...value,...preset.defaults,visualStyle:id}));};
  const chooseLayout=id=>{if(LAYOUT_MAP[id])change({diyLayout:id});};
  const updateColor=(field,raw)=>{const color=cleanHex(raw);if(!color)return;setDraft(value=>normalize({...value,stylePalettes:{...value.stylePalettes,[value.visualStyle]:{...colorsFor(value),[field]:color}}}));};
  const resetColors=()=>setDraft(value=>{const palettes={...value.stylePalettes};delete palettes[value.visualStyle];return normalize({...value,stylePalettes:palettes});});
  const open=()=>{setDraft({...settings.get()});setLayoutOpen(false);ref.current?.showModal();};
  const close=()=>ref.current?.close(),save=()=>{settings.update(draft);close();};
  const openExternal=url=>window.open(url,'_blank','noopener,noreferrer');
  const checkUpdate=async()=>{
   if(updateState.status==='checking')return;
   setUpdateState({status:'checking',label:'检查中…',url:RELEASES_URL});
   try{
    const response=await fetch('https://api.github.com/repos/VDERR/dsh-echocat-prettier/releases/latest',{headers:{Accept:'application/vnd.github+json'},credentials:'omit'});
    if(!response.ok)throw Error('github-'+response.status);
    const release=await response.json(),remote=String(release.tag_name??'').replace(/^v/i,'');
    if(isNewerVersion(remote,VERSION))setUpdateState({status:'available',label:'发现 '+remote,url:release.html_url||RELEASES_URL});
    else setUpdateState({status:'current',label:'已是最新版',url:release.html_url||RELEASES_URL});
   }catch{setUpdateState({status:'unavailable',label:'打开更新页',url:RELEASES_URL});}
  };
  return <div className="ecp-sidebar-control" data-wide={wide}>
   <button type="button" className="ecp-sidebar-open" data-state={state.state} title={'回复美化设置 · '+statusLabel(state)} onClick={open}><span className="ecp-aa">Aa</span>{wide&&<span>回复美化</span>}</button>
   <button type="button" className="ecp-sidebar-switch" role="switch" aria-checked={saved.enabled} title={saved.enabled?'关闭回复美化':'开启回复美化'} onClick={()=>settings.update({enabled:!saved.enabled})}><i/></button>
   <dialog ref={ref} className="ecp-dialog ecp-final-dialog" aria-label="EchoCat 回复美化设置" onCancel={close} onClick={event=>{if(event.target===ref.current)close();}}>
    <div className="ecp-settings" onClick={event=>event.stopPropagation()}>
     <header className="ecp-dialog-head">
      <div className="ecp-dialog-intro"><small>ECHOCAT PRETTIER / {VERSION}</small><h2>回复美化工作室</h2><p>15 套视觉风格 × 9 套排版 DIY；展示更丰富，AI 原始答案保持不变。</p></div>
      <div className="ecp-brand" aria-label="EchoCat"><img src={logoUrl} alt="EchoCat LOGO"/><b>ECHOCAT</b></div>
      <div className="ecp-dialog-actions"><button type="button" className="ecp-update" data-status={updateState.status} onClick={()=>updateState.status==='available'||updateState.status==='unavailable'?openExternal(updateState.url):checkUpdate()} aria-label="检查 EchoCat Prettier 更新"><span aria-hidden="true">↻</span>{updateState.label}</button><a className="ecp-github" href={REPOSITORY_URL} target="_blank" rel="noreferrer" aria-label="打开 EchoCat Prettier GitHub 仓库"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .7A11.5 11.5 0 0 0 8.36 23.1c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.28-5.27-5.68 0-1.25.45-2.28 1.18-3.08-.12-.3-.51-1.47.11-3.05 0 0 .96-.31 3.16 1.17A10.9 10.9 0 0 1 12 6.12c.98 0 1.94.13 2.86.39 2.2-1.48 3.16-1.17 3.16-1.17.62 1.58.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.08 0 4.42-2.7 5.38-5.28 5.67.42.36.79 1.07.79 2.16v3.24c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"/></svg><span>GitHub</span></a><button type="button" className="ecp-close" aria-label="关闭" onClick={close}>×</button></div>
     </header>
     <div className="ecp-accuracy"><span>✓</span><div><b>准确性保护模式</b><small>默认不向 AI 注入语气、emoji、Markdown 或配图提示；装饰在回答完成后由界面处理。</small></div></div>
     <div className="ecp-final-primary-actions"><button type="button" className="ecp-layout-trigger" aria-expanded={layoutOpen} onClick={()=>setLayoutOpen(value=>!value)}>▦ 排版 DIY <small>{LAYOUT_MAP[draft.diyLayout].label}</small></button><span>风格和排版独立组合，自动记忆</span></div>
     {layoutOpen&&<section className="ecp-layout-studio" aria-label="排版 DIY"><div className="ecp-final-section-title"><b>选择结构排版</b><small>标题、卡片、表格与留白会明显重组</small></div><div className="ecp-final-layout-grid">{LAYOUT_PRESETS.map(layout=><LayoutCard key={layout.id} layout={layout} selected={draft.diyLayout===layout.id} onChoose={chooseLayout}/>)}</div></section>}
     <div className="ecp-studio">
      <aside><Preview value={draft}/><div className="ecp-live-status" data-state={state.state}><i/>{statusLabel(state)}</div><p>点击“保存设置”后才应用到 DSH 回复。</p></aside>
      <section className="ecp-options">
       <div className="ecp-section-head"><div><small>总开关</small><h3>回复内容美化</h3></div><Toggle label="启用" field="enabled" value={draft} onChange={change}/></div>
       <div className="ecp-group"><div className="ecp-title"><span>01</span><div><h3>视觉风格</h3><p>每套都有独立材质、排版语言和动画。</p></div></div><div className="ecp-final-style-grid">{VISUAL_STYLES.map(item=><StyleCard key={item.id} style={item} value={draft} onChoose={chooseStyle}/>)}</div></div>
       <div className="ecp-group"><div className="ecp-title"><span>02</span><div><h3>自定义配色</h3><p>只修改当前风格，不影响其他预设。</p></div></div><PaletteEditor value={draft} onChange={updateColor} onReset={resetColors}/></div>
       <details className="ecp-final-advanced"><summary>高级自定义</summary><p>常用选项已经放进预设；只有需要细调时再展开。</p>
        <div className="ecp-group"><div className="ecp-title"><span>03</span><div><h3>文字与空间</h3></div></div><div className="ecp-two"><Segment label="字体" field="font" value={draft} onChange={change}/><Segment label="字号" field="size" value={draft} onChange={change}/><Segment label="段落密度" field="density" value={draft} onChange={change}/><Segment label="标题层级" field="headingScale" value={draft} onChange={change}/><Segment label="内容宽度" field="contentWidth" value={draft} onChange={change}/><Segment label="圆角" field="radius" value={draft} onChange={change}/></div></div>
        <div className="ecp-group"><div className="ecp-title"><span>04</span><div><h3>材质与动效</h3></div></div><div className="ecp-two"><Segment label="背景动效" field="motionStyle" value={draft} onChange={change}/><Segment label="元素动画" field="elementMotion" value={draft} onChange={change}/><Segment label="透明度" field="surfaceOpacity" value={draft} onChange={change}/><Segment label="磨砂" field="blurStrength" value={draft} onChange={change}/><Segment label="边框光泽" field="borderGlow" value={draft} onChange={change}/><Segment label="悬浮层次" field="shadow" value={draft} onChange={change}/></div><Toggle label="启用界面动效" hint="系统开启减少动态效果时会自动静止" field="glassMotion" value={draft} onChange={change}/><Toggle label="多层背景色" field="multiColor" value={draft} onChange={change}/><Toggle label="卡片与表格增强" field="rich" value={draft} onChange={change}/></div>
        <div className="ecp-group"><div className="ecp-title"><span>05</span><div><h3>emoji、图片与表情包</h3><p>数量按每条 AI 回复计算；候选不足时只显示实际可用数量。</p></div></div><Toggle label="章节导航胶囊" field="outline" value={draft} onChange={change}/><Toggle label="章节 emoji" hint="只使用普通 Unicode emoji，不修改原文字" field="visualEmoji" value={draft} onChange={change}/><Toggle label="情绪 emoji" hint="严肃主题自动隐藏" field="faceEmoji" value={draft} onChange={change}/><Segment label="每条回复 emoji 上限" field="emojiCount" value={draft} onChange={change}/><Toggle label="自动匹配网络表情包" hint="只发送表情包、短主题和情绪；严肃或隐私内容自动跳过" field="autoMeme" value={draft} onChange={change}/><Segment label="表情包出现频率" field="memeFrequency" value={draft} onChange={patch=>change({...patch,autoMeme:patch.memeFrequency!=='off'})}/><Segment label="每条回复表情包数量" field="memeCount" value={draft} onChange={change}/><Segment label="GIF 动图" field="animatedMeme" value={draft} onChange={change}/><Segment label="表情图尺寸" field="memeSize" value={draft} onChange={change}/><Segment label="公开照片" field="mediaLevel" value={draft} onChange={patch=>change({...patch,mediaGallery:patch.mediaLevel!=='off'})}/></div>
        <details className="ecp-diagnostic"><summary>兼容性诊断（不含聊天内容）</summary><textarea readOnly aria-label="最小诊断信息" value={diagnosticText(state)}/></details>
       </details>
      </section>
     </div>
     <footer className="ecp-footer"><button type="button" onClick={()=>setDraft(normalize(DEFAULTS))}>恢复默认</button><span>设置只保存在本机</span><button type="button" onClick={close}>取消</button><button type="button" className="ecp-save" onClick={save}>保存设置</button></footer>
    </div>
   </dialog>
  </div>;
 }
 const disposers=[ctx.slots.inject('sidebar.footer.action',()=>ctx.slots.register({name:'sidebar.footer.action',id:'echocat-prettier',order:80,label:'回复美化'},SidebarControl))];
 let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;for(const dialog of dialogs)dialog.close();for(const fn of disposers)fn?.();controller.dispose();style.remove();};
 ctx.effect(()=>dispose,'echocat-prettier:client');
 return Object.assign(dispose,{settings,status:controller.status});
}
