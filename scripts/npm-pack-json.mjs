import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';

const [outFile,jsonFile]=process.argv.slice(2);
if(!outFile||!jsonFile)throw new Error('Expected output directory and JSON path.');
const npmCli=process.env.npm_execpath;
if(!npmCli)throw new Error('npm_execpath is unavailable.');
const result=spawnSync(process.execPath,[npmCli,'pack','--json','--ignore-scripts','--pack-destination',outFile],{cwd:process.cwd(),encoding:'utf8',windowsHide:true});
if(result.status!==0)throw new Error(result.stderr||'npm pack failed');
JSON.parse(result.stdout);
writeFileSync(jsonFile,result.stdout,'utf8');
