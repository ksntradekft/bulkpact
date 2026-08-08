import type { MetadataRoute } from 'next';
export default function robots():MetadataRoute.Robots{
  const base=process.env.NEXT_PUBLIC_SITE_URL||'https://bulkpact.vercel.app';
  return{rules:{userAgent:'*',allow:'/',disallow:['/admin/','/buyer/','/supplier/','/manufacturer/','/api/']},sitemap:`${base}/sitemap.xml`};
}
