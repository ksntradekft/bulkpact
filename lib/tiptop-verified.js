// KSN Trade: ellenőrzött katalógus-előkészítés (2026-09-18).
// A termékek és kiszerelések forrása a megfelelő gyártói kategóriaoldal.
// Sem a gyártói webes ár, sem a bolgár készlet nem a KSN Trade ára/készlete.
const BASE='https://www.tiptopbg.com';
const groups=[
 {id:'petifur',name:'Peti fours és XXL',path:'/category/petufuri',items:[
 ['XXL Cocolina','70 g'],['XXL Vanillina','70 g'],['XXL Marmalina','70 g'],['Peti fours mix','300 g / 400 g / 1 kg / 2 kg'],['Peti fours mini mix','300 g'],
 ...[60,21,18,16,15,12,10,9,2,1].map(n=>['Peti fours Nº '+n,'300 g / 2 kg'])]},
 {id:'keksz',name:'Kekszek',path:'/category/biskviti',items:[
 ['Chiamagos levélkeksz','85 g'],['Kendermagos levélkeksz','85 g'],['Mákos levélkeksz','85 g'],['Luna keksz',null],['Filé keksz',null]]},
 {id:'suti',name:'Sütemények',path:'/category/sladkarski-produkrti',items:[
 ['Whoopie Pie kakaó','65 g'],['Whoopie Pie vanília','65 g'],['Whoopie Pie áfonya','65 g'],['Whoopie Pie matcha','65 g'],['Whoopie Pie red velvet','65 g'],
 ['Mézes sütemény fehér cseppekkel','50 g'],['Mézes sütemény kakaócseppekkel','50 g'],['Angel Hair','70 g'],
 ['Bio Chocolate Chips','200 g'],['Milk Chocolate Chips with Almonds','200 g'],['Dark Chocolate Chips with Hazelnuts','200 g'],
 ['Milk Chocolate Chips','200 g'],['Dark Chocolate Chips','200 g'],['Selene lekváros','300 g / 2 kg'],['Selene fehér szórás','300 g / 2 kg'],['Selene kakaós szórás','300 g / 2 kg']]},
 {id:'pastak',name:'Pásták és falatkák',path:'/category/pastaki',items:[
 ['Pastaki mix','260 g / 500 g'],['Anomalia','100 g / 500 g / 2 kg'],['Zebra','100 g / 500 g / 2 kg'],
 ['Tiramisu','100 g / 500 g / 2 kg','/product/tiramisu-tip-top'],['Mon Amour','100 g / 500 g / 2 kg'],['Vrahaki','100 g / 500 g / 2 kg']]},
 {id:'szirupos',name:'Baklava és szirupos édességek',path:'/category/siropirani-izdeliya',items:[
 ['Mini kadaif','600 g'],['Mini saralia','600 g'],['Szirupos mix','500 g'],['Tulumba','10 × 100 g'],['Kadaif','9 × 100 g'],['Saralia','9 × 100 g'],['Saralia Jotem','1 kg'],['Mini baklava','500 g'],['Mini tulumba','500 g']]},
 {id:'tisztitas',name:'Tisztítószerek',path:'/category/pochistvashti-produkti',items:[
 ['Univerzális padlótisztító, trópusi','1 / 5 l'],['Univerzális padlótisztító, rózsa','1 / 5 l'],['Univerzális padlótisztító, gyümölcsös','1 / 5 l'],
 ['Parketta- és laminálttisztító, méz és tej',null],['Mosogatószer Power, alma',null],['Mosogatószer Power, citrom','1 / 5 l'],
 ['Mosogatószer balzsam, narancs',null],['CheapY mosogatógél, alma','0,5 / 1,5 / 5 l'],['Etanol tisztításhoz, 96%','1 / 5 l'],['Etanol tisztításhoz, 75%','1 / 5 l']]},
 {id:'auto',name:'Autóápolás',path:'/category/avtomobilni-produkti',items:[
 ['Fagyálló koncentrát −60 °C','1 / 5 l'],['Fagyálló, használatra kész −30 °C','1 / 5 l'],['Műszerfalápoló, matt',null],['Műszerfalápoló, fényes',null],
 ['Felnitisztító koncentrát',null],['Felnitisztító, használatra kész',null,'/product/preparat-tip-top-za-pochistvane-na-djanti-gotov-za-upotreba'],
 ['Gumiápoló koncentrát',null],['Gumiápoló, használatra kész',null],['Folyékony viasz','1 / 20 l'],
 ['Aktív hab','1 / 20 l'],['Aktív hab, pink',null],['Aktív hab, green',null,'/product/preparat-za-bezkontaktno-izmivane-tip-top-active-foam-green'],
 ['Aktív hab, blue',null],['Rovareltávolító',null,'/product/preparat-za-pochistvane-na-nasekomi'],
 ['Téli szélvédőmosó −20 °C','1 / 3 / 5 l'],['Téli szélvédőmosó koncentrát −60 °C','1 / 3 / 5 l'],
 ['Nyári szélvédőmosó koncentrát 1:3',null],['Nyári szélvédőmosó koncentrát 1:10',null],['Nyári szélvédőmosó, használatra kész','1 / 3 / 5 l'],['Jégoldó üveghez, tükörhöz, zárhoz',null]]}
];
export const tiptopCategories=groups.map(({id,name,path})=>({id,name,source:BASE+path}));
export const tiptopProducts=groups.flatMap(group=>group.items.map(([name,pack,verifiedPath],index)=>({
 id:group.id+'-'+String(index+1).padStart(2,'0'),name:'Tip Top '+name,pack:pack||null,
 category:group.id,categoryName:group.name,source:BASE+(verifiedPath||group.path),
 hasVerifiedProductPage:!!verifiedPath,priceHuf:null,stock:null,orderEnabled:false,
 // Product photos are not saved to GitHub; the optional image proxy only extracts official og:image.
 photo:verifiedPath?'/api/tiptop-photo?id='+group.id+'-'+String(index+1).padStart(2,'0'):null
})));
