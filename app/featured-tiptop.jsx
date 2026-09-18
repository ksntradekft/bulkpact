'use client';
import {useState} from 'react';
import {tiptopProducts} from '../lib/tiptop-verified';
const featured=tiptopProducts.filter(p=>p.hasVerifiedProductPage);
function Photo({product}) {
 const [fallback,setFallback]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const illustration=product.category==='auto'||product.category==='tisztitas'?'/images/salty.svg':'/images/sweet.svg';
 return <div className={'tt-photo '+(!fallback?'tt-real':'tt-illustration')}><img src={!fallback?product.photo:illustration} alt={!fallback?product.name+' – eredeti gyártói kép':product.categoryName+' – illusztráció, nem termékfotó'} loading="lazy" onLoad={()=>setLoaded(true)} onError={()=>{setFallback(true);setLoaded(false)}}/><span>{!fallback&&loaded?'GYÁRTÓI KÉPFORRÁS':fallback?'ILLUSZTRÁCIÓ':'TERMÉKFOTÓ BETÖLTÉSE'}</span></div>
}
export default function FeaturedTipTop(){return <div className="tt-items" style={{marginTop:24}}>{featured.map(p=><article className="tt-product" key={p.id}><Photo product={p}/><div className="tt-product-content"><span className="tt-brand">TIP TOP · {p.categoryName}</span><h3>{p.name}</h3><div className="tt-pack">{p.pack?'Kiszerelés: '+p.pack:'Kiszerelés egyeztetés alatt'}</div><div className="tt-bottom"><span className="tt-status">Ár és készlet: egyeztetés alatt</span><a href={p.source} target="_blank" rel="noopener noreferrer">Eredeti termékoldal ↗</a></div></div></article>)}</div>}
