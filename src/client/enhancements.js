const directHeadings=prose=>[...prose.querySelectorAll(':scope > h1,:scope > h2,:scope > h3,:scope > [data-ecp-title]')].filter(x=>x.textContent.trim()).slice(0,6);
function button(doc,text,className){const el=doc.createElement('button');el.type='button';el.className=className;el.textContent=text;return el;}
export function createEnhancementManager(doc,settings){
 const records=new Map();
 function clear(prose){const record=records.get(prose);for(const node of record?.nodes??[])node.remove();records.delete(prose);}
 function sync(prose){
  const value=settings.get();if(!value.enabled){clear(prose);return;}
  const headings=directHeadings(prose),signature=JSON.stringify([value.outline,value.elementMotion,value.palette,value.glassMode,value.glassMotion,value.motionStyle,value.motionIntensity,value.shadow,value.motion,...headings.map(x=>x.textContent.trim())]);
  if(records.get(prose)?.signature===signature)return;clear(prose);const nodes=[];
  if(value.outline&&headings.length>=2){
   const top=doc.createElement('nav');top.className='ecp-outline';top.dataset.ecpOutline='true';top.dataset.ecpPalette=value.palette;top.dataset.ecpGlass=value.glassMode;top.dataset.ecpGlassMotion=String(value.glassMotion);top.dataset.ecpMotionStyle=value.motionStyle;top.dataset.ecpMotionIntensity=value.motionIntensity;top.dataset.ecpShadow=value.shadow;top.dataset.ecpElementMotion=value.elementMotion;top.setAttribute('aria-label','回答章节');for(const [index,heading]of headings.entries()){const chip=button(doc,(index+1)+' · '+heading.textContent.trim().slice(0,16),'ecp-outline-chip');chip.addEventListener('click',()=>heading.scrollIntoView({behavior:value.motion?'smooth':'auto',block:'start'}));top.append(chip);}
   const gallery=prose.previousElementSibling?.matches?.('.ecp-gallery')?prose.previousElementSibling:null;if(gallery)gallery.insertAdjacentElement('beforebegin',top);else prose.insertAdjacentElement('beforebegin',top);nodes.push(top);
  }

  records.set(prose,{signature,nodes});
 }
 return {sync,clear,dispose(){for(const prose of [...records.keys()])clear(prose);}};
}
