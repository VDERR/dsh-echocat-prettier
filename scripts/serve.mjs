import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root = fileURLToPath(new URL('../',import.meta.url));
export function previewServer(port=0) {
  return new Promise(resolveServer=>{
    const server=createServer(async(req,res)=>{
      try {
        const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
        if(pathname==='/'){res.writeHead(302,{Location:'/preview/index.html'});res.end();return;}
        const relative=pathname.replace(/^\//,'');
        // Serve preview only. No source, dependencies or reference snapshot access.
        if(!relative.startsWith('preview/')&&relative!=='lib/client.js') {res.writeHead(404);res.end();return;}
        const p=resolve(root,relative);
        if(!p.startsWith(resolve(root,'preview')+sep)&&p!==resolve(root,'lib/client.js')) {res.writeHead(403);res.end();return;}
        const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
        if(!mime[extname(p)] || !(await stat(p)).isFile()) throw Error('not found');
        res.writeHead(200,{'Content-Type':mime[extname(p)],'Cache-Control':'no-store'});res.end(await readFile(p));
      } catch {res.writeHead(404);res.end();}
    }).listen(port,'127.0.0.1',()=>resolveServer(server));
  });
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const server=await previewServer(Number(process.env.PORT??4173));
  console.log('Offline preview: http://127.0.0.1:'+server.address().port);
}
