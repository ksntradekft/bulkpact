import type { MetadataRoute } from 'next';
export default function sitemap():MetadataRoute.Sitemap{
  const base=process.env.NEXT_PUBLIC_SITE_URL||'https://bulkpact.vercel.app';
  const paths=['','/group-orders','/how-it-works','/pricing','/buyer/register','/supplier/register'];
  return paths.map(path=>({url:`${base}${path}`,lastModified:new Date(),changeFrequency:path===''?'weekly':'monthly',priority:path===''?1:path==='/group-orders'?0.95:0.7}));
}
