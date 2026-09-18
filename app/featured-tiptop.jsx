'use client';
import {useState} from 'react';
import {tiptopProducts} from '../lib/tiptop-verified';
const pdfPhotos={'petifur-01':'0% center','petifur-02':'50% center','petifur-03':'100% center'};
const featured=[...tiptopProducts.slice(0,3),...tiptopProducts.filter(p=>p.hasVerifiedProductPage)].slice(0,7);
function Photo({product}) {
 const [fallback,setFallback]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const position=pdfPhotos[product.id];
 if(position)return <div className="tt-photo tt-real"><div role="img" aria-label={product.name+' eredeti csomagolásfotó a gyártói katalógusból'} style={{width:'88%',height:145,backgroundImage:"url('/tiptop/xxl-trio.webp')",backgroundSize:'300% 100%',backgroundPosition:position,backgroundRepeat:'no-repeat'}}/><span>VALÓDI GYÁRTÓI TERMÉKFOTÓ</span></div>;
 const illustration=product.category==='auto'||product.category==='tisztitas'?'/images/salty.svg':'/images/sweet.svg';
 return <div className={'tt-photo '+(!fallback?'tt-real':'tt-illustration')}><img src={!fallback?product.photo:illustration} alt={!fallback?product.name+' – gyártói képhivatkozás':product.categoryName+' – illusztráció, nem termékfotó'} loading="lazy" onLoad={()=>setLoaded(true)} onError={()=>{setFallback(true);setLoaded(false)}}/><span>{!fallback&&loaded?'GYÁRTÓI KÉPFORRÁS':fallback?'ILLUSZTRÁCIÓ':'TERMÉKFOTÓ BETÖLTÉSE'}</span></div>;
}
export default function FeaturedTipTop(){return <div className="tt-items" style={{marginTop:24}}>{featured.map(p=><article className="tt-product" key={p.id}><Photo product={p}/><div className="tt-product-content"><span className="tt-brand">TIP TOP · {p.categoryName}</span><h3>{p.name}</h3><div className="tt-pack">{p.pack?'Kiszerelés: '+p.pack:'Kiszerelés egyeztetés alatt'}</div><div className="tt-bottom"><span className="tt-status">Ár és készlet: egyeztetés alatt</span><a href={p.source} target="_blank" rel="noopener noreferrer">Gyártói termékforrás ↗</a></div></div></article>)}</div>}
