import {VERSION} from '../version.js';
export function statusLabel(s){
 if(s.state==='disabled')return '已加载 · 美化已关闭';
 if(s.state==='waiting'||s.state==='loading')return '已加载 · 等待回复';
 if(s.state==='unmatched')return '已加载 · 未匹配正文';
 if(s.state==='partial')return '部分生效 · '+s.matchedMessages+'/'+s.assistantRows+' 条';
 return '已美化 '+s.matchedMessages+' 条回复';
}
export function diagnosticText(s){
 return JSON.stringify({plugin:'dsh-echocat-prettier',version:VERSION,state:s.state,assistantRows:s.assistantRows,matchedMessages:s.matchedMessages,proseBlocks:s.proseBlocks,adapter:s.adapter},null,2);
}
