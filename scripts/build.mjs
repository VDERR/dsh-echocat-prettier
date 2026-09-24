import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const rootPath=fileURLToPath(root);
const pathFromRoot=value=>fileURLToPath(new URL(value,root));
process.chdir(rootPath);
await mkdir('lib',{recursive:true});
await mkdir('deliverables',{recursive:true});
await build({absWorkingDir:rootPath,entryPoints:[pathFromRoot('src/plugin/index.js')],outfile:pathFromRoot('lib/index.js'),bundle:true,minify:true,legalComments:'none',platform:'node',format:'esm',target:'node22'});
await build({absWorkingDir:rootPath,entryPoints:[pathFromRoot('src/client/index.jsx')],outfile:pathFromRoot('lib/client.js'),bundle:true,minify:true,legalComments:'none',platform:'browser',format:'cjs',target:'chrome120',loader:{'.css':'text','.png':'dataurl'},external:['react','react/jsx-runtime'],
  banner:{js:'window.__ModuleLoader__.load({id:"dsh-echocat-prettier",factory:(require)=>{var module={exports:{}};var exports=module.exports;'},
  footer:{js:'return module.exports;}});'}});
await build({absWorkingDir:rootPath,entryPoints:[pathFromRoot('preview/main.jsx')],outfile:pathFromRoot('preview/app.js'),bundle:true,platform:'browser',format:'iife',target:'chrome120',loader:{'.css':'text'},minify:true,define:{'process.env.NODE_ENV':'"production"'}});
const html=await readFile('preview/index.html','utf8');
const css=await readFile('preview/preview.css','utf8');
const v226css=await readFile('preview/v226.css','utf8');
const v227css=await readFile('preview/v227.css','utf8');
const v228css=await readFile('preview/v228.css','utf8');
const js=await readFile('preview/app.js','utf8');
const license=await readFile('docs/licenses/react-MIT.txt','utf8');
const hostLicense=await readFile('docs/licenses/deepseek-harness-MIT.txt','utf8');
const plugin=await readFile('lib/client.js','utf8');
const standalone=html.replace('<link rel="stylesheet" href="./preview.css" data-v23-preview>',()=>'<style data-v23-preview>'+css+'</style>')
  .replace('<link rel="stylesheet" href="./v226.css" data-v226-preview>',()=>'<style data-v226-preview>'+v226css+'</style>')
  .replace('<link rel="stylesheet" href="./v227.css" data-v227-preview>',()=>'<style data-v227-preview>'+v227css+'</style>')
  .replace('<link rel="stylesheet" href="./v228.css" data-v228-preview>',()=>'<style data-v228-preview>'+v228css+'</style>')
  .replace('<script src="./app.js"></script>',()=>'<script>'+js.replace(/<\/script/gi,'<\\/script')+'</script>')
  .replace('<script src="../lib/client.js"></script>',()=>'<script>'+plugin.replace(/<\/script/gi,'<\\/script')+'</script>')
  .replace('</head>',()=>'<!-- Offline preview bundles React and React DOM, licensed under MIT.\n'+license+'\nHost CSS fixture (DeepSeek Harness):\n'+hostLicense+'\n--></head>');
await writeFile('deliverables/20260924_GPTEchoCat回复美化插件发布版离线预览_V2.3.4.html',standalone);
console.log('Built V2.3.4 preview and standalone HTML.');
