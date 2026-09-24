export const ASSISTANT='[data-chat-flow-kind="assistant-step"]';
// Vite: _markdown_uddqf_5. Cordis CSS modules: Xpiw2q_body.
// Match the module-local name, never a hard-coded Markdown hash or substring.
export const moduleClass=(token,local)=>new RegExp('^(?:[A-Za-z_][A-Za-z0-9_-]*_'+local+'|_'+local+'_[A-Za-z0-9]+_[0-9]+)$').test(token);
const classIn=(css,local)=>[...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map(m=>m[1]).find(t=>moduleClass(t,local));
export function discoverAdapter(doc){
 const tag=doc.querySelector('style[data-plugin-css="@deepseek-ai/dsh-client-ui-chat/AssistantMarkdown.module.css"]');
 if(tag){const body=classIn(tag.textContent,'body'),root=classIn(tag.textContent,'root');if(body&&root)return {body,root,revision:'dsh-chat-body-v2',source:'owned-css'};return null;}
 // Verified published pair, used only inside the semantic assistant-step row.
 // This supports extracted/missing inline CSS, without broadening to user/tool
 // Markdown or to arbitrary *_body containers. Unknown wrapper pairs fail closed.
 return {root:'Xpiw2q_root',body:'Xpiw2q_body',revision:'dsh-chat-body-v2',source:'published-0.1.6-alpha.2'};
}
export function proseInRow(row,adapter){
 if(!adapter||!row.matches(ASSISTANT))return [];
 return [...row.querySelectorAll('.'+adapter.root+' > .'+adapter.body+' > div')].filter(el=>
 [...el.classList].some(t=>moduleClass(t,'markdown'))&&!el.hasAttribute('data-markdown-variant')&&el.closest('[data-chat-flow-kind]')===row
 && !el.closest('[data-turn-process-inline],[data-tool],[data-ecp-exclude]'));
}
