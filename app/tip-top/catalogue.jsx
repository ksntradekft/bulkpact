'use client';
import {useMemo,useState} from 'react';
import {tiptopCategories,tiptopProducts} from '../../lib/tiptop-verified';
const artFor=id=>id==='auto'||id==='tisztitas'?'/images/salty.svg':id==='keksz'?'/images/biscuits.svg':'/images/sweet.svg';
const pdfSpritePositions={'petifur-01':'0% center','petifur-02':'50% center','petifur-03':'100% center'};
function ProductImage({product}){
 const [failed,setFailed]=useState(false);
 const spritePosition=pdfSpritePositions[product.id];
 if(spritePosition)return <div className="tt-photo tt-real"><div role="img" aria-label={product.name+' – az átadott gyártói katalógus 5. oldalából kinyert valódi csomagolásfotó'} style={{width:'88%',height:145,backgroundImage:"url('/tiptop/xxl-trio.webp')",backgroundSize:'300% 100%',backgroundPosition:spritePosition,backgroundRepeat:'no-repeat'}}/><span>KATALÓGUSBÓL KINYERT TERMÉKFOTÓ</span></div>;
 const real=Boolean(product.photo)&&!failed;
 return <div className={'tt-photo '+(real?'tt-real':'tt-illustration')}>
 <img src={real?product.photo:artFor(product.category)} alt={real?product.name+' – gyártói termékfotó':product.categoryName+' – kategóriaillusztráció (nem termékfotó)'} loading="lazy" onError={()=>setFailed(true)}/>
 <span>{real?'GYÁRTÓI KÉPFORRÁS':'KATEGÓRIAILLUSZTRÁCIÓ'}</span>
 </div>;
}
export default function TipTopCatalogue({compact=false}) {
 const [category,setCategory]=useState('all');const [search,setSearch]=useState('');
 const filtered=useMemo(()=>tiptopProducts.filter(p=>(category==='all'||p.category===category)&&(!search.trim()||(p.name+' '+(p.pack||'')+' '+p.categoryName).toLocaleLowerCase('hu-HU').includes(search.trim().toLocaleLowerCase('hu-HU')))),[category,search]);
 return <div className="tt-catalog">
 <div className="tt-catalog-top"><div><span className="eyebrow">GYÁRTÓI TERMÉKVÁLASZTÉK</span><h2>Tip Top katalógus</h2><p>{tiptopProducts.length} gyártói termékmegnevezés hét kategóriában. Kizárólag tájékoztató bemutató, nem élő készlet.</p></div><div className="tt-count"><b>{filtered.length}</b><span>megjelenített termék</span></div></div>
 <div className="tt-toolbar"><label className="tt-search-label" htmlFor="tt-search">Termékkeresés<input id="tt-search" value={search} onChange={e=>setSearch(e.target.value)} type="search" placeholder="Például Cocolina, baklava, mosogatószer…" autoComplete="off"/></label><div className="tt-filters" aria-label="Termékkategóriák"><button type="button" className={category==='all'?'active':''} onClick={()=>setCategory('all')}>Összes</button>{tiptopCategories.map(c=><button type="button" key={c.id} className={category===c.id?'active':''} onClick={()=>setCategory(c.id)}>{c.name}</button>)}</div></div>
 <div className="tt-items">{filtered.map(p=><article className="tt-product" key={p.id}><ProductImage product={p}/><div className="tt-product-content"><span className="tt-brand">TIP TOP · {p.categoryName}</span><h3>{p.name}</h3><div className="tt-pack">{p.pack?'Kiszerelés: '+p.pack:'Kiszerelés ellenőrzés alatt'}</div><div className="tt-bottom"><span className="tt-status">Ár és készlet: egyeztetés alatt</span><a href={p.source} target="_blank" rel="noopener noreferrer" aria-label={'Gyártói forrás megnyitása: '+p.name}>Gyártói forrás ↗</a></div></div></article>)}</div>
 {filtered.length===0&&<p className="tt-empty">Nincs találat. Próbálj másik kulcsszót vagy kategóriát.</p>}
 <p className="tt-disclaimer">Az XXL termékek fotói a KSN Trade részére átadott DOUBLE D GROUP FOOD LTD gyártói katalógus 5. oldalából származnak. A többi terméknél ellenőrzött gyártói webes képhivatkozás vagy külön jelölt illusztráció jelenik meg. A gyártói árak nem a KSN Trade eladási árai. A magyar termékadatok, KSN árak és készlet ellenőrzéséig nem rendelhetők.</p>
 {!compact&&<div className="tt-maker"><strong>Teljes gyártói választék és műszaki termékadatok</strong><a href="https://www.tiptopbg.com/" rel="noopener noreferrer" target="_blank">Tip Top hivatalos weboldal ↗</a></div>}
 </div>;
}
