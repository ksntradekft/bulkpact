import { tiptopProducts } from '../../../lib/tiptop-verified';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const allowedHost = (host) => host === 'tiptopbg.com' || host.endsWith('.tiptopbg.com');
const decode = value => value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
function photoFromHtml(html) {
  // Prefer Product structured data. Never substitute a site logo or a different product image.
  for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data=JSON.parse(m[1]);
      const entries=Array.isArray(data)?data:[data];
      const nodes=entries.flatMap(e=>e?.['@graph']||[e]);
      const product=nodes.find(e=>String(e?.['@type']||'').toLowerCase().includes('product'));
      const image=product?.image;
      const src=typeof image==='string'?image:Array.isArray(image)?image[0]:image?.url;
      if(typeof src==='string' && src.length>0) return decode(src);
    }catch{}
  }
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const property=m[0].match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1];
    const content=m[0].match(/content\s*=\s*["']([^"']+)["']/i)?.[1];
    if (property==='og:image' && content && !/logo|favicon|placeholder/i.test(content)) return decode(content);
  }
  return null;
}
export async function GET(request) {
  const id=new URL(request.url).searchParams.get('id');
  const product=tiptopProducts.find(p=>p.id===id && p.hasVerifiedProductPage);
  if(!product) return new Response('Nincs ellenőrzött termékfotó.',{status:404});
  try {
    const pageUrl=new URL(product.source);
    if(pageUrl.protocol!=='https:'||!allowedHost(pageUrl.hostname)||!pageUrl.pathname.startsWith('/product/')) throw Error('Invalid source');
    const page=await fetch(pageUrl,{signal:AbortSignal.timeout(7000),headers:{'User-Agent':'KSNTradeCatalog/1.0'},next:{revalidate:86400}});
    if(!page.ok||!allowedHost(new URL(page.url).hostname)) throw Error('Product unavailable');
    const html=await page.text();
    const src=photoFromHtml(html);
    if(!src) throw Error('No product image metadata');
    const imageUrl=new URL(src,pageUrl);
    if(imageUrl.protocol!=='https:'||!allowedHost(imageUrl.hostname)) throw Error('Image host not verified');
    const image=await fetch(imageUrl,{signal:AbortSignal.timeout(7000),next:{revalidate:86400}});
    if(!image.ok || !allowedHost(new URL(image.url).hostname)) throw Error('Image unavailable');
    const contentType=image.headers.get('content-type')||'';
    if(!/^image\/(?:jpeg|png|webp|avif)$/i.test(contentType.split(';')[0])) throw Error('Unexpected image format');
    const bytes=await image.arrayBuffer();
    if(bytes.byteLength===0||bytes.byteLength>5_000_000) throw Error('Invalid image size');
    return new Response(bytes,{headers:{'Content-Type':contentType,'Cache-Control':'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400','X-Content-Type-Options':'nosniff'}});
  }catch{return new Response('A gyártói kép nem tölthető be.',{status:404,headers:{'Cache-Control':'no-store'}});}
}
