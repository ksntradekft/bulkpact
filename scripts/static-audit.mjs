import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const sourceExts=new Set(['.ts','.tsx','.js','.mjs']);
async function walk(dir,out=[]){for(const e of await readdir(dir,{withFileTypes:true})){if(['node_modules','.next','.git'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())await walk(p,out);else out.push(p)}return out}
const files=await walk(root);
const sql=await readFile(path.join(root,'supabase/migrations/202608090001_initial.sql'),'utf8');
const tables=new Set([...sql.matchAll(/create table(?: if not exists)? public\.([a-zA-Z0-9_]+)/gi)].map(m=>m[1]));
const referenced=new Set();
const joins=new Set();
const missingImports=[];
for(const file of files.filter(f=>sourceExts.has(path.extname(f)))){
  const text=await readFile(file,'utf8');
  for(const m of text.matchAll(/service(?:Select|Write)(?:<[^>]+>)?\(\s*[`'\"]([a-zA-Z0-9_]+)/g))if(m[1]!=='rpc')referenced.add(m[1]);
  for(const m of text.matchAll(/!([a-zA-Z0-9_]+_fkey)/g))joins.add(m[1]);
  for(const m of text.matchAll(/(?:from\s+|import\s*\()['\"]([^'\"]+)['\"]/g)){
    const spec=m[1];let base=null;if(spec.startsWith('@/'))base=path.join(root,spec.slice(2));else if(spec.startsWith('.'))base=path.resolve(path.dirname(file),spec);if(!base)continue;
    const candidates=[base,base+'.ts',base+'.tsx',base+'.js',base+'.mjs',path.join(base,'index.ts'),path.join(base,'index.tsx'),path.join(base,'index.js')];let ok=false;for(const c of candidates){try{if((await stat(c)).isFile()){ok=true;break}}catch{}}
    if(!ok)missingImports.push(`${path.relative(root,file)} -> ${spec}`);
  }
}
const missingTables=[...referenced].filter(x=>!tables.has(x));
const missingJoins=[...joins].filter(x=>!sql.includes(x));
const forbidden=['group_order_price_tiers','plh-documents','privatelabelhouse.local'];
const forbiddenHits=[];
for(const file of files){if(path.relative(root,file)==='scripts/static-audit.mjs')continue;if(!['.ts','.tsx','.js','.mjs','.sql','.md','.json'].includes(path.extname(file)))continue;const text=(await readFile(file,'utf8')).toLowerCase();for(const term of forbidden)if(text.includes(term))forbiddenHits.push(`${path.relative(root,file)}: ${term}`)}
if(missingImports.length||missingTables.length||missingJoins.length||forbiddenHits.length){console.error('[static-audit] FAILED');if(missingImports.length)console.error('Missing imports:',missingImports);if(missingTables.length)console.error('Missing tables:',missingTables);if(missingJoins.length)console.error('Missing join constraints:',missingJoins);if(forbiddenHits.length)console.error('Forbidden legacy refs:',forbiddenHits);process.exit(1)}
console.log(`[static-audit] Passed: ${referenced.size} referenced tables, ${joins.size} embedded FK joins, no missing internal imports, no legacy price-tier/storage refs.`);
